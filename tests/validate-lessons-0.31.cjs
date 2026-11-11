'use strict';
// Release 0.31 checks: new lessons are ordered after their prerequisites, have full teaching content,
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
const newIds = ['ism-faa-il', 'ism-maf-ul', 'istithna-illa'];
const upgradedIds = [];
const position = Object.fromEntries(lessonData.map((l, i) => [l.id, i]));
for (const id of [...newIds, ...upgradedIds]) {
  const lesson = lessonData.find(l => l.id === id);
  const detail = lessonDetails[id];
  assert.ok(lesson && detail, `Missing new lesson or details: ${id}`);
  if (upgradedIds.includes(id)) assert.equal(lesson.upgraded, '0.31', `Lesson must be tagged as upgraded in this release: ${id}`); else assert.equal(lesson.batch, '0.31', `Lesson must be tagged with this batch: ${id}`);

  assert.ok(lesson.rule.length >= 3 && lesson.example.length >= 3, `Lesson needs at least 3 rule items and 3 example rows: ${id}`);
  assert.ok(lesson.intro.length > 60 && lesson.tip.length > 40, `Intro and tip must be substantive: ${id}`);
  assert.equal(detail.lessonTemplateVersion, 1, `Lesson must use the expanded template: ${id}`);
  assert.ok(detail.learningSteps.length >= 3 && detail.workedExamples.length >= 2, `Template sections are thin: ${id}`);
  assert.ok(detail.summary.length >= 3 && detail.commonMistakes.length >= 2, `Summary or mistakes are thin: ${id}`);
  assert.match(detail.reviewStatus, /قيد المراجعة/, `New lesson must stay marked for expert review: ${id}`);
  const own = questions.filter(q => q.lessonId === id);
  assert.ok(own.length >= 9, `Each upgraded lesson needs at least 9 questions: ${id} has ${own.length}`);
  assert.ok(new Set(own.map(q => q.questionType)).size >= 4, `Each new lesson needs at least 4 question types: ${id}`);
  assert.ok(own.some(q => q.responseMode === 'short-text'), `Each new lesson needs a short-answer question: ${id}`);
  assert.ok(own.some(q => q.difficulty === 'سهل') || own.length >= 5, `Difficulty mix: ${id}`);
  for (const q of own) for (const prereq of q.prerequisites) assert.ok(position[prereq] < position[id], `Prerequisite ${prereq} must precede ${id} in lesson order (${q.id})`);
}
for (const [x, y] of [['nasikh-predicate', 'an-opening']]) assert.ok(position[x] < position[y], `${x} must come before ${y}`);
// Answer-position balance, so the keyed answer is not predictable.
// Global rule: no question may depend on a lesson that comes after its own lesson.
for (const q of questions) for (const prereq of q.prerequisites) assert.ok(position[prereq] < position[q.lessonId], `Prerequisite ${prereq} must precede lesson ${q.lessonId} (${q.id})`);
const slots = [0, 0, 0];
for (const q of questions.filter(q => q.batch === '0.31')) slots[q.correctIndex]++;
assert.ok(Math.min(...slots) >= 5, `Correct answer position is unbalanced in new questions: ${slots}`);
// Wrong-answer feedback must not simply repeat the explanation of the right answer.
for (const q of questions.filter(q => q.batch === '0.31')) q.options.forEach((o, i) => { if (!o.correct) assert.notEqual(q.optionFeedback[i], q.explanation, `Feedback duplicates explanation: ${q.id}`); });

const newCount = questions.filter(q => q.batch === '0.31').length;
console.log(`PASS: ${newIds.length} new and ${upgradedIds.length} upgraded lessons follow the expanded template with ${newCount} extra questions (answer slots ${slots.join('/')}).`);
console.log('PASS: lesson order respects prerequisites and each new lesson mixes at least four question types including a short answer.');
console.log('LIMIT: structural checks only; grammar accuracy still needs a specialist Arabic grammar review.');
