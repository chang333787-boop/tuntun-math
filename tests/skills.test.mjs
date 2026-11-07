// 기능 목록 · 맞춤 연습지 뽑기 시험: node tests/skills.test.mjs
//  ① 이름 · id가 겹치지 않음 · 갈래 · 차시 · 거르기 글이 맞음 ② 229차시가 모두 한 기능 이상에(빠진 차시는 LEFT에 까닭과 함께)
//  ③ 모든 기능이 10문제를 실제로 뽑음(씨앗 셋 · 같은 답 셋째부터 빼기 · 같은 글 X · 거르기 지킴) · 20문제까지 되는지 = max가 맞는지
//  ④ 지시 한 줄의 {n} 자리가 모두 풀리고 글 검사(lint_ko) 통과 ⑤ 함정 꼴(want) — WANT가 있는 차시는 함정 문항이 실제로 섞임
//  ⑥ 예전 설정(want · dup · mix 없음)은 예전 뽑기와 같은 문제 ⑦ 메인이 손으로 만든 설정 둘을 기능 이름으로 그대로 만들 수 있음
//  ⑧ 이 아이 칸 위주(focusShares) — 그 칸은 두 몫 · 앞 갈래는 한 몫 · 뒤 갈래는 뺌 · 어느 칸에 맞춰도 10문제가 다 나옴
//  ⑨ 기능 카드 예시 둘(examplesOf) — 늘 둘 · 서로 다름 · 늘 같음 · 첫 갈래 → 끝 갈래 · 거르기 지킴
import { NODES, byId } from '../engine/lessons/index.js';
import { SKILLS, SKILL, GROUPS, COUNTS, LEFT, secOf, noteOf, splitN, skillsOf, partsText, focusShares } from '../engine/skills.js';
import { WANT, wantFor } from '../engine/mis.js';
import { buildSheet, examplesOf } from '../paper/js/pick.js';
import { pickItems } from '../paper/js/gen.js';
import { rng } from '../engine/math.js';
import { toText } from '../engine/tokens.js';
import { lintKo } from './lint_ko.mjs';

let fails = 0, checks = 0;
const ok = (c, m) => { checks++; if (!c) { fails++; console.log('✗', m); } };
const info = (m) => console.log('·', m);

// ① 모양
ok(new Set(SKILLS.map((s) => s.id)).size === SKILLS.length, 'id 겹침 없음');
{ const seen = {}; for (const s of SKILLS) { ok(!seen[s.name], `이름 겹침: ${s.name}`); seen[s.name] = 1; } }
for (const s of SKILLS) {
  ok(GROUPS.includes(s.group), `${s.id}: 없는 갈래 ${s.group}`);
  ok(s.parts.length >= 1, `${s.id}: 갈래 없음`);
  for (const p of s.parts) {
    ok(!!byId[p.c], `${s.id}: 없는 차시 ${p.c}`);
    if (p.re) { let e = null; try { new RegExp(p.re); } catch (x) { e = x; } ok(!e, `${s.id}: 거르기 글 오류 ${p.re}`); }
    if (s.parts.length > 1) ok(!!p.label, `${s.id}: 갈래가 여럿인데 ${p.c}에 이름(label) 없음`);
  }
  ok(/^\d-\d$/.test(s.g) && /^\d-\d$/.test(s.g2), `${s.id}: 학기 g`);
  ok(!/학년|학기/.test(s.name + s.note), `${s.id}: 아이 종이에 학년 · 학기 글`);
}
ok(SKILLS.length >= 60 && SKILLS.length <= 80, `기능 수 60~80 — 지금 ${SKILLS.length}`);

// ② 모든 차시가 한 기능 이상에
const covered = new Set(SKILLS.flatMap((s) => s.parts.map((p) => p.c)));
const missing = NODES.map((n) => n.id).filter((c) => !covered.has(c));
for (const c of missing) ok(!!LEFT[c], `기능에 없는 차시 ${c} ${byId[c].kid} — 기능에 넣거나 LEFT에 까닭`);
for (const [c, why] of Object.entries(LEFT)) info(`넣지 않은 차시 ${c}: ${why}`);
ok(NODES.length === 229, `차시 수 ${NODES.length}`);

// ③ 뽑기 — 10문제는 반드시 · 15 · 20은 max까지
const SEEDS = [1, 7, 20261105];
function check(s, n, seed, want = {}) {
  const sec = secOf(s, n, { want }), [S] = buildSheet({ v: 2, seed, s: [sec] }), its = S.items, lim = s.dup || 2;
  const prob = [];
  if (its.length !== n) prob.push(`${its.length}/${n}개`);
  const txt = its.map((x) => (x.choices ? `${toText(x.prompt)} ⟨${x.choices.map((c) => toText(c)).join(' / ')}⟩` : toText(x.prompt)));   /* 고르기는 글 + 보기로(pick.js v2와 같게) */
  if (new Set(txt).size !== txt.length) prob.push('같은 글 두 번');
  const ans = {}; its.forEach((x) => { if (!x.choices) { const k = JSON.stringify(x.sol); ans[k] = (ans[k] || 0) + 1; } });
  const many = Object.entries(ans).filter(([, v]) => v > lim); if (many.length) prob.push(`같은 답 ${lim}번 넘음 ${many[0][0]}`);
  for (const x of its) { const p = s.parts.find((q) => q.c === x.c); if (!p) prob.push(`갈래 밖 차시 ${x.c}`); else if (p.re && !new RegExp(p.re).test(toText(x.prompt))) prob.push(`거르기 어김 ${x.c}: ${toText(x.prompt).slice(0, 30)}`); }
  if (!s.mix) { const order = its.map((x) => s.parts.findIndex((q) => q.c === x.c)); if (order.some((v, i) => i && v < order[i - 1])) prob.push('갈래 차례가 섞임(쉬운 것 → 어려운 것이 아님)'); }
  if (!S.ex) prob.push('보기 없음');
  return { prob, its, S };
}
const t0 = Date.now(), cant = [];
for (const s of SKILLS) {
  for (const seed of SEEDS) { const { prob } = check(s, 10, seed); ok(!prob.length, `${s.id} ${s.name} 10문제(씨앗 ${seed}): ${prob.join(' · ')}`); }
  let top = 10;
  for (const n of [15, 20]) { if (SEEDS.every((seed) => !check(s, n, seed).prob.length)) top = n; else break; }
  if (top < 20) cant.push(`${s.name} ${top}`);
  ok((s.max || 20) === top, `${s.id} ${s.name}: 겹치지 않게 ${top}문제까지 됨 — max ${s.max || '(없음 = 20)'}을 ${top === 20 ? '지우세요' : top}로`);
  ok(COUNTS.filter((n) => n <= (s.max || 20)).includes(10), `${s.id}: 10문제를 고를 수 있어야 함`);
}
info(`20문제가 안 되는 기능: ${cant.join(' · ') || '없음'} · 뽑기 ${((Date.now() - t0) / 1000).toFixed(1)}초`);

// ④ 지시 한 줄
for (const s of SKILLS) for (const n of COUNTS) {
  const t = noteOf(s, n);
  ok(!/[{}]/.test(t) && !/undefined|null|NaN/.test(t), `${s.id} ${n}문제 지시에 풀리지 않은 자리: ${t}`);
  for (const e of lintKo(t)) ok(false, `${s.id} 지시 글: ${e} — ${t}`);
  const ns = splitN(s, n);
  ok(ns.reduce((a, b) => a + b, 0) === n && ns.every((x) => x >= 0), `${s.id} ${n}문제 나누기 ${ns}`);
  if (n >= s.parts.length) ok(ns.every((x) => x >= 1), `${s.id} ${n}문제 — 갈래마다 적어도 1 (${ns})`);
  ok(!/undefined/.test(partsText(s, n)), `${s.id} 갈래 글`);
}
{ const s = SKILL['s.d22']; ok(noteOf(s, 10) === '5번부터는 받아내림이 있어요.', `지시 번호 계산 — ${noteOf(s, 10)} (나누기 ${splitN(s, 10)})`); ok(noteOf(SKILL['a.d22'], 5) === '3번부터는 받아올림이 있어요. 5번부터는 합이 100보다 커요.', `5문제 — ${noteOf(SKILL['a.d22'], 5)}`); }

// ⑧ 아이 칸 위주
{ const s = SKILL['s.d22'];
  ok(JSON.stringify(focusShares(s, ['2-1-3:7'])) === '[1,1,2]' && JSON.stringify(splitN(s, 10, [1, 1, 2])) === '[3,2,5]', `받아내림 칸 위주 — ${focusShares(s, ['2-1-3:7'])} → ${splitN(s, 10, focusShares(s, ['2-1-3:7']))}`);
  ok(noteOf(s, 10, [1, 1, 2]) === '4번부터는 받아내림이 있어요.', `칸 위주 지시 — ${noteOf(s, 10, [1, 1, 2])}`);
  ok(JSON.stringify(focusShares(s, ['1-2-2:5'])) === '[2,0,0]' && noteOf(s, 10, [2, 0, 0]) === '', '첫 칸 위주면 더 어려운 갈래와 그 지시를 뺌');
  ok(focusShares(s, []) === null && focusShares(SKILL['m.kmix'], ['2-2-2:4']) === null && focusShares(SKILL['s.teen'], ['1-2-6:4']) === null, '칸이 없거나 섞기 · 한 갈래 기능은 기본 나누기'); }
//  한 차시 문제가 적어 칸 위주로 다 못 채우는 자리는 이 아이 연습지(sheet.js kidPreset)가 기본 나누기로 돌아감 — 여기선 목록만
const thin = [];
for (const s of SKILLS) for (const p of s.parts) {
  const sh = focusShares(s, [p.c]); if (!sh) continue;
  const n = Math.min(10, s.max || 20), sec = secOf(s, n, { shares: sh }), [S] = buildSheet({ v: 2, seed: 5, s: [sec] });
  ok(sec.it.every((x) => x.n > 0) && !/[{}]/.test(sec.note), `${s.id} ${p.c} 칸 위주 설정 — ${sec.it.map((x) => x.n)} · ${sec.note}`);
  if (S.items.length < n) thin.push(`${s.id}@${p.c} ${S.items.length}/${n}`);
}
info(`칸 위주로 다 못 채워 기본 나누기로 돌아가는 자리 ${thin.length}개 — ${thin.join(' · ') || '없음'}`);

// ⑤ 함정 꼴 — 이 기능 안에 WANT가 있는 차시 · 오개념마다
const trapRows = [];
for (const s of SKILLS) for (const p of s.parts) for (const id of Object.keys(WANT)) {
  if (!wantFor(id, p.c)) continue;
  const { prob, its } = check(s, 10, 3, { [p.c]: id });
  const mine = its.filter((x) => x.c === p.c), tn = mine.filter((x) => x.trap).length;
  ok(!prob.length, `${s.id} 함정(${id} @ ${p.c}) 10문제: ${prob.join(' · ')}`);
  ok(tn >= 1 && tn === Math.ceil(mine.length / 2), `${s.id} 함정(${id} @ ${p.c}): 그 차시 ${mine.length}문제 중 함정 ${tn}개 — 절반이어야`);
  if (mine.length >= 2) ok(!(mine[0].trap && mine[1].trap), `${s.id} 함정이 앞에 몰림`);
  trapRows.push(`${s.name}/${p.c}/${id} ${tn}/${mine.length}`);
}
info(`함정 꼴을 섞을 수 있는 자리 ${trapRows.length}개 — ${trapRows.join(' · ')}`);

// ⑥ 예전 뽑기(practice.js 11-05 앞)와 같은 문제 — 예전 주소가 그대로 같은 연습지
function oldSheet(spec) {
  const r = rng(Number(spec.seed) || 1), used = new Set();
  const pickSection = (sec) => { const out = [], ans = {};
    for (const sp of sec.it) { const re = sp.re ? new RegExp(sp.re) : null; let got = 0;
      for (let round = 0; round < 12 && got < sp.n; round++) for (const it of pickItems(sp.c, sp.n * 4, r, used)) {
        if (got >= sp.n) break; const txt = toText(it.prompt), key = JSON.stringify(it.sol);
        if (re && !re.test(txt)) continue; if (!it.choices && (ans[key] || 0) >= 2) continue; if (out.some((x) => toText(x.prompt) === txt)) continue;
        ans[key] = (ans[key] || 0) + 1; out.push(it); got++; } }
    return out; };
  return spec.s.map((sec) => { const items = pickSection(sec), seen = new Set(items.map((x) => toText(x.prompt))); const [ex] = pickItems(sec.it[0].c, 12, r, new Set()).filter((it) => !seen.has(toText(it.prompt)) && (!sec.it[0].re || new RegExp(sec.it[0].re).test(toText(it.prompt)))); return { items, ex }; });
}
// 메인이 11-05에 손으로 만든 설정 둘(차시 id · 문제 수)
const OLD1 = { seed: 5, s: [{ t: '가르기', it: [{ c: '1-1-3:3', n: 10 }] }, { t: '십몇 모으고 가르기', it: [{ c: '1-1-5:4', n: 10 }] }, { t: '짝수와 홀수', it: [{ c: '1-2-1:6', n: 10 }] }, { t: '두 자리 − 두 자리', it: [{ c: '1-2-2:5', n: 3 }, { c: '2-1-3:6', n: 3 }, { c: '2-1-3:7', n: 4 }] }, { t: '십몇 − 한 자리', it: [{ c: '1-2-6:4', n: 10 }] }, { t: '두 자리 + 한 자리', it: [{ c: '1-2-2:2', n: 5 }, { c: '2-1-3:2', n: 5 }] }, { t: '한글로 쓴 수', it: [{ c: '1-2-1:3', n: 5, re: '읽은 것' }, { c: '2-1-1:4', n: 5, re: '읽은 것|수로 쓰면' }] }] };
const OLD2 = { seed: 9, chk: true, s: [{ t: '한 자리 덧셈', it: [{ c: '1-1-3:6', n: 5 }, { c: '1-2-6:2', n: 5 }] }, { t: '한 자리 빼기', it: [{ c: '1-1-3:10', n: 5 }, { c: '1-2-4:5', n: 5 }] }, { t: '곱셈구구', it: ['2-2-2:2', '2-2-2:3', '2-2-2:4', '2-2-2:5', '2-2-2:6', '2-2-2:7'].map((c, i) => ({ c, n: i < 4 ? 2 : 1, re: '×.*=' })) }] };
for (const spec of [OLD1, OLD2]) for (const seed of [spec.seed, 77]) {
  const sp = { ...spec, seed }, a = oldSheet(sp), b = buildSheet(sp);
  const ta = a.map((x) => [...x.items.map((it) => toText(it.prompt)), x.ex ? toText(x.ex.prompt) : '']).flat(), tb = b.map((x) => [...x.items.map((it) => toText(it.prompt)), x.ex ? toText(x.ex.prompt) : '']).flat();
  ok(JSON.stringify(ta) === JSON.stringify(tb), `예전 설정(씨앗 ${seed})이 예전과 같은 문제 — ${ta.slice(0, 3).join(' | ')} ↔ ${tb.slice(0, 3).join(' | ')}`);
}

// ⑦ 메인이 쓴 설정 둘을 기능 이름으로
const SET1 = ['n.split9', 'n.teen', 'n.parity', 's.d22', 's.teen', 'a.d21', 'n.read'];
const SET2 = ['a.one', 's.one', 's.teen', 'a.d21', 's.d21', 'a.d22', 's.d22', 'm.kmix'];
for (const [nm, ids, chk] of [['설정 1', SET1, false], ['설정 2', SET2, true]]) {
  ok(ids.every((id) => SKILL[id]), `${nm}: 기능이 다 있음`);
  const spec = { v: 2, seed: 11, chk, s: ids.map((id) => secOf(SKILL[id], 10)) }, secs = buildSheet(spec);
  ok(secs.every((x) => x.items.length === 10 && x.ex), `${nm}: 갈래마다 10문제 + 보기 — ${secs.map((x) => x.items.length).join(',')}`);
  info(`${nm}: ${ids.map((id) => SKILL[id].name).join(' · ')}`);
}
// 메인 예시대로의 차시 짜임
const parts = (id) => SKILL[id].parts.map((p) => p.c + (p.re ? `(${p.re})` : '')).join(' → ');
ok(parts('s.d22') === '1-2-2:5 → 2-1-3:6 → 2-1-3:7', `두 자리 − 두 자리: ${parts('s.d22')}`);
ok(parts('n.read') === '1-2-1:3(읽은 것) → 2-1-1:4(읽은 것|수로 쓰면)', `한글로 쓴 수: ${parts('n.read')}`);
ok(parts('m.kmix') === ['2', '3', '4', '5', '6', '7'].map((k) => `2-2-2:${k}(×.*=)`).join(' → '), `곱셈구구 섞기: ${parts('m.kmix')}`);
ok(parts('a.one') === '1-1-3:6 → 1-2-6:2' && parts('s.one') === '1-1-3:10 → 1-2-4:5' && parts('a.d21') === '1-2-2:2 → 2-1-3:2' && parts('s.d21') === '1-2-2:4 → 2-1-3:5' && parts('a.d22') === '1-2-2:3 → 2-1-3:3 → 2-1-3:4', '덧셈 · 뺄셈 기능 짜임');
ok(parts('n.split9') === '1-1-3:3' && parts('n.teen') === '1-1-5:4' && parts('n.parity') === '1-2-1:6' && parts('s.teen') === '1-2-6:4', '한 차시 기능 짜임');
// 차시 → 기능 찾기(아이 자세히 → 이 아이 연습지)
ok(skillsOf('2-1-3:7')[0].id === 's.d22' && skillsOf('2-2-2:4')[0].id === 'm.k36', `차시로 기능 찾기 — 2-1-3:7 → ${skillsOf('2-1-3:7')[0].id} · 2-2-2:4 → ${skillsOf('2-2-2:4')[0].id}`);

// ⑨ 기능 카드 예시 둘(선생님 화면 #/t/sheet) — 늘 둘 · 서로 다름 · 같은 기능이면 늘 같음 · 쉬운 쪽은 첫 갈래 · 어려운 쪽은 끝 갈래 · 거르기 지킴 · 문제 글에 학년 X
{ const kx = (it) => (it.choices ? `${toText(it.prompt)} ⟨${it.choices.map((c) => toText(c)).join(' / ')}⟩` : toText(it.prompt));
  const t1 = Date.now();
  for (const s of SKILLS) {
    const a = examplesOf(s), b = examplesOf(s), first = s.parts[0], last = s.parts[s.parts.length - 1];
    ok(a.length === 2, `${s.id} 카드 예시가 둘이 아님 — ${a.length}개`);
    if (a.length < 2) continue;
    ok(kx(a[0].it) !== kx(a[1].it), `${s.id} 카드 예시 둘이 같음 — ${kx(a[0].it)}`);
    ok(JSON.stringify(a.map((x) => kx(x.it))) === JSON.stringify(b.map((x) => kx(x.it))), `${s.id} 카드 예시가 열 때마다 바뀜`);
    ok(a[0].it.c === first.c && a[1].it.c === last.c, `${s.id} 카드 예시 차시 — ${a[0].it.c} · ${a[1].it.c}`);
    for (const [x, p] of [[a[0], first], [a[1], last]]) if (p.re) ok(new RegExp(p.re).test(toText(x.it.prompt)), `${s.id} 카드 예시 거르기 어김 — ${toText(x.it.prompt)}`);
    ok(!/학년|학기/.test(a.map((x) => kx(x.it)).join(' ')), `${s.id} 카드 예시에 학년 글`);
  }
  info(`카드 예시 ${SKILLS.length * 2}개 만들기 ${Date.now() - t1}ms(두 번씩)`); }

// 종이 맞춤 연습지 — 문제 글이 쓰는 모양(분수 · 대분수)이 이 쪽 CSS에도 있음 · 정답 쪽 분수는 17/18 꼴(11-07 '58 + 16'으로 인쇄되던 것)
{ const fs = await import('node:fs'), html = fs.readFileSync(new URL('../paper/practice.html', import.meta.url), 'utf8'), js = fs.readFileSync(new URL('../paper/js/practice.js', import.meta.url), 'utf8');
  for (const cls of ['fr', 'fr-t', 'fr-b', 'mx', 'pic']) ok(new RegExp(`\\.${cls}[{ ,]`).test(html), `맞춤 연습지 CSS에 .${cls}가 없음(분수 · 그림이 깨져 인쇄됨)`);
  ok(/filter\(hasB\)/.test(js), '맞춤 연습지 정답이 빈칸 토막 글(분수 17/18)이 아님'); }

console.log(`기능 ${SKILLS.length}개 · 갈래 ${GROUPS.length}개 — ${checks}개 확인 · ${fails ? `실패 ${fails}` : '모두 통과'}`);
process.exit(fails ? 1 : 0);
