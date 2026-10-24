// Run: node tests/netlib.test.js
const assert = require('assert');
const N = require('../js/netlib.js');

assert.strictEqual(N.ip2int('192.168.1.10'), 3232235786);
assert.strictEqual(N.int2ip(3232235786), '192.168.1.10');
assert.strictEqual(N.ip2int('256.1.1.1'), null);
assert.strictEqual(N.ip2int('1.2.3'), null);
assert.strictEqual(N.int2ip(N.prefixToMask(24)), '255.255.255.0');
assert.strictEqual(N.int2ip(N.prefixToMask(20)), '255.255.240.0');
assert.strictEqual(N.prefixToMask(0), 0);
assert.strictEqual(N.maskToPrefix(N.ip2int('255.255.255.192')), 26);
assert.strictEqual(N.maskToPrefix(N.ip2int('255.0.255.0')), null);

const c = N.parseCidr('192.168.1.130/26');
assert.deepStrictEqual(c.prefix, 26);
const s = N.subnetInfo(c.ip, c.prefix);
assert.strictEqual(N.int2ip(s.network), '192.168.1.128');
assert.strictEqual(N.int2ip(s.broadcast), '192.168.1.191');
assert.strictEqual(N.int2ip(s.first), '192.168.1.129');
assert.strictEqual(N.int2ip(s.last), '192.168.1.190');
assert.strictEqual(s.hosts, 62);

const s31 = N.subnetInfo(N.ip2int('10.0.0.4'), 31);
assert.strictEqual(s31.hosts, 2);
const s32 = N.subnetInfo(N.ip2int('10.0.0.4'), 32);
assert.strictEqual(s32.hosts, 1);
const s0 = N.subnetInfo(N.ip2int('10.1.2.3'), 8);
assert.strictEqual(s0.hosts, 16777214);

assert.deepStrictEqual(N.parseCidr('10.0.0.1 255.255.255.0').prefix, 24);
assert.strictEqual(N.parseCidr('10.0.0.1/33'), null);
assert.strictEqual(N.parseCidr('garbage'), null);

assert.strictEqual(N.ipKind(N.ip2int('172.20.1.1')), 'Private (172.16.0.0/12)');
assert.strictEqual(N.ipKind(N.ip2int('172.32.1.1')), 'Public');
assert.strictEqual(N.ipClass(N.ip2int('10.1.1.1')), 'A');
assert.strictEqual(N.ipClass(N.ip2int('192.168.1.1')), 'C');

assert.ok(N.sameSubnet(N.ip2int('192.168.1.5'), N.ip2int('192.168.1.200'), 24));
assert.ok(!N.sameSubnet(N.ip2int('192.168.1.5'), N.ip2int('192.168.2.5'), 24));

const parts = N.splitNetwork(N.ip2int('192.168.1.0'), 24, 26);
assert.strictEqual(parts.length, 4);
assert.strictEqual(N.int2ip(parts[2].network), '192.168.1.128');

const routes = [
  { net: '0.0.0.0/0', via: 'ISP' },
  { net: '10.0.0.0/8', via: 'R2' },
  { net: '10.1.0.0/16', via: 'R3' },
];
const m = N.matchRoutes(N.ip2int('10.1.5.5'), routes);
assert.strictEqual(m[0].route.via, 'R3');
assert.strictEqual(m.length, 3);
assert.strictEqual(N.matchRoutes(N.ip2int('8.8.8.8'), routes)[0].route.via, 'ISP');

const links = [{ a: 'pc1', b: 'sw' }, { a: 'sw', b: 'r' }, { a: 'r', b: 'pc2' }];
assert.deepStrictEqual(N.findPath(links, 'pc1', 'pc2'), ['pc1', 'sw', 'r', 'pc2']);
assert.strictEqual(N.findPath(links.slice(0, 2), 'pc1', 'pc2'), null);

const rules = [
  { action: 'allow', proto: 'tcp', dir: 'in', port: 443 },
  { action: 'deny', proto: 'any', dir: 'in', port: 23 },
];
assert.deepStrictEqual(N.firewallDecide(rules, { proto: 'tcp', dir: 'in', port: 443 }, 'deny'), { action: 'allow', rule: 0 });
assert.deepStrictEqual(N.firewallDecide(rules, { proto: 'tcp', dir: 'in', port: 23 }, 'allow'), { action: 'deny', rule: 1 });
assert.deepStrictEqual(N.firewallDecide(rules, { proto: 'udp', dir: 'in', port: 53 }, 'deny'), { action: 'deny', rule: -1 });

console.log('netlib: all tests passed');
