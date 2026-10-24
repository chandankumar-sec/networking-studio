/* 90-day plan. Each day: [text, 'moduleId/stepIndex'] (link optional). Step indexes match the order in each module file. */
(function () {
  'use strict';
  const F = i => 'foundations/' + i, A = i => 'addressing/' + i, P = i => 'protocols/' + i, D = i => 'devices/' + i, T = i => 'tools/' + i, X = i => 'security/' + i;

  Studio.plan = [
    { title: 'Network basics', goal: 'What a network is', days: [
      ['Play with the home network diagram. Break each thing and watch.', F(0)],
      ['What makes devices a network: addresses, medium, devices, rules.', F(1)],
      ['LAN, WAN, ISP and gateway. Run ipconfig or ip a on your computer.', F(2)],
      ['Client and server. Name the client and server in three apps you use.', F(3)],
      ['Opening a website: DNS, TCP, HTTP.', F(4)],
      ['How a message is wrapped in layers (encapsulation).', F(5)],
      ['Revision day: redo the quizzes you found hard and write notes.'] ] },
    { title: 'Security view and speed', goal: 'Finish the foundations', days: [
      ['Why every security role needs networking.', F(6)],
      ['What people on the path can see: HTTP vs HTTPS.', F(7)],
      ['Troubleshooting game: "the website will not open".', F(8)],
      ['Bandwidth, latency and throughput. Use the calculator.', F(9)],
      ['Complete the Foundations assignments.', F(9)],
      ['Take the Foundations final exam.'],
      ['Revision: read your journal for module 1 and flashcards.'] ] },
    { title: 'Layers and addresses', goal: 'OSI, MAC, IP, binary', days: [
      ['OSI and TCP/IP layers. Write all 7 from memory.', A(0)],
      ['MAC vs IP. Find your own MAC and IP.', A(1)],
      ['IPv4 and binary. Convert 10 IPs to binary.', A(2)],
      ['Public, private and special IPs.', A(3)],
      ['Subnet masks and CIDR.', A(4)],
      ['Subnetting practice: 10 questions.', A(5)] ] },
    { title: 'Subnetting in depth', goal: 'Splitting, VLSM, summaries', days: [
      ['Splitting networks into subnets.', A(6)],
      ['VLSM planner: plan an office.', A(7)],
      ['Route summarization.', A(8)],
      ['NAT and ports.', A(9)],
      ['IPv6 basics.', A(10)],
      ['IPv6 address types and SLAAC.', A(11)] ] },
    { title: 'Addressing wrap-up and ARP', goal: 'Assignments, exam, first protocols', days: [
      ['Complete the Addressing assignments.', A(11)],
      ['Take the Addressing final exam.'],
      ['ARP: run arp -a and read your table.', P(0)],
      ['ICMP: ping and traceroute messages.', P(1)],
      ['DHCP and DORA. Look at your own lease.', P(2)],
      ['DNS lookup chain.', P(3)],
      ['DNS records: look up MX and TXT of 3 domains.', P(4)] ] },
    { title: 'DNS security and TCP', goal: 'Protect DNS, understand TCP', days: [
      ['DNS security: DNSSEC, DoH and DoT.', P(5)],
      ['TCP handshake and flags.', P(6)],
      ['TCP windows and congestion. Play with packet loss.', P(7)],
      ['TCP vs UDP.', P(8)],
      ['Ports and services. Reach 90% in the port game.', P(9)],
      ['HTTP requests and responses.', P(10)] ] },
    { title: 'Web and email protocols', goal: 'HTTP versions, TLS, email', days: [
      ['HTTP/2 and HTTP/3.', P(11)],
      ['HTTPS and TLS handshake.', P(12)],
      ['Look at a website certificate in your browser and write down the issuer and dates.'],
      ['Email: SMTP, SPF, DKIM, DMARC.', P(13)],
      ['More protocols: SSH, FTP, SMB, RDP.', P(14)],
      ['Complete the Protocols assignments.', P(14)],
      ['Take the Protocols final exam.'] ] },
    { title: 'Switching and VLANs', goal: 'Layer 2 devices', days: [
      ['Hub, switch and router.', D(0)],
      ['How a switch learns MACs.', D(1)],
      ['VLANs and trunks.', D(2)],
      ['Spanning Tree Protocol.', D(3)],
      ['Topology builder: build the example network and ping.', D(4)] ] },
    { title: 'Routing', goal: 'How packets find their way', days: [
      ['Routing tables and longest prefix match.', D(5)],
      ['The default gateway journey.', D(6)],
      ['OSPF: cut links and watch the path change.', D(7)],
      ['BGP and how the internet connects.', D(8)],
      ['Firewall rules and rule order.', D(9)],
      ['Stateless vs stateful filtering.', D(10)] ] },
    { title: 'Securing the network', goal: 'Wi-Fi, access control, VPN, QoS, cloud', days: [
      ['Wi-Fi and its security.', D(11)],
      ['Check your home Wi-Fi settings: WPA type, password, WPS.'],
      ['Port security and 802.1X.', D(12)],
      ['VPNs and proxies.', D(13)],
      ['Quality of Service.', D(14)],
      ['Cloud networking basics.', D(15)],
      ['Complete the Devices assignments and exam.'] ] },
    { title: 'Everyday tools', goal: 'ping, traceroute, dig, OS commands', days: [
      ['ping and the troubleshooting ladder.', T(0)],
      ['traceroute.', T(1)],
      ['nslookup and dig.', T(2)],
      ['Your own computer\'s network commands.', T(3)],
      ['Run netstat or ss and explain three connections.', T(3)],
      ['Wireshark: capture your own traffic.', T(4)] ] },
    { title: 'Packets and scanning', goal: 'Wireshark, tcpdump, nmap', days: [
      ['Reading a capture like a story.', T(5)],
      ['Wireshark filters: solve the challenges.', T(6)],
      ['curl, netcat and tcpdump.', T(7)],
      ['nmap: hosts and ports.', T(8)],
      ['nmap scan types and how defenders see them.', T(9)],
      ['A little Python for networking.', T(10)],
      ['Build your safe lab, then do the Tools assignments.', T(11)] ] },
    { title: 'Attacks and defense', goal: 'The defender\'s view', days: [
      ['Take the Tools final exam, then start the security module with the CIA triad.', X(0)],
      ['ARP spoofing and man-in-the-middle.', X(1)],
      ['DNS attacks.', X(2)],
      ['TLS attacks and PKI.', X(3)],
      ['Wireless attacks.', X(4)],
      ['Port scans and reconnaissance.', X(5)],
      ['DoS and DDoS.', X(6)] ] },
    { title: 'Detect, respond, go further', goal: 'Final stretch', days: [
      ['IDS, IPS and writing a rule.', X(7)],
      ['Defense in depth and Zero Trust.', X(8)],
      ['Reading logs.', X(9)],
      ['Network forensics.', X(10)],
      ['Capstone investigation.', X(11)],
      ['Where to go next. Finish assignments and the final exam.', X(12)] ] },
  ];
})();
