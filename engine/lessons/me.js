// 측정(도형과 측정 영역) — 1단계: 시간(60진법)과 큰 단위 바꾸기
//   근거와 오답 꼴은 docs/research/E5_measure.md(조사 11-08) — 시간 계산 오답은 수와 연산 받아올림 · 받아내림 오답의 60진법판
//   가려내는 수: 시간 뺄셈은 분의 차가 30이 아니게(큰 수 − 작은 수와 시 안 줄임이 같은 답) · km는 m를 한 자리로(두 자리면 이어 쓰기 = 1 km를 100 m로)
import { nums, pick, B, J, P } from '../concepts/kit.js';
import { near } from '../math.js';
import { picSVG } from '../pics.js';
import { figOf, FIGK } from '../figs.js';

// 시간 두 칸(큰 단위 · 작은 단위) — 단위 이름표 하나로 시 · 분과 분 · 초를 같이 씀
const TU = {
  hm: { big: '시간', small: '분', eq: '1시간은 60분', at: '시' },
  ms: { big: '분', small: '초', eq: '1분은 60초' },
};
const pad = (n) => String(n).padStart(2, '0');
const span = (u, a, b) => `${a}${TU[u].big} ${b}${TU[u].small}`;
const until = (r, make, ok) => { for (let i = 0; i < 400; i++) { const p = make(r); if (ok(p)) return p; } return make(r); };

// ── 2-2-4:4 몇 시간 → 몇 분 · 몇십 분 → 몇 시간
function hourMake(p) {
  if (p.v === 'm2h') return nums([`${p.h * 60}분 = `, B(0), '시간'], p.h, { bugs: [{ test: (v) => v[0] === p.h * 6 || v[0] === p.h * 10, name: '1시간이 60분인 것을 헷갈림', to: '1-2-1:2' }] });
  return nums([`${p.h}시간 = `, B(0), '분'], p.h * 60, {
    bugs: [{ test: (v) => v[0] === p.h * 100, name: '1시간을 100분으로 봄', to: null },
      { test: (v) => v[0] === p.h * 10 || (p.h > 1 && v[0] === 60), name: '1시간이 60분인 것을 헷갈림', to: '1-2-1:2' }],
  });
}
// ── 2-2-4:5 · 3-1-5:5 몇 시간 몇 분 ↔ 몇 분(분 · 초도 같은 꼴)
function convMake(p) {
  const U = TU[p.u], T = p.a * 60 + p.b, ten = `${p.a}${pad(p.b)}`;
  if (p.v === 'split') {
    return nums([`${T}${U.small} = `, B(0), `${U.big} `, B(1), U.small], [p.a, p.b], {
      bugs: [{ test: (v) => T >= 100 && v[0] === Math.floor(T / 100) && v[1] === T % 100, name: `1${U.big}${P(U.big, '을', '를')} 100${U.small}${P(U.small, '으로', '로')} 봄`, to: p.u === 'hm' ? '2-2-4:4' : '2-2-4:5' },
        { test: (v) => v[0] === 0 && v[1] === T, name: `${U.big}${P(U.big, '으로', '로')} 바꾸지 않음`, to: p.u === 'hm' ? '2-2-4:4' : '2-2-4:5' }],
    });
  }
  return nums([`${span(p.u, p.a, p.b)} = `, B(0), U.small], T, {
    bugs: [{ test: (v) => v[0] === Number(ten), name: `1${U.big}${P(U.big, '을', '를')} 100${U.small}${P(U.small, '으로', '로')} 봄`, to: p.u === 'hm' ? '2-2-4:4' : '2-2-4:5' },
      { test: (v) => v[0] === p.a + p.b, name: '단위를 생각하지 않고 더함', to: p.u === 'hm' ? '2-2-4:4' : '2-2-4:5' },
      { test: (v) => v[0] === p.a * 60, name: `${U.small}${P(U.small, '을', '를')} 더하지 않음`, to: null }],
  });
}
const convSteps = (p) => {
  const T = p.a * 60 + p.b, fam = p.u === 'hm' ? '2-2-4:4' : '2-2-4:5';
  if (p.u === 'ms') return p.v === 'split'
    ? [{ c: 'SUB', p: { a: T, b: p.a * 60 }, why: `${p.a}분은 ${p.a * 60}초예요. ${T}초에서 ${p.a * 60}초를 빼면 몇 초가 남나요?` }]
    : [{ c: 'ADD', p: { a: p.a * 60, b: p.b }, why: `${p.a}분은 ${p.a * 60}초예요. 거기에 ${p.b}초를 더해요.` }];
  return p.v === 'split'
    ? [{ c: fam, p: { v: 'm2h', h: p.a }, why: `${p.a * 60}분은 몇 시간인가요?` }, { c: 'SUB', p: { a: T, b: p.a * 60 }, why: `${T}분에서 ${p.a * 60}분을 빼면 몇 분이 남나요?` }]
    : [{ c: fam, p: { v: 'h2m', h: p.a }, why: `${p.a}시간은 몇 분인가요?` }, { c: 'ADD', p: { a: p.a * 60, b: p.b }, why: `거기에 ${p.b}분을 더해요.` }];
};
const genConv = (u) => (r) => until(r, (r) => ({ u, v: r.pick(['join', 'join', 'split']), a: r.int(1, 3), b: r.int(5, 55) }), (p) => p.b % 10 !== 0 || r.chance(0.3));

// ── 3-1-5:6 시간의 덧셈 · 3-1-5:7 시간의 뺄셈(두 칸 답 [큰 단위, 작은 단위])
//   v 'sum' 시간 + 시간 · 'clock' 시각 + 시간(시각은 몇 시 몇 분)
function addMake(p) {
  const U = TU[p.u], s = p.b1 + p.b2, a = p.a1 + p.a2 + (s >= 60 ? 1 : 0), b = s % 60;
  const head = p.v === 'clock' ? [`${p.a1}시 ${p.b1}분에서 ${span('hm', p.a2, p.b2)} 뒤는 `, B(0), '시 ', B(1), '분이에요.'] : [`${span(p.u, p.a1, p.b1)} + ${span(p.u, p.a2, p.b2)} = `, B(0), `${U.big} `, B(1), U.small];
  return nums(head, [a, b], {
    bugs: [
      { test: (v) => s >= 60 && v[0] === p.a1 + p.a2 && v[1] === s, name: `60${U.small}${P(U.small, '이', '가')} 넘어도 1${U.big}${P(U.big, '으로', '로')} 바꾸지 않음(꼴)`, to: null },   /* 양은 맞고 꼴만 안 바꾼 답 — 개념 빈칸으로 보내지 않음(도입안 비판 · 심판 차례 2) */
      { test: (v) => s >= 60 && v[0] === p.a1 + p.a2 + 1 && v[1] === s, name: `1${U.big}${P(U.big, '을', '를')} 올리고 60${U.small}${P(U.small, '을', '를')} 빼지 않음`, to: p.u === 'hm' ? '2-2-4:5' : '3-1-5:5' },
      { test: (v) => s >= 100 && v[0] === p.a1 + p.a2 + 1 && v[1] === s - 100, name: `100${U.small}${P(U.small, '을', '를')} 1${U.big}${P(U.big, '으로', '로')} 봄`, to: p.u === 'hm' ? '2-2-4:5' : '3-1-5:5' },
    ],
  });
}
const addSteps = (p) => {
  const U = TU[p.u], s = p.b1 + p.b2;
  return [
    { c: 'ADD', p: { a: p.b1, b: p.b2 }, why: `${U.small}끼리 더해요.` },
    s >= 60 ? { c: p.u === 'hm' ? '2-2-4:5' : '3-1-5:5', p: { u: p.u, v: 'split', a: 1, b: s - 60 }, why: `${s}${U.small}${P(U.small, '은', '는')} 몇 ${U.big} 몇 ${U.small}인가요? (${U.eq}${P(U.eq, '이에요', '예요')})` } : null,
  ].filter(Boolean);
};
function subMake(p) {
  const U = TU[p.u], borrow = p.b1 < p.b2, a = p.a1 - p.a2 - (borrow ? 1 : 0), b = borrow ? p.b1 + 60 - p.b2 : p.b1 - p.b2;
  const head = p.v === 'dur' ? [`${p.a2}시 ${p.b2}분부터 ${p.a1}시 ${p.b1}분까지는 `, B(0), '시간 ', B(1), '분이에요.'] : [`${span(p.u, p.a1, p.b1)} − ${span(p.u, p.a2, p.b2)} = `, B(0), `${U.big} `, B(1), U.small];
  return nums(head, [a, b], {
    bugs: borrow ? [
      { test: (v) => v[0] === a && v[1] === p.b1 + 100 - p.b2, name: `1${U.big}${P(U.big, '을', '를')} 100${U.small}${P(U.small, '으로', '로')} 받아내림`, to: p.u === 'hm' ? '2-2-4:5' : '3-1-5:5' },
      { test: (v) => v[0] === p.a1 - p.a2 && v[1] === p.b2 - p.b1, name: '큰 수에서 작은 수를 뺌', to: p.u === 'hm' ? '2-2-4:5' : '3-1-5:5' },   /* 두 자리 받아내림은 이미 하는 학년 — 원인은 60에서 받아내리는 시간 개념(도입안 비판 11-08 · [K1] 3~5학년 내내 그대로) */
      { test: (v) => v[0] === p.a1 - p.a2 && v[1] === b, name: `받아내린 1${U.big}${P(U.big, '을', '를')} 빼지 않음`, to: p.u === 'hm' ? '2-2-4:5' : '3-1-5:5' },
    ] : [],
  });
}
const subSteps = (p) => {
  const U = TU[p.u];
  if (p.b1 >= p.b2) return [{ c: 'SUB', p: { a: p.b1, b: p.b2 }, why: `${U.small}끼리 빼요.` }];
  /* 첫 단계는 개념(1시간 20분 = □분) — 계산 단계만 두면 '1시간 = 100분'인 아이도 단계를 다 맞혀 '합치기 빈칸'으로 읽힘(도입안 비판 11-08) */
  return [
    { c: p.u === 'hm' ? '2-2-4:5' : '3-1-5:5', p: { u: p.u, v: 'join', a: 1, b: p.b1 }, why: `${U.small}끼리 뺄 수 없으니 1${U.big}${P(U.big, '을', '를')} ${U.small}${P(U.small, '으로', '로')} 바꿔요. 1${U.big} ${p.b1}${U.small}${P(U.small, '은', '는')} 몇 ${U.small}인가요?` },
    { c: 'SUB', p: { a: p.b1 + 60, b: p.b2 }, why: `이제 ${U.small}끼리 빼요.` },
  ];
};

// ── 3-1-5:2 1 km = 1000 m(m는 한 자리 — 두 자리면 '이어 쓰기'와 '1 km = 100 m'가 같은 답)
function kmMake(p) {
  const T = p.k * 1000 + p.m;
  if (p.v === 'split') return nums([`${T} m = `, B(0), ' km ', B(1), ' m'], [p.k, p.m], {
    bugs: [{ test: (v) => v[0] === Math.floor(T / 100) && v[1] === T % 100, name: '1 km를 100 m로 봄', to: null }],
  });
  return nums([`${p.k} km ${p.m} m = `, B(0), ' m'], T, {
    bugs: [{ test: (v) => v[0] === Number(`${p.k}${p.m}`), name: '빈 자리에 0을 쓰지 않음', to: '2-2-1:5' },
      { test: (v) => v[0] === p.k * 100 + p.m, name: '1 km를 100 m로 봄', to: null },
      { test: (v) => v[0] === p.k + p.m, name: '단위를 생각하지 않고 더함', to: '2-2-1:5' }],
  });
}

// ── 3-2-5:3 1 L = 1000 mL · 3-2-5:6 1 kg = 1000 g(km와 같은 꼴 · 작은 단위는 한 자리)
const BIG = { L: ['L', 'mL', '2-2-1:5'], kg: ['kg', 'g', '2-2-1:5'] };
function bigMake(p) {
  const [B1, S1, to] = BIG[p.u], T = p.k * 1000 + p.m;
  if (p.v === 'split') return nums([`${T} ${S1} = `, B(0), ` ${B1} `, B(1), ` ${S1}`], [p.k, p.m], {
    bugs: [{ test: (v) => v[0] === Math.floor(T / 100) && v[1] === T % 100, name: `1 ${B1}${P(B1, '을', '를')} 100 ${S1}${P(S1, '으로', '로')} 봄`, to }],
  });
  return nums([`${p.k} ${B1} ${p.m} ${S1} = `, B(0), ` ${S1}`], T, {
    bugs: [{ test: (v) => String(p.m).length < 3 && v[0] === Number(`${p.k}${p.m}`), name: '빈 자리에 0을 쓰지 않음', to },   /* 세 자리(1 L 400 mL)면 이어 쓴 수가 곧 정답 */
      { test: (v) => v[0] === p.k * 100 + p.m, name: `1 ${B1}${P(B1, '을', '를')} 100 ${S1}${P(S1, '으로', '로')} 봄`, to },
      { test: (v) => v[0] === p.k + p.m, name: '단위를 생각하지 않고 더함', to }],
  });
}
// ── 3-2-5:4 들이 · 3-2-5:7 무게의 덧셈과 뺄셈 — 시간 덧셈 · 뺄셈의 1000판(작은 단위끼리 · 1000이 넘으면 큰 단위로 · 뺄 수 없으면 1000을 받아내림 · 11-14 차례 4)
//   가려내는 수: 뺄셈은 작은 단위의 차가 500이 아니게(큰 수 − 작은 수와 받아내린 1을 안 뺀 답의 작은 단위가 같음) · 덧셈 합이 꼭 1000인 것은 뺌
const BU = { L: { big: 'L', small: 'mL', conv: '3-2-5:3' }, kg: { big: 'kg', small: 'g', conv: '3-2-5:6' } };
const bspan = (u, a, b) => `${a} ${BU[u].big} ${b} ${BU[u].small}`;
function bigCalcMake(p) {
  const U = BU[p.u], [B1, S1] = [U.big, U.small], tail = [B(0), ` ${B1} `, B(1), ` ${S1}`];
  if (p.op === '+') {
    const s = p.b1 + p.b2, A = p.a1 + p.a2 + (s >= 1000 ? 1 : 0);
    return nums([`${bspan(p.u, p.a1, p.b1)} + ${bspan(p.u, p.a2, p.b2)} = `, ...tail], [A, s % 1000], {
      bugs: s >= 1000 ? [
        { test: (v) => v[0] === p.a1 + p.a2 && v[1] === s, name: `1000 ${S1}${P(S1, '이', '가')} 넘어도 1 ${B1}${P(B1, '으로', '로')} 바꾸지 않음(꼴)`, to: null },   /* 양은 맞고 꼴만 — 시간 덧셈과 같게 개념 빈칸으로 보내지 않음 */
        { test: (v) => v[0] === A && v[1] === s, name: `1 ${B1}${P(B1, '을', '를')} 올리고 1000 ${S1}${P(S1, '을', '를')} 빼지 않음`, to: U.conv },
        { test: (v) => v[0] === A && v[1] === s - 100, name: `1 ${B1}${P(B1, '을', '를')} 100 ${S1}${P(S1, '으로', '로')} 봄`, to: U.conv },
      ] : [],
    });
  }
  const borrow = p.b1 < p.b2, A = p.a1 - p.a2 - (borrow ? 1 : 0), Bm = borrow ? p.b1 + 1000 - p.b2 : p.b1 - p.b2;
  return nums([`${bspan(p.u, p.a1, p.b1)} − ${bspan(p.u, p.a2, p.b2)} = `, ...tail], [A, Bm], {
    bugs: borrow ? [
      { test: (v) => p.b1 + 100 >= p.b2 && v[0] === A && v[1] === p.b1 + 100 - p.b2, name: `1 ${B1}${P(B1, '을', '를')} 100 ${S1}${P(S1, '으로', '로')} 받아내림`, to: U.conv },
      { test: (v) => v[0] === p.a1 - p.a2 && v[1] === p.b2 - p.b1, name: '큰 수에서 작은 수를 뺌', to: U.conv },
      { test: (v) => v[0] === p.a1 - p.a2 && v[1] === Bm, name: `받아내린 1 ${B1}${P(B1, '을', '를')} 빼지 않음`, to: U.conv },
    ] : [],
  });
}
const bigCalcSteps = (p) => {
  const U = BU[p.u], s = p.b1 + p.b2;
  if (p.op === '+') return [
    { c: 'ADD', p: { a: p.b1, b: p.b2 }, why: `${U.small}끼리 더해요.` },
    s > 1000 ? { c: U.conv, p: { u: p.u, v: 'split', k: 1, m: s - 1000 }, why: `${s} ${U.small}${P(U.small, '은', '는')} 몇 ${U.big} 몇 ${U.small}인가요?` } : null,
  ].filter(Boolean);
  if (p.b1 >= p.b2) return [{ c: 'SUB', p: { a: p.b1, b: p.b2 }, why: `${U.small}끼리 빼요.` }];
  /* 첫 단계는 개념(1 L 400 mL = □ mL) — 시간 뺄셈과 같은 까닭 */
  return [
    { c: U.conv, p: { u: p.u, v: 'join', k: 1, m: p.b1 }, why: `${U.small}끼리 뺄 수 없으니 1 ${U.big}${P(U.big, '을', '를')} ${U.small}${P(U.small, '으로', '로')} 바꿔요. 1 ${U.big} ${p.b1} ${U.small}${P(U.small, '은', '는')} 몇 ${U.small}인가요?` },
    { c: 'SUB', p: { a: p.b1 + 1000, b: p.b2 }, why: `이제 ${U.small}끼리 빼요.` },
  ];
};
const genBigCalc = (u) => (r) => {
  const op = r.pick(['+', '−']), want = r.chance(0.7), step = r.pick([100, 100, 50]), b = (r) => r.int(1, Math.floor(950 / step)) * step;
  if (op === '+') return until(r, (r) => ({ u, op, a1: r.int(1, 5), a2: r.int(1, 4), b1: b(r), b2: b(r) }), (p) => (want ? p.b1 + p.b2 > 1000 : p.b1 + p.b2 < 1000));
  return until(r, (r) => { const a1 = r.int(3, 9); return { u, op, a1, a2: r.int(1, a1 - 2), b1: b(r), b2: b(r) }; }, (p) => (want ? p.b1 < p.b2 && p.b2 - p.b1 !== 500 : p.b1 > p.b2));
};
// ── 4-1-2 각도 — 각도도 수처럼 더하고 뺌 · 직선 180° · 한 바퀴 360° · 삼각형 세 각 180° · 사각형 네 각 360°(조사 E5 단계 2 · A4 180/360 섞임)
//   각은 5° 단위 · 직선의 각을 90°로 보는 답은 한 각이 90°보다 작을 때만 셈
const deg = (x) => `${x}°`;
/* 문제 속 도형 그림(engine/figs.js) — 각도 · 길이를 그림에서 읽음(구하는 각은 ㉠) · 그림에 적힌 수는 alt로 글에도 남음 · 못 그리는 수면 null → 글 문제 그대로 */
const figTok = (id, p) => { const f = figOf(id, p), svg = f ? picSVG(f.spec, FIGK) : ''; return svg ? { svg, alt: f.alt, fig: 1 } : null; };
const m5 = (r, lo, hi) => r.int(lo / 5, hi / 5) * 5;
function angMake(p) {
  if (p.v === 'add') return nums([`${deg(p.a)} + ${deg(p.b)} = `, B(0), '°'], p.a + p.b, {});
  if (p.v === 'sub') return nums([`${deg(p.a)} − ${deg(p.b)} = `, B(0), '°'], p.a - p.b, {});
  const f = figTok('4-1-2:5', p);
  if (p.v === 'line') return nums(f ? [f, '직선을 두 각으로 나누었어요. ㉠은 ', B(0), '°예요.'] : [`직선을 두 각으로 나누었어요. 한 각이 ${deg(p.a)}이면 다른 한 각은 `, B(0), '°예요.'], 180 - p.a, {
    bugs: [{ test: (v) => p.a < 90 && v[0] === 90 - p.a, name: '직선이 이루는 각을 90°로 봄', to: null }, { test: (v) => v[0] === 360 - p.a, name: '직선이 이루는 각을 360°로 봄', to: null }],
  });
  return nums(f ? [f, '한 바퀴를 두 각으로 나누었어요. ㉠은 ', B(0), '°예요.'] : [`한 점을 둘러싼 한 바퀴를 두 각으로 나누었어요. 한 각이 ${deg(p.a)}이면 다른 한 각은 `, B(0), '°예요.'], 360 - p.a, {
    bugs: [{ test: (v) => p.a < 180 && v[0] === 180 - p.a, name: '한 바퀴를 180°로 봄', to: null }],
  });
}
function triMake(p) {
  const s = p.a + p.b, f = figTok('4-1-2:7', p);
  return nums(f ? [f, '삼각형에서 ㉠은 ', B(0), '°예요.'] : [`삼각형의 두 각이 ${deg(p.a)}, ${deg(p.b)}${P(deg(p.b), '이에요', '예요')}. 나머지 한 각은 `, B(0), '°예요.'], 180 - s, {
    bugs: [{ test: (v) => v[0] === 360 - s, name: '삼각형의 세 각의 합을 360°로 봄', to: null },
      { test: (v) => v[0] === s, name: '두 각을 더하기만 함', to: null },
      { test: (v) => v[0] === 180 - p.a || v[0] === 180 - p.b, name: '한 각만 뺌', to: null }],
  });
}
function quadMake(p) {
  const s = p.a + p.b + p.c, f = figTok('4-1-2:8', p);
  return nums(f ? [f, '사각형에서 ㉠은 ', B(0), '°예요.'] : [`사각형의 세 각이 ${deg(p.a)}, ${deg(p.b)}, ${deg(p.c)}${P(deg(p.c), '이에요', '예요')}. 나머지 한 각은 `, B(0), '°예요.'], 360 - s, {
    bugs: [{ test: (v) => v[0] === s, name: '세 각을 더하기만 함', to: null },
      { test: (v) => v[0] === s - 180, name: '사각형의 네 각의 합을 삼각형처럼 180°로 봄', to: '4-1-2:7' }],
  });
}
// ── 5-1-6:6 평행사변형 · 5-1-6:7 삼각형의 넓이 — 높이 대신 다른 한 변을 곱함(Ar4) · 평행사변형에 ÷2 · 삼각형에 ÷2 빠뜨림(Ar5) — 조사 E5 단계 1-7
function paraMake(p) {
  const ans = p.a * p.h, f = figTok('5-1-6:6', p);
  return nums(f ? [f, '평행사변형의 넓이는 ', B(0), ' cm²예요.'] : [`밑변이 ${p.a} cm, 높이가 ${p.h} cm, 다른 한 변이 ${p.s} cm인 평행사변형의 넓이는 `, B(0), ' cm²예요.'], ans, {
    bugs: [{ test: (v) => v[0] === p.a * p.s, name: '높이 대신 다른 한 변을 곱함', to: null },
      { test: (v) => v[0] * 2 === ans, name: '삼각형처럼 2로 나눔', to: null },
      { test: (v) => v[0] === 2 * (p.a + p.s), name: '넓이 대신 둘레를 구함', to: '5-1-6:4' }],
  });
}
function triAreaMake(p) {
  const ans = (p.a * p.h) / 2, f = figTok('5-1-6:7', p);
  return nums(f ? [f, '삼각형의 넓이는 ', B(0), ' cm²예요.'] : [`밑변이 ${p.a} cm, 높이가 ${p.h} cm${p.s ? `, 다른 한 변이 ${p.s} cm` : ''}인 삼각형의 넓이는 `, B(0), ' cm²예요.'], ans, {
    bugs: [{ test: (v) => v[0] === p.a * p.h, name: '2로 나누지 않음', to: '5-1-6:6' },
      { test: (v) => !!p.s && (v[0] === (p.a * p.s) / 2 || v[0] === p.a * p.s), name: '높이 대신 다른 한 변을 씀', to: null }],
  });
}
// ── 6-1-6 직육면체의 부피 · 겉넓이 — 같은 상자에 두 속성(V2 부피 ↔ 겉넓이 · 세 면만 · 한 면 × 6) — 조사 E5 단계 1-8
const boxOf = (p) => ({ V: p.a * p.b * p.c, S: 2 * (p.a * p.b + p.b * p.c + p.a * p.c) });
const boxHead = (id, p, what) => { const f = figTok(id, p); return f ? [f, `직육면체의 ${what}${P(what, '은', '는')} `] : [`가로 ${p.a} cm, 세로 ${p.b} cm, 높이 ${p.c} cm인 직육면체의 ${what}${P(what, '은', '는')} `]; };
function volMake(p) {
  const { V, S } = boxOf(p);
  return nums([...boxHead('6-1-6:3', p, '부피'), B(0), ' cm³예요.'], V, {
    bugs: [{ test: (v) => v[0] === S, name: '부피 대신 겉넓이를 구함', to: null },
      { test: (v) => v[0] === p.a + p.b + p.c, name: '세 모서리를 더함', to: null },
      { test: (v) => v[0] === p.a * p.b || v[0] === p.b * p.c || v[0] === p.a * p.c, name: '한 면의 넓이만 구함', to: '5-1-6:4' }],
  });
}
function surfMake(p) {
  const { V, S } = boxOf(p);
  return nums([...boxHead('6-1-6:5', p, '겉넓이'), B(0), ' cm²예요.'], S, {
    bugs: [{ test: (v) => v[0] === V, name: '겉넓이 대신 부피를 구함', to: null },
      { test: (v) => v[0] * 2 === S, name: '세 면만 더함(마주 보는 면을 빠뜨림)', to: null },
      { test: (v) => v[0] === 6 * p.a * p.b, name: '한 면의 넓이에 6을 곱함', to: null }],
  });
}
const genBox = (r) => until(r, (r) => ({ a: r.int(2, 12), b: r.int(2, 9), c: r.int(2, 9) }), (p) => { const { V, S } = boxOf(p); return V !== S && V * 2 !== S && 6 * p.a * p.b !== S && p.a + p.b + p.c !== V && new Set([p.a, p.b, p.c]).size >= 2; });

// ── 5-1-6:4 직사각형의 둘레와 넓이(한 문제에 칸 둘) — 넓이 = 둘레인 크기(3 × 6 · 4 × 4) · 넓이 = 가로 + 세로(2 × 2) 피함
function rectMake(p) {
  const per = 2 * (p.a + p.b), area = p.a * p.b, shape = p.a === p.b ? `한 변이 ${p.a} cm인 정사각형` : `가로 ${p.a} cm, 세로 ${p.b} cm인 직사각형`;
  return nums([`${shape}의 둘레는 `, B(0), ' cm, 넓이는 ', B(1), ' cm²예요.'], [per, area], {
    bugs: [{ test: (v) => v[0] === area && v[1] === per, name: '넓이와 둘레를 바꿔 답함', to: null },
      { test: (v) => v[0] === p.a + p.b, name: '둘레를 가로 + 세로로만 셈', to: null },
      { test: (v) => v[1] === per || v[1] === p.a + p.b, name: '넓이 자리에 변의 길이를 더함', to: null }],
  });
}

// ── 측정 2단계(11-14) — 시계 · 자 · 길이의 합과 차 · 원 · 넓이의 단위 · 마름모 · 사다리꼴 · 원주 · 원의 넓이
//   오답 꼴은 docs/research/E5_measure.md §4 단계 2(R1 · R2 · C1 · C2 · M2 · O1 · Ar6 · Ar7 · Ci1 · Ci2)
/* 문제 맨 앞의 그림 — 못 그리면 그림에 적힌 것을 옮긴 글 */
const figLead = (id, p) => { const f = figTok(id, p); if (f) return [f]; const g = figOf(id, p); return g ? [`${g.alt}. `] : []; };
/* 식 고르기 — 보기의 차례 넷(정답인 0번 식이 네 자리에 한 번씩) · wrong = 1 ~ 3번 식의 오답 이름 */
const ORD4 = [[0, 1, 2, 3], [1, 0, 3, 2], [2, 3, 0, 1], [3, 2, 1, 0]];
function exprPick(head, exprs, wrong, ord) {
  const order = ORD4[ord % 4];
  return pick(head, order.map((i) => [exprs[i]]), order.indexOf(0), { bugs: Object.fromEntries(wrong.map((b, j) => [order.indexOf(j + 1), b])) });
}
const pickOr = (r, rate) => (r.chance(rate) ? { pick: 1, ord: r.int(0, 3) } : {});

// ── 1-2-3:5 몇 시 · 몇 시 30분 · 2-2-4:2 몇 시 몇 분 — 시계 그림 읽기(짧은바늘이 지나온 숫자가 시 · 긴바늘은 숫자 한 칸에 5분, 작은 눈금 한 칸에 1분)
const clockMake = (id) => (p) => {
  const lead = figLead(id, p), nx = (p.h % 12) + 1, k = Math.floor(p.m / 5), rest = p.m % 5;
  /* 단계 문항(2-2-4:2의 첫 단계) — 위 시계를 보고 시만(그림은 다시 넣지 않음) */
  if (p.v === 'hr') return nums([p.m ? '짧은바늘이 지나온 숫자는 ' : '짧은바늘이 가리키는 숫자는 ', B(0), P(p.h, '이에요.', '예요.')], p.h, { bugs: [{ test: (v) => p.m > 0 && v[0] === nx, name: '짧은바늘이 지나온 숫자가 아니라 다음 숫자를 시로 읽음', to: null }] });
  if (!p.m) return nums([...lead, '시계가 나타내는 시각은 ', B(0), '시예요.'], p.h, { bugs: [{ test: (v) => p.h !== 12 && v[0] === 12, name: '긴바늘이 가리키는 숫자를 시로 읽음', to: null }] });
  return nums([...lead, '시계가 나타내는 시각은 ', B(0), '시 ', B(1), '분이에요.'], [p.h, p.m], {
    bugs: [
      { test: (v) => v[0] === nx && v[1] === p.m, name: '짧은바늘이 지나온 숫자가 아니라 다음 숫자를 시로 읽음', to: id === '2-2-4:2' ? '1-2-3:5' : null },
      { test: (v) => v[1] === (k || 12), name: '긴바늘이 가리키는 숫자를 그대로 분으로 읽음', to: null },
      { test: (v) => rest > 0 && k >= 1 && v[1] === 5 * k, name: '작은 눈금을 세지 않음', to: null },
      { test: (v) => k >= 1 && k !== p.h && v[0] === k, name: '긴바늘과 짧은바늘을 바꿔 읽음', to: null },
    ],
  });
};
/* 단계 — 숫자 1 ~ 9는 5단(2학년) · 10 · 11은 5 × 10이 3학년이라 숫자 9까지(5 × 9) 구하고 남은 칸을 5분씩 더함 */
const clockSteps = (p) => {
  const k = Math.floor(p.m / 5), rest = p.m % 5, far = k >= 10;
  return [
    { c: '1-2-3:5', p: { h: p.h, m: p.m, v: 'hr' }, why: "짧은바늘은 두 숫자 사이에 있어요. 지나온 숫자가 '시'예요." },
    k >= 1 ? { c: 'MUL', p: { a: 5, b: far ? 9 : k }, why: far ? `긴바늘이 숫자 ${k}${P(k, '을', '를')} ${rest ? '지났어요' : '가리켜요'}. 먼저 숫자 9까지 몇 분인지 5단으로 구해요.` : `긴바늘이 숫자 ${k}${P(k, '을', '를')} ${rest ? '지났어요' : '가리켜요'}. 숫자 하나를 지날 때마다 5분이에요.` } : null,
    far ? { c: 'ADD', p: { a: 45, b: 5 * (k - 9) }, why: `숫자 ${k}${P(k, '은', '는')} 9에서 숫자 ${k - 9}개를 더 지난 곳이에요. 숫자 하나에 5분씩 더해요.` } : null,
    rest && k >= 1 ? { c: 'ADD', p: { a: 5 * k, b: rest }, why: `작은 눈금 한 칸은 1분이에요. 긴바늘이 숫자 ${k}에서 ${rest}칸을 더 갔어요.` } : null,
  ].filter(Boolean);
};
const apart = (p) => { const a = Math.abs((((p.h % 12) + p.m / 60) * 30) - p.m * 6) % 360; return Math.min(a, 360 - a) >= 15; };   /* 두 바늘이 겹쳐 보이는 시각(4시 22분)은 뺌 */
const genClock = (r) => until(r, (r) => { const h = r.int(1, 12); return { h, m: r.chance(0.35) ? r.pick([5, 10, 15, 20, 25, 35, 40, 45, 50, 55]) : r.int(0, 11) * 5 + r.int(1, 4) }; }, apart);   /* 작은 눈금이 있는 시각을 셋에 둘 · 30분(1학년)은 뺌 */

// ── 2-1-4:5 자로 길이 재기 — 눈금 0에서 시작하지 않는 테이프(끝 눈금을 그대로 읽는지) · 눈금 1에서 시작하는 것은 뺌(끝 숫자 읽기와 선 세기가 같은 답)
function rulerMake(p) {
  const len = p.b - p.a;
  return nums([...figLead('2-1-4:5', p), '색 테이프의 길이는 ', B(0), ' cm예요.'], len, {
    bugs: [{ test: (v) => p.a > 0 && v[0] === p.b, name: '끝 눈금의 숫자를 그대로 읽음', to: null },
      { test: (v) => v[0] === len + 1, name: '칸이 아니라 눈금 선을 셈', to: null }],
  });
}
const genRuler = (r) => { const a = r.chance(0.25) ? 0 : r.int(2, 5); return { a, b: a + r.int(2, Math.min(8, 10 - a)) }; };

// ── 2-2-3:4 길이의 합과 차(m와 cm) — 2학년은 받아올림 · 받아내림이 없는 범위(cm끼리 더해 100 아래 · cm끼리 뺄 수 있는 것) · 받아올림은 3학년 길이와 시간(3-1-5)
const mcm = (a, b) => (a ? `${a} m ${b} cm` : `${b} cm`);
function lenCalcMake(p) {
  const tail = [B(0), ' m ', B(1), ' cm'];
  const plus = p.op === '+', A = plus ? p.a1 + p.a2 : p.a1 - p.a2, C = plus ? p.b1 + p.b2 : p.b1 - p.b2;
  /* m와 cm를 섞음 — cm 수를 m에 더하거나 뺌(1 m 20 cm + 50 cm → 51 m 20 cm) */
  const mix = p.a2 ? [] : [{ test: (v) => v[0] === (plus ? p.a1 + p.b2 : p.a1 - p.b2) && v[1] === p.b1, name: 'm와 cm를 섞어 계산함', to: '2-2-3:2' }];
  return nums([`${mcm(p.a1, p.b1)} ${plus ? '+' : '−'} ${mcm(p.a2, p.b2)} = `, ...tail], [A, C], { bugs: mix });
}
/* 답 칸 차례(m → cm)와 같게 m부터 — 단계 답을 엉뚱한 칸에 옮겨 쓰지 않게(처음 보는 눈 2차) */
const lenCalcSteps = (p) => (p.op === '+'
  ? [p.a2 ? { c: 'ADD', p: { a: p.a1, b: p.a2 }, why: 'm끼리 더해요.' } : null, { c: 'ADD', p: { a: p.b1, b: p.b2 }, why: 'cm끼리 더해요.' }]
  : [p.a2 ? { c: 'SUB', p: { a: p.a1, b: p.a2 }, why: 'm끼리 빼요.' } : null, { c: 'SUB', p: { a: p.b1, b: p.b2 }, why: 'cm끼리 빼요.' }]).filter(Boolean);
const genLenCalc = (r) => {
  const op = r.pick(['+', '+', '−']), step = r.pick([10, 10, 5]), b = (r) => r.int(1, Math.floor(95 / step)) * step, short = r.chance(0.25);
  if (op === '+') return until(r, (r) => ({ op, a1: r.int(1, 5), a2: short ? 0 : r.int(1, 3), b1: b(r), b2: b(r) }), (p) => p.b1 + p.b2 < 100);
  return until(r, (r) => { const a1 = r.int(2, 6); return { op, a1, a2: short ? 0 : r.int(1, a1 - 1), b1: b(r), b2: b(r) }; }, (p) => p.b1 > p.b2);
};

// ── 3-2-3:3 원의 반지름과 지름 — 지름 = 반지름 두 개(둘을 바꿔 생각하는지 · 같다고 보는지) · comp = 컴퍼스를 벌린 길이가 반지름(그림 없이 글로)
function circMake(p) {
  const lead = figLead('3-2-3:3', p), flip = { name: '반지름과 지름을 거꾸로 생각함', to: null }, same = { name: '반지름과 지름이 같다고 봄', to: null };
  if (p.v === 'd2r') return nums([...lead, '이 원의 반지름은 ', B(0), ' cm예요.'], p.r, { bugs: [{ test: (v) => v[0] === 4 * p.r, ...flip }, { test: (v) => v[0] === 2 * p.r, ...same }] });
  return nums(p.v === 'comp' ? [`컴퍼스를 ${p.r} cm만큼 벌려서 원을 그렸어요. 이 원의 지름은 `, B(0), ' cm예요.'] : [...lead, '이 원의 지름은 ', B(0), ' cm예요.'], 2 * p.r, {
    bugs: [{ test: (v) => v[0] === p.r, ...same }, { test: (v) => v[0] * 2 === p.r, ...flip }],
  });
}

// ── 5-1-6:5 1 m² = 10000 cm² — 1 m = 100 cm에서 미루어 100 cm²로 보는지 · cm² → m²는 2 m²부터(1 m²는 도움말이 답을 말하게 됨)
function m2Make(p) {
  const big = p.n * 10000, as100 = { name: '1 m²를 100 cm²로 봄', to: null }, zeros = { name: '0의 개수를 잘못 셈', to: '4-1-1:2' };
  if (p.v === 'cm2m') return nums([`${big} cm² = `, B(0), ' m²'], p.n, { bugs: [{ test: (v) => v[0] === p.n * 100, ...as100 }, { test: (v) => v[0] === p.n * 10 || v[0] === p.n * 1000, ...zeros }] });
  return nums([`${p.n} m² = `, B(0), ' cm²'], big, { bugs: [{ test: (v) => v[0] === p.n * 100, ...as100 }, { test: (v) => v[0] === p.n * 1000 || v[0] === p.n * 100000, ...zeros }] });
}

// ── 5-1-6:8 마름모 · 5-1-6:9 사다리꼴의 넓이 — 마름모는 둘러싼 직사각형의 반 · 사다리꼴은 두 개를 붙인 평행사변형의 반
//   가려내는 수: 마름모는 넓이 = 두 대각선의 합인 크기 피함 · 사다리꼴은 윗변 ≠ 아랫변(같으면 '한 변 × 높이'가 정답과 같음) · 높이 3 이상(2면 괄호를 빠뜨린 식이 같은 값)
function rhomMake(p) {
  return nums([...figLead('5-1-6:8', p), '마름모의 넓이는 ', B(0), ' cm²예요.'], (p.a * p.b) / 2, {
    bugs: [{ test: (v) => v[0] === p.a * p.b, name: '2로 나누지 않음', to: '5-1-6:7' },
      { test: (v) => v[0] === p.a + p.b, name: '두 대각선을 더함', to: null }],
  });
}
function trapMake(p) {
  const { a, b, h } = p, lead = figLead('5-1-6:9', p), half = { name: '2로 나누지 않음', to: '5-1-6:7' }, paren = { name: '윗변과 아랫변을 먼저 더하지 않음(괄호)', to: null };
  if (p.pick) return exprPick([...lead, '사다리꼴의 넓이를 구하는 식을 고르세요.'], [`(${a} + ${b}) × ${h} ÷ 2`, `${a} + ${b} × ${h} ÷ 2`, `(${a} + ${b}) × ${h}`, `${a} × ${b} × ${h} ÷ 2`], [paren, half, { name: '윗변과 아랫변을 곱함', to: null }], p.ord);
  return nums([...lead, '사다리꼴의 넓이는 ', B(0), ' cm²예요.'], ((a + b) * h) / 2, {
    bugs: [{ test: (v) => v[0] === (a + b) * h, ...half },
      { test: (v) => v[0] === a + (b * h) / 2, ...paren },
      { test: (v) => v[0] === (b * h) / 2 || v[0] === (a * h) / 2, name: '윗변과 아랫변 가운데 하나만 씀', to: null },
      { test: (v) => v[0] === b * h || v[0] === a * h, name: '평행사변형처럼 한 변 × 높이로 구함', to: '5-1-6:6' }],
  });
}
const trapSteps = (p) => (p.pick ? [] : [
  { c: 'ADD', p: { a: p.a, b: p.b }, why: '똑같은 사다리꼴 두 개를 붙이면 평행사변형이 돼요. 그 밑변은 윗변 + 아랫변이에요.' },
  { c: 'MUL', p: { a: p.a + p.b, b: p.h }, why: '붙여 만든 평행사변형의 넓이는 밑변 × 높이예요.' },
  { c: 'DIV', p: { a: (p.a + p.b) * p.h, b: 2 }, why: '사다리꼴은 그 평행사변형의 반이에요. 2로 나눠요.' },
]);

// ── 6-2-5:3 원주 · 6-2-5:5 원의 넓이(원주율 3.14) — 반지름 ↔ 지름을 바꿔 쓰는지 · 원주 식과 넓이 식을 섞는지
//   가려내는 수: 원주는 지름 2 · 4 · 8 피함(지름 4 = 넓이와 원주가 같은 값 · 2와 8 = 오답 둘이 같은 값) · 반지름은 3부터(2면 반지름 × 반지름 = 반지름 × 2)
//   × 3.14 단계는 (자연수) × (소수 두 자리) 차시 5-2-4:5로 바로(MUL로 찾으면 3.14를 자연수로 읽음)
//   답 칸에 '(소수)' 표시를 붙이지 않음(noFrac X) — 문제에 원주율 3.14가 있어 소수로 쓰는 것이 보이고, 숫자판의 '.'도 그래서 나옴(app/js/item.js dec)
const x314 = (n) => Math.round(n * 314) / 100, is314 = (v, n) => near(v * 100, n * 314), by314 = (n) => ({ c: '5-2-4:5', p: { a: n, ad: 0, b: 314, bd: 2 } });
function circumMake(p) {
  const lead = figLead('6-2-5:3', p), r = p.r, d = p.v === 'd' ? p.d : 2 * r, toD = { to: '3-2-3:3' };
  if (p.pick) {
    const head = [...lead, '원주를 구하는 식을 고르세요. (원주율: 3.14)'];
    return p.v === 'd'
      ? exprPick(head, [`${d} × 3.14`, `${d} × 2 × 3.14`, `${d} ÷ 2 × 3.14`, `${d} × ${d} × 3.14`], [{ name: '지름을 두 배 함', ...toD }, { name: '지름을 반으로 나눠 곱함', ...toD }, { name: '지름을 두 번 곱함', to: null }], p.ord)
      : exprPick(head, [`${r} × 2 × 3.14`, `${r} × 3.14`, `${r} × ${r} × 3.14`, `${r} ÷ 2 × 3.14`], [{ name: '반지름에 원주율을 곱함(지름으로 바꾸지 않음)', ...toD }, { name: '원주 대신 원의 넓이를 구함', to: null }, { name: '반지름을 반으로 나눠 곱함', ...toD }], p.ord);
  }
  return nums([...lead, '이 원의 원주는 ', B(0), ' cm예요. (원주율: 3.14)'], x314(d), {
    bugs: p.v === 'd' ? [
      { test: (v) => is314(v[0], 2 * d), name: '지름을 두 배 함', ...toD },
      { test: (v) => is314(v[0], d / 2), name: '지름을 반으로 나눠 곱함', ...toD },
      { test: (v) => is314(v[0], (d * d) / 4), name: '원주 대신 원의 넓이를 구함', to: null },
    ] : [
      { test: (v) => is314(v[0], r), name: '반지름에 원주율을 곱함(지름으로 바꾸지 않음)', ...toD },
      { test: (v) => is314(v[0], r * r), name: '원주 대신 원의 넓이를 구함', to: null },
    ],
  });
}
const circumSteps = (p) => (p.pick ? [] : p.v === 'd' ? [{ ...by314(p.d), why: '원주는 지름 × 원주율이에요.' }] : [
  { c: 'MUL', p: { a: p.r, b: 2 }, why: '원주는 지름으로 구해요. 지름은 반지름의 2배예요.' },
  { ...by314(2 * p.r), why: '원주는 지름 × 원주율이에요.' },
]);
function circAreaMake(p) {
  const lead = figLead('6-2-5:5', p), r = p.r, d = 2 * r, ans = x314(r * r), toC = { to: '6-2-5:3' };
  if (p.pick) {
    const head = [...lead, '원의 넓이를 구하는 식을 고르세요. (원주율: 3.14)'];
    return p.v === 'd'
      ? exprPick(head, [`${r} × ${r} × 3.14`, `${d} × ${d} × 3.14`, `${d} × 3.14`, `${r} × 3.14`], [{ name: '지름을 반지름으로 바꾸지 않고 그대로 씀', to: '3-2-3:3' }, { name: '넓이 대신 원주를 구함', ...toC }, { name: '반지름을 한 번만 곱함', to: null }], p.ord)
      : exprPick(head, [`${r} × ${r} × 3.14`, `${r} × 2 × 3.14`, `${r} × 3.14`, `${d} × ${d} × 3.14`], [{ name: '넓이 대신 원주를 구함', ...toC }, { name: '반지름을 한 번만 곱함', to: null }, { name: '반지름 대신 지름을 두 번 곱함', to: '3-2-3:3' }], p.ord);
  }
  return nums([...lead, '이 원의 넓이는 ', B(0), ' cm²예요. (원주율: 3.14)'], ans, {
    bugs: [
      { test: (v) => is314(v[0], d * d), name: p.v === 'd' ? '지름을 반지름으로 바꾸지 않고 그대로 씀' : '반지름 대신 지름을 두 번 곱함', to: '3-2-3:3' },
      { test: (v) => is314(v[0], d), name: '넓이 대신 원주를 구함', ...toC },
      { test: (v) => is314(v[0], r), name: '반지름을 한 번만 곱함', to: null },
    ],
  });
}
const circAreaSteps = (p) => (p.pick ? [] : [
  p.v === 'd' ? { c: 'DIV', p: { a: 2 * p.r, b: 2 }, why: '넓이는 반지름으로 구해요. 반지름은 지름의 반이에요.' } : null,
  { c: 'MUL', p: { a: p.r, b: p.r }, why: '반지름 × 반지름을 먼저 구해요.' },
  { ...by314(p.r * p.r), why: '원의 넓이는 반지름 × 반지름 × 원주율이에요.' },
].filter(Boolean));

export default {
  FAMS: [],
  LESSONS: [
    // ── 1-2-3 모양과 시각
    {
      id: '1-2-3:5', name: '몇 시, 몇 시 30분', kid: '몇 시, 몇 시 30분 읽기', s: 'ME', sec: 12,
      gen: (r) => until(r, (r) => ({ h: r.int(1, 12), m: r.chance(0.4) ? 0 : 30 }), apart),
      make: clockMake('1-2-3:5'), prev: null, pre: ['1-1-5:3', '1-1-5:5'],
      hint: "긴바늘이 12를 가리키면 '몇 시'예요. 짧은바늘이 가리키는 숫자가 '시'예요. 긴바늘이 6을 가리키면 '몇 시 30분'이에요. 이때 짧은바늘은 두 숫자 사이에 있고, 지나온 숫자가 '시'예요.",   /* 시범 · 함께 말은 engine/hints/me.js say(이 문제의 숫자로) */
      tip: "'몇 시 30분'에서 짧은바늘이 다음 숫자에 가까워 보여 그 숫자를 시로 읽는 아이가 많아요. 모형 시계의 긴바늘을 12에서 6까지 돌리며 짧은바늘이 숫자 사이로 조금씩 가는 것을 보여 줘요.",
    },
    // ── 2-1-4 길이 재기
    {
      id: '2-1-4:5', name: '자로 길이 재기', kid: '자로 길이 재기', s: 'ME', sec: 15,
      gen: genRuler, make: rulerMake,
      steps: (p) => (p.a > 0 ? [{ c: 'SUB', p: { a: p.b, b: p.a }, why: `색 테이프가 눈금 ${p.a}에서 눈금 ${p.b}까지 있어요. 끝 눈금에서 시작 눈금을 빼면 1 cm 칸의 수가 나와요.` }] : []),
      prev: null, pre: ['1-1-3:10', '1-2-4:5'],
      hint: '길이는 1 cm 칸이 몇 번 들어가는지예요. 테이프가 눈금 2에서 눈금 7까지 있으면 1 cm 칸이 5번 들어가서 5 cm예요. 끝 눈금의 숫자 7을 그대로 읽으면 안 돼요.',
      tip: "끝 눈금의 숫자를 그대로 읽는 아이는 자의 숫자를 '칸의 수'가 아니라 '이름표'로 봐요. 눈금 0에 맞추지 않은 물건을 재며 1 cm 칸을 손가락으로 하나씩 세게 해요.",
    },
    // ── 2-2-3 길이 재기
    {
      id: '2-2-3:4', name: '길이의 합과 차', kid: '길이 더하기와 빼기 (m와 cm)', s: 'ME', sec: 30,
      gen: genLenCalc, make: lenCalcMake, steps: lenCalcSteps, prev: '2-2-3:2', pre: ['2-1-3:4', '2-1-3:7'],
      hint: 'm는 m끼리, cm는 cm끼리 계산해요. 1 m 20 cm + 2 m 50 cm는 cm끼리 70 cm, m끼리 3 m라서 3 m 70 cm예요.',
      tip: 'm와 cm를 섞어 계산하는지(1 m 20 cm + 50 cm → 51 m 20 cm) 봐요. 같은 단위끼리 줄을 맞춰 세로로 쓰게 해요. cm의 합이 100을 넘는 계산은 3학년(길이와 시간)에서 해요.',
    },
    // ── 2-2-4 시각과 시간
    {
      id: '2-2-4:2', name: '몇 시 몇 분', kid: '몇 시 몇 분 읽기', s: 'ME', sec: 20,
      gen: genClock, make: clockMake('2-2-4:2'), steps: clockSteps, prev: null, pre: ['1-2-3:5', '2-2-2:3'],
      hint: "짧은바늘이 지나온 숫자가 '시'예요. 긴바늘은 숫자 하나를 지날 때마다 5분이라서 숫자 3은 15분이에요. 작은 눈금 한 칸은 1분이에요. 긴바늘이 3에서 작은 눈금 두 칸을 더 가면 17분이에요.",
      tip: '긴바늘이 가리키는 숫자를 그대로 분으로 읽거나(3 → 3분) 짧은바늘이 다음 숫자에 가까울 때 그 숫자를 시로 읽는지 봐요. 긴바늘을 12에서부터 5분씩 뛰어 세게 해요.',
    },
    {
      id: '2-2-4:4', name: '1시간 = 60분', kid: '몇 시간은 몇 분', s: 'ME', sec: 12,
      gen: (r) => ({ v: r.pick(['h2m', 'h2m', 'm2h']), h: r.int(1, 5) }),
      make: hourMake, prev: null, pre: ['1-2-1:2', '2-1-6:4'],
      hint: '시계의 긴바늘이 한 바퀴 도는 동안 60분이 지나요. 그래서 1시간은 60분, 2시간은 60분이 두 번이라 120분이에요.',
      tip: '시계의 긴바늘을 한 바퀴 돌리며 5분씩 세어 60분이 되는 것을 보여 줘요. 100분이 아니라 60분에서 1시간이 돼요.',
    },
    {
      id: '2-2-4:5', name: '몇 시간 몇 분 ↔ 몇 분', kid: '몇 시간 몇 분을 몇 분으로', s: 'ME', sec: 20,
      gen: genConv('hm'), make: convMake, steps: convSteps, prev: '2-2-4:4', pre: ['2-1-3:4', '2-1-3:7'],
      hint: '1시간은 60분이에요. 1시간 25분은 60분과 25분을 더해 85분이에요. 100분이 아니라 60분마다 1시간이에요.',
      tip: '1시간 20분을 120분이라고 쓰는 아이는 1시간을 100분으로 생각해요. 시계 그림에서 60분에 1시간이 되는 것을 다시 짚어요.',
    },
    // ── 3-1-5 길이와 시간
    {
      id: '3-1-5:2', name: '1 km = 1000 m', kid: 'km와 m 바꾸기', s: 'ME', sec: 15,
      gen: (r) => ({ v: r.pick(['join', 'join', 'split']), k: r.int(1, 9), m: r.int(1, 9) }),
      make: kmMake, prev: null, pre: ['2-2-1:3', '2-2-1:5'],
      hint: '1 km는 1000 m예요. 3 km 5 m는 3000 m와 5 m라서 3005 m예요. 빈 자리에는 0을 써요.',
      tip: '1 m = 100 cm와 헷갈려 1 km를 100 m로 쓰는 아이가 많아요. 1000 m가 모여 1 km가 되는 것을 수 모형(천)과 이어 줘요.',
    },
    {
      id: '3-1-5:5', name: '1분 = 60초', kid: '몇 분 몇 초를 몇 초로', s: 'ME', sec: 20,
      gen: genConv('ms'), make: convMake, steps: convSteps, prev: null, pre: ['2-2-4:5'],   /* 앞 차시를 km(3-1-5:2)로 이어 시간을 맞히면 자릿값 · 1 m = 100 cm까지 '앎'이 되던 것(심판 차례 2) */
      hint: '1분은 60초예요. 2분 10초는 120초와 10초를 더해 130초예요.',
      tip: '1시간 = 60분과 같은 꼴이에요. 1분을 100초로 생각해 210초라고 쓰는지 봐요.',
    },
    {
      id: '3-1-5:6', name: '시간의 덧셈', kid: '시간 더하기 (60분이 넘으면 1시간)', s: 'ME', sec: 30,
      gen: (r) => {
        const u = r.pick(['hm', 'hm', 'ms']), v = u === 'hm' && r.chance(0.35) ? 'clock' : 'sum';
        return until(r, (r) => ({ u, v, a1: r.int(1, v === 'clock' ? 9 : 4), b1: r.int(15, 55), a2: r.int(v === 'clock' ? 0 : 1, 3), b2: r.int(15, 55) }), (p) => (p.v !== 'clock' || p.a1 + p.a2 + 1 <= 12) && (p.b1 + p.b2 >= 60 ? p.b1 + p.b2 !== 60 : r.chance(0.2)));   /* 시각은 12시를 넘지 않게 */
      },
      make: addMake, steps: addSteps, prev: '3-1-5:5', pre: ['2-2-4:5', '2-1-3:3'],
      hint: '분은 분끼리, 시간은 시간끼리 더해요. 분이 60이거나 60보다 크면 60분을 1시간으로 바꿔요. 1시간 50분 + 30분은 1시간 80분 = 2시간 20분이에요.',
      tip: '분 합을 그대로 두거나(1시간 80분), 1시간을 올리고 60을 빼지 않는 실수(2시간 80분)를 봐요. 받아올림 덧셈과 같은 생각인데 10이 아니라 60에서 올려요.',
    },
    {
      id: '3-1-5:7', name: '시간의 뺄셈', kid: '시간 빼기 (1시간을 60분으로)', s: 'ME', sec: 30,
      gen: (r) => {
        const u = r.pick(['hm', 'hm', 'ms']), v = u === 'hm' && r.chance(0.35) ? 'dur' : 'diff';
        return until(r, (r) => ({ u, v, a1: r.int(3, 9), b1: r.int(5, 50), a2: r.int(1, 2), b2: r.int(10, 55) }), (p) => p.a1 > p.a2 && (p.b1 < p.b2 ? Math.abs(p.b2 - p.b1) !== 30 : r.chance(0.2)));
      },
      make: subMake, steps: subSteps, prev: '3-1-5:6', pre: ['2-2-4:5', '2-1-3:7'],
      hint: '분끼리 뺄 수 없으면 1시간을 60분으로 바꿔 분에 더한 뒤 빼요. 5시간 20분 − 2시간 45분은 4시간 80분 − 2시간 45분이라서 2시간 35분이에요.',
      tip: '100분을 받아내리거나(2시간 75분), 분끼리 큰 수에서 작은 수를 빼는(3시간 25분) 실수를 봐요. 받아내림 뺄셈의 60진법판이에요.',
    },
    // ── 3-2-3 원
    {
      id: '3-2-3:3', name: '원의 반지름과 지름', kid: '원의 반지름과 지름', s: 'ME', sec: 12,
      gen: (r) => ({ v: r.pick(['r2d', 'r2d', 'd2r', 'd2r', 'comp']), r: r.int(2, 12) }),
      make: circMake,
      steps: (p) => (p.v === 'd2r' ? [{ c: 'DIV', p: { a: 2 * p.r, b: 2 }, why: '반지름은 지름의 반이에요. 지름을 2로 나눠요.' }] : [{ c: 'ADD', p: { a: p.r, b: p.r }, why: `지름은 반지름 두 개를 이은 길이예요. ${p.v === 'comp' ? '컴퍼스를 벌린 길이가 반지름이에요. ' : ''}반지름 두 개를 더해요.` }]),
      prev: null, pre: ['2-2-2:2', '3-1-3:6'],
      hint: '반지름은 원의 중심에서 원 위의 한 점까지 이은 선분이에요. 지름은 원의 중심을 지나 원 위의 두 점을 이은 선분이에요. 지름은 반지름 두 개를 이은 길이예요. 반지름이 5 cm면 지름은 10 cm예요.',
      tip: '반지름과 지름을 바꿔 생각하는지 봐요. 컴퍼스를 벌린 길이가 반지름이라는 것을 원을 직접 그리며 확인해요.',
    },
    // ── 3-2-5 들이와 무게
    {
      id: '3-2-5:3', name: '1 L = 1000 mL', kid: 'L와 mL 바꾸기', s: 'ME', sec: 15,
      gen: (r) => ({ u: 'L', v: r.pick(['join', 'join', 'split']), k: r.int(1, 9), m: r.int(1, 9) }),
      make: bigMake, prev: null, pre: ['2-2-1:3', '2-2-1:5'],
      hint: '1 L는 1000 mL예요. 2 L 7 mL는 2000 mL와 7 mL라서 2007 mL예요. 빈 자리에는 0을 써요.',
      tip: '1 km = 1000 m와 같은 꼴이에요. 우유갑 1 L와 200 mL 컵 다섯 개로 1000 mL를 보여 줘요.',
    },
    {
      id: '3-2-5:4', name: '들이의 덧셈과 뺄셈', kid: 'L와 mL 더하기 · 빼기', s: 'ME', sec: 30,
      gen: genBigCalc('L'), make: bigCalcMake, steps: bigCalcSteps, prev: '3-2-5:3', pre: ['3-1-1:4', '3-1-1:7'],
      hint: 'mL는 mL끼리, L는 L끼리 계산해요. mL끼리 더해 1000 mL가 넘으면 1000 mL를 1 L로 바꿔요. 1 L 600 mL + 2 L 700 mL = 3 L 1300 mL = 4 L 300 mL예요.',
      tip: '시간 계산과 같은 꼴인데 60이 아니라 1000에서 올리고 받아내려요. 3 L 1300 mL처럼 그대로 두거나, 1 L를 100 mL로 받아내리는지 봐요.',
    },
    {
      id: '3-2-5:6', name: '1 kg = 1000 g', kid: 'kg과 g 바꾸기', s: 'ME', sec: 15,
      gen: (r) => ({ u: 'kg', v: r.pick(['join', 'join', 'split']), k: r.int(1, 9), m: r.int(1, 9) }),
      make: bigMake, prev: null, pre: ['2-2-1:3', '2-2-1:5'],
      hint: '1 kg은 1000 g이에요. 3 kg 5 g은 3000 g과 5 g이라서 3005 g이에요.',
      tip: '저울 눈금으로 1000 g이 1 kg이 되는 것을 보여 줘요. 1 kg을 100 g으로 쓰는지 봐요.',
    },
    {
      id: '3-2-5:7', name: '무게의 덧셈과 뺄셈', kid: 'kg과 g 더하기 · 빼기', s: 'ME', sec: 30,
      gen: genBigCalc('kg'), make: bigCalcMake, steps: bigCalcSteps, prev: '3-2-5:6', pre: ['3-1-1:4', '3-1-1:7'],
      hint: 'g은 g끼리, kg은 kg끼리 계산해요. g끼리 뺄 수 없으면 1 kg을 1000 g으로 바꿔요. 5 kg 200 g − 2 kg 700 g = 4 kg 1200 g − 2 kg 700 g = 2 kg 500 g이에요.',
      tip: '들이와 같은 꼴이에요. 1 kg을 100 g으로 받아내리거나, g끼리 큰 수에서 작은 수를 빼는지 봐요.',
    },
    // ── 4-1-2 각도
    {
      id: '4-1-2:5', name: '각도의 합과 차', kid: '각도 더하기 · 빼기', s: 'ME', sec: 20,
      gen: (r) => {
        const v = r.pick(['add', 'sub', 'line', 'line', 'round']);
        if (v === 'add') return until(r, (r) => ({ v, a: m5(r, 15, 150), b: m5(r, 15, 150) }), (p) => p.a + p.b <= 180 && ((p.a % 10) + (p.b % 10) >= 10 || r.chance(0.4)));
        if (v === 'sub') return until(r, (r) => ({ v, a: m5(r, 60, 180), b: m5(r, 15, 150) }), (p) => p.a - p.b >= 15);
        if (v === 'line') return until(r, (r) => ({ v, a: m5(r, 20, 160) }), (p) => p.a !== 90);
        return until(r, (r) => ({ v, a: m5(r, 40, 320) }), (p) => p.a !== 180);
      },
      make: angMake,
      steps: (p) => (p.v === 'line' ? [{ c: 'SUB', p: { a: 180, b: p.a }, why: '직선이 이루는 각은 180°예요. 180°에서 한 각을 빼요.' }] : p.v === 'round' ? [{ c: 'SUB', p: { a: 360, b: p.a }, why: '한 바퀴는 360°예요. 360°에서 한 각을 빼요.' }] : []),
      prev: null, pre: ['3-1-1:4', '3-1-1:7'],
      hint: '각도도 수처럼 더하고 빼요. 직선이 이루는 각은 180°, 한 바퀴는 360°예요. 직선을 두 각으로 나누어 한 각이 65°이면 다른 각은 180° − 65° = 115°예요.',
      tip: '직선을 90°나 360°로 보는지, 한 바퀴를 180°로 보는지 봐요. 종이를 접어 직각 두 개가 직선이 되는 것을 보여 줘요.',
    },
    {
      id: '4-1-2:7', name: '삼각형의 세 각의 합', kid: '삼각형의 나머지 한 각', s: 'ME', sec: 25,
      gen: (r) => until(r, (r) => ({ a: m5(r, 20, 120), b: m5(r, 20, 120) }), (p) => 180 - p.a - p.b >= 15 && p.a + p.b !== 90),
      make: triMake,
      steps: (p) => [{ c: 'ADD', p: { a: p.a, b: p.b }, why: '먼저 아는 두 각을 더해요.' }, { c: 'SUB', p: { a: 180, b: p.a + p.b }, why: '삼각형의 세 각을 모두 더하면 180°예요. 180°에서 두 각의 합을 빼요.' }],
      prev: '4-1-2:5', pre: ['3-1-1:7'],
      hint: '삼각형의 세 각의 크기의 합은 180°예요. 두 각이 50°, 70°이면 나머지 한 각은 180° − 120° = 60°예요.',
      tip: '삼각형의 세 각을 오려 한 점에 모으면 직선이 되는 것을 보여 줘요. 360°에서 빼거나 한 각만 빼는지 봐요.',
    },
    {
      id: '4-1-2:8', name: '사각형의 네 각의 합', kid: '사각형의 나머지 한 각', s: 'ME', sec: 30,
      gen: (r) => until(r, (r) => ({ a: m5(r, 50, 140), b: m5(r, 50, 140), c: m5(r, 50, 140) }), (p) => { const d = 360 - p.a - p.b - p.c; return d >= 40 && d <= 160 && d !== p.a + p.b + p.c - 180; }),
      make: quadMake,
      steps: (p) => [{ c: 'ADD', p: { a: p.a, b: p.b }, why: '먼저 두 각을 더해요.' }, { c: 'ADD', p: { a: p.a + p.b, b: p.c }, why: '세 번째 각도 더해요.' }, { c: 'SUB', p: { a: 360, b: p.a + p.b + p.c }, why: '사각형의 네 각을 모두 더하면 360°예요. 360°에서 세 각의 합을 빼요.' }],
      prev: '4-1-2:7', pre: ['3-1-1:4'],
      hint: '사각형의 네 각의 크기의 합은 360°예요. 사각형은 삼각형 두 개로 나눌 수 있어서 180° + 180°예요.',
      tip: '대각선 하나로 사각형을 삼각형 두 개로 나눠 보여 줘요. 세 각을 더한 것을 답으로 쓰거나 180°에서 생각하는지 봐요.',
    },
    // ── 5-1-6 다각형의 둘레와 넓이
    {
      id: '5-1-6:4', name: '직사각형의 둘레와 넓이', kid: '직사각형의 둘레와 넓이', s: 'ME', sec: 30,
      gen: (r) => until(r, (r) => { const sq = r.chance(0.2), a = r.int(3, 12), b = sq ? a : r.int(2, 9); return { a, b }; }, (p) => p.a * p.b !== 2 * (p.a + p.b) && p.a * p.b !== p.a + p.b && !(p.a === p.b && p.a > 9)),
      make: rectMake,
      steps: (p) => [
        { c: 'ADD', p: { a: p.a, b: p.b }, why: '둘레는 네 변의 길이의 합이에요. 먼저 가로와 세로를 더해요.' },
        { c: 'MUL', p: { a: p.a + p.b, b: 2 }, why: '마주 보는 변은 길이가 같아서 가로 + 세로가 두 번 있어요.' },
        { c: 'MUL', p: { a: p.a, b: p.b }, why: '넓이는 1 cm² 칸이 몇 개인지예요. 가로 × 세로로 구해요.' },
      ],
      prev: null, pre: ['3-1-4:5', '2-2-2:9'],
      hint: '둘레는 네 변의 길이를 모두 더한 것이고, 넓이는 1 cm² 칸이 몇 개인지예요. 가로 7 cm, 세로 4 cm면 둘레는 (7 + 4) × 2 = 22 cm, 넓이는 7 × 4 = 28 cm²예요.',
      tip: '모눈종이에 직사각형을 그리고 테두리를 따라 세기(둘레)와 칸 세기(넓이)를 따로 해 봐요. 둘을 바꿔 쓰거나 둘레를 가로 + 세로로만 쓰는지 봐요.',
    },
    {
      id: '5-1-6:5', name: '1 m² = 10000 cm²', kid: 'm²와 cm² 바꾸기', s: 'ME', sec: 15,
      gen: (r) => { const v = r.pick(['m2cm', 'm2cm', 'cm2m']); return { v, n: r.int(v === 'cm2m' ? 2 : 1, 12) }; },
      make: m2Make,
      steps: (p) => [{ c: 'MUL', p: { a: 100, b: 100 }, why: '1 m는 100 cm라서 1 m²는 한 변이 100 cm인 정사각형의 넓이예요. 가로 × 세로를 구해요.' }, ...(p.v === 'cm2m' ? [{ c: 'DIV', p: { a: p.n * 10000, b: 10000 }, why: '그 넓이가 1 m²예요. 몇 번 들어가는지 나눠요.' }] : p.n > 1 ? [{ c: 'MUL', p: { a: p.n, b: 10000 }, why: `그 넓이가 1 m²예요. ${p.n} m²는 그 ${p.n}배예요.` }] : [])],
      prev: '5-1-6:4', pre: ['4-1-1:2', '4-1-1:4'],
      hint: '1 m²는 한 변이 1 m인 정사각형의 넓이예요. 1 m는 100 cm라서 이 정사각형은 가로 100 cm, 세로 100 cm예요. 100 cm × 100 cm = 10000 cm²라서 1 m² = 10000 cm²예요.',
      tip: '1 m = 100 cm에서 미루어 1 m² = 100 cm²라고 답하는 아이가 많아요. 한 변이 1 m인 정사각형을 바닥에 그리고 1 cm² 칸이 가로로 100개, 세로로 100줄 들어가는 것을 떠올리게 해요.',
    },
    {
      id: '5-1-6:6', name: '평행사변형의 넓이', kid: '평행사변형의 넓이', s: 'ME', sec: 25,
      gen: (r) => until(r, (r) => { const h = r.int(3, 12); return { a: r.int(4, 15), h, s: h + r.int(1, 5) }; }, (p) => p.a * p.h !== 2 * (p.a + p.s) && p.a !== p.s),
      make: paraMake,
      steps: (p) => [{ c: 'MUL', p: { a: p.a, b: p.h }, why: '평행사변형의 넓이는 밑변 × 높이예요. 다른 한 변은 쓰지 않아요.' }],
      prev: '5-1-6:4', pre: ['3-1-4:5'],
      hint: '평행사변형을 잘라 옮기면 밑변과 높이가 같은 직사각형이 돼요. 그래서 넓이는 밑변 × 높이예요. 기울어진 다른 한 변은 곱하지 않아요.',
      tip: '평행사변형을 오려 한쪽 삼각형을 옮겨 직사각형을 만들어 보여 줘요. 밑변 × 다른 한 변으로 구하거나 2로 나누는지 봐요.',
    },
    {
      id: '5-1-6:7', name: '삼각형의 넓이', kid: '삼각형의 넓이', s: 'ME', sec: 25,
      gen: (r) => until(r, (r) => { const h = r.int(3, 12), side = r.chance(0.5); return { a: r.int(4, 16), h, ...(side ? { s: h + r.int(1, 5) } : {}) }; }, (p) => (p.a * p.h) % 2 === 0 && p.s !== p.a),
      make: triAreaMake,
      steps: (p) => [{ c: 'MUL', p: { a: p.a, b: p.h }, why: '똑같은 삼각형 두 개를 붙이면 평행사변형이 돼요. 먼저 밑변 × 높이를 구해요.' }, { c: 'DIV', p: { a: p.a * p.h, b: 2 }, why: '삼각형은 그 평행사변형의 반이에요. 2로 나눠요.' }],
      prev: '5-1-6:6', pre: ['3-2-2:5'],
      hint: '똑같은 삼각형 두 개를 붙이면 평행사변형이 돼요. 그래서 삼각형의 넓이는 밑변 × 높이 ÷ 2예요. 밑변 6 cm, 높이 4 cm면 6 × 4 ÷ 2 = 12 cm²예요.',
      tip: '2로 나누는 것을 빠뜨리거나 높이 대신 다른 변을 쓰는지 봐요. 둔각삼각형은 높이가 삼각형 바깥에 있을 수 있어요.',
    },
    {
      id: '5-1-6:8', name: '마름모의 넓이', kid: '마름모의 넓이', s: 'ME', sec: 25,
      gen: (r) => until(r, (r) => ({ a: r.int(4, 16), b: r.int(3, 12) }), (p) => (p.a * p.b) % 2 === 0 && p.a !== p.b && p.a * p.b !== 2 * (p.a + p.b)),
      make: rhomMake,
      steps: (p) => [{ c: 'MUL', p: { a: p.a, b: p.b }, why: '마름모를 둘러싼 직사각형을 그려요. 가로와 세로는 두 대각선의 길이예요.' }, { c: 'DIV', p: { a: p.a * p.b, b: 2 }, why: '마름모는 그 직사각형의 반이에요. 2로 나눠요.' }],
      prev: '5-1-6:7', pre: ['3-2-2:5'],
      hint: '마름모를 둘러싼 직사각형을 그리면 가로와 세로가 두 대각선의 길이예요. 마름모는 그 직사각형의 반이에요. 그래서 마름모의 넓이는 한 대각선 × 다른 대각선 ÷ 2예요.',
      tip: '2로 나누는 것을 빠뜨리는지 봐요. 색종이로 마름모를 접어 둘러싼 직사각형의 반이 되는 것을 보여 줘요.',
    },
    {
      id: '5-1-6:9', name: '사다리꼴의 넓이', kid: '사다리꼴의 넓이', s: 'ME', sec: 35,
      gen: (r) => ({ ...until(r, (r) => ({ a: r.int(3, 12), b: r.int(4, 16), h: r.int(3, 10) }), (p) => Math.abs(p.a - p.b) >= 2 && Math.min(p.a, p.b) / Math.max(p.a, p.b) >= 0.3 && ((p.a + p.b) * p.h) % 2 === 0), ...pickOr(r, 0.25) }),
      make: trapMake, steps: trapSteps, prev: '5-1-6:8', pre: ['3-1-4:5', '3-2-2:5'],
      hint: '똑같은 사다리꼴 두 개를 거꾸로 붙이면 평행사변형이 돼요. 그 밑변은 윗변 + 아랫변이에요. 그래서 사다리꼴의 넓이는 (윗변 + 아랫변) × 높이 ÷ 2예요.',
      tip: '윗변과 아랫변을 먼저 더하지 않거나 2로 나누는 것을 빠뜨리는지 봐요. 식에 괄호가 왜 필요한지 붙여 만든 평행사변형의 밑변으로 설명해요.',
    },
    // ── 6-1-6 직육면체의 부피와 겉넓이
    {
      id: '6-1-6:3', name: '직육면체의 부피', kid: '직육면체의 부피', s: 'ME', sec: 25,
      gen: genBox, make: volMake,
      steps: (p) => [{ c: 'MUL', p: { a: p.a, b: p.b }, why: '먼저 맨 아래 한 층에 놓인 쌓기나무 수(가로 × 세로)를 구해요.' }, { c: 'MUL', p: { a: p.a * p.b, b: p.c }, why: '이런 층이 높이만큼 쌓여 있어요. 한 층의 수 × 높이를 구해요.' }],
      prev: null, pre: ['3-1-4:5', '3-2-1:4'],
      hint: '부피는 1 cm³ 쌓기나무가 몇 개 들어가는지예요. 가로 × 세로 × 높이로 구해요. 가로 5 cm, 세로 3 cm, 높이 4 cm면 5 × 3 × 4 = 60 cm³예요.',
      tip: '쌓기나무로 한 층(가로 × 세로)을 만들고 높이만큼 쌓아 보여 줘요. 겉넓이를 구하거나 세 모서리를 더하는지 봐요.',
    },
    {
      id: '6-1-6:5', name: '직육면체의 겉넓이', kid: '직육면체의 겉넓이', s: 'ME', sec: 35,
      gen: genBox, make: surfMake,
      steps: (p) => [
        { c: 'MUL', p: { a: p.a, b: p.b }, why: '윗면(가로 × 세로)의 넓이를 구해요.' },
        { c: 'MUL', p: { a: p.b, b: p.c }, why: '옆면(세로 × 높이)의 넓이를 구해요.' },
        { c: 'MUL', p: { a: p.a, b: p.c }, why: '앞면(가로 × 높이)의 넓이를 구해요.' },
        { c: 'ADD', p: { a: p.a * p.b, b: p.b * p.c }, why: '서로 다른 세 면의 넓이를 더해요. 먼저 두 면을 더해요.' },
        { c: 'ADD', p: { a: p.a * p.b + p.b * p.c, b: p.a * p.c }, why: '세 번째 면도 더해요.' },
        { c: 'MUL', p: { a: p.a * p.b + p.b * p.c + p.a * p.c, b: 2 }, why: '마주 보는 면이 하나씩 더 있어요. 세 면의 합을 2배 해요.' },
      ],
      prev: '6-1-6:3', pre: ['5-1-6:4', '3-1-1:4'],
      hint: '겉넓이는 여섯 면의 넓이를 모두 더한 것이에요. 마주 보는 두 면은 똑같아서 서로 다른 세 면의 넓이를 더해 2배 해요.',
      tip: '상자를 펼친 전개도로 여섯 면을 보여 줘요. 부피를 구하거나 세 면만 더하는지 봐요.',
    },
    // ── 6-2-5 원의 둘레와 넓이
    {
      id: '6-2-5:3', name: '원주 구하기', kid: '원주 구하기', s: 'ME', sec: 40,
      gen: (r) => ({ ...(r.chance(0.6) ? { v: 'd', d: r.pick([3, 5, 6, 7, 9, 10, 11, 12, 13, 14, 15]) } : { v: 'r', r: r.int(3, 10) }), ...pickOr(r, 0.35) }),
      make: circumMake, steps: circumSteps, prev: null, pre: ['5-2-4:5', '3-2-3:3'],
      hint: '원주는 원의 둘레예요. 원주는 지름 × 원주율이에요. 반지름을 알면 먼저 반지름 두 개를 이어 지름을 구해요. 지름이 10 cm면 원주는 10 × 3.14 = 31.4 cm예요.',
      tip: '반지름에 바로 원주율을 곱하는지(지름으로 바꾸지 않음), 원의 넓이 식과 섞는지 봐요. 원 모양 물건을 한 바퀴 굴려 지름의 세 배보다 조금 더 가는 것을 보여 줘요.',
    },
    {
      id: '6-2-5:5', name: '원의 넓이 구하기', kid: '원의 넓이 구하기', s: 'ME', sec: 50,
      gen: (r) => { const v = r.pick(['r', 'r', 'd']), rad = r.int(3, 10); return { v, r: rad, ...(v === 'd' ? { d: 2 * rad } : {}), ...pickOr(r, 0.35) }; },
      make: circAreaMake, steps: circAreaSteps, prev: '6-2-5:3', pre: ['5-2-4:5', '3-2-3:3'],
      hint: '원의 넓이는 반지름 × 반지름 × 원주율이에요. 지름을 알면 먼저 반으로 나눠 반지름을 구해요. 반지름이 10 cm면 넓이는 10 × 10 × 3.14 = 314 cm²예요.',
      tip: '지름을 그대로 두 번 곱하거나 원주 식(지름 × 원주율)을 쓰는지 봐요. 원을 잘게 잘라 이어 붙이면 가로가 원주의 반, 세로가 반지름인 직사각형에 가까워지는 것을 보여 줘요.',
    },
  ],
};
