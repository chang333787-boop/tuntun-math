// 실수 판정 규칙 시뮬레이션: node tests/rule.sim.mjs
// 첫 문제를 틀린 아이의 실제 정답률이 p일 때 → 앎(실수) / 불안정 / 모름(빈칸 · 합치기 빈칸) 중 무엇으로 판정되나 · CHECK=1이면 기준(npm test)
import { newSession, currentItem, answer } from '../engine/engine.js';
import { rng } from '../engine/math.js';
const R = rng(7), N = Number(process.env.N || 2000);
const rows = [];
for (const p of [0.95, 0.9, 0.8, 0.7, 0.6, 0.3, 0]) {
  const cnt = { known: 0, unstable: 0, gap: 0, other: 0 }; let items = 0;
  for (let i = 0; i < N; i++) {
    const S = newSession({ id: 'r' + i, sid: 'x', problem: { c: '2-2-2:6', p: { a: 7, b: 8 } }, opts: { confirmN: Number(process.env.K || 3) } });
    answer(S, { vals: [54], raws: ['54'], ms: 3000 });                     // 처음 문제는 틀렸다
    let g = 0;
    while (!S.done && g++ < 20) {
      const q = currentItem(S);
      const right = q.c === '2-2-2:6' ? R.chance(p) : true;                     // 앞 개념은 다 안다
      answer(S, right ? { vals: q.item.sol.map(Number), raws: q.item.sol.map(String), ms: 3000 } : { vals: [q.item.sol[0] + 1], raws: [String(q.item.sol[0] + 1)], ms: 3000 });
    }
    const s = S.result.states['2-2-2:6'] ? S.result.states['2-2-2:6'].s : 'other';
    if (s === 'known' || s === 'auto' || s === 'slow') cnt.known++; else if (s === 'bridge' || s === 'gap' || s === 'shaky') cnt.gap++; else if (s in cnt) cnt[s]++; else cnt.other++;
    items += S.log.length;
  }
  rows.push([p, cnt, items / N]);
}
const pct = (x) => String(Math.round((100 * x) / N)).padStart(3) + '%';
console.log('실제 정답률 │ 실수(앎)  불안정   모름  │ 문항(처음 문제 포함)');
rows.forEach(([p, c, it]) => console.log(`   ${String(Math.round(p * 100)).padStart(3)}%    │ ${pct(c.known)}    ${pct(c.unstable)}   ${pct(c.gap)}  │ ${it.toFixed(1)}`));

// 처음 문제를 맞힌 아이 — 예전(한 문제로 앎) vs 지금(새 숫자 2문제 더)
const rows2 = [];
for (const p of [0.95, 0.8, 0.6, 0.3]) {
  const cnt = { known: 0, unstable: 0, gap: 0, other: 0 }; let items = 0;
  for (let i = 0; i < N; i++) {
    const S = newSession({ id: 'v' + i, sid: 'x', problem: { c: '2-2-2:6', p: { a: 7, b: 8 } }, opts: { confirmN: Number(process.env.K || 3) } });
    answer(S, { vals: [56], raws: ['56'], ms: 3000 });                     // 처음 문제는 맞혔다
    let g = 0;
    while (!S.done && g++ < 20) {
      const q = currentItem(S);
      const right = q.c === '2-2-2:6' ? R.chance(p) : true;
      answer(S, right ? { vals: q.item.sol.map(Number), raws: q.item.sol.map(String), ms: 3000 } : { vals: [q.item.sol[0] + 1], raws: [String(q.item.sol[0] + 1)], ms: 3000 });
    }
    const s = S.result.states['2-2-2:6'] ? S.result.states['2-2-2:6'].s : 'other';
    if (s === 'known' || s === 'auto' || s === 'slow') cnt.known++; else if (s in cnt) cnt[s]++; else cnt.other++;
    items += S.log.length;
  }
  rows2.push([p, cnt, items / N]);
}
console.log('\n처음 문제를 맞혔을 때 (예전 = 무조건 앎 100%)');
console.log('실제 정답률 │ 앎    불안정   모름  │ 문항');
rows2.forEach(([p, c, it]) => console.log(`   ${String(Math.round(p * 100)).padStart(3)}%    │ ${pct(c.known)}   ${pct(c.unstable)}   ${pct(c.gap)}  │ ${it.toFixed(1)}`));
// 기준(CHECK=1 · npm test) — 실수 판정이 실력을 가려야 함: 잘하는 아이(95%)는 대부분 실수(앎) · 못하는 아이(30% 이하)는 거의 앎이 아님 · 판정이 정답률을 그대로 베끼지 않음(11-08 — 고장 나 모두 0%이던 것 · 한 문제로 정해 동전 던지기이던 것)
if (process.env.CHECK) {
  const at = (p) => rows.find((x) => x[0] === p)[1], fr = (c, k) => c[k] / N;
  const bad = [];
  if (!(fr(at(0.95), 'known') >= 0.75)) bad.push(`95% 아이 실수(앎) ${pct(at(0.95).known)} < 75%`);
  if (!(fr(at(0.3), 'known') <= 0.1)) bad.push(`30% 아이 실수(앎) ${pct(at(0.3).known)} > 10%`);
  if (!(fr(at(0), 'known') === 0 && fr(at(0), 'gap') >= 0.9)) bad.push(`0% 아이가 모름으로 안 감 ${pct(at(0).gap)}`);
  if (!(fr(at(0.6), 'known') <= 0.4)) bad.push(`60% 아이 실수(앎) ${pct(at(0.6).known)} > 40% — 정답률을 그대로 베낌`);
  console.log(bad.length ? `✗ 실수 판정 기준 ${bad.join(' · ')}` : '실수 판정 기준 통과');
  if (bad.length) process.exit(1);
}
