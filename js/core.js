/* Core: state, helpers, unlock rules, router, shell. Data files push into Studio.modules / Studio.plan. */
(function () {
  'use strict';

  const KEY = 'netstudio90.v2';

  function h(tag, props) {
    const el = document.createElement(tag);
    if (props) {
      for (const k in props) {
        const v = props[k];
        if (v == null || v === false) continue;
        if (k === 'class') el.className = v;
        else if (k === 'html') el.innerHTML = v;
        else if (k === 'text') el.textContent = v;
        else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
        else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
        else if (v === true) el.setAttribute(k, '');
        else el.setAttribute(k, v);
      }
    }
    for (let i = 2; i < arguments.length; i++) append(el, arguments[i]);
    return el;
  }
  function append(el, c) {
    if (c == null || c === false) return;
    if (Array.isArray(c)) c.forEach(x => append(el, x));
    else if (c instanceof Node) el.appendChild(c);
    else el.appendChild(document.createTextNode(String(c)));
  }
  const NS = 'http://www.w3.org/2000/svg';
  function svg(tag, props) {
    const el = document.createElementNS(NS, tag);
    if (props) for (const k in props) if (props[k] != null) el.setAttribute(k, props[k]);
    for (let i = 2; i < arguments.length; i++) append(el, arguments[i]);
    return el;
  }
  const $ = (s, r) => (r || document).querySelector(s);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const defaults = {
    steps: {}, days: {}, quiz: {}, exam: {}, assign: {}, notes: {}, cards: {}, act: {},
    paused: false, focus: false, start: null, last: null, openMode: false
  };
  function load() {
    try { return Object.assign({}, defaults, JSON.parse(localStorage.getItem(KEY) || '{}')); }
    catch (e) { return Object.assign({}, defaults); }
  }
  const state = load();
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* private mode */ } }

  const dayKey = (t) => { const d = new Date(t || Date.now()); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };

  const Studio = window.Studio = {
    h, svg, $, esc, state, save, dayKey,
    widgets: {}, modules: [], plan: [], assignments: {}, tools: [], pages: {},
    PASS_STEP: 0.6, PASS_EXAM: 0.7, EXAM_SIZE: 10,
    register(name, fn) { Studio.widgets[name] = fn; },
    paused: () => state.paused,
    toast(msg) {
      const t = $('#toast'); t.textContent = msg; t.classList.add('on');
      clearTimeout(Studio._tt); Studio._tt = setTimeout(() => t.classList.remove('on'), 2200);
    },
    allSteps() {
      const out = [];
      Studio.modules.forEach((m, mi) => m.steps.forEach((s, si) => out.push({ m, mi, s, si })));
      return out;
    },
    findModule: id => Studio.modules.find(m => m.id === id),
    stepKey: (m, s) => m.id + '/' + s.id,
    activity() { const k = dayKey(); state.act[k] = (state.act[k] || 0) + 1; },
    streak() {
      let n = 0; const d = new Date();
      if (!state.act[dayKey(d)]) d.setDate(d.getDate() - 1);
      while (state.act[dayKey(d)]) { n++; d.setDate(d.getDate() - 1); }
      return n;
    },

    /* ---------- progress and locks ---------- */
    stepDone: (m, s) => !!state.steps[Studio.stepKey(m, s)],
    allStepsDone: m => m.steps.every(s => Studio.stepDone(m, s)),
    examPassed: m => !!(state.exam[m.id] && state.exam[m.id].passed),
    assignList: m => Studio.assignments[m.id] || [],
    assignDone: m => Studio.assignList(m).every(a => state.assign[a.id] && state.assign[a.id].submitted),
    moduleDone: m => Studio.allStepsDone(m) && Studio.examPassed(m) && Studio.assignDone(m),
    moduleUnlocked(mi) { return state.openMode || mi === 0 || Studio.moduleDone(Studio.modules[mi - 1]); },
    stepUnlocked(mi, si) {
      if (!Studio.moduleUnlocked(mi)) return false;
      if (state.openMode || si === 0) return true;
      const m = Studio.modules[mi];
      return Studio.stepDone(m, m.steps[si - 1]);
    },
    finalUnlocked(mi) { return Studio.moduleUnlocked(mi) && (state.openMode || Studio.allStepsDone(Studio.modules[mi])); },
    modProgress(m) {
      const done = m.steps.filter(s => Studio.stepDone(m, s)).length;
      return { done, total: m.steps.length, pct: Math.round(done * 100 / m.steps.length) };
    },
    /** First lesson/exam/assignment the learner should do next, as a hash. */
    nextTarget() {
      for (let mi = 0; mi < Studio.modules.length; mi++) {
        const m = Studio.modules[mi];
        if (Studio.moduleDone(m)) continue;
        for (let si = 0; si < m.steps.length; si++) if (!Studio.stepDone(m, m.steps[si])) return { hash: '#/m/' + m.id + '/' + si, label: m.steps[si].title, mi, si };
        if (!Studio.examPassed(m)) return { hash: '#/exam/' + m.id, label: m.title + ': final exam', mi };
        return { hash: '#/assign/' + m.id, label: m.title + ': assignments', mi };
      }
      return null;
    },
    totalQuizAvg() {
      const q = Object.values(state.quiz).filter(x => x && x.total);
      if (!q.length) return null;
      return Math.round(q.reduce((a, x) => a + x.best / x.total, 0) * 100 / q.length);
    },
  };

  /* ---------- shell ---------- */
  function logo(size) {
    return svg('svg', { viewBox: '0 0 48 48', width: size, height: size },
      svg('path', { d: 'M24 3 6 9v14c0 11 8 19 18 22 10-3 18-11 18-22V9z', fill: '#17171c', stroke: '#ff4d5a', 'stroke-width': 2.2 }),
      svg('circle', { cx: 24, cy: 14, r: 3.4, fill: '#ff4d5a' }),
      svg('circle', { cx: 14, cy: 29, r: 3.4, fill: '#ececef' }),
      svg('circle', { cx: 34, cy: 29, r: 3.4, fill: '#ececef' }),
      svg('path', { d: 'M24 14 14 29M24 14l10 15M14 29h20', stroke: '#ff4d5a', 'stroke-width': 1.8, fill: 'none' }));
  }
  Studio.logo = logo;

  function buildShell() {
    const app = $('#app');
    app.innerHTML = '';
    const search = h('div', { class: 'search' },
      svg('svg', { viewBox: '0 0 24 24', fill: 'none', 'stroke-width': 2, 'stroke-linecap': 'round' }, svg('circle', { cx: 11, cy: 11, r: 7 }), svg('path', { d: 'm20 20-3.5-3.5' })),
      h('input', { id: 'q', placeholder: 'Find a topic or protocol', autocomplete: 'off', 'aria-label': 'Search topics' }),
      h('kbd', null, '/'),
      h('div', { class: 'results', id: 'results', hidden: true }));
    app.append(
      h('aside', { id: 'side' },
        h('a', { class: 'brand', href: '#/' }, logo(40), h('div', null, h('b', null, 'NETWORKING'), h('small', null, '90 DAY STUDIO'))),
        h('div', { class: 'sidescroll' }, search, h('div', { id: 'nav' })),
        h('div', { class: 'sidefoot' }, h('b', null, h('i'), 'LOCAL / OFFLINE READY'), 'Runs fully in your browser. Progress is saved on this device.')),
      h('main', { id: 'main' },
        h('div', { class: 'topbar' },
          h('button', { class: 'iconbtn', id: 'burger', 'aria-label': 'Menu' }, '☰'),
          h('div', { class: 'crumbs', id: 'crumbs' }),
          h('button', { class: 'topbtn', id: 'pausebtn', onclick: togglePause, 'aria-pressed': 'false' }, 'Pause motion'),
          h('button', { class: 'topbtn', id: 'focusbtn', onclick: toggleFocus, 'aria-pressed': 'false' }, h('span', { class: 'lab' }, 'Focus view'), h('kbd', null, 'F'))),
        h('div', { id: 'scroll' }, h('div', { class: 'page', id: 'page' }))),
      h('div', { id: 'toast' }));
    $('#q').addEventListener('input', onSearch);
    $('#q').addEventListener('keydown', e => { if (e.key === 'Escape') { e.target.value = ''; onSearch(); e.target.blur(); } if (e.key === 'Enter') { const a = $('#results a'); if (a) a.click(); } });
    document.addEventListener('click', e => { if (!e.target.closest('.search')) $('#results').hidden = true; });
    $('#burger').addEventListener('click', () => { if (window.innerWidth > 820) toggleFocus(); else document.body.classList.toggle('sideopen'); });
  }

  function togglePause() { state.paused = !state.paused; applyFlags(); save(); Studio.toast(state.paused ? 'Motion paused' : 'Motion on'); }
  function toggleFocus() { state.focus = !state.focus; applyFlags(); save(); }
  function applyFlags() {
    document.body.classList.toggle('paused', !!state.paused);
    document.body.classList.toggle('focus', !!state.focus);
    const p = $('#pausebtn'), f = $('#focusbtn');
    if (p) { p.setAttribute('aria-pressed', state.paused); p.firstChild.textContent = state.paused ? 'Resume motion' : 'Pause motion'; }
    if (f) f.setAttribute('aria-pressed', state.focus);
  }

  function onSearch() {
    const q = $('#q').value.trim().toLowerCase();
    const box = $('#results');
    box.innerHTML = '';
    if (!q) { box.hidden = true; return; }
    const hits = [];
    Studio.allSteps().forEach(x => {
      const hay = [x.s.title, x.s.sub, (x.s.terms || []).map(t => t[0] + ' ' + t[1]).join(' '), x.m.title, (x.s.keywords || '')].join(' ').toLowerCase();
      if (hay.includes(q)) hits.push({ x, rank: x.s.title.toLowerCase().includes(q) ? 0 : 1 });
    });
    hits.sort((a, b) => a.rank - b.rank);
    if (!hits.length) box.append(h('div', { class: 'none' }, 'Nothing found. Try another word, like "dns", "tcp" or "subnet".'));
    hits.slice(0, 9).forEach(({ x }) => {
      const open = Studio.stepUnlocked(x.mi, x.si);
      box.append(h('a', { href: '#/m/' + x.m.id + '/' + x.si, onclick: () => { box.hidden = true; $('#q').value = ''; } }, (open ? '' : '🔒 ') + x.s.title, h('small', null, x.m.title)));
    });
    box.hidden = false;
  }

  /* ---------- sidebar nav ---------- */
  function link(cls, href, text, extra) { return h('a', { class: cls, href }, text, extra); }

  function renderNav(route) {
    const nav = $('#nav');
    nav.innerHTML = '';
    const all = Studio.allSteps();
    const doneAll = all.filter(x => Studio.stepDone(x.m, x.s)).length;
    const due = Studio.dueCards ? Studio.dueCards().length : 0;
    nav.append(
      link('navlink' + (route.page === 'home' ? ' on' : ''), '#/', 'Course overview', h('em', null, doneAll + '/' + all.length)),
      link('navlink' + (route.page === 'plan' ? ' on' : ''), '#/plan', '90-day plan', h('em', null, Object.keys(state.days).filter(k => state.days[k]).length + '/90')),
      link('navlink' + (route.page === 'review' ? ' on' : ''), '#/review', 'Flashcards', h('em', null, due ? due + ' due' : '')),
      link('navlink' + (route.page === 'journal' ? ' on' : ''), '#/journal', 'My journal', h('em', null, '')),
      h('div', { class: 'grouplabel' }, h('span', null, 'Modules'), h('span', null, Studio.modules.length)));
    Studio.modules.forEach((m, i) => {
      const p = Studio.modProgress(m);
      const open = Studio.moduleUnlocked(i);
      const on = (route.page === 'step' || route.page === 'exam' || route.page === 'assign') && route.m.id === m.id;
      nav.append(h('a', { class: 'mod' + (on ? ' on' : '') + (open ? '' : ' locked'), href: open ? '#/m/' + m.id + '/0' : '#/m/' + m.id + '/0' },
        h('span', { class: 'n' }, String(i + 1).padStart(2, '0')), m.short || m.title,
        Studio.moduleDone(m) ? h('span', { class: 'tick' }, '✓') : (open ? h('span', { class: 'tick', style: { color: 'var(--muted)' } }, p.pct + '%') : h('span', { class: 'tick lock' }, '🔒'))));
    });
    if (route.m) {
      const mi = Studio.modules.indexOf(route.m);
      nav.append(h('div', { class: 'grouplabel' }, h('span', null, route.m.short + ' lessons'), h('span', null, route.m.steps.length)));
      const list = h('div', { class: 'steplist' });
      route.m.steps.forEach((s, i) => {
        const open = Studio.stepUnlocked(mi, i), done = Studio.stepDone(route.m, s);
        list.append(h('a', { class: 'step' + (route.page === 'step' && i === route.si ? ' on' : '') + (done ? ' done' : '') + (open ? '' : ' locked'), href: '#/m/' + route.m.id + '/' + i, title: open ? '' : 'Locked. Finish the previous lesson first.' },
          h('span', { class: 'n' }, open || done ? String(i + 1).padStart(2, '0') : '🔒'), h('span', { class: 't' }, s.title)));
      });
      const fu = Studio.finalUnlocked(mi);
      list.append(
        h('a', { class: 'step special' + (route.page === 'assign' ? ' on' : '') + (Studio.assignDone(route.m) ? ' done' : '') + (fu ? '' : ' locked'), href: '#/assign/' + route.m.id }, h('span', { class: 'n' }, fu ? '✎' : '🔒'), h('span', { class: 't' }, 'Assignments')),
        h('a', { class: 'step special' + (route.page === 'exam' ? ' on' : '') + (Studio.examPassed(route.m) ? ' done' : '') + (fu ? '' : ' locked'), href: '#/exam/' + route.m.id }, h('span', { class: 'n' }, fu ? '★' : '🔒'), h('span', { class: 't' }, 'Final exam')));
      nav.append(list);
    }
    nav.append(h('div', { style: { height: '10px' } }),
      link('navlink' + (route.page === 'chapters' ? ' on' : ''), '#/chapters', 'Browse all chapters'),
      link('navlink' + (route.page === 'tools' ? ' on' : ''), '#/tools', 'Tool lab', h('em', null, 'always open')));
  }

  /* ---------- routing ---------- */
  function parse() {
    const parts = (location.hash || '#/').replace(/^#\/?/, '').split('/').filter(Boolean);
    if (!parts.length) return { page: 'home' };
    const simple = ['plan', 'chapters', 'tools', 'review', 'journal'];
    if (simple.includes(parts[0])) return { page: parts[0] };
    if (parts[0] === 'exam' || parts[0] === 'assign') {
      const m = Studio.findModule(parts[1]);
      return m ? { page: parts[0], m } : { page: 'home' };
    }
    if (parts[0] === 'm') {
      const m = Studio.findModule(parts[1]);
      if (!m) return { page: 'home' };
      let si = parseInt(parts[2] || '0', 10);
      if (!(si >= 0 && si < m.steps.length)) si = 0;
      return { page: 'step', m, si, s: m.steps[si] };
    }
    return { page: 'home' };
  }

  function redirectIfLocked(route) {
    if (route.page === 'step') {
      const mi = Studio.modules.indexOf(route.m);
      if (!Studio.stepUnlocked(mi, route.si)) {
        const t = Studio.nextTarget();
        Studio.toast(Studio.moduleUnlocked(mi) ? 'Locked. Pass the quiz on the previous lesson first.' : 'Locked. Finish the previous module first.');
        if (t && t.hash !== location.hash) { location.hash = t.hash; return true; }
        location.hash = '#/'; return true;
      }
    }
    if (route.page === 'exam' || route.page === 'assign') {
      const mi = Studio.modules.indexOf(route.m);
      if (!Studio.finalUnlocked(mi)) {
        Studio.toast('Locked. Complete every lesson in this module first.');
        const t = Studio.nextTarget(); location.hash = t ? t.hash : '#/'; return true;
      }
    }
    return false;
  }

  function go(route) {
    if (redirectIfLocked(route)) return;
    const page = $('#page');
    page.innerHTML = '';
    $('#scroll').scrollTop = 0;
    document.body.classList.remove('sideopen');
    renderNav(route);
    const crumbs = $('#crumbs');
    const R = Studio.pages;
    if (route.page === 'step') {
      state.last = '#/m/' + route.m.id + '/' + route.si; save();
      crumbs.innerHTML = 'Networking Studio / <b>' + esc(route.m.title) + '</b> / ' + esc(route.s.title);
    } else {
      const names = { home: 'Course overview', plan: '90-day plan', chapters: 'All chapters', tools: 'Tool lab', review: 'Flashcards', journal: 'My journal', exam: 'Final exam', assign: 'Assignments' };
      crumbs.innerHTML = 'Networking Studio / <b>' + names[route.page] + '</b>' + (route.m ? ' / ' + esc(route.m.title) : '');
    }
    R[route.page](page, route);
    document.title = (route.page === 'step' ? route.s.title + ' · ' : '') + 'Networking Studio';
  }
  Studio.go = () => go(parse());
  Studio.parse = parse;
  Studio.refreshNav = () => renderNav(parse());

  Studio.start = function () {
    buildShell();
    applyFlags();
    window.addEventListener('hashchange', () => go(parse()));
    document.addEventListener('keydown', e => {
      const tag = (e.target.tagName || '').toLowerCase();
      const typing = tag === 'input' || tag === 'textarea' || tag === 'select';
      if (e.key === '/' && !typing) { e.preventDefault(); $('#q').focus(); }
      else if ((e.key === 'f' || e.key === 'F') && !typing && !e.ctrlKey && !e.metaKey) toggleFocus();
      else if (!typing && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
        const b = $(e.key === 'ArrowRight' ? '[data-next]' : '[data-prev]');
        if (b && !b.disabled) b.click();
      }
    });
    go(parse());
  };
})();
