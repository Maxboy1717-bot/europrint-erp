import os, re, zipfile, html, sys
sys.stdout.reconfigure(encoding='utf-8')
ROOT = 'D:/kitob'
OUT = 'C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/docs/audit/kitob-extracted'
os.makedirs(OUT, exist_ok=True)
NL = chr(10); BS = chr(92)

def docx_text(path):
    try:
        with zipfile.ZipFile(path) as z:
            xml = z.read('word/document.xml').decode('utf-8', 'ignore')
    except Exception:
        return ''
    xml = xml.replace('</w:p>', NL)
    xml = re.sub('<[^>]+>', '', xml)
    return html.unescape(xml)

def xlsx_text(path):
    try:
        with zipfile.ZipFile(path) as z:
            names = z.namelist()
            if 'xl/sharedStrings.xml' in names:
                ss = z.read('xl/sharedStrings.xml').decode('utf-8', 'ignore')
                vals = re.findall('<t[^>]*>(.*?)</t>', ss, re.S)
                return NL.join(html.unescape(v) for v in vals[:250])
            return ''
    except Exception:
        return ''

groups = {}; cd = cx = ck = 0
for dp, ds, fs in os.walk(ROOT):
    for fn in fs:
        if fn.startswith('~$'):
            continue
        ext = fn.lower().rsplit('.', 1)[-1] if '.' in fn else ''
        full = os.path.join(dp, fn)
        reld = full.replace(BS, '/')
        parts = os.path.relpath(full, ROOT).replace(BS, '/').split('/')
        key = parts[0] if len(parts) > 1 else 'root'
        if key.upper().startswith('РД-5') and len(parts) >= 3:
            key = 'RD5__' + parts[2]
        if ext == 'docx':
            t = docx_text(full)
            if t.strip():
                groups.setdefault(key, []).append(NL + NL + '=== ' + reld + ' ===' + NL + t[:8000]); cd += 1
        elif ext == 'xlsx':
            t = xlsx_text(full)
            if t.strip():
                groups.setdefault(key, []).append(NL + NL + '=== ' + reld + ' (Excel) ===' + NL + t[:6000]); cx += 1
        else:
            ck += 1

def safe(n):
    return re.sub('[^0-9A-Za-zА-Яа-я_ -]', '_', n)[:70].strip() or 'x'

total = 0
for key, items in groups.items():
    body = NL.join(items); total += len(body)
    with open(os.path.join(OUT, safe(key) + '.md'), 'w', encoding='utf-8') as f:
        f.write('# Kitob: ' + key + NL + body)

print('docx:', cd, 'xlsx:', cx, 'skip:', ck, 'groups:', len(groups), 'chars:', total)
ks = sorted(groups, key=lambda k: -len(NL.join(groups[k])))
for k in ks[:40]:
    print(' -', k, '=', len(NL.join(groups[k])), 'chars')
