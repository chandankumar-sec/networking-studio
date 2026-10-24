# Networking Studio (90 Day)

An interactive networking course that runs fully in your browser. No server, no database, no build step. Everything is written in simple English with a security focus.

## What you get

- **6 modules, 78 lessons:** Foundations, Models and Addressing, Core Protocols, Devices and Routing, Hands-on Tools, Security.
- **Lessons unlock one by one.** You must pass a short quiz (60%) to open the next lesson. Each module ends with a final exam (70%) and two assignments, and the next module opens only after you finish them.
- **234 quiz questions** with explanations. Options are shuffled on every try.
- **12 assignments** with task checklists and a written answer. They are saved in your browser (no server) and go into your journal.
- **My notes** on every lesson, **key takeaways** at the end of each lesson, and **flashcards** (spaced repetition) built from the terms of lessons you finished.
- **My journal:** a single page with your takeaways, terms, notes, quiz scores and assignment answers. Download it as Markdown, copy it, or print it to PDF to share how you learned.
- **90-day plan** with a daily task and a tick-box tracker, plus a dashboard (streak, average quiz score, exams, weak spots).
- **19 interactive tools** (never locked): home network, packet sequences, subnet calculator and practice, VLSM planner, routing lookup, OSPF shortest path, topology builder, firewall tester, packet capture reader, filter challenges, TCP congestion, bandwidth calculator, HTTP builder, ping/traceroute and nmap simulators, and more.
- Shortcuts: `/` search, `F` focus view, `←` `→` previous/next lesson. "Pause motion" stops animations.
- **Open mode** (Settings on the overview page) unlocks every lesson. Useful for revisiting the course or showing it to someone.

## Run it locally

Open `index.html`, or (better) start a tiny server:

```bash
python -m http.server 5173
```

then open `http://localhost:5173`.

## Deploy to GitHub Pages

1. Create a repository on GitHub (for example `networking-studio`).
2. Push this folder:

```bash
git init
git add .
git commit -m "Networking Studio"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/networking-studio.git
git push -u origin main
```

3. In the repository open **Settings → Pages → Build and deployment**. Choose **Deploy from a branch**, branch **main**, folder **/ (root)**, and save.
4. After a minute or two your site is live at `https://YOUR-USERNAME.github.io/networking-studio/`.

To update later: `git add .`, `git commit -m "change"`, `git push`.

Your progress is stored in each browser's `localStorage`, so it is private to that device and browser.

## Tests

```bash
node tests/netlib.test.js     # subnetting, routing match, firewall, path finding
node tests/content.test.js    # checks every lesson, quiz, assignment and plan link
```

## Project structure

```
index.html              entry page
css/style.css           dark and red theme
js/netlib.js            pure networking functions (browser + Node)
js/core.js              state, unlock rules, router, sidebar, search
js/quiz.js              quiz runner (lesson quizzes and exams)
js/pages.js             overview, plan, chapters, tool lab, lesson page
js/pages2.js            final exam, assignments, flashcards, journal
js/widgets/             interactive tools: basic.js, labs.js, adv.js
js/data/                m1..m6 module lessons, assignments.js, plan.js, tools.js
tests/                  Node tests
```

## Add a lesson

In a module file under `js/data/`, add an entry to `steps` using the helper:

```js
S(id, title, subtitle, { type: 'subnet' }, [explanation paragraphs], [key takeaways],
  [[term, definition]], [[question, answer]], [{ q, o: [options], a: correctIndex, why }], 'search keywords')
```

Give each lesson at least 3 quiz questions (the content test enforces this). Widget types: `home`, `seq`, `cards`, `table`, `bits`, `subnet`, `subnetquiz`, `vlsm`, `encap`, `route`, `ospf`, `topo`, `firewall`, `capture`, `capchallenge`, `tcpwin`, `bandwidth`, `pingtrace`, `nmapsim`, `http`, `decision`, `portgame`.

## Responsible use

All scan and attack tools here are **simulations on fictional hosts**. Only run real tools such as nmap or Wireshark on your own network, or where you have written permission.
