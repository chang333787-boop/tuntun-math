// 문항 내용 점검(11-01) 다시 생기지 않게 — 점검에서 나온 21가지를 숫자로 다시 잰다
//   ① 몫 가운데 0 단계 ② 배수 고르기 정답 자리 ③ 단위 뒤 조사 ④ ×1 문장제 ⑤ 크기 문항 정답 고루 ⑥ 시범 말 ⑦ 1-2-6 이어 세기 ⑧ 자연수 × 분수 뜻
//   ⑨ 공약수 단계 ⑩ 나눗셈 그림 한 줄 ⑪ 몫 = 묶는 수 ⑫ +1 · −1 ⑬ 가분수끼리 ⑭ 5-2-2:5 단계 말 ⑮ 백분율 약분 단계 ⑯ 작은 수 맥락
//   ⑰ 자연수 × 소수 문장제 ⑱ 6-1-3:7 문장제 ⑲ ▼ 글 ⑳ 비교하기 0 대분수 ㉑ 범위 보기 차례 · 옛 p(저장된 문항)는 예전 문항 그대로
//   node tests/audit.test.mjs
import { NODES, byId, makeItem, stepsOf } from '../engine/lessons/index.js';
import { rng } from '../engine/math.js';
import { toText, blankCount } from '../engine/tokens.js';
import { storyOf, hasWords } from '../engine/words.js';
import { WANT } from '../engine/mis.js';
import { lintKo } from './lint_ko.mjs';
import { newFix, showTalk, blankTalk, factTalk, compareOf } from '../app/js/fix.js';
import { itemOf } from '../paper/js/gen.js';

let fails = 0, oks = 0;
const ok = (c, m) => { if (c) { oks++; if (process.env.V) console.log('✓', m); } else { fails++; console.log('✗', m); } };
const gens = (c, n, seed = 5) => { const r = rng(seed); return Array.from({ length: n }, () => byId[c].gen(r)); };
const share = (xs, f) => xs.filter(f).length / Math.max(1, xs.length);
const pct = (x) => `${(x * 100).toFixed(1)}%`;
const T = (it) => toText(it.prompt) + (it.choices ? ` | ${it.choices.map((x) => toText(x)).join(' / ')}` : '');

// ① 세 자리 ÷ 한 자리 — 단계 몫 숫자를 이으면 바른 몫 · 끝 단계 나머지 = 바른 나머지(몫 가운데 · 끝 0 자리도 단계)
{
  let bad = 0, zero = 0; const ex = [];
  for (let a = 100; a <= 999; a++) for (let b = 2; b <= 9; b++) {
    const st = stepsOf(a % b ? '3-2-2:10' : '3-2-2:9', { a, b }); let q = '', rem = 0;
    for (const s of st) { const it = makeItem(s.c, s.p); q += String(it.sol[0]); rem = it.sol[1] ?? 0; if (it.sol[0] === 0) zero++; }
    if (Number(q) !== Math.floor(a / b) || rem !== a % b) { bad++; if (ex.length < 3) ex.push(`${a} ÷ ${b} → ${q} … ${rem}`); }
  }
  ok(!bad && zero > 1000, `① 세 자리 ÷ 한 자리 7200개 — 단계를 따라 하면 바른 몫 · 나머지(어긋남 ${bad}${ex.length ? ` ${ex.join(' · ')}` : ''}) · 몫 0 단계 ${zero}개`);
}
// ② 배수 고르기 — 정답 자리가 고루(자리마다 15~35%) · 정답 바로 옆 수(±1)가 둘인 문항 5% 아래
{
  const its = gens('5-1-2:3', 4000).filter((p) => p.v === 'is').map((p) => makeItem('5-1-2:3', p)), pos = [0, 1, 2, 3].map((k) => share(its, (it) => it.sol[0] === k));
  const adj = share(its, (it) => { const vs = it.choices.map((c) => Number(toText(c))), R0 = vs[it.sol[0]]; return vs.filter((x) => Math.abs(x - R0) === 1).length >= 2; });
  ok(pos.every((x) => x >= 0.15 && x <= 0.35) && adj < 0.05, `② 5-1-2:3 정답 자리 ${pos.map(pct).join(' · ')} · 바로 옆 수 둘 ${pct(adj)}`);
}
// ③ 단위 뒤 조사 — 글 검사가 '몇 m이었을까요'를 잡고 문장제에 그 꼴이 없음
{
  ok(lintKo('리본은 몇 m이었을까요?').length && lintKo('밀가루는 몇 kg였을까요?').length && !lintKo('리본은 몇 m였을까요?').length && !lintKo('밀가루는 몇 kg이었을까요?').length, '③ 글 검사가 단위 뒤 이었 · 였을 잡음');
  let n = 0, badN = 0;
  for (const c of ['4-2-1:2', '4-2-1:3', '4-2-3:8', '4-2-3:9', '5-1-5:2', '5-1-5:3', '5-1-5:4']) gens(c, 300).forEach((p, i) => { const s = storyOf(c, p, i * 7919 + 3); if (!s) return; const t = toText(s.story); if (/몇 (m|L|kg)(이었|였)/.test(t)) n++; if (/몇 (m|L)이었|몇 kg였/.test(t)) badN++; });
  ok(n > 0 && !badN, `③ 처음 수 모름 문장제 '몇 m였을까요' ${n}개 · 틀린 조사 ${badN}`);
}
// ④ 곱하는 수가 1인 문장제 없음 · 걸음 틀은 하루 100걸음부터 · 1단과 0의 곱은 문장제 칸이 아님
{
  let one = 0, step = 0, made = 0;
  for (const L of NODES.filter((x) => hasWords(x.id) && x.fam === 'MUL')) gens(L.id, 200).forEach((p, i) => { const s = storyOf(L.id, p, i * 7919 + 3); if (!s) return; made++; const t = toText(s.story); if (/\b1(일|묶음|봉지|상자|줄|개에는|송이)/.test(t) && p.b === 1) one++; const m = t.match(/하루에 (\d+)걸음씩/); if (m && +m[1] < 100) step++; });
  ok(made > 1000 && !one && !step && !hasWords('2-2-2:8'), `④ 곱셈 문장제 ${made}개 — ×1 이야기 ${one} · 100걸음 아래 걸음 틀 ${step} · 2-2-2:8 문장제 칸 ${hasWords('2-2-2:8') ? 'O' : 'X'}`);
  const k1 = share(gens('2-2-2:2', 3000), (p) => p.b === 1);
  ok(k1 < 0.08, `④ 2단 문항 중 × 1 ${pct(k1)}`);
}
// ⑤ 계산하지 말고 생각해요 — 정답 셋 모두 10% 넘게 · 함정 꼴(WANT)은 '늘 커진다 · 작아진다'로 풀면 틀리는 것만
for (const [c, mis] of [['5-2-2:4', '곱하면'], ['6-2-1:5', '나누면']]) {
  const ps = gens(c, 6000).filter((p) => p.dir || p.sz || p.v === 'dir' || p.v === 'size'), its = ps.map((p) => makeItem(c, p)), dist = [0, 1, 2].map((k) => share(its, (it) => it.sol[0] === k));
  const want = WANT['mul.bigger'][c], wrongTrap = ps.filter((p, i) => want(p) && its[i].sol[0] === (c === '5-2-2:4' ? 0 : 1)).length;
  ok(dist.every((x) => x > 0.1) && !wrongTrap, `⑤ ${c} 정답 커요 ${pct(dist[0])} · 작아요 ${pct(dist[1])} · 같아요 ${pct(dist[2])} · '${mis} 늘 …'로 맞히는 함정 꼴 ${wrongTrap}`);
}
// ⑥ 판자 고치기 시범 — 단계가 없는 칸도 튼튼이 말이 있음(화면처럼: 시범 말 + 빈칸 둘 이상이면 빈칸마다)
{
  const empty = [];
  for (const L of NODES) for (let k = 0; k < 12; k++) {
    const F = newFix({ c: L.id, id: `au${k}` }); if (F.steps.length) continue;
    const nb = F.ex.choices ? 0 : blankCount(F.ex.prompt), say = [...showTalk(F), ...(nb >= 2 ? Array.from({ length: nb }, (_, i) => blankTalk(F.ex, i)).filter(Boolean) : [])];
    if (!say.length) { empty.push(L.id); break; }
  }
  ok(!empty.length, `⑥ 시범 말이 없는 칸 ${empty.length}${empty.length ? ` — ${empty.slice(0, 8).join(' ')}` : ''}`);
}
// ⑦ 10 만들기 칸(1-2-6) · 단계가 있는 칸에서는 이어 세기 · 거꾸로 세기 말을 하지 않음
{
  const bad = [];
  for (const c of ['1-2-6:2', '1-2-6:4', '1-2-2:2', '1-2-2:4']) gens(c, 80).forEach((p) => { const t = factTalk(itemOf(c, p), true); if (/이어 세어|거꾸로 세어|몇 번 더 세면/.test(t)) bad.push(`${c} ${t}`); });
  ok(!bad.length && stepsOf('1-1-3:6', { a: 3, b: 4 }).length > 0, `⑦ 1-2-6 · 단계 칸 이어 세기 말 ${bad.length}${bad.length ? ` — ${bad[0]}` : ''} · 1-1-3:6은 이제 engine/hints 단계(두 수 모으기 · 11-07)`);
}
// ⑧ 자연수 × 진분수(나누어떨어지지 않음) — 첫 단계는 'N의 1/d'(1/d이 N개)
{
  const ps = gens('5-2-2:4', 3000).filter((p) => !p.dir && !p.sz && p.N % p.d), bad = ps.filter((p) => { const s = stepsOf('5-2-2:4', p)[0]; return !s || s.p.v !== 'build' || s.p.n !== p.N || !s.why.includes(`${p.N}의 1/${p.d}`); });
  ok(ps.length > 100 && !bad.length, `⑧ 5-2-2:4 ${ps.length}개 — 첫 단계가 '${'N의 1/d'}'가 아닌 것 ${bad.length}`);
}
// ⑨ 공약수 · 최대공약수 단계 — 두 수의 약수를 늘어놓음(몇 개인지 묻지 않음) · 빈칸을 채우면 약수 전부
{
  const ps = gens('5-1-2:4', 300), bad = ps.filter((p) => { const st = stepsOf('5-1-2:4', p); return st.length !== 2 || st.some((s) => { const it = makeItem(s.c, s.p), all = toText(it.prompt, it.sol.map(String)).split('쓰면 ')[1]; return s.p.v !== 'list' || !all || all.split(', ').map(Number).some((x) => s.p.n % x); }); });
  ok(!bad.length, `⑨ 5-1-2:4 단계 300개 — 약수 늘어놓기가 아닌 것 ${bad.length}`);
}
// ⑩ 나눗셈 그림 — 한 줄 점 수 = 사람 수(3-1-3:2) · 묶는 수(3-1-3:3)
{
  const row = (it) => { const svg = it.prompt[0].svg, ys = [...svg.matchAll(/cy="([\d.]+)"/g)].map((m) => m[1]); return ys.filter((y) => y === ys[0]).length; };
  const b2 = gens('3-1-3:2', 200).filter((p) => row(makeItem('3-1-3:2', p)) !== p.d).length, b3 = gens('3-1-3:3', 300).filter((p) => p.v === 'pic' && row(makeItem('3-1-3:3', p)) !== p.d).length;
  ok(!b2 && !b3, `⑩ 그림 한 줄이 나누는 수가 아닌 것 3-1-3:2 ${b2} · 3-1-3:3 ${b3}`);
}
// ⑪ 몫 = 나누는 수(16 ÷ 4 = 4) 거름
ok(!gens('3-1-3:3', 2000).some((p) => p.q === p.d) && !gens('3-1-3:2', 2000).some((p) => p.q === p.d), '⑪ 3-1-3:2 · 3-1-3:3 몫 = 나누는 수 0개');
// ⑫ (몇십몇) ± 1 은 10% 아래
for (const c of ['1-2-2:2', '1-2-2:4']) { const x = share(gens(c, 3000), (p) => p.b === 1); ok(x < 0.1, `⑫ ${c} 1을 더하거나 빼는 문항 ${pct(x)}`); }
// ⑬ 가분수 · 대분수 비교에 가분수끼리만인 문항 없음
{ const x = share(gens('3-2-4:7', 3000), (p) => p.ms.every((m) => !m)); ok(x === 0, `⑬ 3-2-4:7 가분수끼리 ${pct(x)}`); }
// ⑭ 자연수 × 대분수(자연수 부분 1) — 단계 말에 자연수 부분 1을 곱한 것
{ const ps = gens('5-2-2:5', 2000).filter((p) => Math.floor(p.n / p.d) === 1), bad = ps.filter((p) => { const st = stepsOf('5-2-2:5', p); return st.length > 2 || !st[0].why.includes('자연수 부분 1에') || (st.length === 2 && !/이 문제의 답/.test(st[1].why)); });   /* 11-07: 끝에 두 결과 더하기 · 대분수로 바꾸기 단계가 붙을 수 있음 */ ok(ps.length && !bad.length, `⑭ 5-2-2:5 자연수 부분 1 ${ps.length}개 — 말이 빠진 것 ${bad.length}`); }
// ⑮ 백분율 — 약분할 수 있으면(최대공약수 > 1) 약분 단계(5-1-4:4)가 백분율 단계 앞에
{ const g = (a, b) => (b ? g(b, a % b) : a), ps = gens('6-1-4:7', 600), bad = ps.filter((p) => { const base = p.c === 'sale' ? p.x - p.y : p.y, st = stepsOf('6-1-4:7', p), i = st.findIndex((s) => s.c === '5-1-4:4'), j = st.findIndex((s) => s.c === '6-1-4:6'); return j < 0 || (g(base, p.x) > 1 ? i < 0 || i > j : i >= 0); }); ok(!bad.length, `⑮ 6-1-4:7 600개 — 약분 단계가 없거나 뒤인 것 ${bad.length}`); }
// ⑯ 작은 수 맥락 — 반 · 옆 반에 30 아래 수 X · 도서관 책은 100권부터
{
  let cls = 0, lib = 0, n = 0;
  for (const c of ['1-1-3:6', '1-1-3:10', '1-2-2:2', '1-2-2:4', '2-1-3:4', '2-1-3:3', '3-1-1:2']) gens(c, 400).forEach((p, i) => { const s = storyOf(c, p, i * 7919 + 3); if (!s) return; n++; const t = toText(s.story); for (const m of t.matchAll(/(?:1반|2반|우리 반|옆 반)(?:에|에는|은|는)? ?(?:색종이가 |동화책이 )?(\d+)(?:장|권)/g)) if (+m[1] < 10) cls++; for (const m of t.matchAll(/(?:도서관 1층|도서관 2층|1층|2층)[^.]*?(\d+)권/g)) if (+m[1] < 100) lib++; });
  ok(n > 1000 && !cls && !lib, `⑯ 덧뺄 문장제 ${n}개 — 반에 10 아래 수 ${cls} · 도서관에 100권 아래 ${lib}`);
}
// ⑰ 자연수 × 소수 — '한 개의 ○ kg인 상자 N개'(소수 × 자연수 뜻) X
{ let n = 0, bad = 0; for (const c of ['5-2-4:4', '5-2-4:5']) gens(c, 300).forEach((p, i) => { const s = storyOf(c, p, i * 7919 + 3); if (!s) return; n++; if (/한 개의 무게가 [\d.]+ kg인 상자/.test(toText(s.story))) bad++; }); ok(n > 500 && !bad, `⑰ 자연수 × 소수 문장제 ${n}개 — 소수 × 자연수 틀 ${bad}`); }
// ⑱ 6-1-3:7 문장제가 나옴(90% 넘게)
{ const ps = gens('6-1-3:7', 300), x = share(ps, (p) => !!storyOf('6-1-3:7', p, 11)); ok(x >= 0.9, `⑱ 6-1-3:7 이야기로 바뀐 비율 ${pct(x)}`); }
// ⑲ 수직선 글은 그림의 ▼와 같게
{ const ts = ['3-1-6:5', '3-2-4:5'].flatMap((c) => gens(c, 300).map((p) => T(makeItem(c, p)))); ok(!ts.some((t) => t.includes('↓')) && ts.some((t) => t.includes('▼가 가리키는')), `⑲ '↓가 가리키는' ${ts.filter((t) => t.includes('↓')).length}개`); }
// ⑳ 비교하기 — 보이는 틀린 풀이에 자연수 부분 0 · 분수 부분 0 · 1 이상인 대분수 없음(자연수 0이면 그냥 분수 칸으로 보임 — fix.js plainFrac)
{
  const odd = [];
  for (const L of NODES) for (let s = 1; s <= 3; s++) { const X = compareOf(L.id, { seed: s }); if (!X) continue; const v = X.wrong; for (const t of (X.wrongPrompt || X.it.prompt)) if (t && typeof t === 'object' && 'm' in t && t.m.some((x) => x && typeof x === 'object')) { const [w, n, d] = t.m.map((x) => (x && typeof x === 'object' ? Number(v[x.b]) : Number(x))); if (!(w >= 1) || !(n >= 1) || n >= d) odd.push(`${L.id} ${toText(X.it.prompt, v.map(String))}`); } }
  ok(!odd.length, `⑳ 비교하기 이상한 대분수 ${odd.length}${odd.length ? ` — ${odd[0]}` : ''}`);
}
// ㉑ 이상 · 이하 · 초과 · 미만 보기 — 정답 자리가 고루(자리마다 15~35%)
for (const c of ['5-2-1:2', '5-2-1:3']) { const its = gens(c, 4000).filter((p) => p.v === 'line').map((p) => makeItem(c, p)), pos = [0, 1, 2, 3].map((k) => share(its, (it) => it.sol[0] === k)); ok(pos.every((x) => x >= 0.15 && x <= 0.35), `㉑ ${c} 정답 자리 ${pos.map(pct).join(' · ')}`); }
// 옛 p — 10-31까지 저장된 문항은 예전 그대로(기록은 c · p만 저장 · 고르기는 보기 번호로 채점)
{
  const OLD = [
    ['5-1-2:3', { v: 'is', n: 7, s: 252 }, '7의 배수를 고르세요. | 19 / 21 / 22 / 27', 1],
    ['5-1-2:3', { v: 'is', n: 4, s: 17 }, '4의 배수를 고르세요. | 30 / 32 / 33 / 35', 1],
    ['5-2-1:2', { v: 'line', m: 'le', b: 30 }, '[그림]수직선에 나타낸 수의 범위를 고르세요. | 30 이상 / 30 이하 / 30 초과 / 30 미만', 1],
    ['5-2-1:3', { v: 'line', m: 'gt', b: 57 }, '[그림]수직선에 나타낸 수의 범위를 고르세요. | 57 이상 / 57 이하 / 57 초과 / 57 미만', 2],
    ['5-2-2:4', { dir: 1, d: 5, n: 2, N: 12 }, '계산하지 말고 생각해요. 12 × 2/5의 값은 12보다 어떨까요? | 커요 / 작아요 / 같아요', 1],
    ['6-2-1:5', { v: 'dir', n: 2, d: 5, N: 6 }, '계산하지 말고 생각해요. 6 ÷ 2/5의 값은 6보다 어떨까요? | 커요 / 작아요 / 같아요', 0],
    ['3-2-4:7', { v: 'ii', d: 4, xs: [9, 11, 6], ms: [0, 0, 0], ask: 'max' }, '가장 큰 수를 고르세요. | 9/4 / 11/4 / 6/4', 1],
  ];
  const bad = OLD.filter(([c, p, t, s]) => { try { const it = makeItem(c, p); return T(it) !== t || it.sol[0] !== s; } catch (e) { return true; } });
  ok(!bad.length, `옛 p ${OLD.length}개가 예전 문항 그대로${bad.length ? ` — 다른 것 ${bad.map((x) => x[0]).join(' ')}` : ''}`);
}
console.log(`문항 내용 점검 시험 — 통과 ${oks} · ${fails ? `FAIL ${fails}` : 'PASS'}`);
process.exit(fails ? 1 : 0);
