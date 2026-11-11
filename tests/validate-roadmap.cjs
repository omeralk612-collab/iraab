const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const map = fs.readFileSync(path.join(root, 'curriculum-map.md'), 'utf8');
const plan = fs.readFileSync(path.join(root, 'PLAN.md'), 'utf8');
const teaching = fs.readFileSync(path.join(root, 'TEACHING-DESIGN.md'), 'utf8');
const sources = fs.readFileSync(path.join(root, 'SOURCES-AND-RESEARCH.md'), 'utf8');
const lessonRows = map.split(/\r?\n/).filter(line => /^\| [A-K]\d{2} \|/.test(line));
const ids = lessonRows.map(line => line.split('|')[1].trim());
const unique = new Set(ids);
if (lessonRows.length < 70) throw new Error(`Expected at least 70 mapped lessons; found ${lessonRows.length}`);
if (unique.size !== ids.length) throw new Error('Duplicate lesson IDs found in curriculum-map.md');
for (const line of lessonRows) {
  const cols = line.split('|').map(x => x.trim());
  if (cols.length !== 7) throw new Error(`Malformed lesson row: ${line}`);
  if (!cols[2] || !cols[3] || !cols[4] || !cols[5]) throw new Error(`Missing lesson metadata: ${line}`);
}
for (const token of ['المتطلبات السابقة', 'ناتج التعلم', 'حالة']) {
  if (!map.includes(token)) throw new Error(`Missing curriculum field: ${token}`);
}
for (const token of ['التغذية الراجعة', 'أمثلة كثيرة', 'المراجعة المتباعدة', 'لا ننسخ', 'اختبار تجربة الطالب']) {
  if (!teaching.includes(token)) throw new Error(`Missing teaching design principle: ${token}`);
}
for (const token of ['aljazeera.net', 'teachingenglish.org.uk', 'nature.com', 'aleph.edinum.org', 'لم يُعتمد كل شرح']) {
  if (!sources.includes(token)) throw new Error(`Missing source or limitation note: ${token}`);
}
if (!plan.includes('الحالة: مكتملة كخريطة بحثية أولية')) throw new Error('PLAN.md does not record phase 1 status');
console.log(`PASS: ${lessonRows.length} mapped lessons with unique IDs, prerequisites, learning outcomes, and status.`);
console.log('PASS: teaching-design and source-boundary checks.');
