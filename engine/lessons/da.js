// 자료와 가능성 — 1단계: 평균(조사 docs/research/E7_data.md · 2022 개정 [6수04] · 국가 학업성취도 평균 문항 정답 53~57%)
//   가려내는 수: 평균 · 가운데 값 · 가장 많은 값 · 합 · '0을 빼고 나눈 값'이 서로 다르게(같으면 어느 생각인지 못 가림)
import { nums, pick, B, P } from '../concepts/kit.js';

const until = (r, make, ok) => { for (let i = 0; i < 600; i++) { const p = make(r); if (ok(p)) return p; } return make(r); };
const sum = (xs) => xs.reduce((a, b) => a + b, 0);
const med = (xs) => { const s = xs.slice().sort((a, b) => a - b); return s.length % 2 ? s[(s.length - 1) / 2] : null; };
const mode = (xs) => { const c = {}; xs.forEach((x) => (c[x] = (c[x] || 0) + 1)); const top = Object.entries(c).sort((a, b) => b[1] - a[1]); return top[0][1] > 1 ? Number(top[0][0]) : null; };
const WHO = [['책', '권', '일주일 동안 읽은'], ['줄넘기', '번', '하루에 한'], ['칭찬 붙임딱지', '장', '한 주에 받은']];

function meanMake(p) {
  const [what, unit, how] = WHO[p.w], n = p.xs.length, m = sum(p.xs) / n, z = p.xs.filter((x) => x !== 0).length;
  return nums([`우리 모둠 ${n}명이 ${how} ${what} 수예요. ${p.xs.map((x) => `${x}${unit}`).join(', ')}`, { br: 1 }, `평균은 `, B(0), `${unit}${P(unit, '이에요', '예요')}.`], m, {
    bugs: [{ test: (v) => v[0] === sum(p.xs), name: '합만 쓰고 나누지 않음', to: '3-1-1:4' },
      { test: (v) => z < n && v[0] === sum(p.xs) / z, name: '0인 값을 빼고 나눔', to: null },
      { test: (v) => med(p.xs) != null && v[0] === med(p.xs), name: '가운데 값을 평균으로 봄', to: null },
      { test: (v) => mode(p.xs) != null && v[0] === mode(p.xs), name: '가장 많은 값을 평균으로 봄', to: null }],
  });
}

// ── 5-2-6:4 평균 활용(빠진 값) — 평균 × 사람 수 = 모두 더한 값 · 거기서 아는 기록을 뺌(E5 — 국가 평가 정답 53 ~ 57%)
//   가려내는 수: 평균 그대로 · (사람 수 − 1)로 곱함 · 아는 값의 합 · 모두 더한 값이 정답과 서로 다르게
function missMake(p) {
  const [what, unit, how] = WHO[p.w], n = p.ks.length + 1, tot = p.m * n, known = sum(p.ks), ans = tot - known;
  return nums([`우리 모둠 ${n}명이 ${how} ${what} 수의 평균은 ${p.m}${unit}${P(unit, '이에요', '예요')}. ${p.ks.length}명은 ${p.ks.map((x) => `${x}${unit}`).join(', ')}${P(unit, '이에요', '예요')}.`, { br: 1 }, '나머지 한 명은 ', B(0), `${unit}${P(unit, '이에요', '예요')}.`], ans, {
    bugs: [{ test: (v) => v[0] === p.m, name: '평균을 그대로 씀', to: '5-2-6:3' },
      { test: (v) => v[0] === p.m * (n - 1) - known, name: '모두 더한 값을 사람 수보다 하나 적게 곱해 구함', to: null },
      { test: (v) => v[0] === known, name: '아는 기록의 합을 답으로 씀', to: null },
      { test: (v) => v[0] === tot, name: '모두 더한 값을 답으로 씀', to: null }],
  });
}
const missSteps = (p) => {
  const n = p.ks.length + 1, out = [{ c: 'MUL', p: { a: p.m, b: n }, why: `평균 × 사람 수 = 모두 더한 값이에요. ${n}명 모두의 기록을 더한 값을 구해요.` }];
  let acc = p.ks[0];
  p.ks.slice(1).forEach((x, i) => { out.push({ c: 'ADD', p: { a: acc, b: x }, why: i === 0 ? '아는 기록을 모두 더해요.' : '아는 기록을 마저 더해요.' }); acc += x; });
  out.push({ c: 'SUB', p: { a: p.m * n, b: acc }, why: '모두 더한 값에서 아는 기록의 합을 빼면 나머지 한 명이에요.' });
  return out;
};

// ── 5-2-6:5 · :7 가능성(말 · 수) · :6 두 주머니 비교 — 주머니(빨간 공 · 파란 공) · 주사위 · 동전
//   G1 '나오거나 안 나오거나라서 반반'(동등확률) · G6 끝(0 · 1)을 거꾸로 · G5 빨간 공의 개수만 견줌(전체 무시)
const WORDS = ['불가능하다', '~아닐 것 같다', '반반이다', '~일 것 같다', '확실하다'];
/* 상황 하나 = { t: 문제 글, lv: 0 불가능 · 1 아닐 것 같다 · 2 반반 · 3 일 것 같다 · 4 확실 } */
function chanceOf(p) {
  if (p.k === 'bag') { const t = `주머니에 빨간 공 ${p.r}개${p.b ? `, 파란 공 ${p.b}개` : ''}가 들어 있어요. 공 한 개를 꺼낼 때 빨간 공이 나올 가능성`; return { t, lv: p.r === 0 ? 0 : p.b === 0 ? 4 : p.r === p.b ? 2 : p.r < p.b ? 1 : 3 }; }   // 조사 고정: '개' 뒤는 늘 '가'
  if (p.k === 'coin') return { t: '동전 한 개를 던질 때 그림 면이 나올 가능성', lv: 2 };
  const D = [['7이 나올 가능성', 0], ['1이 나올 가능성', 1], ['짝수가 나올 가능성', 2], ['2 이상이 나올 가능성', 3], ['6 이하가 나올 가능성', 4]][p.d];
  return { t: `주사위 한 개를 던질 때 ${D[0]}`, lv: D[1] };
}
const genChance = (r, levels) => until(r, (r) => {
  const k = r.pick(['bag', 'bag', 'bag', 'dice', 'coin']);
  if (k === 'bag') { const r0 = r.int(0, 9), b0 = r.int(0, 9); return { k, r: r0, b: b0 }; }
  return k === 'dice' ? { k, d: r.int(0, 4) } : { k };
}, (p) => (p.k !== 'bag' || p.r + p.b >= 2) && levels.includes(chanceOf(p).lv));
function wordMake(p) {
  const { t, lv } = chanceOf(p), bugs = {};
  if (lv !== 2) bugs[2] = { name: '나오거나 안 나오거나라서 반반이라고 봄', to: null };
  if (lv === 0) bugs[4] = { name: '불가능과 확실을 거꾸로 봄', to: null };
  if (lv === 4) bugs[0] = { name: '불가능과 확실을 거꾸로 봄', to: null };
  return pick([`${t}을 말로 나타내면 어느 것일까요?`], WORDS.map((w) => [w]), lv, { bugs });   // 조사 고정: 문제 글은 늘 '가능성'으로 끝남
}
function numMake(p) {
  const { t, lv } = chanceOf(p), right = lv / 2, bugs = {};
  if (right !== 1) bugs[1] = { name: '나오거나 안 나오거나라서 반반이라고 봄', to: null };
  if (right === 0) bugs[2] = { name: '불가능과 확실의 수를 거꾸로 봄', to: null };
  if (right === 2) bugs[0] = { name: '불가능과 확실의 수를 거꾸로 봄', to: null };
  return pick([`${t}을 수로 나타내면 어느 것일까요?`], [['0'], [{ f: [1, 2] }], ['1']], right, { bugs });   // 조사 고정: 문제 글은 늘 '가능성'으로 끝남
}
/* 두 주머니 — 빨간 공이 나올 가능성이 더 큰 쪽 · 개수만 견주면 틀리게(빨간 공이 더 많은 쪽이 가능성은 더 작게) */
function bagsMake(p) {
  const fa = p.ra / (p.ra + p.ba), fb = p.rb / (p.rb + p.bb), right = fa > fb ? 0 : fa < fb ? 1 : 2, bugs = {}, cnt = p.ra > p.rb ? 0 : p.ra < p.rb ? 1 : 2;
  if (cnt !== right) bugs[cnt] = { name: '빨간 공의 개수만 견줌(전체 공 수를 보지 않음)', to: '5-1-4:6' };
  const less = p.ba < p.bb ? 0 : p.ba > p.bb ? 1 : 2;
  if (less !== right && bugs[less] == null) bugs[less] = { name: '파란 공이 적은 쪽만 봄', to: '5-1-4:6' };
  return pick([`가 주머니: 빨간 공 ${p.ra}개, 파란 공 ${p.ba}개`, { br: 1 }, `나 주머니: 빨간 공 ${p.rb}개, 파란 공 ${p.bb}개`, { br: 1 }, '공 한 개를 꺼낼 때 빨간 공이 나올 가능성이 더 큰 주머니는 어느 것일까요?'], [['가 주머니'], ['나 주머니'], ['같아요']], right, { bugs });
}
const genBags = (r) => until(r, (r) => ({ ra: r.int(1, 9), ba: r.int(1, 9), rb: r.int(1, 9), bb: r.int(1, 9) }),
  (p) => { const fa = p.ra / (p.ra + p.ba), fb = p.rb / (p.rb + p.bb); return fa !== fb && p.ra !== p.rb && (p.ra > p.rb) !== (fa > fb); });

export default {
  FAMS: [],
  LESSONS: [
    // ── 5-2-6 평균과 가능성
    {
      id: '5-2-6:3', name: '평균 구하기', kid: '평균 구하기 (모두 더해 사람 수로 나누기)', s: 'DA', sec: 35,
      gen: (r) => until(r, (r) => { const n = r.pick([4, 4, 5]), xs = Array.from({ length: n }, () => (r.chance(0.2) ? 0 : r.int(1, 12))); return { w: r.int(0, WHO.length - 1), xs }; },
        (p) => { const s = sum(p.xs), n = p.xs.length, z = p.xs.filter((x) => x !== 0).length, m = s / n; if (!Number.isInteger(m) || s === 0) return false; const vals = [s, m, med(p.xs), mode(p.xs), z < n ? s / z : null].filter((x) => x != null); return new Set(vals).size === vals.length && m > 0; }),
      make: meanMake,
      steps: (p) => {
        const xs = p.xs, s1 = xs[0] + xs[1], rest = xs.slice(2);
        const out = [{ c: 'ADD', p: { a: xs[0], b: xs[1] }, why: '먼저 모두 더해요. 처음 두 수부터 더해요.' }];
        let acc = s1; rest.forEach((x, i) => { if (x === 0) return; out.push({ c: 'ADD', p: { a: acc, b: x }, why: i === rest.length - 1 ? '마지막 수까지 더해요.' : '다음 수를 더해요.' }); acc += x; });
        out.push({ c: 'DIV', p: { a: acc, b: xs.length }, why: `합을 사람 수 ${xs.length}${P(xs.length, '으로', '로')} 나눠요. 0인 사람도 한 명으로 세요.` });
        return out;
      },
      prev: null, pre: ['3-1-1:4', '3-2-2:3', '4-1-3:5'],
      hint: '평균은 모두 더한 값을 개수로 똑같이 나눈 값이에요. 2, 5, 0, 9의 평균은 (2 + 5 + 0 + 9) ÷ 4 = 4예요. 0도 한 개로 세요.',
      tip: '막대를 고르게 맞추기(높은 막대에서 낮은 막대로 옮기기)로 평균의 뜻을 먼저 보여 줘요. 0인 자료를 빼고 나누거나 가운데 값 · 가장 많은 값을 평균으로 쓰는지 봐요.',
    },
    {
      id: '5-2-6:4', name: '평균 활용 (빠진 값)', kid: '평균으로 빠진 값 구하기', s: 'DA', sec: 45,
      gen: (r) => until(r, (r) => { const k = r.pick([3, 3, 4]), m = r.int(4, 15); return { w: r.int(0, WHO.length - 1), m, ks: Array.from({ length: k }, () => r.int(Math.max(1, m - 6), m + 6)) }; },
        (p) => { const n = p.ks.length + 1, known = sum(p.ks), ans = p.m * n - known, bad = [p.m, p.m * (n - 1) - known, known, p.m * n]; return ans > 0 && ans <= 30 && !bad.includes(ans) && new Set(bad).size === bad.length && !p.ks.includes(ans); }),
      make: missMake, steps: missSteps, prev: '5-2-6:3', pre: ['3-2-1:4', '3-1-1:6', '2-1-3:11'],
      hint: '평균 × 사람 수 = 모두 더한 값이에요. 그 값에서 아는 기록을 모두 빼면 빠진 한 명의 기록이 나와요.',
      tip: '평균을 그대로 쓰거나, 사람 수보다 하나 적게 곱하는지 봐요. 막대를 고르게 맞춘 그림(평균만큼 칸을 채운 막대 n개)에서 모자란 칸을 세게 해요.',
    },
    {
      id: '5-2-6:5', name: '가능성을 말로', kid: '가능성을 말로 나타내기', s: 'DA', sec: 15,
      gen: (r) => genChance(r, [0, 1, 2, 3, 4]), make: wordMake, prev: null, pre: [],
      hint: '꼭 나오면 확실하다, 절대 안 나오면 불가능하다예요. 나올 것과 안 나올 것이 똑같이 많으면 반반이다예요. 빨간 공이 더 많으면 빨간 공이 나올 것 같다예요.',
      tip: "'나오거나 안 나오거나 둘 중 하나니까 반반'이라고 생각하는지 봐요(동등확률). 주머니 속 공을 실제로 늘어놓고 나올 수 있는 것을 세게 해요.",
    },
    {
      id: '5-2-6:6', name: '가능성 비교 (주머니 둘)', kid: '어느 주머니가 더 잘 나올까', s: 'DA', sec: 25,
      gen: genBags, make: bagsMake, prev: '5-2-6:5', pre: ['3-1-6:6', '5-1-4:6'],
      hint: '빨간 공의 개수만 보면 안 돼요. 주머니마다 전체 공 가운데 빨간 공이 얼마나 되는지를 견줘요. 12개 중 3개보다 4개 중 2개가 더 잘 나와요.',
      tip: '빨간 공이 더 많은 주머니를 고르는지 봐요(전체 무시). 두 주머니의 빨간 공을 분수(빨간 공 / 전체)로 써서 크기를 견주게 해요.',
    },
    {
      id: '5-2-6:7', name: '가능성을 수로', kid: '가능성을 0 · 1/2 · 1로', s: 'DA', sec: 15,
      gen: (r) => genChance(r, [0, 2, 4]), make: numMake, prev: '5-2-6:5', pre: ['3-1-6:3', '3-1-6:4'],
      hint: '불가능하면 0, 반반이면 1/2, 확실하면 1이에요. 가능성은 0보다 작거나 1보다 클 수 없어요.',
      tip: '확실한 일을 0으로, 불가능한 일을 1로 거꾸로 쓰는지 봐요. 수직선 0 ~ 1 위에 불가능 · 반반 · 확실을 놓아 보게 해요.',
    },
  ],
};
