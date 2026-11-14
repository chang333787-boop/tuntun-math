// 차시 → 그림(도움 사다리 · 배우기) — 문제의 수로 그리는 그림 설명(spec) · 틀은 engine/pics.js
//  PICS[차시] = (p, { i, steps }) => spec | null
//    i = −1 떠올리기(처음 문제를 다시 볼 때) · 0…n−1 지금 그 단계 · n 단계를 마치고 처음 문제로 돌아옴
//    steps = 화면이 쓰는 단계 [{ c, p(가족 단계는 fam · a · b), sol, prompt }] (app/js/fix.js stepsOf)
//  규칙(docs/direction_1110.md 차례 1 · 교사 11-08 '뭔 말이야 · 그림 없어도 됨?'):
//    · 개념 묶음마다 그림 하나 — 떠올리기 말(cue)과 같은 생각을 그림으로
//    · 답을 글자로 적지 않는다. 세어서 아는 것은 됨(10칸 틀과 같은 기준) · 마친 단계의 답만 그 칸에
//    · 묶음이 곧 답인 그림(나눗셈 묶음)은 단계에서부터 · 고르기(크기 비교)는 다른 수로 그린 보기 그림
//    · 그릴 수 없는 수(너무 큼 · 모양이 안 맞음)는 null — 화면은 그림 없이 글만
//  검사: tests/pics.test.mjs(모든 단계에서 그려지나 · 답이 글자로 새지 않나 · 차시마다 그림이 나오는 비율)
import { figOf } from '../figs.js';

const fin = Number.isFinite, int = Number.isInteger;
/* 문제 속 도형 그림(engine/figs.js)에 표시만 얹음 — 자리 · 방향 · 적힌 수가 문제의 그림과 같음(화면은 문제의 그림 자리에서 바꿔 그림) */
const fg = (id, p, more) => { const f = figOf(id, p); return f ? { ...f.spec, ...more } : null; };
const famOf = (s) => (s && s.p && s.p.fam) || '';
const cur = (steps, i) => (i >= 0 && i < steps.length ? steps[i] : null);
const seg = (n, k = 'a') => ({ n, k });
const rep = (n, f) => Array.from({ length: n }, (_, k) => f(k));
const dn = (m, k) => String(Number((m / 10 ** k).toFixed(k)));   /* 정수 m · 소수 k자리 → '2.17' */
const POW = { 2: '100', 1: '10', 0: '1', [-1]: '0.1', [-2]: '0.01', [-3]: '0.001' };

// ── 가르기 띠 ── 자리마다 갈라 곱하기 · 갈라 나누기(단계의 가족 문항에서 칸을 읽음 — 차시마다 따로 쓰지 않음)
//  지금 단계의 칸은 노랑 · 마친 칸에는 그 단계의 답 · 더하는 단계에서는 더할 두 칸이 노랑
function splitPic(fam) {
  const mul = fam === 'MUL', sym = mul ? '×' : '÷';
  return (p, { i, steps }) => {
    const cs = steps.map((s, k) => ({ k, a: s.p && s.p.a, b: s.p && s.p.b, fam: famOf(s) })).filter((x) => x.fam === fam && fin(x.a) && fin(x.b));
    if (cs.length < 2 || cs.length > 4) return null;
    if (mul) {
      if (cs.reduce((t, x) => t + x.a * x.b, 0) !== p.a * p.b) return null;
      if (!cs.every((x) => x.b === cs[0].b) && !cs.every((x) => x.a === cs[0].a)) return null;
    } else if (cs.reduce((t, x) => t + x.a, 0) !== p.a || !cs.every((x) => x.b === p.b)) return null;
    const val = (x) => (mul ? x.a * x.b : Math.floor(x.a / x.b));
    cs.sort((x, y) => (mul ? y.a * y.b - x.a * x.b : y.a - x.a));
    const s = cur(steps, i), on = new Set();
    if (s && cs.some((x) => x.k === i)) on.add(i);
    else if (s && (famOf(s) === 'ADD' || famOf(s) === 'SUB')) {
      const hit = cs.filter((x) => x.k < i && (val(x) === s.p.a || val(x) === s.p.b));
      (hit.length >= 2 ? hit : cs.filter((x) => x.k < i)).forEach((x) => on.add(x.k));
    }
    return { t: 'split', top: `${p.a} ${sym} ${p.b}`, cells: cs.map((x) => ({ t: `${x.a} ${sym} ${x.b}`, v: x.k < i ? steps[x.k].sol.join(' … ') : null, on: on.has(x.k) })) };
  };
}

// ── 곱셈구구 배열 ── a × b = 한 줄에 a개씩 b줄 · 아는 곱으로 가름(engine/hints/mdf.js factSteps와 같은 갈래)
//  2단 · ×2 = 두 줄(같은 수 두 번) · 3 = 2 + 1 · 4 · 6 · 8 = 반과 반 · 5단 = 두 줄씩 10 · 7 = 5 + 2 · 9 = 10에서 하나 뺌(점선)
function factPic(p, { i, steps }) {
  const { a, b } = p;
  if (!int(a) || !int(b) || a < 2 || b < 2 || a > 9 || b > 9) return null;
  if (b === 2) return { t: 'array', rows: 2, groups: [{ n: a }], ring: true };
  if (a === 2) return { t: 'array', rows: 2, groups: [{ n: b }], ring: true };
  if (a === 5) return { t: 'array', rows: b, groups: [{ n: 5 }], pair: true };
  if (a === 9) return { t: 'array', rows: b, groups: [{ n: 9 }, { n: 1, gh: true }] };
  const cut = a === 3 ? [2, 1] : a === 7 ? [5, 2] : a % 2 === 0 ? [a / 2, a / 2] : null;
  if (!cut) return null;
  const s = cur(steps, i), want = s && famOf(s) === 'MUL' && s.p.b === b ? s.p.a : null;
  let used = false;
  return { t: 'array', rows: b, groups: cut.map((n) => { const on = !used && want === n; if (on) used = true; return { n, on, lab: `${n} × ${b}` }; }) };
}
// ── 나눗셈 묶음 ── a ÷ b = b개씩 묶은 줄 · 남는 것은 아래(묶음 수가 곧 몫이라 단계에서부터)
function divFact(p, { i }) {
  const { a, b } = p, q = Math.floor(a / b);
  if (i < 0 || !int(a) || !int(b) || b < 2 || b > 9 || q < 1 || q > 9) return null;
  return { t: 'array', rows: q, groups: [{ n: b }], ring: true, rem: a % b };
}
/* 몫이 몇십 + 나머지(85 ÷ 8) — 몇십을 먼저 나누는 한 단계뿐이면 띠로(남은 수는 글자로 적지 않음 — 곧 답) · 아니면 묶음 */
function divRem(p, ctx) {
  const { i, steps } = ctx, s = steps[0];
  if (steps.length === 1 && famOf(s) === 'DIV' && s.p.b === p.b && s.p.a < p.a && s.p.a % 10 === 0) return { t: 'split', top: `${p.a} ÷ ${p.b}`, cells: [{ t: `${s.p.a} ÷ ${s.p.b}`, on: i === 0, v: i > 0 ? s.sol.join(' … ') : null }, { t: '남은 수' }] };
  return divFact(p, ctx);
}
// ── 몫이 두 자리인 나눗셈 ── (세 자리) ÷ (두 자리): 나누어지는 수를 '나누는 수 × 몇십'과 '남은 수'로 가른 띠
//  단계(몫의 십의 자리 → 나누는 수 × 몇십 → 빼기 → 남은 수 나누기)를 따라 칸이 채워짐
function longDiv(p, { i, steps }) {
  const { a, b } = p;
  const m = steps.findIndex((s) => famOf(s) === 'MUL' && (s.p.a === b || s.p.b === b)), sb = steps.findIndex((s, k) => k > m && famOf(s) === 'SUB' && s.p.a === a), d = steps.findIndex((s, k) => k > sb && famOf(s) === 'DIV' && s.p.b === b);
  if (m < 0 || sb < 0 || d < 0) return null;
  const ten = steps[m].p.a === b ? steps[m].p.b : steps[m].p.a;
  return { t: 'split', top: String(a), cells: [
    { t: i >= m ? `${b} × ${ten}` : `${b} × 몇십`, on: i >= 0 && i <= m, v: i > m ? steps[m].sol.join('') : null },
    { t: i > sb ? `${steps[d].p.a} ÷ ${b}` : '남은 수', on: i === sb || i === d, v: i > d ? steps[d].sol.join(' … ') : null },
  ] };
}
/* (몇) × (몇십): 몇십 = 몇의 10배 → 'a × 몇' 칸이 10개(첫 칸만 계산하면 됨) */
function tenTimes(p, { i, steps }) {
  const k = steps.findIndex((s) => famOf(s) === 'MUL' && s.p.a * s.p.b * 10 === p.a * p.b);
  if (k < 0) return null;
  const s = steps[k];
  return { t: 'tiles', top: `${p.a} × ${p.b}`, n: 10, cell: `${s.p.a} × ${s.p.b}`, on: i === k, v: i > k ? s.sol.join('') : null, foot: '똑같은 칸이 10개' };
}
// ── 뛰어 세기 눈금 ── (몇백몇십) ÷ (몇십 · 두 자리): b씩 몇 번 뛰면 a에 가장 가까이 가나
//  몫을 어림하는 동안은 첫 뜀만 · 'b × 몫' 단계에서 뛴 수만큼 + 한 번 더 뛰면 넘어감(점선) · 그 뒤 = 닿은 곳과 남은 사이
function jumpPic(p, { i, steps }) {
  const { a, b } = p, q = Math.floor(a / b);
  if (!int(a) || !int(b) || b < 2 || q < 1 || q > 12) return null;
  const m = steps.findIndex((s) => famOf(s) === 'MUL' && s.p.a * s.p.b === b * q);
  const all = m >= 0 && i >= m, land = m >= 0 && i > m;
  const ticks = rep(q + 2, (k) => ({ v: b * k, big: true, lab: k <= 1 || (land && k === q) ? b * k : null, ac: land && k === q }));
  const arcs = all ? [...rep(q, (k) => ({ a: b * k, b: b * (k + 1), lab: k === 0 ? `${b}씩` : '' })), { a: b * q, b: b * (q + 1), da: true }] : [{ a: 0, b, lab: `${b}씩` }];
  return { t: 'line', min: 0, max: b * (q + 1), ticks, marks: [{ v: a }], arcs, gap: land && a > b * q ? [b * q, a] : null };
}

// ── 시간 ── 몇 시간 몇 분 ↔ 몇 분(분 ↔ 초도 같은 꼴)
const UN = { hm: ['시간', '분'], ms: ['분', '초'] };
function timePic(p, { i, steps }) {
  const U = UN[p.u], { a, b } = p;
  if (!U || !int(a) || !int(b) || a < 1) return null;
  const [big, small] = U;
  if (p.v === 'join') {
    if (a > 4) return null;
    const s = cur(steps, i), on = !!s && !famOf(s), conv = steps.findIndex((x) => !famOf(x));   /* '몇 시간은 몇 분' 단계일 때 60 칸을 짚음 */
    const one = a === 1 && conv >= 0 && i <= conv ? `1${big}` : `60${small}`;   /* 1시간 = □분을 묻는 동안은 60을 적지 않음(곧 그 단계의 답) */
    return { t: 'split', top: `${a}${big}${b ? ` ${b}${small}` : ''}`, cells: [...rep(a, () => ({ t: one, on })), ...(b ? [{ t: `${b}${small}` }] : [])] };
  }
  if (p.v !== 'split' || a > 5) return null;
  const N = 60 * a + b, all = i >= 0, sub = steps.findIndex((s) => famOf(s) === 'SUB');
  return { t: 'line', min: 0, max: 60 * (a + 1),
    ticks: rep(a + 2, (k) => ({ v: 60 * k, big: true, lab: k <= 1 || (all && k === a) ? 60 * k : null })),
    marks: [{ v: N, lab: `${N}${small}` }],
    arcs: all ? rep(a, (k) => ({ a: 60 * k, b: 60 * (k + 1), lab: k === 0 ? `60${small}` : '' })) : [{ a: 0, b: 60, lab: `60${small}` }],
    gap: all && b > 0 && (sub < 0 || i >= sub) ? [60 * a, N] : null };
}

// ── 분수 띠 ──
const okD = (d) => int(d) && d >= 2 && d <= 12;
const bar1 = (row, top = '') => ({ t: 'bars', top, rows: [row] });
/* 0.1이 몇 개 — 온전한 1이 셋까지면 열 칸 띠로 다 그리고(1은 0.1이 10개), 넘으면 작은 네모로 */
const tenths = (n, top) => (n >= 0 && n <= 99 ? bar1(n < 40 ? { d: 10, segs: [seg(n)] } : { d: 10, pre: Math.floor(n / 10), segs: [seg(n % 10)] }, top) : null);

const MULS = ['3-1-4:3', '3-1-4:4', '3-1-4:5', '3-1-4:6', '3-2-1:2', '3-2-1:3', '3-2-1:4', '3-2-1:6', '3-2-1:7', '3-2-1:8', '4-1-3:3'];
const DIVS = ['3-2-2:3', '3-2-2:4', '3-2-2:5', '3-2-2:7'];
const FACTS = ['2-2-2:2', '2-2-2:3', '2-2-2:4', '2-2-2:5', '2-2-2:6', '2-2-2:7'];

const PICS = {
  ...Object.fromEntries(MULS.map((c) => [c, splitPic('MUL')])),
  ...Object.fromEntries(DIVS.map((c) => [c, splitPic('DIV')])),
  ...Object.fromEntries(FACTS.map((c) => [c, factPic])),
  /* 몇의 몇 배 — a씩 k묶음(그림이 문제에 이미 있는 꼴 ask는 빼고) */
  '2-1-6:4': (p) => (!p.ask && int(p.a) && int(p.k) && p.a >= 1 && p.a <= 9 && p.k >= 1 && p.k <= 9 ? { t: 'array', rows: p.k, groups: [{ n: p.a }], ring: true } : null),
  '3-1-3:6': divFact,
  '3-2-2:6': divRem,
  /* 몇십 · 몇백의 곱과 몫 — 10(100) 동전으로(7 × 2를 먼저 떠올리는 까닭) */
  '3-1-4:2': (p) => { const u = p.a % 100 === 0 ? 100 : 10, n = p.a / u; return int(n) && n >= 1 && n <= 9 && int(p.b) && p.b >= 1 && p.b <= 9 ? { t: 'array', rows: p.b, groups: [{ n }], unit: u } : null; },
  '3-2-1:5': tenTimes,
  '3-2-2:2': (p, { i }) => {
    const n = p.a / 10, per = n / p.b;
    if (!int(n) || n < 1 || n > 9 || !int(p.b) || p.b < 1) return null;
    return i >= 0 && int(per) && p.b <= 9 ? { t: 'array', rows: p.b, groups: [{ n: per }], unit: 10, ring: true } : { t: 'array', rows: 1, groups: [{ n }], unit: 10 };
  },
  '4-1-3:4': jumpPic,
  '4-1-3:5': jumpPic,
  '4-1-3:6': longDiv,
  '4-1-3:7': longDiv,

  /* 분수 — 단위분수가 몇 개 · 크기 비교 · 전체의 몇 분의 몇 · 대분수 ↔ 가분수 · 분모가 같은 덧셈 · 뺄셈 */
  '3-1-6:5': (p) => (p.v !== 'line' && okD(p.d) && int(p.n) && p.n >= 0 && p.n <= 3 * p.d ? bar1({ d: p.d, segs: [seg(p.n)] }) : null),
  '3-1-6:6': (p, { i, steps }) => {   /* 고르기 — 떠올리기에서는 그리지 않고, 단계에서 센 분수만 한 줄씩 */
    const rows = steps.slice(0, i + 1).filter((s) => s.p && s.p.v === 'count' && okD(s.p.d)).map((s) => ({ d: s.p.d, segs: [seg(s.p.n)], lab: [s.p.n, s.p.d] }));
    return i >= 0 && rows.length ? { t: 'bars', rows } : null;
  },
  '3-1-6:7': (p, { i }) => {   /* 단위분수 비교 — 이 문제에 없는 분모로 그린 보기(많이 나눌수록 한 조각이 작아짐) */
    const ds = new Set(p.v === 'three' ? p.ds : [p.a, p.b]);
    const pr = [[2, 4], [3, 6], [2, 8], [4, 8]].find((x) => !ds.has(x[0]) && !ds.has(x[1]));
    return i < 0 && pr ? { t: 'bars', rows: pr.map((d) => ({ d, segs: [seg(1)], lab: [1, d] })) } : null;
  },
  '3-2-4:3': (p, { i }) => (int(p.N) && int(p.d) && p.N <= 60 && p.d >= 2 && p.d <= 12 && p.N % p.d === 0 ? { t: 'share', total: p.N, groups: p.d, on: i >= 1 ? p.n : 0 } : null),
  '3-2-4:4': (p, { i }) => {
    const top = { h: '1시간 = 60분', m: '1 m = 100 cm', day: '하루 = 24시간' }[p.u];
    return top && okD(p.d) && int(p.n) && p.n >= 1 && p.n <= p.d ? bar1({ d: p.d, segs: i === 0 && p.n > 1 ? [seg(1), seg(p.n - 1, 'b')] : [seg(p.n)] }, top) : null;
  },
  '3-2-4:6': (p) => {
    const tot = p.w * p.d + p.n;
    if (!okD(p.d) || !int(tot) || tot < 1 || Math.ceil(tot / p.d) > 4) return null;
    return bar1({ d: p.d, segs: p.v === 'toImp' ? [seg(p.w * p.d), seg(p.n, 'b')] : [seg(tot)] });
  },
  '4-2-1:2': (p) => (p.op === '+' && okD(p.d) && p.a >= 0 && p.b >= 0 && p.a + p.b <= 3 * p.d ? bar1({ d: p.d, segs: [seg(p.a), seg(p.b, 'b')] }) : null),
  '4-2-1:3': (p) => (p.op === '+' && okD(p.d) && p.w1 <= 6 && p.w2 <= 6 ? { t: 'bars', rows: [{ d: p.d, pre: p.w1, segs: [seg(p.n1)], lab: [p.w1, p.n1, p.d] }, { d: p.d, pre: p.w2, segs: [seg(p.n2, 'b')], lab: [p.w2, p.n2, p.d] }] } : null),
  '4-2-1:4': (p) => (p.op === '-' && okD(p.d) && p.b >= 0 && p.a >= p.b && p.a <= 3 * p.d ? bar1({ d: p.d, segs: [seg(p.a - p.b), seg(p.b, 'x')] }) : null),
  '4-2-1:5': (p) => (p.op === '-' && okD(p.d) && p.w1 <= 8 && p.w1 >= p.w2 && p.n1 >= p.n2 ? bar1({ d: p.d, pre: p.w1, preX: p.w2, segs: [seg(p.n1 - p.n2), seg(p.n2, 'x')] }) : null),
  /* 자연수 − 분수 · 받아내림 — 하나를 d/d로 바꾼 모습에서 시작 · 바꾸는 단계를 마치면 덜어 낼 칸에 ✕ */
  '4-2-1:6': (p, { i }) => {
    if (p.op !== '-' || !okD(p.d) || !(p.w1 >= 1) || p.w1 > 9 || p.n1 !== 0 || p.w1 - 1 < p.w2 || p.n2 > p.d) return null;
    return bar1(i < 1 ? { d: p.d, pre: p.w1 - 1, segs: [seg(p.d)] } : { d: p.d, pre: p.w1 - 1, preX: p.w2, segs: [seg(p.d - p.n2), seg(p.n2, 'x')] });
  },
  '4-2-1:7': (p, { i }) => {
    if (p.op !== '-' || !okD(p.d) || !(p.w1 >= 1) || p.w1 > 9 || p.w1 - 1 < p.w2 || p.n2 > p.d + p.n1) return null;
    return bar1(i < 1 ? { d: p.d, pre: p.w1 - 1, min: 2, segs: [seg(p.d + p.n1)] } : { d: p.d, pre: p.w1 - 1, preX: p.w2, min: 2, segs: [seg(p.d + p.n1 - p.n2), seg(p.n2, 'x')] });
  },
  /* 크기가 같은 분수 — 같은 띠를 더 잘게(점선) · 색칠한 넓이는 그대로 */
  '5-1-4:3': (p) => {
    if (!okD(p.d) || !int(p.k) || p.k < 2 || p.d * p.k > 36 || !(p.n >= 1) || p.n > p.d) return null;
    const fine = { d: p.d, segs: [seg(p.n)], sub: p.k }, plain = { d: p.d, segs: [seg(p.n)] };
    return { t: 'bars', rows: p.v === 'down' ? [{ ...fine, lab: [p.n * p.k, p.d * p.k] }, plain] : [{ ...plain, lab: [p.n, p.d] }, fine] };
  },

  /* 소수 — 1을 열 칸으로(0.1) */
  '3-1-6:8': (p) => (int(p.n) && p.n >= 1 && p.n <= 9 ? bar1({ d: 10, segs: [seg(p.n)] }, p.v === 'mm' ? '1 cm = 10 mm' : '1') : null),
  '3-1-6:9': (p) => (int(p.n) ? tenths(p.n, p.v === 'cm' ? '1 cm = 10 mm' : '1') : null),

  /* 시간 */
  '2-2-4:4': (p) => {
    if (p.h === 1) return { t: 'clock', h: 12, m: 0, sweep: true };
    return int(p.h) && p.h >= 2 && p.h <= 5 ? { t: 'split', top: p.v === 'm2h' ? `${60 * p.h}분` : `${p.h}시간`, cells: rep(p.h, () => ({ t: '60분' })) } : null;
  },
  '2-2-4:5': timePic,
  '3-1-5:5': timePic,

  /* 소수 세 자리 수 — 자리 값은 자리 표(물은 숫자 칸이 노랑) · 0.001이 몇 개와 m → km는 가르기 띠(단계와 같은 두 칸) */
  '4-2-3:4': (p, { i, steps }) => {
    if (!int(p.n)) return null;
    if (p.v === 'value') {
      const ds = String(p.n).split('');
      return ds.length !== 4 || ds[3 - p.i] === '1' ? null : { t: 'place', cols: ['1', '0.1', '0.01', '0.001'], rows: [{ ds, on: 3 - p.i }] };   /* 숫자 1이면 자리 이름이 곧 답 */
    }
    const n = steps.length, w = Math.floor(p.n / 1000), r = p.n % 1000;
    if (!n || n > 2 || !w || !r) return null;
    if (p.v === 'units') { const a = n - 2, got = i >= 0 && i > a; return { t: 'split', top: dn(p.n, 3), cells: [{ t: String(w), v: got ? `${w * 1000}개` : null, on: i === a }, { t: dn(r, 3), v: got ? `${r}개` : null, on: i === n - 1 }] }; }
    if (p.v === 'km' && n === 2) return { t: 'split', top: `${p.n} m`, cells: [{ t: `${w * 1000} m`, v: i > 0 ? `${w} km` : null, on: i === 0 }, { t: `${r} m`, v: i > 1 ? `${dn(r, 3)} km` : null, on: i === 1 }] };
    return null;
  },
  /* 소수 사이의 관계 — 자리 표: 윗줄 = 주어진 수 · 아랫줄 = 빈칸 · 작은 단위 칸에서 새 단위 칸으로 화살표(답은 적지 않음) */
  '4-2-3:7': (p, { i }) => {
    const [m, k, sh] = p.v === 'x10' ? [p.k, 2, 1] : p.v === 'x100' ? [p.k, 2, 2] : p.v === 'd10' ? [p.k, 2, -1] : p.v === 'd100' ? [p.m, 1, -2] : p.v === 'inv' ? [p.m, p.f === 10 ? 2 : 1, p.f === 10 ? -1 : -2] : [];
    if (!int(m) || m < 1) return null;
    const ds = String(m), hi = Math.max(ds.length - 1 - k, 0, ds.length - 1 - k + sh), lo = Math.min(-k, sh - k), cols = [], row = [];
    if (hi > 2 || lo < -3) return null;
    for (let e = hi; e >= lo; e--) { const j = e + k; cols.push(POW[e]); row.push(j < 0 ? '' : j < ds.length ? ds[ds.length - 1 - j] : e <= 0 ? '0' : ''); }
    if ([m, m * 10 ** (sh - k)].some((v) => cols.includes(String(Number(v.toFixed(3)))))) return null;   /* 답이 자리 이름과 같은 수면 그리지 않음 */
    const from = cols.indexOf(POW[-k]), to = cols.indexOf(POW[sh - k]);
    return { t: 'place', cols, rows: [{ ds: row, on: i < 1 ? from : -1 }, { ds: cols.map(() => ''), on: i >= 1 ? to : -1 }], hop: i === 0 ? null : { from, to, text: sh > 0 ? `${10 ** sh}배` : `1/${10 ** -sh}` } };
  },
  /* 덧셈식 · 뺄셈식 배열 — 식 꼴 칸: 앞 식보다 두 수가 바뀐 만큼 · 모르는 칸은 떠올리기에서만 '?'(단계부터는 단계 식에 나온 만큼) */
  '4-1-6:6': (p, { i }) => {
    if (!int(p.k) || !p.kind) return null;
    const k = p.k, dx = p.kind === 'sub' ? 0 : k, dy = p.kind === 'both' || p.kind === 'sub' ? k : p.kind === 'opp' ? -k : 0, dz = p.op === '+' ? dx + dy : dx - dy;
    const u = p.ask === 'res' ? 2 : p.kind === 'sub' ? 1 : 0, say = (d) => (d > 0 ? `${d} 커짐` : d < 0 ? `${-d} 작아짐` : '그대로');
    return { t: 'eqbox', heads: p.op === '+' ? ['더해지는 수', '더하는 수', '합'] : ['빼지는 수', '빼는 수', '차'], ops: [p.op === '+' ? '+' : '−', '='], vals: [dx, dy, dz].map((d, j) => (j === u && i < 0 ? '?' : say(d))), on: u };
  },
  /* 곱셈식 · 나눗셈식 배열 — 같은 식 꼴 칸(몇 배 · 그대로) · 몇 배는 앞 식과(나누어지는 수만 몇 배 = 첫째 식과) · 숫자 모양 규칙(101 · 9 · 1)은 그림 없음 */
  '4-1-6:7': (p, { i }) => {
    const MUL = ['곱해지는 수', '곱하는 수', '곱'], DIV = ['나누어지는 수', '나누는 수', '몫'], box = (heads, op, vals, end) => ({ t: 'eqbox', heads, ops: [op, '='], vals: [...vals, i < 0 ? '?' : end], on: 2 });
    if (p.kind === 'dbl' || p.kind === 'x10') { const f = p.kind === 'dbl' ? '2배' : '10배'; return box(MUL, '×', ['그대로', f], f); }
    if (p.kind === 'divk' && int(p.at)) return box(DIV, '÷', [`${p.at}배`, '그대로'], `${p.at}배`);
    if (p.kind === 'dsame') return box(DIV, '÷', ['2배', '2배'], '그대로');
    return null;
  },
  /* 1 km = 1000 m · 1 L = 1000 mL · 1 kg = 1000 g — 몇 km 몇 m를 자리 표에(천의 자리 · 일의 자리) · 빈 자리 둘이 노랑 · m로 가르기(split)는 숫자가 곧 답이라 그림 없음 */
  ...Object.fromEntries([['3-1-5:2', 'm'], ['3-2-5:3', 'mL'], ['3-2-5:6', 'g']].map(([id, u]) => [id, (p) => (p.v === 'join' && int(p.k) && int(p.m) && p.m < 10
    ? { t: 'place', cols: [1000, 100, 10, 1].map((v) => `${v} ${u}`), rows: [{ ds: [String(p.k), '', '', String(p.m)], on: [1, 2] }] } : null)])),
  /* 직사각형 둘레와 넓이 — 둘레 단계에서는 테두리 · 넓이 단계에서는 칸 */
  '5-1-6:4': (p, { i, steps }) => (int(p.a) && int(p.b) && p.a >= 1 && p.b >= 1 && p.a <= 20 && p.b <= 12
    ? { t: 'grid', w: p.a, h: p.b, wl: `${p.a} cm`, hl: `${p.b} cm`, mode: i < 0 || i >= steps.length ? 'plain' : i === steps.length - 1 ? 'area' : 'peri' } : null),
  // ── 문제에 도형 그림이 있는 차시 ── 같은 그림에 생각 하나만 얹음 · null이면 화면은 문제의 그림 그대로
  /* 직선 · 한 바퀴 — 두 각을 합친 전체에 굵은 호(직선 = 반 바퀴 · 한 바퀴) */
  '4-1-2:5': (p, { i, steps }) => ((p.v === 'line' || p.v === 'round') && i < steps.length ? fg('4-1-2:5', p, { whole: true }) : null),
  /* 삼각형 — 세 각을 한 점에 모으면 직선(떠올리기 · 180에서 빼는 단계) · 두 각을 더하는 단계는 문제의 그림 */
  '4-1-2:7': (p, { i, steps }) => { const f = i === 0 || i >= steps.length ? null : figOf('4-1-2:7', p); return f ? { t: 'gather', angs: f.spec.angs, labs: f.spec.labs } : null; },
  /* 사각형 — 대각선으로 삼각형 둘(떠올리기 · 360에서 빼는 단계) */
  '4-1-2:8': (p, { i, steps }) => (i < 0 || i === steps.length - 1 ? fg('4-1-2:8', p, { diag: true }) : null),
  /* 평행사변형 — 떠올리기: 왼쪽 삼각형을 오른쪽으로 옮김 · 단계: 밑변과 높이를 굵게(다른 한 변은 흐리게) */
  '5-1-6:6': (p, { i, steps }) => (i < 0 ? fg('5-1-6:6', p, { move: true }) : i < steps.length ? fg('5-1-6:6', p, { hi: true }) : null),
  /* 삼각형 넓이 — 똑같은 삼각형을 하나 더 붙임 · 곱하는 단계에서는 밑변과 높이도 굵게 */
  '5-1-6:7': (p, { i, steps }) => (i < steps.length ? fg('5-1-6:7', p, { twin: true, hi: i === 0 }) : null),
  /* 부피 — 쌓기나무 금 · 맨 아래 한 층을 칠함(한 층의 수를 구하는 단계까지) */
  '6-1-6:3': (p, { i, steps }) => (i < steps.length ? fg('6-1-6:3', p, { cubes: true, layer: i < 1 }) : null),
  /* 겉넓이 — 넓이를 구하는 면 하나만 칠함(윗면 · 옆면 · 앞면) · 떠올리기와 더하는 단계는 세 면 모두 */
  '6-1-6:5': (p, { i, steps }) => (i >= steps.length ? null : fg('6-1-6:5', p, { faces: i >= 0 && i < 3 ? [['top', 'side', 'front'][i]] : ['top', 'side', 'front'] })),
  /* 시계 — 처음엔 짧은바늘이 지나온 숫자 칸(색칠한 부채꼴) · 단계에선 긴바늘이 숫자 한 칸씩 뛴 자국(5분씩 · 자국이 시계 밖으로 나가 반지름을 조금 줄임) */
  '1-2-3:5': (p, { i }) => (p.m && i < 0 ? fg('1-2-3:5', p, { gap: true }) : null),
  '2-2-4:2': (p, { i, steps }) => (i >= steps.length ? null : fg('2-2-4:2', p, i < 0 && steps.length ? { gap: true } : { gap: i < 0, jumps: true, r: 68 })),
  /* 자 — 처음엔 1 cm 칸을 나눠 그림 · 빼기 단계에선 시작 눈금과 끝 눈금 숫자를 칠함 */
  '2-1-4:5': (p, { i, steps }) => (i < 0 ? fg('2-1-4:5', p, { cells: true }) : i < steps.length ? fg('2-1-4:5', p, { hi: true }) : null),
  /* 원 — 준 쪽 말고 다른 쪽(지름 = 반지름 두 개)을 진하게 · 컴퍼스 문제는 벌린 길이를 반지름으로 그림 */
  '3-2-3:3': (p, { i, steps }) => (i >= steps.length ? null : p.v === 'comp' ? (Number.isInteger(p.r) && p.r > 0 ? { t: 'circle', r: p.r, both: true } : null) : fg('3-2-3:3', p, { both: true })),
  /* 1 m² — 한 변이 100 cm인 정사각형 하나(모눈 10000칸은 그리지 않음) */
  '5-1-6:5': (p, { i, steps }) => (i < steps.length ? { t: 'grid', w: 1, h: 1, size: 84, wl: '100 cm', hl: '100 cm', mid: '1 m²', mode: 'plain', label: '한 변이 100 cm인 정사각형, 넓이 1 m²' } : null),
  /* 마름모 — 둘러싼 직사각형 · 곱하기 단계에선 그 직사각형을 칠함 */
  '5-1-6:8': (p, { i, steps }) => (i < steps.length ? fg('5-1-6:8', p, { boxed: true, hi: i === 0 }) : null),
  /* 사다리꼴 — 거꾸로 붙인 같은 사다리꼴(평행사변형) · 더하기 단계 = 윗변 + 아랫변 칠함 · 곱하기 단계 = 높이 칠함 */
  '5-1-6:9': (p, { i, steps }) => (i >= steps.length ? null : fg('5-1-6:9', p, { twin: true, ...(i >= 0 && i < 2 ? { hi: ['ab', 'h'][i] } : {}) })),
  /* 원주 — 반지름을 주면 지름(반지름 두 개)부터 · × 3.14 단계는 한 바퀴 굴린 길이 */
  '6-2-5:3': (p, { i, steps }) => {
    if (i >= steps.length) return null;
    const d = p.v === 'd' ? p.d : 2 * p.r;
    if (!Number.isInteger(d) || d <= 0) return null;
    return p.v !== 'd' && i < steps.length - 1 ? { t: 'circle', r: p.r, both: true } : p.v !== 'd' && !steps.length ? { t: 'circle', r: p.r, both: true } : { t: 'circle', roll: true, ...(p.v === 'd' ? { d } : {}) };
  },
  /* 원의 넓이 — 반지름 × 반지름 정사각형 · 지름을 주면 먼저 반지름(지름의 반)을 진하게 */
  '6-2-5:5': (p, { i, steps }) => {
    if (i >= steps.length || !(Number.isInteger(p.r) && p.r > 0)) return null;
    return p.v === 'd' && (i < 0 || (i === 0 && steps.length)) ? { t: 'circle', d: 2 * p.r, both: true } : { t: 'circle', r: p.r, sq: true };
  },
};
export default PICS;
