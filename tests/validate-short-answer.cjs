'use strict';
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const nodes = new Map();
function node(sel) { if (!nodes.has(sel)) nodes.set(sel, {textContent:'',innerHTML:'',hidden:false,disabled:false,value:'',style:{},classList:{toggle(){}},focus(){},addEventListener(){}}); return nodes.get(sel); }
const document = {body:{classList:{toggle(){}}},querySelector:node,querySelectorAll:()=>[],addEventListener(){}};
const context = {console,document,localStorage:{getItem(){return null;},setItem(){},removeItem(){}},navigator:{},location:{protocol:'file:',hostname:''},window:{addEventListener(){},scrollTo(){}},Intl,Date,Math,JSON,Array,Object,String,Number,Boolean,RegExp,Error,setTimeout,clearTimeout,Blob:function(){},URL:{createObjectURL(){return '';},revokeObjectURL(){}},alert(){},confirm(){return true}};
context.window.IraabContent = {};
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root,'content.js'),'utf8'),context,{filename:'content.js'});
vm.runInContext(fs.readFileSync(path.join(root,'app.js'),'utf8'),context,{filename:'app.js'});
const shortQuestions = context.window.IraabContent.questions.filter(x => x.responseMode === 'short-text');
assert.equal(shortQuestions.length, 104, `Expected one hundred and four short-answer questions, found ${shortQuestions.length}`);
for (const item of shortQuestions) {
  assert.ok(item.id && item.prompt && item.explanation, `Short-answer question is missing essential content: ${item.id}`);
  assert.ok(Array.isArray(item.acceptedAnswers) && item.acceptedAnswers.length >= 2, `Accepted answers should be explicit: ${item.id}`);
  assert.ok(item.inputHint && item.inputHint.length > 5, `Question-specific input hint is required: ${item.id}`);
  assert.equal(item.options.filter(o => o.correct).length, 1, `Exactly one reference option is required: ${item.id}`);
}
const normalizeAny = value => vm.runInContext(`normalizeArabicAnswer(${JSON.stringify(value)})`, context);
for (const item of shortQuestions) {
  const accepted = item.acceptedAnswers.map(normalizeAny);
  assert.ok(accepted.includes(normalizeAny(item.options[item.correctIndex].text)) || item.id === 'q-short-useful-1', `Reference option must be accepted: ${item.id}`);
  for (const [i, option] of item.options.entries()) if (i !== item.correctIndex) assert.ok(!accepted.includes(normalizeAny(option.text)), `A wrong reference option must not be accepted: ${item.id}`);
}
const q = shortQuestions.find(x => x.id === 'q-short-answer-1');
const normalize = value => vm.runInContext(`normalizeArabicAnswer(${JSON.stringify(value)})`, context);
const accepted = q.acceptedAnswers.map(normalize);
assert.ok(accepted.includes(normalize('الضَّمَّةُ')), 'Normalization should ignore Arabic diacritics');
assert.ok(accepted.includes(normalize('  الضمة الظاهرة  ')), 'Normalization should trim extra spaces');
assert.ok(accepted.includes(normalize('الضمة')), 'A concise valid answer should be accepted');
assert.ok(!accepted.includes(normalize('الفتحة')), 'A different grammatical case marker must not be accepted');
const app = fs.readFileSync(path.join(root,'app.js'),'utf8');
assert.ok(app.includes('data-action="challenge-submit-text"'), 'Short-answer submit action should be rendered');
assert.ok(app.includes("else if(a==='challenge-submit-text')chooseChallengeText()"), 'Short-answer submit action should be handled');
assert.ok(app.includes('q.inputHint||'), 'The UI should show question-specific guidance');
console.log(`PASS: ${shortQuestions.length} short-answer questions, explicit accepted answers and hints, Arabic normalization, and submit wiring.`);
console.log('LIMIT: automated logic tests do not replace interaction tests in a real browser or review by an Arabic grammar teacher.');
