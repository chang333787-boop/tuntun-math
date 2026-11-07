// 수 · 덧셈 · 뺄셈 · 혼합 계산 · 약수와 배수 차시의 떠올리기 말 · 더한 단계(engine/hints/index.js 머리말 규칙)
//  cue(p)   이 문제 숫자로 '무슨 생각을 쓰면 되는지' 떠올리게 — 답 X · 단계의 답 X · 90자 안 · 물음꼴
//  steps(p) 차시 정의에 단계가 없는 차시만 — 한 단계 = 빈칸 하나짜리 쉬운 문항(앞 차시 · 사칙 가족)
//           why = 그 단계에서 할 일 한 문장 · 동사로 끝 · 30자 안팎 · 답 X(앞 단계 답은 말해도 됨) · 교사 11-07 '단계적으로 하나씩'
//  plan(p)  풀이 순서 이름 — 그 문제의 stepsOf 단계 수와 같은 개수 · 숫자 없이(10만) · 같은 갈래는 차시가 달라도 같은 이름(아래 TEN_UP · TEN_DOWN …)
//  noSteps  한 번에 보는 것이라 단계로 나누는 뜻이 없는 차시의 까닭 — 그 대신 cue에 쓰는 법(짚어 세기 · 5 먼저 · 높은 자리부터 …)을 담음
//  ※ 1-1-3:6 · 1-1-3:10 · 1-2-4:4 · 1-2-4:5는 가족(ADD · SUB) 단계가 한 자리 수에서 빈 배열이라(ops.js addColumns · subColumns)
//     stepsOf가 등록부 단계를 아직 안 씀(c.stepsRaw를 먼저 봄) — 모으기 · 가르기 단계를 적어 두고 noSteps도 둠
//  ※ 단계가 문제 모양에 따라만 있는 차시: 5-2-1:2 · 3(수직선 고르기 · 이상 · 이하 끝 수는 없음) · 5-2-1:5~7(소수 · 고르기 · 아래가 모두 0이면 없음) · 2-2-3:2(1 m = □ cm)
import { J, P, RO } from '../concepts/kit.js';

const dig = (n, k) => Math.floor(n / 10 ** k) % 10;
const len = (n) => String(Math.trunc(Math.abs(n))).length;
const PL = ['일', '십', '백', '천', '만', '십만', '백만', '천만', '억', '십억', '백억', '천억', '조', '십조', '백조', '천조'];
const at = (k) => `${PL[k]}의 자리`;
const NAT = ['', '하나', '둘', '셋', '넷', '다섯', '여섯', '일곱', '여덟', '아홉'];
const SIN = ['영', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구'];
const ORD = ['', '첫째', '둘째', '셋째', '넷째', '다섯째', '여섯째', '일곱째', '여덟째', '아홉째'];
const qs = (ws) => ws.map((w) => `'${w}'`).join(', ');

// ── 덧셈 · 뺄셈 한 자리
// 이어 세기 — 첫 수를 다시 세는 실수(5 + 3 → 7)를 막는 말까지
const countOn = (a, b) => { const h = Math.max(a, b), l = Math.min(a, b); return `${a === b ? '' : '큰 수 '}${J(h, '을', '를')} 먼저 말하고, 손가락을 하나씩 펴며 ${l}번 이어 세어 봐요.`; };
const splitSub = (a, b) => `빼기는 가르기예요. ${J(a, '을', '를')} ${J(b, '과', '와')} 몇으로 가를 수 있을까요?`;
const zeroCue = (p) => {
  const sub = p.fam === 'SUB';
  if (!sub) return `0은 아무것도 없는 것이에요. ${Math.max(p.a, p.b)}개에 아무것도 더 모으지 않으면 몇 개일까요?`;
  return p.b === 0 ? `0은 아무것도 없는 것이에요. ${p.a}개에서 하나도 덜어 내지 않으면 몇 개가 남을까요?` : `${p.a}개에서 ${p.b}개를 모두 덜어 내면 몇 개가 남을까요?`;
};

// ── 수 세기 · 읽기(N1 · 수 이름)
function countCue(p) {
  const n = p.n;
  if (p.v === 'nat') return n === 1 ? "'하나, 둘, 셋'은 하나씩 짚으며 세는 말이에요. '하나'까지 세면 몇 개를 센 걸까요?" : n <= 5 ? `'하나'부터 세는 말을 하며 하나씩 짚어 봐요. '${NAT[n]}'까지 세면 모두 몇 개일까요?` : `'다섯'까지 세고 ${qs(NAT.slice(6, n + 1))} 하고 이어 세면 모두 몇 개일까요?`;
  if (p.v === 'sin') return n === 1 ? "'일, 이, 삼'은 '하나, 둘, 셋'과 같은 수를 읽는 말이에요. '일'은 어느 말과 같을까요?" : n <= 5 ? `'일, 이, 삼'은 수를 읽는 말이에요. '일'부터 '${SIN[n]}'까지 짚으며 세면 몇이 될까요?` : `'일'부터 '오'까지 세고 ${qs(SIN.slice(6, n + 1))} 하고 이어 세면 몇이 될까요?`;
  return n <= 5 ? '점을 하나씩 짚으며 세어 봐요. 마지막에 센 수가 모두의 수예요.' : '한 줄에 5개씩 있어요. 5개를 먼저 세고 그다음 수부터 이어 세어 봐요.';
}

// ── 모으기 · 가르기(N3)
function n3Cue(p) {
  if (p.v === 'ten') {
    if (p.w === 1) return "'아홉' 다음 수가 '열'이에요. 9 다음 수는 숫자로 어떻게 쓰는지 떠올려 봐요.";
    if (p.w === 2) return '점이 한 줄에 5개씩 있어요. 5개씩 몇 줄인지 보고 세어 볼까요?';
    return '1만큼 더 큰 수는 바로 뒤의 수예요. 수를 차례로 셀 때 9 다음에 오는 수를 떠올려 봐요.';
  }
  const b = p.t - p.a;
  if (p.t >= 11) {
    if (p.v === 'join') return `10을 먼저 만들어 봐요. ${p.a}에 얼마를 더하면 10이 될까요?`;
    return `${J(p.t, '을', '를')} 10과 ${RO(p.t - 10)} 갈라 볼까요? 10에서 ${J(p.a, '을', '를')} 먼저 빼고, 남은 수에 ${J(p.t - 10, '을', '를')} 더해요.`;
  }
  if (p.v === 'join') return countOn(p.a, b);
  if (p.t === 10) return `10칸 틀에 ${p.a}칸을 채우면 빈칸은 몇 칸 남을까요? ${p.a}에서 10까지 이어 세어도 돼요.`;
  return `${p.a}에서 시작해 ${p.t}까지 이어 세어 볼까요? 몇 번 세었는지가 다른 한쪽의 수예요.`;
}

// ── 10개씩 묶음과 낱개(N4) — 읽기 · 쓰기 · 그림
const n4val = (p) => (p.v === 'bundle' || p.v === 'pic' ? p.t * 10 + p.o : p.v === 'tenplus' ? 10 + p.o : p.n);
function n4Cue(p) {
  const n = n4val(p), t = Math.floor(n / 10), o = n % 10;
  if (p.v === 'tenplus') return `십몇은 10과 몇이에요. 10개씩 묶음 1개와 낱개 ${p.o}개를 자리에 맞춰 써 볼까요?`;
  if (p.v === 'split10') return `${J(n, '은', '는')} 10과 몇일까요? 일의 자리 숫자가 낱개의 수예요.`;
  if (p.v === 'bundle') return o ? '10개씩 묶음의 수는 십의 자리에, 낱개의 수는 일의 자리에 써요. 두 자리에 각각 어떤 숫자가 올까요?' : '10개씩 묶음의 수가 십의 자리 숫자예요. 낱개가 없으면 일의 자리에는 무엇을 쓸까요?';
  if (p.v === 'pic') return o ? '묶음은 10씩 뛰어 세고, 이어서 낱개를 하나씩 세어 봐요. 묶음은 십의 자리, 낱개는 일의 자리예요.' : '묶음 하나는 10개예요. 묶음을 하나씩 짚으며 10씩 뛰어 세어 봐요.';
  if (p.v === 'split') return o ? `${n}에서 십의 자리 숫자는 10개씩 묶음의 수, 일의 자리 숫자는 낱개의 수예요.` : `${n}에서 십의 자리 숫자가 10개씩 묶음의 수예요. 묶음은 몇 개일까요?`;
  if (p.v === 'read') {
    if (!o) return p.nat ? `10개씩 묶음 ${t}개예요. ${t <= 5 ? "'열'부터" : "'쉰' 다음부터"} 10씩 늘려 세는 말을 차례로 떠올려 봐요.` : `10개씩 묶음 ${t}개예요. 십의 자리 숫자를 읽고 그 뒤에 '십'을 붙여요.`;
    if (t === 1) return p.nat ? `${J(n, '은', '는')} 10과 ${J(o, '이에요', '예요')}. '열' 뒤에 ${J(o, '을', '를')} 세는 말을 붙여 읽어요.` : `${J(n, '은', '는')} 10과 ${J(o, '이에요', '예요')}. '십' 뒤에 ${J(o, '을', '를')} 읽는 말을 붙여요.`;
    return p.nat ? `${J(n, '은', '는')} 10개씩 묶음 ${t}개와 낱개 ${o}개예요. 묶음을 세는 말 뒤에 낱개를 세는 말을 붙여요.` : `${J(n, '은', '는')} 10개씩 묶음 ${t}개와 낱개 ${o}개예요. 십의 자리 숫자, '십', 일의 자리 숫자 차례로 읽어요.`;
  }
  return '10개씩 묶음은 십의 자리, 낱개는 일의 자리예요. 묶음과 낱개를 따로 세어 봐요.';
}

// ── 수의 순서(g1_SEQ)
const crosses = (terms, dir) => terms.some((x, i) => i < terms.length - 1 && (dir > 0 ? x % 10 === 9 : x % 10 === 0));
function seqCue(p) {
  if (p.v === 'between') {
    const tail = crosses(Array.from({ length: p.b - p.a + 1 }, (_, i) => p.a + i), 1) ? ' 9 다음에는 10개씩 묶음이 하나 늘어요.' : '';
    return tail ? `${p.a} 다음 수부터 ${p.b} 바로 앞의 수까지 하나씩 세어 봐요.${tail}` : `${p.a} 다음 수부터 하나씩 세다가 ${p.b} 앞에서 멈춰요. ${J(p.a, '과', '와')} ${p.b}${P(p.b, '은', '는')} 넣지 않아요.`;
  }
  if (p.v === 'next') {
    if (p.d > 0) return p.n % 10 === 9 ? `바로 뒤의 수는 하나 더 큰 수예요. ${p.n}에 낱개가 하나 더 생기면 낱개 10개가 묶음 하나가 돼요.` : `바로 뒤의 수는 하나 더 큰 수예요. ${p.n}에서 낱개가 하나 더 많은 수를 떠올려 봐요.`;
    return p.n % 10 === 0 ? `바로 앞의 수는 하나 더 작은 수예요. ${p.n}에서 묶음 하나를 낱개 10개로 풀어 하나를 빼 봐요.` : `바로 앞의 수는 하나 더 작은 수예요. ${p.n}에서 낱개가 하나 적은 수를 떠올려 봐요.`;
  }
  if (p.v === 'grid') return '수 배열표에서 오른쪽으로 한 칸 가면 1씩, 아래로 한 칸 가면 10씩 커져요. 빈칸의 옆이나 위의 수를 보세요.';
  const terms = Array.from({ length: p.n }, (_, i) => p.a + p.dir * i), first = p.miss.includes(0) && p.miss.length === 1;
  const head = p.dir > 0
    ? (first ? '수가 하나씩 커져요. 맨 앞 빈칸은 바로 뒤의 수보다 하나 작은 수예요.' : '수가 하나씩 커져요. 빈칸 바로 앞의 수에서 하나 더 센 수를 떠올려 봐요.')
    : (first ? '수가 하나씩 작아져요. 맨 앞 빈칸은 바로 뒤의 수보다 하나 큰 수예요.' : '수가 하나씩 작아져요. 빈칸 바로 앞의 수에서 거꾸로 하나 센 수를 떠올려 봐요.');
  if (!crosses(terms, p.dir)) return head;
  return `${head.replace(/^수가 하나씩 \S+ /, '')} ${p.dir > 0 ? '9 다음에는 10개씩 묶음이 하나 늘어요.' : '0 다음에는 10개씩 묶음이 하나 줄고 낱개는 9개가 돼요.'}`;   /* 두 문장 안 — 묶음이 바뀌는 말을 넣으면 '하나씩 커져요'는 뺌 */
}
// 묶음과 낱개 문항 — 값이 10이면 가족 해석이 100까지의 수 차시(뒤 차시)로 가므로 십몇 알기 차시로 둠 · n = 풀이 순서 이름(숫자 없이)
const n4 = (p, why, n) => ({ c: p.t * 10 + (p.o || 0) === 10 || p.n === 10 ? '1-1-5:3' : 'N4', p, why, n });
// 묶음과 낱개로 '하나 더 · 하나 덜'(v → v + d) · src = 어느 수에서 세는지(prev 앞의 수 · next 뒤의 수 · 그 수)
function nextStep(v, d, src) {
  const T = Math.floor(v / 10), o = v % 10, who = src === 'next' ? '뒤의 수' : src === 'prev' ? '앞의 수' : '그 수';
  if (d > 0) return o === 9 ? n4({ v: 'bundle', t: T, o: 10 }, `${v}에 낱개 하나를 더해 묶음을 만들어요.`, `${who}에 낱개 하나 더해 묶음 만들기`) : n4({ v: 'bundle', t: T, o: o + 1 }, `${v}에 낱개 하나를 더해요.`, `${who}에 낱개 하나 더하기`);
  return o === 0 ? n4({ v: 'bundle', t: T - 1, o: 9 }, `${v}의 묶음 하나를 풀어 낱개 하나를 빼요.`, `${who}의 묶음 하나 풀어 낱개 하나 빼기`) : n4({ v: 'bundle', t: T, o: o - 1 }, `${v}에서 낱개 하나를 빼요.`, `${who}에서 낱개 하나 빼기`);
}
function seqSteps(p) {
  if (p.v === 'next') return [nextStep(p.n, p.d, 'self')];
  if (p.v === 'between') { const out = []; for (let x = p.a; x < p.b - 1; x++) out.push(nextStep(x, 1, 'prev')); return out; }
  if (p.v === 'grid') {
    const cells = [p.x, p.x + 1, p.x + 2, p.x + 10, p.x + 11, p.x + 12], top = p.miss.filter((m) => m < 3), out = [];
    for (const m of top) out.push(m > 0 && !top.includes(m - 1) ? nextStep(cells[m - 1], 1, 'prev') : nextStep(cells[m + 1], -1, 'next'));
    for (const m of p.miss.filter((x) => x >= 3)) { const up = cells[m - 3]; out.push(n4({ v: 'bundle', t: Math.floor(up / 10) + 1, o: up % 10 }, `위 칸 ${up}에 10개씩 묶음 하나를 더해요.`, '위 칸에 10개씩 묶음 하나 더하기')); }
    return out;
  }
  const terms = Array.from({ length: p.n }, (_, i) => p.a + p.dir * i), known = new Set(terms.map((_, i) => i).filter((i) => !p.miss.includes(i))), out = [];
  for (let k = 0; k < terms.length && known.size < terms.length; k++) {
    for (const i of p.miss) {
      if (known.has(i)) continue;
      if (i > 0 && known.has(i - 1)) { out.push(nextStep(terms[i - 1], p.dir, 'prev')); known.add(i); } else if (i < terms.length - 1 && known.has(i + 1)) { out.push(nextStep(terms[i + 1], -p.dir, 'next')); known.add(i); }
    }
  }
  return out;
}

// ── 크기 비교
function cmpCue(p) {
  const ns = [p.a, p.b, p.c].filter((x) => x != null);
  if (Math.max(...ns) <= 9) return `수를 차례로 세면 뒤에 나오는 수가 더 커요. 처음부터 세어 갈 때 어느 수가 ${p.lo ? '먼저' : '나중에'} 나올까요?`;
  return '10개씩 묶음의 수(십의 자리)를 먼저 비교해 봐요. 묶음 수가 같을 때만 낱개(일의 자리)를 비교해요.';
}
const ORDN = ['첫째', '둘째', '셋째'];
function cmpSplitSteps(p) {
  const ns = [p.a, p.b, p.c].filter((x) => x != null);
  return ns.map((n, i) => n4({ v: 'split', n }, `${J(n, '을', '를')} 10개씩 묶음과 낱개로 나누어요.`, `${ORDN[i]} 수를 묶음과 낱개로 나누기`));
}
// 높은 자리부터 처음으로 다른 자리의 숫자(세 자리 · 네 자리 · g2_CMP) — 둘이 같으면 그 두 수만 아래 자리로
function digitSteps(p) {
  const three = p.v === 'max', small = three && p.lo, out = [];
  let cand = three ? [p.a, p.b, p.c] : [p.a, p.b], prevK = -1;
  const L = len(Math.max(...cand));
  for (let k = L - 1; k >= 0 && cand.length > 1; k--) {
    const ds = cand.map((n) => dig(n, k));
    if (ds.every((d) => d === ds[0])) continue;
    cand.forEach((n, j) => {
      const [why, nm] = j > 0 ? [`${n}의 ${at(k)} 숫자도 봐요.`, '다른 수의 같은 자리 숫자 보기']
        : prevK >= 0 ? [`남은 두 수의 ${at(k)} 숫자를 봐요.`, '남은 두 수의 다음 자리 숫자 보기']
          : k === L - 1 ? [`가장 높은 ${at(k)} 숫자부터 봐요.`, '가장 높은 자리 숫자 보기'] : [`같은 자리는 넘기고 ${at(k)} 숫자를 봐요.`, '처음으로 다른 자리 숫자 보기'];
      out.push({ c: 'N5', p: { v: 'which', n, i: k }, why, n: nm });
    });
    const best = small ? Math.min(...ds) : Math.max(...ds);
    cand = cand.filter((_, j) => ds[j] === best);
    prevK = k;
  }
  return out;
}

// ── 세 자리 · 네 자리 수(g2_*)
const bigName = (b) => (b === 100 ? '백' : '천');
// b가 u의 몇 개인지 — 10개 안이면 뛰어 세기, 아니면 0의 개수 비교하기
const howMany = (b, u) => (b / u <= 10 ? `${u}씩 뛰어 세어 볼까요? ${b}까지 몇 번 뛰는지 세어요.` : `${b}${P(b, '과', '와')} ${u}의 0의 개수를 비교해 볼까요? ${u}${P(u, '이', '가')} 몇 개 모여야 ${b}${P(b, '이', '가')} 될까요?`);
const jumpTo = (x, b) => `${x}부터 ${b}까지 뛰어 센다고 생각해요. 어느 자리 숫자가 커지고, 그 자리가 1 커질 때 얼마만큼 커지는지 세어 봐요.`;
function g2BigCue(p) {
  const b = p.base, x = b - (p.k || 0);
  if (p.v === 'up') return `${x}에서 ${p.k}만큼 뛰어 세어 볼까요? 어떤 자리 숫자가 9를 넘으면 0이 되고 바로 왼쪽 자리가 1 커져요.`;
  if (p.v === 'gap') return jumpTo(x, b);
  return howMany(b, p.u);
}
function g2ManyCue(p) {
  const n = p.k * p.u, w = bigName(p.u), word = `${SIN[p.k]}${w}`;
  if (p.v === 'count') return `${n}에서 ${w}의 자리 숫자를 보세요. 그 숫자가 ${p.u}의 개수예요.`;
  if (p.v === 'word') return `'${word}'${P(word, '은', '는')} ${p.u}${P(p.u, '이', '가')} 몇 개인 수일까요? ${w}의 자리에 그 수를 쓰고 그 오른쪽 자리는 모두 0으로 채워요.`;
  if (p.v === 'read') return `${J(n, '은', '는')} ${p.u}${P(p.u, '이', '가')} 몇 개인 수일까요? ${w}의 자리 숫자를 읽고 '${w}'${P(w, '을', '를')} 붙여요.`;
  return `${p.u}${P(p.u, '이', '가')} ${p.k}개면 ${w}의 자리 숫자가 ${J(p.k, '이에요', '예요')}. 나머지 자리는 무엇으로 채울까요?`;
}
function g2NumCue(p) {
  const four = len(p.n) === 4;
  if (p.v === 'word') return `읽은 말을 ${four ? '천, ' : ''}백, 십에서 끊어 자리마다 숫자를 써요. 말에 없는 자리에는 0을 써요.`;
  if (p.v === 'read') return "자리마다 숫자를 읽고 자리 이름을 붙여요. 0인 자리는 읽지 않고, 십 · 백 앞의 1은 '일'이라고 읽지 않아요.";
  return four ? '1000은 천의 자리, 100은 백의 자리, 10은 십의 자리, 1은 일의 자리에 놓아요. 개수가 없는 자리에는 0을 써요.' : '100은 백의 자리, 10은 십의 자리, 1은 일의 자리에 놓아요. 개수가 없는 자리에는 0을 써요.';
}
function placeCue(p) {
  if (p.n == null) return '자리마다 몇 개인지 생각해요. 10이 10개면 100이에요.';
  const L = len(p.n), d = dig(p.n, p.i);
  if (p.v === 'digit') return `${p.n}에서 숫자 ${d}${P(d, '은', '는')} 어느 자리에 있나요? 같은 숫자도 자리에 따라 나타내는 값이 달라요.`;
  if (p.v === 'which') return `${p.n}의 숫자를 오른쪽 끝부터 일, 십, 백${L >= 4 ? ', 천' : ''}의 자리로 짚어 봐요. ${at(p.i)}에 있는 숫자 하나만 쓰면 돼요.`;
  if (p.v === 'expand') return `${J(p.n, '을', '를')} 자리마다 나누어 쓴 식이에요. 빈칸이 어느 자리인지 보고, 숫자만 쓰지 말고 그 자리의 값을 써요.`;
  if (p.v === 'regroup') return `${J(p.n, '을', '를')} ${p.t}${P(p.t, '과', '와')} 나머지로 나누어 봐요. ${p.t}${P(p.t, '을', '를')} 떼어 내면 얼마가 남을까요?`;
  return '자리마다 몇 개인지 생각해요. 10이 10개면 100이에요.';
}
function skipCue(p) {
  if (p.v === 'step') return '이웃한 두 수를 비교해 어느 자리 숫자가 하나씩 커지는지 찾아요. 그 자리의 단위만큼씩 뛴 것이에요.';
  const k = len(p.d) - 1, dir = p.dir || 1, terms = Array.from({ length: 5 }, (_, i) => p.s + p.d * dir * i);
  const cross = terms.some((x, i) => i < 4 && (dir > 0 ? dig(x, k) === 9 : dig(x, k) === 0));
  const tail = cross ? (dir > 0 ? '9 다음에는 0이 되고 바로 왼쪽 자리가 1 커져요.' : '0에서는 바로 왼쪽 자리에서 1을 가져와요.') : '다른 자리 숫자는 그대로예요.';
  return `${p.d}씩 ${dir < 0 ? '거꾸로 ' : ''}뛰어 세면 ${at(k)} 숫자가 하나씩 ${dir > 0 ? '커져요' : '작아져요'}. ${tail}`;
}
const g2CmpCue = (p) => `${len(Math.max(p.a, p.b, p.c || 0)) === 4 ? '천' : '백'}의 자리부터 비교해요. 같으면 바로 오른쪽 자리로 옮겨 가며 처음으로 다른 자리에서 크기를 정해요.`;

// ── 길이(U1 · 2-2-3:2)
function lenCue(p) {
  const all = p.m * 100 + (p.cm || 0);
  if (p.v === 'rev') return `100 cm가 모이면 m가 돼요. ${all} cm에는 100 cm가 몇 번 들어가고 얼마가 남을까요?`;
  if (p.v === 'm' || !p.cm) return p.m === 1 ? '1 m가 몇 cm인지 떠올려 봐요. 1 m 자의 눈금은 cm로 얼마까지 있을까요?' : `1 m는 100 cm예요. ${p.m} m는 100 cm를 ${p.m}번 더한 길이예요.`;
  return `1 m는 100 cm예요. ${p.m} m가 몇 cm인지 먼저 생각하고, ${p.cm} cm를 더해요.`;
}
function lenSteps(p) {
  const all = p.m * 100 + (p.cm || 0), m100 = { c: 'g2_MANY', p: { u: 100, k: p.m, v: 'units' }, why: `${p.m} m가 몇 cm인지 구해요.`, n: 'm를 cm로 바꾸기' };
  const many = { why: '100 cm 묶음이 몇 개인지 찾아요.', n: 'm가 몇인지 찾기' };
  if (p.v === 'rev') {
    if (!p.cm) return [{ c: 'g2_MANY', p: { u: 100, k: p.m, v: 'count' }, ...many }];
    return [{ c: 'N5', p: { v: 'which', n: all, i: 2 }, ...many }, { c: 'N5', p: { v: 'regroup', n: all, t: p.m * 100 }, why: '100 cm 묶음을 떼고 남은 cm를 구해요.', n: '남은 cm 구하기' }];
  }
  if (p.v === 'm' || !p.cm) return p.m > 1 ? [m100] : [];
  return [...(p.m > 1 ? [m100] : []), { c: 'g2_NUM', p: { n: all, v: 'comp' }, why: `${p.m * 100} cm와 ${p.cm} cm를 합쳐요.`, n: 'cm끼리 합치기' }];
}

// ── 큰 수(g4_*)
const zeros = (b, u, tail) => `${b}${P(b, '과', '와')} ${u}의 0의 개수를 비교해 볼까요? ${u}${P(u, '이', '가')} 몇 개 모여야 ${b}${tail}`;
function manCue(p) {
  if (p.v === 'more') return jumpTo(p.x, 10000);
  if (p.v === 'count') {
    if (p.money) {
      if (p.u === 5000) return '5000원짜리 지폐 몇 장이면 10000원일까요? 5000원씩 더해 봐요.';
      if (p.u === 1000) return '1000원짜리 지폐를 한 장씩 세어 10000원이 될 때까지 몇 장인지 세어요.';
      if (p.u === 500) return '500원짜리 동전 몇 개면 1000원일까요? 10000원은 1000원이 몇 개인지 이어서 생각해요.';
      return zeros(10000, p.u, '원이 될까요?');
    }
    return p.u === 1000 ? '1000씩 뛰어 세어 볼까요? 10000까지 몇 번 뛰는지 세어요.' : zeros(10000, p.u, '이 될까요?');
  }
  return `만이 ${p.k}개면 '${SIN[p.k]}만'이에요. 만의 자리에 ${J(p.k, '을', '를')} 쓰고 아래 네 자리는 무엇으로 채울까요?`;
}
function fiveCue(p) {
  if (p.v === 'build') return '만, 천, 백, 십, 일의 자리 칸에 개수를 자리마다 놓아 봐요. 개수가 없는 자리에는 0을 써요.';
  if (p.v === 'read') return '읽은 말을 만, 천, 백, 십에서 끊어 자리마다 숫자를 놓아요. 말에 없는 자리에는 0을 써요.';
  const d = dig(p.n, p.i);
  if (p.v === 'value') return `${p.n}에서 숫자 ${d}${P(d, '이', '가')} 있는 자리를 오른쪽 끝부터 일, 십, 백, 천, 만으로 짚어 찾아요. 백의 자리 숫자는 백이 몇 개인지를 나타내요.`;
  return `${J(p.n, '을', '를')} 자리마다 나누어 쓴 식이에요. 빈칸 자리의 숫자를 찾고, 그 자리가 나타내는 값으로 써요.`;
}
const BIGUNITS = [['십만', '만'], ['백만', '만'], ['천만', '만'], ['백만', '십만'], ['천만', '백만'], ['천만', '십만'], ['100000', '10000'], ['1000000', '10000'], ['10000000', '1000000']];
function bigCue(p) {
  if (p.v === 'unit') {
    const [b, s] = BIGUNITS[p.j] || BIGUNITS[0];
    if (/\d/.test(b)) return `${s}에서 ${b}까지 0이 몇 개 늘었나요? 0이 하나 늘 때마다 몇 배가 되는지 떠올려요.`;
    return `만, 십만, 백만, 천만을 차례로 써 보세요. ${s}에서 ${b}까지 몇 칸 올라가고, 한 칸마다 몇 배일까요?`;
  }
  if (p.v === 'man') return `${J(p.n, '을', '를')} 오른쪽에서부터 네 자리씩 끊어 봐요. 끊은 곳 왼쪽은 만이 몇 개인지, 오른쪽은 나머지예요.`;
  if (p.v === 'digit') return `${J(p.n, '을', '를')} 오른쪽에서부터 네 자리씩 끊어요. 왼쪽 묶음이 오른쪽부터 만, 십만, 백만, 천만의 자리예요.`;
  if (p.v === 'value') { const d = dig(p.n, p.i); return `${p.n}에서 숫자 ${d}${P(d, '이', '가')} 있는 자리를 찾아요. 네 자리씩 끊으면 왼쪽 묶음이 만, 십만, 백만, 천만의 자리예요.`; }
  return "읽은 말을 '만'에서 끊어요. 만 앞은 앞 묶음, 만 뒤는 네 자리로 쓰고 말에 없는 자리는 0으로 채워요.";
}
// 1억은 1000만이 □개 · 1억은 9000만보다 □만 더 큰 수 — 조도 같은 꼴
const EOKT = ['1000만', '100만', '10000000', '9000만', '9900만', '9990만', '9999만'];
const JOT = ['1000억', '100억', '9000억', '9900억', '9990억', '9999억'];
const KO = { 1000: '천', 100: '백', 10000000: '천만' };
function unitCue(top, unit, s) {
  const m = String(s).match(/^(\d+)(만|억)?$/), X = m ? m[1] : s;
  if (/^9/.test(X)) return `${top}${P(top, '은', '는')} ${unit}이 10000개예요. ${unit}을 단위로 보면 ${X}${unit}에서 몇${unit}을 더해야 ${top}${P(top, '이', '가')} 될까요?`;   /* 조사 고정: unit = 만 · 억(받침) */
  const ko = m && m[2] ? `${KO[Number(X)]}${m[2]}` : KO[Number(X)] || X;
  const row = unit === '만' ? '만, 십만, 백만, 천만, 억' : '억, 십억, 백억, 천억, 조';
  return `${row}${P(row, '을', '를')} 차례로 써 보세요. ${ko}에서 ${top.slice(1)}까지 몇 칸 올라가고, 한 칸마다 몇 배일까요?`;
}
function eokCue(p) {
  if (p.v === 'unit') return unitCue('1억', '만', EOKT[p.j] || EOKT[0]);
  if (p.v === 'digit') return `${J(p.n, '을', '를')} 오른쪽에서부터 네 자리씩 끊으면 맨 앞 숫자가 억의 자리예요. ${PL[p.i]}의 자리는 어디일까요?`;
  if (p.v === 'bigdigit') return `${p.a}억은 억이 ${p.a}개라는 뜻이에요. ${p.a}의 일, 십, 백, 천의 자리가 억, 십억, 백억, 천억의 자리예요.`;
  if (p.v === 'readmix') return "읽은 말을 '억'과 '만'에서 끊어요. 억 앞의 수와 만 앞의 수를 각각 네 자리 안에서 써요.";
  if (p.v === 'count') return `1억은 만이 10000개예요. ${p.a}억 ${p.b}만은 만이 모두 몇 개일까요?`;
  return '억 앞의 수, 만 앞의 네 자리, 만 아래 네 자리를 차례로 써요. 빈 자리에는 0을 채워요.';
}
function joCue(p) {
  if (p.v === 'unit') return unitCue('1조', '억', JOT[p.j] || JOT[0]);
  if (p.v === 'digit') return `${p.b}억의 숫자는 오른쪽부터 억, 십억, 백억, 천억의 자리이고, ${p.a}조의 숫자는 오른쪽부터 조, 십조, 백조의 자리예요.`;
  if (p.v === 'read') return "읽은 말을 '조'와 '억'에서 끊어요. 억 앞의 수는 네 자리로 쓰고, 빈 자리에는 0을 채워요.";
  return `1조는 억이 10000개예요. ${p.a}조 ${p.b}억은 억이 모두 몇 개일까요?`;
}
function g4SkipCue(p) {
  if (p.v === 'step') return '이웃한 두 수를 비교해 어느 자리 숫자가 바뀌었는지 찾아요. 바뀐 자리가 십의 자리면 십씩, 백의 자리면 백씩 뛴 거예요.';
  const k = p.e + ({ 만: 4, 억: 8, 조: 12 }[p.u] || 0), lab = p.u ? `${10 ** p.e}${p.u}` : ({ 3: '1000', 4: '1만', 5: '10만', 6: '100만', 7: '1000만' })[p.e];
  return `${lab}씩 뛰면 ${at(k)} 숫자가 하나씩 ${p.dir > 0 ? '커져요. 9 다음에는 0이 되고 바로 왼쪽 자리가 1 커져요.' : '작아져요. 0에서는 바로 왼쪽 자리에서 1을 가져와요.'}`;
}
const bcmpCue = (p) => (p.v === 'mix' ? '억이 몇 개인지 먼저 비교하고, 같으면 만이 몇 개인지 비교해요.' : '먼저 자리 수를 세어 봐요. 자리 수가 같으면 가장 높은 자리부터 차례로 비교해요.');

// ── 덧셈 · 뺄셈 여러 자리
const firstCarry = (a, b) => { for (let i = 0; i < Math.max(len(a), len(b)); i++) if (dig(a, i) + dig(b, i) >= 10) return i; return -1; };
const firstBorrow = (a, b) => { for (let i = 0; i < len(a); i++) if (dig(a, i) < dig(b, i)) return i; return -1; };
function carry3Cue(p, many) {
  const i = firstCarry(p.a, p.b);
  if (i < 0) return `일의 자리부터 같은 자리끼리 더해요. 10이거나 10보다 크면 바로 왼쪽 자리 위에 1을 작게 쓰고 같이 더해요.`;
  const x = dig(p.a, i), y = dig(p.b, i);
  return `일의 자리부터 더해요. ${at(i)} ${x} + ${y}처럼 10이거나 10보다 크면 1을 바로 왼쪽 자리${many ? ' 위에 작게 써서 올려요.' : '로 올려 같이 더해요.'}`;
}
function borrow3Cue(p, two) {
  const i = firstBorrow(p.a, p.b);
  if (i < 0) return '일의 자리부터 같은 자리끼리 빼요. 뺄 수 없는 자리는 바로 왼쪽 자리에서 10을 가져와요.';
  const x = dig(p.a, i), y = dig(p.b, i), ask = `${at(i)} ${x}에서 ${J(y, '을', '를')} 뺄 수 있나요?`;
  if (two) return `${ask} ${dig(p.a, i + 1) === 0 ? '바로 왼쪽 자리가 0이면 그보다 왼쪽 자리에서 먼저 가져오고' : '못 빼면 바로 왼쪽 자리에서 10을 가져오고'}, 내준 자리는 1 줄여요.`;
  return `${ask} ${i === 0 ? '못 빼면 십의 자리에서 10을 가져와요.' : '못 빼면 백의 자리에서 하나를 가져와 십의 자리에 10을 보태요.'}`;
}

// ── 혼합 계산(g5_MIX)
const isMD = (o) => o === '×' || o === '÷';
function mixCue(p) {
  const md = p.o.some(isMD), as = p.o.some((o) => !isMD(o));
  if (md && as) return p.g ? '( ) 안을 맨 먼저 계산하고, 그다음 ×와 ÷를 +와 −보다 먼저 해요. 맨 먼저 할 계산은 어디일까요?' : '×와 ÷를 +와 −보다 먼저 계산해요. 식에서 ×나 ÷가 있는 곳부터 찾아볼까요?';
  if (p.g) return '( ) 안을 맨 먼저 계산하고, 나머지는 앞에서부터 차례로 해요. ( ) 안의 계산은 무엇일까요?';
  return `${md ? '곱셈과 나눗셈' : '덧셈과 뺄셈'}만 있으면 앞에서부터 차례로 계산해요. 맨 앞의 두 수부터 계산해 볼까요?`;
}

// ── 수의 범위(g5_RANGE)
const RN = { ge: '이상', le: '이하', gt: '초과', lt: '미만' };
const opened = (m) => m === 'gt' || m === 'lt';
const inQ = (m, b) => `${b} ${RN[m]}에 ${b}${P(b, '이', '가')}`;
function rangeCue(p) {
  if (p.v === 'cnt') return `${inQ(p.m, p.b)} 들어가나요? 기준 수를 넣을지 먼저 정하고, 위의 수 중 알맞은 수만 세어 봐요.`;
  if (p.v === 'span') return `${inQ(p.m, p.b)}, ${inQ(p.m2, p.b2)} 들어가는지 먼저 보세요. 들어가는 수만 세어요.`;
  if (p.v === 'edge') return `${inQ(p.m, p.b)} 들어가나요? 들어가는 수 중에서 가장 ${p.m === 'ge' || p.m === 'gt' ? '작은' : '큰'} 수를 찾아요.`;
  return `●는 기준 수가 들어가고 ○는 들어가지 않아요. 선이 ${p.b}보다 큰 쪽으로 가는지 작은 쪽으로 가는지도 보세요.`;
}
// 끝 수 — 초과는 바로 뒤의 수 · 미만은 바로 앞의 수(이상 · 이하는 기준 수 그대로라 단계 없음)
const edgeStep = (m, b) => (m === 'gt'
  ? { c: 'g1_SEQ', p: { v: 'next', n: b, d: 1 }, why: `${b}${P(b, '은', '는')} 빼고 가장 작은 수를 찾아요.`, n: '기준 수를 빼고 가장 작은 수 찾기' }
  : { c: 'g1_SEQ', p: { v: 'next', n: b, d: -1 }, why: `${b}${P(b, '은', '는')} 빼고 가장 큰 수를 찾아요.`, n: '기준 수를 빼고 가장 큰 수 찾기' });
function rangeSteps(p) {
  if (p.v === 'edge' || p.v === 'cnt') return opened(p.m) ? [edgeStep(p.m, p.b)] : [];
  if (p.v !== 'span') return [];
  const lo = p.m === 'gt' ? p.b + 1 : p.b, hi = p.m2 === 'lt' ? p.b2 - 1 : p.b2, out = [];
  if (opened(p.m)) out.push(edgeStep(p.m, p.b));
  if (opened(p.m2)) out.push(edgeStep(p.m2, p.b2));
  out.push({ c: 'SUB', p: { a: hi, b: lo }, why: '가장 큰 수에서 가장 작은 수를 빼요.', n: '가장 큰 수에서 가장 작은 수 빼기' });
  out.push({ c: 'ADD', p: { a: hi - lo, b: 1 }, why: '첫 수까지 세려고 1을 더해요.', n: '첫 수까지 세려고 하나 더하기' });
  return out;
}

// ── 올림 · 버림 · 반올림(g5_ROUND)
const RPL = { 4: '만의 자리', 3: '천의 자리', 2: '백의 자리', 1: '십의 자리', 0: '일의 자리', '-1': '소수 첫째 자리', '-2': '소수 둘째 자리', '-3': '소수 셋째 자리' };
const MN = { up: '올림', down: '버림', half: '반올림' };
const fmtX = (xi, dp) => String(Number((xi / 10 ** dp).toFixed(dp)));
const roundI = (m, xi, u) => (m === 'up' ? Math.ceil(xi / u) * u : m === 'down' ? Math.floor(xi / u) * u : Math.floor((xi + u / 2) / u) * u);
function roundCue(p) {
  const pl = RPL[p.pk], five = (ans) => (ans === 5 ? '다섯' : '5');
  if (p.v === 'which') {
    if (p.m === 'half') return `보기마다 ${pl} 바로 아래 숫자만 보고, 5 이상이면 올리고 아니면 버려요. ${J(p.T, '이', '가')} 되는 것은 어느 것일까요?`;
    return `보기마다 ${pl} 아래를 가리고, ${p.m === 'up' ? `가린 부분이 0이 아니면 ${pl}${P(pl, '을', '를')} 하나 올려요` : '가린 부분을 0으로 바꿔요'}. ${J(p.T, '이', '가')} 되는 것은 어느 것일까요?`;
  }
  const xs = fmtX(p.xi, p.dp), ans = Number((roundI(p.m, p.xi, 10 ** (p.pk + p.dp)) / 10 ** p.dp).toFixed(p.dp));
  if (p.m === 'half') return `${xs}에서 ${pl} 바로 아래 ${RPL[p.pk - 1]} 숫자 하나만 보세요. 그 숫자가 ${five(ans)} 이상이면 올리고, 아니면 버려요.`;
  if (p.m === 'up') return `${xs}에서 ${pl} 아래를 가려 보세요. 가린 부분에 0이 아닌 숫자가 있으면 ${pl}${P(pl, '을', '를')} 하나 올려요.`;
  return `${xs}에서 ${pl} 아래를 가려 보세요. 버림은 가린 부분을 모두 0으로 바꾸는 것이에요.`;
}
function roundSteps(p) {
  if (p.v !== 'val') return [];
  if (p.dp) {   /* 소수 올림 · 버림(11-07 '단계 없음'이던 꼴) — 1.504 → 1.504 − 0.004 = 1.5 → 1.5 + 0.01 = 1.51 · 반올림 소수는 그대로 */
    if (p.m === 'half' || p.pk >= 0 || p.dp + p.pk < 1) return [];
    const u = 10 ** (p.dp + p.pk), below = p.xi % u, floor = p.xi - below, pl = { '-1': '소수 첫째 자리', '-2': '소수 둘째 자리' }[p.pk];
    if (!below || !pl) return [];
    const cutD = { c: 'g4_DECAS', p: { op: '-', a: p.xi, ka: p.dp, b: below, kb: p.dp }, why: `${pl} 아래 숫자를 떼어 내요.`, n: '아래 자리 떼어 내기' };
    return p.m === 'down' ? [cutD] : [cutD, { c: 'g4_DECAS', p: { op: '+', a: floor, ka: p.dp, b: u, kb: p.dp }, why: `${pl} 숫자를 하나 올려요.`, n: '그 자리 숫자 하나 올리기' }];
  }
  const n = p.xi, u = 10 ** p.pk, below = n % u, floor = n - below, pl = RPL[p.pk];
  if (!below) return [];
  const cut = { c: 'SUB', p: { a: n, b: below }, why: `${pl} 아래를 떼어 내 0으로 만들어요.`, n: '아래 자리 떼어 내기' };
  const add = { c: 'ADD', p: { a: floor, b: u }, why: `${pl} 숫자를 하나 올려요.`, n: '그 자리 숫자 하나 올리기' };
  if (p.m === 'down') return [cut];
  if (p.m === 'up') return [cut, add];
  const k = p.pk - 1, look = len(n) <= 4 ? { c: 'N5', p: { v: 'which', n, i: k } } : { c: 'g4_BIG', p: { v: 'digit', n, i: k } };
  return [{ ...look, why: `바로 아래 ${RPL[k]} 숫자를 봐요.`, n: '바로 아래 숫자 보기' }, cut, ...(dig(n, k) >= 5 ? [add] : [])];
}

// ── 풀이 순서 이름(plan) — 그 문제의 stepsOf 단계와 같은 개수 · 숫자 없이(10만 씀) · 같은 갈래는 같은 이름
//  내가 만든 단계는 단계마다 n(이름)을 달고 plan = 단계 이름 · 차시 정의 단계(g1~g6 · ops.js)는 아래 거울 함수가 같은 규칙으로 셈
const TEN_UP = ['10이 되려면 몇이 필요한지 찾기', '뒤의 수 가르기', '10과 남은 수 모으기'];
const TEN_DOWN = ['10과 낱개로 가르기', '10에서 빼기', '남은 수와 낱개 더하기'];
const TWO = ['앞의 두 수 계산하기', '그 결과와 남은 수 계산하기'];
const PN = ['일', '십', '백', '천', '만', '십만'];
const atn = (i) => `${PN[i]}의 자리`;
const names = (f) => (p) => f(p).map((s) => s.n);
// ops.js addColumns와 같은 차례
function addPlan(a, b) {
  const L = Math.max(len(a), len(b));
  if (L === 1) return [];
  if (len(Math.min(a, b)) === 1 && L === 2) return ['일의 자리끼리 더하기', '몇십에 일의 자리 합 더하기'];
  const out = []; let c = 0;
  for (let i = 0; i < L; i++) {
    const x = dig(a, i), y = dig(b, i);
    if (i > 0 && x === 0 && y === 0 && !c) continue;
    if (c) out.push(`${atn(i)}에 올린 수까지 더하기`); else if (x || y) out.push(`${atn(i)}끼리 더하기`);
    c = x + y + c >= 10 ? 1 : 0;
  }
  return out;
}
// ops.js subColumns와 같은 차례
function subPlan(a, b) {
  if (a <= 10 || (a < 20 && b <= 9)) return a > 10 && a < 20 && a % 10 < b ? ['10에서 남은 수 빼기'] : [];
  const out = []; let br = 0;
  for (let i = 0; i < len(a); i++) {
    const x = dig(a, i) - br, y = dig(b, i);
    if (i >= len(b) && !br) break;
    if (x < y) { let k = i + 1; while (k < len(a) - 1 && dig(a, k) === 0) k++; out.push(x < 0 ? `이어서 받아내려 ${atn(i)}끼리 빼기` : `${atn(k)}에서 받아내려 ${atn(i)}끼리 빼기`); br = 1; }   /* '윗자리'는 세로셈 윗줄로 읽힘 → 가져오는 자리 이름(11-05 교사 · 11-07 처음 보는 눈) */ else { if (x > 0 || y > 0) out.push(br ? `하나 줄어든 ${atn(i)}끼리 빼기` : `${atn(i)}끼리 빼기`); br = 0; }
  }
  return out;
}
// g5.js evalX와 같은 차례(괄호 안 → ×÷ → 앞에서부터)
function mixPlan(p) {
  const o = p.o.slice(), out = [];
  let g = p.g ? p.g.slice() : null;
  while (o.length) {
    let cand = [];
    for (let k = g ? g[0] : 0; k <= (g ? g[1] - 1 : o.length - 1); k++) cand.push(k);
    const md = cand.filter((k) => isMD(o[k]));
    if (md.length) cand = md;
    const k = cand[0];
    out.push(g ? '( ) 안 먼저 계산하기' : isMD(o[k]) && o.some((q) => !isMD(q)) ? `${o[k] === '×' ? '곱셈' : '나눗셈'} 먼저 하기` : o.length === 1 ? '남은 계산하기' : '앞에서부터 차례로 계산하기');
    o.splice(k, 1);
    if (g) { if (k < g[0]) { g[0]--; g[1]--; } else if (k < g[1]) g[1]--; if (g[1] <= g[0]) g = null; }
  }
  return out;
}
const divisorsOf = (n) => { const out = []; for (let d = 2; d < n; d++) if (n % d === 0) out.push(d); return out; };
const none = () => [];

// ── 차시
const NO = {
  look: '한 번에 세거나 보는 것이라 더 작은 단계로 나눌 것이 없어요 — 떠올리기 말로 세는 법을 보여 줘요.',
  read: '수를 읽고 쓰는 것은 자리를 한 번에 보는 것이라 나눌 단계가 없어요 — 떠올리기 말로 자리를 짚게 해요.',
  fact: '한 자리 수 계산은 이어 세기 · 가르기 한 번이라 나눌 단계가 없어요 — 떠올리기 말로 세는 법을 보여 줘요.',
};
// 덧셈 · 뺄셈 가족이 한 자리 수에서 빈 단계를 돌려줘서 아직 안 쓰이는 단계(머리 ※)

const H = {
  // 1-1-1 9까지의 수
  '1-1-1:2': { cue: countCue, noSteps: NO.look },
  '1-1-1:3': { cue: countCue, noSteps: NO.look },
  '1-1-1:5': {
    cue: (p) => {
      const sw = p.side === 'R' ? '오른쪽' : '왼쪽', pos = p.side === 'R' ? p.d - p.k + 1 : p.k;
      if (p.v === 'before') return `'${ORD[pos]}'는 자리예요. 색칠한 네모는 빼고, 그보다 ${sw}에 있는 네모만 하나씩 세어 봐요.`;
      return `${sw} 끝 네모부터 '첫째, 둘째, 셋째…' 하고 짚으며 색칠한 네모까지 세어 봐요.`;
    },
    noSteps: '어느 쪽 끝부터 첫째, 둘째… 하고 한 번에 세는 것이라 나눌 단계가 없어요.',
  },
  '1-1-1:6': { cue: seqCue, noSteps: NO.look },
  '1-1-1:7': {
    cue: (p) => (p.pic ? `먼저 점을 세어 봐요. 1만큼 더 ${p.d > 0 ? '큰 수는 바로 뒤' : '작은 수는 바로 앞'}의 수예요.` : p.n === 1 && p.d < 0 ? '1만큼 더 작은 수는 바로 앞의 수예요. 1개에서 하나를 덜어 내면 아무것도 없는데, 그것을 나타내는 수는?' : `1만큼 더 ${p.d > 0 ? '큰 수는 바로 뒤' : '작은 수는 바로 앞'}의 수예요. 수를 차례로 셀 때 ${p.n} 바로 ${p.d > 0 ? '뒤' : '앞'}에 오는 수는?`),
    noSteps: NO.look,
  },
  '1-1-1:8': { cue: cmpCue, noSteps: '9까지의 두 수는 세는 차례로 한 번에 비교하는 것이라 나눌 단계가 없어요.' },
  // 1-1-3 덧셈과 뺄셈
  '1-1-3:2': { cue: n3Cue, noSteps: NO.fact },
  '1-1-3:3': { cue: n3Cue, noSteps: NO.fact },
  '1-1-3:5': { cue: () => '모두 몇 개인지 구하는 것은 두 수를 모으는 것이에요. 어떤 두 수를 + 양쪽에 쓰고, 모은 수를 = 뒤에 쓸까요?', plan: () => ['두 수 모으기'] },
  '1-1-3:6': {
    cue: (p) => countOn(p.a, p.b),
    steps: (p) => [{ c: 'N3', p: { v: 'join', t: p.a + p.b, a: p.a }, why: `${J(p.a, '과', '와')} ${J(p.b, '을', '를')} 모아요.`, n: '두 수 모으기' }],
    plan(p) { return this.steps(p).map((x) => x.n); },   /* 가족 단계가 비어 이 단계가 쓰임(lessons stepsOf 대신 단계) — 이름 = 단계의 n */
  },
  '1-1-3:9': {
    cue: (p) => (p.v === 'pic' ? '×표 한 것은 덜어 낸 것이에요. 처음 점의 수에서 ×표 한 수를 빼는 식으로 써 볼까요?'
      : p.v === 'cmp' ? '몇 개 더 많은지는 하나씩 짝 짓고 남는 것이에요. 큰 수에서 작은 수를 빼는 식으로 써 볼까요?'
        : '처음 있던 수에서 준 수를 덜어 내면 남은 수예요. 처음 수를 앞에 쓰고 −로 써 볼까요?'),
    plan: () => ['빼는 수와 남은 수로 가르기'],
  },
  '1-1-3:10': {
    cue: (p) => splitSub(p.a, p.b),
    steps: (p) => [{ c: 'N3', p: { v: 'split', t: p.a, a: p.b }, why: `${J(p.a, '을', '를')} ${J(p.b, '과', '와')} 몇으로 갈라요.`, n: '빼는 수와 남은 수로 가르기' }],
    plan(p) { return this.steps(p).map((x) => x.n); },   /* 가족 단계가 비어 이 단계가 쓰임(lessons stepsOf 대신 단계) — 이름 = 단계의 n */
  },
  '1-1-3:12': { cue: zeroCue, noSteps: '0을 더하거나 빼는 것은 한 번에 보는 생각이라 나눌 단계가 없어요 — 빈 접시로 떠올리게 해요.' },
  '1-1-3:13': {
    cue: (p) => {
      if (p.v === 'make') return p.op === '-' ? '세 수 중 가장 큰 수를 찾아요. 뺄셈식은 가장 큰 수에서 시작해요.' : '세 수 중 가장 큰 수를 찾아요. 덧셈식에서 가장 큰 수는 = 뒤에 와요.';
      const sub = p.op === '-', c = sub ? p.a - p.b : p.a + p.b;
      if (p.v === 'sign') return `${p.a} ○ ${p.b}의 결과 ${c}${P(c, '은', '는')} ${p.a}보다 커졌나요, 작아졌나요? 커지면 더한 것, 작아지면 뺀 것이에요.`;
      return sub ? splitSub(p.a, p.b) : countOn(p.a, p.b);
    },
    noSteps: '기호 고르기 · 세 수로 식 만들기는 세 수의 관계를 한 번에 보는 것이라 나눌 단계가 없어요.',
  },
  // 1-1-5 50까지의 수
  '1-1-5:2': { cue: n3Cue, noSteps: '10을 두 수로 가르고 모으는 것은 10칸 틀을 한 번에 보는 것이라 나눌 단계가 없어요.' },
  '1-1-5:3': { cue: n4Cue, noSteps: NO.read },
  '1-1-5:4': {   /* 모으기 = 10 넘는 덧셈(1-2-6:2) · 가르기 = 십몇 − 몇(1-2-6:4)과 같은 순서 · 같은 말 */
    cue: n3Cue,
    steps: (p) => {
      const b = p.t - p.a;
      if (p.v === 'join') {
        return [{ c: 'N3', p: { v: 'split', t: 10, a: p.a }, why: `${J(p.a, '과', '와')} 더해서 10이 되는 수를 찾아요.`, n: TEN_UP[0] },
          { c: 'N3', p: { v: 'split', t: b, a: 10 - p.a }, why: `${J(b, '을', '를')} ${J(10 - p.a, '과', '와')} 몇으로 갈라요.`, n: TEN_UP[1] },
          { c: 'N4', p: { v: 'tenplus', o: p.t - 10 }, why: '10과 남은 수를 모아요.', n: TEN_UP[2] }];
      }
      return [{ c: 'N4', p: { v: 'split10', n: p.t }, why: `${J(p.t, '을', '를')} 10과 몇으로 갈라요.`, n: TEN_DOWN[0] },
        { c: 'N3', p: { v: 'split', t: 10, a: p.a }, why: `10에서 ${J(p.a, '을', '를')} 빼요.`, n: TEN_DOWN[1] },
        { c: 'N3', p: { v: 'join', t: b, a: 10 - p.a }, why: `${J(10 - p.a, '과', '와')} 갈라 둔 ${J(p.t - 10, '을', '를')} 더해요.`, n: TEN_DOWN[2] }   /* 갈라 둔 수 = 십몇의 낱개(b는 답 · 코덱스 11-07) */];
    },
  },
  '1-1-5:5': { cue: n4Cue, noSteps: NO.read },
  '1-1-5:6': { cue: n4Cue, noSteps: NO.read },
  '1-1-5:8': { cue: seqCue, steps: seqSteps },
  '1-1-5:9': { cue: cmpCue, steps: cmpSplitSteps },
  // 1-2-1 100까지의 수
  '1-2-1:2': { cue: n4Cue, noSteps: NO.read },
  '1-2-1:3': { cue: n4Cue, noSteps: NO.read },
  '1-2-1:4': { cue: seqCue, steps: seqSteps },
  '1-2-1:5': { cue: cmpCue, steps: cmpSplitSteps },
  '1-2-1:6': {
    cue: (p) => {
      if (p.v === 'find') return '보기마다 일의 자리 숫자를 보세요. 일의 자리 숫자를 둘씩 짝 지을 때 하나가 남는지 봐요.';
      if (p.v === 'pic') return '점을 둘씩 짝 지어 보세요. 짝이 없는 점이 하나 남나요, 남지 않나요?';
      return p.n <= 9 ? `${p.n}개를 둘씩 짝 지어 보면 하나가 남나요, 남지 않나요?` : `두 자리 수는 일의 자리 숫자만 보면 돼요. ${p.n}의 일의 자리가 0, 2, 4, 6, 8 중 하나인가요?`;
    },
    noSteps: '둘씩 짝 지어 남는지를 한 번에 보는 것이라 나눌 단계가 없어요.',
  },
  // 1-2-2 덧셈과 뺄셈(1)
  '1-2-2:2': {
    cue: (p) => { const h = Math.max(p.a, p.b), l = Math.min(p.a, p.b); return `낱개끼리 먼저 더해 볼까요? ${h}의 일의 자리 ${h % 10}에 ${J(l, '을', '를')} 더하고, 10개씩 묶음은 그대로 둬요.`; },
    plan: (p) => [...(Math.max(p.a, p.b) % 10 ? ['일의 자리끼리 더하기'] : []), '10개씩 묶음과 낱개 합치기'],
  },
  '1-2-2:3': { cue: (p) => `일의 자리는 일의 자리끼리, 십의 자리는 십의 자리끼리 더해요. ${p.a} + ${p.b}에서 같은 자리 숫자끼리 짝 지어 볼까요?`, plan: (p) => addPlan(p.a, p.b) },
  '1-2-2:4': { cue: (p) => `낱개끼리 먼저 빼 볼까요? ${p.a}의 일의 자리 ${p.a % 10}에서 ${J(p.b, '을', '를')} 빼고, 십의 자리는 그대로 둬요.`, plan: (p) => ['일의 자리끼리 빼기', ...(p.a - p.b === 10 ? [] : ['10개씩 묶음과 남은 낱개 합치기'])] },
  '1-2-2:5': { cue: () => '일의 자리는 일의 자리끼리, 십의 자리는 십의 자리끼리 빼요. 위아래 같은 자리 숫자를 짝 지어 볼까요?', plan: (p) => subPlan(p.a, p.b) },
  // 1-2-4 덧셈과 뺄셈(2)
  '1-2-4:2': { cue: (p) => `앞의 두 수 ${p.a} + ${p.b}부터 더해 볼까요? 그 결과에 ${J(p.c, '을', '를')} 더해요.`, plan: () => TWO },
  '1-2-4:3': { cue: (p) => `앞에서부터 차례로 빼요. ${p.a}에서 ${J(p.b, '을', '를')} 먼저 빼고, 남은 수에서 ${J(p.c, '을', '를')} 빼요.`, plan: () => TWO },
  '1-2-4:4': {
    cue: (p) => (p.pos === 1 || p.pos === 2 ? `10칸 틀에 ${p.pos === 1 ? p.b : p.a}칸을 채웠다고 생각해 봐요. 빈칸은 몇 칸 남을까요?` : countOn(p.a, p.b)),
    steps: (p) => (p.pos === 1 || p.pos === 2
      ? [{ c: 'N3', p: { v: 'split', t: 10, a: p.pos === 1 ? p.b : p.a }, why: `10을 ${J(p.pos === 1 ? p.b : p.a, '과', '와')} 몇으로 갈라요.`, n: '10을 아는 수와 남은 수로 가르기' }]
      : [{ c: 'N3', p: { v: 'join', t: 10, a: p.a }, why: `${J(p.a, '과', '와')} ${J(p.b, '을', '를')} 모아요.`, n: '두 수 모으기' }]),
    plan(p) { return this.steps(p).map((x) => x.n); },   /* 가족 단계가 비어 이 단계가 쓰임(lessons stepsOf 대신 단계) — 이름 = 단계의 n */
  },
  '1-2-4:5': {
    cue: (p) => (p.pos === 2 ? `10은 ${J(p.a - p.b, '과', '와')} 몇으로 가를 수 있을까요? 10칸 틀에서 ${p.a - p.b}칸이 남으려면 몇 칸을 지울까요?` : `10을 둘로 갈라 생각해요. 10은 ${J(p.b, '과', '와')} 몇으로 가를 수 있을까요?`),
    steps: (p) => [{ c: 'N3', p: { v: 'split', t: 10, a: p.pos === 2 ? p.a - p.b : p.b }, why: `10을 ${J(p.pos === 2 ? p.a - p.b : p.b, '과', '와')} 몇으로 갈라요.`, n: '10을 아는 수와 남은 수로 가르기' }],
    plan(p) { return this.steps(p).map((x) => x.n); },   /* 가족 단계가 비어 이 단계가 쓰임(lessons stepsOf 대신 단계) — 이름 = 단계의 n */
  },
  '1-2-4:6': { cue: () => '세 수 중 더해서 10이 되는 두 수를 먼저 찾아볼까요? 더하는 순서를 바꿔도 합은 같아요.', plan: () => ['더해서 10이 되는 두 수 더하기', '10과 남은 수 모으기'] },
  // 1-2-6 덧셈과 뺄셈(3)
  '1-2-6:2': { cue: (p) => `10을 먼저 만들어 봐요. ${p.a}에 얼마를 더하면 10이 될까요?`, plan: () => TEN_UP },
  '1-2-6:4': { cue: (p) => `${J(p.a, '을', '를')} 10과 ${RO(p.a - 10)} 갈라 볼까요? 10에서 ${J(p.b, '을', '를')} 먼저 빼고, 남은 수에 ${J(p.a - 10, '을', '를')} 더해요.`, plan: () => TEN_DOWN },   /* 마지막 걸음까지(10에서 빼기만 말하면 그 차를 답으로 씀 — 처음 보는 눈 11-07) */
  // 2-1-1 세 자리 수
  '2-1-1:2': { cue: g2BigCue, noSteps: NO.read },
  '2-1-1:3': { cue: g2ManyCue, noSteps: NO.read },
  '2-1-1:4': { cue: g2NumCue, noSteps: NO.read },
  '2-1-1:5': { cue: placeCue, noSteps: NO.read },
  '2-1-1:6': { cue: skipCue, noSteps: '어느 자리가 바뀌는지 한 번에 보는 것이라 나눌 단계가 없어요.' },
  '2-1-1:7': { cue: g2CmpCue, steps: digitSteps },
  // 2-1-3 덧셈과 뺄셈
  '2-1-3:2': { cue: (p) => { const h = Math.max(p.a, p.b), l = Math.min(p.a, p.b); return `일의 자리 ${h % 10} + ${l}부터 더해 볼까요? 10이거나 10보다 크면 10은 십의 자리로 올려요.`; }, plan: () => ['일의 자리끼리 더하기', '몇십에 일의 자리 합 더하기'] },
  '2-1-3:3': { cue: (p) => `일의 자리 ${p.a % 10} + ${p.b % 10}부터 더해요. 10이거나 10보다 크면 십의 자리 위에 1을 작게 쓰고 같이 더해요.`, plan: (p) => addPlan(p.a, p.b) },
  '2-1-3:4': {
    cue: (p) => {
      const ta = Math.floor(p.a / 10) % 10, tb = Math.floor(p.b / 10) % 10, c0 = p.a % 10 + p.b % 10 >= 10;
      return `일의 자리부터 더해요. 십의 자리 ${ta} + ${tb}${c0 ? '에 올린 1까지 더해' : P(tb, '이', '가')} 10이거나 10보다 크면 백의 자리로 1을 올려요.`;
    },
    plan: (p) => addPlan(p.a, p.b),
  },
  '2-1-3:5': { cue: (p) => `일의 자리 ${p.a % 10}에서 ${J(p.b, '을', '를')} 뺄 수 있나요? 못 빼면 십의 자리에서 10을 가져와요.`, plan: () => ['십의 자리에서 받아내려 일의 자리끼리 빼기', '10개씩 묶음과 남은 낱개 합치기'] },
  '2-1-3:6': { cue: () => '일의 자리 0에서 그대로 뺄 수 있나요? 십의 자리에서 10을 가져오면 십의 자리는 하나 줄어요.', plan: (p) => subPlan(p.a, p.b) },
  '2-1-3:7': {
    cue: (p) => {
      const x = p.a % 10, y = p.b % 10, ans = p.a - p.b;
      if (x === ans || y === ans) return '일의 자리끼리 그대로 뺄 수 있나요? 못 빼면 십의 자리에서 10을 가져오고, 십의 자리는 하나 줄여요.';   /* 자리 숫자가 답과 같은 수(54 − 47)는 숫자를 말하지 않음 */
      return `일의 자리 ${x}에서 ${J(y, '을', '를')} 뺄 수 있나요? 못 빼면 십의 자리에서 10을 가져오고, 십의 자리는 하나 줄여요.`;
    },
    plan: (p) => subPlan(p.a, p.b),
  },
  '2-1-3:8': { cue: (p) => `앞에서부터 차례로 계산해요. ${p.a} ${p.o1 === '+' ? '+' : '−'} ${p.b}부터 하고, 그 답${p.o2 === '+' ? '에' : '에서'} ${J(p.c, '을', '를')} ${p.o2 === '+' ? '더해요' : '빼요'}.`, plan: () => TWO },
  '2-1-3:9': {
    cue: (p) => {
      const s = p.x + p.y;
      if (p.v === 'a2s') return `덧셈식에서 가장 큰 수 ${J(s, '은', '는')} 두 수를 더한 합이에요. 뺄셈식은 가장 큰 수에서 시작해요.`;
      if (p.v === 's2a') return `뺄셈식의 맨 앞 수 ${s}${P(s, '이', '가')} 가장 큰 수예요. 덧셈식에서는 가장 큰 수가 = 뒤에 와요.`;
      const k = p.f ? p.x : p.y;
      return `${J(s, '은', '는')} 두 수를 모은 수예요. ${s}에서 ${J(k, '을', '를')} 빼면 덧셈식의 다른 한 수가 남아요.`;
    },
    noSteps: '세 수의 자리만 바꿔 쓰는 것이라 계산 단계가 없어요 — 가장 큰 수가 놓이는 자리를 떠올리게 해요.',
  },
  '2-1-3:10': {
    cue: (p) => {
      if (p.eq) return `=는 양쪽이 같다는 뜻이에요. 왼쪽 ${p.a} + ${p.b}부터 구하고, □ + ${p.c}${P(p.c, '이', '가')} 그 값과 같아지려면?`;
      return `${J(p.s, '은', '는')} ${J(p.a, '과', '와')} □를 모은 수예요. 어떤 뺄셈으로 □를 구할 수 있을까요?`;
    },
    plan: (p) => (p.eq ? ['왼쪽 계산하기', '그 값에서 아는 수 빼기'] : ['전체에서 아는 수 빼기']),
  },
  '2-1-3:11': {
    cue: (p) => {
      const c = p.a - p.b;
      if (p.pos === 1) return `□에서 ${J(p.b, '을', '를')} 빼니 ${c}${P(c, '이', '가')} 남았어요. 거꾸로 ${c}에 무엇을 하면 □가 될까요?`;
      return `${p.a}에서 얼마를 빼야 ${c}${P(c, '이', '가')} 남을까요? ${J(p.a, '은', '는')} ${J(c, '과', '와')} □를 모은 수예요.`;
    },
    plan: (p) => [p.pos === 1 ? '남은 수와 뺀 수 더하기' : '전체에서 남은 수 빼기'],
  },
  // 2-2-1 네 자리 수
  '2-2-1:2': { cue: g2BigCue, noSteps: NO.read },
  '2-2-1:3': { cue: g2ManyCue, noSteps: NO.read },
  '2-2-1:4': { cue: g2NumCue, noSteps: NO.read },
  '2-2-1:5': { cue: placeCue, noSteps: NO.read },
  '2-2-1:6': { cue: skipCue, noSteps: '어느 자리가 바뀌는지 한 번에 보는 것이라 나눌 단계가 없어요.' },
  '2-2-1:7': { cue: g2CmpCue, steps: digitSteps },
  '2-2-3:2': { cue: lenCue, steps: lenSteps },
  // 3-1-1 덧셈과 뺄셈(세 자리)
  '3-1-1:2': { cue: (p) => `${p.a} + ${J(p.b, '을', '를')} 자리를 맞춰 세로로 써 볼까요? 일, 십, 백의 자리끼리 차례로 더해요.`, plan: (p) => addPlan(p.a, p.b) },
  '3-1-1:3': { cue: (p) => carry3Cue(p, false), plan: (p) => addPlan(p.a, p.b) },
  '3-1-1:4': { cue: (p) => carry3Cue(p, true), plan: (p) => addPlan(p.a, p.b) },
  '3-1-1:5': { cue: (p) => `${J(p.a, '과', '와')} ${J(p.b, '을', '를')} 자리를 맞춰 쓰고, 일, 십, 백의 자리끼리 차례로 빼요.`, plan: (p) => subPlan(p.a, p.b) },
  '3-1-1:6': { cue: (p) => borrow3Cue(p, false), plan: (p) => subPlan(p.a, p.b) },
  '3-1-1:7': { cue: (p) => borrow3Cue(p, true), plan: (p) => subPlan(p.a, p.b) },
  // 4-1-1 큰 수
  '4-1-1:2': { cue: manCue, noSteps: NO.read },
  '4-1-1:3': { cue: fiveCue, noSteps: NO.read },
  '4-1-1:4': { cue: bigCue, noSteps: NO.read },
  '4-1-1:5': { cue: eokCue, noSteps: NO.read },
  '4-1-1:6': { cue: joCue, noSteps: NO.read },
  '4-1-1:7': { cue: g4SkipCue, noSteps: '어느 자리가 바뀌는지 한 번에 보는 것이라 나눌 단계가 없어요.' },
  '4-1-1:8': { cue: bcmpCue, noSteps: '자리 수 → 높은 자리 차례로 한 번에 비교하는 것이라 나눌 단계가 없어요.' },
  // 5-1-1 혼합 계산
  '5-1-1:2': { cue: mixCue, plan: mixPlan },
  '5-1-1:3': { cue: mixCue, plan: mixPlan },
  '5-1-1:4': { cue: mixCue, plan: mixPlan },
  '5-1-1:5': { cue: mixCue, plan: mixPlan },
  '5-1-1:6': { cue: mixCue, plan: mixPlan },
  // 5-1-2 약수와 배수
  '5-1-2:2': {
    cue: (p) => {
      if (p.v === 'isnt') return `보기의 수로 ${J(p.n, '을', '를')} 하나씩 나누어 볼까요? 나누어떨어지지 않는 수가 약수가 아니에요.`;
      if (p.v === 'list') return `곱해서 ${p.n}${P(p.n, '이', '가')} 되는 두 수를 짝 지어 보세요. 1 × ${p.n}부터 차례로 찾아요.`;
      return `곱해서 ${p.n}${P(p.n, '이', '가')} 되는 두 수를 1 × ${p.n}부터 짝 지어 찾아요. 짝마다 두 수가 모두 약수예요.`;
    },
    plan: (p) => (p.v === 'isnt' ? ORD.slice(1, Math.min(3, divisorsOf(p.n).length) + 2).map((o) => `${o} 보기로 나누어 보기`) : (p.v === 'list' ? divisorsOf(p.n).filter((d) => d * d < p.n) : divisorsOf(p.n)).slice(0, 2).map((_, i) => (i ? '다음 수로 나누어 짝 찾기' : '작은 수부터 나누어 짝 찾기'))),
  },
  '5-1-2:3': { cue: (p) => (p.v === 'is' ? `${p.n}단 곱셈구구를 떠올려 봐요. ${RO(p.n)} 나누어떨어지는 수가 ${p.n}의 배수예요.` : `${p.n}의 배수는 ${J(p.n, '을', '를')} 1배, 2배, 3배… 한 수예요. ${p.n}씩 뛰어 세어 볼까요?`), plan: (p) => (p.v === 'is' ? ['나누어떨어지는지 보기'] : ['그다음 배수 구하기', '또 그다음 배수 구하기']) },
  '5-1-2:4': { cue: (p) => `${J(p.a, '과', '와')} ${p.b}의 약수를 각각 늘어놓아 볼까요? 두 줄에 모두 있는 수가 공약수${p.v === 'cnt' ? '인데, 1도 빠뜨리지 말고 세어요.' : '이고, 그중 가장 큰 수가 최대공약수예요.'}`, plan: () => ['첫째 수의 약수 늘어놓기', '둘째 수의 약수 늘어놓기'] },
  '5-1-2:6': { cue: (p) => `큰 수 ${Math.max(p.a, p.b)}의 배수를 차례로 늘어놓아 볼까요? 작은 수로 나누어떨어지는 첫 수를 찾${p.v === 'cms' ? '고, 그 수를 2배, 3배 해 봐요' : '아요'}.`, plan: (p) => (Math.max(p.a, p.b) % Math.min(p.a, p.b) === 0 ? ['큰 수가 나누어떨어지는지 보기'] : ['큰 수의 배수 늘어놓기', '나누어떨어지는지 확인하기']) },
  // 5-2-1 수의 범위와 어림하기
  '5-2-1:2': { cue: rangeCue, steps: rangeSteps },
  '5-2-1:3': { cue: rangeCue, steps: rangeSteps },
  '5-2-1:5': { cue: roundCue, steps: roundSteps },
  '5-2-1:6': { cue: roundCue, steps: roundSteps },
  '5-2-1:7': { cue: roundCue, steps: roundSteps },
};
// plan이 없는 차시: 내가 만든 단계가 있으면 그 이름들, 없으면 빈 순서(단계 없음)
for (const h of Object.values(H)) if (!h.plan) h.plan = h.steps ? names(h.steps) : none;
export default H;
