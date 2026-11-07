// 배우기(옛 이름 판자 고치기) — 한 칸(차시)을 차례로(화면과 상관없는 순수 로직)
//  시범(튼튼이가 그 문제의 숫자로 풀며 생각 말하기) → 함께 → 혼자(틀리면 다음에 할 한 가지) → 확인(새 숫자 3문제 · 도움 없음 · 판정 묶음으로 기록)
//    함께 = 쪼갤 단계가 있는 칸은 단계 빈칸을 아이가 채움 · 단계가 없는 칸(229칸 중 약 1/3)은 튼튼이가 일부를 해 줌(assistOf):
//      빈칸 여럿 → 앞 빈칸은 튼튼이가 채우고 마지막 하나만 아이 · 보기 → 답이 아닌 보기를 지워 둘 중에서 · 빈칸 하나 → 그 문제 숫자로 첫 생각만 말해 줌
//    시범 → 안내된 연습 → 혼자의 차례는 명시적 · 체계적 지도를 따른 것 [B-R11][B-R12][B-R13] — 그 연구의 효과 크기를 이 화면이 낸다는 뜻은 아님
//    다른 문항으로 두 번째 확인 [A-R19]
//  혼자에서 세 번 내리 틀리면 '함께'로 한 번 돌아가고, 또 세 번이면 확인 없이 '선생님과 같이'로 끝(아홉 번 내리 틀리게 두지 않음 — 혹평 11-01)
//  F = { c, id, phase:'show'|'together'|'solo'|'check'|'done', ex, steps, si, cur, curSteps, assist, solo:{ n, ok, run, log }, back, help, check: 묶음, R, conf, ms }
import { byId } from '../../engine/lessons/index.js';
import { workedSteps } from '../../engine/practice.js';
import { rng } from '../../engine/math.js';
import { itemOf, makeSheet, pickItems } from '../../paper/js/gen.js';
import { testable, __predict, readExpr } from '../../engine/errors.js';
import { toText, blankCount } from '../../engine/tokens.js';
import { P } from '../../engine/concepts/kit.js';

export const FIX = { soloNeed: 3, soloMax: 6, check: 3, miss: 3 };   // 혼자 셋 맞히면 확인 · 여섯 문제까지 · 세 번 내리 틀리면 함께로(한 번) → 또 세 번이면 선생님과
const hash = (s) => [...String(s)].reduce((h, ch) => (Math.imul(h, 31) + ch.charCodeAt(0)) >>> 0, 7);

export function newFix({ c, id }) {
  const r = rng(hash(id + c));
  const F = { v: 1, c, id, seq: 0, phase: 'show', solo: { n: 0, ok: 0, run: 0, log: [] }, back: 0, help: false, R: { done: {}, it: {} }, conf: {}, ms: {}, used: [] };
  F.ex = example(F, r);
  F.steps = stepsOf(F.ex);
  F.si = 0;
  return F;
}
// 단계가 둘 이상 나오는 숫자를 고름(쪼갤 게 없으면 그냥)
//  시범은 보통 꼴로 — 답의 맨 앞자리가 0이 되거나(93 − 89 = 4) 자리가 하나 늘어나는(95 + 7 = 102) 덧셈 · 뺄셈은 배울 것이 둘이라 피함(11-07 처음 보는 눈)
const odd = (it) => { const m = toText(it.prompt).match(/^(\d+) ([+−]) (\d+) = □$/); return !!m && String(it.sol[0]).length !== Math.max(m[1].length, m[3].length); };
function example(F, r) {
  const used = new Set(F.used);
  let best = null;
  for (let k = 0; k < 20; k++) {
    const [it] = pickItems(F.c, 1, r, used); if (!it) break;
    const st = stepsOf(it), sc = Math.min(st.length, 2) * 2 - (odd(it) ? 1 : 0);
    if (!best || sc > best.sc) best = { it, st, sc };
    if (sc >= 4) break;
  }
  const it = best ? best.it : itemOf(F.c, byId[F.c].gen(r));
  F.used.push(JSON.stringify([it.prompt, it.choices || null]));
  return { c: F.c, p: it.p, prompt: it.prompt, sol: it.sol, choices: it.choices || null };
}
export function stepsOf(it) { try { return workedSteps(it.c, it.p).map((s) => ({ why: s.why, c: s.c, prompt: s.item.prompt, sol: s.sol, p: s.item.p })); } catch (e) { return []; } }
export const hintOf = (c) => (byId[c] && (byId[c].hint || byId[c].tip)) || '';
// 판자를 이름 대신 예시 문제로 부르기('10에서 빼기' 대신 '10 − 6 = □ 같은 문제' · 낮은 학년 이름이 크게 보이지 않게 · 혹평 11-01)
//  같은 칸은 늘 같은 예(씨앗 고정) · 짧고 그림 없는 것 · 34자를 넘거나 그림뿐이면 '' (부르는 쪽이 이름으로)
const EXC = {};
export function exampleOf(c) {
  if (c in EXC) return EXC[c];
  let best = null;
  for (let k = 0; k < 12 && byId[c]; k++) {
    let it = null; try { [it] = pickItems(c, 1, rng(hash(`ex:${c}:${k}`)), new Set()); } catch (e) { it = null; }
    if (!it) continue;
    const t = toText(it.prompt) + (it.choices ? ` (${it.choices.map((ch) => toText(ch)).join(' · ')})` : ''), sc = t.length + (t.includes('[그림]') ? 60 : 0);
    if (!best || sc < best.sc) best = { t, sc };
  }
  return (EXC[c] = best && best.t.length <= 34 && !best.t.includes('[그림]') ? best.t : '');
}

// ── 그 문제의 숫자로 말하기(시범 · 함께 · 틀린 뒤) ──
//  ruleFor: 차시 힌트에서 '방법' 문장만 — 이 문제와 다른 숫자로 든 예(3씩 4묶음은 … · 한 명이 4개씩 …)는 뺌(시범 문제와 따로 놀지 않게 · 혹평 11-01)
//    남기는 문장 = 숫자가 뜻을 말하는 수(0 · 1 · 2 · 10 · 100 · 1000 · 10000 · 0.1 · 0.01 · 0.001)뿐 · '○씩 · ○배 · ○단'은 이 문제 글에 같은 말이 있을 때만
//    noAns = 이 문제의 답 수가 든 문장도 뺌(함께 · 틀린 뒤에 답을 미리 알려 주지 않게)
const KEEPN = new Set(['0', '1', '2', '10', '100', '1000', '10000', '0.1', '0.01', '0.001']);
const NUM = /\d+(?:\.\d+)?(?:만|억|조)?(?:씩|배|단)?/g;
const KNUM = /[일이삼사오육칠팔구십백천]{2,}|스물|서른|마흔|쉰|예순|일흔|여든|아흔/g;   /* 수를 읽는 말(삼십 · 서른 · 사백육) — 이 문제에 없는 수를 읽어 주면 따로 놂 */
//    그림 · 기호를 말하는 문장('그림의 한 줄은 …' · '0에서 ▼까지 …')은 이 문제에 그림 · 그 기호가 있을 때만
export function ruleFor(c, it, { noAns = false } = {}) {
  const h = hintOf(c); if (!h || !it) return '';
  const txt = toText(it.prompt), pic = txt.includes('[그림]'), ans = new Set((it.sol || []).map(String).filter((v) => !KEEPN.has(v)));
  const keep = (x) => (x.match(NUM) || []).every((t) => (/[씩배단]$/.test(t) ? txt.includes(t) : KEEPN.has(t)) && !(noAns && ans.has(t))) && (x.match(KNUM) || []).every((w) => txt.includes(w))
    && (pic || !x.includes('그림')) && [...(x.match(/[▼●○]/g) || [])].every((ch) => txt.includes(ch));
  return h.split(/(?<=[.!?])\s+/).map((x) => x.trim()).filter((x) => x && keep(x)).join(' ');
}
// 수 늘어놓기(5, 10, □, □ · □, 617, 627 … · 7451만, 6451만, □만)에서 빈칸 i — 같은 수씩 커지거나 작아지면 '○씩 커져요. 10 다음은 15'
//  빈칸은 글자 □와 헷갈리지 않게 표지(§번호)로 바꿔 읽음
function seqOf(it) {
  const nb = blankCount(it.prompt), t = toText(it.prompt, Array.from({ length: nb }, (_, i) => `§${i}`));
  const m = t.match(/(?:(?:-?\d+|§\d+)(?:만|억|조)?\s*,\s*){2,}(?:-?\d+|§\d+)(?:만|억|조)?/);
  if (!m) return null;
  const raw = m[0].split(',').map((x) => x.trim()), units = new Set(raw.map((x) => (x.match(/(만|억|조)$/) || [''])[0]));
  if (units.size > 1) return null;   /* 7451만, …, □만, □처럼 단위가 섞이면 말하지 않음 */
  const u = [...units][0], xs = raw.map((x) => x.replace(/(만|억|조)$/, '')), known = xs.map((x, i) => [i, x.startsWith('§') ? null : Number(x)]).filter(([, v]) => v != null);
  if (known.length < 2) return null;
  const [i0, v0] = known[0], [i1, v1] = known[1], d = (v1 - v0) / (i1 - i0);
  if (!d || !Number.isInteger(d) || known.some(([i, v]) => v !== v0 + d * (i - i0))) return null;
  return { xs, d, v0, i0, u };
}
//  full = 시범(값까지) · 아니면 함께(값은 아이가)
export function blankTalk(it, i, full = true) {
  const S = seqOf(it); if (!S) return '';
  const pos = S.xs.indexOf(`§${i}`); if (pos < 0) return '';
  const u = S.u, v = S.v0 + S.d * (pos - S.i0), up = S.d > 0, step = Math.abs(S.d), how = `${step}${u}씩 ${up ? '커져요' : '작아져요'}.`;
  if (pos > 0) { const p = S.v0 + S.d * (pos - 1 - S.i0); return full ? `${how} ${p}${u} 다음은 ${v}${u}.` : `${how} ${p}${u} 다음은 얼마일까요?`; }
  const n = S.v0 + S.d * (1 - S.i0); return full ? `${how} ${n}${u}보다 ${step}${u}만큼 ${up ? '작은' : '큰'} 수는 ${v}${u}.` : `${how} ${n}${u}보다 ${step}${u}만큼 ${up ? '작은' : '큰'} 수를 찾아요.`;
}
// 한 자리 셈 사실 — 이어 세기 · 뛰어 세기 · 곱셈으로 몫 찾기(full = 시범 · 답까지 / 아니면 첫 생각만)
const upto = (a, n, d = 1) => Array.from({ length: n }, (_, k) => a + d * (k + 1));
//  이어 세기 · 거꾸로 세기 말은 그 칸이 다른 방법을 가르칠 때 끔 — 1-2-6(10을 만들어 더하기 · 10에서 빼기)과 쪼갤 단계가 있는 칸(32 + 5 = 낱개끼리 더하기)
//    단계의 방법과 부딪히는 말을 시범 · 틀린 뒤에 하지 않게(혹평 11-01 · 8 + 5에 '9, 10, 11, 12, 13' X)
const noCount = (it) => { if (!it || !it.c) return false; if (/^1-2-6:/.test(it.c)) return true; try { return !!(it.p && workedSteps(it.c, it.p).length); } catch (e) { return false; } };
export function factTalk(it, full = true) {
  let X = null; try { X = readExpr(it); } catch (e) { X = null; }
  if (!X || X.st !== 'W') return '';
  const A = X.A.i, B = X.B.i;
  if (![A, B].every(Number.isInteger)) return '';
  if (X.op === '+' && Math.min(A, B) <= 9 && A + B <= 20) {
    const big = Math.max(A, B), sm = Math.min(A, B);
    if (!sm) return '0을 더하면 그대로예요.';
    if (sm === 1) return full ? `${big}보다 1만큼 더 큰 수는 ${big + 1}.` : `${big}보다 1만큼 더 큰 수를 생각해요.`;
    if (noCount(it)) return '';
    return full ? `큰 수 ${big}에서 시작해 ${sm}만큼 이어 세어요: ${upto(big, sm).join(', ')} → ${A + B}.` : `큰 수 ${big}에서 시작해 ${sm}만큼 이어 세어 봐요: ${upto(big, Math.min(2, sm - 1)).join(', ')}, …`;
  }
  if (X.op === '−' && A <= 20 && A - B >= 0 && A - B <= 9) {
    if (!B) return '0을 빼면 그대로예요.';
    if (A === B) return '같은 수를 빼면 0이에요.';
    if (B === 1) return full ? `${A}보다 1만큼 더 작은 수는 ${A - 1}.` : `${A}보다 1만큼 더 작은 수를 생각해요.`;
    if (noCount(it)) return '';
    if (B <= 5) return full ? `${A}에서 ${B}만큼 거꾸로 세어요: ${upto(A, B, -1).join(', ')} → ${A - B}.` : `${A}에서 ${B}만큼 거꾸로 세어 봐요: ${upto(A, Math.min(2, B - 1), -1).join(', ')}, …`;
    if (A - B === 1) return full ? `${B}에서 한 번만 더 세면 ${A}${P(A, '이에요', '예요')} → 1.` : `${B}에서 ${A}까지 몇 번 더 세면 되는지 봐요.`;
    return full ? `${B}에서 ${A}까지 몇 번 더 세면 되는지 봐요: ${upto(B, A - B).join(', ')} → ${A - B}번.` : `${B}에서 ${A}까지 이어 세어 봐요: ${upto(B, Math.min(2, A - B - 1)).join(', ')}, …`;
  }
  if (X.op === '×' && A <= 10 && B <= 10) {
    if (!A || !B) return '0이 있으면 곱은 0이에요.';
    if (A === 1 || B === 1) return `1을 곱하면 그대로예요. ${A} × ${B} = ${A * B}.`;
    return full ? `${A}씩 ${B}번 뛰어 세어요: ${upto(0, B, A).join(', ')} → ${A * B}.` : `${A}씩 ${B}번 뛰어 세어 봐요: ${upto(0, Math.min(2, B - 1), A).join(', ')}, …`;
  }
  if (X.op === '÷' && X.intQ && B <= 10 && A / B <= 10 && Number.isInteger(A / B)) {
    return full ? `${B} × □ = ${A}${P(A, '이', '가')} 되는 □를 찾아요. ${B} × ${A / B} = ${A}.` : `${B} × □ = ${A}${P(A, '이', '가')} 되는 □를 찾아 봐요.`;
  }
  return '';
}
// 세기 칸(1부터 9까지 세기 · 읽기) — 점 그림은 하나씩 짚으며 세기 · 수 이름('일곱' · '칠')은 하나, 둘, … 차례로 세기
const NAT = ['', '하나', '둘', '셋', '넷', '다섯', '여섯', '일곱', '여덟', '아홉'], SIN = ['', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구'];
export function countTalk(it, full = true) {
  const L = it && it.c && byId[it.c], p = it && it.p;
  if (!L || L.fam !== 'N1' || !p || !Number.isInteger(p.n) || p.n < 1 || p.n > 9) return '';
  const n = p.n, seq = (W, k) => W.slice(1, k + 1).join(', ');
  if (p.v === 'nat' || p.v === 'sin') { const W = p.v === 'nat' ? NAT : SIN; return full ? `${seq(W, n)} — 차례로 세면 ${n}번째 말이라 ${n}${P(n, '이에요', '예요')}.` : `${seq(W, Math.min(3, n))} …처럼 차례로 세어 봐요.`; }
  if (p.v !== 'dots' && !toText(it.prompt).includes('[그림]')) return '';
  return full ? `하나씩 짚으며 세어요: ${Array.from({ length: n }, (_, k) => k + 1).join(', ')} → ${n}개.` : `하나씩 짚으며 세어 봐요: ${Array.from({ length: Math.min(2, n) }, (_, k) => k + 1).join(', ')}, …`;
}
// 시범에서 튼튼이가 하는 말 — 단계가 없는 칸: 셈 사실 말 → 방법 한 줄(이 문제 숫자만)
//  이 문제 숫자로 할 말이 없으면 차시 힌트를 '다른 숫자로 든 예'라고 밝혀 그대로(이 문제의 답 수가 들어 있으면 X)
export function otherEx(c, it) {
  const h = hintOf(c), ans = (it.sol || []).map(String).filter((v) => !KEEPN.has(v));
  return h && !(h.match(NUM) || []).some((t) => ans.includes(t)) ? `다른 숫자로 든 예: ${h}` : '';
}
//  빈칸이 하나인 수 늘어놓기(4, 5, 6, 7, □)는 그 빈칸 말도 — 빈칸이 둘 이상이면 화면(kid.js)이 빈칸마다 붙임 · 수 이름 문항은 세기 말만(점 세기 방법 X)
export const showTalk = (F) => {
  const ex = { ...F.ex, c: F.ex.c || F.c }, nb = ex.choices ? 0 : blankCount(ex.prompt), ct = countTalk(ex, true);
  if (ct && ex.p && (ex.p.v === 'nat' || ex.p.v === 'sin')) return [ct];
  const t = [factTalk(ex, true) || ct || (nb === 1 ? blankTalk(ex, 0, true) : ''), ruleFor(F.c, ex)].filter(Boolean);
  return t.length ? t : [otherEx(F.c, ex)].filter(Boolean);
};
export function talkOf(it, c) {
  const x = it && !it.c ? { ...it, c } : it, ct = countTalk(x, false);
  if (ct && x.p && (x.p.v === 'nat' || x.p.v === 'sin')) return [ct];
  const t = [factTalk(x, false) || ct || (x.choices ? '' : blankTalk(x, blankCount(x.prompt) - 1, false)), ruleFor(c, x, { noAns: true })].filter(Boolean);
  return t.length ? t : [otherEx(c, x)].filter(Boolean);
}
// 단계 답은 다 맞았는데 합친 답이 틀렸을 때 — 그 셈에 맞는 말(뺄셈에 '받아올림'이라 하지 않게)
export function mergeTip(it) {
  let X = null; try { X = readExpr(it); } catch (e) { X = null; }
  const w = X && { '+': '자리 · 받아올림', '−': '자리 · 받아내림', '×': '자리 · 올림', '÷': '몫의 자리 · 나머지' }[X.op];
  return w ? `단계 답을 합쳐 쓸 때(${w})를 한 번 더 살펴요.` : '단계 답을 합쳐 쓸 때를 한 번 더 살펴요.';
}
const nextR = (F) => rng(hash(`${F.id}:${++F.seq}`));

// 화면이 부르는 것: 시범 다음 단계 · 함께 단계 답 · 혼자 답 · 확인 답
// 시범에서 보일 차례 수 — 단계가 있으면 단계마다 · 없으면 빈칸마다 하나씩(보기 문항은 한 번)
export const showLen = (F) => F.steps.length || (F.ex.choices ? 1 : Math.max(1, blankCount(F.ex.prompt)));
export function showNext(F) {
  if (F.phase !== 'show') return F;
  if (F.si < showLen(F)) F.si++;
  else { F.phase = 'together'; startItem(F); }
  return F;
}
// 이어서 하기 — 도중에 나갔다 오면 그 걸음부터(시범을 또 보지 않게 · 11-07 사용감 점검 '배우기 도중 나가면 처음부터') · 같은 id면 시범 문제가 같음
export function jumpTo(F, phase) {
  if (phase === 'together' || phase === 'solo') { F.si = showLen(F); F.phase = phase; startItem(F); }
  else if (phase === 'check') toCheck(F);
  return F;
}
function startItem(F) {
  F.cur = example(F, nextR(F));
  F.curSteps = stepsOf(F.cur);
  F.si = 0; F.miss = null;
  F.assist = F.phase === 'together' && !F.curSteps.length ? assistOf(F.cur, F.c, nextR(F)) : null;
}
// 단계가 없는 칸의 '함께' — 튼튼이가 일부를 해 주고 아이는 한 곳만
//  { kind:'given', given:{ 빈칸: 값 }, say:[…] } · { kind:'pick', hide:[보기 번호] } · { kind:'start', say:[…] }
export function assistOf(it, c, r = rng(1)) {
  if (it.choices && it.choices.length >= 3) {
    const s = Number(it.sol[0]), wrong = it.choices.map((_, k) => k).filter((k) => k !== s), keep = wrong[Math.floor(r.next() * wrong.length)];
    return { kind: 'pick', hide: wrong.filter((k) => k !== keep), say: [ruleFor(c, it, { noAns: true })].filter(Boolean) };
  }
  const nb = it.choices ? 0 : blankCount(it.prompt), last = it.sol ? String(it.sol[nb - 1]) : '';
  if (nb >= 2 && !it.sol.slice(0, nb - 1).some((v) => String(v) === last)) {   /* 앞 빈칸 답이 마지막 답과 같으면 베끼기가 되니 X */
    const given = {}; for (let i = 0; i < nb - 1; i++) given[i] = it.sol[i];
    const say = [...Object.keys(given).map((i) => blankTalk(it, Number(i))), blankTalk(it, nb - 1, false)].filter(Boolean);
    return { kind: 'given', given, say: say.length ? say : [ruleFor(c, it, { noAns: true })].filter(Boolean) };
  }
  return { kind: 'start', say: talkOf(it, c).slice(0, 1) };
}
// 함께: 단계 칸을 하나씩 → 끝나면 원래 문제의 답 · 틀리면 맞는 답을 보여 주고 다음 단계로(같이 푸는 중이라 막지 않음)
export function togetherStep(F, vals) {
  const st = F.curSteps[F.si];
  const ok = !!st && st.sol.every((s, i) => Number(vals[i]) === Number(s));
  if (!ok && F.miss == null) F.miss = F.si;
  if (!ok && st && !F.tw) { F.tw = 1; return { ok, retry: true, sol: st.sol, why: st.why }; }   /* 같이 풀기는 처음 틀리면 한 번 더 써 봄 — 바로 답을 보이면 아이가 맞는 답을 한 번도 안 씀(처음 보는 눈 11-08) */
  F.tw = 0; F.si++;
  return { ok, sol: st ? st.sol : null, why: st ? st.why : '' };
}
// 원래 문제의 답 — 함께 단계 끝 · 혼자
export function answerItem(F, vals, raws) {
  const it = itemOf(F.cur.c, F.cur.p);
  let res = null; try { res = it.check(vals, raws || vals.map(String)); } catch (e) { res = { ok: false }; }
  const ok = !!(res && res.ok);
  if (F.phase === 'together') { F.phase = 'solo'; startItem(F); return { ok, sol: it.sol, bug: res && res.bug }; }
  if (F.phase === 'solo') {
    F.solo.n++; if (ok) { F.solo.ok++; F.solo.run = 0; } else F.solo.run++;
    F.solo.log.push({ ok, p: F.cur.p, a: raws });
    const steps = ok ? null : stepsOf(F.cur);
    const out = { ok, sol: it.sol, bug: res && res.bug, steps: steps && steps.length ? steps : null };
    if (F.solo.ok >= FIX.soloNeed) toCheck(F);
    else if (F.solo.run >= FIX.miss && !F.back) { F.back = 1; F.solo.run = 0; F.phase = 'together'; startItem(F); out.back = true; }   // 세 번 내리 틀림 → 한 번 더 같이
    else if (F.solo.run >= FIX.miss || (F.solo.n >= FIX.soloMax && F.solo.ok <= 1)) { toHelp(F); out.help = true; }   // 또 세 번(또는 여섯 중 하나뿐) → 확인 없이 선생님과
    else if (F.solo.n >= FIX.soloMax) toCheck(F);
    else if (ok || !out.steps) startItem(F);
    else F.reStep = true;   // 틀리면 그 문제를 단계로(화면이 reStep을 보고 나눠 풀기) — 단계가 없는 칸은 나누지 않음
    return out;
  }
  return { ok, sol: it.sol };
}
// 혼자에서 틀린 문제를 단계로 나눠 본 뒤 → 다음 문제
export function afterReStep(F) { F.reStep = false; if (F.phase === 'solo') startItem(F); return F; }
function toHelp(F) { F.phase = 'done'; F.help = true; F.passed = false; F.check = null; }
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
  if (F.ci >= F.check.items.length) {
    const okN = Object.values(F.R.it).filter((x) => x.s === 'ok').length, n = F.check.items.length;
    /* 확인 2/3이면 새 숫자 한 문제 더 — 맞히면 통과(한 문제 실수로 '선생님과 같이'가 너무 쉽게 붙던 것 · 11-07 사용감 점검 [A-R19]) */
    if (!F.extra && n === FIX.check && okN === n - 1) {
      const more = makeSheet({ kind: 'fix-check', words: false, id: `${F.id}-c2`, lessons: [{ c: F.c, n: 1 }], mixed: true });
      const it2 = more.items.find((x) => x.ch !== 'END');
      if (it2) { F.extra = 1; it2.k = Math.max(...F.check.items.map((x) => x.k)) + 1; it2.ch = F.check.items[0].ch; F.check.items.push(it2); const chp = F.check.chapters.find((c) => c.key === it2.ch); if (chp) chp.ks.push(it2.k); return { ok }; }
    }
    F.check.chapters.forEach((ch) => (F.R.done[ch.key] = true)); F.phase = 'done'; F.passed = okN === n || (!!F.extra && okN === n - 1);
  }
  return { ok };
}
// 혼자 단계에서 다시 볼 때 쓰는 현재 문제 · 시범 문제
export const currentShow = (F) => ({ ex: F.ex, steps: F.steps, si: F.si });

// 비교하기 — 맞는 풀이와 아이 같은 틀린 풀이를 나란히 놓고 '누가 맞았나 · 어디서 어긋났나'(설명이 붙을 때 효과 [E4-11][E4-13][E4-15])
//  아는 방법이 하나는 있을 때(시범 · 함께 뒤)만 [E4-16] · 아이 화면엔 오개념 이름 대신 '한 일'로 말함(꼬리표 X [E4-19])
export const KIDSAY = {
  'add.noCarry': '올린 1을 다음 자리에 더하지 않았어요', 'add.concat': '자리마다 더한 수를 그대로 붙여 썼어요', 'add.align': '자리를 맞추지 않고 더했어요',
  'sub.big': '자리마다 큰 수에서 작은 수를 뺐어요', 'sub.noDec': '10을 내준 자리를 1 줄이지 않았어요', 'sub.zero': '0인 자리를 지나 가져올 때 0을 9로 바꾸지 않았어요', 'sub.stopZero': '0인 자리에서 더 위 자리로 가서 가져오지 않고 멈췄어요',
  'mul.noCarry': '곱하고 올린 수를 더하지 않았어요', 'mul.preAdd': '올린 수를 곱하기 전에 먼저 더했어요', 'mul.noShift': '둘째 줄을 한 칸 밀어 쓰지 않았어요', 'mul.noShiftSw': '둘째 줄을 한 칸 밀어 쓰지 않았어요',
  'mul.same': '같은 자리끼리만 곱했어요', 'mul.zero': '0을 빠뜨렸어요', 'mul.addDist': '몇십에만 곱하고 몇은 그냥 더했어요',
  'div.dropZero': '몫 가운데 0을 빠뜨렸어요', 'div.underQ': '몫을 하나 작게 해서 나머지가 너무 커졌어요', 'div.dropRem': '앞자리에서 남은 수를 버리고 따로 나눴어요', 'div.swapQR': '몫과 나머지를 바꿔 썼어요',
  'fr.addDen': '분모끼리도 더했어요', 'fr.subDen': '분모끼리도 뺐어요', 'fr.keepDen': '분모를 같게 하지 않고 분자만 더했어요', 'fr.keepDenS': '분모를 같게 하지 않고 분자만 뺐어요',
  'fr.lcdNum': '분모만 바꾸고 분자는 그대로 뒀어요', 'fr.lcdNumS': '분모만 바꾸고 분자는 그대로 뒀어요', 'fr.noCarry': '분수 부분에서 넘친 1을 자연수에 더하지 않았어요',
  'fr.subBig': '분수 부분을 큰 수에서 작은 수로 뺐어요', 'fr.borrowNoDec': '자연수에서 1을 빌리고 자연수를 줄이지 않았어요', 'fr.borrow10': '빌려 온 1을 10으로 봤어요', 'fr.wholeKeep': '자연수에서 분수를 빼지 않고 붙였어요',
  'dec.alignRight': '소수점이 아니라 끝자리를 맞췄어요', 'dec.alignRightS': '소수점이 아니라 끝자리를 맞췄어요',
};
const GENERIC = ['계산은 맞는데 답을 옮겨 쓸 때 틀렸어요', '문제의 수를 잘못 읽었어요'];
// 틀린 풀이를 아이가 쓸 법한 꼴로 보일 수 있나 — 대분수 칸에 자연수 부분 0(0 5/8) · 분수 부분 0(4 0/5) · 분수 부분이 1과 같거나 큼(4 4/4) · 분모 0은 X(혹평 11-01)
//  보일 수 없는 틀린 방법은 고르지 않음 — 이 칸에 보일 만한 틀린 풀이가 하나도 없으면(5-1-5:3) 비교하기를 건너뜀
// 대분수 빈칸에 자연수 부분이 0인 틀린 답 → 그냥 분수로 보이게(0 5/8 X · 5/8) · 친구가 쓴 답 글(1 9/35 · 5/8 · 12, 3)
function plainFrac(prompt, v) {
  const blank = (x) => x && typeof x === 'object' && 'b' in x;
  let hit = false;
  const out = (prompt || []).map((t) => { if (t && typeof t === 'object' && 'm' in t && t.m.every(blank) && Number(v[t.m[0].b]) === 0 && Number(v[t.m[1].b]) >= 1) { hit = true; return { f: [t.m[1], t.m[2]] }; } return t; });
  return hit ? out : null;
}
export function answerText(prompt, v) {
  const blank = (x) => x && typeof x === 'object' && 'b' in x;
  for (const t of prompt || []) {
    if (t && typeof t === 'object' && 'm' in t && t.m.every(blank)) { const [w, n, d] = t.m.map((x) => v[x.b]); return `${Number(w) ? `${w} ` : ''}${n}/${d}`; }
    if (t && typeof t === 'object' && 'f' in t && t.f.every(blank)) { const [n, d] = t.f.map((x) => v[x.b]); return `${n}/${d}`; }
  }
  return (v || []).join(', ');
}
function showable(prompt, v) {
  const val = (x) => (x && typeof x === 'object' && 'b' in x ? Number(v[x.b]) : Number(x)), blank = (x) => x && typeof x === 'object' && 'b' in x;
  for (const t of prompt || []) {
    if (!t || typeof t !== 'object') continue;
    if ('m' in t && t.m.some(blank)) { const [w, n, d] = t.m.map(val); if (!(w >= 1) || !(n >= 1) || !(d > n)) return false; }
    if ('f' in t && t.f.some(blank)) { const [, d] = t.f.map(val); if (!(d > 0)) return false; }
  }
  return v.every((x) => x == null || Number.isFinite(Number(x)));
}
// prefer = 이 아이에게 보인 원인 id들(먼저 씀) · 없으면 이 칸에서 가려낼 수 있는 틀린 방법 아무거나
export function compareOf(c, { prefer = [], seed = Date.now() } = {}) {
  const r = rng(hash(`${seed}:cmp:${c}`)), used = new Set();
  let best = null;
  for (let k = 0; k < 24 && !(best && best.mine); k++) {
    const [it] = pickItems(c, 1, r, used); if (!it || it.choices) continue;
    let ids = []; try { ids = testable(it).filter((id) => KIDSAY[id]); } catch (e) { ids = []; }
    if (!ids.length) continue;
    const preds = {}, wp = {}; for (const id of ids) { let v = null; try { v = __predict(it, id); } catch (e) { v = null; } if (!v || JSON.stringify(v) === JSON.stringify(it.sol)) continue; if (showable(it.prompt, v)) preds[id] = v; else { const alt = plainFrac(it.prompt, v); if (alt && showable(alt, v)) { preds[id] = v; wp[id] = alt; } } }   /* 자연수 0 대분수는 그냥 분수로(5-1-5:3 비교하기가 사라지던 것) */
    const ok = Object.keys(preds); if (!ok.length) continue;
    const mine = ok.find((id) => prefer.includes(id));
    const bug = mine || ok[0];
    const others = [...new Set(ok.filter((id) => id !== bug && KIDSAY[id] !== KIDSAY[bug] && JSON.stringify(preds[id]) !== JSON.stringify(preds[bug])).map((id) => KIDSAY[id]))];
    const reasons = [KIDSAY[bug], ...others.slice(0, 2)];
    while (reasons.length < 3) reasons.push(GENERIC[reasons.length - 1] || GENERIC[0]);
    for (let i = reasons.length - 1; i > 0; i--) { const j = Math.floor(r.next() * (i + 1)); [reasons[i], reasons[j]] = [reasons[j], reasons[i]]; }
    const cand = { it: { c, p: it.p, prompt: it.prompt, sol: it.sol }, wrong: preds[bug], wrongPrompt: wp[bug] || it.prompt, wrongText: answerText(wp[bug] || it.prompt, preds[bug]), bug, reasons, right: KIDSAY[bug], rightFirst: r.next() < 0.5, mine: !!mine };
    if (!best || cand.mine) best = cand;
  }
  return best;
}
