/* Shared helpers for curriculum files. */
(function () {
  'use strict';
  // S(id, title, sub, widget, explain[], recap[], terms[[t,d]], faq[[q,a]], quiz[{q,o,a,why}], keywords)
  Studio.S = (id, title, sub, widget, explain, recap, terms, faq, quiz, keywords) => ({ id, title, sub, widget, explain, recap, terms, faq, quiz, keywords });
  Studio.tip = t => ({ kind: 'tip', text: t });
  Studio.warn = t => ({ kind: 'warn', text: t });
  Studio.note = t => ({ text: t });
})();
