"""Build a Word reference template for the KDK PRD.

Starts from pandoc's own default reference.docx and restyles it: KDK's navy and
gold, Segoe UI, bordered tables with a shaded header row, centred figures with
captions under them, and a page number in the footer.
"""
import re, shutil, zipfile, os

SRC, OUT, WORK = 'ref-default.docx', 'reference-kdk.docx', 'ref'

NAVY, GOLD, INK, MUTED, LINE, GROUND = '0D1E35', 'C4830A', '1A2433', '5A7A9B', 'DDE5EF', 'F0F4F8'
FONT = 'Segoe UI'
W = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"'


def fonts(name=FONT):
    return f'<w:rFonts w:ascii="{name}" w:hAnsi="{name}" w:cs="{name}"/>'


def style(sid, name, kind='paragraph', based='Normal', ppr='', rpr='', extra=''):
    b = f'<w:basedOn w:val="{based}"/>' if based else ''
    return (f'<w:style w:type="{kind}" w:customStyle="0" w:styleId="{sid}">'
            f'<w:name w:val="{name}"/>{b}<w:qFormat/>'
            f'{f"<w:pPr>{ppr}</w:pPr>" if ppr else ""}'
            f'{f"<w:rPr>{rpr}</w:rPr>" if rpr else ""}{extra}</w:style>')


def heading(sid, name, size_half, color=NAVY, before=320, after=120, rule=False, caps=False):
    bdr = f'<w:pBdr><w:bottom w:val="single" w:sz="6" w:space="6" w:color="{GOLD}"/></w:pBdr>' if rule else ''
    return style(sid, name,
                 ppr=f'<w:keepNext/><w:keepLines/><w:spacing w:before="{before}" w:after="{after}"/>{bdr}',
                 rpr=f'{fonts()}<w:b/>{"<w:caps/>" if caps else ""}<w:color w:val="{color}"/>'
                     f'<w:sz w:val="{size_half}"/><w:szCs w:val="{size_half}"/>')


REPLACEMENTS = {
    'Normal': style('Normal', 'Normal', based=None,
                    ppr=f'<w:spacing w:before="0" w:after="140" w:line="276" w:lineRule="auto"/>',
                    rpr=f'{fonts()}<w:color w:val="{INK}"/><w:sz w:val="21"/><w:szCs w:val="21"/>'),
    'Heading1': heading('Heading1', 'heading 1', 34, before=420, after=180, rule=True),
    'Heading2': heading('Heading2', 'heading 2', 28, before=360, after=140),
    'Heading3': heading('Heading3', 'heading 3', 24, before=300, after=110),
    'Heading4': heading('Heading4', 'heading 4', 22, before=260, after=100),
    'Heading5': heading('Heading5', 'heading 5', 19, color=MUTED, before=240, after=90, caps=True),
    'Heading6': heading('Heading6', 'heading 6', 19, color=MUTED, before=220, after=80),
    'Figure': style('Figure', 'Figure',
                    ppr='<w:keepNext/><w:jc w:val="center"/><w:spacing w:before="220" w:after="60"/>'),
    'CaptionedFigure': style('CaptionedFigure', 'Captioned Figure',
                             ppr='<w:keepNext/><w:jc w:val="center"/><w:spacing w:before="220" w:after="60"/>'),
    'ImageCaption': style('ImageCaption', 'Image Caption',
                          ppr='<w:jc w:val="center"/><w:spacing w:before="0" w:after="260"/>',
                          rpr=f'{fonts()}<w:i/><w:color w:val="{MUTED}"/><w:sz w:val="17"/><w:szCs w:val="17"/>'),
    'BlockText': style('BlockText', 'Block Text',
                       ppr=f'<w:pBdr><w:left w:val="single" w:sz="18" w:space="10" w:color="{GOLD}"/></w:pBdr>'
                           f'<w:shd w:val="clear" w:fill="{GROUND}"/>'
                           f'<w:spacing w:before="160" w:after="160"/><w:ind w:left="240" w:right="180"/>',
                       rpr=f'{fonts()}<w:color w:val="{INK}"/><w:sz w:val="20"/><w:szCs w:val="20"/>'),
    'VerbatimChar': style('VerbatimChar', 'Verbatim Char', kind='character', based='DefaultParagraphFont',
                          rpr=f'{fonts("Consolas")}<w:shd w:val="clear" w:fill="{GROUND}"/>'
                              f'<w:color w:val="{NAVY}"/><w:sz w:val="18"/><w:szCs w:val="18"/>'),
}

NEW_STYLES = [
    style('SourceCode', 'Source Code',
          ppr=f'<w:pBdr><w:top w:val="single" w:sz="4" w:space="6" w:color="{LINE}"/>'
              f'<w:left w:val="single" w:sz="4" w:space="6" w:color="{LINE}"/>'
              f'<w:bottom w:val="single" w:sz="4" w:space="6" w:color="{LINE}"/>'
              f'<w:right w:val="single" w:sz="4" w:space="6" w:color="{LINE}"/></w:pBdr>'
              f'<w:shd w:val="clear" w:fill="{GROUND}"/>'
              f'<w:spacing w:before="140" w:after="180" w:line="240" w:lineRule="auto"/>'
              f'<w:ind w:left="120" w:right="120"/>',
          rpr=f'{fonts("Consolas")}<w:color w:val="{NAVY}"/><w:sz w:val="17"/><w:szCs w:val="17"/>'),
]

# Table: real borders, a shaded header row, and breathing room in every cell.
TABLE_STYLE = (
    '<w:style w:type="table" w:styleId="Table">'
    '<w:name w:val="Table"/><w:basedOn w:val="TableNormal"/><w:qFormat/>'
    f'<w:pPr><w:spacing w:before="40" w:after="40" w:line="252" w:lineRule="auto"/></w:pPr>'
    f'<w:rPr>{fonts()}<w:color w:val="{INK}"/><w:sz w:val="19"/><w:szCs w:val="19"/></w:rPr>'
    '<w:tblPr><w:tblBorders>'
    f'<w:top w:val="single" w:sz="4" w:color="{LINE}"/><w:left w:val="single" w:sz="4" w:color="{LINE}"/>'
    f'<w:bottom w:val="single" w:sz="4" w:color="{LINE}"/><w:right w:val="single" w:sz="4" w:color="{LINE}"/>'
    f'<w:insideH w:val="single" w:sz="4" w:color="{LINE}"/><w:insideV w:val="single" w:sz="4" w:color="{LINE}"/>'
    '</w:tblBorders>'
    '<w:tblCellMar><w:top w:w="72" w:type="dxa"/><w:left w:w="108" w:type="dxa"/>'
    '<w:bottom w:w="72" w:type="dxa"/><w:right w:w="108" w:type="dxa"/></w:tblCellMar></w:tblPr>'
    '<w:tblStylePr w:type="firstRow">'
    f'<w:rPr>{fonts()}<w:b/><w:color w:val="{NAVY}"/></w:rPr>'
    f'<w:tcPr><w:shd w:val="clear" w:fill="{GROUND}"/></w:tcPr></w:tblStylePr>'
    '</w:style>'
)

FOOTER = (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
    f'<w:ftr {W} xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
    '<w:p><w:pPr><w:jc w:val="center"/></w:pPr>'
    f'<w:r><w:rPr>{fonts()}<w:color w:val="{MUTED}"/><w:sz w:val="16"/></w:rPr>'
    '<w:t xml:space="preserve">KDK Sites: Personalised Website Builder  ·  Product Requirements Document  ·  page </w:t></w:r>'
    f'<w:r><w:rPr>{fonts()}<w:color w:val="{MUTED}"/><w:sz w:val="16"/></w:rPr><w:fldChar w:fldCharType="begin"/></w:r>'
    f'<w:r><w:rPr>{fonts()}<w:color w:val="{MUTED}"/><w:sz w:val="16"/></w:rPr>'
    '<w:instrText xml:space="preserve"> PAGE </w:instrText></w:r>'
    f'<w:r><w:rPr>{fonts()}<w:color w:val="{MUTED}"/><w:sz w:val="16"/></w:rPr><w:fldChar w:fldCharType="separate"/></w:r>'
    f'<w:r><w:rPr>{fonts()}<w:color w:val="{MUTED}"/><w:sz w:val="16"/></w:rPr><w:t>1</w:t></w:r>'
    f'<w:r><w:rPr>{fonts()}<w:color w:val="{MUTED}"/><w:sz w:val="16"/></w:rPr><w:fldChar w:fldCharType="end"/></w:r>'
    '</w:p></w:ftr>'
)


def patch_styles(xml):
    for sid, block in REPLACEMENTS.items():
        pat = re.compile(r'<w:style [^>]*w:styleId="' + sid + r'"[^>]*>.*?</w:style>', re.S)
        xml, n = pat.subn(block, xml)
        if not n:
            raise SystemExit('style not found: ' + sid)
    pat = re.compile(r'<w:style w:type="table"[^>]*w:styleId="Table"[^>]*>.*?</w:style>', re.S)
    xml, n = pat.subn(TABLE_STYLE, xml)
    if not n:
        raise SystemExit('Table style not found')
    # document-wide defaults, so anything unstyled still picks up the right face
    xml = re.sub(r'<w:rPrDefault>.*?</w:rPrDefault>',
                 f'<w:rPrDefault><w:rPr>{fonts()}<w:color w:val="{INK}"/>'
                 f'<w:sz w:val="21"/><w:szCs w:val="21"/></w:rPr></w:rPrDefault>', xml, flags=re.S)
    return xml.replace('</w:styles>', ''.join(NEW_STYLES) + '</w:styles>')


def patch_document(xml):
    # A4 with comfortable margins, and the footer wired in.
    sect = re.search(r'<w:sectPr[^>]*>(.*?)</w:sectPr>', xml, re.S)
    if not sect:
        raise SystemExit('no sectPr')
    body = ('<w:footerReference w:type="default" r:id="rIdFooterKdk"/>'
            '<w:pgSz w:w="11906" w:h="16838"/>'
            '<w:pgMar w:top="1247" w:right="1191" w:bottom="1247" w:left="1191" '
            'w:header="708" w:footer="708" w:gutter="0"/>'
            '<w:cols w:space="708"/><w:docGrid w:linePitch="360"/>')
    return xml[:sect.start()] + '<w:sectPr>' + body + '</w:sectPr>' + xml[sect.end():]


shutil.rmtree(WORK, ignore_errors=True)
with zipfile.ZipFile(SRC) as z:
    z.extractall(WORK)

# Read fully, then write. Opening for write first would truncate the file
# before its own content had been read.
p = os.path.join(WORK, 'word', 'styles.xml')
patched = patch_styles(open(p).read())
open(p, 'w').write(patched)

p = os.path.join(WORK, 'word', 'document.xml')
patched = patch_document(open(p).read())
open(p, 'w').write(patched)

open(os.path.join(WORK, 'word', 'footer1.xml'), 'w').write(FOOTER)

p = os.path.join(WORK, 'word', '_rels', 'document.xml.rels')
rels = open(p).read()
rels = rels.replace('</Relationships>',
    '<Relationship Id="rIdFooterKdk" '
    'Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" '
    'Target="footer1.xml"/></Relationships>')
open(p, 'w').write(rels)

p = os.path.join(WORK, '[Content_Types].xml')
ct = open(p).read()
ct = ct.replace('</Types>',
    '<Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-'
    'officedocument.wordprocessingml.footer+xml"/></Types>')
open(p, 'w').write(ct)

if os.path.exists(OUT):
    os.remove(OUT)
with zipfile.ZipFile(OUT, 'w', zipfile.ZIP_DEFLATED) as z:
    for root, _, files in os.walk(WORK):
        for f in files:
            full = os.path.join(root, f)
            z.write(full, os.path.relpath(full, WORK))
print('wrote', OUT)
