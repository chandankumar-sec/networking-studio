/* Widgets part 1: home network, sequence animator, cards, table, bits, subnet tools, encapsulation, routing. */
(function () {
  'use strict';
  const { h, svg, register, state } = Studio;
  const N = window.NetLib;

  function chips(list, current, onPick) {
    const wrap = h('div', { class: 'chips' });
    list.forEach(([id, label]) => {
      const b = h('button', { class: 'chip' + (id === current ? ' on' : ''), onclick: () => onPick(id) }, label);
      wrap.append(b);
    });
    return wrap;
  }

  /* ---------- 1. everyday home network ---------- */
  register('home', function (root) {
    const devices = {
      phone: { name: 'Your phone', icon: '📱', link: 'wifi', x: 120, y: 120, label: 'Phone' },
      tablet: { name: 'Tablet', icon: '📟', link: 'wifi', x: 270, y: 70, label: 'Tablet' },
      tv: { name: 'Smart TV', icon: '📺', link: 'wifi', x: 120, y: 300, label: 'Smart TV' },
      laptop: { name: 'Laptop', icon: '💻', link: 'cable', x: 290, y: 310, label: 'Laptop' },
      printer: { name: 'Printer', icon: '🖨️', link: 'cable', x: 560, y: 300, label: 'Printer' },
    };
    const scen = [['ok', 'Everything is connected'], ['cable', 'Internet cable unplugged'], ['wifioff', 'Wi-Fi turned off'], ['guest', 'Guest Wi-Fi isolation enabled']];
    let dev = 'phone', sc = 'ok';
    const host = h('div');
    root.append(h('div', { class: 'widget' }, host));

    function draw() {
      host.innerHTML = '';
      const d = devices[dev];
      const wifi = d.link === 'wifi';
      const linkUp = !(wifi && sc === 'wifioff');
      const internet = linkUp && sc !== 'cable';
      const local = linkUp && !(wifi && sc === 'guest');
      host.append(
        h('div', { class: 'chiplabel' }, 'Choose something you already use'),
        chips(Object.keys(devices).map(k => [k, devices[k].label]), dev, k => { dev = k; draw(); }),
        h('div', { class: 'chiplabel' }, 'Change one thing'),
        chips(scen, sc, k => { sc = k; draw(); }));

      const R = { x: 480, y: 195 };
      const s = svg('svg', { viewBox: '0 0 900 400', role: 'img', 'aria-label': 'Home network diagram' });
      s.append(
        svg('rect', { class: 'zone', x: 20, y: 20, width: 650, height: 360, rx: 14 }),
        svg('text', { class: 'zonelab', x: 44, y: 48 }, 'YOUR HOME NETWORK'),
        svg('rect', { class: 'zone', x: 700, y: 20, width: 180, height: 360, rx: 14 }),
        svg('text', { class: 'zonelab', x: 724, y: 48 }, 'OUTSIDE YOUR HOME'));
      // links
      Object.keys(devices).forEach(k => {
        const v = devices[k];
        const isSel = k === dev;
        const down = v.link === 'wifi' && sc === 'wifioff';
        let cls = v.link === 'wifi' ? 'wireless' : 'wire';
        if (down) cls += ' cut';
        else if (isSel) cls += ' hot flow';
        s.append(svg('line', { class: cls, x1: v.x, y1: v.y, x2: R.x, y2: R.y }));
      });
      const upCls = sc === 'cable' ? 'wire cut' : (internet ? 'wire hot flow' : 'wire');
      s.append(svg('line', { class: upCls, x1: R.x, y1: R.y, x2: 790, y2: 130 }));
      s.append(svg('line', { class: internet ? 'wire hot flow' : 'wire cut', x1: 790, y1: 175, x2: 790, y2: 270 }));
      if (sc === 'cable') s.append(svg('text', { x: 620, y: 150, fill: '#ff4d5a', 'font-size': 26, 'font-weight': 700 }, '✕'));
      // nodes
      const node = (x, y, icon, name, sub, cls) => {
        const g = svg('g', { class: 'node ' + (cls || '') });
        g.append(svg('rect', { x: x - 70, y: y - 42, width: 140, height: 84, rx: 10 }),
          svg('text', { x, y: y - 6, 'text-anchor': 'middle', 'font-size': 26 }, icon),
          svg('text', { class: 'lab', x, y: y + 18, 'text-anchor': 'middle', 'font-size': 14, 'font-weight': 700 }, name),
          svg('text', { class: 'sub', x, y: y + 34, 'text-anchor': 'middle' }, sub));
        return g;
      };
      Object.keys(devices).forEach(k => {
        const v = devices[k];
        const down = v.link === 'wifi' && sc === 'wifioff';
        const sub = down ? 'No Wi-Fi' : (v.link === 'wifi' ? (sc === 'guest' && k === dev ? 'Guest Wi-Fi' : 'Wi-Fi') : 'Ethernet cable');
        s.append(node(v.x, v.y, v.icon, v.name, sub, (k === dev ? 'sel ' : '') + (down ? 'dead' : '')));
      });
      s.append(node(R.x, R.y, '📡', 'Wi-Fi box', 'Connects your devices', ''));
      s.append(node(790, 110, '☁️', 'Internet', 'Everything outside', internet ? '' : 'dead'));
      s.append(node(790, 300, '🌐', 'Website', 'A server far away', internet ? '' : 'dead'));
      host.append(s);
      host.append(h('div', { class: 'legend' },
        h('span', null, svg('svg', { viewBox: '0 0 34 8' }, svg('line', { class: 'wire', x1: 0, y1: 4, x2: 34, y2: 4 })), 'Wired link'),
        h('span', null, svg('svg', { viewBox: '0 0 34 8' }, svg('line', { class: 'wireless', x1: 0, y1: 4, x2: 34, y2: 4 })), 'Wireless link')));
      const line = (ok, text) => h('div', null, ok ? '✅ ' : '❌ ', text);
      const bad = !internet || !local;
      let verdict = d.name + (wifi ? ' Wi-Fi se' : ' cable se') + ' connected hai.';
      if (!linkUp) verdict = d.name + ' ka Wi-Fi band hai, to wo kisi se baat nahi kar sakta.';
      host.append(h('div', { class: 'status ' + (bad ? 'bad' : 'ok') },
        h('b', null, 'Result: '), verdict,
        line(linkUp, 'Wi-Fi box tak pahunch raha hai'),
        line(internet, 'Internet / website tak pahunch raha hai'),
        line(local, 'Ghar ke baaki devices (printer, laptop) tak pahunch raha hai')));
      const why = {
        ok: 'Sab kuch sahi hai: ek hi chhota network, aur wahi Wi-Fi box internet ka darwaza hai.',
        cable: 'Cable nikalte hi ghar ke devices aapas mein baat kar sakte hain (printer chalega), par internet gaya. Dhyan do: local network aur internet alag cheezein hain.',
        wifioff: 'Wi-Fi band hone par sirf wireless devices kat jaate hain. Cable wale laptop aur printer ko farak nahi padta.',
        guest: 'Guest isolation guest devices ko internet deta hai, par ghar ke devices se door rakhta hai. Security ke liye bahut kaam ka feature.'
      };
      host.append(h('div', { class: 'note' }, why[sc] + ' Real ghar mein Wi-Fi box asal mein router + switch + access point ka combo hota hai, jo ek hi dabbe mein aata hai.'));
    }
    draw();
  });

  /* ---------- 2. sequence animator ---------- */
  register('seq', function (root, cfg) {
    const actors = cfg.actors, msgs = cfg.msgs;
    let i = -1, timer = null;
    const W = 900, top = 70, gap = 56, H = top + msgs.length * gap + 30;
    const xs = actors.map((_, k) => 110 + k * ((W - 220) / Math.max(1, actors.length - 1)));
    const box = h('div', { class: 'widget seq' });
    const svgHost = h('div'), logHost = h('div', { class: 'seqlog' }), ctrl = h('div', { class: 'row', style: { margin: '12px 0' } });
    box.append(h('div', { class: 'wtitle' }, h('span', null, cfg.title || 'Step by step'), h('span', null, 'Next dabao ya Play')), ctrl, svgHost, logHost);
    root.append(box);

    function draw() {
      svgHost.innerHTML = '';
      const s = svg('svg', { viewBox: '0 0 ' + W + ' ' + H });
      s.append(svg('defs', null,
        svg('marker', { id: 'ah', viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' }, svg('path', { d: 'M0 0 10 5 0 10z', fill: '#ff4d5a' })),
        svg('marker', { id: 'ag', viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' }, svg('path', { d: 'M0 0 10 5 0 10z', fill: '#7a7a86' }))));
      actors.forEach((a, k) => {
        s.append(svg('line', { x1: xs[k], y1: 52, x2: xs[k], y2: H - 10, stroke: '#2b2b33', 'stroke-width': 2, 'stroke-dasharray': '4 6' }));
        s.append(svg('g', { class: 'node' }, svg('rect', { x: xs[k] - 80, y: 8, width: 160, height: 40, rx: 9 }),
          svg('text', { x: xs[k], y: 33, 'text-anchor': 'middle', 'font-size': 13.5, 'font-weight': 700 }, a)));
      });
      msgs.forEach((m, k) => {
        const y = top + k * gap + 14;
        const on = k === i, past = k < i;
        const col = on ? '#ff4d5a' : (past ? '#8d8d99' : '#3a3a44');
        const x1 = xs[m.f], x2 = xs[m.t];
        if (m.f === m.t) {
          s.append(svg('path', { d: `M${x1} ${y - 8} h46 v22 h-46`, fill: 'none', stroke: col, 'stroke-width': on ? 3 : 2, 'marker-end': on ? 'url(#ah)' : 'url(#ag)' }));
          s.append(svg('text', { x: x1 + 56, y: y + 7, fill: on ? '#fff' : '#9a9aa6', 'font-size': 13 }, (k + 1) + '. ' + m.label));
        } else {
          s.append(svg('line', { x1, y1: y, x2: x2 + (x2 > x1 ? -4 : 4), y2: y, stroke: col, 'stroke-width': on ? 3 : 2, 'stroke-dasharray': m.dash ? '7 6' : null, 'marker-end': on ? 'url(#ah)' : 'url(#ag)', class: on ? 'pulse' : '' }));
          s.append(svg('text', { x: (x1 + x2) / 2, y: y - 8, 'text-anchor': 'middle', fill: on ? '#fff' : '#9a9aa6', 'font-size': 13, 'font-weight': on ? 700 : 400 }, (k + 1) + '. ' + m.label));
        }
      });
      svgHost.append(s);
      logHost.innerHTML = '';
      msgs.forEach((m, k) => {
        if (k > i) return;
        logHost.append(h('div', { class: 'seqmsg ' + (k === i ? 'on' : 'past') },
          h('b', null, (k + 1) + '. ' + actors[m.f] + (m.f === m.t ? '' : ' → ' + actors[m.t]) + ': '), m.detail));
      });
      if (i < 0) logHost.append(h('div', { class: 'seqmsg' }, 'Abhi kuch nahi hua. "Next" dabao aur dekho pehle kya hota hai.'));
    }
    function stop() { clearInterval(timer); timer = null; drawCtrl(); }
    function step(d) { i = Math.max(-1, Math.min(msgs.length - 1, i + d)); draw(); drawCtrl(); }
    function play() {
      if (Studio.paused()) { Studio.toast('Motion paused hai. Next se step karo.'); return; }
      if (i >= msgs.length - 1) i = -1;
      timer = setInterval(() => {
        if (!box.isConnected || i >= msgs.length - 1) { stop(); return; }
        step(1);
      }, 1500);
      step(1);
    }
    function drawCtrl() {
      ctrl.innerHTML = '';
      ctrl.append(
        h('button', { class: 'btn sm', onclick: () => { stop(); step(-1); }, disabled: i < 0 ? true : null }, '← Back'),
        h('button', { class: 'btn sm primary', onclick: () => { stop(); step(1); }, disabled: i >= msgs.length - 1 ? true : null }, 'Next →'),
        h('button', { class: 'btn sm', onclick: () => timer ? stop() : play() }, timer ? '⏸ Pause' : '▶ Play'),
        h('button', { class: 'btn sm', onclick: () => { stop(); i = -1; draw(); drawCtrl(); } }, 'Reset'),
        h('span', { class: 'muted' }, Math.max(0, i + 1) + ' / ' + msgs.length));
    }
    draw(); drawCtrl();
  });

  /* ---------- 3. reveal cards ---------- */
  register('cards', function (root, cfg) {
    const box = h('div', { class: 'widget' }, h('div', { class: 'wtitle' }, h('span', null, cfg.title || 'Click karke kholo')));
    const g = h('div', { class: 'cardsgrid' });
    (cfg.items || []).forEach(it => {
      const c = h('button', { class: 'rcard', 'aria-expanded': 'false', onclick: () => { const o = c.classList.toggle('open'); c.setAttribute('aria-expanded', o); } },
        h('h4', null, it.t), h('div', { class: 'muted', style: { fontSize: '13px' } }, it.d || ''), h('div', { class: 'more', html: it.more || '' }));
      g.append(c);
    });
    box.append(g); root.append(box);
  });

  /* ---------- 4. filterable table ---------- */
  register('table', function (root, cfg) {
    const box = h('div', { class: 'widget' }, h('div', { class: 'wtitle' }, h('span', null, cfg.title || '')));
    const inp = h('input', { class: 'in', placeholder: cfg.placeholder || 'Filter karo...', style: { marginBottom: '10px', width: '100%' } });
    const t = h('table', { class: 't' }, h('thead', null, h('tr', null, cfg.cols.map(c => h('th', null, c)))));
    const tb = h('tbody'); t.append(tb);
    function draw() {
      const q = inp.value.toLowerCase();
      tb.innerHTML = '';
      cfg.rows.forEach(r => { if (!q || r.join(' ').toLowerCase().includes(q)) tb.append(h('tr', null, r.map((c, k) => h('td', { class: k === 0 ? 'mono' : '', html: String(c) })))); });
      if (!tb.children.length) tb.append(h('tr', null, h('td', { colspan: cfg.cols.length, class: 'muted' }, 'Kuch match nahi hua.')));
    }
    inp.addEventListener('input', draw);
    if (cfg.filter !== false) box.append(inp);
    box.append(t); root.append(box); draw();
  });

  /* ---------- 5. binary / IP bits ---------- */
  register('bits', function (root) {
    const oct = [192, 168, 1, 10];
    const box = h('div', { class: 'widget' }, h('div', { class: 'wtitle' }, h('span', null, 'IP address ke bits'), h('span', null, 'Bit pe click karke 0/1 badlo')));
    const row = h('div', { class: 'grid3', style: { gridTemplateColumns: 'repeat(4,1fr)' } });
    const out = h('div', { class: 'status' });
    const inp = h('input', { class: 'in', value: '192.168.1.10', style: { width: '190px' }, 'aria-label': 'IP address' });
    box.append(h('div', { class: 'row', style: { marginBottom: '12px' } }, h('label', { class: 'lb', style: { margin: 0 } }, 'Ya seedha IP likho:'), inp), row, out);
    root.append(box);
    inp.addEventListener('input', () => { const v = N.ip2int(inp.value); if (v !== null) { for (let k = 0; k < 4; k++) oct[k] = (v >>> (24 - 8 * k)) & 255; draw(false); } });
    function draw(syncInput) {
      row.innerHTML = '';
      oct.forEach((val, k) => {
        const bits = h('div', { class: 'bits' });
        for (let b = 7; b >= 0; b--) {
          const on = (val >> b) & 1;
          bits.append(h('div', { class: 'bitcell' }, h('button', { class: 'bit' + (on ? ' on' : ''), 'aria-label': 'bit ' + (1 << b), onclick: () => { oct[k] ^= (1 << b); draw(true); } }, on), h('small', null, 1 << b)));
        }
        row.append(h('div', { class: 'octet' }, bits, h('div', { class: 'dec' }, val)));
      });
      const ip = oct.join('.');
      if (syncInput) inp.value = ip;
      const n = N.ip2int(ip);
      out.innerHTML = '';
      out.append(h('div', null, h('b', null, 'Decimal: '), ip), h('div', { class: 'mono' }, h('b', { style: { fontFamily: 'var(--font)' } }, 'Binary: '), N.dottedBin(n)),
        h('div', null, h('b', null, 'Class: '), N.ipClass(n), ' · ', h('b', null, 'Type: '), N.ipKind(n)));
    }
    draw(true);
  });

  /* ---------- 6. subnet calculator ---------- */
  register('subnet', function (root, cfg) {
    const box = h('div', { class: 'widget' }, h('div', { class: 'wtitle' }, h('span', null, 'Subnet calculator'), h('span', null, 'CIDR ya mask dono chalte hain')));
    const inp = h('input', { class: 'in', value: (cfg && cfg.start) || '192.168.1.130/26', style: { width: '230px' }, 'aria-label': 'IP/CIDR' });
    const slider = h('input', { type: 'range', min: 0, max: 32, value: 26, 'aria-label': 'prefix length', style: { accentColor: '#e5383b', width: '220px' } });
    const out = h('div'); const split = h('div');
    box.append(h('div', { class: 'row' }, h('div', null, h('label', { class: 'lb' }, 'IP/prefix (192.168.1.130/26)'), inp), h('div', null, h('label', { class: 'lb' }, 'Prefix slider'), slider)), out, split);
    root.append(box);
    function parse() { return N.parseCidr(inp.value); }
    function draw() {
      out.innerHTML = split.innerHTML = '';
      const c = parse();
      if (!c) { out.append(h('div', { class: 'status bad' }, 'Format galat hai. Aise likho: 192.168.1.10/24')); return; }
      slider.value = c.prefix;
      const s = N.subnetInfo(c.ip, c.prefix);
      const bin = N.toBin(c.ip, 32);
      const colored = h('div', { class: 'nbits', style: { margin: '14px 0' } },
        h('span', { class: 'net' }, bin.slice(0, c.prefix)), h('span', { class: 'host' }, bin.slice(c.prefix)));
      const dotted = [0, 8, 16, 24].map(k => bin.slice(k, k + 8));
      const pretty = h('div', { class: 'nbits', style: { margin: '14px 0', fontSize: '15px' } });
      let pos = 0;
      dotted.forEach((oc, k) => {
        oc.split('').forEach(ch => { pretty.append(h('span', { class: pos < c.prefix ? 'net' : 'host' }, ch)); pos++; });
        if (k < 3) pretty.append('.');
      });
      out.append(h('div', { class: 'legend', style: { marginTop: '12px' } }, h('span', { style: { color: 'var(--red)' } }, '■ Network bits (' + c.prefix + ')'), h('span', { style: { color: 'var(--blue)' } }, '■ Host bits (' + (32 - c.prefix) + ')')), pretty,
        h('dl', { class: 'kv' },
          h('dt', null, 'Network address'), h('dd', null, N.int2ip(s.network) + '/' + c.prefix),
          h('dt', null, 'Subnet mask'), h('dd', null, N.int2ip(s.mask)),
          h('dt', null, 'Wildcard mask'), h('dd', null, N.int2ip(s.wildcard)),
          h('dt', null, 'Broadcast address'), h('dd', null, N.int2ip(s.broadcast)),
          h('dt', null, 'First usable host'), h('dd', null, N.int2ip(s.first)),
          h('dt', null, 'Last usable host'), h('dd', null, N.int2ip(s.last)),
          h('dt', null, 'Usable hosts'), h('dd', null, s.hosts.toLocaleString()),
          h('dt', null, 'Total addresses'), h('dd', null, s.total.toLocaleString()),
          h('dt', null, 'Type'), h('dd', null, N.ipKind(c.ip) + ' · Class ' + N.ipClass(c.ip))));
      if (c.prefix < 30) {
        const np = Math.min(32, c.prefix + 2);
        const sel = h('select', { class: 'in' });
        for (let p = c.prefix + 1; p <= Math.min(30, c.prefix + 6); p++) sel.append(h('option', { value: p, selected: p === np ? true : null }, '/' + p + ' (' + Math.pow(2, p - c.prefix) + ' subnets)'));
        const tableHost = h('div');
        const drawSplit = () => {
          tableHost.innerHTML = '';
          const list = N.splitNetwork(s.network, c.prefix, Number(sel.value));
          const t = h('table', { class: 't' }, h('tr', null, ['#', 'Network', 'Usable range', 'Broadcast'].map(x => h('th', null, x))));
          list.forEach((x, k) => t.append(h('tr', { class: N.sameSubnet(x.network, c.ip, Number(sel.value)) ? 'hl' : '' }, h('td', null, k + 1), h('td', { class: 'mono' }, N.int2ip(x.network) + '/' + x.prefix), h('td', { class: 'mono' }, N.int2ip(x.first) + ' - ' + N.int2ip(x.last)), h('td', { class: 'mono' }, N.int2ip(x.broadcast)))));
          tableHost.append(t);
        };
        sel.addEventListener('change', drawSplit);
        split.append(h('h3', null, 'Is network ko chhote subnets mein todo'), sel, h('div', { style: { height: '8px' } }), tableHost);
        drawSplit();
      }
    }
    inp.addEventListener('input', draw);
    slider.addEventListener('input', () => { const c = parse(); const ip = c ? N.int2ip(c.ip) : '192.168.1.130'; inp.value = ip + '/' + slider.value; draw(); });
    draw();
  });

  /* ---------- 7. subnet practice ---------- */
  register('subnetquiz', function (root) {
    const box = h('div', { class: 'widget' }, h('div', { class: 'wtitle' }, h('span', null, 'Subnetting practice'), h('span', { id: 'score' }, '')));
    const qEl = h('div', { style: { fontSize: '17px', margin: '8px 0 12px' } });
    const inp = h('input', { class: 'in', style: { width: '260px' }, 'aria-label': 'answer' });
    const res = h('div'); const hint = h('div', { class: 'note', hidden: true });
    let cur, right = 0, tried = 0;
    const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
    function make() {
      const kind = rnd(0, 3);
      const prefix = rnd(16, 29);
      const ip = N.int2ip(((rnd(10, 200) << 24) | (rnd(0, 255) << 16) | (rnd(0, 255) << 8) | rnd(1, 254)) >>> 0);
      const info = N.subnetInfo(N.ip2int(ip), prefix);
      if (kind === 0) return { q: `/${prefix} mein kitne usable hosts hote hain?`, a: String(info.hosts), h: `2^(32-${prefix}) - 2 = ${info.total} - 2 = ${info.hosts}` };
      if (kind === 1) return { q: `${ip}/${prefix} ka network address kya hai?`, a: N.int2ip(info.network), h: `IP ko mask ${N.int2ip(info.mask)} ke saath AND karo.` };
      if (kind === 2) return { q: `${ip}/${prefix} ka broadcast address kya hai?`, a: N.int2ip(info.broadcast), h: `Network ${N.int2ip(info.network)} ke saare host bits 1 kar do.` };
      return { q: `/${prefix} ka subnet mask dotted form mein kya hoga?`, a: N.int2ip(info.mask), h: `${prefix} ones, phir zeros. Octet-by-octet likho.` };
    }
    function next() { cur = make(); qEl.textContent = cur.q; inp.value = ''; res.innerHTML = ''; hint.hidden = true; inp.focus(); }
    function check() {
      if (!inp.value.trim()) return;
      tried++;
      const ok = inp.value.trim() === cur.a;
      if (ok) right++;
      res.innerHTML = '';
      res.append(h('div', { class: 'status ' + (ok ? 'ok' : 'bad') }, ok ? '✅ Sahi!' : '❌ Sahi jawab: ' + cur.a));
      hint.hidden = false; hint.textContent = 'Trick: ' + cur.h;
      box.querySelector('#score').textContent = 'Score ' + right + '/' + tried;
    }
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') check(); });
    box.append(qEl, h('div', { class: 'row' }, inp, h('button', { class: 'btn primary', onclick: check }, 'Check'), h('button', { class: 'btn', onclick: next }, 'Naya sawal')), res, hint);
    root.append(box); next();
  });

  /* ---------- 8. encapsulation stepper ---------- */
  register('encap', function (root) {
    const box = h('div', { class: 'widget' }, h('div', { class: 'wtitle' }, h('span', null, 'Message ka safar: layers lagte hain'), h('span', null, 'Encapsulation')));
    const msg = h('input', { class: 'in', value: 'GET /hello', style: { width: '260px' }, 'aria-label': 'message' });
    let step = 0, dir = 'send';
    const stack = h('div'), info = h('div', { class: 'status' }), ctrl = h('div', { class: 'row', style: { margin: '12px 0' } });
    box.append(h('div', { class: 'row' }, h('div', null, h('label', { class: 'lb' }, 'Apna message likho'), msg)), ctrl, stack, info);
    root.append(box);
    const layers = [
      { n: 'Application data', c: '#5aa9ff', d: () => `"${msg.value}"`, e: 'Ye asli message hai jo app (browser) bhejna chahta hai.' },
      { n: 'TCP header (Layer 4)', c: '#3ddc97', d: () => 'src port 51514 → dst port 80, seq 1', e: 'Port batata hai kaunsi app ke liye hai (80 = web). Order aur reliability ka kaam bhi yahi karta hai.' },
      { n: 'IP header (Layer 3)', c: '#ffb454', d: () => '192.168.1.10 → 93.184.216.34, TTL 64', e: 'IP address batata hai kaun se computer ko jana hai. Routers sirf isse dekhte hain.' },
      { n: 'Ethernet frame (Layer 2)', c: '#ff4d5a', d: () => 'MAC aa:bb:cc:11:22:33 → MAC de:ad:be:ef:00:01', e: 'Agle hop (router) ka MAC address. Ye sirf local network tak chalta hai, har hop pe badal jata hai.' },
      { n: 'Bits on the wire (Layer 1)', c: '#b794f6', d: () => '0100011101000101...', e: 'Aakhir mein sab kuch bijli ke signal ya Wi-Fi waves mein 0 aur 1 ban jata hai.' },
    ];
    function draw() {
      ctrl.innerHTML = '';
      ctrl.append(
        h('button', { class: 'btn sm primary', onclick: () => { step = Math.min(layers.length - 1, step + 1); draw(); }, disabled: step >= layers.length - 1 ? true : null }, dir === 'send' ? 'Agla layer lagao →' : 'Agla layer hatao →'),
        h('button', { class: 'btn sm', onclick: () => { step = Math.max(0, step - 1); draw(); } }, '← Peeche'),
        h('button', { class: 'btn sm', onclick: () => { step = 0; draw(); } }, 'Reset'),
        h('button', { class: 'btn sm', onclick: () => { dir = dir === 'send' ? 'recv' : 'send'; step = 0; draw(); } }, dir === 'send' ? 'Receiver side dekho' : 'Sender side dekho'));
      stack.innerHTML = '';
      // sender: visible layers = 0..step ; receiver: starts full, removes outer layers
      const visible = dir === 'send' ? step : layers.length - 1 - step;
      // layers nest: outermost = highest k, so Ethernet wraps IP wraps TCP wraps data
      stack.append(buildNested(Math.min(visible, 3)));
      if (visible >= 4) stack.append(h('div', { class: 'pre', style: { marginTop: '10px', color: '#b794f6' } }, 'Bits: ' + bitsOf(msg.value)));
      const cur = layers[visible];
      info.innerHTML = '';
      info.append(h('b', null, (dir === 'send' ? 'Sender: ' : 'Receiver: ') + cur.n + '. '), cur.e);
    }
    function buildNested(maxK) {
      let el = null;
      for (let k = 0; k <= maxK; k++) {
        const L = layers[k];
        const outer = h('div', { style: { border: `2px solid ${L.c}`, borderRadius: '10px', padding: '10px 12px', background: 'rgba(255,255,255,.015)' } },
          h('div', { style: { color: L.c, fontSize: '12px', fontWeight: 700, letterSpacing: '.05em', marginBottom: '6px' } }, L.n.toUpperCase()),
          h('div', { class: 'mono', style: { fontSize: '12.5px', marginBottom: el ? '8px' : 0 } }, L.d()));
        if (el) outer.append(el);
        el = outer;
      }
      return el;
    }
    function bitsOf(t) { return Array.from(t.slice(0, 6)).map(ch => ch.charCodeAt(0).toString(2).padStart(8, '0')).join(' ') + (t.length > 6 ? ' ...' : ''); }
    msg.addEventListener('input', draw);
    draw();
  });

  /* ---------- 9. routing table lookup ---------- */
  register('route', function (root) {
    const routes = [
      { net: '0.0.0.0/0', via: 'ISP gateway 203.0.113.1', note: 'Default route: baaki sab' },
      { net: '10.0.0.0/8', via: 'Router B', note: 'Office ka bada network' },
      { net: '10.1.0.0/16', via: 'Router C', note: 'Branch office' },
      { net: '10.1.5.0/24', via: 'Router D', note: 'Server room' },
      { net: '192.168.1.0/24', via: 'Directly connected (eth0)', note: 'Apna LAN' },
    ];
    const box = h('div', { class: 'widget' }, h('div', { class: 'wtitle' }, h('span', null, 'Routing table lookup'), h('span', null, 'Longest prefix match')));
    const inp = h('input', { class: 'in', value: '10.1.5.20', style: { width: '200px' }, 'aria-label': 'destination IP' });
    const tbl = h('div'), res = h('div'); const addNet = h('input', { class: 'in', placeholder: '172.16.0.0/12', style: { width: '160px' } }), addVia = h('input', { class: 'in', placeholder: 'Router E', style: { width: '140px' } });
    box.append(h('div', { class: 'row' }, h('div', null, h('label', { class: 'lb' }, 'Packet ka destination IP'), inp),
      h('div', { class: 'row', style: { marginLeft: 'auto' } }, chips([['10.1.5.20', '10.1.5.20'], ['10.1.9.9', '10.1.9.9'], ['10.200.0.1', '10.200.0.1'], ['8.8.8.8', '8.8.8.8'], ['192.168.1.77', '192.168.1.77']], '', v => { inp.value = v; draw(); }))),
      tbl, res,
      h('div', { class: 'row', style: { marginTop: '12px' } }, addNet, addVia, h('button', { class: 'btn sm', onclick: () => { if (N.parseCidr(addNet.value) && addVia.value) { routes.push({ net: addNet.value.trim(), via: addVia.value, note: 'Tumne add kiya' }); addNet.value = addVia.value = ''; draw(); } else Studio.toast('Valid CIDR aur next hop likho'); } }, '+ Route add karo')));
    root.append(box);
    function draw() {
      tbl.innerHTML = res.innerHTML = '';
      const d = N.ip2int(inp.value);
      const m = d === null ? [] : N.matchRoutes(d, routes);
      const winIdx = m.length ? m[0].idx : -1;
      const matchSet = new Set(m.map(x => x.idx));
      const t = h('table', { class: 't' }, h('tr', null, ['Destination network', 'Next hop', 'Matches?', 'Note'].map(x => h('th', null, x))));
      routes.forEach((r, k) => t.append(h('tr', { class: k === winIdx ? 'win' : (matchSet.has(k) ? 'hl' : '') }, h('td', { class: 'mono' }, r.net), h('td', null, r.via), h('td', null, k === winIdx ? '✅ WINNER' : (matchSet.has(k) ? 'match (kam specific)' : '—')), h('td', { class: 'muted' }, r.note))));
      tbl.append(t);
      if (d === null) res.append(h('div', { class: 'status bad' }, 'Valid IP likho (jaise 10.1.5.20).'));
      else if (winIdx < 0) res.append(h('div', { class: 'status bad' }, 'Koi route match nahi hua. Packet drop ho jayega ("Destination unreachable").'));
      else res.append(h('div', { class: 'status ok' }, h('b', null, 'Router ka faisla: '), 'packet ' + routes[winIdx].via + ' ko bhejo, kyunki ' + routes[winIdx].net + ' sabse specific (lamba prefix /' + m[0].prefix + ') match hai.'));
    }
    inp.addEventListener('input', draw); draw();
  });
})();
