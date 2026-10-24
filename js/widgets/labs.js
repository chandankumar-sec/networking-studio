/* Widgets part 2: topology builder, firewall, packet capture, nmap/ping sims, HTTP builder, decision trees, port game. */
(function () {
  'use strict';
  const { h, svg, register } = Studio;
  const N = window.NetLib;
  const esc = Studio.esc;

  /* ---------- topology builder ---------- */
  register('topo', function (root) {
    const ICON = { pc: '💻', switch: '🔀', router: '📡', server: '🖥️' };
    let nodes = [], links = [], seq = { pc: 0, switch: 0, router: 0, server: 0 }, mode = 'move', sel = null, linkFrom = null, nid = 0;
    const box = h('div', { class: 'widget' }, h('div', { class: 'wtitle' }, h('span', null, 'Topology builder'), h('span', null, 'Device add karo, jodo, ping karo')));
    const pal = h('div', { class: 'palette' });
    const host = h('div', { class: 'topo' }); const insp = h('div'); const pingBox = h('div'); const out = h('div');
    box.append(pal, host, h('div', { class: 'note', style: { border: 0, marginTop: '4px' } }, 'Move mode mein device drag karo. Link mode mein do device ek ke baad ek click karo. Link pe click = link tod do (cable cut).'), insp, pingBox, out);
    root.append(box);

    function add(type, x, y) {
      seq[type]++;
      const name = ({ pc: 'PC', switch: 'Switch', router: 'Router', server: 'Server' })[type] + seq[type];
      const n = { id: 'n' + (++nid), type, x: x || 90 + Math.random() * 600, y: y || 60 + Math.random() * 220, name, ip: type === 'switch' ? '' : '192.168.1.' + (9 + nid) + '/24' };
      nodes.push(n); return n;
    }
    function preset() {
      nodes = []; links = []; seq = { pc: 0, switch: 0, router: 0, server: 0 }; nid = 0;
      const a = add('pc', 110, 90), b = add('pc', 110, 280), sw = add('switch', 300, 185), r = add('router', 500, 185), s = add('server', 700, 185);
      a.ip = '192.168.1.10/24'; b.ip = '192.168.1.11/24'; r.ip = '192.168.1.1/24'; s.ip = '10.0.0.5/24';
      links = [[a, sw], [b, sw], [sw, r], [r, s]].map(([x, y]) => ({ a: x.id, b: y.id }));
      sel = null; linkFrom = null; redraw(); drawInsp(); out.innerHTML = '';
    }
    function drawPal() {
      pal.innerHTML = '';
      [['pc', '+ PC'], ['switch', '+ Switch'], ['router', '+ Router'], ['server', '+ Server']].forEach(([t, l]) => pal.append(h('button', { class: 'btn sm', onclick: () => { add(t); redraw(); drawPing(); } }, l)));
      pal.append(h('button', { class: 'btn sm' + (mode === 'move' ? ' primary' : ''), onclick: () => { mode = 'move'; linkFrom = null; drawPal(); redraw(); } }, '✋ Move'),
        h('button', { class: 'btn sm' + (mode === 'link' ? ' primary' : ''), onclick: () => { mode = 'link'; linkFrom = null; drawPal(); redraw(); } }, '🔗 Link'),
        h('button', { class: 'btn sm', onclick: preset }, 'Example network'),
        h('button', { class: 'btn sm', onclick: () => { nodes = []; links = []; sel = null; redraw(); drawInsp(); drawPing(); } }, 'Clear'));
    }
    let nodeEls = {}, linkEls = [];
    function redraw() {
      host.innerHTML = ''; nodeEls = {}; linkEls = [];
      const s = svg('svg', { viewBox: '0 0 820 360' });
      const gl = svg('g'), gn = svg('g');
      links.forEach((l, k) => {
        const a = nodes.find(n => n.id === l.a), b = nodes.find(n => n.id === l.b);
        if (!a || !b) return;
        const ln = svg('line', { class: 'wire', x1: a.x, y1: a.y, x2: b.x, y2: b.y, style: 'cursor:pointer', 'stroke-width': 3 });
        const hit = svg('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y, stroke: 'transparent', 'stroke-width': 16, style: 'cursor:pointer' });
        hit.addEventListener('click', () => { links.splice(k, 1); redraw(); Studio.toast('Link toot gaya'); });
        gl.append(ln, hit); linkEls.push({ l, ln, hit });
      });
      nodes.forEach(n => {
        const g = svg('g', { class: 'node' + (sel === n.id ? ' sel' : '') + (linkFrom === n.id ? ' sel' : ''), transform: `translate(${n.x},${n.y})`, style: 'cursor:' + (mode === 'move' ? 'grab' : 'pointer') });
        g.append(svg('rect', { x: -52, y: -32, width: 104, height: 64, rx: 10 }),
          svg('text', { x: 0, y: -6, 'text-anchor': 'middle', 'font-size': 22 }, ICON[n.type]),
          svg('text', { class: 'lab', x: 0, y: 14, 'text-anchor': 'middle', 'font-size': 12.5, 'font-weight': 700 }, n.name),
          svg('text', { class: 'sub', x: 0, y: 27, 'text-anchor': 'middle', 'font-size': 10.5 }, n.ip || 'L2 device'));
        g.addEventListener('pointerdown', e => onDown(e, n, g));
        gn.append(g); nodeEls[n.id] = g;
      });
      s.append(gl, gn); host.append(s);
      host._svg = s;
    }
    function onDown(e, n, g) {
      e.preventDefault();
      if (mode === 'link') {
        if (!linkFrom) { linkFrom = n.id; redraw(); }
        else if (linkFrom !== n.id) {
          if (!links.some(l => (l.a === linkFrom && l.b === n.id) || (l.a === n.id && l.b === linkFrom))) links.push({ a: linkFrom, b: n.id });
          linkFrom = null; redraw();
        } else { linkFrom = null; redraw(); }
        return;
      }
      sel = n.id; drawInsp();
      const s = host._svg; const pt = s.createSVGPoint();
      const move = ev => {
        pt.x = ev.clientX; pt.y = ev.clientY;
        const p = pt.matrixTransform(s.getScreenCTM().inverse());
        n.x = Math.max(55, Math.min(765, p.x)); n.y = Math.max(40, Math.min(320, p.y));
        g.setAttribute('transform', `translate(${n.x},${n.y})`);
        linkEls.forEach(o => {
          const a = nodes.find(q => q.id === o.l.a), b = nodes.find(q => q.id === o.l.b);
          [o.ln, o.hit].forEach(x => { x.setAttribute('x1', a.x); x.setAttribute('y1', a.y); x.setAttribute('x2', b.x); x.setAttribute('y2', b.y); });
        });
      };
      const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); redraw(); };
      window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
      Array.from(host.querySelectorAll('.node')).forEach(x => x.classList.remove('sel')); g.classList.add('sel');
    }
    function drawInsp() {
      insp.innerHTML = '';
      const n = nodes.find(x => x.id === sel);
      if (!n) return;
      const nm = h('input', { class: 'in', value: n.name, style: { width: '130px' } }), ip = h('input', { class: 'in', value: n.ip, placeholder: 'x.x.x.x/24', style: { width: '170px' }, disabled: n.type === 'switch' ? true : null });
      nm.addEventListener('change', () => { n.name = nm.value || n.name; redraw(); drawPing(); });
      ip.addEventListener('change', () => { if (!ip.value || N.parseCidr(ip.value)) { n.ip = ip.value.trim(); redraw(); } else Studio.toast('IP/prefix galat hai'); });
      insp.append(h('div', { class: 'row', style: { marginTop: '10px' } }, h('b', null, 'Selected:'), nm, ip,
        h('button', { class: 'btn sm', onclick: () => { nodes = nodes.filter(x => x.id !== n.id); links = links.filter(l => l.a !== n.id && l.b !== n.id); sel = null; redraw(); drawInsp(); drawPing(); } }, 'Delete device')));
    }
    function drawPing() {
      pingBox.innerHTML = '';
      const ends = nodes.filter(n => n.type !== 'switch');
      if (ends.length < 2) return;
      const f = h('select', { class: 'in' }, ends.map(n => h('option', { value: n.id }, n.name))), t = h('select', { class: 'in' }, ends.map((n, i) => h('option', { value: n.id, selected: i === 1 ? true : null }, n.name)));
      pingBox.append(h('div', { class: 'row', style: { marginTop: '12px' } }, h('b', null, 'Ping:'), f, '→', t, h('button', { class: 'btn primary sm', onclick: () => doPing(f.value, t.value) }, 'Ping bhejo')));
    }
    function doPing(fid, tid) {
      out.innerHTML = '';
      const a = nodes.find(n => n.id === fid), b = nodes.find(n => n.id === tid);
      const path = N.findPath(links, fid, tid);
      const say = (ok, msg) => out.append(h('div', { class: 'status ' + (ok ? 'ok' : 'bad') }, msg));
      if (a === b) return say(false, 'Khud ko ping? Dusra device chuno.');
      if (!path) return say(false, `Request timed out. ${a.name} aur ${b.name} ke beech koi physical path nahi hai. Cable check karo.`);
      const ca = N.parseCidr(a.ip), cb = N.parseCidr(b.ip);
      if (!ca || !cb) return say(false, 'Dono devices ko IP/prefix chahiye (inspector mein set karo).');
      const same = N.sameSubnet(ca.ip, cb.ip, ca.prefix);
      const names = path.map(id => nodes.find(n => n.id === id).name);
      const hasRouter = path.slice(1, -1).some(id => nodes.find(n => n.id === id).type === 'router');
      if (!same && !hasRouter) return say(false, `Destination host unreachable. ${a.name} (${a.ip}) aur ${b.name} (${b.ip}) alag subnets mein hain, par beech mein koi router nahi. Router lagao ya IP same subnet mein karo.`);
      say(true, `Reply from ${N.int2ip(cb.ip)}: bytes=32 time=${(path.length * 1.3).toFixed(1)}ms TTL=${64 - Math.max(0, path.length - 2)}. Raasta: ${names.join(' → ')}. ${same ? 'Same subnet, seedha switch se.' : 'Alag subnet, router ne forward kiya.'}`);
    }
    drawPal(); preset(); drawPing();
    host.addEventListener('pointerup', () => drawPing());
  });

  /* ---------- firewall tester ---------- */
  register('firewall', function (root) {
    const presets = {
      web: { def: 'deny', rules: [{ action: 'allow', proto: 'tcp', dir: 'in', port: 443 }, { action: 'allow', proto: 'tcp', dir: 'in', port: 80 }, { action: 'deny', proto: 'any', dir: 'in', port: 23 }] },
      office: { def: 'deny', rules: [{ action: 'allow', proto: 'udp', dir: 'out', port: 53 }, { action: 'allow', proto: 'tcp', dir: 'out', port: 443 }, { action: 'allow', proto: 'tcp', dir: 'in', port: 22 }] },
      broken: { def: 'allow', rules: [{ action: 'allow', proto: 'any', dir: 'any', port: 'any' }, { action: 'deny', proto: 'tcp', dir: 'in', port: 23 }] },
    };
    let def = 'deny', rules = JSON.parse(JSON.stringify(presets.web.rules));
    let proto, dir, port;
    const box = h('div', { class: 'widget' }, h('div', { class: 'wtitle' }, h('span', null, 'Firewall rule tester'), h('span', null, 'Upar se neeche, pehla match jeetta hai')));
    const rl = h('div'), res = h('div'), tests = h('div');
    const sel = (opts, v) => h('select', { class: 'in' }, opts.map(o => h('option', { value: o, selected: o === String(v) ? true : null }, o)));
    box.append(chips(), rl, h('hr', { class: 'sep' }), h('h3', { style: { marginTop: 0 } }, 'Packet test karo'), testForm(), res, tests);
    root.append(box);
    function chips() {
      return h('div', { class: 'chips' }, [['web', 'Web server'], ['office', 'Office laptop'], ['broken', 'Galat rule order (try!)']].map(([k, l]) => h('button', { class: 'chip', onclick: () => { def = presets[k].def; rules = JSON.parse(JSON.stringify(presets[k].rules)); draw(); } }, l)));
    }
    function draw() {
      rl.innerHTML = '';
      const t = h('table', { class: 't' }, h('tr', null, ['#', 'Action', 'Protocol', 'Direction', 'Port', ''].map(x => h('th', null, x))));
      rules.forEach((r, k) => {
        const a = sel(['allow', 'deny'], r.action), p = sel(['any', 'tcp', 'udp', 'icmp'], r.proto), d = sel(['any', 'in', 'out'], r.dir), po = h('input', { class: 'in', value: r.port, style: { width: '80px' } });
        a.onchange = () => { r.action = a.value; }; p.onchange = () => { r.proto = p.value; }; d.onchange = () => { r.dir = d.value; };
        po.onchange = () => { r.port = po.value === 'any' || po.value === '' ? 'any' : Number(po.value) || 'any'; };
        t.append(h('tr', null, h('td', { class: 'mono' }, k + 1), h('td', null, a), h('td', null, p), h('td', null, d), h('td', null, po),
          h('td', null, h('button', { class: 'btn sm', onclick: () => { if (k > 0) { [rules[k - 1], rules[k]] = [rules[k], rules[k - 1]]; draw(); } } }, '↑'), ' ',
            h('button', { class: 'btn sm', onclick: () => { if (k < rules.length - 1) { [rules[k + 1], rules[k]] = [rules[k], rules[k + 1]]; draw(); } } }, '↓'), ' ',
            h('button', { class: 'btn sm', onclick: () => { rules.splice(k, 1); draw(); } }, '✕'))));
      });
      const defSel = sel(['deny', 'allow'], def); defSel.onchange = () => { def = defSel.value; };
      t.append(h('tr', null, h('td', null, '∞'), h('td', null, defSel), h('td', { colspan: 4, class: 'muted' }, 'Default policy: koi rule match na ho to ye lagega. Secure firewall mein deny rakhte hain.')));
      rl.append(t, h('button', { class: 'btn sm', style: { marginTop: '10px' }, onclick: () => { rules.push({ action: 'allow', proto: 'tcp', dir: 'in', port: 8080 }); draw(); } }, '+ Rule add karo'));
      runSamples();
    }
    function testForm() {
      proto = sel(['tcp', 'udp', 'icmp'], 'tcp'); dir = sel(['in', 'out'], 'in'); port = h('input', { class: 'in', value: 23, style: { width: '90px' } });
      return h('div', { class: 'row' }, proto, dir, port, h('button', { class: 'btn primary sm', onclick: () => {
        const pkt = { proto: proto.value, dir: dir.value, port: Number(port.value) };
        const d = N.firewallDecide(rules, pkt, def);
        res.innerHTML = '';
        res.append(h('div', { class: 'status ' + (d.action === 'allow' ? 'ok' : 'bad') }, `${pkt.proto.toUpperCase()} ${pkt.dir === 'in' ? 'incoming' : 'outgoing'} port ${pkt.port} → `, h('b', null, d.action.toUpperCase()), d.rule >= 0 ? ` (rule #${d.rule + 1} ne match kiya)` : ' (koi rule match nahi hua, default policy lagi)'));
      } }, 'Test'));
    }
    function runSamples() {
      tests.innerHTML = '';
      const samples = [['tcp', 'in', 443, 'HTTPS visitor'], ['tcp', 'in', 80, 'HTTP visitor'], ['tcp', 'in', 23, 'Telnet (purana, unsafe)'], ['tcp', 'in', 22, 'SSH login'], ['udp', 'out', 53, 'DNS lookup'], ['tcp', 'out', 443, 'Browsing']];
      const t = h('table', { class: 't', style: { marginTop: '12px' } }, h('tr', null, ['Sample traffic', 'Result', 'Rule'].map(x => h('th', null, x))));
      samples.forEach(([p, d, po, label]) => {
        const r = N.firewallDecide(rules, { proto: p, dir: d, port: po }, def);
        t.append(h('tr', null, h('td', null, `${label} (${p}/${po} ${d})`), h('td', { style: { color: r.action === 'allow' ? 'var(--green)' : 'var(--red)', fontWeight: 700 } }, r.action.toUpperCase()), h('td', { class: 'muted' }, r.rule >= 0 ? '#' + (r.rule + 1) : 'default')));
      });
      tests.append(t);
    }
    draw();
  });

  /* ---------- packet capture reader ---------- */
  register('capture', function (root) {
    const C = '192.168.1.10', G = '192.168.1.1', S = '93.184.216.34';
    const MC = 'aa:bb:cc:11:22:33', MG = '00:11:22:33:44:55';
    const P = [
      { t: '0.000000', s: MC, d: 'ff:ff:ff:ff:ff:ff', p: 'ARP', l: 42, i: `Who has ${G}? Tell ${C}`, lay: [['Ethernet II', `Src ${MC}, Dst broadcast ff:ff:ff:ff:ff:ff`], ['ARP', `Request: who has ${G}?`]], why: 'Computer router ka MAC dhundh raha hai. Broadcast sabko jata hai.' },
      { t: '0.000412', s: MG, d: MC, p: 'ARP', l: 42, i: `${G} is at ${MG}`, lay: [['Ethernet II', `Src ${MG}, Dst ${MC}`], ['ARP', `Reply: ${G} is at ${MG}`]], why: 'Router ne apna MAC bata diya. Ab frames sahi jagah ja sakte hain.' },
      { t: '0.001203', s: C, d: G, p: 'DNS', l: 74, i: 'Standard query A example.com', lay: [['Ethernet II', `Src ${MC}, Dst ${MG}`], ['IPv4', `Src ${C}, Dst ${G}, TTL 64`], ['UDP', 'Src port 53211, Dst port 53'], ['DNS', 'Query: example.com, type A']], why: 'Naam ka IP poocha. DNS usually UDP port 53 use karta hai.' },
      { t: '0.034871', s: G, d: C, p: 'DNS', l: 90, i: `Standard query response A ${S}`, lay: [['Ethernet II', `Src ${MG}, Dst ${MC}`], ['IPv4', `Src ${G}, Dst ${C}`], ['UDP', 'Src port 53, Dst port 53211'], ['DNS', `Answer: example.com A ${S}, TTL 300`]], why: 'Jawab aaya: example.com ka IP ' + S },
      { t: '0.035210', s: C, d: S, p: 'TCP', l: 74, i: '51514 → 80 [SYN] Seq=0', flags: 'SYN', lay: [['Ethernet II', `Src ${MC}, Dst ${MG}`], ['IPv4', `Src ${C}, Dst ${S}, TTL 64`], ['TCP', 'Src 51514, Dst 80, Flags [SYN], Seq 0']], why: 'Handshake step 1: "Kya hum baat kar sakte hain?" (SYN)' },
      { t: '0.098541', s: S, d: C, p: 'TCP', l: 74, i: '80 → 51514 [SYN, ACK] Seq=0 Ack=1', flags: 'SYN,ACK', lay: [['Ethernet II', `Src ${MG}, Dst ${MC}`], ['IPv4', `Src ${S}, Dst ${C}, TTL 52`], ['TCP', 'Src 80, Dst 51514, Flags [SYN, ACK]']], why: 'Handshake step 2: "Haan, main taiyaar hoon" (SYN-ACK)' },
      { t: '0.098620', s: C, d: S, p: 'TCP', l: 66, i: '51514 → 80 [ACK] Seq=1 Ack=1', flags: 'ACK', lay: [['Ethernet II', `Src ${MC}, Dst ${MG}`], ['IPv4', `Src ${C}, Dst ${S}`], ['TCP', 'Src 51514, Dst 80, Flags [ACK]']], why: 'Handshake step 3: "Theek hai, shuru karte hain" (ACK). Connection ban gaya.' },
      { t: '0.099034', s: C, d: S, p: 'HTTP', l: 143, i: 'GET / HTTP/1.1', lay: [['Ethernet II', `Src ${MC}, Dst ${MG}`], ['IPv4', `Src ${C}, Dst ${S}`], ['TCP', 'Src 51514, Dst 80, Flags [PSH, ACK]'], ['HTTP', 'GET / HTTP/1.1\\r\\nHost: example.com\\r\\nUser-Agent: Mozilla/5.0\\r\\n\\r\\n']], why: 'Browser ne page maanga. Ye plain HTTP hai, isliye saaf text dikh raha hai. Koi bhi beech mein padh sakta hai!' },
      { t: '0.162877', s: S, d: C, p: 'HTTP', l: 1294, i: 'HTTP/1.1 200 OK (text/html)', lay: [['Ethernet II', `Src ${MG}, Dst ${MC}`], ['IPv4', `Src ${S}, Dst ${C}`], ['TCP', 'Src 80, Dst 51514, Flags [PSH, ACK]'], ['HTTP', 'HTTP/1.1 200 OK\\r\\nContent-Type: text/html\\r\\nContent-Length: 1256\\r\\n\\r\\n<!doctype html>...']], why: 'Server ne page bhej diya. 200 = sab theek.' },
      { t: '0.163100', s: C, d: S, p: 'TCP', l: 66, i: '51514 → 80 [FIN, ACK]', flags: 'FIN,ACK', lay: [['IPv4', `Src ${C}, Dst ${S}`], ['TCP', 'Flags [FIN, ACK]']], why: 'Client keh raha hai: "Meri taraf se baat khatam."' },
      { t: '0.226012', s: S, d: C, p: 'TCP', l: 66, i: '80 → 51514 [FIN, ACK]', flags: 'FIN,ACK', lay: [['IPv4', `Src ${S}, Dst ${C}`], ['TCP', 'Flags [FIN, ACK]']], why: 'Server bhi band kar raha hai.' },
      { t: '0.226090', s: C, d: S, p: 'TCP', l: 66, i: '51514 → 80 [ACK]', flags: 'ACK', lay: [['IPv4', `Src ${C}, Dst ${S}`], ['TCP', 'Flags [ACK]']], why: 'Aakhri ACK. Connection band.' },
      { t: '1.401200', s: C, d: S, p: 'TLSv1.3', l: 583, i: 'Client Hello (SNI=example.com)', lay: [['IPv4', `Src ${C}, Dst ${S}`], ['TCP', 'Src 51560, Dst 443'], ['TLS', 'Handshake: Client Hello, server_name=example.com']], why: 'HTTPS shuru: "Main ye encryption methods jaanta hoon." Website ka naam (SNI) abhi bhi dikhta hai.' },
      { t: '1.468900', s: S, d: C, p: 'TLSv1.3', l: 1420, i: 'Server Hello, Certificate', lay: [['IPv4', `Src ${S}, Dst ${C}`], ['TCP', 'Src 443, Dst 51560'], ['TLS', 'Server Hello + Certificate (identity proof)']], why: 'Server ne apna certificate dikhaya aur ek method chuna.' },
      { t: '1.470100', s: C, d: S, p: 'TLSv1.3', l: 735, i: 'Application Data (encrypted)', lay: [['IPv4', `Src ${C}, Dst ${S}`], ['TCP', 'Src 51560, Dst 443'], ['TLS', 'Application Data: 6f3a9c... (encrypted, padhna impossible)']], why: 'Ab sab kuch encrypted. Beech wala sirf dekh sakta hai kis IP se baat ho rahi hai, kya baat hui nahi.' },
    ];
    const box = h('div', { class: 'widget' }, h('div', { class: 'wtitle' }, h('span', null, 'Packet capture reader (Wireshark style)'), h('span', null, 'Ek website visit ka capture')));
    const f = h('input', { class: 'in', placeholder: 'Display filter: dns, tcp, http, tls, arp, ip.addr==93.184.216.34, tcp.flags.syn', style: { width: '100%' } });
    const tblBox = h('div', { style: { maxHeight: '300px', overflow: 'auto', border: '1px solid var(--line)', borderRadius: '9px', marginTop: '10px' } });
    const detail = h('div', { style: { marginTop: '12px' } });
    box.append(f, h('div', { class: 'chips', style: { marginTop: '8px' } }, ['', 'arp', 'dns', 'tcp', 'http', 'tls', 'tcp.flags.syn', 'ip.addr==' + S].map(x => h('button', { class: 'chip', onclick: () => { f.value = x; draw(); } }, x || 'clear'))), tblBox, detail);
    root.append(box);
    let selNo = 0;
    function match(p, q) {
      q = q.trim().toLowerCase(); if (!q) return true;
      return q.split('||').some(or => or.split('&&').every(tok => {
        tok = tok.trim();
        if (!tok) return true;
        if (tok.startsWith('!')) return !match(p, tok.slice(1));
        if (tok.startsWith('ip.addr==')) { const v = tok.slice(9); return p.s === v || p.d === v; }
        if (tok === 'tcp.flags.syn') return (p.flags || '').includes('SYN');
        if (tok === 'tls') return p.p.toLowerCase().startsWith('tls');
        if (tok === 'tcp') return p.p === 'TCP' || p.p === 'HTTP' || p.p.startsWith('TLS');
        if (tok === 'udp') return p.p === 'DNS';
        return p.p.toLowerCase() === tok;
      }));
    }
    function draw() {
      tblBox.innerHTML = '';
      const t = h('table', { class: 't' }, h('tr', null, ['No.', 'Time', 'Source', 'Destination', 'Protocol', 'Len', 'Info'].map(x => h('th', null, x))));
      let shown = 0;
      P.forEach((p, k) => {
        if (!match(p, f.value)) return; shown++;
        const color = p.p === 'DNS' ? 'var(--blue)' : p.p === 'ARP' ? 'var(--amber)' : p.p.startsWith('TLS') ? '#b794f6' : p.p === 'HTTP' ? 'var(--green)' : 'var(--text)';
        const tr = h('tr', { class: k === selNo ? 'hl' : '', style: { cursor: 'pointer' }, onclick: () => { selNo = k; draw(); } },
          h('td', { class: 'mono' }, k + 1), h('td', { class: 'mono' }, p.t), h('td', { class: 'mono' }, p.s), h('td', { class: 'mono' }, p.d), h('td', { style: { color, fontWeight: 700 } }, p.p), h('td', null, p.l), h('td', null, p.i));
        t.append(tr);
      });
      if (!shown) t.append(h('tr', null, h('td', { colspan: 7, class: 'muted' }, 'Is filter se koi packet nahi mila.')));
      tblBox.append(t);
      const p = P[selNo];
      detail.innerHTML = '';
      detail.append(h('div', { class: 'wtitle' }, h('span', null, 'Packet #' + (selNo + 1) + ' details'), h('span', null, p.l + ' bytes')));
      p.lay.forEach(([n, d], k) => detail.append(h('details', { open: k === p.lay.length - 1 ? true : null, style: { border: '1px solid var(--line)', borderRadius: '8px', padding: '8px 12px', margin: '6px 0', background: 'var(--panel)' } }, h('summary', { style: { cursor: 'pointer', fontWeight: 600 } }, n), h('div', { class: 'mono muted', style: { marginTop: '6px' } }, d))));
      detail.append(h('div', { class: 'callout' }, h('b', null, 'Isme kya ho raha hai: '), p.why));
    }
    f.addEventListener('input', draw); draw();
  });

  /* ---------- typing-style output helper ---------- */
  function typeLines(el, lines, done) {
    el.innerHTML = '';
    let k = 0;
    function next() {
      if (!el.isConnected) return;
      if (k >= lines.length) { if (done) done(); return; }
      el.append(h('div', { html: lines[k++] }));
      el.scrollTop = el.scrollHeight;
      if (Studio.paused()) next(); else setTimeout(next, 260);
    }
    next();
  }

  /* ---------- ping / traceroute ---------- */
  register('pingtrace', function (root) {
    const targets = {
      'gateway (192.168.1.1)': { ip: '192.168.1.1', hops: [['192.168.1.1', 'router.home', 1.2]] },
      'google DNS (8.8.8.8)': { ip: '8.8.8.8', hops: [['192.168.1.1', 'router.home', 1.2], ['100.64.0.1', 'isp-gw.net', 8.4], ['72.14.215.85', 'edge-1.isp.net', 12.9], ['108.170.250.1', '', 14.1], ['8.8.8.8', 'dns.google', 14.8]] },
      'example.com': { ip: '93.184.216.34', dns: true, hops: [['192.168.1.1', 'router.home', 1.2], ['100.64.0.1', 'isp-gw.net', 8.0], ['152.195.64.1', 'ae-65.core.net', 19.7], ['93.184.216.34', 'example.com', 24.3]] },
      'dead host (10.255.255.1)': { ip: '10.255.255.1', hops: [['192.168.1.1', 'router.home', 1.3]], dead: true },
    };
    let tool = 'ping', tgt = Object.keys(targets)[1];
    const box = h('div', { class: 'widget' }, h('div', { class: 'wtitle' }, h('span', null, 'Command simulator'), h('span', null, 'Fake network, real output style')));
    const out = h('div', { class: 'pre', style: { minHeight: '170px' } }, 'Command chalao...');
    const ctl = h('div');
    box.append(ctl, out, h('div', { class: 'note' }, 'Ye simulation hai, tumhare network pe kuch nahi bhej raha. Asli ping/tracert apne terminal mein chalao: ', h('code', null, 'ping 8.8.8.8'), ' aur ', h('code', null, 'tracert 8.8.8.8'), ' (Linux/Mac: traceroute).'));
    root.append(box);
    function drawCtl() {
      ctl.innerHTML = '';
      ctl.append(h('div', { class: 'chips' }, ['ping', 'traceroute'].map(t => h('button', { class: 'chip' + (tool === t ? ' on' : ''), onclick: () => { tool = t; drawCtl(); } }, t))),
        h('div', { class: 'row', style: { margin: '6px 0 12px' } }, h('select', { class: 'in', onchange: e => { tgt = e.target.value; } }, Object.keys(targets).map(k => h('option', { value: k, selected: k === tgt ? true : null }, k))),
          h('button', { class: 'btn primary', onclick: run }, 'Run')));
    }
    function run() {
      const T = targets[tgt]; const L = [];
      if (tool === 'ping') {
        if (T.dns) L.push(`<span class="d">DNS: example.com → ${T.ip}</span>`);
        L.push(`$ ping ${T.ip}`, `Pinging ${T.ip} with 32 bytes of data:`);
        const last = T.hops[T.hops.length - 1][2];
        for (let i = 0; i < 4; i++) L.push(T.dead ? '<span class="r">Request timed out.</span>' : `Reply from ${T.ip}: bytes=32 time=${(last + Math.sin(i * 2.1) * 0.9).toFixed(1)}ms TTL=${64 - T.hops.length}`);
        L.push('', T.dead ? '<span class="r">Packets: Sent=4, Received=0, Lost=4 (100% loss)</span>' : '<span class="g">Packets: Sent=4, Received=4, Lost=0 (0% loss)</span>');
        if (T.dead) L.push('<span class="a">Matlab: ya host band hai, ya firewall ICMP block kar raha hai, ya route nahi hai.</span>');
      } else {
        L.push(`$ traceroute ${T.ip}`, `Tracing route to ${T.ip} over a maximum of 30 hops:`);
        T.hops.forEach((hp, k) => L.push(`${String(k + 1).padStart(2)}  ${hp[2].toFixed(1).padStart(5)} ms  ${hp[1] ? hp[1] + ' [' + hp[0] + ']' : hp[0]}`));
        if (T.dead) for (let k = T.hops.length + 1; k <= T.hops.length + 3; k++) L.push(`${String(k).padStart(2)}      *        *        *     <span class="r">Request timed out.</span>`);
        else L.push('', '<span class="g">Trace complete.</span>');
        L.push('<span class="d">Har line ek router (hop) hai. Traceroute TTL 1, 2, 3... bhejta hai; har router TTL ghatata hai, 0 hone par "Time exceeded" bhejta hai, aur wahi se hop ka pata chalta hai.</span>');
      }
      typeLines(out, L);
    }
    drawCtl();
  });

  /* ---------- nmap simulator ---------- */
  register('nmapsim', function (root) {
    const hosts = {
      '10.0.0.5 (web server)': { ip: '10.0.0.5', up: true, lat: 0.0021, ports: [[22, 'open', 'ssh', 'OpenSSH 8.9'], [80, 'open', 'http', 'nginx 1.24'], [443, 'open', 'https', 'nginx 1.24'], [3306, 'filtered', 'mysql', ''], [8080, 'closed', 'http-proxy', '']] },
      '10.0.0.9 (db server)': { ip: '10.0.0.9', up: true, lat: 0.0015, ports: [[22, 'open', 'ssh', 'OpenSSH 8.2'], [80, 'closed', 'http', ''], [3306, 'open', 'mysql', 'MySQL 8.0.33'], [5432, 'closed', 'postgresql', '']] },
      '10.0.0.77 (nobody home)': { ip: '10.0.0.77', up: false, ports: [] },
    };
    let scan = 'default', tgt = Object.keys(hosts)[0];
    const box = h('div', { class: 'widget' }, h('div', { class: 'wtitle' }, h('span', null, 'Nmap simulator'), h('span', null, 'Safe practice, sirf fictional hosts')));
    const out = h('div', { class: 'pre', style: { minHeight: '190px' } }, 'Scan chuno aur Run dabao...');
    const ctl = h('div');
    box.append(ctl, out, h('div', { class: 'callout warn' }, h('b', null, 'Rule: '), 'Asli nmap sirf apne network ya jahan likhit permission ho wahin chalao. Bina permission ke scan karna illegal ho sakta hai.'));
    root.append(box);
    const scans = [['ping', 'Ping scan (-sn)', 'Sirf ye dekhta hai host zinda hai ya nahi'], ['default', 'Default scan', 'Common ports check'], ['sv', 'Service scan (-sV)', 'Ports ke peeche kaun sa software hai']];
    function drawCtl() {
      ctl.innerHTML = '';
      ctl.append(h('div', { class: 'chips' }, scans.map(([k, l]) => h('button', { class: 'chip' + (scan === k ? ' on' : ''), title: scans.find(s => s[0] === k)[2], onclick: () => { scan = k; drawCtl(); } }, l))),
        h('div', { class: 'row', style: { margin: '6px 0 12px' } }, h('select', { class: 'in', onchange: e => { tgt = e.target.value; } }, Object.keys(hosts).map(k => h('option', { value: k, selected: k === tgt ? true : null }, k))), h('button', { class: 'btn primary', onclick: run }, 'Run scan')));
    }
    function run() {
      const H = hosts[tgt]; const L = [];
      const flag = scan === 'ping' ? ' -sn' : scan === 'sv' ? ' -sV' : '';
      L.push(`$ nmap${flag} ${H.ip}`, 'Starting Nmap 7.94 ( https://nmap.org )');
      if (!H.up) { L.push('<span class="a">Note: Host seems down. If it is really up, try -Pn.</span>', 'Nmap done: 1 IP address (0 hosts up)'); typeLines(out, L); return; }
      L.push(`Nmap scan report for ${H.ip}`, `Host is up (${H.lat}s latency).`);
      if (scan !== 'ping') {
        const closed = H.ports.filter(p => p[1] === 'closed').length;
        L.push(`<span class="d">Not shown: ${closed} closed tcp ports</span>`, scan === 'sv' ? 'PORT      STATE     SERVICE    VERSION' : 'PORT      STATE     SERVICE');
        H.ports.filter(p => p[1] !== 'closed').forEach(([p, s, sv, ver]) => {
          const col = s === 'open' ? 'g' : 'a';
          L.push(`${(p + '/tcp').padEnd(9)} <span class="${col}">${s.padEnd(9)}</span> ${sv.padEnd(10)}${scan === 'sv' ? ' ' + ver : ''}`);
        });
        L.push('', '<span class="d">open = service sun raha hai · closed = host ne mana kiya (RST) · filtered = firewall ne chup chaap gira diya</span>');
      }
      L.push('Nmap done: 1 IP address (1 host up) scanned in 0.82 seconds');
      typeLines(out, L);
    }
    drawCtl();
  });

  /* ---------- HTTP request builder ---------- */
  register('http', function (root) {
    const box = h('div', { class: 'widget' }, h('div', { class: 'wtitle' }, h('span', null, 'HTTP request builder'), h('span', null, 'Request banao, response dekho')));
    const method = h('select', { class: 'in' }, ['GET', 'POST', 'DELETE'].map(m => h('option', null, m)));
    const path = h('select', { class: 'in' }, [['/', 'Home page'], ['/login', 'Login'], ['/admin', 'Admin panel'], ['/old-page', 'Purana page'], ['/api/data', 'API data'], ['/nope', 'Jo exist nahi karta'], ['/crash', 'Buggy page']].map(([v, l]) => h('option', { value: v }, v + '  (' + l + ')')));
    const cookie = h('input', { type: 'checkbox' }), auth = h('input', { type: 'checkbox' });
    const body = h('input', { class: 'in', value: 'user=asha&pass=secret123', style: { width: '260px' }, 'aria-label': 'body' });
    const reqEl = h('div', { class: 'pre' }), resEl = h('div', { class: 'pre', style: { marginTop: '10px' } }), why = h('div', { class: 'callout' });
    box.append(h('div', { class: 'row' }, method, path, h('label', null, cookie, ' Cookie bhejo'), h('label', null, auth, ' Authorization token')), h('div', { class: 'row', style: { margin: '10px 0' } }, h('label', { class: 'lb', style: { margin: 0 } }, 'Body (POST ke liye):'), body),
      h('div', { class: 'wtitle' }, h('span', null, 'Browser → Server (request)')), reqEl, h('div', { class: 'wtitle', style: { marginTop: '10px' } }, h('span', null, 'Server → Browser (response)')), resEl, why);
    root.append(box);
    const info = {
      200: 'OK: sab theek, ye raha content.', 301: 'Moved Permanently: page nayi jagah chala gaya, browser wahan chala jayega.', 302: 'Found (redirect): kuch der ke liye dusri jagah bhej diya (login ke baad aksar).',
      401: 'Unauthorized: pehle pehchaan batao (login karo).', 403: 'Forbidden: tum kaun ho wo pata hai, par tumhe andar jaane ki ijazat nahi.', 404: 'Not Found: aisa page hai hi nahi.', 405: 'Method Not Allowed: is URL pe ye method (GET/POST) allowed nahi.', 500: 'Internal Server Error: server ke andar code toot gaya. Galti server ki hai, tumhari nahi.'
    };
    function respond() {
      const m = method.value, p = path.value;
      if (p === '/') return m === 'GET' ? [200, 'text/html', '<h1>Welcome</h1>'] : [405, 'text/plain', 'Method not allowed'];
      if (p === '/login') return m === 'POST' ? (body.value.includes('secret123') ? [302, 'text/html', '', 'Location: /dashboard\r\nSet-Cookie: session=abc123; HttpOnly; Secure'] : [401, 'text/plain', 'Bad credentials']) : [200, 'text/html', '<form>Login</form>'];
      if (p === '/admin') return auth.checked ? [200, 'text/html', '<h1>Admin</h1>'] : (cookie.checked ? [403, 'text/plain', 'Forbidden'] : [401, 'text/plain', 'Login required', 'WWW-Authenticate: Bearer']);
      if (p === '/old-page') return [301, 'text/html', '', 'Location: /new-page'];
      if (p === '/api/data') return m === 'GET' ? [200, 'application/json', '{"users": 42, "ok": true}'] : [405, 'text/plain', 'Method not allowed'];
      if (p === '/crash') return [500, 'text/plain', 'Traceback (most recent call last)...'];
      return [404, 'text/plain', 'Not found'];
    }
    function draw() {
      const m = method.value, p = path.value;
      const hasBody = m === 'POST';
      let req = `<span class="b">${m} ${p} HTTP/1.1</span>\r\nHost: example.com\r\nUser-Agent: Mozilla/5.0\r\nAccept: */*`;
      if (cookie.checked) req += '\r\nCookie: session=abc123';
      if (auth.checked) req += '\r\nAuthorization: Bearer eyJhbGciOi...';
      if (hasBody) req += `\r\nContent-Type: application/x-www-form-urlencoded\r\nContent-Length: ${body.value.length}\r\n\r\n${esc(body.value)}`;
      reqEl.innerHTML = req.replace(/\r\n/g, '<br>');
      const [code, ct, b, extra] = respond();
      const col = code < 300 ? 'g' : code < 400 ? 'a' : 'r';
      let res = `<span class="${col}">HTTP/1.1 ${code}</span>\r\nContent-Type: ${ct}\r\nServer: nginx` + (extra ? '\r\n' + extra : '') + (b ? `\r\n\r\n${esc(b)}` : '');
      resEl.innerHTML = res.replace(/\r\n/g, '<br>');
      why.innerHTML = '<b>' + code + ' · </b>' + info[code] + (hasBody && body.value.includes('pass=') ? ' <br><b>Dhyaan do:</b> plain HTTP mein password aise hi text mein jata hai. HTTPS ke bina koi bhi padh sakta hai.' : '');
    }
    [method, path, cookie, auth, body].forEach(x => x.addEventListener('input', draw)); draw();
  });

  /* ---------- decision / investigation ---------- */
  register('decision', function (root, cfg) {
    const box = h('div', { class: 'widget' }, h('div', { class: 'wtitle' }, h('span', null, cfg.title || 'Investigation'), h('span', null, 'Ek-ek karke faisla lo')));
    const body = h('div');
    box.append(body); root.append(box);
    let trail = [];
    function show(id) {
      const n = cfg.nodes[id];
      body.innerHTML = '';
      if (trail.length) body.append(h('div', { class: 'muted', style: { fontSize: '12.5px', marginBottom: '8px' } }, 'Ab tak: ' + trail.join(' → ')));
      if (n.end) {
        body.append(h('div', { class: 'status ' + (n.good ? 'ok' : 'bad') }, h('b', null, n.good ? '✅ Solved. ' : '❌ Galat raasta. '), n.text), h('button', { class: 'btn', style: { marginTop: '10px' }, onclick: () => { trail = []; show(cfg.start); } }, 'Phir se try karo'));
        return;
      }
      body.append(h('p', { style: { fontSize: '15.5px' }, html: n.q }));
      (n.opts || []).forEach(([label, next]) => body.append(h('button', { class: 'btn', style: { display: 'block', width: '100%', textAlign: 'left', margin: '8px 0' }, onclick: () => { trail.push(label); show(next); } }, label)));
    }
    show(cfg.start);
  });

  /* ---------- port game ---------- */
  register('portgame', function (root) {
    const list = [[20, 'FTP data'], [21, 'FTP control'], [22, 'SSH'], [23, 'Telnet'], [25, 'SMTP (email bhejna)'], [53, 'DNS'], [67, 'DHCP server'], [80, 'HTTP'], [110, 'POP3'], [123, 'NTP (time)'], [143, 'IMAP'], [161, 'SNMP'], [443, 'HTTPS'], [445, 'SMB (file sharing)'], [3306, 'MySQL'], [3389, 'RDP (remote desktop)'], [5432, 'PostgreSQL']];
    const box = h('div', { class: 'widget' }, h('div', { class: 'wtitle' }, h('span', null, 'Port yaad karo game'), h('span', { id: 'ps' }, '')));
    const q = h('div', { style: { fontSize: '18px', margin: '8px 0 12px' } }), opts = h('div', { class: 'chips' }), msg = h('div', { class: 'muted' });
    box.append(q, opts, msg); root.append(box);
    let right = 0, tried = 0;
    function next() {
      const ans = list[Math.floor(Math.random() * list.length)];
      const wrong = list.filter(x => x !== ans).sort(() => Math.random() - 0.5).slice(0, 3);
      const choices = [ans, ...wrong].sort(() => Math.random() - 0.5);
      q.textContent = `${ans[1]} ka default port kaun sa hai?`;
      opts.innerHTML = '';
      choices.forEach(c => opts.append(h('button', { class: 'chip', onclick: e => {
        tried++; const ok = c === ans; if (ok) right++;
        msg.textContent = ok ? '✅ Sahi!' : `❌ Sahi jawab ${ans[0]} hai.`;
        box.querySelector('#ps').textContent = `Score ${right}/${tried}`;
        setTimeout(next, ok ? 500 : 1200);
      } }, String(c[0]))));
    }
    next();
  });
})();
