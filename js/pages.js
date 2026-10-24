/* Pages: overview, plan, chapters, tool lab, and the step (lesson) page. */
(function () {
  'use strict';
  const { h, state, save, $, esc } = Studio;
  const P = Studio.pages;

  function mountWidget(cfg, step) {
    const fn = Studio.widgets[cfg.type];
    const box = h('div');
    if (!fn) { box.append(h('div', { class: 'callout warn' }, 'Widget missing: ' + cfg.type)); return box; }
    try { fn(box, cfg, { step }); }
    catch (e) { console.error(e); box.append(h('div', { class: 'callout warn' }, 'Widget error: ' + e.message)); }
    return box;
  }

  /* ---------- overview ---------- */
  P.home = function (page) {
    const all = Studio.allSteps();
    const done = all.filter(x => state.steps[Studio.stepKey(x.m, x.s)]).length;
    const daysDone = Object.keys(state.days).filter(k => state.days[k]).length;
    const first = '#/m/' + Studio.modules[0].id + '/0';
    page.append(
      h('div', { class: 'eyebrow' }, 'Networking through a security lens'),
      h('h1', { class: 'title' }, 'Networking Studio'),
      h('p', { class: 'lead' }, 'Ek 90 din ka seekhne ka rasta. Har concept simple Hinglish mein, har step mein ek interactive tool jise tum khud chala sako. Bas dekhna nahi, karke seekhna hai.'),
      h('div', { class: 'hero' },
        h('b', { style: { fontSize: '18px' } }, state.last ? 'Wahin se shuru karo jahan chhoda tha' : 'Yahin se shuru karo'),
        h('p', { class: 'muted', style: { margin: '6px 0 14px' } }, 'Roz ek chhota step: padho, tool chalao, quiz do. 90 din mein tum packet ka poora safar samajh loge.'),
        h('div', { class: 'row' },
          h('a', { class: 'btn primary', href: state.last || first, style: { textDecoration: 'none' } }, state.last ? 'Continue learning' : 'Start Day 1'),
          h('a', { class: 'btn', href: '#/plan', style: { textDecoration: 'none' } }, 'Open 90-day plan'),
          h('a', { class: 'btn', href: '#/tools', style: { textDecoration: 'none' } }, 'Tool lab')),
        h('div', { class: 'stats' },
          stat(Studio.modules.length, 'Modules'), stat(all.length, 'Lessons'),
          stat(done + '/' + all.length, 'Steps done'), stat(daysDone + '/90', 'Days done'))),
      h('h2', null, 'Course map'),
      h('div', { class: 'modcards' }, Studio.modules.map((m, i) => {
        const p = Studio.modProgress(m);
        return h('a', { class: 'modcard', href: '#/m/' + m.id + '/0' },
          h('div', { class: 'days' }, m.days.toUpperCase()), h('h3', null, (i + 1) + '. ' + m.title), h('p', null, m.blurb),
          h('div', { class: 'muted', style: { fontSize: '12px' } }, m.steps.length + ' steps · ' + p.done + ' done'),
          h('div', { class: 'mbar' }, h('i', { style: { width: p.pct + '%' } })));
      })),
      h('div', { class: 'note' }, 'Tip: ',
        h('code', null, '/'), ' search, ', h('code', null, 'F'), ' focus view, ', h('code', null, '← →'), ' pichla/agla step.'),
      h('div', { class: 'row', style: { marginTop: '14px' } },
        h('button', { class: 'btn sm', onclick: () => { if (confirm('Saari progress reset karni hai?')) { state.steps = {}; state.days = {}; state.quiz = {}; state.start = null; state.last = null; save(); Studio.go(); } } }, 'Reset progress')));
  };
  function stat(v, l) { return h('div', { class: 'stat' }, h('b', null, v), h('span', null, l)); }

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
        h('div', { class: 'eyebrow' }, 'Roz ek chhota kadam'),
        h('h1', { class: 'title' }, '90-day plan'),
        h('p', { class: 'lead' }, 'Har din ka ek clear kaam. Din complete hone par tick karo. Streak mat todna, roz 45-60 minute kaafi hain.'),
        h('div', { class: 'widget' },
          h('div', { class: 'row', style: { justifyContent: 'space-between' } },
            h('div', null, h('b', { style: { fontSize: '26px' } }, done() + ' / ' + total), h('span', { class: 'muted' }, ' din complete'),
              t ? h('div', { class: 'muted' }, 'Aaj Day ' + t + ' hai') : h('div', { class: 'muted' }, 'Abhi start date set nahi hai')),
            h('div', { class: 'row' },
              h('button', { class: 'btn', onclick: () => { state.start = Date.now(); save(); Studio.go(); } }, t ? 'Restart from today' : 'Aaj Day 1 hai'),
              h('button', { class: 'btn', onclick: () => { const nx = firstOpen(); const el = $('#day' + nx); if (el) el.scrollIntoView({ block: 'center' }); } }, 'Jump to next day'))),
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
        const row = h('label', { class: 'day' + (state.days[num] ? ' done' : '') + (startDay() === num ? ' today' : ''), id: 'day' + num },
          h('input', {
            type: 'checkbox', checked: state.days[num] ? true : null, onchange: e => {
              state.days[num] = e.target.checked; save(); row.classList.toggle('done', e.target.checked); drawHead();
            }
          }),
          h('span', { class: 'dn' }, 'DAY ' + String(num).padStart(2, '0')),
          h('span', { class: 'dt' }, text, ref ? h('a', { href: '#/m/' + ref, onclick: e => e.stopPropagation() }, 'open lesson →') : null));
        box.append(row);
      });
      weeks.append(box);
    });
    page.append(weeks);
  };

  /* ---------- chapters ---------- */
  P.chapters = function (page) {
    page.append(h('div', { class: 'eyebrow' }, 'Library'), h('h1', { class: 'title' }, 'All chapters'), h('p', { class: 'lead' }, 'Poora course ek jagah. Kisi bhi topic pe seedha jao.'));
    Studio.modules.forEach((m, i) => {
      page.append(h('h2', null, (i + 1) + '. ' + m.title, h('span', { class: 'muted', style: { fontSize: '13px', marginLeft: '12px', fontWeight: 400 } }, m.days)));
      const t = h('table', { class: 't' });
      m.steps.forEach((s, si) => t.append(h('tr', null,
        h('td', { style: { width: '44px' }, class: 'mono muted' }, String(si + 1).padStart(2, '0')),
        h('td', null, h('a', { href: '#/m/' + m.id + '/' + si, style: { color: 'var(--text)', fontWeight: 600, textDecoration: 'none' } }, s.title), h('div', { class: 'muted' }, s.sub)),
        h('td', { style: { width: '40px', color: 'var(--green)' } }, state.steps[Studio.stepKey(m, s)] ? '✓' : ''))));
      page.append(t);
    });
  };

  /* ---------- tool lab ---------- */
  P.tools = function (page) {
    const id = location.hash.split('/')[2];
    page.append(h('div', { class: 'eyebrow' }, 'Practice'), h('h1', { class: 'title' }, 'Tool lab'),
      h('p', { class: 'lead' }, 'Saare interactive tools ek jagah. Lesson ke bina bhi yahan khelo aur experiment karo.'));
    const chips = h('div', { class: 'chips' });
    Studio.tools.forEach(t => chips.append(h('a', { class: 'chip' + (t.id === id ? ' on' : ''), href: '#/tools/' + t.id, style: { textDecoration: 'none', color: 'inherit' } }, t.title)));
    page.append(chips);
    const t = Studio.tools.find(x => x.id === id);
    if (!t) { page.append(h('div', { class: 'callout' }, 'Upar se koi tool chuno.')); return; }
    page.append(h('p', { class: 'muted' }, t.desc), mountWidget(t.widget, null));
  };

  /* ---------- step ---------- */
  P.step = function (page, route) {
    const { m, s, si } = route;
    const key = Studio.stepKey(m, s);
    const n = m.steps.length;
    const tabs = [['lesson', 'Lesson and interactions'], ['terms', 'Terms and definitions'], ['faq', 'Common doubts'], ['quiz', 'Quick quiz']];
    let tab = 'lesson';

    const body = h('div', { class: 'cardbody' });
    const tabbar = h('div', { class: 'tabs' });
    function drawTabs() {
      tabbar.innerHTML = '';
      tabs.forEach(([id, label]) => tabbar.append(h('button', { class: 'tab' + (tab === id ? ' on' : ''), onclick: () => { tab = id; drawTabs(); drawBody(); } }, label)));
    }
    function drawBody() {
      body.innerHTML = '';
      body.append(h('div', { class: 'eyebrow stephead' }, m.title + ' / step ' + (si + 1) + ' of ' + n));
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
      } else if (tab === 'terms') {
        const g = h('div', { class: 'termgrid' });
        (s.terms || []).forEach(([t, d]) => g.append(h('div', { class: 'term' }, h('b', null, t), h('span', null, d))));
        body.append((s.terms || []).length ? g : h('p', { class: 'muted' }, 'Is step mein koi alag term nahi.'));
      } else if (tab === 'faq') {
        const f = h('div', { class: 'faq' });
        (s.faq || []).forEach(([q, a]) => f.append(h('details', null, h('summary', null, q), h('p', { html: a }))));
        body.append((s.faq || []).length ? f : h('p', { class: 'muted' }, 'Abhi koi doubt listed nahi.'));
      } else {
        renderQuiz(body, s, key);
      }
    }

    const sel = h('select', { 'aria-label': 'Jump to step', onchange: e => { location.hash = '#/m/' + m.id + '/' + e.target.value; } },
      m.steps.map((x, i) => h('option', { value: i, selected: i === si ? true : null }, (i + 1) + '. ' + x.title)));
    const pct = Math.round((si + 1) * 100 / n);

    page.append(
      h('div', { class: 'progresswrap' },
        h('div', { class: 'progresshead' }, h('span', null, (m.title + ' / STEP ' + (si + 1) + ' OF ' + n).toUpperCase()),
          h('span', null, state.steps[key] ? '✓ Completed' : 'In progress')),
        h('div', { class: 'bar' }, h('i', { style: { width: pct + '%' } }))),
      h('div', { class: 'card' },
        h('div', { class: 'cardhead' }, h('span', null, m.short + ' / ' + String(si + 1).padStart(2, '0') + ' of ' + String(n).padStart(2, '0')), sel),
        tabbar, body),
      h('div', { class: 'pager' },
        h('button', { class: 'btn', 'data-prev': true, disabled: si === 0 && Studio.modules.indexOf(m) === 0 ? true : null, onclick: () => nav(-1) }, '← Pichla step'),
        h('button', { class: 'btn primary', 'data-next': true, onclick: () => { state.steps[key] = true; save(); nav(1); } }, 'Complete & aage →')));
    drawTabs();
    drawBody();

    function nav(d) {
      const mi = Studio.modules.indexOf(m);
      let ni = si + d, nm = m;
      if (ni < 0) { if (mi === 0) return; nm = Studio.modules[mi - 1]; ni = nm.steps.length - 1; }
      else if (ni >= n) { if (mi === Studio.modules.length - 1) { Studio.toast('Course complete! 🎉'); location.hash = '#/'; return; } nm = Studio.modules[mi + 1]; ni = 0; }
      location.hash = '#/m/' + nm.id + '/' + ni;
    }
  };

  function renderQuiz(root, s, key) {
    const list = s.quiz || [];
    if (!list.length) { root.append(h('p', { class: 'muted' }, 'Is step ka quiz nahi hai.')); return; }
    list.forEach((q, qi) => {
      const id = key + ':' + qi;
      const box = h('div', { class: 'q' }, h('b', null, (qi + 1) + '. ' + q.q));
      const why = h('div', { class: 'why', hidden: true });
      const opts = q.o.map((txt, oi) => h('button', {
        class: 'opt', onclick: () => {
          opts.forEach((b, j) => { b.disabled = true; if (j === q.a) b.classList.add('right'); });
          if (oi !== q.a) opts[oi].classList.add('wrong');
          why.hidden = false; why.innerHTML = (oi === q.a ? '✅ Sahi. ' : '❌ Galat. ') + (q.why || '');
          state.quiz[id] = oi === q.a; save();
        }
      }, txt));
      box.append(opts, why);
      root.append(box);
    });
  }
})();
