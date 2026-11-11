'use strict';
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const store = new Map([['iraab-progress-v2', JSON.stringify({version:2,completedLessons:['word'],bestScore:80,lastScore:80,attempts:3,answers:{},mistakes:[],reviews:{},settings:{font:'large',contrast:false,reducedMotion:true},lastSeen:'2026-10-17',level:'تأسيس'})]]);
const nodes = new Map();
function node(sel) {
  if (!nodes.has(sel)) nodes.set(sel, { textContent: '', innerHTML: '', hidden: false, disabled: false, value: '', classList: { toggle() {} }, focus() {}, addEventListener() {} });
  return nodes.get(sel);
}
const document = {
  body: { classList: { toggle() {} } },
  querySelector: node,
  querySelectorAll: () => [],
  addEventListener() {},
};
const context = {
  console, document, localStorage: { getItem: k => store.get(k) ?? null, setItem: (k,v) => store.set(k,String(v)), removeItem: k => store.delete(k) },
  navigator: {}, location: { protocol: 'file:', hostname: '' }, window: { addEventListener() {}, scrollTo() {} },
  Intl, Date, Math, JSON, Array, Object, String, Number, Boolean, RegExp, Error, setTimeout, clearTimeout,
  Blob: function(){}, URL: { createObjectURL(){return '';}, revokeObjectURL(){} }, alert(){}, confirm(){return true},
};
context.window.IraabContent = {};
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root,'content.js'),'utf8'), context, {filename:'content.js'});
vm.runInContext(fs.readFileSync(path.join(root,'app.js'),'utf8'), context, {filename:'app.js'});
const html = node('#view').innerHTML;
assert.ok(html.includes('افهم القاعدة، ثم طبّقها'), 'Initial home screen should render on startup');
assert.ok(html.includes('تابع التعلّم'), 'Home screen should include the next-learning action');
const saved = JSON.parse(store.get('iraab-progress-v2'));
assert.equal(saved.version, 3, 'State should be saved using current schema');
assert.ok(saved.completedLessons.includes('word'), 'Existing completed lesson should survive schema migration');
assert.equal(saved.bestScore, 80, 'Existing best score should survive schema migration');
assert.ok(node('#headerProgress').textContent.includes('٪'), 'Header progress should be initialized');
console.log('PASS: app.js initializes without a DOM runtime exception and renders the home screen.');
console.log('PASS: local progress state initializes, migrates v2 to v3 without losing completion or best score, and updates the header.');
console.log('LIMIT: event interactions and real browser storage remain to be tested on a browser/device.');
