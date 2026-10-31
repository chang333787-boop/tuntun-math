// 이야기 다리 시험: node app/test/story.test.mjs
//  ① 유형 표가 words.js kind를 모두 덮음(차시마다 이야기를 만들어 봄) ② 막대 틀 셋 중 맞는 틀은 하나뿐 · 맞는 틀이 말하는 답 = 이야기 답 · 틀린 틀은 다른 답
//  ③ 한 판 고르기: 모르는 자리 고루 · 처음 수 모름은 뒤쪽 · '더'가 있는데 빼는 이야기 · 같은 두 수 X ④ 이야기 200개 정답 경로(유형 → 틀 → 식 → 계산 → 답)
//  ⑤ 낱말만 보고 고른 식 → 이야기에 있는 낱말을 찾음 ⑥ 나눠 읽기가 글을 잃지 않음 ⑦ 기록: 묶음 → 싸기 · 풀기 → 종이 판정(form 'w' · f · a) ⑧ 선생님 요약 st.story · 다른 기기 ⑨ 익숙함
import { NODES, byId } from '../../engine/lessons/index.js';
import { rng } from '../../engine/math.js';
import { toText } from '../../engine/tokens.js';
import { hasWords, storyOf } from '../../engine/words.js';
import { KIND } from '../../paper/js/gen.js';
import { kidReport, readItem } from '../../paper/js/judge.js';
import { TYPES, FAMILY, KIND_TYPE, schemaOf, framesOf, frameKey, implied, splitStory, cueOf, isCue, profileOf, familiar, famOfLesson, whyOf } from '../../engine/schema.js';
import { planOf, probOf, pickLessons, sheetOf, resultOf, logOf, storyLog, storySum, capOf, SLOTS } from '../js/storylog.js';
import * as KS from '../js/kidstore.js';

let fail = 0;
const ok = (c, m) => { if (!c) { fail++; console.log('✗', m); } else console.log('✓', m); };
const slotType = (k) => KIND_TYPE[{ 'timesB÷': 'times', 'timesM÷': 'times', 'need÷': 'pack', 'packR÷': 'pack', 'shareR÷': 'share' }[k] || k.slice(0, -1)];
const near = (x, y) => Math.abs(x - y) < 1e-6 * Math.max(1, Math.abs(y));

// ① 유형 표
{
  const kinds = new Set(Object.keys(KIND)), made = new Set(), noSc = [];
  for (const L of NODES.filter((x) => hasWords(x.id))) {
    const r = rng(L.id.length * 31 + 7);
    for (let i = 0; i < 60; i++) {
      let p; try { p = L.gen(r); } catch (e) { continue; }
      const s = storyOf(L.id, p, i * 131 + 1); if (!s) continue;
      made.add(s.kind); kinds.add(s.kind);
      const sc = schemaOf(s); if (!sc) noSc.push(`${L.id} ${s.kind}`);
    }
  }
  const miss = [...kinds].filter((k) => !KIND_TYPE[k]);
  ok(!miss.length, `유형 표가 kind ${kinds.size}개를 모두 덮음${miss.length ? ` — 빠짐 ${miss.join(', ')}` : ''}`);
  ok(!noSc.length, `만든 이야기는 모두 구조(틀)를 읽음${noSc.length ? ` — ${noSc.slice(0, 5).join(' · ')}` : ''}`);
  ok(Object.values(KIND_TYPE).every((t) => TYPES[t]) && Object.values(FAMILY).every((f) => f.types.every((t) => TYPES[t].fam === Object.keys(FAMILY).find((k) => FAMILY[k] === f))), '유형마다 갈래(덧뺄 · 곱나눗)가 맞음');
  ok(!Object.values(TYPES).some((t) => /덧셈|뺄셈|곱셈|나눗셈|더하기|빼기|곱하기|나누기 문제/.test(t.kid + t.say)), '유형 이름 · 설명에 연산 이름이 없음 [C-9]');
}

// ② 막대 틀 — 차시마다
{
  let n = 0, bad = [], not3 = 0, eqv = 0;
  for (const L of NODES.filter((x) => hasWords(x.id))) {
    const r = rng(L.id.length * 17 + 3);
    for (let i = 0; i < 40; i++) {
      let p; try { p = L.gen(r); } catch (e) { continue; }
      const s = storyOf(L.id, p, i * 7 + 11); if (!s) continue;
      const sc = schemaOf(s); if (!sc) continue;
      n++;
      const ix = implied(sc, { R: sc.R, dir: sc.dir });
      if (!near(ix, sc.xf)) bad.push(`${L.id} ${sc.slot}: 맞는 틀의 답 ${ix} ≠ 이야기 답 ${sc.xf} — ${toText(s.story)}`);
      const F = framesOf(sc, i), rk = frameKey(sc, { R: sc.R, dir: sc.dir });
      if (F.list.length !== 3) { not3++; const vs = Object.values(sc.v).map((x) => x.n / x.d); if (new Set(vs).size === vs.length) bad.push(`${L.id} ${sc.slot}: 수가 다른데 틀이 ${F.list.length}개`); continue; }
      const rights = F.list.filter((f) => f.key === rk).length;
      if (rights !== 1 || F.list[F.right].key !== rk) bad.push(`${L.id} ${sc.slot}: 맞는 틀 ${rights}개`);
      if (new Set(F.list.map((f) => f.key)).size !== 3) bad.push(`${L.id} ${sc.slot}: 같은 모양 틀`);
      for (const f of F.list) if (f.key !== rk) { const x = implied(sc, f); if (Number.isFinite(x) && near(x, sc.xf)) { eqv++; bad.push(`${L.id} ${sc.slot}: 틀린 틀이 같은 답 ${x}`); } }
      if (!whyOf(sc)) bad.push(`${L.id} ${sc.slot}: 까닭 글 없음`);
    }
  }
  ok(!bad.length, `막대 틀 ${n}개 이야기 — 맞는 틀 하나뿐 · 맞는 틀의 답 = 이야기 답 · 틀린 틀은 다른 답${bad.length ? `\n   ${bad.slice(0, 8).join('\n   ')}` : ''}`);
  console.log(`   (두 수가 같아 틀이 둘뿐인 이야기 ${not3}개 — 한 판에는 내지 않음)`);
}

// ③ ④ 한 판 고르기 + 정답 경로
const SETS = [['1-2-2:3', '1-2-2:5'], ['2-1-3:3', '2-1-3:7'], ['3-1-1:3', '3-1-1:6'], ['3-1-1:4', '3-1-1:7'], ['4-2-1:3', '4-2-1:7'], ['4-2-3:9', '4-2-3:11'], ['5-1-5:4', '5-1-5:6'],
  ['2-2-2:4', '3-1-3:6'], ['3-1-4:5', '3-2-2:3', '3-2-2:7'], ['3-2-1:4', '3-2-2:5', '3-2-2:6'], ['4-1-3:3', '4-1-3:6', '4-1-3:7'], ['5-2-2:4', '6-1-1:4'], ['5-2-4:6', '6-2-2:5'], ['5-2-2:5', '6-2-1:3']];
const all = [];
{
  let comp = [];
  for (const [si, cs] of SETS.entries()) for (let rep = 0; rep < 3; rep++) {
    const items = planOf(cs, { seed: 1000 * si + rep + 1 });
    const prs = items.map(probOf);
    if (items.length !== 6 || prs.some((x) => !x)) comp.push(`${cs}: ${items.length}문제`);
    if (new Set(prs.map((x) => toText(x.s.story))).size !== prs.length) comp.push(`${cs}: 같은 글 두 번`);
    if (prs.some((x) => x.fr.list.length !== 3)) comp.push(`${cs}: 틀이 셋이 아닌 문제`);
    const slots = prs.map((x) => x.sc.slot), can = new Set(cs.flatMap((c) => Object.keys(capOf(c).slots)));
    if (famOfLesson(byId[cs[0]]) === 'as') {
      if (can.has('start+') && slots.indexOf('start+') < 3) comp.push(`${cs}: 처음 수 모름이 뒤쪽에 없음 (${slots})`);
      if (can.has('diff−') && !slots.includes('diff−')) comp.push(`${cs}: '더'가 있는데 빼는 이야기 없음`);
      if (can.has('start+') && !slots.includes('start+')) comp.push(`${cs}: 처음 수 모름 없음`);
      const unk = new Set(prs.map((x) => x.sc.unk));
      if (can.has('change−') && can.has('start+') && !['res', 'chg', 'start'].every((u) => unk.has(u))) comp.push(`${cs}: 변화의 모르는 자리(결과 · 바뀐 양 · 처음)가 고루 아님 (${[...unk]})`);
    } else if (new Set(prs.map((x) => x.sc.type)).size < Math.min(3, new Set([...can].map(slotType)).size)) comp.push(`${cs}: 곱나눗 유형이 고루 아님 (${slots})`);
    all.push(...prs);
  }
  // 판을 거듭하면 덜 본 칸이 나옴(큰 쪽 · 작은 쪽 모름이 돌아감)
  let log = [], seen = new Set();
  for (let k = 0; k < 4; k++) { const items = planOf(['3-1-1:4', '3-1-1:7'], { seed: 77 + k, log }); for (const it of items) { const pr = probOf(it); seen.add(pr.sc.slot); log.push({ t: k, slot: pr.sc.slot, type: pr.sc.type, s: [1, 1, 1, 1, 1] }); } }
  ok(['more−', 'less+', 'more+'].every((x) => seen.has(x)), `판을 거듭하면 비교의 큰 쪽 · 작은 쪽 모름이 돌아가며 나옴 (${[...seen].join(' ')})`);
  ok(!comp.length, `한 판 고르기 ${SETS.length * 3}판 — 여섯 문제 · 모르는 자리 고루 · 처음 수 모름은 뒤쪽 · '더'인데 빼기 포함${comp.length ? `\n   ${comp.slice(0, 8).join('\n   ')}` : ''}`);
}
{
  const bad = [];
  for (const pr of all) {
    const { s, sc, fr } = pr, fam = famOfLesson(byId[pr.c]);
    const cards = FAMILY[fam].types;
    if (cards.filter((t) => t === sc.type).length !== 1) bad.push(`${pr.c}: 유형 카드`);
    if (fr.list[fr.right].key !== frameKey(sc, { R: sc.R, dir: sc.dir })) bad.push(`${pr.c}: 틀`);
    const pk = s.steps[0].item;
    if (!pk.check([pk.sol[0]]).ok || pk.choices.length < 2) bad.push(`${pr.c}: 식 고르기`);
    const calc = s.steps[1].item;
    if (!calc.check(calc.sol.map(Number), calc.sol.map(String)).ok) bad.push(`${pr.c}: 계산`);
    if (!s.item.check(s.item.sol.map(Number), s.item.sol.map(String)).ok) bad.push(`${pr.c}: 답`);
    const sp = splitStory(s.story), joined = toText(sp.flatMap((x) => [...x.toks, ' ']));
    if (joined.replace(/\s+/g, '') !== toText(s.story).replace(/\s+/g, '')) bad.push(`${pr.c}: 나눠 읽기가 글을 잃음`);
    if (!sp.length || sp[sp.length - 1].tag !== 'ask') bad.push(`${pr.c}: 마지막 마디가 묻는 것이 아님 — ${toText(s.story)}`);
  }
  ok(all.length >= 200 && !bad.length, `이야기 ${all.length}개 정답 경로(유형 → 틀 → 식 → 계산 → 답) · 나눠 읽기${bad.length ? `\n   ${bad.slice(0, 8).join('\n   ')}` : ''}`);
}

// ⑤ 낱말만 보고 고른 식 → 헷갈리게 한 낱말
{
  const bad = []; let n = 0;
  for (const pr of all) {
    const { s, sc } = pr, pk = s.steps[0].item;
    if (!['diff−', 'more−', 'less+', 'start+', 'part−', 'timesB÷'].includes(sc.slot)) continue;
    const wrongs = pk.choices.map((_, i) => i).filter((i) => i !== pk.sol[0]);
    for (const i of wrongs) {
      const res = pk.check([i]), name = res.bug && res.bug.name;
      if (!/만 보고|곱셈을 고름/.test(String(name)) || (sc.slot !== 'timesB÷' && /곱셈을 고름/.test(name))) continue;
      n++;
      const cue = cueOf(sc, name, toText(s.story));
      if (!cue) { bad.push(`${sc.slot} '${name}' — ${toText(s.story)}`); continue; }
      const w = toText(s.story).split(/\s+/).find((x) => isCue(cue, x));
      if (!w) bad.push(`${sc.slot}: 누를 낱말이 글에 없음 ${cue.word}`);
    }
  }
  ok(n > 30 && !bad.length, `낱말만 보고 고른 식 ${n}개 — 헷갈리게 한 낱말을 이야기에서 찾음${bad.length ? `\n   ${bad.slice(0, 6).join('\n   ')}` : ''}`);
}

// ⑦ 기록 — 묶음 → 싸기 · 풀기 → 종이 판정
const K = { recs: {}, rv: {}, fixed: {}, log: [], story: { log: [] } };
{
  const items = planOf(['3-1-1:3', '3-1-1:6'], { seed: 5 });
  const sh = sheetOf({ id: 'sZZ1', items, made: Date.now() - 1000 });
  const res = {}; sh.items.forEach((it, i) => (res[it.k] = { s: i === 2 ? [1, 1, 0, 1, 1] : i === 4 ? [0, 0, 1, 0, 1] : [1, 1, 1, 1, 1], t: Date.now() - 1000 + i, ms: 30000 }));
  const R = resultOf(sh, res);
  const packed = KS.pack(sh), back = KS.unpack(packed);
  ok(packed.it.every((r) => r.length === 6 && typeof r[5] === 'number') && KS.okRec({ s: packed, r: R }), '묶음을 싸면 문항마다 이야기 seed가 붙고 기록 모양 검사를 통과');
  ok(back.items.length === sh.items.length && back.items.every((it, i) => it.form === 'w' && it.word.kind === sh.items[i].word.kind && toText(it.word.story) === toText(sh.items[i].word.story)), '풀면 같은 이야기(form w) — 판정이 문장제로 읽음');
  const rec = kidReport([back], { [back.id]: { me: R } }, 'me', { from: '1-1', to: '6-2' });
  ok(rec.words.length === 6 && rec.n === 0, `종이 판정: 문장제 ${rec.words.length}개 · 계산 문항으로 세지 않음(${rec.n})`);
  ok(rec.wsum.f === 5 && rec.wsum.a === 5 && rec.words.find((w) => w.k === 3).f === false && rec.words.find((w) => w.k === 5).a === false, `식 틀림 → f 0 · 계산 틀림 → a 0 (식 ${rec.wsum.f}/6 · 답 ${rec.wsum.a}/6)`);
  ok(rec.wordCheck.some(([c, k]) => c === back.items[2].c && k === back.items[2].word.kind), '식을 못 세운 구조는 이야기 확인지 목록(wordCheck)으로');
  const one = readItem(back, back.items[0], R);
  ok(one && one.word && one.f === true && one.a === true, 'readItem이 { f, a }로 읽음');
  // ⑧ 선생님 요약 — 이 기기 로그 · 다른 기기(서버 기록만)
  K.recs[sh.id] = { s: packed, r: R, cf: {}, ms: {} };
  K.story.log = logOf(sh, res);
  const P1 = storySum(K), sum = KS.summaryOf(K);
  const tot = Object.values(P1).reduce((a, v) => ({ n: a.n + v.n, type: a.type + v.type, frame: a.frame + v.frame, eq: a.eq + v.eq, ans: a.ans + v.ans }), { n: 0, type: 0, frame: 0, eq: 0, ans: 0 });
  ok(tot.n === 6 && tot.type === 5 && tot.frame === 5 && tot.eq === 5 && tot.ans === 5, `st.story 요약: 푼 6 · 유형 ${tot.type} · 틀 ${tot.frame} · 식 ${tot.eq} · 답 ${tot.ans}`);
  ok(sum.story && Object.keys(sum.story).every((k) => /^[\w가-힣 ·]{1,24}$/.test(k) && Object.values(TYPES).some((t) => t.short === k)), `summaryOf에 story — 열쇠는 유형 이름(${Object.keys(sum.story).join(', ')})`);
  const K2 = { recs: K.recs, rv: {}, fixed: {}, log: [] };
  ok(JSON.stringify(storySum(K2)) === JSON.stringify(P1), '다른 기기(로그 없이 서버 기록만)에서도 같은 요약');
  ok(JSON.stringify(profileOf([...K.story.log, ...storyLog(K2)].filter((e, i, a) => a.findIndex((x) => x.sh === e.sh && x.k === e.k) === i))) === JSON.stringify(P1), '이 기기 로그와 서버 기록이 겹쳐도 두 번 세지 않음');
}

// ⑨ 익숙함 — 같은 유형 두 번 이어서 ①②를 첫 번에 → 건너뜀 · 건너뛰고 식을 틀리면 다시 보임
{
  const e = (t, s) => ({ t, type: 'compare', s });
  ok(familiar([e(1, [1, 1, 1, 1, 1]), e(2, [1, 1, 0, 1, 1])], 'compare'), '두 번 이어서 ①②를 맞히면 건너뜀(식은 상관없음)');
  ok(!familiar([e(1, [1, 1, 1, 1, 1]), e(2, [1, 0, 1, 1, 1])], 'compare'), '틀을 한 번 틀리면 건너뛰지 않음');
  ok(familiar([e(1, [1, 1, 1, 1, 1]), e(2, [1, 1, 1, 1, 1]), e(3, [null, null, 1, 1, 1])], 'compare'), '건너뛰고 식까지 맞히면 계속 건너뜀');
  ok(!familiar([e(1, [1, 1, 1, 1, 1]), e(2, [1, 1, 1, 1, 1]), e(3, [null, null, 0, 1, 1])], 'compare'), '건너뛰고 식을 틀리면 다음엔 ①②가 다시 보임');
  const pf = profileOf([e(1, [null, null, 1, 1, 1])]);
  ok(pf['비교'].type === 1 && pf['비교'].sk === 1, '건너뛴 ①②는 익숙함으로 맞음에 셈(sk에 따로 남김)');
}

// 차시 고르기 — 확인된 계산 차시 · 없으면 쉬운 차시
{
  const L = { '3-1-1:3': { c: '3-1-1:3', st: 'ok' }, '3-1-1:6': { c: '3-1-1:6', st: 'ok' }, '3-2-2:3': { c: '3-2-2:3', st: 'stuck' } };
  const a = pickLessons(L, 'as', 3), m = pickLessons(L, 'md', 3);
  ok(a.cs.join() === '3-1-1:3,3-1-1:6' && !a.easy, `덧뺄: 확인된 차시(${a.cs})`);
  ok(m.easy && m.cs.every((c) => byId[c] && hasWords(c)) && !m.cs.includes('3-2-2:3'), `곱나눗: 확인된 차시가 없으면 쉬운 차시(${m.cs}) · 막힌 차시 X`);
  ok(SLOTS.as.flat().every((k) => /[+−]$/.test(k)) && SLOTS.md.flat().every((k) => /[×÷]$/.test(k)), '칸 차례가 갈래와 맞음');
}
console.log(fail ? `FAIL ${fail}` : 'PASS');
process.exitCode = fail ? 1 : 0;
