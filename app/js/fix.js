// 판자 고치기 — 한 칸(차시)을 근거 있는 차례로(화면과 상관없는 순수 로직)
//  시범(튼튼이가 같은 숫자로 쪼개 풀며 생각 말하기) → 함께(쪼갠 단계를 아이가 채움) → 혼자(틀리면 그 문제를 단계로 나눠 어긋난 곳 찾기)
//  → 확인(새 숫자 3문제 · 도움 없음 · 판정 묶음으로 기록) — 명시적 · 체계적 지도 [B-R11][B-R12][B-R13] · 다른 문항으로 두 번째 확인 [A-R19]
//  F = { c, id, phase:'show'|'together'|'solo'|'check'|'done', ex, steps, si, solo:{ n, ok, log }, check: 묶음, R, conf, ms }
import { byId } from '../../engine/lessons/index.js';
import { workedSteps } from '../../engine/practice.js';
import { rng } from '../../engine/math.js';
import { itemOf, makeSheet, pickItems } from '../../paper/js/gen.js';
import { testable, __predict } from '../../engine/errors.js';

export const FIX = { soloNeed: 3, soloMax: 6, check: 3 };
const hash = (s) => [...String(s)].reduce((h, ch) => (Math.imul(h, 31) + ch.charCodeAt(0)) >>> 0, 7);

export function newFix({ c, id }) {
  const r = rng(hash(id + c));
  const F = { v: 1, c, id, seq: 0, phase: 'show', solo: { n: 0, ok: 0, log: [] }, R: { done: {}, it: {} }, conf: {}, ms: {}, used: [] };
  F.ex = example(F, r);
  F.steps = stepsOf(F.ex);
  F.si = 0;
  return F;
}
// 단계가 둘 이상 나오는 숫자를 고름(쪼갤 게 없으면 그냥)
function example(F, r) {
  const used = new Set(F.used);
  let best = null;
  for (let k = 0; k < 20; k++) {
    const [it] = pickItems(F.c, 1, r, used); if (!it) break;
    const st = stepsOf(it);
    if (!best || st.length > best.st.length) best = { it, st };
    if (st.length >= 2) break;
  }
  const it = best ? best.it : itemOf(F.c, byId[F.c].gen(r));
  F.used.push(JSON.stringify([it.prompt, it.choices || null]));
  return { c: F.c, p: it.p, prompt: it.prompt, sol: it.sol, choices: it.choices || null };
}
export function stepsOf(it) { try { return workedSteps(it.c, it.p).map((s) => ({ why: s.why, c: s.c, prompt: s.item.prompt, sol: s.sol, p: s.item.p })); } catch (e) { return []; } }
export const hintOf = (c) => (byId[c] && (byId[c].hint || byId[c].tip)) || '';
const nextR = (F) => rng(hash(`${F.id}:${++F.seq}`));

// 화면이 부르는 것: 시범 다음 단계 · 함께 단계 답 · 혼자 답 · 확인 답
export function showNext(F) {
  if (F.phase !== 'show') return F;
  if (F.si < F.steps.length) F.si++;
  else { F.phase = F.steps.length ? 'together' : 'solo'; startItem(F); }
  return F;
}
function startItem(F) {
  F.cur = example(F, nextR(F));
  F.curSteps = stepsOf(F.cur);
  F.si = 0; F.miss = null;
}
// 함께: 단계 칸을 하나씩 → 끝나면 원래 문제의 답 · 틀리면 맞는 답을 보여 주고 다음 단계로(같이 푸는 중이라 막지 않음)
export function togetherStep(F, vals) {
  const st = F.curSteps[F.si];
  const ok = !!st && st.sol.every((s, i) => Number(vals[i]) === Number(s));
  if (!ok && F.miss == null) F.miss = F.si;
  F.si++;
  return { ok, sol: st ? st.sol : null, why: st ? st.why : '' };
}
// 원래 문제의 답 — 함께 단계 끝 · 혼자
export function answerItem(F, vals, raws) {
  const it = itemOf(F.cur.c, F.cur.p);
  let res = null; try { res = it.check(vals, raws || vals.map(String)); } catch (e) { res = { ok: false }; }
  const ok = !!(res && res.ok);
  if (F.phase === 'together') { F.phase = 'solo'; startItem(F); return { ok, sol: it.sol, bug: res && res.bug }; }
  if (F.phase === 'solo') {
    F.solo.n++; if (ok) F.solo.ok++;
    F.solo.log.push({ ok, p: F.cur.p, a: raws });
    const out = { ok, sol: it.sol, bug: res && res.bug, steps: ok ? null : stepsOf(F.cur) };
    if (F.solo.ok >= FIX.soloNeed || F.solo.n >= FIX.soloMax) toCheck(F); else if (ok) startItem(F); else F.reStep = true;   // 틀리면 그 문제를 단계로(화면이 reStep을 보고 나눠 풀기)
    return out;
  }
  return { ok, sol: it.sol };
}
// 혼자에서 틀린 문제를 단계로 나눠 본 뒤 → 다음 문제
export function afterReStep(F) { F.reStep = false; if (F.phase === 'solo') startItem(F); return F; }
function toCheck(F) {
  F.phase = 'check';
  F.check = makeSheet({ kind: 'fix-check', words: false, id: `${F.id}-c`, lessons: [{ c: F.c, n: FIX.check }], mixed: true });
  F.check.items = F.check.items.filter((it) => it.ch !== 'END'); F.check.chapters = F.check.chapters.filter((ch) => ch.key !== 'END');
  F.ci = 0;
}
export const checkItem = (F) => (F.phase === 'check' ? F.check.items[F.ci] : null);
export function answerCheck(F, a, { conf = null, ms = 0 } = {}) {
  const it = checkItem(F); if (!it) return null;
  let ok = false;
  if (a.idk) F.R.it[it.k] = { s: 'q' };
  else { let res = null; try { res = itemOf(it.c, it.p).check(a.vals, a.raws); } catch (e) { res = null; } ok = !!(res && res.ok); F.R.it[it.k] = ok ? { s: 'ok' } : { s: 'x', a: a.raws }; }
  if (conf != null) F.conf[it.k] = conf;
  if (ms) F.ms[it.k] = ms;
  F.ci++;
  if (F.ci >= F.check.items.length) { F.check.chapters.forEach((ch) => (F.R.done[ch.key] = true)); F.phase = 'done'; F.passed = Object.values(F.R.it).filter((x) => x.s === 'ok').length === F.check.items.length; }
  return { ok };
}
// 혼자 단계에서 다시 볼 때 쓰는 현재 문제 · 시범 문제
export const currentShow = (F) => ({ ex: F.ex, steps: F.steps, si: F.si });

// 비교하기 — 맞는 풀이와 아이 같은 틀린 풀이를 나란히 놓고 '누가 맞았나 · 어디서 어긋났나'(설명이 붙을 때 효과 [E4-11][E4-13][E4-15])
//  아는 방법이 하나는 있을 때(시범 · 함께 뒤)만 [E4-16] · 아이 화면엔 오개념 이름 대신 '한 일'로 말함(꼬리표 X [E4-19])
export const KIDSAY = {
  'add.noCarry': '받아올린 1을 윗자리에 더하지 않았어요', 'add.concat': '자리마다 더한 수를 그대로 붙여 썼어요', 'add.align': '자리를 맞추지 않고 더했어요',
  'sub.big': '자리마다 큰 수에서 작은 수를 뺐어요', 'sub.noDec': '받아내린 뒤 윗자리를 1 줄이지 않았어요', 'sub.zero': '0에서 받아내릴 때 0을 9로 바꾸지 않았어요', 'sub.stopZero': '0인 자리에서 받아내리지 않고 멈췄어요',
  'mul.noCarry': '곱하고 올린 수를 더하지 않았어요', 'mul.preAdd': '올린 수를 곱하기 전에 먼저 더했어요', 'mul.noShift': '둘째 줄을 한 칸 밀어 쓰지 않았어요', 'mul.noShiftSw': '둘째 줄을 한 칸 밀어 쓰지 않았어요',
  'mul.same': '같은 자리끼리만 곱했어요', 'mul.zero': '0을 빠뜨렸어요', 'mul.addDist': '몇십에만 곱하고 몇은 그냥 더했어요',
  'div.dropZero': '몫 가운데 0을 빠뜨렸어요', 'div.underQ': '몫을 하나 작게 해서 나머지가 너무 커졌어요', 'div.dropRem': '앞자리에서 남은 수를 버리고 따로 나눴어요', 'div.swapQR': '몫과 나머지를 바꿔 썼어요',
  'fr.addDen': '분모끼리도 더했어요', 'fr.subDen': '분모끼리도 뺐어요', 'fr.keepDen': '분모를 같게 하지 않고 분자만 더했어요', 'fr.keepDenS': '분모를 같게 하지 않고 분자만 뺐어요',
  'fr.lcdNum': '분모만 바꾸고 분자는 그대로 뒀어요', 'fr.lcdNumS': '분모만 바꾸고 분자는 그대로 뒀어요', 'fr.noCarry': '분수 부분에서 넘친 1을 자연수에 더하지 않았어요',
  'fr.subBig': '분수 부분을 큰 수에서 작은 수로 뺐어요', 'fr.borrowNoDec': '자연수에서 1을 빌리고 자연수를 줄이지 않았어요', 'fr.borrow10': '빌려 온 1을 10으로 봤어요', 'fr.wholeKeep': '자연수에서 분수를 빼지 않고 붙였어요',
  'dec.alignRight': '소수점이 아니라 끝자리를 맞췄어요', 'dec.alignRightS': '소수점이 아니라 끝자리를 맞췄어요',
};
const GENERIC = ['계산은 맞는데 답을 옮겨 쓸 때 틀렸어요', '문제의 수를 잘못 읽었어요'];
// prefer = 이 아이에게 보인 원인 id들(먼저 씀) · 없으면 이 칸에서 가려낼 수 있는 틀린 방법 아무거나
export function compareOf(c, { prefer = [], seed = Date.now() } = {}) {
  const r = rng(hash(`${seed}:cmp:${c}`)), used = new Set();
  let best = null;
  for (let k = 0; k < 24 && !(best && best.mine); k++) {
    const [it] = pickItems(c, 1, r, used); if (!it || it.choices) continue;
    let ids = []; try { ids = testable(it).filter((id) => KIDSAY[id]); } catch (e) { ids = []; }
    if (!ids.length) continue;
    const preds = {}; for (const id of ids) { let v = null; try { v = __predict(it, id); } catch (e) { v = null; } if (v && JSON.stringify(v) !== JSON.stringify(it.sol)) preds[id] = v; }
    const ok = Object.keys(preds); if (!ok.length) continue;
    const mine = ok.find((id) => prefer.includes(id));
    const bug = mine || ok[0];
    const others = [...new Set(ok.filter((id) => id !== bug && KIDSAY[id] !== KIDSAY[bug] && JSON.stringify(preds[id]) !== JSON.stringify(preds[bug])).map((id) => KIDSAY[id]))];
    const reasons = [KIDSAY[bug], ...others.slice(0, 2)];
    while (reasons.length < 3) reasons.push(GENERIC[reasons.length - 1] || GENERIC[0]);
    for (let i = reasons.length - 1; i > 0; i--) { const j = Math.floor(r.next() * (i + 1)); [reasons[i], reasons[j]] = [reasons[j], reasons[i]]; }
    const cand = { it: { c, p: it.p, prompt: it.prompt, sol: it.sol }, wrong: preds[bug], bug, reasons, right: KIDSAY[bug], rightFirst: r.next() < 0.5, mine: !!mine };
    if (!best || cand.mine) best = cand;
  }
  return best;
}
