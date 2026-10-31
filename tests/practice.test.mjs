// 연습하기·빠르기 점검: node tests/practice.test.mjs
import { NODES as CONCEPTS, byId, makeItem } from '../engine/lessons/index.js';
import { newPractice, currentPractice, answerPractice, stopPractice, workedSteps, planFromStates, RULE } from '../engine/practice.js';
import { newFluency, answerFact, currentFact, fluencyStates } from '../engine/fluency.js';
import { rng } from '../engine/math.js';

let fails = 0, checks = 0;
const ok = (cond, msg) => { checks++; if (!cond) { fails++; console.log('✗', msg); } };
const right = (q) => ({ vals: q.item.sol.map(Number), raws: q.item.sol.map(String) });
const wrong = (q) => (q.item.choices ? { vals: [(q.item.sol[0] + 1) % q.item.choices.length] } : { vals: q.item.sol.map((x, i) => (i === 0 ? Number(x) + 1 : Number(x))), raws: [] });

// 1. 다 맞히고 빠른 아이: 개념마다 연속 4개 → 통과, 마지막에 처음 문제
{
  const P = newPractice({ id: 't1', sid: 's', plan: ['2-2-2:6', '3-1-4:5', '3-2-1:8'], origin: { c: '3-2-1:8', p: byId['3-2-1:8'].gen(rng(5)) } });
  let n = 0, q;
  while ((q = currentPractice(P)) && n++ < 100) answerPractice(P, { ...right(q), ms: 1000 });
  ok(P.done, '1: 끝나야 함');
  ok(P.log.length === 3 * RULE.streak + 1, `1: 문항 수 ${P.log.length} (기대 ${3 * RULE.streak + 1})`);
  ok(P.finalOk === true, '1: 처음 문제 맞힘');
  ok(P.outcome['2-2-2:6'].s === 'auto' && P.outcome['3-1-4:5'].s === 'known', `1: 결과 ${JSON.stringify(P.outcome)}`);
}
// 2. 늘 틀리는 아이: 개념마다 12문항 → 선생님과 함께, 결과 gap
{
  const P = newPractice({ id: 't2', sid: 's', plan: ['5-1-4:5', '5-1-5:2'] });
  let n = 0, q;
  while ((q = currentPractice(P)) && n++ < 100) answerPractice(P, { ...wrong(q), ms: 5000 });
  ok(P.done && P.log.length === 2 * RULE.max, `2: 문항 ${P.log.length}`);
  ok(P.per['5-1-4:5'].state === 'teacher' && P.outcome['5-1-4:5'].s === 'gap', '2: gap');
}
// 3. 맞히지만 느린 아이: 연속 6개 → 느림으로 통과
{
  const P = newPractice({ id: 't3', sid: 's', plan: ['2-2-2:4'] });
  let n = 0, q;
  while ((q = currentPractice(P)) && n++ < 100) answerPractice(P, { ...right(q), ms: 30000 });
  ok(P.log.length === RULE.slowStreak && P.outcome['2-2-2:4'].s === 'slow', `3: ${P.log.length} ${JSON.stringify(P.outcome)}`);
}
// 3b. 늦게 맞히면 ●는 그대로: ● ● ○(늦음) ● ● ● → 6문항에 통과
{
  const P = newPractice({ id: 't3b', sid: 's', plan: ['1-1-3:3'] });
  const ms = [1000, 1000, 60000, 1000, 1000, 1000];
  for (const m of ms) answerPractice(P, { ...right(currentPractice(P)), ms: m });
  ok(P.per['1-1-3:3'].state === 'mastered' && P.log.length === 6, `3b: ${P.per['1-1-3:3'].state} ${P.log.length}`);
}
// 3c. 틀리면 ● 하나가 꺼진다: ● ● ● × ● ● ● → 7문항에 통과 (3 → 2 → 5)
{
  const P = newPractice({ id: 't3c', sid: 's', plan: ['1-1-3:3'] });
  for (let i = 0; i < 8; i++) { const q = currentPractice(P); if (!q || P.done) break; answerPractice(P, { ...(i === 3 ? wrong(q) : right(q)), ms: 1000 }); }
  ok(P.per['1-1-3:3'].state === 'mastered' && P.log.length === 7, `3c: ${P.per['1-1-3:3'].state} ${P.log.length}`);
}
// 4. 반쯤 맞히는 아이(맞고 틀리고): ●가 1 ↔ 0을 오가 12문항 → 불안정
{
  const P = newPractice({ id: 't4', sid: 's', plan: ['3-1-3:6'] });
  let n = 0, q;
  while ((q = currentPractice(P)) && n++ < 100) answerPractice(P, { ...(n % 2 ? right(q) : wrong(q)), ms: 3000 });
  ok(P.outcome['3-1-3:6'].s === 'unstable', `4: ${JSON.stringify(P.outcome)}`);
}
// 5. 중간에 그만: 푼 개념만 결과에
{
  const P = newPractice({ id: 't5', sid: 's', plan: ['1-2-6:2', '2-1-3:3'] });
  for (let i = 0; i < 2; i++) answerPractice(P, { ...right(currentPractice(P)), ms: 2000 });
  stopPractice(P);
  ok(P.done && P.outcome['1-2-6:2'] && !P.outcome['2-1-3:3'], `5: ${JSON.stringify(P.outcome)}`);
}
// 6. 같은 숫자 풀이: 단계 정답이 모두 맞다고 판정되어야
{
  let n = 0;
  for (const c of CONCEPTS) for (let k = 0; k < 20; k++) {
    const p = c.gen(rng(1000 + k));
    for (const w of workedSteps(c.id, p)) { n++; ok(w.item.check(w.sol.map(Number), w.sol.map(String)).ok, `6: ${c.id} 단계 ${w.c} 풀이`); }
  }
  ok(n > 500, `6: 단계 ${n}`);
}
// 7. 계획: 처음 막힌 곳이 낮은 학년부터 (아래 때문에 틀린 차시는 그 위로 이어서)
{
  const plan = planFromStates({ '5-1-4:5': { s: 'gap' }, '2-2-2:6': { s: 'unstable' }, '5-1-5:2': { s: 'bridge' }, '3-1-3:6': { s: 'known' } });
  ok(plan.join() === '2-2-2:6,5-1-4:5,5-1-5:2', `7: ${plan}`);
}
// 8. 구구단 빠르기 → 단 묶음 상태
{
  const F = newFluency({ id: 'f', sid: 's', set: 'mul', size: 'all', seed: 3 });
  let f;
  while ((f = currentFact(F))) { const [a, b] = f; answerFact(F, { val: a === 7 ? a * b + 1 : a * b, ms: a === 8 ? 9000 : 2000 }); }
  const st = fluencyStates(F);
  ok(F.result.n === 64 && st['2-2-2:6'].s === 'gap' && st['2-2-2:2'].s === 'auto' && st['2-2-2:5'].s === 'slow', `8: ${JSON.stringify(st)}`);
}
console.log(`연습·빠르기·차시 점검 ${checks}개 · 실패 ${fails}`);
if (fails) process.exit(1);
