'use strict';
// Release 0.7 checks: new lessons are ordered after their prerequisites, have full teaching content,
// and have a varied, answerable question bank. Structure only; this does not certify grammar accuracy.
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const context = { window: {} };
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root, 'content.js'), 'utf8'), context, { filename: 'content.js' });
const { lessonData, lessonDetails, questions, dictionary } = context.window.IraabContent;
const newIds = ['fa-il', 'maf-ul-bih', 'fa-il-vs-maf-ul', 'verbal-sentence', 'nominal-sentence'];
const position = Object.fromEntries(lessonData.map((l, i) => [l.id, i]));
for (const id of newIds) {
  const lesson = lessonData.find(l => l.id === id);
  const detail = lessonDetails[id];
  assert.ok(lesson && detail, `Missing new lesson or details: ${id}`);
  assert.equal(lesson.batch, '0.8', `Lesson must be tagged with its release batch: ${id}`);
  assert.ok(lesson.source && /النحو الواضح/.test(lesson.source), `Lesson must cite its book source: ${id}`);
  assert.ok(lesson.rule.length >= 3 && lesson.example.length >= 3, `Lesson needs at least 3 rule items and 3 example rows: ${id}`);
  assert.ok(lesson.intro.length > 60 && lesson.tip.length > 40, `Intro and tip must be substantive: ${id}`);
  assert.equal(detail.lessonTemplateVersion, 1, `Lesson must use the expanded template: ${id}`);
  assert.ok(detail.learningSteps.length >= 3 && detail.workedExamples.length >= 2, `Template sections are thin: ${id}`);
  assert.ok(detail.summary.length >= 3 && detail.commonMistakes.length >= 2, `Summary or mistakes are thin: ${id}`);
  assert.match(detail.reviewStatus, /قيد المراجعة/, `New lesson must stay marked for expert review: ${id}`);
  const own = questions.filter(q => q.lessonId === id);
  assert.ok(own.length >= 5, `Each new lesson needs at least 5 questions: ${id} has ${own.length}`);
  assert.ok(new Set(own.map(q => q.questionType)).size >= 4, `Each new lesson needs at least 4 question types: ${id}`);
  assert.ok(own.some(q => q.responseMode === 'short-text'), `Each new lesson needs a short-answer question: ${id}`);
  assert.ok(own.some(q => q.difficulty === 'سهل') || own.length >= 5, `Difficulty mix: ${id}`);
  for (const q of own) for (const prereq of q.prerequisites) assert.ok(position[prereq] < position[id], `Prerequisite ${prereq} must precede ${id} in lesson order (${q.id})`);
}
const order = ['past-verb', 'present-verb', 'imperative-verb', 'fa-il', 'maf-ul-bih', 'fa-il-vs-maf-ul', 'verb-subject-object', 'verbal-sentence', 'subject-predicate', 'nominal-sentence'];
for (let i = 1; i < order.length; i++) assert.ok(position[order[i - 1]] < position[order[i]], `${order[i - 1]} must come before ${order[i]}`);
// Answer-position balance, so the keyed answer is not predictable.
const slots = [0, 0, 0];
for (const q of questions.filter(q => q.batch === '0.8')) slots[q.correctIndex]++;
assert.ok(Math.min(...slots) >= 5, `Correct answer position is unbalanced in new questions: ${slots}`);
// Wrong-answer feedback must not simply repeat the explanation of the right answer.
for (const q of questions.filter(q => q.batch === '0.8')) q.options.forEach((o, i) => { if (!o.correct) assert.notEqual(q.optionFeedback[i], q.explanation, `Feedback duplicates explanation: ${q.id}`); });
assert.ok(dictionary.some(d => d[0] === 'الجملة الفعلية') && dictionary.some(d => d[0] === 'الجملة الاسمية'), 'Glossary must include the new terms');
const newCount = questions.filter(q => q.batch === '0.8').length;
console.log(`PASS: ${newIds.length} new lessons follow the expanded template with ${newCount} extra questions (answer slots ${slots.join('/')}).`);
console.log('PASS: lesson order respects prerequisites and each new lesson mixes at least four question types including a short answer.');
console.log('LIMIT: structural checks only; grammar accuracy still needs a specialist Arabic grammar review.');
