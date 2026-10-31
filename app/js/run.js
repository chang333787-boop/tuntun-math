// 오늘의 구보 — 매일 3~5분 '수학 기초 체력'(교사 10-31 '매일 구보를 해야 체력이 느는 것처럼')
//  근거: 짧게 · 자주 · 섞어서 꺼내 풀기 [D-6][D-8][D-10] · 회기마다 약 10분 · 1~5분 시간 잰 활동 [B-R12][B-R13] · 시간은 조용히 잼(재촉 X)
//  고른 판자: 다시 볼 날이 된 판자 → 오래 안 푼 판자(표가 있거나 고친 판자) · 판자마다 2문제 · 섞어서 · 다섯 판자까지
//  끝나면: 둘 다 맞힘 → 다시 보기 한 걸음 · '빠르게' 딴 지 3일 넘은 판자를 빠르게 맞히면 '오래'(돌 판자) · 틀리면 내일 다시
//  이번 주에 뛴 날을 보여 줌(연속 기록 압박 X — 내가 뛴 날 기록만)
import { byId, gradeIdx } from '../../engine/lessons/index.js';
import { makeSheet, itemOf, LES } from '../../paper/js/gen.js';
import { mascot } from '../../paper/js/mascot.js';
import * as KS from './kidstore.js';
import { draw } from './item.js';
import { plankSVG } from './bridge.js';
import { target, TIER, TIER_KID } from './stage.js';
import { esc, rand } from './local.js';
import { go, meOf } from './kid.js';

const say = (pose, html, size = 64) => `<div class="say">${mascot(pose, size)}<div class="bub">${html}</div></div>`;
const kid = (c) => (LES(c) ? LES(c).kid : c);
const DAY = 864e5;
export const today = (t = Date.now()) => { const d = new Date(t); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const lastOf = (K, c) => Math.max((K.rv && K.rv[c] && K.rv[c].t) || 0, ...(((K.mx || {})[c] || {}).runs || []).map((r) => r.t), (K.fixed || {})[c] || 0);

// 오늘 뛸 판자
export function runPlan(K, now = Date.now()) {
  const due = Object.entries(K.rv || {}).filter(([c, x]) => byId[c] && x.n < KS.REVIEW_DAYS.length && x.due <= now).map(([c]) => c);
  const pool = new Set([...Object.keys(K.mx || {}).filter((c) => (K.mx[c].tier || 0) >= 1), ...Object.keys(K.fixed || {})].filter((c) => byId[c] && !due.includes(c)));
  const stale = [...pool].filter((c) => now - lastOf(K, c) >= 2 * DAY).sort((a, b) => lastOf(K, a) - lastOf(K, b));
  const fresh = [...pool].filter((c) => !stale.includes(c)).sort((a, b) => lastOf(K, a) - lastOf(K, b));
  return [...due, ...stale, ...fresh].slice(0, 5);
}
// 이번 주(월~일)에 뛴 날
export function weekHTML(K, now = Date.now()) {
  const d = new Date(now), dow = (d.getDay() + 6) % 7, mon = now - dow * DAY;
  const days = (K.jog || []);
  return `<span class="week" aria-label="이번 주에 구보한 날">${['월', '화', '수', '목', '금', '토', '일'].map((w, i) => { const k = today(mon + i * DAY); return `<i class="${days.includes(k) ? 'on' : ''}${i === dow ? ' td' : ''}">${w}</i>`; }).join('')}</span>`;
}

export function runView(root) {
  const me = meOf(); if (!me) return go('#/join');
  const K = KS.load(me);
  const plan = runPlan(K);
  if (!plan.length) {
    root.innerHTML = `<div class="card">${say('think', '아직 구보할 판자가 없어요. 먼저 <b>준비 다리</b>나 <b>거꾸로 찾기</b>로 판자를 고치면, 그 판자들로 매일 구보를 해요.')}<div class="acts"><a class="btn pri" href="#/back">거꾸로 찾기</a><a class="btn" href="#/me">내 수 다리로</a></div></div>`;
    return;
  }
  const sh = makeSheet({ kind: 'run', words: false, id: rand(6), lessons: plan.map((c) => ({ c, n: 2 })), mixed: true });
  sh.items = sh.items.filter((it) => it.ch !== 'END'); sh.chapters = sh.chapters.filter((ch) => ch.key !== 'END');
  for (let i = sh.items.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [sh.items[i], sh.items[j]] = [sh.items[j], sh.items[i]]; }   // 섞어서 [D-10]
  const R = { done: {}, it: {} }, ms = {};
  let i = 0;
  KS.setNow(me, { mode: 'run' });
  const one = () => {
    if (i >= sh.items.length) return fin();
    const it = sh.items[i];
    draw(root, { prompt: it.snap.prompt, choices: it.snap.choices, tag: '오늘의 구보', dots: [i, sh.items.length], conf: false, onAnswer: (a, cf, t) => {
      let ok = false;
      if (a.idk) R.it[it.k] = { s: 'q' };
      else { try { ok = !!itemOf(it.c, it.p).check(a.vals, a.raws).ok; } catch (e) { ok = false; } R.it[it.k] = ok ? { s: 'ok' } : { s: 'x', a: a.raws }; }
      ms[it.k] = t; i++;
      if (ok) return one();
      const box = document.createElement('div'); box.className = 'fb no';
      box.innerHTML = `답은 <b>${esc(it.snap.sol.join(', '))}</b>예요. 이 판자는 내일 한 번 더 뛰어요.`;
      const b = document.createElement('button'); b.className = 'pri'; b.textContent = '다음'; b.style.marginLeft = '10px'; box.appendChild(b);
      root.querySelector('.qcard').appendChild(box);
      root.querySelectorAll('.qcard input, .qcard .qact button, .qcard .choices button').forEach((x) => (x.disabled = true));
      b.focus(); b.addEventListener('click', one);
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
      if (good && m.tier === 2 && med != null && med <= target(c) * 1.2 && now - (m.t2 || now) >= 3 * DAY) { m.tier = 3; up.push(c); }   // 며칠 뒤에도 빠르고 정확 = 오래
      if (good && !m.tier) m.tier = 1;
      K.mx[c] = m;
    }
    const d = today(now); K.jog = [...new Set([...(K.jog || []), d])].slice(-60);
    KS.save(me, K); KS.setReview(me, K); KS.pushMastery(me, K); KS.pushSummary(me, K); KS.setNow(me, { mode: 'home' });
    const okN = Object.values(R.it).filter((x) => x.s === 'ok').length;
    root.innerHTML = `<div class="card">${up.length ? say('cheer', `<b>${up.map((c) => esc(kid(c))).join(', ')}</b> — 며칠 지나도 빠르고 정확해요! <b>'오래'</b> 표를 따서 <b>돌 판자</b>가 됐어요.`, 80) : say(again.length ? 'think' : 'cheer', `오늘 구보 끝! ${okN}/${sh.items.length} 맞혔어요.${again.length ? ` <b>${again.map((c) => esc(kid(c))).join(', ')}</b>은(는) 내일 한 번 더 뛰어요.` : ' 판자가 그대로 튼튼해요.'}`, 72)}
      <p>이번 주 구보 ${weekHTML(K, now)}</p>
      <div class="plank-list">${plan.map((c) => `<span class="pk ${again.includes(c) ? 'shaky' : 'ok'}">${plankSVG((K.mx[c] && K.mx[c].tier) || 1, 40)} ${esc(kid(c))}</span>`).join('')}</div>
      <div class="acts"><a class="btn pri big" href="#/me">내 수 다리로</a><a class="btn big" href="#/stages">스테이지</a></div></div>`;
  };
  root.innerHTML = `<div class="card">${say('hi', `<b>오늘의 구보</b> — 3~5분이면 돼요. 매일 조금씩 뛰면 수학 체력이 붙어요.<br>고친 판자 <b>${plan.length}개</b>를 섞어서 두 문제씩 꺼내 풀어요.`, 72)}<p>이번 주 구보 ${weekHTML(K)}</p><button class="pri big" id="s">출발</button> <a class="btn" href="#/me">내 수 다리로</a></div>`;
  root.querySelector('#s').addEventListener('click', one);
}
