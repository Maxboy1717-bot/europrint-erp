/**
 * A4 FS-PROOF: /api/upload write path (mirrors uploadFile: write to UPLOADS_DIR/lessons/<key>).
 * Write a test file -> confirm on disk + readable -> cleanup. (Upload writes where storage serves:
 * both use path.resolve(process.cwd(), 'uploads'), so GET /api/storage/<key> serves it.)
 */
const fs = require('fs');
const path = require('path');
const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');
const key = 'lessons/__A4_PROOF__-test.txt';
const dest = path.join(UPLOADS_DIR, key);
try {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, Buffer.from('A4 proof content'));
  console.log('1) WROTE    :', key, '->', fs.existsSync(dest) ? 'EXISTS on disk' : 'MISSING');
  console.log('2) READBACK :', JSON.stringify(fs.readFileSync(dest, 'utf8')), '(servable at /api/storage/' + key + ')');
  fs.unlinkSync(dest);
  console.log('3) CLEANUP  :', fs.existsSync(dest) ? 'STILL EXISTS (bad)' : 'removed (gone)');
} catch (e) { console.error('ERROR:', e.message); process.exitCode = 1; }
