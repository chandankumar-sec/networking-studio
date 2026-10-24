/* Pure networking helpers. Works in browser (window.NetLib) and Node (module.exports). */
(function (root) {
  'use strict';

  function ip2int(ip) {
    const p = String(ip).trim().split('.');
    if (p.length !== 4) return null;
    let n = 0;
    for (const x of p) {
      if (!/^\d{1,3}$/.test(x)) return null;
      const v = Number(x);
      if (v > 255) return null;
      n = n * 256 + v;
    }
    return n;
  }

  function int2ip(n) {
    return [(n / 16777216) & 255, (n >> 16) & 255, (n >> 8) & 255, n & 255].join('.');
  }

  function prefixToMask(p) {
    if (p < 0 || p > 32) return null;
    if (p === 0) return 0;
    return (0xffffffff << (32 - p)) >>> 0;
  }

  function maskToPrefix(maskInt) {
    let c = 0, seenZero = false;
    for (let i = 31; i >= 0; i--) {
      const bit = (maskInt >>> i) & 1;
      if (bit) { if (seenZero) return null; c++; } else seenZero = true;
    }
    return c;
  }

  function toBin(n, width) {
    return (n >>> 0).toString(2).padStart(width || 32, '0');
  }

  function dottedBin(n) {
    const b = toBin(n, 32);
    return [b.slice(0, 8), b.slice(8, 16), b.slice(16, 24), b.slice(24)].join('.');
  }

  /** Parse "192.168.1.10/24" (or "ip mask") -> {ip, prefix} or null */
  function parseCidr(s) {
    s = String(s).trim();
    let ip, prefix;
    if (s.includes('/')) {
      const [a, b] = s.split('/');
      ip = ip2int(a);
      if (!/^\d{1,2}$/.test(b.trim())) return null;
      prefix = Number(b);
    } else if (/\s/.test(s)) {
      const [a, b] = s.split(/\s+/);
      ip = ip2int(a);
      const m = ip2int(b);
      if (m === null) return null;
      prefix = maskToPrefix(m);
    } else {
      return null;
    }
    if (ip === null || prefix === null || prefix < 0 || prefix > 32) return null;
    return { ip, prefix };
  }

  function ipClass(ipInt) {
    const first = ipInt >>> 24;
    if (first < 128) return 'A';
    if (first < 192) return 'B';
    if (first < 224) return 'C';
    if (first < 240) return 'D (multicast)';
    return 'E (reserved)';
  }

  function ipKind(ipInt) {
    const a = ipInt >>> 24, b = (ipInt >>> 16) & 255;
    if (a === 10) return 'Private (10.0.0.0/8)';
    if (a === 172 && b >= 16 && b <= 31) return 'Private (172.16.0.0/12)';
    if (a === 192 && b === 168) return 'Private (192.168.0.0/16)';
    if (a === 127) return 'Loopback (127.0.0.0/8)';
    if (a === 169 && b === 254) return 'Link-local / APIPA (169.254.0.0/16)';
    if (a >= 224 && a <= 239) return 'Multicast';
    if (a >= 240) return 'Reserved';
    if (a === 0) return 'This network (0.0.0.0/8)';
    return 'Public';
  }

  function subnetInfo(ipInt, prefix) {
    const mask = prefixToMask(prefix);
    const wildcard = (~mask) >>> 0;
    const network = (ipInt & mask) >>> 0;
    const broadcast = (network | wildcard) >>> 0;
    const total = Math.pow(2, 32 - prefix);
    let hosts, first, last;
    if (prefix === 32) { hosts = 1; first = network; last = network; }
    else if (prefix === 31) { hosts = 2; first = network; last = broadcast; }
    else { hosts = total - 2; first = network + 1; last = broadcast - 1; }
    return { mask, wildcard, network, broadcast, total, hosts, first, last, prefix };
  }

  function sameSubnet(aInt, bInt, prefix) {
    const m = prefixToMask(prefix);
    return ((aInt & m) >>> 0) === ((bInt & m) >>> 0);
  }

  /** Split a network into 2^bits equal subnets. */
  function splitNetwork(networkInt, prefix, newPrefix) {
    if (newPrefix <= prefix || newPrefix > 32) return [];
    const count = Math.pow(2, newPrefix - prefix);
    const size = Math.pow(2, 32 - newPrefix);
    const out = [];
    for (let i = 0; i < Math.min(count, 256); i++) {
      out.push(subnetInfo((networkInt + i * size) >>> 0, newPrefix));
    }
    return out;
  }

  /** Routing: routes = [{net:'10.0.0.0/8', via:'..', iface:'..'}]; longest prefix wins. */
  function matchRoutes(destInt, routes) {
    const matches = [];
    routes.forEach((r, idx) => {
      const c = parseCidr(r.net);
      if (!c) return;
      const m = prefixToMask(c.prefix);
      if (((destInt & m) >>> 0) === ((c.ip & m) >>> 0)) matches.push({ idx, prefix: c.prefix, route: r });
    });
    matches.sort((a, b) => b.prefix - a.prefix);
    return matches;
  }

  /** BFS reachability on a graph: nodes [{id}], links [{a,b}], blockedIds optional */
  function findPath(links, from, to) {
    if (from === to) return [from];
    const adj = {};
    links.forEach(l => {
      (adj[l.a] = adj[l.a] || []).push(l.b);
      (adj[l.b] = adj[l.b] || []).push(l.a);
    });
    const prev = { [from]: null };
    const q = [from];
    while (q.length) {
      const cur = q.shift();
      for (const n of adj[cur] || []) {
        if (n in prev) continue;
        prev[n] = cur;
        if (n === to) {
          const path = [];
          let x = to;
          while (x !== null) { path.unshift(x); x = prev[x]; }
          return path;
        }
        q.push(n);
      }
    }
    return null;
  }

  /** Firewall: rules in order, first match wins; default action applies otherwise. */
  function firewallDecide(rules, pkt, def) {
    for (let i = 0; i < rules.length; i++) {
      const r = rules[i];
      if (r.proto !== 'any' && r.proto !== pkt.proto) continue;
      if (r.dir !== 'any' && r.dir !== pkt.dir) continue;
      if (r.port !== 'any' && Number(r.port) !== Number(pkt.port)) continue;
      return { action: r.action, rule: i };
    }
    return { action: def, rule: -1 };
  }

  const api = {
    ip2int, int2ip, prefixToMask, maskToPrefix, toBin, dottedBin, parseCidr,
    ipClass, ipKind, subnetInfo, sameSubnet, splitNetwork, matchRoutes, findPath, firewallDecide
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.NetLib = api;
})(typeof window !== 'undefined' ? window : globalThis);
