#!/usr/bin/env node
/**
 * Full i18n audit per user spec.
 * Scans every TSX/TS in artifacts/erp-dashboard/src for:
 *  - hardcoded JSX text, placeholder, title, alt, aria-label, label
 *  - t('key') calls and verifies key exists in uz + ru locale files
 *
 * Output:
 *  - scripts/i18n-full-audit.json
 *  - scripts/i18n-full-audit-summary.txt
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(new URL('..', import.meta.url).pathname.replace(/^\/(\w):/, '$1:'));
const SRC = path.resolve(ROOT, 'artifacts', 'erp-dashboard', 'src');
const LOCALES = path.resolve(SRC, 'locales');

const txtAttrs = ['placeholder', 'title', 'alt', 'aria-label', 'label', 'tooltip', 'description'];

// Latin English UI dictionary (lowercase) — used to detect English hardcoded text
const englishDict = new Set([
  'save','cancel','edit','delete','add','remove','update','create','search','filter','export','import',
  'view','click','submit','accept','reject','refresh','sync','login','logout','password','username','email',
  'status','type','name','date','time','total','amount','price','quantity','ok','yes','no','all','none',
  'settings','dashboard','home','back','next','previous','close','open','select','choose','confirm','apply',
  'send','receive','upload','download','success','error','warning','info','loading','processing','pending',
  'completed','active','inactive','enabled','disabled','new','current','today','yesterday','tomorrow',
  'week','month','year','hour','minute','second','item','items','user','users','role','roles','group','groups',
  'team','teams','department','employee','customer','supplier','product','order','invoice','payment','report',
  'log','logs','history','board','menu','list','table','form','field','button','input','page','section','panel',
  'tab','window','dialog','modal','popup','notification','alert','message','comment','note','title','description',
  'header','footer','sidebar','navigation','sort','find','replace','copy','paste','cut','undo','redo','print',
  'share','load','run','stop','start','pause','resume','first','last','more','less','show','hide','details',
  'summary','overview','statistics','analytics','chart','graph','grid','card','tile','monitor','alarm','reminder',
  'schedule','calendar','event','meeting','task','project','milestone','deadline','due','overdue','archived',
  'restored','published','draft','approved','rejected','sent','received','read','unread','online','offline',
  'connected','disconnected','available','unavailable','busy','free','idle','away','register','verify',
  'required','optional','please','wait','try','again','before','after','admin','default','custom','manual',
  'auto','automatic','setup','config','configuration','option','options','help','support','about','contact',
  'feedback','profile','account','public','private','internal','external','language','translation','region',
  'country','city','address','street','zip','postal','website','social','media','share','follow','unfollow',
  'like','dislike','reply','quote','bookmark','favorite','pin','unpin','tag','untag','assign','unassign',
  'transfer','move','duplicate','clone','version','release','build','test','testing','tested','development',
  'production','staging','sandbox','demo','preview','reviewed','expand','collapse','minimize','maximize',
  'full','screen','fullscreen','split','vertical','horizontal','timeline','gantt','kanban','agenda','plan',
  'planning','design','designer','engineer','manager','operator','supervisor','administrator','staff',
  'division','unit','branch','zone','area','district','floor','room','office','warehouse','factory','plant',
  'machine','equipment','tool','part','component','assembly','manufacturing','inventory','stock','material',
  'resource','asset','liability','revenue','expense','profit','loss','budget','forecast','target','goal',
  'objective','metric','kpi','reporting','analysis','data','information','content','image','video','audio',
  'document','file','folder','directory','archive','backup','restore','recovery','synchronize','migrate',
  'migration','distribute','broadcast','publish','subscribe','notify','warn','inform','upgrade','downgrade',
  'install','uninstall','reinstall','configure','initialize','reset','restart','reboot','shutdown','power',
  'sleep','hibernate','wake','lock','unlock','signin','signout','signup','unregister','enroll','unenroll',
  'join','leave','enter','exit','play','forward','backward','rewind','fast','slow','speed','rate','frequency',
  'interval','duration','length','width','height','depth','size','weight','mass','volume','capacity','count',
  'number','value','cost','fee','charge','tax','discount','promotion','offer','deal','sale','purchase',
  'receipt','contract','agreement','license','permit','certificate','record','entry','transaction','operation',
  'process','procedure','workflow','step','phase','stage','state','condition','situation','occurrence',
  'phenomenon','circumstance','responsibility','obligation','commitment','promise','guarantee','warranty',
  'assurance','approval','authorization','permission','consent','sketch','outline','synopsis','abstract',
  'trend','risk','audit','marketing','sales','human','resources','finance','accounting','technology','tech',
  'client','vendor','partner','stakeholder','shareholder','director','president','vice','chief','officer',
  'executive','senior','junior','intern','consultant','contractor','freelancer','permanent','temporary',
  'remote','hybrid','field','site','onsite','recent','latest','newest','oldest','recently','soon','now',
  'later','earlier','already','still','too','also','just','only','even','very','really','quite','rather',
  'enough','such','small','large','big','little','tall','short','long','wide','narrow','thick','thin','heavy',
  'strong','weak','good','bad','better','worse','best','worst','easy','hard','difficult','simple','complex',
  'clear','vague','important','urgent','mandatory','recommended','suggested','accepted','denied','allowed',
  'forbidden','permitted','blocked','locked','unlocked','visible','hidden','progress','approval','workflow',
  'cash','reservation','overview','assistant','question','english','access','token','funnel','number',
  'quality','sub','training','succession','planning','manage','budgets','costing','financial','reports',
  'currency','toolbar','footer','header','widget','module'
]);

// Tokens that, if found, mean the value is Uzbek (apostrof-less Uzbek words)
const uzWords = new Set([
  'paneli','tizim','tizimga','parol','parolni','sozlamalar','sozlamalari','sozlama','holat','holati','jurnal',
  'jurnali','modul','modullar','versiya','versiyasi','foydalanuvchi','administrator','operator','menejer',
  'bloklangan','tasdiqlangan','kompaniya','valyuta','mavzu','rejimi','zaxira','xato','xatolik','kirish',
  'chiqish','kalitlar','tekshiruvi','vaqti','tarjima','sotuv','xodim','mijoz','mijozlar','buyurtma','shartnoma',
  'dastgoh','ombor','sex','tex','texkarta','ogohlantirish','malumot','tanlash','majburiy','ixtiyoriy','bugun',
  'kecha','hafta','umumiy','sana','vaqt','nomi','turi','tavsif','miqdor','faol','nofaol','muvaffaqiyat',
  'barcha','tahrirlash','korish','yopish','qaytarish','filtr','eksport','tafsilotlar','harakatlar','tahlil',
  'hisobot','hisoblash','natija','natijalar','soni','rejim','funksiya','sertifikat','dastur','samaradorlik',
  'ishtirok','xizmati','baholash','sifat','rejalashtirish','reja','tasdiqlash','qabul','jarayonda',
  'tugatilgan','boshqarish','boshqaruv','kerakli','tartib','operatsiya','yangi','rad','etish','qilish',
  'etadi','qiladi','birinchi','keyingisi','oxirgi','asosiy','qoshimcha','har','bir','kunlik','haftalik',
  'oylik','yillik','tarixi','tarix','yangilash','test','testing','sifati','urinishlari','savollari','haqida',
  'ismi','tanlang','yaratish','yuklanmoqda','kategoriyalari','topilmadi','foydalanish','bolimi','reytingi',
  'qarzlari','sanasi','rejasi','kunlar','yillar','jamoasi','jamoa','butun','barcha','har','ya','va','bilan',
  'uchun','kerak','etish','qilish','etadi','qiladi','birinchi','keyingisi'
]);

function isLikelyEnglish(value) {
  if (!value || typeof value !== 'string') return false;
  const v = value.trim();
  if (v.length < 2) return false;
  // Skip emails/urls
  if (v.includes('@') || /^https?:/.test(v)) return false;
  // Apostrof = Uzbek
  if (/['‘’ʻ]/.test(v)) return false;
  // Cyrillic = Russian
  if (/[Ѐ-ӿ]/.test(v)) return false;
  // ASCII only
  if (!/^[\x20-\x7E]+$/.test(v)) return false;
  // Must have a letter
  if (!/[A-Za-z]/.test(v)) return false;
  // Skip if matches placeholder pattern like `m.quantity`, `foo-bar`
  if (/^[a-z]+\.[a-z]+$/.test(v)) return false;
  if (/^[A-Z_][A-Z0-9_]+$/.test(v) && v.length <= 8) return false; // SHORT_CAPS like ID/URL

  const tokens = v.toLowerCase().replace(/[^a-z\s]/g, ' ').split(/\s+/).filter(t => t.length > 1);
  if (!tokens.length) return false;

  // Any Uzbek word? → not English
  for (const tok of tokens) {
    if (uzWords.has(tok)) return false;
    if (/(lash|lanmoqda|larini|larida|lariga|lardan|larga|larni|imiz|ingiz|miz|yapti|moqda|tirish|ladi|lanadi|langan|ozish|ozadi|ilgan|inchi|ndan|ngiz|chasi)$/.test(tok)) return false;
  }

  // Skip very long sentences (likely tarjima not raw English)
  if (tokens.length > 6) return false;

  let englishCount = 0;
  let realWordCount = 0;
  for (const tok of tokens) {
    if (tok.length <= 1) continue;
    realWordCount++;
    if (englishDict.has(tok)) englishCount++;
  }
  // Hardcoded threshold: at least half words must be in English dict
  return realWordCount > 0 && englishCount >= Math.ceil(realWordCount * 0.5);
}

function walk(dir, files = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === 'node_modules' || e.name === '__tests__' || e.name === 'i18n' || e.name === 'locales' || e.name.startsWith('.')) continue;
      walk(full, files);
    } else if (/\.tsx$/.test(e.name) && !/\.(test|spec)\.tsx$/.test(e.name)) {
      // Only .tsx for JSX detection — .ts files have no JSX (false positives from Promise<T>)
      files.push(full);
    }
  }
  return files;
}

function flattenJson(obj, prefix = '') {
  const out = {};
  for (const [k, v] of Object.entries(obj ?? {})) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) Object.assign(out, flattenJson(v, key));
    else out[key] = v;
  }
  return out;
}

function loadLocale(lang) {
  const dir = path.join(LOCALES, lang);
  const out = {};
  for (const f of fs.readdirSync(dir).filter(n => n.endsWith('.json'))) {
    const ns = f.replace(/\.json$/, '');
    try {
      const obj = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
      out[ns] = flattenJson(obj);
    } catch {}
  }
  return out;
}

const uzLocale = loadLocale('uz');
const ruLocale = loadLocale('ru');

function lookupKey(loc, fullKey) {
  // fullKey like "common.save" or "save"
  const [ns, ...rest] = fullKey.split('.');
  if (rest.length === 0) {
    // No namespace — check across all namespaces
    for (const nsObj of Object.values(loc)) {
      if (fullKey in nsObj) return nsObj[fullKey];
    }
    return undefined;
  }
  const nsObj = loc[ns];
  if (!nsObj) return undefined;
  return nsObj[rest.join('.')];
}

const files = walk(SRC);
const findings = {
  hardcoded: [],   // hardcoded English text in JSX/attrs
  missingKeys: [], // t('key') calls where key missing in uz or ru
};

for (const file of files) {
  const rel = file.replace(SRC + path.sep, '').replace(/\\/g, '/');
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');

  // Find useTranslation namespace (e.g., useTranslation('finance'))
  let defaultNs = null;
  const nsMatch = content.match(/useTranslation\(['"]([^'"]+)['"]/);
  if (nsMatch) defaultNs = nsMatch[1];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // JSX text: >Text< (not {} or empty)
    for (const m of line.matchAll(/>([^<>{}\n]{2,120})</g)) {
      const txt = m[1].trim();
      if (!txt || txt.startsWith('{') || txt.includes('${')) continue;
      if (isLikelyEnglish(txt)) {
        findings.hardcoded.push({ file: rel, line: i + 1, type: 'JSX-text', text: txt });
      }
    }

    // Attribute strings
    for (const attr of txtAttrs) {
      const re = new RegExp(`${attr}\\s*=\\s*"([^"\\n]{2,120})"`, 'g');
      for (const m of line.matchAll(re)) {
        const txt = m[1].trim();
        if (isLikelyEnglish(txt)) {
          findings.hardcoded.push({ file: rel, line: i + 1, type: attr, text: txt });
        }
      }
    }

    // toast/alert/confirm raw strings
    for (const m of line.matchAll(/\b(toast|alert|confirm)\(\s*['"`]([^'"`\n]{2,120})['"`]/g)) {
      const txt = m[2].trim();
      if (isLikelyEnglish(txt)) {
        findings.hardcoded.push({ file: rel, line: i + 1, type: `${m[1]}-arg`, text: txt });
      }
    }

    // t('key') calls — check existence in locale
    for (const m of line.matchAll(/\bt\(\s*['"`]([a-zA-Z0-9_.]+)['"`]\s*[,)]/g)) {
      const key = m[1];
      // Try with default ns first, then as-is
      const candidates = defaultNs ? [`${defaultNs}.${key}`, key] : [key];
      let foundUz = false, foundRu = false, usedKey = null;
      for (const c of candidates) {
        const u = lookupKey(uzLocale, c);
        const r = lookupKey(ruLocale, c);
        if (u !== undefined && r !== undefined) { foundUz = true; foundRu = true; usedKey = c; break; }
        if (!foundUz && u !== undefined) { foundUz = true; usedKey = c; }
        if (!foundRu && r !== undefined) { foundRu = true; usedKey = c; }
      }
      if (!foundUz || !foundRu) {
        findings.missingKeys.push({
          file: rel, line: i + 1, key, usedNs: defaultNs,
          missingUz: !foundUz, missingRu: !foundRu,
        });
      }
    }
  }
}

// Deduplicate findings (file+line+text)
const seen = new Set();
findings.hardcoded = findings.hardcoded.filter(f => {
  const k = `${f.file}:${f.line}:${f.text}`;
  if (seen.has(k)) return false;
  seen.add(k);
  return true;
});

// Group hardcoded by file count
const byFile = {};
for (const f of findings.hardcoded) {
  byFile[f.file] = (byFile[f.file] || 0) + 1;
}

// Group missing keys by file
const missingByFile = {};
for (const m of findings.missingKeys) {
  missingByFile[m.file] = (missingByFile[m.file] || 0) + 1;
}

const summary = {
  totalFiles: files.length,
  hardcodedTotal: findings.hardcoded.length,
  hardcodedFiles: Object.keys(byFile).length,
  missingKeysTotal: findings.missingKeys.length,
  missingUzOnly: findings.missingKeys.filter(m => m.missingUz && !m.missingRu).length,
  missingRuOnly: findings.missingKeys.filter(m => !m.missingUz && m.missingRu).length,
  missingBoth: findings.missingKeys.filter(m => m.missingUz && m.missingRu).length,
  topHardcodedFiles: Object.entries(byFile).sort((a, b) => b[1] - a[1]).slice(0, 15),
  topMissingKeysFiles: Object.entries(missingByFile).sort((a, b) => b[1] - a[1]).slice(0, 15),
};

const outFile = path.join(ROOT, 'scripts', 'i18n-full-audit.json');
fs.writeFileSync(outFile, JSON.stringify({ summary, findings }, null, 2));

console.log('━━ i18n Full Audit ━━');
console.log(`Files scanned: ${summary.totalFiles}`);
console.log(`Hardcoded English text: ${summary.hardcodedTotal} in ${summary.hardcodedFiles} files`);
console.log(`Missing t() keys: ${summary.missingKeysTotal}`);
console.log(`  - Missing in UZ only: ${summary.missingUzOnly}`);
console.log(`  - Missing in RU only: ${summary.missingRuOnly}`);
console.log(`  - Missing in both: ${summary.missingBoth}`);
console.log();
console.log('Top 15 hardcoded-heavy files:');
for (const [f, c] of summary.topHardcodedFiles) console.log(`  ${c}x  ${f}`);
console.log();
console.log('Top 15 files with missing keys:');
for (const [f, c] of summary.topMissingKeysFiles) console.log(`  ${c}x  ${f}`);
console.log();
console.log(`Report: scripts/i18n-full-audit.json`);
