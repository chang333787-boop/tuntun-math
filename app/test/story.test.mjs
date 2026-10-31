// 이야기 다리 시험: node app/test/story.test.mjs
//  ① 유형 표가 words.js kind를 모두 덮음(차시마다 이야기를 만들어 봄) ② 막대 틀 셋 중 맞는 틀은 하나뿐 · 맞는 틀이 말하는 답 = 이야기 답 · 틀린 틀은 다른 답
//  ③ 한 판 고르기: 모르는 자리 고루 · 처음 수 모름은 뒤쪽 · '더'가 있는데 빼는 이야기 · 같은 두 수 X ④ 이야기 200개 정답 경로(유형 → 틀 → 식 → 계산 → 답)
//  ⑤ 낱말만 보고 고른 식 → 이야기에 있는 낱말을 찾음 ⑥ 나눠 읽기가 글을 잃지 않음 · '몇'이 든 마디는 모르는 수 ⑦ 기록: 묶음 → 싸기 · 풀기 → 종이 판정(form 'w' · f · a) ⑧ 선생님 요약 st.story · 다른 기기
//  ⑨ 익숙함(모르는 자리마다 · 처음 모름 · 불일치는 늘 걸음 넷) ⑩ 식 보기 셋 이상 · 정답 하나 ⑪ 한 판이 한 연산 · 한 문장 틀로 흐르지 않음 ⑫ 변화 틀의 늘어남 · 줄어듦이 그림으로 갈림
import { NODES, byId } from '../../engine/lessons/index.js';
import { rng } from '../../engine/math.js';
import { toText } from '../../engine/tokens.js';
import { hasWords, storyOf } from '../../engine/words.js';
import { KIND } from '../../paper/js/gen.js';
import { kidReport, readItem } from '../../paper/js/judge.js';
import { TYPES, FAMILY, KIND_TYPE, schemaOf, framesOf, frameKey, implied, splitStory, cueOf, isCue, profileOf, familiar, familiarTypes, noSkip, famOfLesson, whyOf, cueWhy, rereadOf, eqPick, learnedOp } from '../../engine/schema.js';
import { planOf, probOf, pickLessons, sheetOf, resultOf, logOf, storyLog, storySum, capOf, SLOTS, EASY, headOf, HEAD_MAX } from '../js/storylog.js';
import { frameSVG } from '../js/story.js';
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
  const OPW = /덧셈|뺄셈|곱셈|나눗셈|더하기|빼기|곱하기|나누기/;
  ok(!Object.values(TYPES).some((t) => OPW.test(t.kid + t.say)), '유형 이름 · 설명에 연산 이름이 없음 [C-9]');
  ok(!Object.values(FAMILY).some((f) => OPW.test(f.kid + f.ask)), `처음 고르는 갈래 카드(${Object.values(FAMILY).map((f) => f.kid).join(' / ')})에도 연산 이름이 없음 [C-9]`);
}

// ② 막대 틀 — 차시마다 · 틀린 틀도 말이 되는 것만(음수 · 0 · 자연수 이야기에 자연수 아닌 답 X · 묶음 수는 자연수)
const inPlan = new Set([...SLOTS.as.flat(), ...SLOTS.md.flat(), 'rows×', 'rate×']);
{
  let n = 0, bad = [], short = {}, tot = {};
  for (const L of NODES.filter((x) => hasWords(x.id))) {
    const r = rng(L.id.length * 17 + 3);
    for (let i = 0; i < 40; i++) {
      let p; try { p = L.gen(r); } catch (e) { continue; }
      const s = storyOf(L.id, p, i * 7 + 11); if (!s) continue;
      const sc = schemaOf(s); if (!sc) continue;
      n++; tot[sc.slot] = (tot[sc.slot] || 0) + 1;
      const ix = implied(sc, { R: sc.R, dir: sc.dir });
      if (!near(ix, sc.xf)) bad.push(`${L.id} ${sc.slot}: 맞는 틀의 답 ${ix} ≠ 이야기 답 ${sc.xf} — ${toText(s.story)}`);
      const F = framesOf(sc, i), rk = frameKey(sc, { R: sc.R, dir: sc.dir });
      for (const f of F.list) if (f.key !== rk) {
        const x = implied(sc, f), ty = f.T || sc.type, cnt = f.R.count === 'x' ? x : f.R.count ? sc.v[f.R.count].n / sc.v[f.R.count].d : 1;
        if (!(Number.isFinite(x) && x > 0 && (sc.st !== 'W' || near(x, Math.round(x))))) bad.push(`${L.id} ${sc.slot}: 말 안 되는 틀(답 ${x}) — ${toText(s.story)}`);
        if (['groups', 'share', 'pack'].includes(ty) && !(cnt >= 1 && near(cnt, Math.round(cnt)))) bad.push(`${L.id} ${sc.slot}: 묶음 수가 자연수가 아닌 틀`);
        if (Number.isFinite(x) && near(x, sc.xf)) bad.push(`${L.id} ${sc.slot}: 틀린 틀이 같은 답 ${x}`);
        if (f.T && TYPES[f.T].fam === 'md' && !learnedOp(L.id, '×')) bad.push(`${L.id} ${sc.slot}: 곱셈을 안 배운 학년에 묶음 틀`);
      }
      if (F.list.length !== 3) { short[sc.slot] = (short[sc.slot] || 0) + 1; continue; }
      const rights = F.list.filter((f) => f.key === rk).length;
      if (rights !== 1 || F.list[F.right].key !== rk) bad.push(`${L.id} ${sc.slot}: 맞는 틀 ${rights}개`);
      if (new Set(F.list.map((f) => f.key)).size !== 3) bad.push(`${L.id} ${sc.slot}: 같은 모양 틀`);
      if (!whyOf(sc)) bad.push(`${L.id} ${sc.slot}: 까닭 글 없음`);
    }
  }
  ok(!bad.length, `막대 틀 ${n}개 이야기 — 맞는 틀 하나뿐 · 맞는 틀의 답 = 이야기 답 · 틀린 틀은 다른 답 · 말이 되는 틀만${bad.length ? `\n   ${bad.slice(0, 8).join('\n   ')}` : ''}`);
  const thin = Object.keys(tot).filter((k) => inPlan.has(k) && (short[k] || 0) > 0.1 * tot[k]);
  ok(!thin.length, `한 판에 내는 자리는 90% 넘게 틀이 셋 섬(부분과 전체 · 같은 묶음도 — 모자라면 이웃 유형 틀로)${thin.length ? ` — ${thin.map((k) => `${k} ${short[k]}/${tot[k]}`).join(' ')}` : ''}`);
  console.log(`   (틀이 셋 안 서서 한 판에 안 내는 이야기: ${Object.entries(short).map(([k, v]) => `${k} ${v}/${tot[k]}`).join(' · ')})`);
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
    if (!pk.check([pk.sol[0]]).ok || pk.choices.length < 2 || (pk.choices.length < 3 && pk.short !== 'op')) bad.push(`${pr.c}: 식 고르기 ${pk.choices.length}개`);
    const calc = s.steps[1].item;
    if (!calc.check(calc.sol.map(Number), calc.sol.map(String)).ok) bad.push(`${pr.c}: 계산`);
    if (!s.item.check(s.item.sol.map(Number), s.item.sol.map(String)).ok) bad.push(`${pr.c}: 답`);
    const sp = splitStory(s.story), joined = toText(sp.flatMap((x) => [...x.toks, ' ']));
    if (joined.replace(/\s+/g, '') !== toText(s.story).replace(/\s+/g, '')) bad.push(`${pr.c}: 나눠 읽기가 글을 잃음`);
    if (!sp.length || sp[sp.length - 1].tag !== 'ask') bad.push(`${pr.c}: 마지막 마디가 묻는 것이 아님 — ${toText(s.story)}`);
    for (const x of sp) { const t = toText(x.toks); if (x.tag === 'know' && /몇|얼마|며칠/.test(t)) bad.push(`${pr.c}: '몇'이 든 마디가 아는 것 — ${t}`); }
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

// ⑨ 익숙함 — 같은 유형 · 같은 모르는 자리 두 번 이어서 ①②를 첫 번에 → 건너뜀 · 건너뛰고 식을 틀리면 다시 보임
//  처음 수 모름 · 불일치(낱말과 셈이 반대)는 늘 걸음 넷 · 다른 자리는 따로 셈
{
  const e = (t, s, slot = 'more+') => ({ t, type: 'compare', slot, s });
  ok(familiar([e(1, [1, 1, 1, 1, 1]), e(2, [1, 1, 0, 1, 1])], 'compare', 'more+'), '두 번 이어서 ①②를 맞히면 건너뜀(식은 상관없음)');
  ok(!familiar([e(1, [1, 1, 1, 1, 1]), e(2, [1, 0, 1, 1, 1])], 'compare', 'more+'), '틀을 한 번 틀리면 건너뛰지 않음');
  ok(familiar([e(1, [1, 1, 1, 1, 1]), e(2, [1, 1, 1, 1, 1]), e(3, [null, null, 1, 1, 1])], 'compare', 'more+'), '건너뛰고 식까지 맞히면 계속 건너뜀');
  ok(!familiar([e(1, [1, 1, 1, 1, 1]), e(2, [1, 1, 1, 1, 1]), e(3, [null, null, 0, 1, 1])], 'compare', 'more+'), '건너뛰고 식을 틀리면 다음엔 ①②가 다시 보임');
  const pf = profileOf([e(1, [null, null, 1, 1, 1])]);
  ok(pf['비교'].type === 1 && pf['비교'].sk === 1, '건너뛴 ①②는 익숙함으로 맞음에 셈(sk에 따로 남김)');
  const ch = (t, slot) => ({ t, type: 'change', slot, s: [1, 1, 1, 1, 1] });
  ok(familiar([ch(1, 'join+'), ch(2, 'join+')], 'change', 'join+') && !familiar([ch(1, 'join+'), ch(2, 'join+')], 'change', 'take−') && !familiar([ch(1, 'join+'), ch(2, 'take−')], 'change', 'join+'), '자리마다 따로 셈 — 결과 모름(늘어남)에 익숙해도 다른 자리는 걸음 넷');
  const perfect = (slot, type) => [1, 2, 3].map((t) => ({ t, type, slot, s: [1, 1, 1, 1, 1] }));
  const hardOnes = all.filter((pr) => pr.sc.unk === 'start' || pr.sc.inc), never = hardOnes.filter((pr) => familiar(perfect(pr.sc.slot, pr.sc.type), pr.sc.type, pr.sc.slot));
  ok(hardOnes.length > 30 && !never.length && ['start+', 'diff−', 'part−', 'less+', 'more−', 'timesB÷'].every(noSkip), `처음 수 모름 · 불일치 이야기 ${hardOnes.length}개 — 세 번 다 맞혀도 건너뛰지 않음${never.length ? ` — ${never.slice(0, 3).map((p) => p.sc.slot).join(' ')}` : ''}`);
  const easyOnes = all.filter((pr) => !noSkip(pr.sc.slot)).filter((pr) => !familiar(perfect(pr.sc.slot, pr.sc.type), pr.sc.type, pr.sc.slot));
  ok(!easyOnes.length, '바로 읽히는 자리(결과 모름 · 모으기 · 같은 묶음 …)는 두 번 맞히면 건너뜀');
  ok(JSON.stringify(familiarTypes([...perfect('start+', 'change'), ...perfect('more+', 'compare')])) === '["compare"]', "'익숙해진 이야기' 줄에는 건너뛸 수 있는 자리만");
}

// 차시 고르기 — 확인된 계산 차시 · 없으면 쉬운 차시
{
  const L = { '3-1-1:3': { c: '3-1-1:3', st: 'ok' }, '3-1-1:6': { c: '3-1-1:6', st: 'ok' }, '3-2-2:3': { c: '3-2-2:3', st: 'stuck' } };
  const a = pickLessons(L, 'as', 3), m = pickLessons(L, 'md', 3);
  ok(a.cs.join() === '3-1-1:3,3-1-1:6' && !a.easy, `덧뺄: 확인된 차시(${a.cs})`);
  ok(m.easy && m.cs.every((c) => byId[c] && hasWords(c)) && !m.cs.includes('3-2-2:3'), `곱나눗: 확인된 차시가 없으면 쉬운 차시(${m.cs}) · 막힌 차시 X`);
  ok(SLOTS.as.flat().every((k) => /[+−]$/.test(k)) && SLOTS.md.flat().every((k) => /[×÷]$/.test(k)), '칸 차례가 갈래와 맞음');
}

// ⑩ 식 보기 — 셋 이상(그 학년이 다른 연산을 안 배웠으면 둘) · 다른 갈래 연산 하나 · 정답은 하나 · 안 배운 연산 X
{
  const bad = []; let n3 = 0, n2 = 0;
  const EQ = /^(\d+ \d+\/\d+|\d+\/\d+|\d+(?:\.\d+)?) ([+−×÷]) (\d+ \d+\/\d+|\d+\/\d+|\d+(?:\.\d+)?)$/;
  const fv = (t) => t.split(' ').reduce((a, x) => a + (x.includes('/') ? Number(x.split('/')[0]) / Number(x.split('/')[1]) : Number(x)), 0);
  const vOf = (t) => { const m = toText([].concat(t)).match(EQ); if (!m) return null; const x = fv(m[1]), y = fv(m[3]); return { op: m[2], v: m[2] === '+' ? x + y : m[2] === '−' ? x - y : m[2] === '×' ? x * y : x / y }; };
  for (const pr of all) {
    const pk = pr.s.steps[0].item, L = byId[pr.c], g = Number(L.u[0]);
    const vs = pk.choices.map(vOf), right = vs[pk.sol[0]];
    if (pk.choices.length >= 3) n3++; else n2++;
    if (pk.choices.length < 3 && pk.short !== 'op') bad.push(`${pr.c}: 보기 ${pk.choices.length}개 — ${pk.choices.map((c) => toText([].concat(c))).join(' | ')}`);
    if (!right) continue;
    vs.forEach((x, i) => { if (i !== pk.sol[0] && x && Math.abs(x.v - right.v) < 1e-9) bad.push(`${pr.c}: 정답이 둘 — ${pk.choices.map((c) => toText([].concat(c))).join(' | ')}`); if (x && x.v <= 0) bad.push(`${pr.c}: 0 · 음수 보기`); });
    const ops = vs.filter(Boolean).map((x) => x.op).join('');
    if ((g === 1 || L.u.startsWith('2-1')) && /[×÷]/.test(ops)) bad.push(`${pr.c}: 안 배운 연산(× ÷) — ${ops}`);
    if (L.u.startsWith('2-2') && /÷/.test(ops)) bad.push(`${pr.c}: 안 배운 연산(÷) — ${ops}`);
    const fam = (op) => (op === '+' || op === '−' ? 'as' : 'md');
    if (pk.choices.length >= 3 && !vs.some((x, i) => x && i !== pk.sol[0] && fam(x.op) !== fam(right.op))) bad.push(`${pr.c}: 다른 갈래 연산 보기 없음 — ${ops}`);
  }
  const md2 = all.filter((pr) => famOfLesson(byId[pr.c]) === 'md' && pr.s.steps[0].item.choices.length < 3);
  ok(!bad.length && !md2.length, `식 보기 ${all.length}개 — 셋 이상 ${n3} · 둘(다른 연산을 아직 안 배운 학년) ${n2} · 곱나눗은 모두 셋 이상 · 정답 하나${bad.length ? `\n   ${bad.slice(0, 6).join('\n   ')}` : ''}`);
}

// ⑪ 한 판 — 고른 차시가 한 연산뿐이면 쉬운 차시에서 다른 연산을 섞음 · 같은 문장 틀(첫 8글자)은 두 번까지
{
  const P1 = pickLessons({ '3-1-4:5': { c: '3-1-4:5', st: 'ok' } }, 'md', 3);
  const ops = new Set(P1.cs.map((c) => capOf(c).op));
  ok(ops.has('×') && ops.has('÷') && P1.cs.includes('3-1-4:5') && P1.cs.some((c) => EASY.md.flat().includes(c)), `곱셈 칸만 확인 → 쉬운 나눗셈 차시를 섞음(${P1.cs})`);
  const P2 = pickLessons({ '3-1-4:5': { c: '3-1-4:5', st: 'ok' }, '3-1-3:6': { c: '3-1-3:6', st: 'stuck' } }, 'md', 3);
  ok(!P2.cs.includes('3-1-3:6'), `막힌 차시는 섞지 않음(${P2.cs})`);
  let mixed = 0, runs = 0; const heavy = [];
  for (let k = 0; k < 6; k++) {
    const items = planOf(P1.cs, { seed: 300 + k }), prs = items.map(probOf);
    runs++; const os = new Set(prs.map((x) => x.sc.op)); if (os.has('×') && os.has('÷')) mixed++;
  }
  for (const [si, cs] of [...SETS.entries(), [99, P1.cs]]) for (let rep = 0; rep < 3; rep++) {
    const hs = {}; planOf(cs, { seed: 500 * si + rep + 7 }).map(probOf).forEach((x) => { const h = headOf(x.s.story); hs[h] = (hs[h] || 0) + 1; });
    const over = Object.entries(hs).filter(([, v]) => v > HEAD_MAX); if (over.length) heavy.push(`${cs}: ${over.map(([h, v]) => `'${h}' ${v}번`).join(' ')}`);
  }
  ok(mixed === runs, `섞은 판 ${runs}개 모두 곱하는 이야기와 나누는 이야기가 같이 나옴(${mixed}/${runs})`);
  ok(!heavy.length, `한 판에 같은 문장 틀은 ${HEAD_MAX}번까지${heavy.length ? ` — ${heavy.slice(0, 4).join(' / ')}` : ''}`);
}

// ⑫ 변화 틀 — 늘어남은 결과 칸이 처음 칸보다 높고 줄어듦은 낮음(글자 없이도 · 흑백에서도) · 이웃 유형 틀도 그 유형 모양으로
{
  const pr = all.find((x) => x.sc.slot === 'join+');
  const hOf = (svg) => [...svg.matchAll(/<rect x="([\d.]+)" y="[\d.]+" width="88(?:\.0)?" height="([\d.]+)"/g)].map((m) => [Number(m[1]), Number(m[2])]);
  const up = hOf(frameSVG(pr.sc, { R: pr.sc.R, dir: '+' })), down = hOf(frameSVG(pr.sc, { R: pr.sc.R, dir: '−' }));
  const st = (xs) => xs.find(([x]) => x < 100)[1], res = (xs) => xs.find(([x]) => x > 200)[1];
  ok(up.length === 2 && down.length === 2 && res(up) > st(up) && res(down) < st(down), `늘어남 결과 칸 ${up.length === 2 ? res(up) : '?'} > 처음 ${up.length === 2 ? st(up) : '?'} · 줄어듦 결과 칸 ${down.length === 2 ? res(down) : '?'} < 처음`);
  const cross = all.map((x) => x.fr.list.filter((f) => f.T).map((f) => [x, f])).flat();
  ok(cross.length > 0 && cross.every(([x, f]) => /<svg/.test(frameSVG(x.sc, f)) && (f.T !== 'compare' || /차/.test(frameSVG(x.sc, f)))), `이웃 유형 틀 ${cross.length}개도 그 유형 모양으로 그림(부분과 전체 ↔ 비교 · 같은 묶음 ↔ 모으기)`);
}
console.log(fail ? `FAIL ${fail}` : 'PASS');
process.exitCode = fail ? 1 : 0;
