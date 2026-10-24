/* Tool lab entries: standalone access to the interactive widgets. Never locked. */
(function () {
  'use strict';
  Studio.tools = [
    { id: 'subnet', title: 'Subnet calculator', desc: 'Network, broadcast, hosts and subnet splits for any IP/CIDR.', widget: { type: 'subnet' } },
    { id: 'subnetquiz', title: 'Subnet practice', desc: 'Random questions with instant checking.', widget: { type: 'subnetquiz' } },
    { id: 'vlsm', title: 'VLSM planner', desc: 'Plan subnets of different sizes from one block.', widget: { type: 'vlsm' } },
    { id: 'bits', title: 'IP bits', desc: 'Flip bits to understand binary and IPv4.', widget: { type: 'bits' } },
    { id: 'route', title: 'Routing lookup', desc: 'Try longest prefix match yourself.', widget: { type: 'route' } },
    { id: 'ospf', title: 'OSPF shortest path', desc: 'Change link costs, cut links, and watch the path change.', widget: { type: 'ospf' } },
    { id: 'topo', title: 'Topology builder', desc: 'Connect devices and ping.', widget: { type: 'topo' } },
    { id: 'firewall', title: 'Firewall tester', desc: 'Write rules and test traffic against them.', widget: { type: 'firewall' } },
    { id: 'capture', title: 'Packet capture', desc: 'A Wireshark-style packet reader.', widget: { type: 'capture' } },
    { id: 'filters', title: 'Filter challenges', desc: 'Write display filters and get checked.', widget: { type: 'capchallenge', title: 'Filter challenges', tasks: [
      { q: 'Show only DNS packets.', test: p => p.p === 'DNS', hint: 'The protocol name is enough.' },
      { q: 'Show only SYN packets (start of a handshake).', test: p => (p.flags || '') === 'SYN', hint: 'Try tcp.flags.syn' },
      { q: 'Show everything to or from 93.184.216.34.', test: p => p.s === '93.184.216.34' || p.d === '93.184.216.34', hint: 'ip.addr==...' }] } },
    { id: 'tcpwin', title: 'TCP congestion', desc: 'See how packet loss changes TCP speed.', widget: { type: 'tcpwin' } },
    { id: 'bandwidth', title: 'Bandwidth calculator', desc: 'Transfer time, latency and the bandwidth-delay product.', widget: { type: 'bandwidth' } },
    { id: 'http', title: 'HTTP builder', desc: 'Build a request and read the response.', widget: { type: 'http' } },
    { id: 'pingtrace', title: 'ping / traceroute', desc: 'Command output simulation.', widget: { type: 'pingtrace' } },
    { id: 'nmap', title: 'nmap simulator', desc: 'Safe scan practice on fictional hosts.', widget: { type: 'nmapsim' } },
    { id: 'encap', title: 'Encapsulation', desc: 'Watch a message get wrapped in layers.', widget: { type: 'encap' } },
    { id: 'home', title: 'Home network', desc: 'Break a home network and see what happens.', widget: { type: 'home' } },
    { id: 'portgame', title: 'Port game', desc: 'Memorize common ports.', widget: { type: 'portgame' } },
  ];
})();
