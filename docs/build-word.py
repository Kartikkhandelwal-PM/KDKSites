"""Build the Word version of the PRD.

    python3 docs/build-word.py

Runs pandoc with the previous Word file as the style reference, so the document
keeps the design already approved, then fixes three things pandoc leaves behind:

  1. Table header rows repeat on every page. Removed, because a heading row
     appearing again after a page break reads as a new table starting.
  2. Table rows split across a page break. Stopped, so a row stays whole.
  3. The reference file's own images stay in the package as orphans, which
     doubled the file size. Anything not referenced is dropped.

It also checks that no image is taller than the page, which is what cut the flow
diagram in half in the first place.
"""
import os, re, shutil, subprocess, sys, zipfile

DOCS = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(DOCS, 'PRD - Website Builder.md')
REF = os.path.join(DOCS, 'PRD - Website Builder.docx')
OUT = os.path.join(DOCS, 'PRD - Website Builder (2026-08-17).docx')
EMU = 914400.0

subprocess.run(['pandoc', SRC, '-o', OUT, '--reference-doc', REF,
                '--toc', '--toc-depth=3', '--resource-path', DOCS], check=True)

tmp = OUT + '.tmp'
with zipfile.ZipFile(OUT) as z:
    parts = {n: z.read(n) for n in z.namelist()}

doc = parts['word/document.xml'].decode('utf-8')

# 1 + 2. Table behaviour across page breaks.
repeats = doc.count('<w:tblHeader/>') + doc.count('<w:tblHeader />')
doc = doc.replace('<w:tblHeader/>', '').replace('<w:tblHeader />', '')
rows = doc.count('<w:trPr>')
doc = doc.replace('<w:trPr>', '<w:trPr><w:cantSplit/>')
doc = re.sub(r'<w:tr(\s[^>]*)?>(?!<w:trPr>)', lambda m: m.group(0) + '<w:trPr><w:cantSplit/></w:trPr>', doc)

# Page geometry, so an oversized image is caught here rather than in Word.
# Attribute order differs between Word files, so read each one on its own.
pg = re.search(r'<w:pgSz[^>]*>', doc)
mar = re.search(r'<w:pgMar[^>]*>', doc)
if pg and mar:
    def attr(tag, name):
        m = re.search(r'w:%s="(\d+)"' % name, tag)
        return int(m.group(1)) if m else 0
    height = (attr(pg.group(0), 'h') - attr(mar.group(0), 'top') - attr(mar.group(0), 'bottom')) / 1440.0
    tall = [round(int(cy) / EMU, 2) for _, cy in re.findall(r'<wp:extent cx="(\d+)" cy="(\d+)"', doc)]
    over = [h for h in tall if h > height]
    print('usable page height: %.2f in' % height)
    print('images over that height:', over or 'none')

parts['word/document.xml'] = doc.encode('utf-8')

# 4. A heading must never be left alone at the foot of a page.
kept = 0
def keep_with_next(m):
    global kept
    block = m.group(0)
    if 'w:val="Heading' not in block or '<w:keepNext/>' in block:
        return block
    kept += 1
    return block.replace('<w:pPr>', '<w:pPr><w:keepNext/>', 1)
doc = re.sub(r'<w:pPr>.*?</w:pPr>', keep_with_next, doc, flags=re.S)
parts['word/document.xml'] = doc.encode('utf-8')

# 3. Drop media the document no longer points at. The reference file's own
# images arrive with their relationships intact, so the relationship list is not
# evidence of use: only an r:embed inside the body is.
rels = parts['word/_rels/document.xml.rels'].decode('utf-8')
live_ids = set(re.findall(r'r:embed="([^"]+)"', doc)) | set(re.findall(r'r:id="([^"]+)"', doc))
id_to_target = dict(re.findall(r'Id="([^"]+)"[^>]*Target="(media/[^"]+)"', rels))
used = {'word/' + t for i, t in id_to_target.items() if i in live_ids}
dropped = [n for n in parts if n.startswith('word/media/') and n not in used]
for n in dropped:
    del parts[n]
for i, t in id_to_target.items():
    if i not in live_ids:
        rels = re.sub(r'<Relationship Id="%s"[^>]*/>' % re.escape(i), '', rels)
parts['word/_rels/document.xml.rels'] = rels.encode('utf-8')

with zipfile.ZipFile(tmp, 'w', zipfile.ZIP_DEFLATED) as z:
    for name, data in parts.items():
        z.writestr(name, data)
shutil.move(tmp, OUT)

print('header-row repeats removed:', repeats)
print('rows kept whole:', rows)
print('orphan images dropped:', len(dropped))
print('written:', OUT, '%.1f MB' % (os.path.getsize(OUT) / 1e6))
