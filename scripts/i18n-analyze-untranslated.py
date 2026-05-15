import os, json, sys
sys.stdout.reconfigure(encoding='utf-8')
LOCALES = "artifacts/erp-dashboard/src/locales/ru"
WHITELIST = {"OK","API","URL","JWT","Email","ID","CSV","JSON","PDF","HTML","CSS","JS","TS","IP","EuroPrint","Telegram","WhatsApp","CRM","ERP","HR","FI","PP","MES","QC","WMS","SD","MRO","POS","MM","LMS","SOS","KPI","RBAC","OEE","ROI","OTP","2FA","SaaS","BOM","FIFO","FEFO","SQL","GPS","QR","B2B","B2C","CFO","CEO","CTO","UX","UI","CRUD","REST","PWA","JIT","IoT","AI","GL","AP","AR","BI","CAD","CI","CD"}
def flat(o,p=""):
    out={}
    for k,v in (o or {}).items():
        kk=f"{p}.{k}" if p else k
        if isinstance(v,dict): out.update(flat(v,kk))
        else: out[kk]=v
    return out
def hcyr(s): return isinstance(s,str) and any('Ѐ'<=c<='ӿ' for c in s)

total = 0
namespaces = []
for fn in sorted(os.listdir(LOCALES)):
    if not fn.endswith(".json") or fn.endswith(".before-codemod"): continue
    with open(f"{LOCALES}/{fn}","r",encoding="utf-8") as f:
        d = flat(json.load(f))
    needs = [(k,v) for k,v in d.items() if isinstance(v,str) and not hcyr(v) and len(v) > 1 and v.strip() not in WHITELIST]
    if needs:
        total += len(needs)
        namespaces.append((fn, len(needs)))

print(f"TOTAL UNTRANSLATED: {total}")
print(f"NAMESPACES WITH UNTRANSLATED:")
for fn, cnt in sorted(namespaces, key=lambda x: -x[1]):
    print(f"  {fn}: {cnt}")
