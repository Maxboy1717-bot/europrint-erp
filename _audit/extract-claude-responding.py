import zipfile, re, html, sys, os
sys.stdout.reconfigure(encoding='utf-8')
NL = chr(10)
src = r'D:\kitob\Claude is responding.docx'
outdir = 'C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/docs/audit/kitob-extracted'
out = outdir + '/claude-is-responding.md'
os.makedirs(outdir, exist_ok=True)

z = zipfile.ZipFile(src)
names = z.namelist()
# main document + any extra parts
parts = [n for n in names if re.match(r'word/(document|header\d*|footer\d*)\.xml$', n)]
chunks = []
for n in ['word/document.xml']:
    if n in names:
        xml = z.read(n).decode('utf-8', 'ignore')
        xml = xml.replace('</w:p>', NL).replace('</w:tr>', NL).replace('<w:br/>', NL).replace('<w:tab/>', '\t')
        txt = re.sub('<[^>]+>', '', xml)
        txt = html.unescape(txt)
        chunks.append(txt)
txt = NL.join(chunks)
txt = re.sub(NL + '{3,}', NL + NL, txt)
with open(out, 'w', encoding='utf-8') as f:
    f.write(txt)
print('parts in docx:', parts)
print('chars:', len(txt))
print('lines:', txt.count(NL) + 1)
print('--- first 800 chars ---')
print(txt[:800])
