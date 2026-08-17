"""Build the Word version of the PRD.

    python3 docs/build-word.py

The approved 1 August file is the design reference, but it is a Word document,
not a pandoc one: it has no `Table`, `ImageCaption` or `BlockText` style, because
its look was applied by hand. Pandoc can only carry design across by style name,
so tables, captions and notes came out plain.

This script therefore takes a copy of that file, defines the styles pandoc
actually uses so they match the approved look, and builds with that. The
original file is never touched.

It then fixes what pandoc leaves behind:

  1. Table header rows repeat on every page. Removed: a heading row appearing
     again after a page break reads as a new table starting.
  2. Table rows split across a page break. Stopped, so a row stays whole.
  3. Headings stranded at the foot of a page. Kept with the text beneath them.
  4. The document title and subtitle arrive as ordinary headings. Promoted, so
     they get the large centred title and the gold subtitle.
  5. The reference file's own images stay in the package as orphans, which
     doubled the file size. Anything unreferenced is dropped.

It also checks that no image is taller than the page, which is what cut the flow
diagram in half.
"""
import os, re, shutil, subprocess, zipfile

DOCS = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(DOCS, 'PRD - Website Builder.md')
REF = os.path.join(DOCS, 'PRD - Website Builder.docx')
STYLED_REF = os.path.join(DOCS, '.reference-styled.docx')
OUT = os.path.join(DOCS, 'PRD - Website Builder (2026-08-17).docx')
EMU = 914400.0

NAVY, GOLD, MUTED, LINE, GROUND = '0D1E35', 'C4830A', '5A7A9B', 'DDE5EF', 'F0F4F8'
CALLOUT_BG, CALLOUT_BAR, INK = 'EAF2FB', '1D4ED8', '1A2433'
MAJOR = '<w:rFonts w:asciiTheme="majorHAnsi" w:hAnsiTheme="majorHAnsi" w:cstheme="majorBidi"/>'
MINOR = '<w:rFonts w:asciiTheme="minorHAnsi" w:hAnsiTheme="minorHAnsi" w:cstheme="minorBidi"/>'


def heading(sid, size, before, after=120):
    return (f'<w:style w:type="paragraph" w:styleId="{sid}">'
            f'<w:name w:val="heading {sid[-1]}"/><w:basedOn w:val="Normal"/><w:qFormat/>'
            f'<w:pPr><w:keepNext/><w:keepLines/><w:spacing w:before="{before}" w:after="{after}"/>'
            f'<w:outlineLvl w:val="{int(sid[-1]) - 1}"/></w:pPr>'
            f'<w:rPr>{MAJOR}<w:b/><w:color w:val="{NAVY}"/>'
            f'<w:sz w:val="{size}"/><w:szCs w:val="{size}"/></w:rPr></w:style>')


STYLES = {
    # The cover lines: large centred title, gold subtitle, no theme-blue rule.
    'Title': f'<w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/>'
             f'<w:basedOn w:val="Normal"/><w:qFormat/>'
             f'<w:pPr><w:spacing w:before="240" w:after="60"/><w:jc w:val="center"/></w:pPr>'
             f'<w:rPr>{MAJOR}<w:b/><w:color w:val="{NAVY}"/><w:sz w:val="60"/><w:szCs w:val="60"/></w:rPr></w:style>',
    'Subtitle': f'<w:style w:type="paragraph" w:styleId="Subtitle"><w:name w:val="Subtitle"/>'
                f'<w:basedOn w:val="Normal"/><w:qFormat/>'
                f'<w:pPr><w:spacing w:before="0" w:after="360"/><w:jc w:val="center"/></w:pPr>'
                f'<w:rPr>{MAJOR}<w:b/><w:color w:val="{GOLD}"/><w:sz w:val="30"/><w:szCs w:val="30"/></w:rPr></w:style>',
    'Heading1': heading('Heading1', 40, 480, 160),
    'Heading2': heading('Heading2', 30, 400, 140),
    'Heading3': heading('Heading3', 25, 340, 120),
    'Heading4': heading('Heading4', 22, 300, 100),
    'Heading5': heading('Heading5', 21, 280, 100),
    # A caption sits under its picture, centred and quiet.
    'ImageCaption': f'<w:style w:type="paragraph" w:styleId="ImageCaption"><w:name w:val="Image Caption"/>'
                    f'<w:basedOn w:val="Normal"/><w:qFormat/>'
                    f'<w:pPr><w:spacing w:before="60" w:after="280"/><w:jc w:val="center"/></w:pPr>'
                    f'<w:rPr>{MINOR}<w:i/><w:color w:val="{MUTED}"/><w:sz w:val="19"/><w:szCs w:val="19"/></w:rPr></w:style>',
    'CaptionedFigure': '<w:style w:type="paragraph" w:styleId="CaptionedFigure">'
                       '<w:name w:val="Captioned Figure"/><w:basedOn w:val="Normal"/><w:qFormat/>'
                       '<w:pPr><w:keepNext/><w:spacing w:before="240" w:after="0"/><w:jc w:val="center"/></w:pPr></w:style>',
    'Figure': '<w:style w:type="paragraph" w:styleId="Figure"><w:name w:val="Figure"/>'
              '<w:basedOn w:val="Normal"/><w:qFormat/>'
              '<w:pPr><w:keepNext/><w:spacing w:before="240" w:after="0"/><w:jc w:val="center"/></w:pPr></w:style>',
    # Every note in the document is a blockquote. This is the callout box.
    'BlockText': f'<w:style w:type="paragraph" w:styleId="BlockText"><w:name w:val="Block Text"/>'
                 f'<w:basedOn w:val="Normal"/><w:qFormat/>'
                 f'<w:pPr><w:pBdr><w:left w:val="single" w:sz="18" w:space="10" w:color="{CALLOUT_BAR}"/></w:pBdr>'
                 f'<w:shd w:val="clear" w:fill="{CALLOUT_BG}"/>'
                 f'<w:spacing w:before="200" w:after="200"/><w:ind w:left="230" w:right="170"/></w:pPr>'
                 f'<w:rPr>{MINOR}<w:color w:val="{INK}"/></w:rPr></w:style>',
    'VerbatimChar': f'<w:style w:type="character" w:styleId="VerbatimChar"><w:name w:val="Verbatim Char"/>'
                    f'<w:basedOn w:val="DefaultParagraphFont"/><w:qFormat/>'
                    f'<w:rPr><w:rFonts w:ascii="Consolas" w:hAnsi="Consolas"/>'
                    f'<w:shd w:val="clear" w:fill="{GROUND}"/><w:color w:val="{NAVY}"/>'
                    f'<w:sz w:val="19"/><w:szCs w:val="19"/></w:rPr></w:style>',
    'SourceCode': f'<w:style w:type="paragraph" w:styleId="SourceCode"><w:name w:val="Source Code"/>'
                  f'<w:basedOn w:val="Normal"/><w:qFormat/>'
                  f'<w:pPr><w:shd w:val="clear" w:fill="{GROUND}"/>'
                  f'<w:pBdr><w:top w:val="single" w:sz="4" w:space="6" w:color="{LINE}"/>'
                  f'<w:left w:val="single" w:sz="4" w:space="6" w:color="{LINE}"/>'
                  f'<w:bottom w:val="single" w:sz="4" w:space="6" w:color="{LINE}"/>'
                  f'<w:right w:val="single" w:sz="4" w:space="6" w:color="{LINE}"/></w:pBdr>'
                  f'<w:spacing w:before="160" w:after="200" w:line="240" w:lineRule="auto"/>'
                  f'<w:ind w:left="120" w:right="120"/></w:pPr>'
                  f'<w:rPr><w:rFonts w:ascii="Consolas" w:hAnsi="Consolas"/><w:color w:val="{NAVY}"/>'
                  f'<w:sz w:val="18"/><w:szCs w:val="18"/></w:rPr></w:style>',
    # Shaded header row with a gold rule under it, thin lines elsewhere.
    'Table': f'<w:style w:type="table" w:styleId="Table"><w:name w:val="Table"/>'
             f'<w:basedOn w:val="TableNormal"/><w:qFormat/>'
             f'<w:pPr><w:spacing w:before="30" w:after="30" w:line="252" w:lineRule="auto"/></w:pPr>'
             f'<w:rPr>{MINOR}<w:sz w:val="20"/><w:szCs w:val="20"/></w:rPr>'
             f'<w:tblPr><w:tblBorders>'
             f'<w:top w:val="single" w:sz="4" w:color="{LINE}"/><w:left w:val="none" w:sz="0" w:color="auto"/>'
             f'<w:bottom w:val="single" w:sz="4" w:color="{LINE}"/><w:right w:val="none" w:sz="0" w:color="auto"/>'
             f'<w:insideH w:val="single" w:sz="4" w:color="{LINE}"/>'
             f'<w:insideV w:val="single" w:sz="4" w:color="{LINE}"/></w:tblBorders>'
             f'<w:tblCellMar><w:top w:w="60" w:type="dxa"/><w:left w:w="110" w:type="dxa"/>'
             f'<w:bottom w:w="60" w:type="dxa"/><w:right w:w="110" w:type="dxa"/></w:tblCellMar></w:tblPr>'
             f'<w:tblStylePr w:type="firstRow">'
             f'<w:rPr>{MINOR}<w:b/><w:color w:val="{NAVY}"/></w:rPr>'
             f'<w:tcPr><w:shd w:val="clear" w:fill="{GROUND}"/>'
             f'<w:tcBorders><w:bottom w:val="single" w:sz="12" w:color="{GOLD}"/></w:tcBorders>'
             f'</w:tcPr></w:tblStylePr></w:style>',
}


def build_reference():
    """A copy of the approved file, carrying the styles pandoc needs."""
    with zipfile.ZipFile(REF) as z:
        parts = {n: z.read(n) for n in z.namelist()}
    xml = parts['word/styles.xml'].decode('utf-8')
    added, replaced = [], []
    for sid, block in STYLES.items():
        pat = re.compile(r'<w:style [^>]*w:styleId="%s"[^>]*>.*?</w:style>' % sid, re.S)
        if pat.search(xml):
            xml = pat.sub(block, xml)
            replaced.append(sid)
        else:
            xml = xml.replace('</w:styles>', block + '</w:styles>')
            added.append(sid)
    parts['word/styles.xml'] = xml.encode('utf-8')
    with zipfile.ZipFile(STYLED_REF, 'w', zipfile.ZIP_DEFLATED) as z:
        for name, data in parts.items():
            z.writestr(name, data)
    print('styles replaced:', ', '.join(replaced) or 'none')
    print('styles added   :', ', '.join(added) or 'none')


build_reference()
subprocess.run(['pandoc', SRC, '-o', OUT, '--reference-doc', STYLED_REF,
                '--resource-path', DOCS], check=True)
os.remove(STYLED_REF)

with zipfile.ZipFile(OUT) as z:
    parts = {n: z.read(n) for n in z.namelist()}
doc = parts['word/document.xml'].decode('utf-8')

# 4. The first two headings are the document's title and subtitle.
for was, now in (('Heading1', 'Title'), ('Heading2', 'Subtitle')):
    doc = doc.replace('<w:pStyle w:val="%s" />' % was, '<w:pStyle w:val="%s" />' % now, 1)

# 1 + 2. Table behaviour across page breaks. pandoc writes the attribute form,
# <w:tblHeader w:val="on" />, so match that too.
repeats = len(re.findall(r'<w:tblHeader[^>]*>', doc))
doc = re.sub(r'<w:tblHeader[^>]*>', '', doc)
doc = doc.replace('<w:trPr>', '<w:trPr><w:cantSplit/>')
doc = re.sub(r'<w:tr(\s[^>]*)?>(?!<w:trPr>)', lambda m: m.group(0) + '<w:trPr><w:cantSplit/></w:trPr>', doc)

# 3. A heading must never be left alone at the foot of a page.
kept = 0
def keep_with_next(m):
    global kept
    block = m.group(0)
    if 'w:val="Heading' not in block or '<w:keepNext/>' in block:
        return block
    kept += 1
    return block.replace('<w:pPr>', '<w:pPr><w:keepNext/>', 1)
doc = re.sub(r'<w:pPr>.*?</w:pPr>', keep_with_next, doc, flags=re.S)

# Page geometry, so an oversized image is caught here rather than in Word.
pg = re.search(r'<w:pgSz[^>]*>', doc)
mar = re.search(r'<w:pgMar[^>]*>', doc)
if pg and mar:
    def attr(tag, name):
        m = re.search(r'w:%s="(\d+)"' % name, tag)
        return int(m.group(1)) if m else 0
    height = (attr(pg.group(0), 'h') - attr(mar.group(0), 'top') - attr(mar.group(0), 'bottom')) / 1440.0
    tall = [round(int(cy) / EMU, 2) for _, cy in re.findall(r'<wp:extent cx="(\d+)" cy="(\d+)"', doc)]
    print('usable page height: %.2f in' % height)
    print('images over that height:', [h for h in tall if h > height] or 'none')

parts['word/document.xml'] = doc.encode('utf-8')

# 5. Drop media the document no longer points at. The reference file's own
# images arrive with their relationships intact, so the relationship list is not
# evidence of use: only an r:embed inside the body is.
rels = parts['word/_rels/document.xml.rels'].decode('utf-8')
live = set(re.findall(r'r:embed="([^"]+)"', doc)) | set(re.findall(r'r:id="([^"]+)"', doc))
targets = dict(re.findall(r'Id="([^"]+)"[^>]*Target="(media/[^"]+)"', rels))
used = {'word/' + t for i, t in targets.items() if i in live}
dropped = [n for n in parts if n.startswith('word/media/') and n not in used]
for n in dropped:
    del parts[n]
for i in targets:
    if i not in live:
        rels = re.sub(r'<Relationship Id="%s"[^>]*/>' % re.escape(i), '', rels)
parts['word/_rels/document.xml.rels'] = rels.encode('utf-8')

tmp = OUT + '.tmp'
with zipfile.ZipFile(tmp, 'w', zipfile.ZIP_DEFLATED) as z:
    for name, data in parts.items():
        z.writestr(name, data)
shutil.move(tmp, OUT)

print('header-row repeats removed:', repeats)
print('headings kept with their text:', kept)
print('orphan images dropped:', len(dropped))
print('written:', OUT, '%.1f MB' % (os.path.getsize(OUT) / 1e6))
