# europrint-core — 5-Qatlamli Agent Development Kit

Bu plugin EuroPrint ERP loyihasi uchun Claude Code agent infrastructure'ni quradi.

## Tuzilma

```
.claude/
├── ../CLAUDE.md                    ← LAYER 1: Loyiha konstitutsiyasi (21KB)
├── skills/                         ← LAYER 2: Domain bilim
│   ├── production/SKILL.md
│   ├── warehouse/SKILL.md
│   ├── hr/SKILL.md
│   ├── finance/SKILL.md
│   ├── quality/SKILL.md
│   └── ai-integration/SKILL.md
├── agents/                         ← LAYER 4: Subagents
│   ├── code-reviewer.md
│   ├── db-analyst.md
│   ├── feature-dev.md
│   └── bug-hunter.md
├── hooks/                          ← LAYER 3: Qorovul skriptlar
│   ├── PreToolUse.sh
│   ├── PostToolUse.sh
│   └── SessionStart.sh
├── plugins/                        ← LAYER 5: Plugin manifestlar
│   └── europrint-core/
│       ├── plugin.json
│       └── README.md
└── settings.local.json             ← Hooks shu yerda wire qilingan
```

## Ishlatish

### 1. Yangi funksiya qo'shish
```
"HR moduliga 'employee birthday reminder' qo'sh"
```
→ `feature-dev` subagent: tahlil → reja → schema → repo → service → controller → frontend → test

### 2. Bug topish va tuzatish
```
"Mana bu stack trace nimaga sabab? <stack trace>"
```
→ `bug-hunter` subagent: ildiz sabab + yechim + yon ta'sirlar

### 3. Kod review
```
"apps/api/src/modules/finance/gl/gl.service.ts ni tekshir"
```
→ `code-reviewer` subagent: xavfsizlik / standartlar / biznes mantiq (JSON)

### 4. DB tahlil
```
"SELECT ... bu so'rovni tahlil qil"
```
→ `db-analyst` subagent: performance / N+1 / migration xavfsizligi

## Qorovul tizimi (Hooks)

Hooks `.claude/settings.local.json` da ulangan. Avtomatik ishlaydi:

- **Pre-tool**: DROP TABLE / force-push / rm -rf bloklash, .env audit
- **Post-tool**: audit log, schema migration eslatma, 300-line ogohlantirish
- **Session start**: branch + commit + reviewer holati ko'rsatish

## Architecture Rules

22 ta rule `ARCHITECTURE_RULES.md` da hujjatlangan. Joriy holat: **18 PASS / 4 FAIL**.

Run: `bash scripts/run-all-reviewers.sh`

## Mavzular bo'yicha skill trigger

Skill'lar so'z bo'yicha avtomatik faollashadi:

| Trigger so'zlar | Faollashadigan skill |
|---|---|
| buyurtma, production, sex, BOM, OEE | `production` |
| ombor, material, rol, FIFO, ABC | `warehouse` |
| xodim, HR, payroll, KPI, davomad | `hr` |
| moliya, GL, AP, AR, invoice, cashflow | `finance` |
| sifat, QC, defect, SPC, FMEA | `quality` |
| AI, agent, prognoz, CFO bot | `ai-integration` |
