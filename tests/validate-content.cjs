'use strict';
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = require('node:path').resolve(__dirname, '..');
const context = { window: {} };
vm.runInNewContext(fs.readFileSync(`${root}/content.js`, 'utf8'), context, { filename: 'content.js' });
const { lessonData, questions, dictionary, lessonDetails } = context.window.IraabContent;
const ids = xs => xs.map(x => x.id);
assert.equal(lessonData.length, 106, 'Expected 106 lessons in release 0.39');
assert.ok(questions.length >= 25, 'Expected at least 25 questions');
assert.equal(new Set(ids(lessonData)).size, lessonData.length, 'Lesson IDs must be unique');
assert.equal(new Set(ids(questions)).size, questions.length, 'Question IDs must be unique');
const lessonIds = new Set(ids(lessonData));
for (const lesson of lessonData) {
  assert.ok(lesson.title && lesson.goal && lesson.prereq && lesson.intro && lesson.tip, `Incomplete lesson: ${lesson.id}`);
  assert.ok(Array.isArray(lesson.rule) && lesson.rule.length > 0, `Missing rule in ${lesson.id}`);
  assert.ok(Array.isArray(lesson.example) && lesson.example.length > 0, `Missing worked example in ${lesson.id}`);
  assert.equal(lesson.opts.length, 3, `Expected three lesson check options: ${lesson.id}`);
  assert.ok(lesson.correct >= 0 && lesson.correct < lesson.opts.length, `Invalid lesson answer: ${lesson.id}`);
}
for (const q of questions) {
  assert.ok(lessonIds.has(q.lessonId), `Question ${q.id} references unknown lesson ${q.lessonId}`);
  assert.ok(q.prompt && q.sentence && q.explanation, `Question ${q.id} is missing core text`);
  assert.ok(Array.isArray(q.options) && q.options.length >= 2, `Question ${q.id} has too few options`);
  assert.equal(q.options.filter(o => o.correct).length, 1, `Question ${q.id} must have exactly one keyed answer`);
  assert.equal(q.options[q.correctIndex]?.correct, true, `Question ${q.id} has inconsistent correctIndex`);
  assert.ok(q.source && q.reviewStatus && q.gradeScope && q.misconception, `Question ${q.id} is missing audit metadata`);
}
assert.ok(dictionary.length >= 10, 'Glossary should contain foundational terms');
assert.equal(Object.keys(lessonDetails).length, lessonData.length, 'Every lesson must have a contextual explanation and full parse');
for (const lesson of lessonData) {
  const detail = lessonDetails[lesson.id];
  assert.ok(detail && detail.sentenceExplanation, `Missing whole-example explanation: ${lesson.id}`);
  assert.ok(Array.isArray(detail.fullParse) && detail.fullParse.length >= 2, `Missing full parse: ${lesson.id}`);
  for (const row of detail.fullParse) assert.ok(row[0] && row[1], `Incomplete full parse row in ${lesson.id}`);
}
assert.ok(lessonDetails.word.fullParse.some(row => row[0].includes('الجملة الفعلية') && row[1].includes('في محل رفع خبر')), 'The word lesson must parse the verbal sentence functioning as predicate');
assert.ok(lessonDetails.pronouns.fullParse.some(row => row[0].includes('الجملة الفعلية') && row[1].includes('في محل رفع خبر')), 'The pronouns lesson must parse the verbal sentence functioning as predicate');
console.log(`PASS: ${lessonData.length} lessons, ${questions.length} questions, ${dictionary.length} glossary terms.`);
console.log('PASS: unique IDs, lesson references, required lesson fields, one keyed answer per question, metadata.');
console.log(`PASS: ${Object.keys(lessonDetails).length} whole-example explanations and full-parse blocks.`);
console.log('LIMIT: this script validates data structure, not expert grammar correctness or live browser/PWA behavior.');
