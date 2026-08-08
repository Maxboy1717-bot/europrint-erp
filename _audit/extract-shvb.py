import os, re, zipfile, html, sys
sys.stdout.reconfigure(encoding='utf-8')
SRC = 'C:/Users/AzzA/Downloads/Telegram Desktop'
OUT = 'C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/docs/audit/shvb-extracted'
os.makedirs(OUT, exist_ok=True)
NL = chr(10)
files = [
    'EUROPRINT_BARCHA_JAVOBLAR.md',
    'SHvB-40-Yonalish-Prompt.md',
    'Module3-vs-SHvB-Tahlil.md',
    'SHvB-Tolik-Arxiv-Hujjatlari.md',
    'Module3-vs-SHvB-Tahlil-Integratsiya.docx',
]

def docx_text(path):
    try:
        with zipfile.ZipFile(path) as z:
            xml = z.read('word/document.xml').decode('utf-8', 'ignore')
        xml = xml.replace('</w:p>', NL)
        xml = re.sub('<[^>]+>', '', xml)
        return html.unescape(xml)
    except Exception as e:
        return 'ERR ' + str(e)

tot = 0
for fn in files:
    src = os.path.join(SRC, fn)
    if not os.path.exists(src):
        print('MISSING', fn); continue
    if fn.lower().endswith('.docx'):
        txt = docx_text(src); dst = os.path.join(OUT, fn[:-5] + '.md')
    else:
        with open(src, 'r', encoding='utf-8', errors='ignore') as f:
            txt = f.read()
        dst = os.path.join(OUT, fn)
    with open(dst, 'w', encoding='utf-8') as f:
        f.write(txt)
    tot += len(txt); print('OK', fn, len(txt), 'chars')
print('total', tot)
