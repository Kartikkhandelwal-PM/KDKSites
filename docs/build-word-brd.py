"""Build the Word version of the BRD.

    python3 docs/build-word-brd.py

Reuses the same approach as build-word.py (the PRD's Word builder): takes the
already-approved 1 August PRD .docx as the design reference, defines the
styles pandoc actually uses so they match that approved look, and builds with
that. The original PRD .docx is never touched.

It then fixes what pandoc leaves behind, same as the PRD script:

  1. Table header rows repeat on every page. Removed.
  2. Table rows split across a page break. Stopped.
  3. Headings stranded at the foot of a page. Kept with the text beneath them.
  4. The document title and subtitle arrive as ordinary headings. Promoted.
  5. The reference file's own images stay in the package as orphans. Dropped.

It also checks that no image is taller than the page, and prints the mermaid
flow diagram's own ratio check for reference.
"""
import os, re, shutil, subprocess, zipfile

DOCS = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(DOCS, 'BRD - Website Builder.md')
REF = os.path.join(DOCS, 'PRD - Website Builder.docx')
STYLED_REF = os.path.join(DOCS, '.reference-styled-brd.docx')
OUT = os.path.join(DOCS, 'BRD - Website Builder (2026-08-17).docx')
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
             f'<w:rPr>{MINOR}<w:b/><w:color w:val="FFFFFF"/></w:rPr>'
             f'<w:tcPr><w:shd w:val="clear" w:fill="{NAVY}"/>'
             f'<w:tcBorders><w:bottom w:val="single" w:sz="12" w:color="{GOLD}"/></w:tcBorders>'
             f'</w:tcPr></w:tblStylePr></w:style>',
}


def build_reference():
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

for was, now in (('Heading1', 'Title'), ('Heading2', 'Subtitle')):
    doc = doc.replace('<w:pStyle w:val="%s" />' % was, '<w:pStyle w:val="%s" />' % now, 1)

# The Table style's conditional firstRow formatting (the navy header) is a
# style-level rule, and Google Docs does not honour Word's conditional table
# formatting on import, even though Word does. Baking the shading and the
# white bold text directly onto the header row's cells and runs, rather than
# relying on the style, makes it render the same in every viewer.
#
# Must run BEFORE the <w:tblHeader> marker below is stripped, and must key
# off that marker rather than "the first row of every table": the metadata
# table at the top of the document (Product / Owner / Version / ...) has a
# blank markdown header row, which pandoc drops rather than emitting, so its
# first real row is "Product | ...", not a header, and must not be coloured.
def color_cell(m):
    cell = m.group(0)
    if re.search(r'<w:tcPr\s*/>', cell):
        cell = re.sub(r'<w:tcPr\s*/>', f'<w:tcPr><w:shd w:val="clear" w:fill="{NAVY}"/></w:tcPr>', cell, count=1)
    elif '<w:tcPr>' in cell:
        if '<w:shd' in cell:
            cell = re.sub(r'<w:shd[^/]*/>', f'<w:shd w:val="clear" w:fill="{NAVY}"/>', cell, count=1)
        else:
            cell = cell.replace('</w:tcPr>', f'<w:shd w:val="clear" w:fill="{NAVY}"/></w:tcPr>', 1)
    else:
        cell = re.sub(r'^(<w:tc[^>]*>)', r'\1<w:tcPr><w:shd w:val="clear" w:fill="%s"/></w:tcPr>' % NAVY, cell, count=1)

    def color_run(rm):
        r = rm.group(0)
        if '<w:rPr>' in r:
            def fix_rpr(pm):
                rpr = re.sub(r'<w:color[^/]*/>', '', pm.group(0))
                if '<w:b/>' not in rpr and '<w:b ' not in rpr:
                    rpr = rpr.replace('<w:rPr>', '<w:rPr><w:b/>', 1)
                return rpr.replace('</w:rPr>', '<w:color w:val="FFFFFF"/></w:rPr>', 1)
            r = re.sub(r'<w:rPr>.*?</w:rPr>', fix_rpr, r, count=1, flags=re.S)
        else:
            r = re.sub(r'^(<w:r[^>]*>)', r'\1<w:rPr><w:b/><w:color w:val="FFFFFF"/></w:rPr>', r, count=1)
        return r
    return re.sub(r'<w:r\b.*?</w:r>', color_run, cell, flags=re.S)

header_rows = 0
def color_if_header(m):
    global header_rows
    row = m.group(0)
    if '<w:tblHeader' not in row:
        return row
    header_rows += 1
    return re.sub(r'<w:tc\b.*?</w:tc>', color_cell, row, flags=re.S)
doc = re.sub(r'<w:tr\b.*?</w:tr>', color_if_header, doc, flags=re.S)

repeats = len(re.findall(r'<w:tblHeader[^>]*>', doc))
doc = re.sub(r'<w:tblHeader[^>]*>', '', doc)

# Pandoc writes every table with tblLook firstRow="0", which tells Word to
# ignore the firstRow conditional formatting the Table style defines, no
# matter how that style is written. The navy header only renders once this
# flag (both the named attribute and the val bitmask, bit 0x0020) is on.
tblook_fixed = len(re.findall(r'<w:tblLook\b[^>]*w:firstRow="0"', doc))
doc = re.sub(
    r'<w:tblLook\b[^>]*/>',
    '<w:tblLook w:firstRow="1" w:lastRow="0" w:firstColumn="0" '
    'w:lastColumn="0" w:noHBand="0" w:noVBand="0" w:val="0020" />',
    doc)
doc = doc.replace('<w:trPr>', '<w:trPr><w:cantSplit/>')
doc = re.sub(r'<w:tr(\s[^>]*)?>(?!<w:trPr>)', lambda m: m.group(0) + '<w:trPr><w:cantSplit/></w:trPr>', doc)

kept = 0
def keep_with_next(m):
    global kept
    block = m.group(0)
    if 'w:val="Heading' not in block or '<w:keepNext/>' in block:
        return block
    kept += 1
    return block.replace('<w:pPr>', '<w:pPr><w:keepNext/>', 1)
doc = re.sub(r'<w:pPr>.*?</w:pPr>', keep_with_next, doc, flags=re.S)

pg = re.search(r'<w:pgSz[^>]*>', doc)
mar = re.search(r'<w:pgMar[^>]*>', doc)
if pg and mar:
    def attr(tag, name):
        m = re.search(r'w:%s="(\d+)"' % name, tag)
        return int(m.group(1)) if m else 0
    height = (attr(pg.group(0), 'h') - attr(mar.group(0), 'top') - attr(mar.group(0), 'bottom')) / 1440.0
    width = (attr(pg.group(0), 'w') - attr(mar.group(0), 'left') - attr(mar.group(0), 'right')) / 1440.0
    tall = [round(int(cy) / EMU, 2) for _, cy in re.findall(r'<wp:extent cx="(\d+)" cy="(\d+)"', doc)]
    print('usable page: %.2f in wide, %.2f in tall' % (width, height))
    print('images over that height:', [h for h in tall if h > height] or 'none')

parts['word/document.xml'] = doc.encode('utf-8')

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

print('header rows coloured directly:', header_rows)
print('header-row repeats removed:', repeats)
print('headings kept with their text:', kept)
print('orphan images dropped:', len(dropped))
print('written:', OUT, '%.1f MB' % (os.path.getsize(OUT) / 1e6))
