/* Widgets part 3 (advanced): TCP congestion, OSPF shortest path, VLSM planner, bandwidth calculator. */
(function () {
  'use strict';
  const { h, svg, register } = Studio;
  const N = window.NetLib;

  /* ---------- TCP congestion window ---------- */
  register('tcpwin', function (root) {
    let loss = 3, algo = 'reno', seed = 7, rounds = 40;
    const box = h('div', { class: 'widget' }, h('div', { class: 'wtitle' }, h('span', null, 'TCP congestion window'), h('span', null, 'Packet loss changes the speed')));
    const lossLab = h('b', null, '3%');
    const slider = h('input', { type: 'range', min: 0, max: 15, value: 3, 'aria-label': 'packet loss percent', style: { width: '220px' } });
    const chart = h('div'), info = h('div', { class: 'status' });
    const algoBox = h('div', { class: 'chips', style: { margin: '10px 0' } });
    const reroll = h('button', { class: 'btn sm', onclick: () => { seed = Math.floor(Math.random() * 1e6); draw(); } }, 'New random run');
    box.append(h('div', { class: 'rangeline' }, h('label', { class: 'lb', style: { margin: 0 } }, 'Packet loss:'), slider, lossLab, reroll), algoBox, chart, info);
    root.append(box);

    function rng() { let s = seed; return () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; }; }
    function simulate() {
      const r = rng(); let cwnd = 1, ssthresh = 32; const pts = []; let sent = 0, losses = 0;
      for (let t = 0; t < rounds; t++) {
        pts.push({ t, cwnd, ssthresh });
        const lost = r() < 1 - Math.pow(1 - loss / 100, cwnd);
        sent += cwnd;
        if (lost) {
          losses++;
          ssthresh = Math.max(2, Math.floor(cwnd / 2));
          cwnd = algo === 'tahoe' ? 1 : ssthresh;
        } else cwnd = cwnd < ssthresh ? Math.min(cwnd * 2, ssthresh) : cwnd + 1;
      }
      return { pts, sent, losses };
    }
    function draw() {
      lossLab.textContent = loss + '%';
      algoBox.innerHTML = '';
      [['reno', 'TCP Reno (halves on loss)'], ['tahoe', 'TCP Tahoe (restarts from 1)']].forEach(([k, l]) => algoBox.append(h('button', { class: 'chip' + (k === algo ? ' on' : ''), onclick: () => { algo = k; draw(); } }, l)));
      const { pts, sent, losses } = simulate();
      const W = 860, H = 260, pad = 36, max = Math.max(40, ...pts.map(p => p.cwnd)) + 4;
      const x = t => pad + t * (W - pad - 10) / (rounds - 1), y = v => H - pad - v * (H - pad - 14) / max;
      const s = svg('svg', { viewBox: `0 0 ${W} ${H}` });
      s.append(svg('line', { class: 'chartaxis', x1: pad, y1: H - pad, x2: W - 10, y2: H - pad }), svg('line', { class: 'chartaxis', x1: pad, y1: 10, x2: pad, y2: H - pad }),
        svg('text', { class: 'chartlab', x: W / 2, y: H - 8, 'text-anchor': 'middle' }, 'Time (round trips)'), svg('text', { class: 'chartlab', x: 4, y: 20 }, 'cwnd'));
      let d = '';
      pts.forEach((p, i) => { d += (i ? 'L' : 'M') + x(p.t) + ' ' + y(p.cwnd); });
      s.append(svg('path', { class: 'chartline', d }));
      pts.forEach((p, i) => { if (i && pts[i - 1].cwnd > p.cwnd) s.append(svg('circle', { cx: x(p.t), cy: y(p.cwnd), r: 4, fill: '#ffb454' })); });
      chart.innerHTML = ''; chart.append(s);
      const avg = (pts.reduce((a, p) => a + p.cwnd, 0) / pts.length).toFixed(1);
      info.innerHTML = '';
      info.append(h('div', null, h('b', null, 'Average window: '), avg + ' segments · ', h('b', null, 'Loss events: '), losses + ' (orange dots) · ', h('b', null, 'Segments sent: '), sent),
        h('div', { class: 'muted', style: { marginTop: '6px' } }, 'The line grows fast at first (slow start), then slowly (congestion avoidance). Every loss event cuts it. More loss means a lower average window, so slower downloads.'));
    }
    slider.addEventListener('input', () => { loss = +slider.value; draw(); });
    draw();
  });

  /* ---------- OSPF shortest path ---------- */
  register('ospf', function (root) {
    const pos = { A: [90, 70], B: [300, 40], C: [520, 70], D: [200, 220], E: [430, 220], F: [660, 220] };
    let links = [
      { a: 'A', b: 'B', c: 1, up: true }, { a: 'B', b: 'C', c: 1, up: true }, { a: 'A', b: 'D', c: 4, up: true },
      { a: 'B', b: 'D', c: 2, up: true }, { a: 'B', b: 'E', c: 5, up: true }, { a: 'C', b: 'E', c: 1, up: true },
      { a: 'D', b: 'E', c: 3, up: true }, { a: 'C', b: 'F', c: 4, up: true }, { a: 'E', b: 'F', c: 1, up: true },
    ];
    let src = 'A', dst = 'F';
    const box = h('div', { class: 'widget' }, h('div', { class: 'wtitle' }, h('span', null, 'OSPF shortest path (Dijkstra)'), h('span', null, 'Click a link: change its cost or cut it')));
    const ctl = h('div', { class: 'row' }), host = h('div'), info = h('div', { class: 'status' });
    box.append(ctl, host, info); root.append(box);

    function dijkstra(from) {
      const dist = {}, prev = {}, seen = {};
      Object.keys(pos).forEach(k => { dist[k] = Infinity; }); dist[from] = 0;
      for (;;) {
        let u = null;
        Object.keys(pos).forEach(k => { if (!seen[k] && dist[k] < Infinity && (u === null || dist[k] < dist[u])) u = k; });
        if (u === null) break; seen[u] = true;
        links.filter(l => l.up && (l.a === u || l.b === u)).forEach(l => {
          const v = l.a === u ? l.b : l.a;
          if (dist[u] + l.c < dist[v]) { dist[v] = dist[u] + l.c; prev[v] = u; }
        });
      }
      return { dist, prev };
    }
    function pathTo(prev, to) { const p = [to]; while (prev[p[0]]) p.unshift(prev[p[0]]); return p; }
    function draw() {
      ctl.innerHTML = '';
      const selOf = (v, f) => h('select', { class: 'in', onchange: e => f(e.target.value) }, Object.keys(pos).map(k => h('option', { value: k, selected: k === v ? true : null }, 'Router ' + k)));
      ctl.append(h('label', { class: 'lb', style: { margin: 0 } }, 'From'), selOf(src, v => { src = v; draw(); }), h('label', { class: 'lb', style: { margin: 0 } }, 'To'), selOf(dst, v => { dst = v; draw(); }),
        h('button', { class: 'btn sm', onclick: () => { links.forEach(l => { l.up = true; }); draw(); } }, 'Restore all links'));
      const { dist, prev } = dijkstra(src);
      const best = dist[dst] < Infinity && src !== dst ? pathTo(prev, dst) : [];
      const onPath = (a, b) => best.some((n, i) => i < best.length - 1 && ((n === a && best[i + 1] === b) || (n === b && best[i + 1] === a)));
      const s = svg('svg', { viewBox: '0 0 760 290' });
      links.forEach(l => {
        const [x1, y1] = pos[l.a], [x2, y2] = pos[l.b];
        const hot = l.up && onPath(l.a, l.b);
        const ln = svg('line', { class: 'wire' + (hot ? ' hot flow' : '') + (l.up ? '' : ' cut'), x1, y1, x2, y2 });
        const hit = svg('line', { x1, y1, x2, y2, stroke: 'transparent', 'stroke-width': 18, style: 'cursor:pointer' });
        hit.addEventListener('click', () => { if (!l.up) { l.up = true; } else if (l.c >= 6) { l.up = false; l.c = 1; } else l.c++; draw(); });
        s.append(ln, hit, svg('text', { x: (x1 + x2) / 2, y: (y1 + y2) / 2 - 6, fill: l.up ? '#ffb454' : '#666', 'font-size': 14, 'font-weight': 700, 'text-anchor': 'middle' }, l.up ? 'cost ' + l.c : 'DOWN'));
      });
      Object.keys(pos).forEach(k => {
        const [x, y] = pos[k];
        const g = svg('g', { class: 'node' + (best.includes(k) ? ' sel' : '') });
        g.append(svg('rect', { x: x - 32, y: y - 24, width: 64, height: 48, rx: 10 }), svg('text', { class: 'lab', x, y: y - 2, 'text-anchor': 'middle', 'font-size': 16, 'font-weight': 700 }, k), svg('text', { class: 'sub', x, y: y + 15, 'text-anchor': 'middle' }, k === src ? 'source' : (k === dst ? 'target' : 'router')));
        s.append(g);
      });
      host.innerHTML = ''; host.append(s);
      info.innerHTML = '';
      if (src === dst) info.append('Source and target are the same router.');
      else if (!best.length) info.append(h('b', null, 'No path. '), 'The network is split, so these routers cannot reach each other.');
      else info.append(h('b', null, 'Best path: '), best.join(' → '), h('b', null, '  Total cost: '), String(dist[dst]), h('div', { class: 'muted', style: { marginTop: '6px' } }, 'OSPF picks the path with the lowest total cost. Cut a link on the red path and watch the routers find a new one. That automatic recovery is why we use dynamic routing.'));
      const t = h('table', { class: 't', style: { marginTop: '10px' } }, h('tr', null, ['Destination', 'Cost', 'Path from ' + src].map(x => h('th', null, x))));
      Object.keys(pos).filter(k => k !== src).forEach(k => t.append(h('tr', null, h('td', { class: 'mono' }, 'Router ' + k), h('td', null, dist[k] === Infinity ? '∞' : dist[k]), h('td', { class: 'muted' }, dist[k] === Infinity ? 'unreachable' : pathTo(prev, k).join(' → ')))));
      info.append(t);
    }
    draw();
  });

  /* ---------- VLSM planner ---------- */
  register('vlsm', function (root) {
    const box = h('div', { class: 'widget' }, h('div', { class: 'wtitle' }, h('span', null, 'VLSM planner'), h('span', null, 'Give each subnet only the size it needs')));
    const base = h('input', { class: 'in', value: '192.168.10.0/24', style: { width: '190px' }, 'aria-label': 'base network' });
    const reqs = h('textarea', { class: 'in', rows: 5, style: { width: '260px' }, 'aria-label': 'requirements' });
    reqs.value = 'Sales 60\nHR 25\nServers 10\nRouter link 2';
    const out = h('div');
    box.append(h('div', { class: 'row', style: { alignItems: 'flex-start' } }, h('div', null, h('label', { class: 'lb' }, 'Base network'), base), h('div', null, h('label', { class: 'lb' }, 'Name and hosts needed (one per line)'), reqs)), out);
    root.append(box);
    function draw() {
      out.innerHTML = '';
      const c = N.parseCidr(base.value);
      if (!c) { out.append(h('div', { class: 'status bad' }, 'Base network is not valid.')); return; }
      const netInfo = N.subnetInfo(c.ip, c.prefix);
      const lines = reqs.value.split('\n').map(l => l.trim()).filter(Boolean).map(l => { const m = l.match(/^(.*?)\s+(\d+)$/); return m ? { name: m[1], need: +m[2] } : null; });
      if (lines.some(x => !x)) { out.append(h('div', { class: 'status bad' }, 'Each line must look like: Sales 60')); return; }
      let cursor = netInfo.network; const end = netInfo.broadcast; const rows = []; let fail = null;
      lines.slice().sort((a, b) => b.need - a.need).forEach(r => {
        if (fail) return;
        let bitsNeeded = 2; while (Math.pow(2, bitsNeeded) - 2 < r.need) bitsNeeded++;
        const prefix = 32 - bitsNeeded, size = Math.pow(2, bitsNeeded);
        if (cursor + size - 1 > end) { fail = r; return; }
        const sn = N.subnetInfo(cursor, prefix);
        rows.push({ r, sn, prefix, wasted: sn.hosts - r.need }); cursor += size;
      });
      if (fail) out.append(h('div', { class: 'status bad' }, `Not enough space for "${fail.name}" (${fail.need} hosts). Use a bigger base network or fewer hosts.`));
      const t = h('table', { class: 't', style: { marginTop: '12px' } }, h('tr', null, ['Subnet', 'Needed', 'Prefix', 'Network', 'Usable range', 'Broadcast', 'Spare'].map(x => h('th', null, x))));
      rows.forEach(({ r, sn, prefix, wasted }) => t.append(h('tr', null, h('td', null, r.name), h('td', null, r.need), h('td', { class: 'mono' }, '/' + prefix), h('td', { class: 'mono' }, N.int2ip(sn.network)), h('td', { class: 'mono' }, N.int2ip(sn.first) + ' - ' + N.int2ip(sn.last)), h('td', { class: 'mono' }, N.int2ip(sn.broadcast)), h('td', null, wasted))));
      out.append(h('div', { style: { overflowX: 'auto' } }, t));
      if (!fail) out.append(h('div', { class: 'note' }, 'Rule: sort from the biggest to the smallest, give each one the smallest block that fits (hosts + 2), and place them one after another. The biggest first keeps every block on a clean boundary and wastes the least space. Free space left: ' + (end - cursor + 1) + ' addresses.'));
    }
    base.addEventListener('input', draw); reqs.addEventListener('input', draw); draw();
  });

  /* ---------- bandwidth calculator ---------- */
  register('bandwidth', function (root) {
    const box = h('div', { class: 'widget' }, h('div', { class: 'wtitle' }, h('span', null, 'Bandwidth, latency and transfer time'), h('span', null, 'Play with the numbers')));
    const size = h('input', { class: 'in', type: 'number', value: 500, min: 1, style: { width: '110px' } });
    const unit = h('select', { class: 'in' }, ['MB', 'GB', 'KB'].map(u => h('option', null, u)));
    const speed = h('input', { class: 'in', type: 'number', value: 100, min: 1, style: { width: '110px' } });
    const rtt = h('input', { class: 'in', type: 'number', value: 40, min: 0, style: { width: '90px' } });
    const out = h('div', { class: 'status' });
    box.append(h('div', { class: 'row' },
      h('div', null, h('label', { class: 'lb' }, 'File size'), h('div', { class: 'row', style: { gap: '6px' } }, size, unit)),
      h('div', null, h('label', { class: 'lb' }, 'Link speed (Mbps = megabits/second)'), speed),
      h('div', null, h('label', { class: 'lb' }, 'Round-trip latency (ms)'), rtt)), out);
    root.append(box);
    const fmt = s => s < 1 ? (s * 1000).toFixed(0) + ' ms' : s < 120 ? s.toFixed(1) + ' s' : s < 7200 ? (s / 60).toFixed(1) + ' min' : (s / 3600).toFixed(1) + ' h';
    function draw() {
      const mult = { KB: 1e3, MB: 1e6, GB: 1e9 }[unit.value];
      const bits = size.value * mult * 8, bps = speed.value * 1e6, lat = rtt.value / 1000;
      const ideal = bits / bps;
      const bdp = bps * lat / 8;
      out.innerHTML = '';
      out.append(h('div', null, h('b', null, 'Ideal download time: '), fmt(ideal), ' (size in bits ÷ speed). 100 Mbps is about ' + (bps / 8 / 1e6).toFixed(1) + ' MB per second, not 100.'),
        h('div', null, h('b', null, 'Bandwidth-delay product: '), (bdp / 1000).toFixed(0) + ' KB. This is how much data must be "in flight" to keep the link full. TCP needs a window at least this big, or the link sits idle.'),
        h('div', null, h('b', null, 'Time just to say hello (TCP + TLS): '), fmt(lat * 3), ' (about 3 round trips before any data). For tiny files, latency matters more than bandwidth.'));
    }
    [size, unit, speed, rtt].forEach(e => e.addEventListener('input', draw)); draw();
  });
})();
