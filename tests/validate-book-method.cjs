'use strict';
// Release 0.12 checks: every lesson is reachable in the book-method layout (numbered examples, exercises).
const fs = require('node:fs'), vm = require('node:vm'), path = require('node:path'), assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const context = { window: {} };
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root, 'content.js'), 'utf8'), context, { filename: 'content.js' });
const { lessonData, lessonDetails } = context.window.IraabContent;
let fromBook = 0;
for (const l of lessonData) {
  const d = lessonDetails[l.id];
  assert.ok(d, `Missing details: ${l.id}`);
  assert.ok(Array.isArray(d.bookExamples) && d.bookExamples.length >= 6, `Lesson needs at least 6 numbered examples: ${l.id} (${(d.bookExamples || []).length})`);
  for (const x of d.bookExamples) assert.ok(x.length >= 4 && !/[A-Za-z]|\.\.\./.test(x), `Suspicious example text in ${l.id}: ${x}`);
  assert.ok(Array.isArray(d.exercises) && d.exercises.length >= 1, `Lesson needs exercises: ${l.id}`);
  for (const g of d.exercises) {
    assert.ok(g.title, `Exercise group without title: ${l.id}`);
    assert.ok(Array.isArray(g.tasks) ? g.tasks.length >= 1 : (g.items || []).length >= 1, `Empty exercise group: ${l.id} ${g.title}`);
  }
  if (d.exercisesFromBook) fromBook++;
}
console.log(`PASS: ${lessonData.length} lessons have numbered examples and exercises (${fromBook} use the book's own examples and exercises).`);
console.log('LIMIT: OCR-derived text from the book may still hold spelling or vowel slips; it needs a proofreading pass.');
