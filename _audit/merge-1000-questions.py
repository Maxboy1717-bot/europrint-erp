import os, re, sys
sys.stdout.reconfigure(encoding='utf-8')
NL = chr(10)
BASE = 'C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/docs/audit'
SRC = BASE + '/vision-questions-1000'
OUT = BASE + '/VISION-QUESTIONS-1000-2026-06-08.md'

MODULES = [
 ('01-org-kartalar','ORG — Org-struktura / KARTALAR'),
 ('02-hr','HR — Xodimlar'),
 ('03-finance','FIN — Finance / GL + Kassir'),
 ('04-coordination','COR — Coordination / Kengash'),
 ('05-director','DIR — Director / Strategiya'),
 ('06-sd','SD — Sotuv'),
 ('07-pp','PP — Rejalashtirish'),
 ('08-mes','MES — Ishlab chiqarish'),
 ('09-qc','QC — Sifat'),
 ('10-warehouse','WMS — Ombor'),
 ('11-mm','MM — Ta\'minot'),
 ('12-lms','LMS — Ta\'lim'),
 ('13-crm','CRM'),
 ('14-marketing','MKT — Marketing'),
 ('15-kanban','KAN — Kanban / Vazifalar'),
 ('16-iot','IOT — IoT / Sensor + AI-kamera'),
 ('17-ai','AI — Markaziy-AI'),
 ('18-notifications','NTF — Bildirishnoma / Telegram'),
 ('19-pos','POS — POS Monitor'),
 ('20-cc','CC — Communication Center / Hujjat'),
]

def read(p):
    try:
        with open(p, 'r', encoding='utf-8', errors='ignore') as f:
            return f.read()
    except Exception:
        return ''

def extract_questions(txt):
    qs = []
    for line in txt.split(NL):
        s = line.strip()
        m = re.match(r'^[0-9]{1,3}[.)]\s*(.*)', s)
        if m and len(m.group(1)) > 5:
            qs.append(m.group(1).strip())
    return qs

gn = 0
counts = []
sections = []
for key, name in MODULES:
    txt = read(SRC + '/' + key + '.md')
    qs = extract_questions(txt)
    counts.append((name, len(qs)))
    sec = ['## ' + name + '  (' + str(len(qs)) + ' savol)', '']
    for q in qs:
        gn += 1
        sec.append('**Q' + str(gn) + '.** ' + q)
    sections.append(NL.join(sec))

hdr = []
hdr.append('# EuroPrint ERP — 1000 VIZYON SAVOLI (avtomatlashtirish + edge-case + modullararo) — 2026-06-08')
hdr.append('')
hdr.append('> Hamma 20 modulga taqsimlangan vizyon savollari. Maqsad: vizyonni kodga aniq tushirish uchun')
hdr.append('> chuqurroq savollar (avtomatlashtirish, edge-case, modullararo ta\'sir). Global raqamlangan Q1..QN.')
hdr.append('')
hdr.append('## Xulosa jadvali')
hdr.append('')
hdr.append('| # | Modul | Savol |')
hdr.append('|---|-------|-------|')
for i, (name, c) in enumerate(counts, 1):
    hdr.append('| ' + str(i) + ' | ' + name + ' | ' + str(c) + ' |')
hdr.append('| | **JAMI** | **' + str(gn) + '** |')
hdr.append('')
hdr.append('---')
hdr.append('')

body = NL.join(hdr) + (NL + NL + '---' + NL + NL).join(sections)
with open(OUT, 'w', encoding='utf-8') as f:
    f.write(body)
print('TOTAL questions:', gn)
for name, c in counts:
    print(name, '=', c)
