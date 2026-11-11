'use strict';
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const context = { window: {} };
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root, 'content.js'), 'utf8'), context, { filename: 'content.js' });
const content = context.window.IraabContent;
const required = ['word', 'subject-predicate', 'prepositions'];
for (const id of required) {
  const lesson = content.lessonData.find(item => item.id === id);
  const detail = content.lessonDetails[id];
  assert.ok(lesson, `Missing sample lesson: ${id}`);
  assert.ok(detail, `Missing detail object: ${id}`);
  assert.equal(detail.lessonTemplateVersion, 1, `Wrong template version: ${id}`);
  assert.ok(detail.sentenceExplanation && detail.sentenceExplanation.length > 30, `Missing sentence meaning: ${id}`);
  assert.ok(Array.isArray(detail.fullParse) && detail.fullParse.length >= 2, `Missing full parse: ${id}`);
  assert.ok(Array.isArray(detail.learningSteps) && detail.learningSteps.length >= 3, `Need at least 3 learning steps: ${id}`);
  assert.ok(Array.isArray(detail.workedExamples) && detail.workedExamples.length >= 2, `Need at least 2 worked examples: ${id}`);
  for (const [index, example] of detail.workedExamples.entries()) {
    assert.ok(example.sentence && example.meaning, `Missing sentence/meaning in ${id} example ${index + 1}`);
    assert.ok(Array.isArray(example.parse) && example.parse.length >= 2, `Incomplete parse in ${id} example ${index + 1}`);
    for (const row of example.parse) assert.ok(row[0] && row[1], `Incomplete parse row in ${id} example ${index + 1}`);
  }
  assert.ok(detail.guidedPractice?.prompt && detail.guidedPractice?.hint && detail.guidedPractice?.answer && detail.guidedPractice?.explanation, `Incomplete guided practice: ${id}`);
  assert.ok(Array.isArray(detail.summary) && detail.summary.length >= 2, `Missing lesson summary: ${id}`);
  assert.ok(Array.isArray(detail.commonMistakes) && detail.commonMistakes.length >= 1, `Missing common mistakes: ${id}`);
  assert.match(detail.reviewStatus, /قيد المراجعة/, `Content must not be marked as expert-approved: ${id}`);
}
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
assert.ok(app.includes('function lessonExtensions(d,part)'), 'Reusable lesson template renderer is missing');
assert.ok(app.includes("lessonExtensions(d,k)"), 'Lesson renderer does not include template extensions');
for (const cls of ['lesson-extension', 'learning-step', 'worked-example', 'guided-help', 'summary-box', 'common-errors']) {
  assert.ok(css.includes(`.${cls}`), `Missing styles for .${cls}`);
}
console.log('PASS: 3 varied sample lessons follow the structured teaching template.');
console.log('PASS: each sample has context, full parse, 2 worked examples, guided practice, summary, and common misconceptions.');
console.log('PASS: template renderer and responsive styles are present; review status remains explicit.');
console.log('LIMIT: structural checks do not replace expert grammar review or browser/device testing.');
