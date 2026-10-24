/* Core: state, helpers, router, shell. Data files push into Studio.modules / Studio.plan. */
(function () {
  'use strict';

  const KEY = 'netstudio90.v1';

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

  const defaults = { steps: {}, days: {}, quiz: {}, paused: false, focus: false, start: null, last: null };
  function load() {
    try { return Object.assign({}, defaults, JSON.parse(localStorage.getItem(KEY) || '{}')); }
    catch (e) { return Object.assign({}, defaults); }
  }
  const state = load();
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* private mode */ } }

  const Studio = window.Studio = {
    h, svg, $, esc, state, save,
    widgets: {}, modules: [], plan: [],
    register(name, fn) { Studio.widgets[name] = fn; },
    paused: () => state.paused,
    toast(msg) {
      const t = $('#toast'); t.textContent = msg; t.classList.add('on');
      clearTimeout(Studio._tt); Studio._tt = setTimeout(() => t.classList.remove('on'), 1900);
    },
    allSteps() {
      const out = [];
      Studio.modules.forEach((m, mi) => m.steps.forEach((s, si) => out.push({ m, mi, s, si })));
      return out;
    },
    findModule: id => Studio.modules.find(m => m.id === id),
    stepKey: (m, s) => m.id + '/' + s.id,
    modProgress(m) {
      const done = m.steps.filter(s => state.steps[Studio.stepKey(m, s)]).length;
      return { done, total: m.steps.length, pct: Math.round(done * 100 / m.steps.length) };
    },
  };

  /* ---------- shell ---------- */
  const side = () => $('#side .sidescroll');

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
      h('input', { id: 'q', placeholder: 'Topic ya protocol dhundo', autocomplete: 'off', 'aria-label': 'Search topics' }),
      h('kbd', null, '/'),
      h('div', { class: 'results', id: 'results', hidden: true }));
    app.append(
      h('aside', { id: 'side' },
        h('a', { class: 'brand', href: '#/' }, logo(40), h('div', null, h('b', null, 'NETWORKING'), h('small', null, '90 DAY STUDIO'))),
        h('div', { class: 'sidescroll' }, search, h('div', { id: 'nav' }))),
      h('main', { id: 'main' },
        h('div', { class: 'topbar' },
          h('button', { class: 'iconbtn', id: 'burger', 'aria-label': 'Menu', onclick: () => { document.body.classList.toggle('sideopen'); } }, '☰'),
          h('div', { class: 'crumbs', id: 'crumbs' }),
          h('button', { class: 'topbtn', id: 'pausebtn', onclick: togglePause, 'aria-pressed': 'false' }, 'Pause motion'),
          h('button', { class: 'topbtn', id: 'focusbtn', onclick: toggleFocus, 'aria-pressed': 'false' }, h('span', { class: 'lab' }, 'Focus view'), h('kbd', null, 'F'))),
        h('div', { id: 'scroll' }, h('div', { class: 'page', id: 'page' }))),
      h('div', { id: 'toast' }));
    $('#q').addEventListener('input', onSearch);
    $('#q').addEventListener('keydown', e => { if (e.key === 'Escape') { e.target.value = ''; onSearch(); e.target.blur(); } if (e.key === 'Enter') { const a = $('#results a'); if (a) a.click(); } });
    document.addEventListener('click', e => { if (!e.target.closest('.search')) $('#results').hidden = true; });
    $('#burger').addEventListener('click', () => { if (window.innerWidth > 820) toggleFocus(); });
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
      if (hay.includes(q)) {
        const inTitle = x.s.title.toLowerCase().includes(q) ? 0 : 1;
        hits.push({ x, rank: inTitle });
      }
    });
    hits.sort((a, b) => a.rank - b.rank);
    if (!hits.length) box.append(h('div', { class: 'none' }, 'Kuch nahi mila. Dusra word try karo (jaise "dns", "tcp", "subnet").'));
    hits.slice(0, 9).forEach(({ x }) => box.append(h('a', { href: '#/m/' + x.m.id + '/' + x.si, onclick: () => { box.hidden = true; $('#q').value = ''; } }, x.s.title, h('small', null, x.m.title))));
    box.hidden = false;
  }

  /* ---------- sidebar nav ---------- */
  function renderNav(route) {
    const nav = $('#nav');
    nav.innerHTML = '';
    const overall = Studio.allSteps();
    const doneAll = overall.filter(x => state.steps[Studio.stepKey(x.m, x.s)]).length;
    nav.append(
      h('a', { class: 'navlink' + (route.page === 'home' ? ' on' : ''), href: '#/' }, 'Course overview', h('em', null, doneAll + '/' + overall.length)),
      h('a', { class: 'navlink' + (route.page === 'plan' ? ' on' : ''), href: '#/plan' }, '90-day plan', h('em', null, Object.keys(state.days).filter(k => state.days[k]).length + '/90')),
      h('div', { class: 'grouplabel' }, h('span', null, 'Modules'), h('span', null, Studio.modules.length)));
    Studio.modules.forEach((m, i) => {
      const p = Studio.modProgress(m);
      nav.append(h('a', { class: 'mod' + (route.page === 'step' && route.m.id === m.id ? ' on' : ''), href: '#/m/' + m.id + '/0' },
        h('span', { class: 'n' }, String(i + 1).padStart(2, '0')), m.short || m.title, p.pct === 100 ? h('span', { class: 'tick' }, '✓') : null));
    });
    if (route.page === 'step') {
      nav.append(h('div', { class: 'grouplabel' }, h('span', null, route.m.short + ' steps'), h('span', null, route.m.steps.length)));
      const list = h('div', { class: 'steplist' });
      route.m.steps.forEach((s, i) => {
        list.append(h('a', { class: 'step' + (i === route.si ? ' on' : '') + (state.steps[Studio.stepKey(route.m, s)] ? ' done' : ''), href: '#/m/' + route.m.id + '/' + i },
          h('span', { class: 'n' }, String(i + 1).padStart(2, '0')), h('span', { class: 't' }, s.title)));
      });
      nav.append(list);
    }
    nav.append(h('div', { style: { height: '10px' } }),
      h('a', { class: 'navlink' + (route.page === 'chapters' ? ' on' : ''), href: '#/chapters' }, 'Browse all chapters'),
      h('a', { class: 'navlink' + (route.page === 'tools' ? ' on' : ''), href: '#/tools' }, 'Tool lab', h('em', null, 'sab tools')));
    const foot = $('#side .sidefoot') || h('div', { class: 'sidefoot' }, h('b', null, h('i'), 'LOCAL / OFFLINE READY'), 'Poora browser mein chalta hai. Progress isi device pe save hota hai.');
    if (!foot.parentNode) $('#side').append(foot);
  }

  /* ---------- routing ---------- */
  function parse() {
    const parts = (location.hash || '#/').replace(/^#\/?/, '').split('/').filter(Boolean);
    if (!parts.length) return { page: 'home' };
    if (parts[0] === 'plan') return { page: 'plan' };
    if (parts[0] === 'chapters') return { page: 'chapters' };
    if (parts[0] === 'tools') return { page: 'tools' };
    if (parts[0] === 'm') {
      const m = Studio.findModule(parts[1]);
      if (!m) return { page: 'home' };
      let si = parseInt(parts[2] || '0', 10);
      if (!(si >= 0 && si < m.steps.length)) si = 0;
      return { page: 'step', m, si, s: m.steps[si] };
    }
    return { page: 'home' };
  }

  function go(route) {
    const page = $('#page');
    page.innerHTML = '';
    page.scrollTop = 0;
    $('#scroll').scrollTop = 0;
    document.body.classList.remove('sideopen');
    renderNav(route);
    const crumbs = $('#crumbs');
    const R = Studio.pages;
    if (route.page === 'step') {
      state.last = '#/m/' + route.m.id + '/' + route.si; save();
      crumbs.innerHTML = 'Networking Studio / <b>' + esc(route.m.title) + '</b> / ' + esc(route.s.title);
      R.step(page, route);
    } else {
      const names = { home: 'Course overview', plan: '90-day plan', chapters: 'All chapters', tools: 'Tool lab' };
      crumbs.innerHTML = 'Networking Studio / <b>' + names[route.page] + '</b>';
      R[route.page](page, route);
    }
    document.title = (route.page === 'step' ? route.s.title + ' · ' : '') + 'Networking Studio';
  }
  Studio.go = () => go(parse());
  Studio.parse = parse;
  Studio.pages = {};

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
