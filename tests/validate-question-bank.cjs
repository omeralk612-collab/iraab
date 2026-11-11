'use strict';
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const context = { window: {} };
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root, 'content.js'), 'utf8'), context, { filename: 'content.js' });
const { questions, lessonData } = context.window.IraabContent;
const ids = new Set();
const types = new Set();
const difficulties = new Set();
for (const q of questions) {
  assert.ok(q.id && !ids.has(q.id), `Missing or duplicate question ID: ${q.id}`);
  ids.add(q.id);
  assert.ok(lessonData.some(l => l.id === q.lessonId), `Question points to unknown lesson: ${q.id}`);
  assert.ok(q.skill && q.questionType && q.difficulty && Array.isArray(q.prerequisites), `Missing classification metadata: ${q.id}`);
  assert.ok(['سهل', 'متوسط', 'متقدم'].includes(q.difficulty), `Unknown difficulty: ${q.id}`);
  types.add(q.questionType);
  difficulties.add(q.difficulty);
  assert.ok(Array.isArray(q.options) && q.options.length >= 3, `Insufficient options: ${q.id}`);
  assert.equal(q.options.filter(o => o.correct).length, 1, `Question must have exactly one correct option: ${q.id}`);
  assert.equal(q.correctIndex, q.options.findIndex(o => o.correct), `correctIndex mismatch: ${q.id}`);
  assert.ok(q.explanation && q.explanation.length > 15, `Missing answer explanation: ${q.id}`);
  assert.ok(Array.isArray(q.optionFeedback) && q.optionFeedback.length === q.options.length, `Missing option feedback: ${q.id}`);
  q.options.forEach((option, i) => {
    if (!option.correct) assert.ok(q.optionFeedback[i] && q.optionFeedback[i].length > 5, `Missing wrong-answer feedback: ${q.id}, option ${i}`);
  });
  for (const prereq of q.prerequisites) {
    assert.ok(lessonData.some(l => l.id === prereq), `Unknown prerequisite ${prereq} on ${q.id}`);
    assert.notEqual(prereq, q.lessonId, `Question must not list its own lesson as a prerequisite: ${q.id}`);
  }
  assert.match(q.reviewStatus, /قيد المراجعة/, `Question must remain marked for review: ${q.id}`);
}
assert.ok(questions.length >= 38, `Expected expanded question bank; found ${questions.length}`);
assert.ok(types.size >= 6, `Expected multiple question types; found ${types.size}`);
assert.ok(difficulties.size >= 2, 'Expected more than one difficulty level');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
assert.ok(app.includes('ما الذي ينبغي مراجعته؟'), 'Wrong-answer feedback should include a diagnostic explanation');
console.log(`PASS: ${questions.length} questions have unique IDs, lesson links, prerequisites, difficulty, and type.`);
console.log(`PASS: ${types.size} question types and ${difficulties.size} difficulty levels are represented.`);
console.log('PASS: each question has exactly one correct option, a general explanation, and feedback for every wrong option.');
console.log('LIMIT: automated structure checks do not certify grammar accuracy or prove that distractors work well with students.');
