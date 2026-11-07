// 선생님이 준 문제(보충) — 선생님이 반 표 · 아이 자세히에서 고른 기능 하나 · n문제(docs/what.md ② 연습할 것)
//  과제 = in/<id> { kind: 'give', sk: 기능 id(engine/skills.js), n, seed, t } · 같은 씨앗 = 종이 맞춤 연습지와 같은 문제(paper/js/pick.js buildSheet)
//  다 풀면 기록 kind 'gv' · 기록 id = 과제 id → 판정(반 표)에 들어감 · 요약 gv = [맞힘, 문제 수, 때](kidstore.summaryOf)
//  틀리면 넘어가지 않고 도움 사다리(hint.js — 떠올리기 → 한 단계씩 → 처음 문제 다시) · 맞으면 바로 다음 · 도중에 나가도 이 기기에서 이어서
import { SKILL, secOf } from '../../engine/skills.js';
import { buildSheet, examplesOf } from '../../paper/js/pick.js';
import { formOf, itemOf } from '../../paper/js/gen.js';
import { toText } from '../../engine/tokens.js';
import { mascot } from '../../paper/js/mascot.js';
import * as KS from './kidstore.js';
import { draw, okFlash } from './item.js';
import { ladder } from './hint.js';
import { lsGet, lsSet, lsDel, esc } from './local.js';
import { go, meOf } from './kid.js';
import { tile } from './icons.js';

const say = (pose, html, size = 88) => `<div class="say">${mascot(pose, size)}<div class="bub">${html}</div></div>`;
const short = (t, n = 22) => (t.length > n ? `${t.slice(0, n - 1)}…` : t);

// 과제 → 문제 묶음(같은 과제면 늘 같은 문제 · 종이 연습지와 같은 뽑기)
export function giveSheet(id, task) {
  const s = SKILL[task && task.sk]; if (!s) return null;
  const n = Math.max(1, Math.min(20, Number(task.n) || 10));
  const want = task.want && typeof task.want === 'object' ? Object.fromEntries(Object.entries(task.want).filter(([c, m]) => typeof c === 'string' && typeof m === 'string')) : {};   /* 그 생각으로 풀면 틀리는 함정 꼴을 절반(선생님이 고름 · 아이 화면엔 표시 X) */
  const [sec] = buildSheet({ v: 2, seed: Number(task.seed) || 1, s: [secOf(s, n, { want })] });
  const items = sec.items.map((it, i) => ({ k: i + 1, c: it.c, p: it.p, form: formOf(it), cls: '', ch: 'G', snap: { prompt: it.prompt, sol: it.sol, choices: it.choices || null } }));
  return { v: 1, id, kind: 'gv', made: Date.now(), items, chapters: [{ key: 'G', ks: items.map((x) => x.k) }], note: sec.note };
}
// 아이 화면에 보일 예시 한 줄(기능 이름 대신 — 낮은 학년 이름이 크게 보이지 않게 · kid.js plank와 같은 생각)
export function exampleOfSkill(sk) { try { const [e] = examplesOf(SKILL[sk]); return e ? short(toText(e.it.prompt)) : ''; } catch (e) { return ''; } }
// 아직 안 푼 보충(받은 차례대로)
export function giveTasks(K) {
  return Object.entries(K.inbox || {}).filter(([id, x]) => x && x.kind === 'give' && SKILL[x.sk] && !(K.recs || {})[id]).sort((a, b) => (a[1].t || 0) - (b[1].t || 0))
    .map(([id, x]) => { const ex = exampleOfSkill(x.sk); return { kind: 'give', id, t: x.t, title: `선생님이 준 문제 ${Number(x.n) || 10}개`, sub: ex ? `${ex} 같은 문제` : '선생님이 고른 문제', href: `#/give/${id}` }; });
}

export function giveView(root, id) {
  const me = meOf(); if (!me) return go('#/join');
  const K = KS.load(me), task = (K.inbox || {})[id];
  if (!task || task.kind !== 'give' || !SKILL[task.sk]) return go('#/me');
  const head = (body) => { root.innerHTML = `<div class="card msg act-fix"><p class="eyebrow">${tile('give', 22)}연습할 것 · 선생님이 준 문제</p>${body}</div>`; };
  const doneRec = K.recs[id];
  if (doneRec) {
    const ok = doneRec.s.it.filter((i) => doneRec.r.it[i[0]] && doneRec.r.it[i[0]].s === 'ok').length;
    head(`${say('cheer', `이 문제는 다 풀었어요. <b>${doneRec.s.it.length}문제 중 ${ok}개</b> 맞혔어요.`)}<div class="acts"><a class="btn pri big" href="#/me">처음 화면으로</a></div>`);
    return;
  }
  const sh = giveSheet(id, task);
  if (!sh || !sh.items.length) return go('#/me');
  const SK = `tt.gv.${me.C}.${me.no}`;
  let S = lsGet(SK);
  if (!S || S.id !== id) S = { id, i: 0, R: { done: {}, it: {} }, ms: {} };
  const keep = () => lsSet(SK, S);
  KS.setNow(me, { mode: 'give' });
  const budget = { left: 3 };   /* 한 판에 '한 단계씩'은 세 번까지(조사 R · docs/hint_ladder.md) */
  const one = () => {
    if (S.i >= sh.items.length) return fin();
    const it = sh.items[S.i];
    draw(root, { prompt: it.snap.prompt, choices: it.snap.choices, tag: '선생님이 준 문제', act: 'give', dots: [S.i, sh.items.length], conf: false, onAnswer: (a, cf, t) => {
      let ok = false;
      if (a.idk) S.R.it[it.k] = { s: 'q' };
      else { try { ok = !!itemOf(it.c, it.p).check(a.vals, a.raws).ok; } catch (e) { ok = false; } S.R.it[it.k] = ok ? { s: 'ok' } : { s: 'x', a: a.raws }; }
      S.ms[it.k] = Math.max(0, Math.round(t || 0)); S.i++; keep();
      if (ok) return okFlash(root, one);
      /* 틀리면 넘어가지 않고 떠올리기 → 한 단계씩 → 처음 문제 다시(hint.js · 기록은 첫 답 그대로) */
      ladder(root, { it: itemOf(it.c, it.p), c: it.c, raws: a.idk ? null : a.raws, tag: '선생님이 준 문제', act: 'give', dots: [S.i - 1, sh.items.length], budget, onEnd: (r) => { KS.ladLog(me, K, r.how); if (r.how === 'recall' || r.how === 'steps') { KS.selfFix(me, K, r.how); S.fixd = (S.fixd || 0) + 1; keep(); } one(); } });
    } });
  };
  const fin = () => {
    sh.chapters.forEach((ch) => (S.R.done[ch.key] = true));
    KS.addSheet(me, K, sh, S.R, {}, S.ms);
    const fixd = S.fixd || 0; lsDel(SK); KS.setNow(me, { mode: 'home' });
    const ok = sh.items.filter((x) => S.R.it[x.k] && S.R.it[x.k].s === 'ok').length, n = sh.items.length;
    /* 많이 틀렸으면 가장 많이 틀린 꼴을 튼튼이와 차근차근(배우기 — 시범 → 같이 → 혼자) */
    const miss = {}; sh.items.forEach((x) => { if (!(S.R.it[x.k] && S.R.it[x.k].s === 'ok')) miss[x.c] = (miss[x.c] || 0) + 1; });
    const worst = Object.entries(miss).sort((a, b) => b[1] - a[1])[0], learn = worst && n - ok >= 3 ? worst[0] : null;
    head(`${say(ok === n ? 'cheer' : 'think', `선생님이 준 문제를 다 풀었어요. 처음에 <b>${n}문제 중 ${ok}개</b>를 혼자 맞혔어요.${fixd ? ` 틀린 것 가운데 <b>${fixd}개</b>는 도움을 받아 고쳤어요.` : ''}${learn ? '<br>틀린 문제가 여럿이에요. 튼튼이와 차근차근 배워 봐요.' : ''}`, 104)}
      <div class="acts">${learn ? `<a class="btn pri big" href="#/fix/${encodeURIComponent(learn)}">튼튼이와 배우기</a><a class="btn big" href="#/me">처음 화면으로</a>` : '<a class="btn pri big" href="#/me">처음 화면으로</a>'}</div>`);
  };
  if (S.i > 0) return one();
  head(`${say('hi', `선생님이 골라 준 문제예요. 모두 <b>${sh.items.length}문제</b>.${sh.note ? `<br><span class="small">${esc(sh.note)}</span>` : ''}<br>틀리면 그 자리에서 다시 보는 법을 알려 줘요.`, 104)}<div class="acts"><button class="pri big" id="s">시작</button><a class="btn big" href="#/me">처음 화면으로</a></div>`);
  root.querySelector('#s').addEventListener('click', one);
}
