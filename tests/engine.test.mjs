// 엔진 경계 상황 시험: node tests/engine.test.mjs
import { newSession, currentItem, answer, stop, continueSession, mergeStates } from '../engine/engine.js';
import { parseProblem } from '../engine/parse.js';
import { byId, resolve } from '../engine/lessons/index.js';
import { rng } from '../engine/math.js';
let f = 0; const ok = (c, m) => { if (!c) { f++; console.log('✗', m); } else if (process.env.V) console.log('✓', m); };
const P = (t) => { const r = parseProblem(t); const x = resolve(r.c, r.p); return { c: x.c, p: x.p, text: t }; };
const FD = P('3/4 ÷ 2/5').c, MUL78 = '2-2-2:6';
const sol = (S) => { const q = currentItem(S); return { vals: q.item.sol.map(Number), raws: q.item.sol.map(String), ms: 1000 }; };

// 1. 원래 문제를 맞혀도 한 문제로는 '앎'이 아니다 — 새 숫자 2문제를 더 맞혀야
let S = newSession({ id: 't1', sid: 'a', problem: P('3/4 ÷ 2/5') });
answer(S, sol(S));
ok(!S.done && currentItem(S).c === FD && currentItem(S).role === 'check', `원래 문제를 맞히면 같은 차시 새 숫자 문제가 나옴 (${FD})`);
answer(S, sol(S)); ok(!S.done, '새 숫자 1문제로는 아직');
answer(S, sol(S));
ok(S.done && S.result.states[FD].s === 'known' && S.log.length === 3, '원래 + 새 숫자 2문제 = 앎 (3문항)');
// 보기 고르기 개념은 찍을 수 있어 새 숫자 3문제
const PICK = Object.keys(byId).find((id) => { try { return !!byId[id].makeRaw(byId[id].gen(rng(3))).choices; } catch (e) { return false; } });
S = newSession({ id: 't1c', sid: 'a', problem: { c: PICK, p: byId[PICK].gen(rng(3)) } });
let g = 0; while (!S.done && g++ < 10) answer(S, sol(S));
ok(S.done && S.log.length === 4 && S.result.states[PICK].s === 'known', `보기 고르기 = 원래 + 3문제 (${PICK} · ${S.log.length})`);
// 맞힌 뒤 한 번 틀리면 실수인지 3문제 더: 다 맞으면 앎(실수)
S = newSession({ id: 't1d', sid: 'a', problem: P('3/4 ÷ 2/5') });
answer(S, sol(S)); answer(S, { vals: [1, 1], raws: ['1', '1'] });
g = 0; while (!S.done && g++ < 10) answer(S, sol(S));
ok(S.done && S.result.states[FD].s === 'known' && S.res[FD].slip && S.log.length === 5, `맞힘 → 틀림 → 3문제 다 맞음 = 실수 (${S.log.length})`);
// 맞힌 뒤 틀리고, 실수인지 보는 문제에서 둘 더 틀리면 모름 → 틀린 문제를 같은 숫자로 쪼갬
S = newSession({ id: 't1e', sid: 'a', problem: P('3/4 ÷ 2/5') });
answer(S, sol(S)); for (let i = 0; i < 3; i++) answer(S, { vals: [1, 1], raws: ['1', '1'] });
ok(S.phase === 'steps' && S.steps.length > 0 && S.res[FD].st === 'fail', '맞힘 → 틀림 → 둘 더 틀림 → 같은 숫자로 쪼개기');
g = 0; while (!S.done && g++ < 60) answer(S, sol(S));
ok(S.done && S.result.states[FD].s === 'bridge', '쪼갠 단계·앞 차시를 다 맞히면 합치기 어려움');
// 맞힌 뒤 틀리고, 셋 중 하나 더 틀리면 불안정
S = newSession({ id: 't1g', sid: 'a', problem: P('3/4 ÷ 2/5') });
answer(S, sol(S)); answer(S, { vals: [1, 1], raws: ['1', '1'] }); answer(S, { vals: [1, 1], raws: ['1', '1'] }); answer(S, sol(S)); answer(S, sol(S));
ok(S.done && S.result.states[FD].s === 'unstable', '맞힘 → 틀림 → 셋 중 하나 더 틀림 = 불안정');
// 맞힌 뒤 확인 도중 그만 → 더 봐야 함
S = newSession({ id: 't1f', sid: 'a', problem: P('3/4 ÷ 2/5') });
answer(S, sol(S)); stop(S);
ok(S.result.states[FD].s === 'pending', '확인 도중 그만 → 더 봐야 함');

// 2. 구구단 문제를 빨리 맞히면 빠르고 정확, 느리면 느림
S = newSession({ id: 't2', sid: 'a', problem: P('7 × 8') }); g = 0; while (!S.done && g++ < 10) answer(S, { ...sol(S), ms: 2000 });
ok(S.result.states[MUL78].s === 'auto', '빨리 맞힌 구구단 = 빠르고 정확');
S = newSession({ id: 't3', sid: 'a', problem: P('7 × 8') }); g = 0; while (!S.done && g++ < 10) answer(S, { ...sol(S), ms: 9000 });
ok(S.result.states[MUL78].s === 'slow', '느리게 맞힌 구구단 = 느림');

// 3. 종이에 쓴 답(틀림) → 바로 단계로
S = newSession({ id: 't4', sid: 'a', problem: P('58 × 37'), answered: { vals: [580], raws: ['580'] } });
ok(S.phase === 'steps' && S.log[0].bug && S.log[0].bug.name.includes('밀지'), '종이 답 580 → 단계 · 오답 모양 "한 칸 밀지 않음"');

// 4. 단계를 다 맞히고 앞 개념도 다 알면 다리
S = newSession({ id: 't5', sid: 'a', problem: P('6/7 ÷ 2/7') });
answer(S, { vals: [3 / 7], raws: ['3/7'] });
ok(S.log[0].bug && [].concat(S.log[0].bug.to).some((x) => x && byId[x] && byId[x].u === '3-1-3'), `6/7 ÷ 2/7 = 3/7 → 오답 모양이 3학년 나눗셈(덜어내기) 차시를 가리킴 (${JSON.stringify(S.log[0].bug)})`);
g = 0; while (!S.done && g++ < 60) answer(S, sol(S));
ok(S.done && S.result.bridges.includes(P('6/7 ÷ 2/7').c) && !S.result.roots.length, '단계·앞 차시를 다 맞히면 합치기 어려움');

// 5. 모르겠어요만 누르면 아래로 내려가 뿌리를 찾는다
S = newSession({ id: 't6', sid: 'a', problem: P('8 + 5'), opts: { maxItems: 40 } });
g = 0; while (!S.done && g++ < 60) answer(S, { idk: true });
ok(S.done && S.result.roots.some((x) => byId[x].g.startsWith('1-')), `모두 모르겠어요 → 1학년 차시가 뿌리 (${S.result.roots})`);

// 6. 그만하기 → 남은 것은 더 확인, 이어서 하기로 이어짐
S = newSession({ id: 't7', sid: 'a', problem: P('3/4 ÷ 2/5'), opts: { maxItems: 40 } });
g = 0; while (!S.done && g++ < 6) answer(S, { idk: true });
stop(S);
ok(S.done && S.stoppedByUser && S.result.pending.length > 0, '그만하기 → 결과에 더 확인이 남음');
const C = continueSession(S, { id: 't7b', prior: {} });
ok(!C.done && C.cont === 't7', '이어서 하기 → 남은 개념부터 다시');
g = 0; while (!C.done && g++ < 80) answer(C, { idk: true });
ok(C.done && C.result.pending.length === 0 && C.result.roots.length > 0, '이어서 끝까지 하면 뿌리를 찾음');

// 7. 학생 표 합치기 — 단계에서 한 번 맞힌 것으로 예전 빈칸을 덮지 않는다
const TONGBUN = '5-1-4:5';
const st0 = { [TONGBUN]: { s: 'gap', t: 0, h: [] } };
S = newSession({ id: 't8', sid: 'a', problem: P('3/4 ÷ 2/5') });
answer(S, { vals: [1, 1], raws: ['1', '1'] });
const q = currentItem(S); ok(q.c === TONGBUN, `첫 단계 = 통분 (${q.c})`); answer(S, sol(S));
g = 0; while (!S.done && g++ < 60) answer(S, sol(S));
const merged = mergeStates(st0, S);
ok(merged[TONGBUN].s === 'gap', '단계에서만 맞힌 통분은 예전 빈칸 기록을 덮지 않음');

// 8. 최근에 앎이면 다시 묻지 않는다
const SKIP = '6-1-1:3';
S = newSession({ id: 't9', sid: 'a', problem: P('3/4 ÷ 2/5'), prior: { [TONGBUN]: { s: 'known', t: Date.now() } } });
answer(S, { idk: true }); g = 0; while (!S.done && g++ < 60) answer(S, sol(S));
ok(!S.log.some((l) => l.c === TONGBUN && l.role === 'check'), '최근 앎 기록은 확인 문제로 다시 묻지 않음');

// 9. 단계 도중 그만하면 다리가 아니라 '더 확인'
S = newSession({ id: 't10', sid: 'a', problem: P('58 × 37'), answered: { vals: [580], raws: ['580'] } });
answer(S, sol(S)); stop(S);
ok(S.result.states[P('58 × 37').c].s === 'pending' && !S.result.bridges.length, '단계 도중 그만함 → 원래 문제는 더 확인 (다리 아님)');

// 10. 단원 점검 — 경계 찾기 (3-1 곱셈: 4차시까지 되고 5차시부터 막힌 아이)
{
  const { newUnitScan } = await import('../engine/engine.js');
  const cannot = new Set(['3-1-4:5', '3-1-4:6']);
  const S = newUnitScan({ id: 'u1', sid: 'a', unit: '3-1-4' });
  let g = 0;
  while (!S.done && g++ < 60) { const q = currentItem(S); answer(S, cannot.has(q.c) ? { idk: true } : sol(S)); }
  ok(S.done && S.result.boundaries.join() === '3-1-4:5', `단원 점검: 경계 = 5차시 (${S.result.boundaries})`);
  ok(S.result.states['3-1-4:3'] && S.result.states['3-1-4:3'].s === 'known', '경계 아래 차시는 앎');
  ok(S.result.states['3-1-4:6'] && S.result.states['3-1-4:6'].s === 'shaky', '경계 위 차시는 아래 때문에 틀림');
  ok(S.result.roots.includes('3-1-4:5'), `앞 차시가 다 되면 5차시가 처음 막힌 곳 (${S.result.roots})`);
  ok(S.log.length <= 14, `문항 ${S.log.length}개 이하 14`);
}
// 11. 저장했다 이어 가기 — 문항마다 세션을 JSON 으로 바꿨다 되읽어도(브라우저 저장 · RPG 저장소) 결과가 같다 (반씩 좁히기 후보가 Set 이면 깨졌다)
{
  const { newUnitScan } = await import('../engine/engine.js');
  const { lessonsOfUnit, UNITS } = await import('../engine/lessons/index.js');
  let diff = 0, runs = 0;
  for (const u of UNITS.map((x) => x.id).filter((x) => lessonsOfUnit(x).length >= 3)) {
    const ids = lessonsOfUnit(u), bad = new Set([ids[1], ids[ids.length - 1]]);
    const A = newUnitScan({ id: 'j' + u, sid: 'a', unit: u });
    let B = JSON.parse(JSON.stringify(A)), g = 0;
    while (!A.done && g++ < 60) {
      const q = currentItem(A), q2 = currentItem(B);
      if (!q2 || q.c !== q2.c || JSON.stringify(q.p) !== JSON.stringify(q2.p)) { diff++; break; }
      const a = bad.has(q.c) || g % 5 === 0 ? { idk: true } : sol(A);
      answer(A, a); answer(B, a); B = JSON.parse(JSON.stringify(B));
    }
    if (A.done && (!B.done || JSON.stringify(A.result.roots) !== JSON.stringify(B.result.roots))) diff++;
    runs++;
  }
  ok(!diff, `저장했다 이어 간 점검이 달라짐 ${diff}/${runs}단원`);
}
console.log(`엔진 시험 실패 ${f}`);
process.exit(f ? 1 : 0);
