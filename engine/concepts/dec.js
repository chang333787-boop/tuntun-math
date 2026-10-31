// 소수 (3~4학년) · 약수와 배수 (5학년)
import { nums, pick, fx, B, P, J, tbl } from './kit.js';
import { near, fmt, divisors, gcd, lcm } from '../math.js';

const d2 = (k) => fmt(k / 100), d1 = (k) => fmt(k / 10);
// 배수 고르기의 오답 셋 — 정답보다 작은 수 below개 · 큰 수 나머지(정답 자리가 below번째) · 정답 옆 수만 몰리지 않게 두 배수 사이에 고루
//   그럴듯한 수 먼저: 이웃 배수 ± 1 · 2, n의 약수의 배수(6의 배수에 27 · 9의 배수에 24) · 고르는 차례는 s로(같은 p → 같은 보기)
function g2Wrong(n, right, below, s) {
  const lo = Math.max(n + 1, right - 2 * n), hi = right + 2 * n, fac = [2, 3].filter((f) => n % f === 0 && f < n);
  const score = (x) => (fac.some((f) => x % f === 0) ? 0 : [1, 2, n - 1, n - 2].includes(x % n) ? 1 : 2);
  const side = (a, b) => { const xs = []; for (let x = a; x <= b; x++) if (x % n !== 0) xs.push(x); return xs.sort((x, y) => score(x) - score(y) || ((x * 37 + s) % 11) - ((y * 37 + s) % 11)); };
  const dn = side(lo, right - 1), up = side(right + 1, hi), out = [];
  const take = (xs, k) => { const got = []; for (const x of xs) { if (got.length >= k) break; if (!got.some((y) => Math.abs(y - x) < 2)) got.push(x); } for (const x of xs) { if (got.length >= k) break; if (!got.includes(x)) got.push(x); } return got; };
  const b = Math.min(below, dn.length);
  out.push(...take(dn, b), ...take(up, 3 - b));
  return out;
}

export default [
  {
    id: 'DEC1', name: '소수 한 자리 (0.1이 몇 개)', kid: '0.1이 몇 개', g: '3-1', s: 'DEC', pre: ['F3'],
    tip: '1 cm = 10 mm 자로 0.1 cm = 1 mm를 보여 줘요. 0.7은 0.1이 7개예요.',
    gen: (r) => r.pick([{ v: 'count', n: r.int(2, 9) }, { v: 'frac', n: r.int(1, 9) }, { v: 'units', n: r.int(11, 49) }]),
    make: (p) => {
      if (p.v === 'count') return nums([`0.1이 ${p.n}개이면 `, B(0)], p.n / 10, { noFrac: true, bugs: [{ test: (v) => v[0] === p.n, name: '개수를 그대로 씀', to: 'F3' }, { test: (v) => near(v[0], p.n / 100), name: '0.1과 0.01을 헷갈림', to: 'F3' }] });
      if (p.v === 'frac') return nums([fx(p.n, 10), ' = ', B(0), ' (소수로)'], p.n / 10, { noFrac: true, bugs: [{ test: (v) => v[0] === p.n, name: '분자를 그대로 씀', to: 'F3' }] });
      return nums([`${d1(p.n)}${P(p.n, '은', '는')} 0.1이 `, B(0), '개예요.'], p.n, { bugs: [{ test: (v) => v[0] === p.n % 10, name: '자연수 부분을 빠뜨림', to: 'N4' }] });
    },
  },
  {
    id: 'DEC2', name: '소수 두·세 자리와 자릿값', kid: '0.01이 몇 개', g: '4-2', s: 'DEC', pre: ['DEC1', 'N5'],
    tip: '모눈 100칸 판에서 한 칸 = 0.01. 1.25 = 1 + 0.2 + 0.05로 자리마다 나눠 써요.',
    gen: (r) => r.pick([{ v: 'count', n: r.int(11, 99) }, { v: 'expand', n: r.int(101, 499) }, { v: 'units', n: r.int(11, 99) }, { v: 'frac', n: r.int(11, 99) }]),
    make: (p) => {
      if (p.v === 'count') return nums([`0.01이 ${p.n}개이면 `, B(0)], p.n / 100, { noFrac: true, bugs: [{ test: (v) => near(v[0], p.n / 10), name: '0.01을 0.1로 봄', to: 'DEC1' }] });
      if (p.v === 'expand') {
        const w = Math.floor(p.n / 100), t = Math.floor(p.n / 10) % 10, o = p.n % 10;
        return nums([`${d2(p.n)} = ${w} + ${d1(t)} + `, B(0)], o / 100, { noFrac: true, bugs: [{ test: (v) => near(v[0], o / 10), name: '자리를 하나 올림', to: 'DEC1' }, { test: (v) => v[0] === o, name: '숫자만 씀', to: 'DEC1' }] });
      }
      if (p.v === 'frac') return nums([fx(p.n, 100), ' = ', B(0), ' (소수로)'], p.n / 100, { noFrac: true, bugs: [{ test: (v) => near(v[0], p.n / 10), name: '자리를 하나 올림', to: 'DEC1' }] });
      return nums([`${d2(p.n)}${P(Number(String(d2(p.n)).slice(-1)), '은', '는')} 0.01이 `, B(0), '개예요.'], p.n, { bugs: [{ test: (v) => v[0] === Math.floor(p.n / 10), name: '0.1이 몇 개인지로 셈', to: 'DEC1' }] });
    },
  },
  {
    id: 'DEC3', name: '소수의 크기 비교', kid: '소수 비교', g: '4-2', s: 'DEC', pre: ['DEC2'],
    tip: '0.7과 0.65를 모눈판에 칠해 비교해요. 자리 수가 많다고 크지 않아요.',
    gen: (r) => { const a = r.int(2, 9), b = r.int(11, 99); return Math.floor(b / 10) === a ? { a: a * 10 + (b % 10 >= 5 ? 1 : 9), b } : { a: a * 10, b }; },
    make: (p) => {
      const A = p.a % 10 === 0 ? d1(p.a / 10) : d2(p.a), Bv = d2(p.b);
      const big = p.a > p.b ? 0 : 1;
      return pick(['더 큰 수를 고르세요.'], [[A], [Bv]], big, { bugs: { [1 - big]: { name: '자릿수가 많으면 크다고 봄 (자연수 규칙)', to: 'DEC2' } } });
    },
  },
  {
    id: 'DEC4', name: '소수의 10배·100배·1/10', kid: '소수 10배, 100배', g: '4-2', s: 'DEC', pre: ['DEC2'],
    tip: '수 카드를 자리판에서 한 칸·두 칸 옮겨요. 숫자가 자리를 옮긴다고 보면 까닭이 보여요. 결과는 소수점을 옮긴 것과 같아요(5학년에서는 그렇게 말해요).',
    gen: (r) => ({ v: r.pick(['x10', 'x100', 'd10']), k: r.int(11, 299) }),
    make: (p) => {
      const x = p.k / 100, f = { x10: 10, x100: 100, d10: 0.1 }[p.v], lab = { x10: '10배', x100: '100배', d10: '1/10' }[p.v];
      return nums([`${d2(p.k)}의 ${lab}${p.v === 'd10' ? '은' : '는'} `, B(0)], x * f, {
        noFrac: true,
        bugs: [
          { test: (v) => p.v === 'x100' && near(v[0], x * 10), name: '10배와 100배를 헷갈림', to: 'DEC2' },
          { test: (v) => p.v !== 'd10' && near(v[0], x), name: '0을 붙이면 커진다고 봄 (자연수 규칙)', to: 'DEC2' },
          { test: (v) => p.v === 'd10' && near(v[0], x * 10), name: '1/10을 10배로 봄', to: 'DEC2' },
        ],
      });
    },
  },
  {
    id: 'G1', name: '약수', kid: '약수 찾기', g: '5-1', s: 'G', pre: (p) => ['D4', 'D5'],
    tip: '12를 직사각형 모양으로 늘어놓는 방법(1×12, 2×6, 3×4)을 모두 찾아요. 1과 자기 자신도 약수예요.',
    gen: (r) => ({ v: r.chance(0.5) ? 'count' : 'isnt', n: r.pick([12, 16, 18, 20, 24, 28, 30, 36, 40, 42, 45, 48]), s: r.int(0, 999) }),
    make: (p) => {
      const ds = divisors(p.n);
      if (p.v === 'count') return nums([`${p.n}의 약수는 모두 `, B(0), '개예요.'], ds.length, { bugs: [{ test: (v) => v[0] === ds.length - 1 || v[0] === ds.length - 2, name: '1이나 자기 자신을 빠뜨림', to: 'D4' }] });
      if (p.v === 'list') {
        // 약수 늘어놓기(공약수 · 최대공약수 단계) — 곱해서 n이 되는 짝의 작은 쪽은 보이고 큰 쪽이 빈칸(1 × 36 · 2 × 18 … → 36, 18 …)
        //  큰 짝이 없으면(9 → 1, 3, 9) 가운데 수 · 그것도 없으면(7 → 1, 7) 자기 자신이 빈칸
        const mid = ds.filter((x) => x > 1 && x < p.n), bigs = mid.filter((x) => x * x > p.n), hole = new Set(bigs.length ? bigs : mid.length ? mid : [p.n]);
        const toks = [`${p.n}의 약수를 작은 수부터 모두 쓰면 `], sol = [];
        ds.forEach((x, i) => { if (i) toks.push(', '); if (hole.has(x)) { toks.push(B(sol.length)); sol.push(x); } else toks.push(String(x)); });
        return nums(toks, sol, { bugs: [{ test: (v) => v.some((x, i) => sol[i] != null && x !== sol[i] && p.n % x !== 0), name: '나누어떨어지지 않는 수를 약수로 씀', to: 'D4' }] });
      }
      const cand = []; for (let i = 2; i < p.n; i++) if (p.n % i) cand.push(i);
      const not = cand[p.s % cand.length];
      const yes = ds.filter((x) => x > 1 && x < p.n);
      const three = [yes[p.s % yes.length], yes[(p.s + 1) % yes.length], yes[(p.s + 2) % yes.length]];
      const all = [...new Set(three)];
      while (all.length < 3) all.push(all.length === 1 ? 1 : p.n);
      const ch = [...all.slice(0, 3), not].sort((a, b) => a - b);
      return pick([`${p.n}의 약수가 아닌 것을 고르세요.`], ch.map((x) => [String(x)]), ch.indexOf(not), {});
    },
  },
  {
    id: 'G2', name: '배수', kid: '배수 찾기', g: '5-1', s: 'G', pre: (p) => [tbl(p ? p.n : 2)],
    tip: '배수는 곱셈구구의 한 단이에요. 수 배열표에 4의 배수를 색칠해요.',
    //  is 문항: k = 정답이 놓일 자리(작은 수부터 0~3 · 시드로 정해짐) — k가 없는 옛 문항(10-31까지 저장된 p)은 예전 보기 그대로
    gen: (r) => { const v = r.chance(0.6) ? 'seq' : 'is', n = r.int(3, 9), s = r.int(0, 999); return v === 'is' ? { v, n, s, k: r.int(0, 3) } : { v, n, s }; },
    make: (p) => {
      if (p.v === 'seq') return nums([`${p.n}의 배수를 작은 수부터: ${p.n}, ${p.n * 2}, `, B(0), ', ', B(1)], [p.n * 3, p.n * 4], { bugs: [{ test: (v) => v[0] === p.n * 2 + 1 || v[0] === p.n + 2, name: '배수를 1씩·2씩 늘림', to: 'M2' }] });
      const right = p.n * (3 + (p.s % 6));
      let ch;
      if (p.k == null) { const wrong = [right + 1, right - 2, right + p.n - 1].filter((x) => x % p.n !== 0); ch = [right, ...wrong.slice(0, 3)].sort((a, b) => a - b); }
      else ch = [right, ...g2Wrong(p.n, right, ((p.k % 4) + 4) % 4, p.s)].sort((a, b) => a - b);
      return pick([`${p.n}의 배수를 고르세요.`], ch.map((x) => [String(x)]), ch.indexOf(right), {});
    },
  },
  {
    id: 'G3', name: '최대공약수', kid: '최대공약수', g: '5-1', s: 'G', pre: ['G1'],
    tip: '두 수의 약수를 나란히 쓰고 겹치는 것에 동그라미를 치고, 그중 가장 큰 수를 찾게 해요.',
    gen: (r) => { let g, x, y; do { g = r.int(2, 9); x = r.int(1, 6); y = r.int(2, 7); } while (x === y || gcd(x, y) !== 1 || g * x > 60 || g * y > 60); return { a: g * x, b: g * y }; },
    make: (p) => {
      const g = gcd(p.a, p.b);
      return nums([`${p.a}, ${p.b}의 최대공약수는 `, B(0)], g, {
        bugs: [
          { test: (v) => v[0] < g && g % v[0] === 0, name: '공약수지만 가장 크지 않음', to: 'G1' },
          { test: (v) => v[0] === lcm(p.a, p.b), name: '최소공배수와 헷갈림', to: 'G1' },
        ],
      });
    },
    // 약수를 늘어놓고(빈칸은 짝의 큰 쪽) → 두 줄에 모두 있는 수가 공약수 → 그중 가장 큰 수 · 몇 개인지는 원래 문제에서
    steps: (p) => [
      { c: 'G1', p: { v: 'list', n: p.a }, why: `${p.a}의 약수를 모두 늘어놓아요. 곱해서 ${p.a}${P(p.a, '이', '가')} 되는 두 수를 짝 지어 찾아요.` },
      { c: 'G1', p: { v: 'list', n: p.b }, why: `${p.b}의 약수도 늘어놓아요. 두 줄에 모두 있는 수가 ${p.a}${P(p.a, '과', '와')} ${p.b}의 공약수예요.` },
    ],
  },
  {
    id: 'G4', name: '최소공배수', kid: '최소공배수', g: '5-1', s: 'G', pre: ['G2'],
    tip: '두 수의 배수를 나란히 쓰다 처음 만나는 수예요. 두 수를 곱한 수가 언제나 최소는 아니에요.',
    gen: (r) => { let a, b; do { a = r.int(2, 12); b = r.int(2, 12); } while (a === b || lcm(a, b) > 72 || (r.chance(0.7) && gcd(a, b) === 1)); return { a, b }; },
    make: (p) => {
      const L = lcm(p.a, p.b);
      return nums([`${p.a}, ${p.b}의 최소공배수는 `, B(0)], L, {
        bugs: [
          { test: (v) => v[0] === p.a * p.b && p.a * p.b !== L, name: '두 수를 곱함', to: 'G2' },
          { test: (v) => v[0] === gcd(p.a, p.b), name: '최대공약수와 헷갈림', to: 'G3' },
          { test: (v) => v[0] > L && v[0] % L === 0, name: '공배수지만 가장 작지 않음', to: 'G2' },
        ],
      });
    },
    steps: (p) => [
      { c: 'G2', p: { v: 'seq', n: p.a }, why: `${p.a}의 배수를 늘어놓아요.` },
      { c: 'G2', p: { v: 'seq', n: p.b }, why: `${p.b}의 배수를 늘어놓아요.` },
    ],
  },
];
