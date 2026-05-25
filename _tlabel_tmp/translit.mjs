// Deterministic Uzbek Latin -> Cyrillic transliterator.
// Handles digraphs first, then single letters, then case-preservation.
// Preserves digits, punctuation, ASCII placeholders, glossary tokens (heuristic).
//
// Coverage rules:
//   sh → ш, Sh → Ш, SH → Ш
//   ch → ч, Ch → Ч, CH → Ч
//   yo → ё, Yo → Ё, YO → Ё
//   yu → ю, Yu → Ю, YU → Ю
//   ya → я, Ya → Я, YA → Я
//   ts → ц
//   o' / o‘ / oʻ → ў ; O' → Ў
//   g' / g‘ / gʻ → ғ ; G' → Ғ
//   q → қ, Q → Қ
//   x → х, X → Х
//   h → ҳ, H → Ҳ
//   ng (word-final) → нг (kept literal — Cyrillic Uzbek keeps нг)
// Single letters mirror Latin→Cyrillic 1:1.

const DIGRAPHS = [
  // apostrophe variants for o' / g'
  ['oʻ', 'ў'], ['o‘', 'ў'], ['o’', 'ў'], ["o'", 'ў'], ['o`', 'ў'],
  ['gʻ', 'ғ'], ['g‘', 'ғ'], ['g’', 'ғ'], ["g'", 'ғ'], ['g`', 'ғ'],
  ['Oʻ', 'Ў'], ['O‘', 'Ў'], ['O’', 'Ў'], ["O'", 'Ў'], ['O`', 'Ў'],
  ['Gʻ', 'Ғ'], ['G‘', 'Ғ'], ['G’', 'Ғ'], ["G'", 'Ғ'], ['G`', 'Ғ'],
  // common digraphs
  ['sh', 'ш'], ['Sh', 'Ш'], ['SH', 'Ш'],
  ['ch', 'ч'], ['Ch', 'Ч'], ['CH', 'Ч'],
  ['yo', 'ё'], ['Yo', 'Ё'], ['YO', 'Ё'],
  ['yu', 'ю'], ['Yu', 'Ю'], ['YU', 'Ю'],
  ['ya', 'я'], ['Ya', 'Я'], ['YA', 'Я'],
  ['ts', 'ц'], ['Ts', 'Ц'], ['TS', 'Ц'],
];

const SINGLES = {
  a:'а', b:'б', c:'к', d:'д', e:'е', f:'ф', g:'г', h:'ҳ', i:'и', j:'ж',
  k:'к', l:'л', m:'м', n:'н', o:'о', p:'п', q:'қ', r:'р', s:'с', t:'т',
  u:'у', v:'в', w:'в', x:'х', y:'й', z:'з',
  A:'А', B:'Б', C:'К', D:'Д', E:'Е', F:'Ф', G:'Г', H:'Ҳ', I:'И', J:'Ж',
  K:'К', L:'Л', M:'М', N:'Н', O:'О', P:'П', Q:'Қ', R:'Р', S:'С', T:'Т',
  U:'У', V:'В', W:'В', X:'Х', Y:'Й', Z:'З',
};

// "tutuq belgisi" — preserved ' inside words like "ma'lum" → "маълум"
// Simplification: ' between two letters → 'ъ' (hard sign). At word boundaries → drop.
function handleTutuq(s) {
  // Replace U+2019/U+2018/' between letters with ъ.
  return s.replace(/([a-zA-Zа-яА-ЯёЁўЎқҚғҒҳҲ])['‘’ʼʻ]([a-zA-Zа-яА-ЯёЁўЎқҚғҒҳҲ])/g, '$1ъ$2');
}

// Glossary tokens are kept as-is (no transliteration).
const GLOSSARY = new Set([
  'EBITDA','JSHD','INPS','ZPL','BAT','EuroPrint','MacBook','iPad',
  'Instagram','Facebook','Telegram','WhatsApp','LinkedIn','GitHub','GitLab',
  'Google','OpenStreetMap','GPS','GPT','OpenAI','Yandex','Claude',
  'AI','ML','NLP','OCR','PDF','CSV','JSON','XML','API','URL','HTTP','HTTPS',
  'REST','GraphQL','WebSocket','JWT','OAuth','SSO','MFA','2FA','OTP',
  'KPI','OKR','MRP','ERP','CRM','WMS','MES','HR','BI','IoT','IT',
  'OEE','FIFO','LIFO','FEFO','ABC','FMCG','B2B','B2C','B2G','SLA','NPS',
  'ROI','CAC','LTV','MAU','DAU','SaaS','PaaS','IaaS',
]);

function transliterateToken(token) {
  if (GLOSSARY.has(token)) return token;
  // If token is all uppercase ASCII letters of length >= 2, keep as-is (likely acronym)
  if (/^[A-Z]{2,}$/.test(token)) return token;
  let s = token;
  // Apply digraphs first
  for (const [from, to] of DIGRAPHS) {
    s = s.split(from).join(to);
  }
  // Tutuq belgisi
  s = handleTutuq(s);
  // Drop remaining standalone apostrophes that are not letters (already-handled in digraphs above)
  s = s.replace(/['‘’ʼʻ]/g, '');
  // Single letters
  let out = '';
  for (const ch of s) {
    if (SINGLES[ch] !== undefined) out += SINGLES[ch];
    else out += ch;
  }
  return out;
}

export function translitLatToCyr(input) {
  if (typeof input !== 'string') return input;
  if (!input) return input;
  // Split on whitespace + punctuation boundaries, transliterate words only.
  // Token = run of [A-Za-z'’‘ʻʼ]+; everything else passes through.
  return input.replace(/[A-Za-z'’‘ʻʼ]+/g, (m) => transliterateToken(m));
}

// CLI smoke test (always runs when invoked directly)
const argv1 = (process.argv[1] || '').replace(/\\/g, '/');
if (import.meta.url.endsWith(argv1.split('/').pop())) {
  const tests = [
    "O'zbekcha",
    "Tavsif (ixtiyoriy)",
    "Kunlik Faollik (So'nggi 7 kun)",
    "Buzilishlar",
    "Ma'lumot yo'q",
    "EuroPrint ERP — KPI Dashboard",
    "Sotuvlar va xizmatlar",
    "Tashkilot tuzilmasi",
    "Ishchi qo'shish",
    "Ish haqi to'lash",
  ];
  for (const t of tests) {
    console.log(t.padEnd(40), '→', translitLatToCyr(t));
  }
}
