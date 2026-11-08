// 측정(도형과 측정 영역) — 1단계: 시간(60진법)과 큰 단위 바꾸기
//   근거와 오답 꼴은 docs/research/E5_measure.md(조사 11-08) — 시간 계산 오답은 수와 연산 받아올림 · 받아내림 오답의 60진법판
//   가려내는 수: 시간 뺄셈은 분의 차가 30이 아니게(큰 수 − 작은 수와 시 안 줄임이 같은 답) · km는 m를 한 자리로(두 자리면 이어 쓰기 = 1 km를 100 m로)
import { nums, B, J, P } from '../concepts/kit.js';

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
      { test: (v) => s >= 60 && v[0] === p.a1 + p.a2 && v[1] === s, name: `60${U.small}${P(U.small, '이', '가')} 넘어도 1${U.big}${P(U.big, '으로', '로')} 바꾸지 않음`, to: p.u === 'hm' ? '2-2-4:5' : '3-1-5:5' },
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
    bugs: [{ test: (v) => v[0] === Math.floor(T / 100) && v[1] === T % 100, name: '1 km를 100 m로 봄', to: '2-2-3:2' }],
  });
  return nums([`${p.k} km ${p.m} m = `, B(0), ' m'], T, {
    bugs: [{ test: (v) => v[0] === Number(`${p.k}${p.m}`), name: '빈 자리에 0을 쓰지 않음', to: '2-2-1:5' },
      { test: (v) => v[0] === p.k * 100 + p.m, name: '1 km를 100 m로 봄', to: '2-2-3:2' },
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
    bugs: [{ test: (v) => v[0] === Number(`${p.k}${p.m}`), name: '빈 자리에 0을 쓰지 않음', to },
      { test: (v) => v[0] === p.k * 100 + p.m, name: `1 ${B1}${P(B1, '을', '를')} 100 ${S1}${P(S1, '으로', '로')} 봄`, to },
      { test: (v) => v[0] === p.k + p.m, name: '단위를 생각하지 않고 더함', to }],
  });
}
// ── 5-1-6:4 직사각형의 둘레와 넓이(한 문제에 칸 둘) — 넓이 = 둘레인 크기(3 × 6 · 4 × 4) · 넓이 = 가로 + 세로(2 × 2) 피함
function rectMake(p) {
  const per = 2 * (p.a + p.b), area = p.a * p.b, shape = p.a === p.b ? `한 변이 ${p.a} cm인 정사각형` : `가로 ${p.a} cm, 세로 ${p.b} cm인 직사각형`;
  return nums([`${shape}의 둘레는 `, B(0), ' cm, 넓이는 ', B(1), ' cm²예요.'], [per, area], {
    bugs: [{ test: (v) => v[0] === area && v[1] === per, name: '넓이와 둘레를 바꿔 답함', to: null },
      { test: (v) => v[0] === p.a + p.b, name: '둘레를 가로 + 세로로만 셈', to: null },
      { test: (v) => v[1] === per || v[1] === p.a + p.b, name: '넓이 자리에 변의 길이를 더함', to: null }],
  });
}

export default {
  FAMS: [],
  LESSONS: [
    // ── 2-2-4 시각과 시간
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
      make: kmMake, prev: null, pre: ['2-2-1:5', '2-2-3:2'],
      hint: '1 km는 1000 m예요. 3 km 5 m는 3000 m와 5 m라서 3005 m예요. 빈 자리에는 0을 써요.',
      tip: '1 m = 100 cm와 헷갈려 1 km를 100 m로 쓰는 아이가 많아요. 1000 m가 모여 1 km가 되는 것을 수 모형(천)과 이어 줘요.',
    },
    {
      id: '3-1-5:5', name: '1분 = 60초', kid: '몇 분 몇 초를 몇 초로', s: 'ME', sec: 20,
      gen: genConv('ms'), make: convMake, steps: convSteps, prev: '3-1-5:2', pre: ['2-2-4:5'],
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
    // ── 3-2-5 들이와 무게
    {
      id: '3-2-5:3', name: '1 L = 1000 mL', kid: 'L와 mL 바꾸기', s: 'ME', sec: 15,
      gen: (r) => ({ u: 'L', v: r.pick(['join', 'join', 'split']), k: r.int(1, 9), m: r.int(1, 9) }),
      make: bigMake, prev: null, pre: ['3-1-5:2'],
      hint: '1 L는 1000 mL예요. 2 L 7 mL는 2000 mL와 7 mL라서 2007 mL예요. 빈 자리에는 0을 써요.',
      tip: '1 km = 1000 m와 같은 꼴이에요. 우유갑 1 L와 200 mL 컵 다섯 개로 1000 mL를 보여 줘요.',
    },
    {
      id: '3-2-5:6', name: '1 kg = 1000 g', kid: 'kg과 g 바꾸기', s: 'ME', sec: 15,
      gen: (r) => ({ u: 'kg', v: r.pick(['join', 'join', 'split']), k: r.int(1, 9), m: r.int(1, 9) }),
      make: bigMake, prev: '3-2-5:3', pre: ['3-1-5:2'],
      hint: '1 kg은 1000 g이에요. 3 kg 5 g은 3000 g과 5 g이라서 3005 g이에요.',
      tip: '저울 눈금으로 1000 g이 1 kg이 되는 것을 보여 줘요. 1 kg을 100 g으로 쓰는지 봐요.',
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
  ],
};
