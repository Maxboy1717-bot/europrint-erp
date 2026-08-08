/* Scoped i18n insert — only PP Phase 1 (TechCardsMaster.*) keys into common.json (uz/ru/uz-cyr). Idempotent. */
import fs from 'fs';
import path from 'path';

const LOC = path.join('artifacts', 'erp-dashboard', 'src', 'locales');
// key → [uz, ru, uz-cyr]
const K = {
  'yangiTexkarta':                  ["Yangi texkarta", "Новая техкарта", "Янги техкарта"],
  'TechCardsMaster.yangiTexkarta':  ["Yangi texkarta (master)", "Новая техкарта (мастер)", "Янги техкарта (мастер)"],
  'TechCardsMaster.maketTasdiq':    ["Maket tasdiqlangan", "Макет утверждён", "Макет тасдиқланган"],
  'TechCardsMaster.maketKutil':     ["Maket kutilmoqda", "Макет ожидается", "Макет кутилмоқда"],
  'TechCardsMaster.labTasdiq':      ["Lab tasdiqlangan", "Лаб. утверждено", "Лаб тасдиқланган"],
  'TechCardsMaster.labKutil':       ["Lab kutilmoqda", "Лаб. ожидается", "Лаб кутилмоқда"],
  'TechCardsMaster.materialBor':    ["Material (BOM) bor", "Материал (BOM) есть", "Материал (BOM) бор"],
  'TechCardsMaster.materialYoq':    ["Material kiritilmagan", "Материал не указан", "Материал киритилмаган"],
  'TechCardsMaster.versiyaYoq':     ["Versiya tarixi hali yo'q", "Истории версий пока нет", "Версия тарихи ҳали йўқ"],
  'TechCardsMaster.bom':            ["Materiallar (BOM)", "Материалы (BOM)", "Материаллар (BOM)"],
  'TechCardsMaster.bomYoq':         ["BOM qatori yo'q", "Нет строк BOM", "BOM қатори йўқ"],
  'TechCardsMaster.materialKodi':   ["Material kodi", "Код материала", "Материал коди"],
  'TechCardsMaster.miqdor':         ["Miqdor", "Количество", "Миқдор"],
  'TechCardsMaster.marshrut':       ["Marshrut (operatsiyalar)", "Маршрут (операции)", "Маршрут (операциялар)"],
  'TechCardsMaster.marshrutYoq':    ["Marshrut qatori yo'q", "Нет строк маршрута", "Маршрут қатори йўқ"],
  'TechCardsMaster.operatsiya':     ["Operatsiya", "Операция", "Операция"],
  'TechCardsMaster.norma':          ["Norma/soat", "Норма/час", "Норма/соат"],
  'TechCardsMaster.kod':            ["Kod", "Код", "Код"],
  'TechCardsMaster.nomi':           ["Nomi *", "Название *", "Номи *"],
  'TechCardsMaster.yonalish':       ["Yo'nalish", "Направление", "Йўналиш"],
  'TechCardsMaster.materialTuri':   ["Material turi", "Тип материала", "Материал тури"],
  'TechCardsMaster.mahsulotTuri':   ["Mahsulot turi", "Тип продукции", "Маҳсулот тури"],
  'TechCardsMaster.formatKodi':     ["Format kodi", "Код формата", "Формат коди"],
  'TechCardsMaster.formatA':        ["Format A (mm)", "Формат A (мм)", "Формат A (мм)"],
  'TechCardsMaster.formatB':        ["Format B (mm)", "Формат B (мм)", "Формат B (мм)"],
  'TechCardsMaster.gofraProfil':    ["Gofra profil", "Профиль гофры", "Гофра профил"],
  'TechCardsMaster.chiqindiFoiz':   ["Chiqindi %", "Отходы %", "Чиқинди %"],
  'TechCardsMaster.saqlash':        ["Saqlash", "Сохранить", "Сақлаш"],
  'TechCardsMaster.versiyaTarixi':  ["Versiya tarixi", "История версий", "Версия тарихи"],
  'TechCardsMaster.maketTasdiqla':  ["Maket", "Макет", "Макет"],
  'TechCardsMaster.labTasdiqla':    ["Lab", "Лаб", "Лаб"],
};
const langs = ['uz', 'ru', 'uz-cyr'];
const idx = { 'uz': 0, 'ru': 1, 'uz-cyr': 2 };
let report = {};
for (const lang of langs) {
  const p = path.join(LOC, lang, 'common.json');
  const j = JSON.parse(fs.readFileSync(p, 'utf8'));
  let added = 0;
  for (const [k, vals] of Object.entries(K)) {
    if (j[k] === undefined) { j[k] = vals[idx[lang]]; added++; }
  }
  fs.writeFileSync(p, JSON.stringify(j, null, 2) + '\n');
  report[lang] = added;
}
console.log('added per lang:', JSON.stringify(report));
