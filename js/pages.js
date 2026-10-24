/* Pages: overview dashboard, 90-day plan, chapters, tool lab, and the lesson page. */
(function () {
  'use strict';
  const { h, state, save, $ } = Studio;
  const P = Studio.pages;

  function mountWidget(cfg, step) {
    const fn = Studio.widgets[cfg.type];
    const box = h('div');
    if (!fn) { box.append(h('div', { class: 'callout warn' }, 'Widget missing: ' + cfg.type)); return box; }
    try { fn(box, cfg, { step }); }
    catch (e) { console.error(e); box.append(h('div', { class: 'callout warn' }, 'Widget error: ' + e.message)); }
    return box;
  }
  Studio.mountWidget = mountWidget;

  const stat = (v, l) => h('div', { class: 'stat' }, h('b', null, v), h('span', null, l));
  const btnLink = (href, text, primary) => h('a', { class: 'btn' + (primary ? ' primary' : ''), href, style: { textDecoration: 'none' } }, text);

  /* ---------- overview / dashboard ---------- */
  P.home = function (page) {
    const all = Studio.allSteps();
    const done = all.filter(x => Studio.stepDone(x.m, x.s)).length;
    const daysDone = Object.keys(state.days).filter(k => state.days[k]).length;
    const next = Studio.nextTarget();
    const avg = Studio.totalQuizAvg();
    const exams = Studio.modules.filter(m => Studio.examPassed(m)).length;
    const assigns = Studio.modules.reduce((a, m) => a + Studio.assignList(m).filter(x => state.assign[x.id] && state.assign[x.id].submitted).length, 0);
    const assignTotal = Studio.modules.reduce((a, m) => a + Studio.assignList(m).length, 0);

    page.append(
      h('div', { class: 'eyebrow' }, 'Networking through a security lens'),
      h('h1', { class: 'title' }, 'Networking Studio'),
      h('p', { class: 'lead' }, 'A 90-day path to understand networking from the ground up. Every lesson has a tool you can play with, a short quiz, and notes you can use later. Lessons unlock one by one, so you always build on what you already know.'),
      h('div', { class: 'hero' },
        next ? h('div', null,
          h('b', { style: { fontSize: '18px' } }, done ? 'Continue where you stopped' : 'Start here'),
          h('p', { class: 'muted', style: { margin: '6px 0 14px' } }, 'Next up: ' + next.label),
          h('div', { class: 'row' }, btnLink(next.hash, done ? 'Continue learning' : 'Start lesson 1', true), btnLink('#/plan', 'Open 90-day plan'), btnLink('#/review', 'Review flashcards'), btnLink('#/tools', 'Tool lab')))
          : h('div', null, h('b', { style: { fontSize: '18px' } }, '🎉 You finished the whole course'), h('p', { class: 'muted' }, 'Open My journal to download your notes and share what you learned.'), btnLink('#/journal', 'Open my journal', true)),
        h('div', { class: 'stats' },
          stat(done + '/' + all.length, 'Lessons done'), stat(avg == null ? '-' : avg + '%', 'Average quiz score'),
          stat(Studio.streak() + ' 🔥', 'Day streak'), stat(exams + '/' + Studio.modules.length, 'Exams passed'),
          stat(assigns + '/' + assignTotal, 'Assignments'), stat(daysDone + '/90', 'Plan days ticked'),
          stat(Studio.modules.length, 'Modules'), stat(all.length, 'Lessons in total'))),
      h('h2', null, 'Course map'),
      h('div', { class: 'modcards' }, Studio.modules.map((m, i) => {
        const p = Studio.modProgress(m);
        const open = Studio.moduleUnlocked(i);
        return h('a', { class: 'modcard' + (open ? '' : ' locked'), href: open ? '#/m/' + m.id + '/0' : '#/', onclick: e => { if (!open) { e.preventDefault(); Studio.toast('Locked. Finish "' + Studio.modules[i - 1].title + '" first (lessons, assignments and exam).'); } } },
          h('div', { class: 'days' }, (open ? '' : '🔒 ') + m.days.toUpperCase()), h('h3', null, (i + 1) + '. ' + m.title), h('p', null, m.blurb),
          h('div', { class: 'muted', style: { fontSize: '12px' } }, m.steps.length + ' lessons · ' + p.done + ' done' + (Studio.moduleDone(m) ? ' · module complete ✓' : '')),
          h('div', { class: 'mbar' }, h('i', { style: { width: p.pct + '%' } })));
      })),
      weakSpots(),
      h('div', { class: 'note' }, 'Shortcuts: ', h('code', null, '/'), ' search, ', h('code', null, 'F'), ' focus view, ', h('code', null, '← →'), ' previous/next lesson.'),
      settings());
  };

  function weakSpots() {
    const weak = Studio.allSteps().filter(x => { const q = state.quiz[Studio.stepKey(x.m, x.s)]; return q && q.attempts > 1 || (q && q.best < q.total); })
      .slice(0, 5);
    if (!weak.length) return h('div');
    return h('div', null, h('h2', null, 'Worth another look'),
      h('p', { class: 'muted' }, 'These lessons took you more than one try or you missed some questions. Review them before the exam.'),
      h('div', { class: 'chips' }, weak.map(x => h('a', { class: 'chip', href: '#/m/' + x.m.id + '/' + x.si, style: { textDecoration: 'none', color: 'inherit' } }, x.s.title))));
  }

  function settings() {
    return h('div', { class: 'widget', style: { marginTop: '20px' } },
      h('div', { class: 'wtitle' }, h('span', null, 'Settings')),
      h('label', { class: 'row', style: { gap: '8px' } },
        h('input', { type: 'checkbox', checked: state.openMode ? true : null, onchange: e => { state.openMode = e.target.checked; save(); Studio.go(); Studio.toast(state.openMode ? 'Open mode: all lessons unlocked' : 'Locks are back on'); } }),
        h('span', null, 'Open mode: unlock every lesson (useful when you revisit the course or show it to a friend).')),
      h('div', { class: 'row', style: { marginTop: '12px' } },
        h('button', { class: 'btn sm', onclick: () => { if (confirm('Reset ALL progress, notes and answers? This cannot be undone.')) { localStorage.removeItem('netstudio90.v2'); location.hash = '#/'; location.reload(); } } }, 'Reset all progress')));
  }

  /* ---------- 90-day plan ---------- */
  P.plan = function (page) {
    let n = 0;
    const total = Studio.plan.reduce((a, w) => a + w.days.length, 0);
    const done = () => Object.keys(state.days).filter(k => state.days[k]).length;
    const startDay = () => {
      if (!state.start) return null;
      const d = Math.floor((Date.now() - state.start) / 86400000) + 1;
      return Math.max(1, Math.min(total, d));
    };
    const head = h('div');
    function drawHead() {
      head.innerHTML = '';
      const t = startDay();
      head.append(
        h('div', { class: 'eyebrow' }, 'One small step every day'),
        h('h1', { class: 'title' }, '90-day plan'),
        h('p', { class: 'lead' }, 'One clear task per day. Tick the day when it is done. Study 45 to 60 minutes a day and do not break the streak. Lessons still unlock in order, so a lesson link may be locked until you reach it.'),
        h('div', { class: 'widget' },
          h('div', { class: 'row', style: { justifyContent: 'space-between' } },
            h('div', null, h('b', { style: { fontSize: '26px' } }, done() + ' / ' + total), h('span', { class: 'muted' }, ' days complete'),
              t ? h('div', { class: 'muted' }, 'Today is Day ' + t) : h('div', { class: 'muted' }, 'No start date set yet')),
            h('div', { class: 'row' },
              h('button', { class: 'btn', onclick: () => { state.start = Date.now(); save(); Studio.go(); } }, t ? 'Restart from today' : 'Today is Day 1'),
              h('button', { class: 'btn', onclick: () => { const el = $('#day' + firstOpen()); if (el) el.scrollIntoView({ block: 'center' }); } }, 'Jump to next day'))),
          h('div', { class: 'bar', style: { marginTop: '14px', borderRadius: '3px' } }, h('i', { style: { width: Math.round(done() * 100 / total) + '%' } }))));
    }
    function firstOpen() { for (let i = 1; i <= total; i++) if (!state.days[i]) return i; return total; }
    page.append(head);
    drawHead();
    const weeks = h('div', { class: 'weeks' });
    Studio.plan.forEach((w, wi) => {
      const first = n + 1;
      const box = h('div', { class: 'week' },
        h('div', { class: 'weekhead' }, h('div', null, h('b', null, 'Week ' + (wi + 1) + ': ' + w.title), h('br'), h('small', null, 'Day ' + first + '-' + (n + w.days.length) + ' · ' + w.goal))));
      w.days.forEach(d => {
        n++;
        const num = n;
        const text = Array.isArray(d) ? d[0] : d;
        const ref = Array.isArray(d) ? d[1] : null;
        let locked = false;
        if (ref) { const [mid, si] = ref.split('/'); const mi = Studio.modules.findIndex(m => m.id === mid); locked = mi < 0 || !Studio.stepUnlocked(mi, +si); }
        const row = h('label', { class: 'day' + (state.days[num] ? ' done' : '') + (startDay() === num ? ' today' : ''), id: 'day' + num },
          h('input', { type: 'checkbox', checked: state.days[num] ? true : null, onchange: e => { state.days[num] = e.target.checked; save(); row.classList.toggle('done', e.target.checked); drawHead(); } }),
          h('span', { class: 'dn' }, 'DAY ' + String(num).padStart(2, '0')),
          h('span', { class: 'dt' }, text, ref ? h('a', { href: '#/m/' + ref, onclick: e => e.stopPropagation() }, locked ? '🔒 locked' : 'open lesson →') : null));
        box.append(row);
      });
      weeks.append(box);
    });
    page.append(weeks);
  };

  /* ---------- chapters ---------- */
  P.chapters = function (page) {
    page.append(h('div', { class: 'eyebrow' }, 'Library'), h('h1', { class: 'title' }, 'All chapters'), h('p', { class: 'lead' }, 'The whole course in one place. Locked lessons open when you finish the ones before them.'));
    Studio.modules.forEach((m, i) => {
      page.append(h('h2', null, (i + 1) + '. ' + m.title, h('span', { class: 'muted', style: { fontSize: '13px', marginLeft: '12px', fontWeight: 400 } }, m.days)));
      const t = h('table', { class: 't' });
      m.steps.forEach((s, si) => {
        const open = Studio.stepUnlocked(i, si);
        t.append(h('tr', null,
          h('td', { style: { width: '44px' }, class: 'mono muted' }, String(si + 1).padStart(2, '0')),
          h('td', null, h('a', { href: '#/m/' + m.id + '/' + si, style: { color: open ? 'var(--text)' : 'var(--dim)', fontWeight: 600, textDecoration: 'none' } }, s.title), h('div', { class: 'muted' }, s.sub)),
          h('td', { style: { width: '40px', color: 'var(--green)' } }, Studio.stepDone(m, s) ? '✓' : (open ? '' : '🔒'))));
      });
      page.append(t);
    });
  };

  /* ---------- tool lab ---------- */
  P.tools = function (page) {
    const id = location.hash.split('/')[2];
    page.append(h('div', { class: 'eyebrow' }, 'Practice'), h('h1', { class: 'title' }, 'Tool lab'),
      h('p', { class: 'lead' }, 'Every interactive tool in one place. These are never locked, so use them any time to experiment.'));
    const chips = h('div', { class: 'chips' });
    Studio.tools.forEach(t => chips.append(h('a', { class: 'chip' + (t.id === id ? ' on' : ''), href: '#/tools/' + t.id, style: { textDecoration: 'none', color: 'inherit' } }, t.title)));
    page.append(chips);
    const t = Studio.tools.find(x => x.id === id);
    if (!t) { page.append(h('div', { class: 'callout' }, 'Pick a tool above.')); return; }
    page.append(h('p', { class: 'muted' }, t.desc), mountWidget(t.widget, null));
  };

  /* ---------- lesson ---------- */
  P.step = function (page, route) {
    const { m, s, si } = route;
    const mi = Studio.modules.indexOf(m);
    const key = Studio.stepKey(m, s);
    const n = m.steps.length;
    const tabs = [['lesson', 'Lesson and interactions'], ['terms', 'Key terms'], ['faq', 'Common doubts'], ['notes', 'My notes'], ['quiz', 'Quiz']];
    let tab = 'lesson';
    const body = h('div', { class: 'cardbody' });
    const tabbar = h('div', { class: 'tabs' });
    const pager = h('div', { class: 'pager' });
    const statusEl = h('span', null);

    function drawTabs() {
      tabbar.innerHTML = '';
      tabs.forEach(([id, label]) => tabbar.append(h('button', { class: 'tab' + (tab === id ? ' on' : ''), onclick: () => { tab = id; drawTabs(); drawBody(); } }, label + (id === 'quiz' && Studio.stepDone(m, s) ? ' ✓' : ''))));
    }
    function drawPager() {
      pager.innerHTML = '';
      const done = Studio.stepDone(m, s);
      const last = si === n - 1;
      const prevDisabled = si === 0;
      pager.append(
        h('button', { class: 'btn', 'data-prev': true, disabled: prevDisabled ? true : null, onclick: () => { location.hash = '#/m/' + m.id + '/' + (si - 1); } }, '← Previous lesson'),
        done
          ? h('button', { class: 'btn primary', 'data-next': true, onclick: () => { location.hash = last ? '#/assign/' + m.id : '#/m/' + m.id + '/' + (si + 1); } }, last ? 'Go to assignments →' : 'Next lesson →')
          : h('button', { class: 'btn', 'data-next': true, title: 'Pass the quiz to unlock the next lesson', onclick: () => { tab = 'quiz'; drawTabs(); drawBody(); $('#scroll').scrollTop = 0; Studio.toast('Pass the quiz to unlock the next lesson.'); } }, '🔒 Pass the quiz to continue'));
      statusEl.textContent = done ? '✓ Completed' : 'In progress';
    }
    function drawBody() {
      body.innerHTML = '';
      body.append(h('div', { class: 'eyebrow stephead' }, m.title + ' / lesson ' + (si + 1) + ' of ' + n));
      body.append(h('h2', { style: { fontSize: '34px', margin: '8px 0 4px', letterSpacing: '-.025em' } }, s.title));
      body.append(h('div', { class: 'stephead' }, h('div', { class: 'sub' }, s.sub)));
      body.append(h('hr', { class: 'sep' }));
      if (tab === 'lesson') {
        if (s.widget) body.append(mountWidget(s.widget, s));
        if (s.widgets) s.widgets.forEach(w => body.append(mountWidget(w, s)));
        const ex = h('div', { class: 'explain' });
        (s.explain || []).forEach(p => {
          if (typeof p === 'string') ex.append(h('p', { html: p }));
          else ex.append(h('div', { class: 'callout ' + (p.kind || ''), html: p.text }));
        });
        body.append(ex);
        if (s.recap && s.recap.length) body.append(h('div', { class: 'recap' }, h('b', null, 'Key takeaways'), h('ul', null, s.recap.map(r => h('li', { html: r })))));
        body.append(h('div', { class: 'row', style: { marginTop: '16px' } }, h('button', { class: 'btn primary', onclick: () => { tab = 'quiz'; drawTabs(); drawBody(); $('#scroll').scrollTop = 0; } }, 'Ready? Take the quiz →')));
      } else if (tab === 'terms') {
        const g = h('div', { class: 'termgrid' });
        (s.terms || []).forEach(([t, d]) => g.append(h('div', { class: 'term' }, h('b', null, t), h('span', null, d))));
        body.append((s.terms || []).length ? g : h('p', { class: 'muted' }, 'No separate terms in this lesson.'));
      } else if (tab === 'faq') {
        const f = h('div', { class: 'faq' });
        (s.faq || []).forEach(([q, a]) => f.append(h('details', null, h('summary', null, q), h('p', { html: a }))));
        body.append((s.faq || []).length ? f : h('p', { class: 'muted' }, 'No doubts listed yet.'));
      } else if (tab === 'notes') {
        body.append(h('p', { class: 'muted' }, 'Write in your own words. This is the fastest way to remember. Your notes are saved automatically and appear in My journal.'));
        const ta = h('textarea', { class: 'in notes', placeholder: 'What did I learn? What was confusing? An example in my own words...', rows: 10 });
        ta.value = state.notes[key] || '';
        const saved = h('span', { class: 'muted' }, state.notes[key] ? 'Saved' : '');
        ta.addEventListener('input', () => { state.notes[key] = ta.value; save(); saved.textContent = 'Saved'; });
        body.append(ta, saved);
      } else {
        const q = state.quiz[key];
        if (q) body.append(h('div', { class: 'status ' + (Studio.stepDone(m, s) ? 'ok' : ''), style: { marginBottom: '12px' } }, 'Best score: ' + q.best + ' / ' + q.total + ' · Attempts: ' + q.attempts + (Studio.stepDone(m, s) ? ' · Lesson completed ✓' : '')));
        const holder = h('div');
        body.append(holder);
        Studio.runQuiz(holder, {
          questions: s.quiz, passFrac: Studio.PASS_STEP,
          onDone: r => {
            const rec = state.quiz[key] || { best: 0, total: r.total, attempts: 0 };
            rec.attempts++; rec.total = r.total; rec.best = Math.max(rec.best, r.score); state.quiz[key] = rec;
            Studio.activity();
            if (r.passed && !state.steps[key]) { state.steps[key] = true; Studio.toast('Lesson complete! The next one is unlocked.'); }
            save(); Studio.refreshNav(); drawPager(); drawTabs();
            if (r.passed) holder.append(h('div', { class: 'row', style: { marginTop: '10px' } },
              h('button', { class: 'btn primary', onclick: () => { location.hash = si === n - 1 ? '#/assign/' + m.id : '#/m/' + m.id + '/' + (si + 1); } }, si === n - 1 ? 'Go to assignments →' : 'Next lesson →')));
          }
        });
      }
    }

    const sel = h('select', { 'aria-label': 'Jump to lesson', onchange: e => { location.hash = '#/m/' + m.id + '/' + e.target.value; } },
      m.steps.map((x, i) => h('option', { value: i, selected: i === si ? true : null, disabled: !Studio.stepUnlocked(mi, i) ? true : null }, (Studio.stepUnlocked(mi, i) ? '' : '🔒 ') + (i + 1) + '. ' + x.title)));
    const pct = Math.round((si + 1) * 100 / n);

    page.append(
      h('div', { class: 'progresswrap' },
        h('div', { class: 'progresshead' }, h('span', null, (m.title + ' / LESSON ' + (si + 1) + ' OF ' + n).toUpperCase()), statusEl),
        h('div', { class: 'bar' }, h('i', { style: { width: pct + '%' } }))),
      h('div', { class: 'card' },
        h('div', { class: 'cardhead' }, h('span', null, m.short + ' / ' + String(si + 1).padStart(2, '0') + ' of ' + String(n).padStart(2, '0')), sel),
        tabbar, body),
      pager);
    drawTabs(); drawBody(); drawPager();
  };
})();
