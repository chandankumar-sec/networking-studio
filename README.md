# Networking Studio (90 Day)

Ek interactive networking course jo poora browser mein chalta hai. Koi server, database ya build step nahi hai. Content simple Hinglish mein hai aur security ki nazar se likha gaya hai.

## Kya milta hai

- **6 modules, 54 lessons:** Foundations, Addressing, Core Protocols, Devices and Routing, Hands-on Tools, Security.
- **90-day plan:** har din ka ek chhota kaam, tick karne wala tracker, aur "aaj Day kaun sa hai" ka hisaab.
- **13 interactive tools:** home network, packet sequence animator, subnet calculator aur practice, encapsulation, routing lookup, topology builder (ping ke saath), firewall tester, Wireshark jaisa capture reader, nmap aur ping/traceroute simulator, HTTP builder, port game.
- **Har lesson mein:** diagram ya tool, simple explanation, terms, common doubts, aur quick quiz.
- **Progress** browser ke `localStorage` mein save hota hai (is device par).
- Shortcuts: `/` search, `F` focus view, `←` `→` pichla ya agla step. "Pause motion" animations rok deta hai.

## Local chalana

Seedha `index.html` double-click karo, ya ek chhota server chalao (behtar):

```bash
python -m http.server 5173
```

phir `http://localhost:5173` kholo.

## GitHub Pages par deploy karna

1. GitHub par naya repository banao (jaise `networking-studio`).
2. Is folder ki saari files us repository mein push karo:

```bash
git init
git add .
git commit -m "Networking Studio"
git branch -M main
git remote add origin https://github.com/<tumhara-username>/networking-studio.git
git push -u origin main
```

3. Repository mein **Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: main / (root)** chuno aur Save karo.
4. 1-2 minute baad site `https://<tumhara-username>.github.io/networking-studio/` par live hogi.

Netlify ya Vercel par bhi folder drag-drop karke deploy ho jata hai (build command khaali chhodo).

## Tests

Network logic (subnetting, routing match, firewall, path finding) ke tests:

```bash
node tests/netlib.test.js
```

## Structure

```
index.html            entry page
css/style.css         dark + red theme
js/netlib.js          pure networking functions (browser + Node)
js/core.js            state, router, sidebar, search
js/pages.js           overview, plan, chapters, tool lab, lesson page
js/widgets/basic.js   home, sequence, cards, table, bits, subnet, encapsulation, routing
js/widgets/labs.js    topology, firewall, capture, nmap/ping sims, HTTP, decision, port game
js/data/              curriculum (3 files), 90-day plan, tool list
```

## Naya lesson jodna

`js/data/curriculum*.js` mein kisi module ke `steps` mein ek `S(...)` entry jodo. Widget type ke options: `home`, `seq`, `cards`, `table`, `bits`, `subnet`, `subnetquiz`, `encap`, `route`, `topo`, `firewall`, `capture`, `pingtrace`, `nmapsim`, `http`, `decision`, `portgame`.

## Zimmedaari

Saare scan aur attack wale tools **simulation** hain, fictional hosts par. Asli nmap, Wireshark ya koi bhi test sirf apne network ya likhit permission wali lab mein karo.
