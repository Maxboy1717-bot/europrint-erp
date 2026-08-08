import os, re, sys
sys.stdout.reconfigure(encoding='utf-8')
BASE = 'C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/docs/audit'
V1 = BASE + '/vision-questions'
V2 = BASE + '/vision-questions-v2'
OUT = BASE + '/VISION-QUESTIONS-MASTER-2026-06-08.md'
NL = chr(10)
MODULES = [
 ('01-org-kartalar', 'Org-struktura / KARTALAR'),
 ('02-hr', 'HR'),
 ('03-finance', 'Finance / GL'),
 ('04-coordination', 'Coordination'),
 ('05-director', 'Director / Strategiya'),
 ('06-sd', 'SD / Sotuv'),
 ('07-pp', 'PP / Rejalashtirish'),
 ('08-mes', 'MES / Ishlab chiqarish'),
 ('09-qc', 'QC / Sifat'),
 ('10-warehouse', 'Ombor / WMS'),
 ('11-mm', 'MM / Taminot'),
 ('12-lms', 'LMS / Talim'),
 ('13-crm', 'CRM'),
 ('14-marketing', 'Marketing'),
 ('15-kanban', 'Kanban / Vazifalar'),
 ('16-iot', 'IoT'),
 ('17-ai', 'AI'),
 ('18-notifications', 'Bildirishnoma / Telegram'),
 ('19-pos', 'POS Monitor'),
 ('20-cc', 'Communication Center / Hujjat'),
]

def read(p):
    try:
        with open(p, 'r', encoding='utf-8', errors='ignore') as f:
            return f.read()
    except Exception:
        return ''

def blocks(txt):
    parts = re.split('(?=^### Q)', txt, flags=re.M)
    return [p.strip() for p in parts if p.strip().startswith('### Q')]

gn = 0
counts = []
sections = []
for key, name in MODULES:
    b1 = blocks(read(V1 + '/' + key + '.md'))
    b2 = blocks(read(V2 + '/' + key + '.md'))
    allb = b1 + b2
    counts.append((name, len(b1), len(b2), len(allb)))
    sec = ['## ' + name + '  (' + str(len(allb)) + ' savol: ' + str(len(b1)) + ' v1 + ' + str(len(b2)) + ' v2)']
    for blk in allb:
        gn += 1
        blk2 = re.sub('^### Q[0-9]+', '### Q' + str(gn), blk, count=1, flags=re.M)
        sec.append(blk2)
    sections.append(NL.join(sec))

hdr = []
hdr.append('# EuroPrint ERP — VIZYON SAVOLLARI MASTER BANK — 2026-06-08')
hdr.append('')
hdr.append('> 628 (v1 high-level) + 1466 (v2 kitob-grounded) = barcha savol, modul boyicha, global raqamlangan Q1..QN.')
hdr.append('> Format: Nima / Nega kerak / Variantlar (A=tavsiya). Bazilarda cross-modul (Ta sir) + zanjirli follow-up.')
hdr.append('')
hdr.append('## Xulosa jadvali')
hdr.append('')
hdr.append('| # | Modul | v1 | v2 | Jami |')
hdr.append('|---|-------|----|----|------|')
for i, (name, c1, c2, c) in enumerate(counts, 1):
    hdr.append('| ' + str(i) + ' | ' + name + ' | ' + str(c1) + ' | ' + str(c2) + ' | ' + str(c) + ' |')
hdr.append('| | **JAMI** | | | **' + str(gn) + '** |')

body = NL.join(hdr) + NL + NL + '---' + NL + NL + (NL + NL + '---' + NL + NL).join(sections)
with open(OUT, 'w', encoding='utf-8') as f:
    f.write(body)
print('TOTAL questions:', gn)
for name, c1, c2, c in counts:
    print(name, c1, '+', c2, '=', c)
