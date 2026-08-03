import os, re, sys
sys.stdout.reconfigure(encoding='utf-8')
NL = chr(10)
BASE = 'C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/docs/audit'
QSRC = BASE + '/vision-questions-1000'
ASRC = BASE + '/vision-1000-answers'
OUT = BASE + '/VISION-1000-SAVOL-JAVOB-2026-06-08.md'

MODULES = [
 ('01-org-kartalar','ORG — KARTALAR'),('02-hr','HR'),('03-finance','FIN — Moliya/Kassir'),
 ('04-coordination','COR — Coordination'),('05-director','DIR — Director'),('06-sd','SD — Sotuv'),
 ('07-pp','PP — Reja'),('08-mes','MES'),('09-qc','QC — Sifat'),('10-warehouse','WMS — Ombor'),
 ('11-mm','MM — Ta\'minot'),('12-lms','LMS'),('13-crm','CRM'),('14-marketing','MKT'),
 ('15-kanban','KAN'),('16-iot','IOT'),('17-ai','AI'),('18-notifications','NTF'),
 ('19-pos','POS'),('20-cc','CC — Hujjat'),
]

def read(p):
    try:
        with open(p,'r',encoding='utf-8',errors='ignore') as f: return f.read()
    except Exception: return ''

def parse_numbered(txt):
    d = {}
    for line in txt.split(NL):
        s = line.strip().lstrip('*').strip()
        m = re.match(r'^(?:\*\*)?([0-9]{1,3})[.)]\s*(.*)', s)
        if m:
            n = int(m.group(1)); body = m.group(2).strip().rstrip('*').strip()
            if len(body) > 3 and n not in d:
                d[n] = body
    return d

gn = 0
counts = []
sections = []
for key, name in MODULES:
    qs = parse_numbered(read(QSRC + '/' + key + '.md'))
    ans = parse_numbered(read(ASRC + '/' + key + '.md'))
    nq = len(qs); na = len(ans)
    counts.append((name, nq, na))
    sec = ['## ' + name + '  (' + str(nq) + ' savol / ' + str(na) + ' javob)', '']
    for i in range(1, 51):
        if i not in qs: continue
        gn += 1
        q = qs[i]
        a = ans.get(i, '⚠️ (javob topilmadi)')
        # strip impact tag from question for cleanliness but keep it
        sec.append('**Q' + str(gn) + '.** ' + q)
        sec.append('↳ **Tavsiya-javob:** ' + a)
        sec.append('')
    sections.append(NL.join(sec))

hdr = []
hdr.append('# EuroPrint ERP — 1000 VIZYON SAVOL-JAVOB (tavsiya javoblar) — 2026-06-08')
hdr.append('')
hdr.append('> Har savol + advisor TAVSIYA-javobi (vizyon + qoidalar + texnik best-practice asosida).')
hdr.append('> Egasi: hujjatni o\'qib, faqat O\'ZGARTIRMOQCHI bo\'lganlarini ayting (Q-raqami bilan).')
hdr.append('> ORG Q1-Q30: egasi 2026-06-08 da TAVSIYALARNI tasdiqladi ("hamma tavsiyalar to\'g\'ri").')
hdr.append('')
hdr.append('## Xulosa jadvali')
hdr.append('| # | Modul | Savol | Javob |')
hdr.append('|---|-------|-------|-------|')
for i,(name,nq,na) in enumerate(counts,1):
    hdr.append('| ' + str(i) + ' | ' + name + ' | ' + str(nq) + ' | ' + str(na) + ' |')
hdr.append('| | **JAMI** | **' + str(gn) + '** | |')
hdr.append('')
hdr.append('---')
hdr.append('')

body = NL.join(hdr) + (NL + '---' + NL + NL).join(sections)
with open(OUT,'w',encoding='utf-8') as f: f.write(body)
print('TOTAL Q paired:', gn)
for name,nq,na in counts:
    flag = '' if nq==na==50 else '  <-- CHECK'
    print(name, 'Q='+str(nq), 'A='+str(na), flag)
