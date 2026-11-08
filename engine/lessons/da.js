// 자료와 가능성 — 1단계: 평균(조사 docs/research/E7_data.md · 2022 개정 [6수04] · 국가 학업성취도 평균 문항 정답 53~57%)
//   가려내는 수: 평균 · 가운데 값 · 가장 많은 값 · 합 · '0을 빼고 나눈 값'이 서로 다르게(같으면 어느 생각인지 못 가림)
import { nums, B, P } from '../concepts/kit.js';

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
  ],
};
