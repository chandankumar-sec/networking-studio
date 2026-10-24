// Run: node tests/content.test.js  -- validates curriculum data structure.
const fs = require('fs'), assert = require('assert');
global.Studio = { modules: [], plan: [], assignments: {}, tools: [] };
for (const f of ['helpers', 'm1-foundations', 'm2-addressing', 'm3-protocols', 'm4-devices', 'm5-tools', 'm6-security', 'assignments', 'plan', 'tools'])
  eval(fs.readFileSync(__dirname + '/../js/data/' + f + '.js', 'utf8'));
const S = Studio;
const widgetTypes = new Set(['home','seq','cards','table','bits','subnet','subnetquiz','encap','route','topo','firewall','capture','capchallenge','pingtrace','nmapsim','http','decision','portgame','tcpwin','ospf','vlsm','bandwidth']);
let steps = 0, qs = 0;
S.modules.forEach(m => {
  assert.ok(S.assignments[m.id] && S.assignments[m.id].length >= 2, 'assignments for ' + m.id);
  const ids = new Set();
  m.steps.forEach(s => {
    steps++;
    assert.ok(!ids.has(s.id), 'duplicate step id ' + m.id + '/' + s.id); ids.add(s.id);
    assert.ok(s.title && s.sub && s.explain && s.explain.length, 'content ' + s.id);
    assert.ok(widgetTypes.has(s.widget.type), 'widget type ' + s.widget.type + ' in ' + s.id);
    assert.ok(s.recap && s.recap.length >= 3, 'recap ' + s.id);
    assert.ok(s.terms && s.terms.length >= 2, 'terms ' + s.id);
    assert.ok(s.quiz && s.quiz.length >= 3, 'quiz count ' + s.id);
    s.quiz.forEach(q => { qs++; assert.ok(q.o.length >= 3 && q.a >= 0 && q.a < q.o.length && q.why, 'quiz item in ' + s.id + ': ' + q.q); });
    const txt = JSON.stringify(s);
    assert.ok(!/[\u0900-\u097F]/.test(txt), 'Devanagari text in ' + s.id);
  });
});
S.plan.forEach(w => w.days.forEach(d => { if (d[1]) { const [mid, i] = d[1].split('/'); const m = S.modules.find(x => x.id === mid); assert.ok(m && m.steps[+i], 'plan ref ' + d[1]); } }));
assert.strictEqual(S.plan.reduce((a, w) => a + w.days.length, 0), 90, 'plan has 90 days');
S.tools.forEach(t => assert.ok(widgetTypes.has(t.widget.type), 'tool widget ' + t.id));
S.modules.forEach(m => S.assignments[m.id].forEach(a => assert.ok(a.id && a.title && a.tasks.length >= 3, 'assignment ' + a.id)));
console.log('content ok:', S.modules.length, 'modules,', steps, 'lessons,', qs, 'quiz questions,', Object.values(S.assignments).flat().length, 'assignments');
