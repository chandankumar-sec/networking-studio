/* Assignments: two hands-on tasks per module. Answers are saved in the browser and go into the journal. */
(function () {
  'use strict';
  Studio.assignments = {
    foundations: [
      { id: 'f1', title: 'Map your own network', brief: 'Draw (on paper or in a tool) the network you use every day, then check it with real commands on your computer.',
        tasks: ['List every device on your home or hostel network (phone, laptop, TV, router...).', 'Run <code>ipconfig /all</code> (Windows) or <code>ip a</code> and <code>ip route</code> (Linux/Mac). Write down your IP, subnet mask and default gateway.', 'Find out whether your IP is private or public and say why.', 'Mark in your drawing which devices are wired and which are wireless.'],
        hint: 'Your gateway is usually the router, like 192.168.1.1 or 192.168.0.1.', placeholder: 'Write your devices, your IP/mask/gateway, and whether the IP is private. Paste the command output if you can.' },
      { id: 'f2', title: 'Follow one website visit', brief: 'Write the story of what happens when you open a website, using the lessons.',
        tasks: ['Choose a website and run <code>nslookup</code> (or dig) on it. Write the IP you get.', 'Run <code>ping</code> and <code>tracert</code>/<code>traceroute</code> to that site. Write the number of hops.', 'In your own words, list the steps from typing the URL to seeing the page (DNS, TCP, HTTP).', 'Say what someone on the same Wi-Fi could see if the site used HTTP, and what they could see with HTTPS.'],
        hint: 'Use the "A website in small steps" lesson as a map.', placeholder: 'Describe your results and the full story in your own words.' },
    ],
    addressing: [
      { id: 'a1', title: 'Subnet an office', brief: 'A small office has the network 192.168.50.0/24. Design the subnets.',
        tasks: ['Create four subnets for: Sales (50 hosts), IT (20 hosts), Servers (10 hosts), and one router-to-router link.', 'Use the VLSM planner tool. Write each subnet\'s network, prefix, usable range and broadcast.', 'Say how many addresses are left over.', 'Explain in one sentence why you gave the biggest subnet first.'],
        hint: 'Sort from biggest to smallest. A link between two routers needs a /30.', placeholder: 'Write the table of subnets (network/prefix, range, broadcast) and your explanation.', minChars: 120 },
      { id: 'a2', title: '10 subnetting problems', brief: 'Solve ten problems by hand first, then check them with the calculator.',
        tasks: ['Solve five problems: network address and broadcast of different IP/prefix pairs.', 'Solve five problems: how many usable hosts for a given prefix, and which prefix fits N hosts.', 'Check each with the subnet calculator and note the ones you got wrong.', 'Write down the mistake you made most and how to avoid it.'],
        hint: 'Use the block-size trick: 256 minus the mask octet.', placeholder: 'Paste your ten questions, your answers, and the mistakes you made.', minChars: 150 },
    ],
    protocols: [
      { id: 'p1', title: 'Capture a website visit', brief: 'Use Wireshark on your own computer to capture a short browsing session.',
        tasks: ['Install Wireshark and start a capture on your Wi-Fi or Ethernet interface for 30 seconds while you open one website.', 'Use a filter to find the DNS query and answer. Write the IP in the answer.', 'Find a TCP handshake (SYN, SYN-ACK, ACK) and write the port numbers.', 'Find the TLS Client Hello and write the server name (SNI) you see.'],
        hint: 'Filters: <code>dns</code>, <code>tcp.flags.syn==1</code>, <code>tls.handshake.type==1</code>.', placeholder: 'Describe what you found. Include packet numbers, IPs and ports.', minChars: 120 },
      { id: 'p2', title: 'Investigate a domain', brief: 'Check the DNS and email setup of a domain.',
        tasks: ['Pick a well-known domain. Look up A, MX and TXT records with nslookup or dig.', 'Find the SPF record and write which services may send email for the domain.', 'Check if it has a DMARC record (<code>_dmarc.domain</code>) and write the policy.', 'Say in two sentences how well the domain is protected from email spoofing.'],
        hint: 'Try <code>dig TXT _dmarc.example.com</code>.', placeholder: 'Write the records you found and your conclusion.', minChars: 120 },
    ],
    devices: [
      { id: 'd1', title: 'Design a small office network', brief: 'Plan a secure network for a 30-person office on paper or in the topology builder.',
        tasks: ['List the VLANs you would create (for example Staff, Servers, Guest, Printers) and a subnet for each.', 'Say where the router and firewall go and which traffic the firewall should allow between VLANs.', 'Write five firewall rules in order, with a default deny.', 'Explain how you would protect the Wi-Fi (type of security, guest network).'],
        hint: 'Think: what must Guests reach? Only the internet. What may Staff reach in Servers?', placeholder: 'Write your VLAN plan, rules and Wi-Fi plan.', minChars: 150 },
      { id: 'd2', title: 'Break and fix', brief: 'Use the topology builder to cause and fix problems on purpose.',
        tasks: ['Build the example network. Ping from PC1 to the server. It should work.', 'Cut the link between the switch and the router. Ping again and write what happens and why.', 'Restore it, then give PC2 an IP in another subnet. Ping the server and write what happens and why.', 'Use the OSPF tool: cut a link on the best path and write how the path changed.'],
        hint: 'A missing physical path and a missing router give different errors.', placeholder: 'Describe each experiment and what you observed.', minChars: 120 },
    ],
    tools: [
      { id: 't1', title: 'Troubleshooting ladder', brief: 'Run the full troubleshooting ladder on your own connection and record the results.',
        tasks: ['Ping 127.0.0.1, then your default gateway, then 8.8.8.8, then a domain name. Note the time for each.', 'Run traceroute to one far-away site. Note the number of hops and where latency jumps.', 'Run <code>netstat -ano</code> or <code>ss -tunap</code>. Pick three connections and say what each one probably is.', 'Flush your DNS cache and look up a name again.'],
        hint: 'If you find a connection you do not understand, look up the remote IP.', placeholder: 'Paste the key lines of the output and explain them.', minChars: 150 },
      { id: 't2', title: 'Scan your own lab', brief: 'Scan a machine that you own (a VM or your own laptop) and explain the results.',
        tasks: ['Set up a lab target (a VM or your own computer). Make sure it is yours.', 'Run <code>nmap -sV</code> against it and record the open ports and versions.', 'Close one unnecessary service or port, scan again and compare.', 'Write what the open ports allow and which you would close in real life.'],
        hint: 'Only scan systems you own. <code>127.0.0.1</code> is always allowed.', placeholder: 'Paste the scan output (before and after) and your analysis.', minChars: 150 },
    ],
    security: [
      { id: 's1', title: 'Analyze a log', brief: 'Find suspicious activity in a set of logs, using the log lesson as a model.',
        tasks: ['Open the sample firewall log in the lesson. List the three suspicious patterns you can find.', 'For each, name the likely attack stage (recon, beacon, lateral movement).', 'Write what you would do first for each (block, isolate, investigate).', 'Say which one you would handle first and why (triage).'],
        hint: 'Rank by risk: a possible active infection is more urgent than a failed scan.', placeholder: 'Write your findings, the stage for each, and your triage order.', minChars: 150 },
      { id: 's2', title: 'Write an incident report', brief: 'Write a short report for the capstone incident, as if you were the analyst.',
        tasks: ['Summarize what was detected and when (use your own timeline).', 'List the indicators of compromise (IPs and domains).', 'Describe the actions: contain, investigate, eradicate, recover.', 'Write three lessons learned and one change that would prevent it next time.'],
        hint: 'Keep it clear: what happened, how you know, what you did, what to change.', placeholder: 'Write the full incident report.', minChars: 200 },
    ],
  };
})();
