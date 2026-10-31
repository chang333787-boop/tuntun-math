// 차시 이름 규칙 시험 — 교과서 차시 이름에 적힌 조건을, 생성 코드와 따로, 아이가 보는 식에서 다시 확인한다
//   왜: 분류기(is)와 생성기(gen)를 같은 사람이 짜면 같이 틀릴 수 있다(10-11 교사 '나누어떨어지는 나눗셈인데 그렇지 않은 숫자가 나오면 안 된다').
//   어떻게: 차시마다 문제를 N개 만들어 화면 글(toText)에서 '수 연산 수'를 읽고, 아래 표의 규칙(차시 이름에서 옮긴 조건)을 모두 지키는지 본다.
//     받아올림 · 받아내림 · 올림 · 내림 · 나머지 · 몫의 자리 수는 이 파일 안에서 따로 계산한다(ops.js 를 쓰지 않음).
//   표에 없는 차시는 '규칙 없음'으로 센다(끝에 몇 개인지 알려 줌). 규칙을 더하려면 RULES 에 차시 id 와 [차시 이름의 말, 확인 함수]를 넣는다.
//   node tests/rules.test.mjs   (N=300)
import { NODES, byId, makeItem } from '../engine/lessons/index.js';
import { rng } from '../engine/math.js';
import { toText } from '../engine/tokens.js';

const N = Number(process.env.N || 300);

// ── 화면 글에서 수 읽기 ──
const NUM = String.raw`\d+ \d+\/\d+|\d+\/\d+|\d+(?:\.\d+)?`;
const EXPR = new RegExp(`(${NUM})\\s*([+−×÷])\\s*(${NUM})(?:\\s*([+−×÷])\\s*(${NUM}))?`);
function val(s) {
  let m;
  if ((m = s.match(/^(\d+) (\d+)\/(\d+)$/))) return { kind: 'mixed', w: +m[1], n: +m[2], d: +m[3], v: +m[1] + m[2] / m[3] };
  if ((m = s.match(/^(\d+)\/(\d+)$/))) return { kind: +m[1] < +m[2] ? 'proper' : 'improper', w: 0, n: +m[1], d: +m[2], v: m[1] / m[2] };
  if (s.includes('.')) return { kind: 'dec', v: Number(s), places: s.split('.')[1].length, int: Number(s.replace('.', '')) };
  return { kind: 'int', v: Number(s) };
}
// 빈칸이 식 가운데 있는 꼴(10 − □ = 1 · □ + 5 = 10) — 등식을 풀어 □ 를 채운 뒤 같은 규칙으로 본다
const HOLE = new RegExp(`(${NUM}|□)\\s*([+−×÷])\\s*(${NUM}|□)\\s*=\\s*(${NUM}|□)`);
function fillHole(text) {
  const m = text.match(HOLE);
  if (!m || [m[1], m[3], m[4]].filter((x) => x === '□').length !== 1 || m[4] === '□') return null;
  const A = m[1] === '□' ? null : val(m[1]).v, B = m[3] === '□' ? null : val(m[3]).v, C = val(m[4]).v, op = m[2];
  let a = A, b = B;
  if (a == null) a = op === '+' ? C - B : op === '−' ? C + B : op === '×' ? C / B : C * B;
  else b = op === '+' ? C - A : op === '−' ? A - C : op === '×' ? C / A : A / C;
  return `${a} ${op} ${b} = `;
}
function readExpr(text) {
  const m = text.match(EXPR) || (fillHole(text) || '').match(EXPR);
  if (!m) return null;
  const out = { a: val(m[1]), op: m[2], b: val(m[3]) };
  if (m[4]) { out.op2 = m[4]; out.c = val(m[5]); }
  return out;
}

// ── 따로 계산하는 도구 ──
const dig = (n, k) => Math.floor(n / 10 ** k) % 10;
const len = (n) => String(n).length;
const isInt = (x) => x.kind === 'int';
const between = (x, lo, hi) => isInt(x) && x.v >= lo && x.v <= hi;
const one = (x) => between(x, 1, 9);
const oneZ = (x) => between(x, 0, 9);
const two = (x) => between(x, 10, 99);
const three = (x) => between(x, 100, 999);
const tens = (x) => two(x) && x.v % 10 === 0;                 // (몇십)
const tensOnes = (x) => two(x) && x.v % 10 !== 0;             // (몇십몇)
function carries(a, b) { let c = 0, n = 0; for (let i = 0; i < Math.max(len(a), len(b)); i++) { const s = dig(a, i) + dig(b, i) + c; c = s >= 10 ? 1 : 0; n += c; } return n; }
function borrows(a, b) { let br = 0, n = 0; for (let i = 0; i < len(a); i++) { const x = dig(a, i) - br, y = dig(b, i); br = x < y ? 1 : 0; n += br; } return n; }
// (여러 자리) × (한 자리) — 자리마다 곱 + 올림 ≥ 10 인 횟수
function mulUps(a, d) { let c = 0, n = 0; for (let i = 0; i < len(a); i++) { const s = dig(a, i) * d + c; c = Math.floor(s / 10); if (s >= 10) n++; } return n; }
const rem = (e) => e.a.v % e.b.v, quo = (e) => Math.floor(e.a.v / e.b.v);
const decPlaces = (x) => (x.kind === 'dec' ? x.places : 0);
const qPlaces = (e) => { const q = e.a.v / e.b.v, s = String(Number(q.toFixed(8))); return s.includes('.') ? s.split('.')[1].length : 0; };
const isMixed = (x) => x.kind === 'mixed';
const isProper = (x) => x.kind === 'proper';
const isFrac = (x) => x.kind === 'proper' || x.kind === 'improper' || x.kind === 'mixed';
const sameDen = (e) => isFrac(e.a) && isFrac(e.b) && e.a.d === e.b.d;

// ── 차시 → [차시 이름에서 옮긴 말, 확인] ──
const R = (say, f) => [say, f];
const RULES = {
  '1-1-3:6': [R('9까지의 덧셈(1학년 1학기)', (e) => e.op === '+' && oneZ(e.a) && oneZ(e.b) && e.a.v + e.b.v <= 9)],
  '1-1-3:10': [R('9까지의 뺄셈', (e) => e.op === '−' && oneZ(e.a) && e.a.v >= e.b.v)],
  '1-2-2:2': [R('(몇십몇)+(몇)', (e) => e.op === '+' && two(e.a) && one(e.b)), R('덧셈과 뺄셈 (1) — 받아올림 없음(1학년 2학기 2단원 범위)', (e) => carries(e.a.v, e.b.v) === 0)],
  '1-2-2:3': [R('(몇십몇)+(몇십몇)', (e) => e.op === '+' && two(e.a) && two(e.b)), R('받아올림 없음(단원 범위)', (e) => carries(e.a.v, e.b.v) === 0)],
  '1-2-2:4': [R('(몇십몇)−(몇)', (e) => e.op === '−' && two(e.a) && one(e.b)), R('받아내림 없음(단원 범위)', (e) => borrows(e.a.v, e.b.v) === 0)],
  '1-2-2:5': [R('(몇십몇)−(몇십몇)', (e) => e.op === '−' && two(e.a) && two(e.b)), R('받아내림 없음(단원 범위)', (e) => borrows(e.a.v, e.b.v) === 0)],
  '1-2-4:4': [R('10이 되는 더하기', (e) => e.op === '+' && e.a.v + e.b.v === 10)],
  '1-2-4:5': [R('10에서 빼기', (e) => e.op === '−' && e.a.v === 10 && one(e.b))],
  '1-2-4:2': [R('세 수의 덧셈', (e) => e.op === '+' && e.op2 === '+' && e.c)],
  '1-2-4:6': [R('10을 만들어 더하기 — 두 수의 합이 10', (e) => e.op === '+' && e.op2 === '+' && e.c && [e.a.v + e.b.v, e.b.v + e.c.v, e.a.v + e.c.v].includes(10))],
  '1-2-6:2': [R('받아올림이 있는 (몇)+(몇)', (e) => e.op === '+' && one(e.a) && one(e.b) && e.a.v + e.b.v > 10)],
  '1-2-6:4': [R('받아내림이 있는 (십몇)−(몇)', (e) => e.op === '−' && between(e.a, 11, 19) && one(e.b) && dig(e.a.v, 0) < e.b.v)],
  '2-1-3:2': [R('받아올림이 있는 (두 자리 수)+(한 자리 수)', (e) => e.op === '+' && two(e.a) && one(e.b) && carries(e.a.v, e.b.v) >= 1)],
  '2-1-3:3': [R('받아올림이 있는 (두 자리 수)+(두 자리 수)', (e) => e.op === '+' && two(e.a) && two(e.b) && carries(e.a.v, e.b.v) >= 1)],
  '2-1-3:4': [R('받아올림이 있는 (두 자리 수)+(두 자리 수)', (e) => e.op === '+' && two(e.a) && two(e.b) && carries(e.a.v, e.b.v) >= 1)],
  '2-1-3:5': [R('받아내림이 있는 (두 자리 수)−(한 자리 수)', (e) => e.op === '−' && two(e.a) && one(e.b) && borrows(e.a.v, e.b.v) >= 1)],
  '2-1-3:6': [R('받아내림이 있는 (몇십)−(몇십몇)', (e) => e.op === '−' && tens(e.a) && tensOnes(e.b) && e.a.v > e.b.v)],
  '2-1-3:7': [R('받아내림이 있는 (두 자리 수)−(두 자리 수)', (e) => e.op === '−' && two(e.a) && two(e.b) && borrows(e.a.v, e.b.v) >= 1)],
  '2-2-2:2': [R('2단', (e) => e.op === '×' && e.a.v === 2 && oneZ(e.b))],
  '2-2-2:3': [R('5단', (e) => e.op === '×' && e.a.v === 5 && oneZ(e.b))],
  '2-2-2:4': [R('3단, 6단', (e) => e.op === '×' && [3, 6].includes(e.a.v) && oneZ(e.b))],
  '2-2-2:5': [R('4단, 8단', (e) => e.op === '×' && [4, 8].includes(e.a.v) && oneZ(e.b))],
  '2-2-2:6': [R('7단', (e) => e.op === '×' && e.a.v === 7 && oneZ(e.b))],
  '2-2-2:7': [R('9단', (e) => e.op === '×' && e.a.v === 9 && oneZ(e.b))],
  '2-2-2:8': [R('1단 곱셈구구와 0의 곱', (e) => e.op === '×' && oneZ(e.a) && oneZ(e.b) && (e.a.v <= 1 || e.b.v === 0))],
  '3-1-1:2': [R('세 자리 수의 덧셈 · 받아올림이 없는 경우', (e) => e.op === '+' && three(e.a) && three(e.b) && carries(e.a.v, e.b.v) === 0)],
  '3-1-1:3': [R('세 자리 수의 덧셈 · 받아올림이 한 번 있는 경우', (e) => e.op === '+' && three(e.a) && three(e.b) && carries(e.a.v, e.b.v) === 1)],
  '3-1-1:4': [R('세 자리 수의 덧셈 · 받아올림이 여러 번 있는 경우', (e) => e.op === '+' && three(e.a) && three(e.b) && carries(e.a.v, e.b.v) >= 2)],
  '3-1-1:5': [R('세 자리 수의 뺄셈 · 받아내림이 없는 경우', (e) => e.op === '−' && three(e.a) && three(e.b) && borrows(e.a.v, e.b.v) === 0)],
  '3-1-1:6': [R('세 자리 수의 뺄셈 · 받아내림이 한 번 있는 경우', (e) => e.op === '−' && three(e.a) && three(e.b) && borrows(e.a.v, e.b.v) === 1)],
  '3-1-1:7': [R('세 자리 수의 뺄셈 · 받아내림이 두 번 있는 경우', (e) => e.op === '−' && three(e.a) && three(e.b) && borrows(e.a.v, e.b.v) === 2)],
  '3-1-3:6': [R('나눗셈의 몫을 곱셈구구로 — 나누어떨어지고 몫이 한 자리', (e) => e.op === '÷' && one(e.b) && rem(e) === 0 && quo(e) <= 9 && quo(e) >= 1)],
  '3-1-4:2': [R('(몇십)×(몇)', (e) => e.op === '×' && ((tens(e.a) && one(e.b)) || (between(e.a, 100, 900) && e.a.v % 100 === 0 && one(e.b))))],
  '3-1-4:3': [R('(몇십몇)×(몇) · 올림이 없는 경우', (e) => e.op === '×' && tensOnes(e.a) && one(e.b) && mulUps(e.a.v, e.b.v) === 0)],
  '3-1-4:4': [R('(몇십몇)×(몇) · 십의 자리에서 올림이 있는 경우', (e) => e.op === '×' && tensOnes(e.a) && one(e.b) && dig(e.a.v, 0) * e.b.v < 10 && dig(e.a.v, 1) * e.b.v >= 10)],
  '3-1-4:5': [R('(몇십몇)×(몇) · 일의 자리에서 올림이 있는 경우', (e) => e.op === '×' && tensOnes(e.a) && one(e.b) && dig(e.a.v, 0) * e.b.v >= 10 && dig(e.a.v, 1) * e.b.v + Math.floor(dig(e.a.v, 0) * e.b.v / 10) < 10)],
  '3-1-4:6': [R('(몇십몇)×(몇) · 올림이 두 번 있는 경우', (e) => e.op === '×' && tensOnes(e.a) && one(e.b) && dig(e.a.v, 0) * e.b.v >= 10 && dig(e.a.v, 1) * e.b.v + Math.floor(dig(e.a.v, 0) * e.b.v / 10) >= 10)],
  '3-2-1:2': [R('(세 자리 수)×(한 자리 수) · 올림이 없는 경우', (e) => e.op === '×' && three(e.a) && one(e.b) && mulUps(e.a.v, e.b.v) === 0)],
  '3-2-1:3': [R('(세 자리 수)×(한 자리 수) · 올림이 한 번 있는 경우', (e) => e.op === '×' && three(e.a) && one(e.b) && mulUps(e.a.v, e.b.v) === 1)],
  '3-2-1:4': [R('(세 자리 수)×(한 자리 수) · 올림이 여러 번 있는 경우', (e) => e.op === '×' && three(e.a) && one(e.b) && mulUps(e.a.v, e.b.v) >= 2)],
  '3-2-1:5': [R('(한 자리 수)×(몇십), (두 자리 수)×(몇십)', (e) => e.op === '×' && (one(e.a) || two(e.a)) && tens(e.b))],
  '3-2-1:6': [R('(한 자리 수)×(몇십몇)', (e) => e.op === '×' && one(e.a) && tensOnes(e.b))],
  '3-2-1:7': [R('(두 자리 수)×(두 자리 수)', (e) => e.op === '×' && two(e.a) && two(e.b))],
  '3-2-1:8': [R('(두 자리 수)×(두 자리 수)', (e) => e.op === '×' && two(e.a) && two(e.b))],
  '3-2-2:2': [R('(몇십)÷(몇) · 내림이 없는 경우 — 나누어떨어짐 · 십의 자리 숫자가 나누어떨어짐', (e) => e.op === '÷' && tens(e.a) && one(e.b) && rem(e) === 0 && dig(e.a.v, 1) % e.b.v === 0)],
  '3-2-2:3': [R('(몇십몇)÷(몇) · 내림이 없는 경우 — 나누어떨어짐', (e) => e.op === '÷' && tensOnes(e.a) && one(e.b) && rem(e) === 0 && dig(e.a.v, 1) % e.b.v === 0)],
  '3-2-2:4': [R('(몇십)÷(몇) · 내림이 있는 경우 — 나누어떨어짐 · 십의 자리에서 내림', (e) => e.op === '÷' && tens(e.a) && one(e.b) && rem(e) === 0 && dig(e.a.v, 1) % e.b.v !== 0)],
  '3-2-2:5': [R('(몇십몇)÷(몇) · 내림이 있는 경우 — 나누어떨어짐 · 십의 자리에서 내림', (e) => e.op === '÷' && tensOnes(e.a) && one(e.b) && rem(e) === 0 && dig(e.a.v, 1) % e.b.v !== 0)],
  '3-2-2:6': [R('나머지가 있는 (몇십몇)÷(몇) · 내림이 없는 경우', (e) => e.op === '÷' && two(e.a) && one(e.b) && rem(e) > 0 && (quo(e) <= 9 || dig(e.a.v, 1) % e.b.v === 0))],
  '3-2-2:7': [R('나머지가 있는 (몇십몇)÷(몇) · 내림이 있는 경우', (e) => e.op === '÷' && two(e.a) && one(e.b) && rem(e) > 0 && quo(e) >= 10 && dig(e.a.v, 1) % e.b.v !== 0)],
  '3-2-2:9': [R('(세 자리 수)÷(한 자리 수) — 나누어떨어짐', (e) => e.op === '÷' && three(e.a) && one(e.b) && rem(e) === 0)],
  '3-2-2:10': [R('나머지가 있는 (세 자리 수)÷(한 자리 수)', (e) => e.op === '÷' && three(e.a) && one(e.b) && rem(e) > 0)],
  '4-1-3:2': [R('세 자리 수에 몇십을 곱하기', (e) => e.op === '×' && three(e.a) && tens(e.b))],
  '4-1-3:3': [R('세 자리 수에 몇십몇을 곱하기', (e) => e.op === '×' && three(e.a) && tensOnes(e.b))],
  '4-1-3:4': [R('몇십으로 나누기', (e) => e.op === '÷' && tens(e.b))],
  '4-1-3:5': [R('몇십몇으로 나누기 · 몫이 한 자리 수', (e) => e.op === '÷' && tensOnes(e.b) && quo(e) >= 1 && quo(e) <= 9)],
  '4-1-3:6': [R('몇십몇으로 나누기 · 몫이 두 자리 수이고 나누어떨어지는 경우', (e) => e.op === '÷' && tensOnes(e.b) && quo(e) >= 10 && quo(e) <= 99 && rem(e) === 0)],
  '4-1-3:7': [R('몇십몇으로 나누기 · 몫이 두 자리 수이고 나머지가 있는 경우', (e) => e.op === '÷' && tensOnes(e.b) && quo(e) >= 10 && quo(e) <= 99 && rem(e) > 0)],
  '4-2-1:2': [R('진분수의 덧셈 — 분모가 같음', (e) => e.op === '+' && isProper(e.a) && isProper(e.b) && sameDen(e))],
  '4-2-1:3': [R('대분수의 덧셈 — 분모가 같음', (e) => e.op === '+' && (isMixed(e.a) || isMixed(e.b)) && sameDen(e))],
  '4-2-1:4': [R('진분수의 뺄셈 — 분모가 같음 · 빼어지는 수가 큼', (e) => e.op === '−' && isProper(e.a) && isProper(e.b) && sameDen(e) && e.a.n > e.b.n)],
  '4-2-1:5': [R('대분수의 뺄셈 · 분수 부분끼리 뺄 수 있는 경우', (e) => e.op === '−' && isMixed(e.a) && sameDen(e) && e.a.n >= e.b.n && e.a.v > e.b.v)],
  '4-2-1:6': [R('자연수와 분수의 뺄셈', (e) => e.op === '−' && isInt(e.a) && isFrac(e.b) && e.a.v > e.b.v)],
  '4-2-1:7': [R('대분수의 뺄셈 · 분수 부분끼리 뺄 수 없는 경우', (e) => e.op === '−' && isMixed(e.a) && sameDen(e) && e.a.n < e.b.n && e.a.v > e.b.v)],
  '4-2-3:8': [R('소수 한 자리 수의 덧셈', (e) => e.op === '+' && decPlaces(e.a) <= 1 && decPlaces(e.b) <= 1 && (decPlaces(e.a) === 1 || decPlaces(e.b) === 1))],
  '4-2-3:9': [R('소수 두 자리 수의 덧셈', (e) => e.op === '+' && Math.max(decPlaces(e.a), decPlaces(e.b)) === 2)],
  '4-2-3:10': [R('소수 한 자리 수의 뺄셈', (e) => e.op === '−' && decPlaces(e.a) <= 1 && decPlaces(e.b) <= 1 && e.a.v > e.b.v)],
  '4-2-3:11': [R('소수 두 자리 수의 뺄셈', (e) => e.op === '−' && Math.max(decPlaces(e.a), decPlaces(e.b)) === 2 && e.a.v > e.b.v)],
  '5-1-5:2': [R('진분수의 덧셈 · 합이 1보다 작은 경우 — 분모가 다름', (e) => e.op === '+' && isProper(e.a) && isProper(e.b) && !sameDen(e) && e.a.v + e.b.v < 1)],
  '5-1-5:3': [R('진분수의 덧셈 · 합이 1보다 큰 경우 — 분모가 다름', (e) => e.op === '+' && isProper(e.a) && isProper(e.b) && !sameDen(e) && e.a.v + e.b.v > 1)],
  '5-1-5:4': [R('대분수의 덧셈 — 분모가 다름', (e) => e.op === '+' && isMixed(e.a) && isMixed(e.b) && !sameDen(e))],
  '5-1-5:5': [R('진분수의 뺄셈 — 분모가 다름', (e) => e.op === '−' && isProper(e.a) && isProper(e.b) && !sameDen(e) && e.a.v > e.b.v)],
  '5-1-5:6': [R('대분수의 뺄셈 · 분수 부분끼리 뺄 수 있는 경우(통분하면)', (e) => e.op === '−' && isMixed(e.a) && isMixed(e.b) && !sameDen(e) && e.a.n / e.a.d >= e.b.n / e.b.d && e.a.v > e.b.v)],
  '5-1-5:7': [R('대분수의 뺄셈 · 분수 부분끼리 뺄 수 없는 경우(통분하면)', (e) => e.op === '−' && isMixed(e.a) && isMixed(e.b) && !sameDen(e) && e.a.n / e.a.d < e.b.n / e.b.d && e.a.v > e.b.v)],
  '5-2-2:2': [R('(진분수)×(자연수)', (e) => e.op === '×' && isProper(e.a) && isInt(e.b))],
  '5-2-2:3': [R('(대분수)×(자연수)', (e) => e.op === '×' && isMixed(e.a) && isInt(e.b))],
  '5-2-2:4': [R('(자연수)×(진분수)', (e) => e.op === '×' && isInt(e.a) && isProper(e.b))],
  '5-2-2:5': [R('(자연수)×(대분수)', (e) => e.op === '×' && isInt(e.a) && isMixed(e.b))],
  '5-2-2:6': [R('진분수의 곱셈', (e) => e.op === '×' && isProper(e.a) && isProper(e.b))],
  '5-2-2:8': [R('(대분수)×(대분수)', (e) => e.op === '×' && isMixed(e.a) && isMixed(e.b))],
  '5-2-4:2': [R('(소수)×(자연수) · 소수 한 자리 수', (e) => e.op === '×' && decPlaces(e.a) === 1 && isInt(e.b))],
  '5-2-4:3': [R('(소수)×(자연수) · 소수 두 자리 수', (e) => e.op === '×' && decPlaces(e.a) === 2 && isInt(e.b))],
  '5-2-4:4': [R('(자연수)×(소수) · 소수 한 자리 수', (e) => e.op === '×' && isInt(e.a) && decPlaces(e.b) === 1)],
  '5-2-4:5': [R('(자연수)×(소수) · 소수 두 자리 수', (e) => e.op === '×' && isInt(e.a) && decPlaces(e.b) === 2)],
  '5-2-4:6': [R('(소수)×(소수) · 소수 한 자리 수', (e) => e.op === '×' && decPlaces(e.a) === 1 && decPlaces(e.b) === 1)],
  '5-2-4:7': [R('(소수)×(소수) · 소수 두 자리 수', (e) => e.op === '×' && e.a.kind === 'dec' && e.b.kind === 'dec' && Math.max(decPlaces(e.a), decPlaces(e.b)) === 2)],
  '6-1-1:4': [R('(분수)÷(자연수) — 진분수 · 가분수(대분수는 6차시)', (e) => e.op === '÷' && (isProper(e.a) || e.a.kind === 'improper') && isInt(e.b) && e.b.v >= 2)],
  '6-1-1:6': [R('(대분수)÷(자연수)', (e) => e.op === '÷' && isMixed(e.a) && isInt(e.b) && e.b.v >= 2)],
  '6-1-3:2': [R('(소수)÷(자연수) · 몫이 1보다 크고 나누어떨어짐', (e) => e.op === '÷' && e.a.kind === 'dec' && isInt(e.b) && e.a.v / e.b.v > 1 && qPlaces(e) <= decPlaces(e.a))],
  '6-1-3:3': [R('(소수)÷(자연수) · 몫이 1보다 큼', (e) => e.op === '÷' && e.a.kind === 'dec' && isInt(e.b) && e.a.v / e.b.v > 1)],
  '6-1-3:4': [R('(소수)÷(자연수) · 몫이 1보다 작은 경우', (e) => e.op === '÷' && e.a.kind === 'dec' && isInt(e.b) && e.a.v / e.b.v < 1)],
  '6-1-3:5': [R('(소수)÷(자연수) · 소수점 아래 0을 내려 계산하는 경우', (e) => e.op === '÷' && e.a.kind === 'dec' && isInt(e.b) && qPlaces(e) > decPlaces(e.a))],
  '6-1-3:6': [R('(소수)÷(자연수) · 몫의 소수 첫째 자리에 0이 있는 경우', (e) => e.op === '÷' && e.a.kind === 'dec' && isInt(e.b) && /\.0/.test(String(Number((e.a.v / e.b.v).toFixed(8)))))],
  '6-1-3:7': [R('(자연수)÷(자연수)의 몫을 소수로 — 나누어떨어지지 않고 유한소수', (e) => e.op === '÷' && isInt(e.a) && isInt(e.b) && rem(e) !== 0 && qPlaces(e) <= 4)],
  '6-2-1:2': [R('분모가 같은 (분수)÷(분수) · 분자끼리 나누어떨어지는 경우', (e) => e.op === '÷' && sameDen(e) && e.a.n % e.b.n === 0 && !isMixed(e.a))],
  '6-2-1:3': [R('분모가 같은 (분수)÷(분수) · 분자끼리 나누어떨어지지 않는 경우', (e) => e.op === '÷' && sameDen(e) && e.a.n % e.b.n !== 0)],
  '6-2-1:4': [R('분모가 다른 (분수)÷(분수)', (e) => e.op === '÷' && isFrac(e.a) && isFrac(e.b) && !sameDen(e))],
  '6-2-1:5': [R('(자연수)÷(분수)', (e) => e.op === '÷' && isInt(e.a) && isFrac(e.b))],
  '6-2-1:7': [R('(대분수)÷(분수)', (e) => e.op === '÷' && isMixed(e.a) && isFrac(e.b) && !isMixed(e.b))],
  '6-2-2:2': [R('(소수 한 자리 수)÷(소수 한 자리 수)', (e) => e.op === '÷' && decPlaces(e.a) === 1 && decPlaces(e.b) === 1)],
  '6-2-2:3': [R('(소수 두 자리 수)÷(소수 두 자리 수)', (e) => e.op === '÷' && decPlaces(e.a) === 2 && decPlaces(e.b) === 2)],
  '6-2-2:4': [R('(소수 두 자리 수)÷(소수 한 자리 수)', (e) => e.op === '÷' && decPlaces(e.a) === 2 && decPlaces(e.b) === 1)],
  '6-2-2:5': [R('(자연수)÷(소수)', (e) => e.op === '÷' && isInt(e.a) && e.b.kind === 'dec')],
};

const bad = [], count = {};
let checked = 0, items = 0;
for (const [id, rules] of Object.entries(RULES)) {
  const L = byId[id];
  if (!L) { bad.push(`${id}: 차시가 없음`); continue; }
  checked++;
  const r = rng(id.split('').reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) >>> 0, 97));
  for (let i = 0; i < N; i++) {
    let it; try { it = makeItem(id, L.gen(r)); } catch (e) { bad.push(`${id}: 만들기 오류 ${e.message}`); break; }
    items++;
    const text = toText(it.prompt), e = readExpr(text);
    if (!e) { (count[id] = count[id] || []).push(`식을 못 읽음: ${text}`); continue; }
    for (const [say, f] of rules) {
      let ok = false; try { ok = f(e); } catch (x) { ok = false; }
      if (!ok) (count[id] = count[id] || []).push(`'${say}' 어김: ${text}`);
    }
  }
}
for (const [id, xs] of Object.entries(count)) bad.push(`${id} (${byId[id].title}) — ${xs.length}/${N}번 · 예: ${[...new Set(xs)].slice(0, 2).join(' / ')}`);
const free = NODES.filter((n) => !RULES[n.id]).length;
for (const m of bad) console.log('FAIL', m);
console.log(`차시 이름 규칙 시험 — 규칙 있는 차시 ${checked}개 · 문제 ${items}개 · 규칙 없는 차시 ${free}개(수 · 규칙 · 비율 · 약수배수 · 문장 차시) · ${bad.length ? 'FAIL ' + bad.length : 'PASS'}`);
process.exit(bad.length ? 1 : 0);
