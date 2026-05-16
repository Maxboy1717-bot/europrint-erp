const FIELDS = ['label', 'name', 'title', 'description'];
const reD = new RegExp(`\\b(${FIELDS.join('|')})(\\s*:\\s*)(")([^"\\n\\r]{2,})"`, 'g');
const reS = new RegExp(`\\b(${FIELDS.join('|')})(\\s*:\\s*)(')([^'\\n\\r]{2,})'`, 'g');
const test = `title: "Trening va o'quv materiallar", description: "Kerakli ko'nikmalar o'rganish"`;
console.log('input:', test);
console.log('reD:', reD);
let m;
while ((m = reD.exec(test))) console.log('  match-D:', JSON.stringify(m[0]), '| text:', m[4]);
while ((m = reS.exec(test))) console.log('  match-S:', JSON.stringify(m[0]), '| text:', m[4]);
