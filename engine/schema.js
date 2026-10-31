// 이야기 다리 — 문장제 구조 표(유형 · 모르는 자리 · 막대 틀) · 정본 설계 docs/next.md '이야기 다리 설계 초안' · 근거 docs/research/C_word_problems.md
//  words.js storyOf(c, p, seed)가 낸 kind를 읽기만 한다(words.js는 고치지 않음)
//  유형 이름은 연산 이름과 뗀다 [C-9][C-12] — 덧뺄 = 변화 · 부분과 전체 · 비교 / 곱나눗 = 같은 묶음 · 몇 배 · 똑같이 나누기 · 몇씩 덜어 내기 [C ①3]
//  막대 틀 = 유형마다 정해진 그림(변화 처음 → 바뀐 양 → 결과 · 부분-전체 한 막대 · 비교 두 막대 + 차 · 같은 묶음 칸 막대 · 몇 배 두 막대) [C ②5]
//  틀 셋 = 맞는 틀 하나 + 수와 ?를 다르게 놓은 틀 둘 — 틀린 틀은 그 틀이 말하는 답이 맞는 답과 달라야 함(정답이 하나뿐)
//  시험 = app/test/story.test.mjs
import { readItem } from './words.js';
import { txt, val } from './types/kit.js';
import { rng } from './math.js';
import { P } from './concepts/kit.js';

// ── 유형 표 ──
//  kid = 아이 카드 이름 · short = 선생님 프로필 이름(st.story 열쇠) · say = 카드 아래 한 줄(상황을 말함 — 연산 이름 X)
export const TYPES = {
  change: { fam: 'as', kid: '더해지거나 덜어지는 이야기', short: '변화', say: '처음 수에서 무엇이 생기거나 없어져서 수가 바뀌어요.' },
  combine: { fam: 'as', kid: '부분과 전체 이야기', short: '부분과 전체', say: '몇 부분이 모여 전체가 돼요.' },
  compare: { fam: 'as', kid: '두 양을 견주는 이야기', short: '비교', say: '두 양 가운데 어느 쪽이 얼마나 더 많은지 봐요.' },
  groups: { fam: 'md', kid: '같은 수씩 묶는 이야기', short: '같은 묶음', say: '같은 수씩 든 묶음이 여러 개 있어요.' },
  times: { fam: 'md', kid: '몇 배 이야기', short: '몇 배', say: '한 양이 다른 양의 몇 배인지 견줘요.' },
  share: { fam: 'md', kid: '똑같이 나누는 이야기', short: '똑같이 나누기', say: '전체를 똑같이 나누어 한 몫을 봐요.' },
  pack: { fam: 'md', kid: '몇씩 덜어 내는 이야기', short: '몇씩 덜어 내기', say: '전체에서 같은 수씩 덜어 내어 몇 번인지 봐요.' },
};
export const FAMILY = {
  as: { kid: '덧셈 · 뺄셈 이야기', types: ['change', 'combine', 'compare'], ask: '수가 생기거나 없어졌나요? 부분이 모여 전체가 되나요? 두 양을 견주나요?' },
  md: { kid: '곱셈 · 나눗셈 이야기', types: ['groups', 'times', 'share', 'pack'], ask: '같은 수씩 든 묶음이 여럿인가요? 몇 배인가요? 똑같이 나누나요? 같은 수씩 덜어 내나요?' },
};
// words.js kind → 유형(모든 kind를 덮음 — 시험이 확인)
export const KIND_TYPE = { join: 'change', take: 'change', start: 'change', change: 'change', combine: 'combine', part: 'combine', add3: 'combine', diff: 'compare', more: 'compare', less: 'compare', groups: 'groups', rows: 'groups', rate: 'groups', times: 'times', of: 'times', share: 'share', pack: 'pack' };
export const typeOf = (kind) => KIND_TYPE[kind] || null;
const AS_FAMS = new Set(['ADD', 'SUB', 'ADD3', 'F6', 'g4_FMIX', 'g4_DECAS', 'F12', 'g5_MIXADD', 'g5_MIXSUB']);
export const famOfLesson = (L) => (L && AS_FAMS.has(L.fam) ? 'as' : 'md');

// 틀의 자리 이름 — 그림 아래 · 옆에 쓰는 말
export const ROLES = {
  change: { start: '처음', chg: '바뀐 양', res: '결과' },
  combine: { whole: '전체', p0: '부분', p1: '부분', p2: '부분' },
  compare: { big: '큰 쪽', small: '작은 쪽', diff: '차' },
  groups: { total: '전체', size: '한 묶음', count: '묶음 수' },
  share: { total: '전체', size: '한 몫', count: '나누는 수' },
  pack: { total: '전체', size: '한 묶음', count: '묶음 수' },
  times: { base: '기준', big: '견주는 양', tm: '몇 배' },
};

// ── 이야기 하나 → 구조 ──
//  slot = 구조 × 모르는 자리(문제 고르기 열쇠) · R = 자리 → 수 이름(a · b · c = 이야기 속 수 · x = 모르는 수) · dir = 변화의 방향
//  inc = 낱말과 계산이 반대인 이야기(불일치 — '더'가 있는데 빼기 · '적어요'인데 더하기 · '남았어요'인데 처음 · '배'인데 나누기) [C-21][C-23]
const MAP = {
  'join+': { dir: '+', R: { start: 'a', chg: 'b', res: 'x' } },
  'take−': { dir: '−', R: { start: 'a', chg: 'b', res: 'x' } },
  'start+': { dir: '−', R: { start: 'x', chg: 'b', res: 'a' }, inc: true },
  'change−': { dir: '−', R: { start: 'a', chg: 'x', res: 'b' } },
  'combine+': { R: { whole: 'x', p0: 'a', p1: 'b' } },
  'add3+': { R: { whole: 'x', p0: 'a', p1: 'b', p2: 'c' } },
  'part−': { R: { whole: 'a', p0: 'b', p1: 'x' }, inc: true },
  'diff−': { R: { big: 'a', small: 'b', diff: 'x' }, inc: true },
  'more+': { R: { big: 'x', small: 'a', diff: 'b' } },
  'less+': { R: { big: 'x', small: 'a', diff: 'b' }, inc: true },
  'more−': { R: { big: 'a', small: 'x', diff: 'b' }, inc: true },
  'groups×': { R: { size: 'a', count: 'b', total: 'x' } },
  'rows×': { R: { size: 'a', count: 'b', total: 'x' } },
  'rate×': { R: { size: 'a', count: 'b', total: 'x' } },
  'times×': { R: { base: 'a', tm: 'b', big: 'x' } },
  'of×': { R: { base: 'a', tm: 'b', big: 'x' } },
  'share÷': { R: { total: 'a', count: 'b', size: 'x' } },
  'pack÷': { R: { total: 'a', size: 'b', count: 'x' } },
  'timesB÷': { R: { big: 'a', tm: 'b', base: 'x' }, inc: true },
  'timesM÷': { R: { big: 'a', base: 'b', tm: 'x' } },
};
// 문제 고르기 열쇠(같은 구조라도 모르는 자리 · 나머지 해석이 다르면 다른 칸)
export function slotOf(s, op) {
  if (s.kind === 'times' && op === '÷') return s.unit === '배' ? 'timesM÷' : 'timesB÷';
  if (s.kind === 'pack' && s.need) return 'need÷';
  if (s.kind === 'pack' && s.rem) return 'packR÷';
  if (s.kind === 'share' && s.rem) return 'shareR÷';
  return s.kind + op;
}
const baseSlot = (slot) => ({ 'need÷': 'pack÷', 'packR÷': 'pack÷', 'shareR÷': 'share÷' }[slot] || slot);

export function schemaOf(s) {
  const e = readItem(s.steps[1].item);
  if (!e) return null;
  const slot = slotOf(s, e.op), M = MAP[baseSlot(slot)];
  if (!M) return null;
  let R = { ...M.R };
  // 자연수 × 소수(무게) — 이야기는 '한 개의 무게가 (소수) kg인 상자 (자연수)개' → 한 묶음이 뒤의 수
  if (slot === 'groups×' && e.st === 'D' && e.a.n % e.a.d === 0 && e.b.n % e.b.d !== 0) R = { size: 'b', count: 'a', total: 'x' };
  const type = KIND_TYPE[s.kind];
  const v = { a: e.a, b: e.b }; if (e.c) v.c = e.c;
  const xf = s.rem ? s.rem[0] : s.need ? val(s.x) - 1 : val(s.x);   /* 틀의 ?가 말하는 값(올림 · 나머지는 몫) */
  const len = /m(?![a-zA-Z])/.test(String(s.unit)) || /길|짧/.test(JSON.stringify(s.story));
  return { c: s.c, kind: s.kind, op: e.op, slot, type, R, dir: M.dir || null, rem: !!s.rem, need: !!s.need, inc: !!M.inc, v, st: e.st, xf, len, unk: Object.keys(R).find((k) => R[k] === 'x') };
}

// ── 틀 ──
const num = (sc) => Object.fromEntries(Object.entries(sc.v).map(([k, x]) => [k, val(x)]));
export const show = (sc, sym) => (sym === 'x' ? '?' : txt(sc.v[sym], sc.st));
// 틀 f = { R, dir } 가 말하는 ?의 값(수) — 계산이 안 되면 NaN
export function implied(sc, f) {
  const nv = num(sc), R = f.R, g = (role) => nv[R[role]], xr = Object.keys(R).find((k) => R[k] === 'x');
  const fl = (y) => (sc.rem || sc.need ? Math.floor(y + 1e-9) : y);
  switch (sc.type) {
    case 'change': { const sg = f.dir === '+' ? 1 : -1; if (xr === 'res') return g('start') + sg * g('chg'); if (xr === 'start') return g('res') - sg * g('chg'); return sg * (g('res') - g('start')); }
    case 'combine': { const ps = ['p0', 'p1', 'p2'].filter((p) => p in R); if (xr === 'whole') return ps.reduce((t, p) => t + g(p), 0); return g('whole') - ps.filter((p) => p !== xr).reduce((t, p) => t + g(p), 0); }
    case 'compare': if (xr === 'big') return g('small') + g('diff'); if (xr === 'small') return g('big') - g('diff'); return g('big') - g('small');
    case 'groups': case 'share': case 'pack': if (xr === 'total') return g('size') * g('count'); if (xr === 'size') return fl(g('total') / g('count')); return fl(g('total') / g('size'));
    case 'times': if (xr === 'big') return g('base') * g('tm'); if (xr === 'base') return g('big') / g('tm'); return g('big') / g('base');
    default: return NaN;
  }
}
// 보이는 모양이 같으면 같은 틀(부분끼리는 차례가 없음)
export function frameKey(sc, f) {
  const parts = Object.entries(f.R).map(([role, sym]) => [role, show(sc, sym)]);
  const body = sc.type === 'combine' ? [parts.filter(([r]) => r === 'whole'), parts.filter(([r]) => r !== 'whole').map(([, t]) => t).sort()] : parts.sort((x, y) => (x[0] < y[0] ? -1 : 1));
  return JSON.stringify([sc.type, f.dir || '', body]);
}
const near = (x, y) => Math.abs(x - y) < 1e-6 * Math.max(1, Math.abs(y));
function perms(xs) { if (xs.length <= 1) return [xs]; return xs.flatMap((x, i) => perms([...xs.slice(0, i), ...xs.slice(i + 1)]).map((p) => [x, ...p])); }
// 아이가 실제로 헷갈릴 만한 틀이 먼저(값이 말이 되는 것 · 결과 자리에 ? · 방향만 바꿈 · 큰 쪽에 ? …)
function pref(sc, f) {
  const xr = Object.keys(f.R).find((k) => f.R[k] === 'x'), same = Object.keys(f.R).every((k) => f.R[k] === sc.R[k]);
  if (sc.type === 'change') return (same && f.dir !== sc.dir) || (xr === 'res' && sc.unk !== 'res' && f.dir === sc.dir) ? 0 : 1;
  if (sc.type === 'compare') return xr === 'big' && sc.unk !== 'big' ? 0 : xr !== sc.unk ? 1 : 2;
  if (sc.type === 'times') return f.R.base === sc.R.big && f.R.big === sc.R.base ? 0 : 1;
  if (sc.type === 'groups' || sc.type === 'share' || sc.type === 'pack') return xr === 'total' && sc.unk !== 'total' ? 0 : 1;
  return 0;
}
// 틀 셋(맞는 틀 하나 + 틀린 틀 둘 · seed로 섞음) → { list:[{ R, dir, key, x }], right }
export function framesOf(sc, seed = 1) {
  const r = rng(seed), roles = Object.keys(sc.R), syms = roles.map((k) => sc.R[k]);
  const right = { R: sc.R, dir: sc.dir }, rk = frameKey(sc, right), seen = new Set([rk]), cands = [];
  for (const pm of perms(syms)) for (const dir of sc.type === 'change' ? ['+', '−'] : [null]) {
    const f = { R: Object.fromEntries(roles.map((k, i) => [k, pm[i]])), dir }, key = frameKey(sc, f);
    if (seen.has(key)) continue; seen.add(key);
    const x = implied(sc, f);
    if (Number.isFinite(x) && near(x, sc.xf)) continue;   /* 같은 답이 나오는 틀은 '틀린 틀'이 아님 */
    const fine = Number.isFinite(x) && x > 1e-9 && (sc.st !== 'W' || near(x, Math.round(x)));   /* 자연수 이야기면 자연수가 나오는 틀이 그럴듯함 */
    cands.push({ ...f, key, x, bad: fine ? 0 : 1, pr: pref(sc, f), z: r.next() });
  }
  cands.sort((p, q) => p.bad - q.bad || p.pr - q.pr || p.z - q.z);
  const picked = [], take = (test) => { for (const cd of cands) if (picked.length < 2 && !picked.includes(cd) && test(cd)) picked.push(cd); };
  take((cd) => !cd.bad && !picked.some((y) => near(y.x, cd.x)));   /* 그럴듯하고 서로 다른 답을 말하는 틀 먼저 */
  take((cd) => !cd.bad);
  take(() => true);
  const list = r.shuffle([{ ...right, key: rk, x: sc.xf }, ...picked.map(({ R, dir, key, x }) => ({ R, dir, key, x }))]);
  return { list, right: list.findIndex((f) => f.key === rk) };
}

// ── 화면 글(해요체 · 4학년 눈높이 · 연산 이름 X) ──
// 막대 틀을 틀렸을 때 — ?가 왜 거기인지 한 줄
export function whyOf(sc) {
  const L = sc.len;
  switch (sc.slot) {
    case 'join+': return '처음 수에 더 생겼어요. 생긴 뒤의 수를 물으니 <b class="q">?</b>는 <b>결과</b> 자리예요.';
    case 'take−': return '처음 수에서 덜어 냈어요. 남은 수를 물으니 <b class="q">?</b>는 <b>결과</b> 자리예요.';
    case 'start+': return '덜어 내고 남은 수는 알아요. 처음에 있던 수를 물으니 <b class="q">?</b>는 <b>처음</b> 자리예요.';
    case 'change−': return '처음 수와 남은 수는 알아요. 덜어 낸 수를 물으니 <b class="q">?</b>는 <b>바뀐 양</b> 자리예요.';
    case 'combine+': return '부분을 다 알아요. 모두 합한 것을 물으니 <b class="q">?</b>는 <b>전체</b> 자리예요.';
    case 'add3+': return '세 부분을 다 알아요. 모두 합한 것을 물으니 <b class="q">?</b>는 <b>전체</b> 자리예요.';
    case 'part−': return '전체와 한 부분을 알아요. 나머지 한 부분을 물으니 <b class="q">?</b>는 <b>부분</b> 자리예요.';
    case 'diff−': return '두 양을 다 알아요. 얼마나 차이 나는지 물으니 <b class="q">?</b>는 <b>차</b> 자리예요.';
    case 'more+': return `묻는 쪽이 아는 쪽보다 더 ${L ? '길어요' : '많아요'}. 그래서 <b class="q">?</b>는 <b>긴 막대</b>예요.`;
    case 'less+': return `아는 쪽이 더 ${L ? '짧아요' : '적어요'}. 그러니 묻는 쪽이 더 ${L ? '길어요' : '많아요'} — <b class="q">?</b>는 <b>긴 막대</b>예요.`;
    case 'more−': return `아는 쪽이 더 ${L ? '길어요' : '많아요'}. 그러니 묻는 쪽이 더 ${L ? '짧아요' : '적어요'} — <b class="q">?</b>는 <b>짧은 막대</b>예요.`;
    case 'groups×': case 'rows×': return '한 묶음의 수와 묶음 수를 알아요. 모두를 물으니 <b class="q">?</b>는 <b>전체</b> 자리예요.';
    case 'rate×': return '1 m의 무게(한 묶음)와 길이(묶음 수)를 알아요. 전체 무게를 물으니 <b class="q">?</b>는 <b>전체</b> 자리예요.';
    case 'times×': return '기준과 몇 배인지 알아요. 견주는 양을 물으니 <b class="q">?</b>는 <b>견주는 양</b> 자리예요.';
    case 'of×': return '전체와 몇 분의 몇인지 알아요. 그만큼이 얼마인지 물으니 <b class="q">?</b>는 <b>견주는 양</b> 자리예요.';
    case 'timesB÷': return '큰 양이 기준의 몇 배인지 알아요. 기준을 물으니 <b class="q">?</b>는 <b>기준</b>(짧은 막대) 자리예요.';
    case 'timesM÷': return '두 양을 다 알아요. 몇 배인지 물으니 <b class="q">?</b>는 <b>몇 배</b> 자리예요.';
    case 'share÷': return '전체와 몇으로 나누는지 알아요. 한 몫을 물으니 <b class="q">?</b>는 <b>한 몫</b> 자리예요.';
    case 'shareR÷': return '전체와 몇으로 나누는지 알아요. 한 몫과 남는 것을 물으니 <b class="q">?</b>는 <b>한 몫</b>과 남는 자리예요.';
    case 'pack÷': return '전체와 한 번에 덜어 내는 수를 알아요. 몇 번(몇 묶음)인지 물으니 <b class="q">?</b>는 <b>묶음 수</b> 자리예요.';
    case 'packR÷': return '전체와 한 번에 덜어 내는 수를 알아요. 몇 묶음과 남는 것을 물으니 <b class="q">?</b>는 <b>묶음 수</b>와 남는 자리예요.';
    case 'need÷': return '전체와 한 번에 담는 수를 알아요. 몇 묶음인지 보니 <b class="q">?</b>는 <b>묶음 수</b> 자리예요. 남는 것도 꼭 챙겨요.';
    default: return '';
  }
}
// 식을 틀렸을 때 헷갈리게 한 낱말 — 고른 틀린 식의 이름("'더'만 보고 …")에서 · 이야기에 실제로 있는 낱말만
const ALT = { '모두': ['모두', '더하면'] };
export function cueOf(sc, bugName, storyText) {
  let w = null;
  const m = String(bugName || '').match(/^'([^']+)'만 보고/);
  if (m) w = m[1];
  else if (sc.slot === 'timesB÷' && /곱셈을 고름/.test(String(bugName))) w = '배';
  if (!w) return null;
  const words = String(storyText).split(/\s+/).map((x) => x.replace(/[.,?]+$/, ''));
  for (const cand of ALT[w] || [w]) {
    const parts = cand.split(' ').map((x) => x.replace(/(아요|어요)$/, ''));
    if (parts.every((p) => words.some((x) => stem(x).startsWith(p)))) return { word: cand, parts };
  }
  return null;
}
export const stem = (w) => String(w).replace(/[.,?]+$/, '').replace(/^[\d./ ]+/, '');
// 아이가 누른 낱말이 헷갈리게 한 낱말인지
export const isCue = (cue, w) => !!cue && cue.parts.some((p) => stem(w).startsWith(p));
// 그 낱말이 왜 헷갈렸나(두 줄 안)
export function cueWhy(sc, w) {
  const L = sc.len, q = `‘${w}’`;
  switch (sc.slot) {
    case 'diff−': return `${q}${P(w, '이', '가')} 있어도, 묻는 것은 두 양이 <b>얼마나 차이 나는지</b>예요.`;
    case 'more−': return `${q}${P(w, '은', '는')} 아는 쪽이 더 ${L ? '길다' : '많다'}는 말이에요. 묻는 쪽은 <b>더 ${L ? '짧아요' : '적어요'}</b>.`;
    case 'less+': return `${q}${P(w, '은', '는')} 아는 쪽이 더 ${L ? '짧다' : '적다'}는 말이에요. 묻는 쪽은 <b>더 ${L ? '길어요' : '많아요'}</b>.`;
    case 'start+': return `${q}${P(w, '이', '가')} 있어도, 묻는 것은 <b>처음</b> 수예요. 처음 수는 남은 수보다 많아요.`;
    case 'part−': return `${q}${P(w, '은', '는')} 전체를 알려 주는 말이에요. 묻는 것은 <b>한 부분</b>이에요.`;
    case 'timesB÷': return `${q}${P(w, '이', '가')} 있어도, 묻는 것은 <b>기준</b>이 되는 작은 쪽이에요.`;
    default: return `${q}만 보면 헷갈려요. 묻는 것을 끝까지 읽어요.`;
  }
}
// 답을 틀렸을 때(계산은 맞음) — 다시 읽기 한 줄
export function rereadOf(sc) {
  if (sc.need) return '남는 것까지 모두 들어가야 해요. 몫만큼으로는 모자라요.';
  if (sc.rem) return '몫과 남는 수를 따로 써요. 남는 수는 나누는 수보다 작아요.';
  if (sc.slot === 'timesB÷') return '묻는 것은 기준이 되는 작은 쪽이에요. 큰 양보다 작아야 해요.';
  return '묻는 말을 다시 읽고, 내 답이 그 물음에 맞는 수인지 봐요.';
}

// ── 나눠 읽기 — 이야기를 문장 · 마디로 나눔(아는 것 · 모르는 수 · 묻는 것) [C ②4][C-27] ──
//  나누는 곳: 문장 끝(. ?) · 쉼표 · '~는데' · '~더니' · '~면'(앞 마디에 수가 있을 때만 남김 — 수도 물음도 없는 마디는 뒤에 붙임)
const BOUND = /([.?]|,|는데|더니|면)\s+/g;
const hasNum = (toks) => toks.some((t) => typeof t !== 'string' || /\d/.test(t));
const hasAsk = (toks) => toks.some((t) => typeof t === 'string' && /몇|얼마|며칠/.test(t));
export function splitStory(tokens) {
  const ch = [{ toks: [], end: '' }];
  for (const t of tokens || []) {
    if (typeof t !== 'string') { ch[ch.length - 1].toks.push(t); continue; }
    let last = 0, m; BOUND.lastIndex = 0;
    while ((m = BOUND.exec(t))) { ch[ch.length - 1].toks.push(t.slice(last, m.index + m[1].length)); ch[ch.length - 1].end = m[1]; ch.push({ toks: [], end: '' }); last = m.index + m[0].length; }
    if (last < t.length) ch[ch.length - 1].toks.push(t.slice(last));
  }
  const raw = ch.filter((x) => x.toks.some((t) => typeof t !== 'string' || t.trim()));
  let lastDot = -1; raw.forEach((x, i) => { if (x.end === '.') lastDot = i; });
  const out = [];
  let carry = [];
  raw.forEach((x, i) => {
    const toks = [...carry, ...(carry.length ? [' '] : []), ...x.toks]; carry = [];
    if (!hasNum(toks) && !hasAsk(toks) && i < raw.length - 1) { carry = toks; return; }
    const fin = i > lastDot;
    out.push({ toks, tag: fin && hasAsk(toks) ? 'ask' : hasNum(toks) ? 'know' : hasAsk(toks) ? 'unk' : '' });
  });
  return out;
}

// ── 선생님 프로필 — 유형마다 최근 20문제: n 푼 수 · type 유형 · frame 틀 · eq 식 · ans 답(계산까지) · sk 익숙해서 ①②를 건너뜀 ──
//  로그 한 줄 = { t, type, s:[유형, 틀, 식, 계산, 답] } — 유형 · 틀은 1 맞음 · 0 틀림 · null 건너뜀(익숙함 = 맞음으로 셈)
export function profileOf(log, per = 20) {
  const by = {};
  for (const e of [...(log || [])].sort((x, y) => x.t - y.t)) if (e && TYPES[e.type] && Array.isArray(e.s)) (by[e.type] = by[e.type] || []).push(e);
  const out = {};
  for (const [ty, es] of Object.entries(by)) {
    const xs = es.slice(-per), c = (f) => xs.filter(f).length;
    out[TYPES[ty].short] = { n: xs.length, type: c((e) => e.s[0] !== 0), frame: c((e) => e.s[1] !== 0), eq: c((e) => e.s[2] === 1), ans: c((e) => e.s[3] === 1 && e.s[4] === 1), sk: c((e) => e.s[0] == null) };
  }
  return out;
}
// 익숙함 — 그 유형의 마지막 두 문제가 모두 ①② 첫 번에 맞음(또는 건너뛰고 식까지 맞음) → 다음엔 ①②를 건너뜀
export function familiar(log, type) {
  const es = (log || []).filter((e) => e && e.type === type).sort((x, y) => x.t - y.t).slice(-2);
  return es.length === 2 && es.every((e) => (e.s[0] === 1 && e.s[1] === 1) || (e.s[0] == null && e.s[2] === 1));
}
