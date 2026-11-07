// 점검지(아이 화면 #/check/<id>) — 선생님이 낸 점검지를 화면에서 푼다: 종이와 같은 문제(같은 id · seed → 같은 문제) · 한 번에 12문제 · 남으면 다음에 이어서
//  받은 과제 in/<id> = { kind:'check', id, from, to, words:false, n, seed, t } (tcheck.js가 냄)
//  기록 = 한 번마다 작은 묶음 r/<id>_<번째>(kind 'ck') — 그 번에 푼 문항만 담는다(원래 k · c · p · 관문 · 덮는 칸 · 장 그대로)
//    ⚠️ 판정(paper/js/judge.js readItem)은 끝낸 장(done) 안에서 결과가 없는 문항을 '맞음'으로 읽는다 → 안 푼 문항은 절대 묶음에 넣지 않는다
//  진행은 기록(K.recs)에서 센다 — 다른 기기에서 푼 것도 pull로 들어오므로 기록이 정본 · 요약 st.ck[id] = 푼 문항 수(kidstore summaryOf)
//  맞고 틀림은 그 자리에서 알리지 않는다(종이처럼 · 선생님이 봄) · 찍기 멈춤은 그대로 · 푸는 중인 한 번은 이 기기에 적어 두었다가 끊기면 다음에 들어올 때 기록으로 넣음
import { makeSheet, itemOf, LES } from '../../paper/js/gen.js';
import { gradeIdx } from '../../engine/lessons/index.js';
import { mascot } from '../../paper/js/mascot.js';
import * as KS from './kidstore.js';
import { draw, rushGuard, rushPause } from './item.js';
import { lsGet, lsSet, lsDel } from './local.js';
import { go, meOf } from './kid.js';
import { tile } from './icons.js';

export const CK = { per: 12 };
export const CK_ID = /^[A-Za-z0-9-]{1,24}$/;   /* '_'는 기록 id(<점검 id>_<번째>)의 가름표라 점검 id에는 쓰지 않음 */
const say = (pose, html, size = 104) => `<div class="say">${mascot(pose, size)}<div class="bub">${html}</div></div>`;
const EB = `<p class="eyebrow">${tile('chk', 22)}점검지</p>`;

// 과제가 바른 꼴인가(아이 기기는 받은 값을 믿지 않고 맞춰 읽음)
export const okTask = (id, x) => !!(x && x.kind === 'check' && CK_ID.test(String(id)) && gradeIdx(x.from) >= 0 && gradeIdx(x.to) >= gradeIdx(x.from) && Number(x.n) > 0);
// 같은 과제 → 같은 문제(종이와 같음) · seed를 같이 받으면 엔진 판이 바뀌어도 같은 수 고르기
export function checkSheet(id, x) {
  if (!okTask(id, x)) return null;
  return makeSheet({ kind: 'gate', from: x.from, to: x.to, words: false, id: String(id), seed: x.seed != null && Number.isFinite(Number(x.seed)) ? Number(x.seed) : null });
}
// 이 점검지의 기록(한 번마다 하나)
const recsOf = (K, id) => Object.entries(K.recs || {}).filter(([rid, x]) => KS.okRec(x) && x.s.kind === 'ck' && String(rid).split('_')[0] === id);
// 이미 푼 문항 번호(k)
export function doneKs(K, id) {
  const s = new Set();
  for (const [, x] of recsOf(K, id)) for (const i of x.s.it) if (x.r.it[i[0]]) s.add(Number(i[0]));
  return s;
}
// 다음 번호(<점검 id>_<번째>) — 있는 것 가운데 가장 큰 것 + 1
export const nextNo = (K, id) => recsOf(K, id).reduce((m, [rid]) => Math.max(m, Number(String(rid).split('_')[1]) + 1 || 0), 0);
// 아직 안 푼 문항부터 한 번에 per개(종이 차례 그대로)
export const nextBatch = (sh, done, per = CK.per) => sh.items.filter((it) => !done.has(it.k)).slice(0, per);
// 한 번에 푼 문항만 담은 작은 묶음 + 결과 — items = 그 번에 낸 문항 · R = { k: 결과 } (안 푼 k는 R에 없음 → 묶음에서 뺀다)
export function batchRec(id, no, items, R, made = Date.now()) {
  const its = items.filter((it) => R[it.k] && R[it.k].s);
  const chs = new Map();
  for (const it of its) { if (!chs.has(it.ch)) chs.set(it.ch, []); chs.get(it.ch).push(it.k); }
  const sh = { id: `${id}_${no}`, kind: 'ck', made, unit: null, items: its.map((it) => ({ k: it.k, c: it.c, p: it.p, gate: !!it.gate, covers: it.covers || null, ch: it.ch, form: it.form || 'h' })), chapters: [...chs].map(([key, ks]) => ({ key, ks })) };
  const r = { done: Object.fromEntries([...chs.keys()].map((k) => [k, true])), it: Object.fromEntries(its.map((it) => [it.k, R[it.k]])) };
  return { sh, r };
}

// 아이 홈 카드 ①에 넣을 할 일 — 다 푼 점검지는 뺌 · 새로 낸 것부터
export function checkTasks(K) {
  return Object.entries(K.inbox || {}).filter(([id, x]) => okTask(id, x)).map(([id, x]) => {
    const total = Number(x.n), done = [...doneKs(K, id)].filter((k) => k <= total).length, left = Math.max(0, total - done);
    return { id, title: '선생님이 낸 점검지', sub: done ? `남은 문제 ${left}개 · 이어서 풀어요` : `모두 ${total}문제 · 한 번에 ${CK.per}문제씩 풀어요`, href: `#/check/${id}`, left, total, t: Number(x.t) || 0 };
  }).filter((x) => x.left > 0).sort((a, b) => b.t - a.t).map(({ t, ...x }) => x);
}

// 푸는 중인 한 번 — 이 기기에만(끊겨도 푼 것을 잃지 않게)
const wipKey = (me) => `tt.ck.${me.C}.${me.no}`;
function flushWip(me, K) {
  const w = lsGet(wipKey(me));
  lsDel(wipKey(me));
  if (!w || !CK_ID.test(String(w.id)) || !Array.isArray(w.items) || !w.R || typeof w.R !== 'object') return false;
  const items = w.items.filter((it) => it && LES(it.c) && Number.isFinite(Number(it.k)));
  const done = doneKs(K, w.id), R = Object.fromEntries(Object.entries(w.R).filter(([k]) => !done.has(Number(k))));
  if (!Object.keys(R).length) return false;
  const { sh, r } = batchRec(w.id, nextNo(K, w.id), items, R);
  if (!sh.items.length) return false;
  KS.addSheet(me, K, sh, r, {}, w.ms || {});
  return true;
}

export function checkRunView(root, id) {
  const me = meOf(); if (!me) return go('#/join');
  let alive = true, K = null, wip = null;
  root.innerHTML = `<div class="card msg act-prep">${EB}${say('hi', '점검지를 불러오는 중이에요…')}</div>`;
  (async () => {
    const got = await KS.pull(me);
    if (!alive) return;
    K = got.K;
    flushWip(me, K);
    const x = (K.inbox || {})[id], sh = checkSheet(id, x);
    if (!sh) { root.innerHTML = `<div class="card msg act-prep">${EB}${say('think', '이 점검지는 지금 없어요. 처음 화면에서 오늘 할 것을 봐요.')}<div class="acts"><a class="btn pri big" href="#/me">처음 화면으로</a></div></div>`; return; }
    const total = sh.items.length;
    const leftNow = () => total - [...doneKs(K, id)].filter((k) => k <= total).length;
    const rush = rushGuard();
    let lastNow = 0;
    const begin = () => {
      const items = nextBatch(sh, doneKs(K, id));
      if (!items.length) return finished(0);
      wip = { id, items: items.map((it) => ({ k: it.k, c: it.c, p: it.p, gate: !!it.gate, covers: it.covers || null, ch: it.ch, form: it.form })), R: {}, ms: {} };
      lsSet(wipKey(me), wip);
      let i = 0;
      const one = () => {
        if (!alive) return;
        if (i >= items.length) return endBatch();
        const it = items[i];
        if (Date.now() - lastNow > 5000) { lastNow = Date.now(); KS.setNow(me, { mode: 'check', n: total - leftNow() + i }); }
        draw(root, { prompt: it.snap.prompt, choices: it.snap.choices, tag: '점검지', act: 'chk', dots: [i, items.length], conf: false, onAnswer: (a, cf, ms) => {
          let ok = false;
          if (a.idk) wip.R[it.k] = { s: 'q' };
          else { try { ok = !!itemOf(it.c, it.p).check(a.vals, a.raws).ok; } catch (e) { ok = false; } wip.R[it.k] = ok ? { s: 'ok' } : { s: 'x', a: a.raws }; }
          wip.ms[it.k] = ms; lsSet(wipKey(me), wip); i++;
          if (rush(ms, a, ok) && i < items.length) { K.rush = (K.rush || 0) + 1; KS.save(me, K); return rushPause(root, one); }
          one();
        } });
      };
      one();
    };
    const endBatch = () => {
      const n = Object.keys(wip.R).length;
      const { sh: b, r } = batchRec(id, nextNo(K, id), wip.items, wip.R);
      if (b.items.length) KS.addSheet(me, K, b, r, {}, wip.ms);
      wip = null; lsDel(wipKey(me));
      KS.setNow(me, { mode: 'home' });
      finished(n);
    };
    const finished = (n) => {
      const left = leftNow();
      if (left <= 0) {
        root.innerHTML = `<div class="card msg act-prep">${EB}${say('cheer', `${n ? `${n}문제 했어요. ` : ''}점검지를 다 풀었어요. 선생님이 결과를 봐요.`)}<div class="acts"><a class="btn pri big" href="#/me">처음 화면으로</a></div></div>`;
        return;
      }
      root.innerHTML = `<div class="card msg act-prep">${EB}${say('point', `${n}문제 했어요. 남은 문제 ${left}개는 다음에 이어서 풀어요.`)}<div class="acts"><a class="btn pri big" href="#/me">처음 화면으로</a><button class="big" id="more">이어서 ${Math.min(CK.per, left)}문제</button></div></div>`;
      root.querySelector('#more').addEventListener('click', begin);
    };
    const left = leftNow();
    if (left <= 0) return finished(0);
    const head = left === total
      ? `선생님이 낸 점검지예요. 모두 ${total}문제 · 한 번에 ${CK.per}문제씩 풀어요.<br>맞고 틀림은 선생님이 봐요. 모르면 넘어가도 돼요.`
      : `점검지를 이어서 풀어요. 남은 문제 ${left}개 · 이번에 ${Math.min(CK.per, left)}문제예요.<br>맞고 틀림은 선생님이 봐요. 모르면 넘어가도 돼요.`;
    root.innerHTML = `<div class="card msg act-prep">${EB}${say('hi', head)}<div class="acts"><button class="pri big" id="s">시작</button><a class="btn big" href="#/me">처음 화면으로</a></div></div>`;
    root.querySelector('#s').addEventListener('click', begin);
  })();
  // 다른 화면으로 가면 — 이번 번에 푼 것만 기록으로(남은 문제는 다음에 이어서)
  return () => {
    alive = false;
    if (!K || !wip || !Object.keys(wip.R).length) return;
    const { sh: b, r } = batchRec(id, nextNo(K, id), wip.items, wip.R);
    if (b.items.length) KS.addSheet(me, K, b, r, {}, wip.ms);
    wip = null; lsDel(wipKey(me)); KS.setNow(me, { mode: 'home' });
  };
}
