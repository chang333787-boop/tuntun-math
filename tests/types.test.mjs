// 문제 유형(틀) 시험 — 단원마다 도전 층 문제를 여러 개 만들어 본다
//   ① 만들어짐(조건에 맞는 수를 찾음) ② 정답은 정답 · 알려진 오답은 그 이름으로 틀림 ③ 같이 풀기 단계마다 정답이 정답 · 고르기는 맞는 보기 하나
//   ④ 단계를 차례로 하면 답이 나온다(마지막 계산 = 답) ⑤ 같은 seed = 같은 문제 ⑥ 글에 undefined · NaN 없음 ⑦ 쉬운 숫자(자연수)판도 같은 시험
//   ⑦+ 교육과정 규칙: 계산 단계에 뒤 단원 차시가 없고 그 단원 계산이 한 번은 나온다(curriculumOk)
//   ⑧ 같이 풀기 맨 앞 = 이야기 확인(read) · 같은 상황 고르기(struct) · 식 고르기(key)가 있다
//   ⑨ 계산 단계가 차시로 이어지는 비율(차시 문제 그대로 나오면 그 차시의 틀린 모양 · 같이 풀기를 쓴다)
//   node tests/types.test.mjs   (N=300 기본)
import { makeType, typesOfUnit, UNIT_TYPES, TYPES, plainUnit, curriculumOk } from '../engine/types/index.js';
import { byId } from '../engine/lessons/index.js';
import { toText } from '../engine/tokens.js';

const N = Number(process.env.N || 300);
const bad = [], stats = {};
const note = (m) => { if (bad.length < 30) bad.push(m); };
function okAnswer(it) {
  if (it.choices) return it.check([it.sol[0]]).ok;
  return it.check(it.sol.map(Number), it.sol.map(String)).ok;
}
function wrongAnswer(it) {
  if (it.choices) return !it.check([(it.sol[0] + 1) % it.choices.length]).ok;
  return !it.check(it.sol.map((x) => Number(x) + 977), it.sol.map((x) => String(Number(x) + 977))).ok;
}
function one(t, u, seed, easy) {
  const where = `${u} ${t} #${seed}${easy ? ' (쉬운)' : ''}`;
  let a, b2;
  try { a = makeType(t, u, seed, { easy }); } catch (e) { note(`${where} 만들기 실패: ${e.message}`); return null; }
  try { b2 = makeType(t, u, seed, { easy }); } catch (e) { note(`${where} 두 번째 만들기 실패`); return null; }
  const text = toText(a.story);
  if (text !== toText(b2.story)) note(`${where} 같은 seed 인데 글이 다름`);
  if (/undefined|NaN|null|\[object/.test(text + a.ans + a.steps.map((s) => s.why + toText(s.item.prompt) + (s.item.choices || []).map(toText).join('/')).join(' '))) note(`${where} 글에 이상한 값: ${text}`);
  if (/[\d/.](을를|를을|이가|가이|은는|는은|과와|와과)/.test(text)) note(`${where} 조사 겹침: ${text}`);
  if (!okAnswer(a.item)) note(`${where} 정답이 틀림 — ${a.ans}`);
  if (!wrongAnswer(a.item)) note(`${where} 엉뚱한 답이 맞음`);
  if (!a.steps[0] || !a.steps[0].read || !a.steps[1] || !a.steps[1].struct) note(`${where} 진단 사다리 앞 두 칸(이야기 확인 · 같은 상황)이 없음`);
  if (a.steps.filter((s) => s.key).length < 1) note(`${where} 식 고르기(key) 단계가 없음`);
  if (!easy && !curriculumOk(a, u)) note(`${where} 교육과정 규칙 어김 — 뒤 단원 차시가 나오거나 그 단원 계산이 없음: ${a.steps.filter((s) => s.c).map((s) => s.c).join(' ')}`);
  const st = (stats[`${u} ${t}`] = stats[`${u} ${t}`] || { n: 0, calc: 0, mapped: 0, own: 0 });
  st.n++;
  let lastCalc = null;
  a.steps.forEach((s, i) => {
    if (!s || !s.item) { note(`${where} 단계 ${i + 1} 없음`); return; }
    if (!okAnswer(s.item)) note(`${where} 단계 ${i + 1} 정답이 틀림 (${s.why})`);
    if (s.kind === 'pick') {
      const ch = s.item.choices.map((c) => toText(c));
      if (new Set(ch).size !== ch.length) note(`${where} 단계 ${i + 1} 보기가 겹침 ${ch.join(' / ')}`);
      if (ch.length < 2) note(`${where} 단계 ${i + 1} 보기가 하나`);
      if (!wrongAnswer(s.item)) note(`${where} 단계 ${i + 1} 틀린 보기가 맞음`);
    } else {
      st.calc++;
      if (s.c && !byId[s.c]) note(`${where} 단계 ${i + 1} 없는 차시 ${s.c}`);
      if (s.c) st.mapped++;
      if (s.c && s.item && s.item.c !== s.c) st.own++;
      lastCalc = s;
    }
  });
  // 마지막 계산 단계의 답 = 문제의 답(고르기로 끝나는 틀 — 간격 세기 · □ 범위 — 은 마지막 고르기의 맞는 보기 = 답)
  const lastStep = a.steps[a.steps.length - 1];
  if (lastStep.kind === 'calc') {
    if (lastStep.z && Math.abs(lastStep.z.n / lastStep.z.d - a.x.n / a.x.d) > 1e-9) note(`${where} 마지막 계산(${toText(lastStep.item.prompt)}) ≠ 답 ${a.ans}`);
  } else {
    const right = toText(lastStep.item.choices[lastStep.item.sol[0]]).replace(/[^\d./ ]/g, '').trim();
    if (Number(right) !== a.x.n / a.x.d) note(`${where} 마지막 고르기(${right}) ≠ 답 ${a.ans}`);
  }
  // 알려진 오답: 그 값으로 답하면 틀리고 이름이 나온다
  for (const bg of a.item.bugList || []) {
    const v = bg.x.n / bg.x.d, it = a.item;
    let vals;
    if (it.sol.length === 1) vals = [v];
    else if (it.sol.length === 2) vals = [bg.x.n, bg.x.d];
    else { const w = Math.floor(bg.x.n / bg.x.d); vals = [w, bg.x.n - w * bg.x.d, bg.x.d]; }
    const res = it.check(vals, vals.map(String));
    if (res.ok) note(`${where} 오답 '${bg.name}'(${vals.join(' ')})이 정답으로 채점됨`);
    else if (!res.bug || res.bug.name !== bg.name) { if (it.sol.length !== 3 || vals[1] < vals[2]) note(`${where} 오답 '${bg.name}'(${vals.join(' ')})의 이름이 안 나옴 → ${res.bug ? res.bug.name : '없음'}`); }
  }
  return a;
}

let total = 0;
for (const u of Object.keys(UNIT_TYPES)) {
  for (const t of typesOfUnit(u)) {
    for (let s = 1; s <= N; s++) { one(t, u, s * 7919 + 13, false); total++; }
    if (!plainUnit(t, u)) for (let s = 1; s <= Math.ceil(N / 3); s++) { one(t, u, s * 104729 + 7, true); total++; }
  }
}
// 단원 목록 · 틀 목록이 서로 맞는가
for (const [u, ts] of Object.entries(UNIT_TYPES)) for (const t of ts) if (!TYPES[t] || !TYPES[t].units[u]) note(`목록: ${u} 에 ${t} 숫자 영역이 없음`);
for (const [t, T] of Object.entries(TYPES)) for (const u of Object.keys(T.units)) if (!(UNIT_TYPES[u] || []).includes(t)) note(`목록: ${t} 의 ${u} 가 단원 목록에 없음`);

const rows = Object.entries(stats).map(([k, v]) => `${k.padEnd(11)} 계산 ${String(v.calc).padStart(4)} · 차시로 이어짐 ${Math.round(100 * v.mapped / Math.max(1, v.calc))}%`);
if (process.env.V) console.log(rows.join('\n'));
const low = Object.entries(stats).filter(([, v]) => v.calc && v.mapped / v.calc < 0.6).map(([k, v]) => `${k} ${Math.round(100 * v.mapped / v.calc)}%`);
if (low.length) bad.push(`계산 단계가 차시로 잘 안 이어짐(60% 미만): ${low.join(', ')}`);
for (const m of bad) console.log('FAIL', m);
console.log(`문제 유형 시험 — 문제 ${total}개 · 단원×틀 ${Object.keys(stats).length}가지 · ${bad.length ? 'FAIL ' + bad.length : 'PASS'}`);
process.exit(bad.length ? 1 : 0);
