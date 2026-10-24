/* Tool lab entries: standalone access to the interactive widgets. */
(function () {
  'use strict';
  Studio.tools = [
    { id: 'subnet', title: 'Subnet calculator', desc: 'Kisi bhi IP/CIDR ka network, broadcast, hosts aur subnet split.', widget: { type: 'subnet' } },
    { id: 'subnetquiz', title: 'Subnet practice', desc: 'Random sawal, turant check.', widget: { type: 'subnetquiz' } },
    { id: 'bits', title: 'IP bits', desc: 'Bits pe click karke IP ka binary samjho.', widget: { type: 'bits' } },
    { id: 'route', title: 'Routing lookup', desc: 'Longest prefix match ko khud chalao.', widget: { type: 'route' } },
    { id: 'topo', title: 'Topology builder', desc: 'Devices jodo aur ping karo.', widget: { type: 'topo' } },
    { id: 'firewall', title: 'Firewall tester', desc: 'Rules likho aur traffic test karo.', widget: { type: 'firewall' } },
    { id: 'capture', title: 'Packet capture', desc: 'Wireshark jaisa packet reader.', widget: { type: 'capture' } },
    { id: 'http', title: 'HTTP builder', desc: 'Request banao aur response dekho.', widget: { type: 'http' } },
    { id: 'pingtrace', title: 'ping / traceroute', desc: 'Command output ka simulation.', widget: { type: 'pingtrace' } },
    { id: 'nmap', title: 'nmap simulator', desc: 'Fictional hosts par safe scan practice.', widget: { type: 'nmapsim' } },
    { id: 'encap', title: 'Encapsulation', desc: 'Message par layers lagte hue dekho.', widget: { type: 'encap' } },
    { id: 'home', title: 'Home network', desc: 'Ghar ka network aur uski kamzoriyan.', widget: { type: 'home' } },
    { id: 'portgame', title: 'Port game', desc: 'Common ports yaad karo.', widget: { type: 'portgame' } },
  ];
})();
