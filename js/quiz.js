/* Quiz runner: shuffled options, all-answers-then-submit, retry. Used by lesson quizzes and final exams. */
(function () {
  'use strict';
  const { h, state } = Studio;

  function shuffle(a) { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; }
  Studio.shuffle = shuffle;

  /**
   * opts: { questions, passFrac, title, onDone(result) } ; result = {score,total,passed}
   */
  Studio.runQuiz = function (root, opts) {
    const pick = () => (opts.getQuestions ? opts.getQuestions() : opts.questions);
    const total = pick().length;
    const need = Math.ceil(opts.passFrac * total - 1e-9);

    function start() {
      root.innerHTML = '';
      const qs = shuffle(pick()).map(q => {
        const options = shuffle(q.o.map((t, i) => ({ t, ok: i === q.a })));
        return { q: q.q, why: q.why, options, picked: -1 };
      });
      const wrap = h('div');
      const submit = h('button', { class: 'btn primary', disabled: true, onclick: grade }, 'Submit answers');
      const status = h('span', { class: 'muted' }, '0 / ' + total + ' answered');
      wrap.append(h('div', { class: 'callout' }, h('b', null, 'Pass mark: '), need + ' out of ' + total + ' correct. You can retry as many times as you like.'));
      const boxes = qs.map((q, qi) => {
        const box = h('div', { class: 'q' }, h('b', null, (qi + 1) + '. '), h('span', { html: q.q }));
        const btns = q.options.map((o, oi) => {
          const b = h('button', { class: 'opt', onclick: () => { if (q.locked) return; q.picked = oi; btns.forEach((x, k) => x.classList.toggle('picked', k === oi)); update(); } }, o.t);
          return b;
        });
        btns.forEach(b => box.append(b)); q.btns = btns; q.box = box;
        return box;
      });
      boxes.forEach(b => wrap.append(b));
      wrap.append(h('div', { class: 'row', style: { marginTop: '14px' } }, submit, status));
      root.append(wrap);

      function update() {
        const n = qs.filter(q => q.picked >= 0).length;
        status.textContent = n + ' / ' + total + ' answered';
        submit.disabled = n < total;
      }
      function grade() {
        let score = 0;
        qs.forEach(q => {
          q.locked = true;
          q.btns.forEach((b, k) => { b.disabled = true; if (q.options[k].ok) b.classList.add('right'); });
          if (q.options[q.picked].ok) score++; else q.btns[q.picked].classList.add('wrong');
          q.box.append(h('div', { class: 'why', html: (q.options[q.picked].ok ? '✅ Correct. ' : '❌ Not quite. ') + (q.why || '') }));
        });
        const passed = score >= need;
        submit.remove(); status.remove();
        wrap.append(h('div', { class: 'status ' + (passed ? 'ok' : 'bad'), style: { marginTop: '14px' } },
          h('b', null, 'Score: ' + score + ' / ' + total + '. '), passed ? 'You passed!' : 'Not passed yet. Read the explanations above, then try again.'),
          h('div', { class: 'row', style: { marginTop: '10px' } }, h('button', { class: 'btn', onclick: start }, 'Try again')));
        if (opts.onDone) opts.onDone({ score, total, passed });
      }
    }
    start();
  };
})();
