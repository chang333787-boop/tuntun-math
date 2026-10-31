import { makeSheet, lessonsIn, lessonName } from '../js/gen.js';
import { kidReport, ST } from '../js/judge.js';
import { rng } from '../../engine/math.js';
const r = rng(7), SLIP = 0.05;
for (let t = 0; t < 40; t++) {
  const sheets = [], res = {};
  const take = (sh) => { const rr = { done: {}, it: {}, w: {} }; sh.chapters.forEach((c) => (rr.done[c.key] = true)); for (const it of sh.items) { if (it.form === 'w') continue; if (r.next() < SLIP) rr.it[it.k] = it.snap.choices ? { s: 'x', a: [String((Number(it.snap.sol[0]) + 1) % it.snap.choices.length)] } : { s: 'x', a: it.snap.sol.map((x, i) => String(i === it.snap.sol.length - 1 ? Number(x) + 1 : x)) }; } res[sh.id] = { kid: rr }; sheets.push(sh); };
  take(makeSheet({ kind: 'gate', words: false, id: 'G' + t }));
  let rep = kidReport(sheets, res, 'kid');
  for (let round = 0; round < 2 && rep.checkList.length; round++) { take(makeSheet({ kind: 'check', words: false, lessons: rep.checkList.map((c) => ({ c, n: 4 })), id: 'C' + t + round })); rep = kidReport(sheets, res, 'kid'); }
  if (rep.start.length) console.log(t, rep.start.map((s) => { const x = rep.L[s.c]; return `${s.c} ${lessonName(s.c)} ${ST[x.st]} ${x.ok}/${x.tot} recs ${x.all} why ${x.why ? x.why.sure.map((h) => h.id + h.s).join(',') + ' slips' + x.why.slips : ''} wrong ${x.use.filter(r=>!r.ok).map(r => JSON.stringify(r.ans) + (r.d ? (r.d.hyps.map(h=>h.id).join('/') + ':' + (r.d.slip||'')) : 'nod')).join(' ')}`; }).join(' | '));
}
