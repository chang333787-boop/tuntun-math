// 준비 다리 한 아이 따라가기: node app/test/prep.dbg.mjs <단원> <빈 차시>
import { closure, lessonName } from '../../paper/js/gen.js';
import { prepPlan, newPrep, current, answer, report } from '../js/prep.js';
const [unit = '4-1-3', gap = '2-1-3:3'] = process.argv.slice(2);
const P = prepPlan(unit), all = new Set([...P.pre, ...P.below]);
const unknown = new Set([...all].filter((c) => closure(c).has(gap)));
console.log('단원', unit, '바깥 칸', P.fringe, '빈', gap, '모르는 칸', unknown.size);
const S = newPrep({ unit, id: 'D' });
let it, last = null;
while ((it = current(S))) {
  if (S.at.sheet !== last) { last = S.at.sheet; const sh = S.sheets.at(-1); console.log('— 묶음', sh.id, [...new Set(sh.items.map((x) => x.c))].map((c) => `${c}${unknown.has(c) ? '✗' : ''}`).join(' ')); }
  answer(S, unknown.has(it.c) ? { idk: true } : { vals: it.snap.sol.map(Number), raws: it.snap.sol.map(String) });
}
const rep = report(S);
console.log('끝', S.why, '문항', S.sheets.reduce((n, s) => n + s.items.length, 0));
console.log('여기서부터', rep.start.map((s) => s.c), '아래 먼저', rep.below.map((b) => `${b.c}←${b.check.join(',')}`), '아래 때문', rep.under.map((u) => u.c));
console.log('상태', Object.values(rep.L).filter((x) => x.st !== 'pass').map((x) => `${x.c}:${x.st}`).join(' '));
