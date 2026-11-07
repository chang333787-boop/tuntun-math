// 매일 연습(옛 이름 '오늘의 구보' — 교사 11-05 '구보라는 말이 어색') — 매일 3~5분 기초 셈(교사 10-31 '매일 구보처럼 기초 체력')
//  근거: 짧게 · 자주 · 섞어서 꺼내 풀기 [D-6][D-8][D-10] · 회기마다 약 10분 · 1~5분 시간 잰 활동 [B-R12][B-R13] · 시간은 조용히 잼(재촉 X)
//  고른 판자: 다시 볼 날이 된 판자 → 오래 안 푼 판자(표가 있거나 고친 판자) · 판자마다 2문제 · 섞어서 · 다섯 판자까지
//    '오래 안 푼' = 마지막으로 그 칸을 푼 때(준비 다리 · 다듬기 · 점검 기록 모두) — 방금 준비 다리에서 맞힌 판자를 곧바로 내지 않게(혹평 11-01)
//  끝나면: 둘 다 맞힘 → 다시 보기 한 걸음 · '빠르게' 딴 지 3일 넘은 판자를 빠르게 맞히면 '오래'(돌 판자) · 틀리면 내일 다시
//  이번 주에 뛴 날을 보여 줌(연속 기록 압박 X — 내가 뛴 날 기록만)
import { byId, gradeIdx } from '../../engine/lessons/index.js';
import { makeSheet, itemOf, LES } from '../../paper/js/gen.js';
import { mascot } from '../../paper/js/mascot.js';
import * as KS from './kidstore.js';
import { draw, okFlash } from './item.js';
import { ladder } from './hint.js';
import { target, wantOf, isFact, lastReady } from './stage.js';
import { esc, rand } from './local.js';
import { go, meOf } from './kid.js';
import { tile, art } from './icons.js';

const sayArt = (k, html, size = 104) => `<div class="say">${art(k, size, 'say-art')}<div class="bub">${html}</div></div>`;
const say = (pose, html, size = 64) => `<div class="say">${mascot(pose, size)}<div class="bub">${html}</div></div>`;
const kid = (c) => (LES(c) ? LES(c).kid : c);
const DAY = 864e5;
export const today = (t = Date.now()) => { const d = new Date(t); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
// 칸마다 마지막으로 푼 때(기록 묶음의 시각 · 푼 문항만)
export function seenAt(K) {
  const m = {};
  for (const x of Object.values(K.recs || {})) {
    if (!x || !x.s || !Array.isArray(x.s.it) || !Number.isFinite(x.s.made) || !x.r || !x.r.it) continue;
    for (const i of x.s.it) if (Array.isArray(i) && x.r.it[i[0]]) m[i[1]] = Math.max(m[i[1]] || 0, x.s.made);
  }
  return m;
}
const lastOf = (K, c, seen = {}) => Math.max((K.rv && K.rv[c] && K.rv[c].t) || 0, ...(((K.mx || {})[c] || {}).runs || []).map((r) => r.t), (K.fixed || {})[c] || 0, seen[c] || 0);

// 오늘 뛸 판자
export function runPlan(K, now = Date.now()) {
  const due = Object.entries(K.rv || {}).filter(([c, x]) => byId[c] && x.n < KS.REVIEW_DAYS.length && x.due <= now).map(([c]) => c);
  const pool = new Set([...Object.keys(K.mx || {}).filter((c) => (K.mx[c].tier || 0) >= 1), ...Object.keys(K.fixed || {})].filter((c) => byId[c] && !due.includes(c)));
  const seen = seenAt(K), last = (c) => lastOf(K, c, seen), d0 = new Date(now); d0.setHours(0, 0, 0, 0);
  for (const c of [...pool]) if ((seen[c] || 0) >= d0.getTime()) pool.delete(c);   /* 오늘 이미 푼 칸은 빼기(방금 점검에서 맞힌 꼴을 또 — 잘하는 아이가 쉬운 것을 세 번 풀던 것 · 11-07 [D-6][D-8]) · 다시 볼 날이 된 칸은 그대로 */
  const stale = [...pool].filter((c) => now - last(c) >= 2 * DAY).sort((a, b) => last(a) - last(b));
  const fresh = [...pool].filter((c) => !stale.includes(c)).sort((a, b) => last(a) - last(b));
  return [...due, ...stale, ...fresh].slice(0, 5);
}
// 이번 주(월~일)에 뛴 날
export function weekHTML(K, now = Date.now()) {
  const d = new Date(now), dow = (d.getDay() + 6) % 7, mon = now - dow * DAY;
  const days = (K.jog || []);
  return `<span class="week" aria-label="이번 주에 매일 연습한 날">${['월', '화', '수', '목', '금', '토', '일'].map((w, i) => { const k = today(mon + i * DAY); return `<i class="${days.includes(k) ? 'on' : ''}${i === dow ? ' td' : ''}">${w}</i>`; }).join('')}</span>`;
}

export function runView(root) {
  const me = meOf(); if (!me) return go('#/join');
  const K = KS.load(me);
  const plan = runPlan(K);
  if (!plan.length) {
    root.innerHTML = `<div class="card msg act-run"><p class="eyebrow">${tile('daily', 22)}매일 연습</p>${say('think', '아직 매일 연습할 문제가 없어요.<br><b>점검</b>에서 맞힌 것이나 튼튼이와 배운 것이 생기면, 그 문제로 날마다 조금씩 연습해요.', 104)}<div class="acts"><a class="btn pri" href="#/me">처음 화면으로</a></div></div>`;
    return;
  }
  const rep0 = KS.reportOf(K);
  const sh = makeSheet({ kind: 'run', words: false, id: rand(6), lessons: plan.map((c) => { const want = wantOf(rep0, K.minds, c); return want ? { c, n: 2, want, trapN: 1 } : { c, n: 2 }; }), mixed: true });   // 보였던 생각이 있으면 둘 중 하나는 함정 짝
  sh.items = sh.items.filter((it) => it.ch !== 'END'); sh.chapters = sh.chapters.filter((ch) => ch.key !== 'END');
  for (let i = sh.items.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [sh.items[i], sh.items[j]] = [sh.items[j], sh.items[i]]; }   // 섞어서 [D-10]
  const R = { done: {}, it: {} }, ms = {};
  let fixd = 0;
  let i = 0;
  KS.setNow(me, { mode: 'run' });
  const budget = { left: 2 };   /* 한 판에 '한 단계씩'은 두 번까지(매일 연습은 짧게 · 조사 R) */
  const one = () => {
    if (i >= sh.items.length) return fin();
    const it = sh.items[i];
    draw(root, { prompt: it.snap.prompt, choices: it.snap.choices, tag: '매일 연습', act: 'daily', dots: [i, sh.items.length], conf: false, onAnswer: (a, cf, t) => {
      let ok = false;
      if (a.idk) R.it[it.k] = { s: 'q' };
      else { try { ok = !!itemOf(it.c, it.p).check(a.vals, a.raws).ok; } catch (e) { ok = false; } R.it[it.k] = ok ? { s: 'ok' } : { s: 'x', a: a.raws }; }
      ms[it.k] = t; i++;
      if (ok) return okFlash(root, one);
      /* 틀리면 넘어가지 않고 떠올리기 → 한 단계씩 → 처음 문제 다시(hint.js · 판정 · 내일 다시는 첫 답으로) */
      ladder(root, { it: itemOf(it.c, it.p), c: it.c, raws: a.idk ? null : a.raws, tag: '매일 연습', act: 'daily', dots: [i - 1, sh.items.length], budget, again: '이 꼴은 내일 매일 연습에 다시 나와요.', onEnd: (r) => { KS.ladLog(me, K, r.how); if (r.how === 'recall' || r.how === 'steps') { KS.selfFix(me, K, r.how); fixd++; } one(); } });
    } });
  };
  const fin = () => {
    sh.chapters.forEach((ch) => (R.done[ch.key] = true));
    KS.addSheet(me, K, sh, R, {}, ms);
    const now = Date.now(), up = [], again = [];
    K.mx = K.mx || {}; K.rv = K.rv || {};
    for (const c of plan) {
      const its = sh.items.filter((x) => x.c === c), good = its.every((x) => R.it[x.k] && R.it[x.k].s === 'ok');
      const t = its.map((x) => ms[x.k] || 0).sort((a, b) => a - b), med = t.length ? (t[0] + t[t.length - 1]) / 2 : null;
      const x = K.rv[c];
      if (good) { if (x && x.n < KS.REVIEW_DAYS.length && x.due <= now) { x.n++; x.t = now; x.due = x.n < KS.REVIEW_DAYS.length ? now + (KS.REVIEW_DAYS[x.n] - KS.REVIEW_DAYS[x.n - 1]) * DAY : Infinity; } }
      else { K.rv[c] = { n: 0, due: now + DAY, t: now }; again.push(c); }
      const m = K.mx[c] || { tier: 0, best: null, runs: [], t2: 0 };
      m.runs = [...(m.runs || []), { t: now, ok: its.filter((y) => R.it[y.k] && R.it[y.k].s === 'ok').length, n: its.length, med, run: 1 }].slice(-10);
      const trapsOk = its.filter((y) => y.trap).every((y) => R.it[y.k] && R.it[y.k].s === 'ok');
      if (good && trapsOk && lastReady(m, c, now) && (!isFact(c) || (med != null && med <= target(c) * 1.2))) { m.tier = 3; up.push(c); }   // 며칠 뒤에도 정확(셈 사실은 빠르기까지) = 오래
      if (good && !m.tier) { m.tier = 1; m.t1 = now; }
      K.mx[c] = m;
    }
    const d = today(now); K.jog = [...new Set([...(K.jog || []), d])].slice(-60);
    KS.save(me, K); KS.setReview(me, K); KS.pushMastery(me, K); KS.pushSummary(me, K); KS.setNow(me, { mode: 'home' });
    const okN = Object.values(R.it).filter((x) => x.s === 'ok').length;
    root.innerHTML = `<div class="card msg act-run"><p class="eyebrow">${tile('daily', 22)}매일 연습</p>${say(again.length ? 'think' : 'cheer', `오늘 매일 연습 끝! 처음에 ${sh.items.length}문제 중 <b>${okN}개</b>를 혼자 맞혔어요.${fixd ? ` 틀린 것 가운데 <b>${fixd}개</b>는 도움을 받아 고쳤어요.` : ''}${again.length ? `<br>틀린 문제와 같은 꼴은 내일 한 번 더 나와요.` : ''}`, 104)}
      <p>이번 주 연습한 날 ${weekHTML(K, now)}</p>
      <div class="acts"><a class="btn pri big" href="#/me">처음 화면으로</a></div></div>`;
  };
  root.innerHTML = `<div class="card msg act-run"><p class="eyebrow">${tile('daily', 22)}매일 연습</p>${sayArt('daily', `<b>매일 연습</b> — 섞은 ${sh.items.length}문제, 3~5분이면 돼요.<br>아는 것도 며칠 안 풀면 잊어요. 날마다 조금씩 꺼내 풀면 오래 남아요.`, 104)}<p>이번 주 연습한 날 ${weekHTML(K)}</p><div class="acts"><button class="pri big" id="s">시작</button><a class="btn" href="#/me">처음 화면으로</a></div></div>`;
  root.querySelector('#s').addEventListener('click', one);
}
