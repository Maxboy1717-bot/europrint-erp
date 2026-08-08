import os, re, sys
sys.stdout.reconfigure(encoding='utf-8')
NL = chr(10)
BS = chr(92)
BASE = 'C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/docs/audit/decisions'
OUT  = 'C:/Users/AzzA/Downloads/EuroPrint-Clean/Uzbek-Language-Module/docs/audit/MASTER-SAVOL-JAVOB-2026-06-08.md'

MODULES = [
 ('01-org-kartalar','1. ORG / KARTALAR'),
 ('02-hr','2. HR'),
 ('03-finance','3. Finance / GL'),
 ('04-coordination','4. Coordination'),
 ('05-director','5. Director / Strategiya'),
 ('06-sd','6. SD / Sotuv'),
 ('07-pp','7. PP / Rejalashtirish'),
 ('08-mes','8. MES / Ishlab chiqarish'),
 ('09-qc','9. QC / Sifat'),
 ('10-warehouse','10. WMS / Ombor'),
 ('11-mm','11. MM / Taminot'),
 ('12-lms','12. LMS / Talim'),
 ('13-crm','13. CRM'),
 ('14-marketing','14. Marketing'),
 ('15-kanban','15. Kanban'),
 ('16-iot','16. IoT'),
 ('17-ai','17. AI'),
 ('18-notifications','18. Bildirishnoma'),
 ('19-pos','19. POS Monitor'),
 ('20-cc','20. CC / Hujjat'),
]

def read(p):
    try:
        with open(p, 'r', encoding='utf-8', errors='ignore') as f:
            return f.read()
    except Exception:
        return ''

def clean(s):
    s = s.replace('**','').replace('`','').strip()
    s = re.sub(r'\s+', ' ', s)
    return s

def parse(txt):
    blocks = re.split(r'(?=^### EP-)', txt, flags=re.M)
    items = []
    for b in blocks:
        if not b.startswith('### EP-'):
            continue
        head = b.split(NL, 1)[0]
        m = re.match(r'### (EP-[A-Z]+-[0-9]+)\s*[·:.-]*\s*(.*)', head)
        if not m:
            m = re.match(r'### (EP-[A-Z]+-[0-9]+)(.*)', head)
        code = m.group(1) if m else '?'
        title = clean(m.group(2)) if m else clean(head[4:])
        hm = re.search(r'Holat:[*]*\s*(.*)', b)
        holat = clean(hm.group(1)) if hm else '?'
        am = re.search(r'Javob[\\/]Tavsiya:[*]*\s*(.*)', b)
        ans = clean(am.group(1)) if am else ''
        items.append((code, title, holat, ans))
    return items

def status_icon(holat):
    if '✅' in holat or 'JAVOBLANGAN' in holat:
        return '✅'   # answered (oldin / vizyon)
    if 'KOLLIZIYA' in holat or 'KONFLIKT' in holat:
        return '⚖️'  # conflict -> resolved
    if '\U0001f535' in holat or 'OCHIQ' in holat:
        return '\U0001f7e2'   # was open -> resolved this session
    return '•'

out = []
out.append('# EuroPrint ERP — HAMMA SAVOL-JAVOB MASTER (o\'qish uchun) — 2026-06-08')
out.append('')
out.append('> Egasi so\'rovi: hamma savol va javobni bir joyda ko\'rish. 20 modul x har savol.')
out.append('> **Belgilar:** ✅ = oldindan javoblangan (egasi vizyoni/460-javob) · \U0001f7e2 = shu sessiyada hal qilindi (egasi javobi yoki printsip-default) · ⚖️ = ziddiyat, hal qilindi.')
out.append('> Egasi shaxsan javob bergan/override qilganlar batafsil: `OCHIQ-JAVOBLAR-2026-06-08.md`.')
out.append('')
tot_all = 0; tot_ans = 0; tot_open = 0
summ = []
sections = []
for key, name in MODULES:
    items = parse(read(BASE + '/' + key + '.md'))
    n = len(items)
    nans = sum(1 for it in items if status_icon(it[2]) == '✅')
    nopen = n - nans
    tot_all += n; tot_ans += nans; tot_open += nopen
    summ.append('| ' + name + ' | ' + str(n) + ' | ' + str(nans) + ' | ' + str(nopen) + ' |')
    sec = []
    sec.append('## ' + name + '  (' + str(n) + ' savol)')
    sec.append('')
    for code, title, holat, ans in items:
        ic = status_icon(holat)
        a = ans
        if len(a) > 240:
            a = a[:240] + '...'
        line = '- ' + ic + ' **' + code + '** · ' + title
        if a:
            line += '  —  ' + a
        sec.append(line)
    sections.append(NL.join(sec))

hdr = []
hdr.append('## Xulosa jadvali')
hdr.append('')
hdr.append('| Modul | Jami | ✅ oldin | \U0001f7e2 sessiyada hal |')
hdr.append('|---|---|---|---|')
hdr.extend(summ)
hdr.append('| **JAMI** | **' + str(tot_all) + '** | **' + str(tot_ans) + '** | **' + str(tot_open) + '** |')
hdr.append('')
hdr.append('> Eslatma: \U0001f7e2 ustun = shu sessiyada hal qilingan (sizning javobingiz yoki vizyonga mos printsip-default).')
hdr.append('> OCHIQ qolgan (sizdan keyin): PP-109 kod-ma\'nolari, MM yoqilg\'i 10-savol, POS-037 makulatura fayl.')
hdr.append('')
hdr.append('---')
hdr.append('')

body = NL.join(out) + NL + NL.join(hdr) + (NL + NL + '---' + NL + NL).join(sections)
with open(OUT, 'w', encoding='utf-8') as f:
    f.write(body)
print('TOTAL:', tot_all, ' answered-before:', tot_ans, ' resolved-session:', tot_open)
for key, name in MODULES:
    items = parse(read(BASE + '/' + key + '.md'))
    print(name, '=', len(items))
