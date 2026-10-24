/* Pages: module final exam, assignments, flashcard review, and the learning journal. */
(function () {
  'use strict';
  const { h, state, save, $ } = Studio;
  const P = Studio.pages;
  const fmt = t => new Date(t).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });

  /* ---------- final exam ---------- */
  P.exam = function (page, route) {
    const m = route.m, mi = Studio.modules.indexOf(m);
    const pool = [];
    m.steps.forEach(s => (s.quiz || []).forEach(q => pool.push(q)));
    const size = Math.min(Studio.EXAM_SIZE, pool.length);
    const rec = state.exam[m.id];
    page.append(
      h('div', { class: 'eyebrow' }, m.title + ' / final exam'),
      h('h1', { class: 'title' }, 'Final exam'),
      h('p', { class: 'lead' }, size + ' random questions from every lesson in this module. You need ' + Math.ceil(Studio.PASS_EXAM * size) + ' correct to pass. Each attempt picks a fresh set of questions.'));
    if (rec) page.append(h('div', { class: 'status ' + (rec.passed ? 'ok' : ''), style: { margin: '12px 0' } }, 'Best score: ' + rec.best + ' / ' + rec.total + ' · Attempts: ' + rec.attempts + (rec.passed ? ' · Passed ✓' : '')));
    const holder = h('div');
    page.append(h('div', { class: 'card' }, h('div', { class: 'cardbody' }, holder)));
    Studio.runQuiz(holder, {
      getQuestions: () => Studio.shuffle(pool).slice(0, size), passFrac: Studio.PASS_EXAM,
      onDone: r => {
        const prev = state.exam[m.id] || { best: 0, attempts: 0, passed: false };
        state.exam[m.id] = { best: Math.max(prev.best, r.score), total: r.total, attempts: prev.attempts + 1, passed: prev.passed || r.passed };
        Studio.activity(); save(); Studio.refreshNav();
        if (r.passed) {
          Studio.toast('Exam passed!');
          holder.append(h('div', { class: 'row', style: { marginTop: '10px' } }, nextAfter(m, mi)));
        }
      }
    });
  };
  function nextAfter(m, mi) {
    if (!Studio.assignDone(m)) return h('a', { class: 'btn primary', href: '#/assign/' + m.id, style: { textDecoration: 'none' } }, 'Finish assignments →');
    const nm = Studio.modules[mi + 1];
    return nm ? h('a', { class: 'btn primary', href: '#/m/' + nm.id + '/0', style: { textDecoration: 'none' } }, 'Start next module: ' + nm.title + ' →') : h('a', { class: 'btn primary', href: '#/journal', style: { textDecoration: 'none' } }, 'Open my journal →');
  }

  /* ---------- assignments ---------- */
  P.assign = function (page, route) {
    const m = route.m, mi = Studio.modules.indexOf(m);
    const list = Studio.assignList(m);
    page.append(
      h('div', { class: 'eyebrow' }, m.title + ' / assignments'),
      h('h1', { class: 'title' }, 'Assignments'),
      h('p', { class: 'lead' }, 'Do the tasks yourself, tick each one, and write what you saw in your own words. There is no teacher grading this. The goal is to prove to yourself that you can do it. Your answers are saved in this browser and go into your journal.'));
    if (!list.length) page.append(h('div', { class: 'callout' }, 'No assignments for this module.'));
    list.forEach((a, ai) => {
      const rec = state.assign[a.id] || { checks: [], answer: '', submitted: null };
      state.assign[a.id] = rec;
      const msg = h('div');
      const ta = h('textarea', { class: 'in notes', rows: 8, placeholder: a.placeholder || 'Write what you did and what you observed. Paste command output if you have it.' });
      ta.value = rec.answer || '';
      ta.addEventListener('input', () => { rec.answer = ta.value; save(); });
      const checks = a.tasks.map((t, ti) => {
        const cb = h('input', { type: 'checkbox', checked: rec.checks[ti] ? true : null, onchange: e => { rec.checks[ti] = e.target.checked; save(); } });
        return h('label', { class: 'task' }, cb, h('span', { html: t }));
      });
      const stat = h('span', { class: 'muted' }, rec.submitted ? 'Submitted ' + fmt(rec.submitted) : 'Not submitted yet');
      const submit = h('button', { class: 'btn primary', onclick: () => {
        msg.innerHTML = '';
        const missing = a.tasks.filter((_, i) => !rec.checks[i]).length;
        if (missing) return msg.append(h('div', { class: 'status bad' }, 'Tick all tasks first (' + missing + ' left).'));
        if ((rec.answer || '').trim().length < (a.minChars || 60)) return msg.append(h('div', { class: 'status bad' }, 'Write a bit more. At least ' + (a.minChars || 60) + ' characters about what you did and saw.'));
        rec.submitted = Date.now(); save(); Studio.activity(); Studio.refreshNav();
        stat.textContent = 'Submitted ' + fmt(rec.submitted);
        msg.append(h('div', { class: 'status ok' }, 'Submitted ✓. You can edit and submit again any time.'));
        if (Studio.assignDone(m)) msg.append(h('div', { class: 'row', style: { marginTop: '10px' } }, nextAfter(m, mi)));
      } }, rec.submitted ? 'Submit again' : 'Submit assignment');
      page.append(h('div', { class: 'card', style: { marginBottom: '18px' } }, h('div', { class: 'cardbody' },
        h('div', { class: 'eyebrow' }, 'Assignment ' + (ai + 1) + ' of ' + list.length + (rec.submitted ? ' · done ✓' : '')),
        h('h2', { style: { marginTop: '6px' } }, a.title),
        h('p', { html: a.brief }),
        h('h3', null, 'Tasks'), h('div', { class: 'tasks' }, checks),
        a.hint ? h('div', { class: 'callout tip', html: '<b>Hint:</b> ' + a.hint }) : null,
        h('h3', null, 'Your answer'), ta,
        h('div', { class: 'row', style: { marginTop: '10px' } }, submit, stat), msg)));
    });
    if (Studio.assignDone(m)) page.append(h('div', { class: 'row' }, nextAfter(m, mi)));
  };

  /* ---------- flashcards ---------- */
  const INTERVALS = [0, 1, 3, 7, 14, 30];
  function allCards() {
    const out = [];
    Studio.allSteps().forEach(x => {
      if (!Studio.stepDone(x.m, x.s)) return;
      (x.s.terms || []).forEach(([t, d]) => out.push({ id: Studio.stepKey(x.m, x.s) + '|' + t, term: t, def: d, lesson: x.s.title }));
    });
    return out;
  }
  Studio.dueCards = function () {
    const now = Date.now();
    return allCards().filter(c => { const r = state.cards[c.id]; return !r || r.due <= now; });
  };

  P.review = function (page) {
    const cards = allCards(), due = Studio.shuffle(Studio.dueCards());
    page.append(h('div', { class: 'eyebrow' }, 'Spaced repetition'), h('h1', { class: 'title' }, 'Flashcards'),
      h('p', { class: 'lead' }, 'Terms from the lessons you have finished. Cards you know come back later, cards you miss come back sooner. Five minutes a day is enough.'));
    if (!cards.length) { page.append(h('div', { class: 'callout' }, 'Finish your first lesson to unlock flashcards.')); return; }
    const box = h('div', { class: 'widget' });
    page.append(box, h('p', { class: 'muted' }, cards.length + ' cards unlocked in total.'));
    let i = 0, flipped = false, known = 0;
    function draw() {
      box.innerHTML = '';
      if (i >= due.length) {
        box.append(h('div', { class: 'status ok' }, due.length ? '🎉 Session done. You knew ' + known + ' of ' + due.length + ' cards.' : 'Nothing is due right now. Come back later or finish more lessons.'));
        Studio.refreshNav(); return;
      }
      const c = due[i];
      box.append(h('div', { class: 'wtitle' }, h('span', null, 'Card ' + (i + 1) + ' of ' + due.length), h('span', null, c.lesson)),
        h('button', { class: 'flash' + (flipped ? ' back' : ''), onclick: () => { flipped = true; draw(); } },
          flipped ? h('span', null, c.def) : h('span', null, h('small', null, 'What is it?'), h('br'), c.term)),
        flipped
          ? h('div', { class: 'row', style: { justifyContent: 'center', marginTop: '14px' } },
            h('button', { class: 'btn', onclick: () => rate(false) }, 'Again (I forgot)'), h('button', { class: 'btn primary', onclick: () => rate(true) }, 'I knew it'))
          : h('div', { class: 'muted', style: { textAlign: 'center', marginTop: '12px' } }, 'Think of the meaning, then click the card.'));
    }
    function rate(ok) {
      const c = due[i]; const r = state.cards[c.id] || { box: 0 };
      r.box = ok ? Math.min(INTERVALS.length - 1, r.box + 1) : 0;
      r.due = Date.now() + INTERVALS[r.box] * 86400000 - (ok ? 0 : 0);
      if (!ok) r.due = Date.now() + 60000;
      state.cards[c.id] = r; if (ok) known++;
      Studio.activity(); save(); i++; flipped = false; draw();
    }
    draw();
  };

  /* ---------- journal ---------- */
  function journalData() {
    const lessons = [];
    Studio.allSteps().forEach(x => { if (Studio.stepDone(x.m, x.s)) lessons.push(x); });
    return lessons;
  }
  function toMarkdown() {
    const L = []; const done = journalData();
    L.push('# My Networking Journal', '', '_Generated ' + new Date().toLocaleDateString() + '_', '');
    L.push('- Lessons completed: ' + done.length + ' / ' + Studio.allSteps().length);
    const avg = Studio.totalQuizAvg(); if (avg != null) L.push('- Average quiz score: ' + avg + '%');
    L.push('- Exams passed: ' + Studio.modules.filter(m => Studio.examPassed(m)).length + ' / ' + Studio.modules.length, '- Current streak: ' + Studio.streak() + ' days', '');
    Studio.modules.forEach(m => {
      const ls = done.filter(x => x.m === m);
      const as = Studio.assignList(m).filter(a => state.assign[a.id] && state.assign[a.id].submitted);
      if (!ls.length && !as.length) return;
      L.push('## ' + m.title, '');
      ls.forEach(({ s }) => {
        const key = Studio.stepKey(m, s);
        L.push('### ' + s.title, '', '_' + s.sub + '_', '');
        if (s.recap) { L.push('**Key takeaways**'); s.recap.forEach(r => L.push('- ' + r.replace(/<[^>]+>/g, ''))); L.push(''); }
        if ((s.terms || []).length) { L.push('**Terms**'); s.terms.forEach(([t, d]) => L.push('- **' + t + ':** ' + d)); L.push(''); }
        if (state.notes[key]) L.push('**My notes**', '', state.notes[key].split('\n').map(x => '> ' + x).join('\n'), '');
        const q = state.quiz[key]; if (q) L.push('Quiz best: ' + q.best + '/' + q.total, '');
      });
      as.forEach(a => { const r = state.assign[a.id]; L.push('### Assignment: ' + a.title, '', 'Submitted ' + fmt(r.submitted), '', r.answer.split('\n').map(x => '> ' + x).join('\n'), ''); });
      if (state.exam[m.id]) L.push('**Exam:** ' + state.exam[m.id].best + '/' + state.exam[m.id].total + (state.exam[m.id].passed ? ' (passed)' : ''), '');
    });
    return L.join('\n');
  }

  P.journal = function (page) {
    const done = journalData();
    page.append(h('div', { class: 'eyebrow' }, 'Everything you learned'), h('h1', { class: 'title' }, 'My journal'),
      h('p', { class: 'lead' }, 'Your key takeaways, terms, notes and assignment answers for every finished lesson. Use it to revise fast, or download it to show how you learned.'),
      h('div', { class: 'row noprint', style: { margin: '10px 0 20px' } },
        h('button', { class: 'btn primary', onclick: () => { const blob = new Blob([toMarkdown()], { type: 'text/markdown' }); const a = h('a', { href: URL.createObjectURL(blob), download: 'my-networking-journal.md' }); document.body.append(a); a.click(); a.remove(); } }, 'Download (.md)'),
        h('button', { class: 'btn', onclick: () => window.print() }, 'Print / Save as PDF'),
        h('button', { class: 'btn', onclick: () => { navigator.clipboard.writeText(toMarkdown()).then(() => Studio.toast('Copied to clipboard'), () => Studio.toast('Copy failed')); } }, 'Copy as text')));
    if (!done.length) { page.append(h('div', { class: 'callout' }, 'Nothing here yet. Finish your first lesson and it will appear.')); return; }
    Studio.modules.forEach(m => {
      const ls = done.filter(x => x.m === m);
      const as = Studio.assignList(m).filter(a => state.assign[a.id] && state.assign[a.id].submitted);
      if (!ls.length && !as.length) return;
      page.append(h('h2', null, m.title));
      ls.forEach(({ s }) => {
        const key = Studio.stepKey(m, s);
        page.append(h('div', { class: 'jcard' }, h('h3', { style: { marginTop: 0 } }, s.title), h('div', { class: 'muted' }, s.sub),
          s.recap ? h('ul', null, s.recap.map(r => h('li', { html: r }))) : null,
          (s.terms || []).length ? h('div', { class: 'jterms' }, s.terms.map(([t, d]) => h('span', { class: 'jt' }, h('b', null, t), ': ' + d))) : null,
          state.notes[key] ? h('blockquote', null, state.notes[key]) : null));
      });
      as.forEach(a => page.append(h('div', { class: 'jcard' }, h('b', null, 'Assignment: ' + a.title), h('div', { class: 'muted' }, 'Submitted ' + fmt(state.assign[a.id].submitted)), h('blockquote', null, state.assign[a.id].answer))));
    });
  };
})();
