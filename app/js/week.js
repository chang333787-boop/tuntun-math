// 이번 주 점검 — 주 1회 3~5분 · 섞은 10문제 · 맞고 틀림은 끝나고 · 시간은 조용히 → 내 선 그래프(나와만 견줌)
//  근거: 진행 점검(CBM)은 주 1회 · 짧게 · 같은 범위에서 고르게 뽑은 혼합 문항 → 선 그래프 → 선생님이 그 선을 보고 수업을 바꿀 때 효과 [B-R12][B-R18][B-R19][B-R20] · 순위 X [D-20]
//  범위는 학기마다 고정(그 학기 단원들의 준비 칸 전체 · weekcore termPool) — 주마다 고르는 칸이 바뀌면 선끼리 견줄 수 없음 · 고른 칸만 재면 '좋아 보이는 선'이 됨
//  기록은 따로 두지 않음 — 푼 묶음(kind 'week' · unit = 'T4-2') 자체가 기록 → 다른 기기 · 선생님 화면에서도 같은 선
import { makeSheet, itemOf, lessonName } from '../../paper/js/gen.js';
import { mascot } from '../../paper/js/mascot.js';
import * as KS from './kidstore.js';
import { draw, staticHTML, ansSay } from './item.js';
import { weeksOf, weekTerm, weekPlan, weekChart, doneThisWeek } from './weekcore.js';
import { esc, rand } from './local.js';
import { go, meOf } from './kid.js';

const say = (pose, html, size = 64) => `<div class="say">${mascot(pose, size)}<div class="bub">${html}</div></div>`;

export function weekView(root) {
  const me = meOf(); if (!me) return go('#/join');
  const K = KS.load(me), rep = KS.reportOf(K), term = weekTerm(K);
  if (doneThisWeek(K.recs)) {
    root.innerHTML = `<div class="card">${say('cheer', '이번 주 점검은 벌써 했어요. 다음 주에 또 해요!')}${weekChart(weeksOf(K.recs, term))}<div class="acts"><a class="btn big" href="#/me">내 수 다리로</a></div></div>`;
    return;
  }
  const plan = weekPlan(K, rep, term);
  if (plan.length < 4) {
    root.innerHTML = `<div class="card">${say('think', '아직 점검할 판자가 적어요. 준비 다리나 판자 고치기를 하고 나서 해요.')}<div class="acts"><a class="btn big" href="#/me">내 수 다리로</a></div></div>`;
    return;
  }
  const sh = makeSheet({ kind: 'week', words: false, id: rand(6), lessons: plan.map((c) => ({ c, n: 1 })), mixed: true });
  sh.unit = term;   /* 'T4-2' — 단원 id가 아님(홈이 단원 준비 여부를 unit으로 봄) */
  sh.items = sh.items.filter((it) => it.ch !== 'END'); sh.chapters = sh.chapters.filter((ch) => ch.key !== 'END');
  for (let i = sh.items.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [sh.items[i], sh.items[j]] = [sh.items[j], sh.items[i]]; }
  const R = { done: {}, it: {} }, ms = {};
  let i = 0;
  KS.setNow(me, { mode: 'week' });
  const one = () => {
    if (i >= sh.items.length) return fin();
    const it = sh.items[i];
    draw(root, { prompt: it.snap.prompt, choices: it.snap.choices, tag: '이번 주 점검', dots: [i, sh.items.length], conf: false, onAnswer: (a, cf, t) => {
      let ok = false;
      if (a.idk) R.it[it.k] = { s: 'q' };
      else { try { ok = !!itemOf(it.c, it.p).check(a.vals, a.raws).ok; } catch (e) { ok = false; } R.it[it.k] = ok ? { s: 'ok' } : { s: 'x', a: a.raws }; }
      ms[it.k] = t; i++; one();
    } });
  };
  const fin = () => {
    sh.chapters.forEach((ch) => (R.done[ch.key] = true));
    KS.addSheet(me, K, sh, R, {}, ms);
    const ws = weeksOf(K.recs, term), cur = ws[ws.length - 1], okN = cur.ok, n = cur.n;
    KS.setNow(me, { mode: 'home' });
    // 지난 점들(최대 셋) 평균과 견줌 · ±2점 안은 '비슷해요'(열 문제 한 번은 1~2점씩 흔들림 — 흔들림을 '내려갔어요'로 말하지 않게)
    const past = ws.slice(-4, -1), sc = Math.round((okN / n) * 10), avg = past.length ? past.reduce((a, v) => a + (v.ok / v.n) * 10, 0) / past.length : null, diff = avg == null ? null : sc - avg;
    const head = diff == null ? say('hi', `이번 주 점검 끝! 10점으로 치면 <b>${sc}점</b>이에요. 다음 주에 또 해서 선을 이어 봐요.`) : diff >= 2 ? say('cheer', `<b>${sc}점</b> — 지난 점검들보다 올랐어요! 판자가 튼튼해지고 있어요.`) : diff > -2 ? say('hi', `<b>${sc}점</b> — 지난 점검들과 비슷해요. 선이 어디로 가는지 몇 주 더 봐요.`) : say('think', `<b>${sc}점</b> — 지난 점검들보다 낮아요. 괜찮아요, 어디가 흔들리는지 알게 됐어요. 아래 판자를 내 수 다리에서 다시 다져요.`);
    const miss = sh.items.filter((it) => !R.it[it.k] || R.it[it.k].s !== 'ok');
    const li = (it) => { const r = R.it[it.k] || {}, mine = r.s === 'q' ? '넘어감' : it.snap.choices ? '' : `내 답 ${esc((r.a || []).join(', '))}`;
      return `<li class="miss"><span class="why">${esc(lessonName(it.c))}${mine ? ` · ${mine}` : ''}</span>${it.snap.choices ? `${staticHTML(it.snap.prompt)} <span class="small">${ansSay(it.snap)}</span>` : staticHTML(it.snap.prompt, it.snap.sol)}</li>`; };
    const list = miss.length ? `<h3>다시 볼 문제 ${miss.length}개 <small class="muted">(바른 답을 넣어 보여 줘요)</small></h3><ul class="steps">${miss.slice(0, 4).map(li).join('')}</ul>${miss.length > 4 ? `<details><summary>${miss.length - 4}개 더 보기</summary><ul class="steps">${miss.slice(4).map(li).join('')}</ul></details>` : ''}` : `<p>${n}문제 모두 맞혔어요.</p>`;
    root.innerHTML = `<div class="card">${head}<h3>내 선 <small class="muted">(나하고만 견줘요)</small></h3>${weekChart(ws)}${list}<div class="acts"><a class="btn pri big" href="#/me">내 수 다리로</a></div></div>`;
  };
  root.innerHTML = `<div class="card">${say('hi', `<b>이번 주 점검</b> — ${term ? `${esc(term.slice(1, 2))}학년 ${esc(term.slice(3))}학기로 가는 판자들에서 ` : ''}섞은 문제 ${plan.length}개, 3~5분이면 돼요.<br>맞고 틀림은 끝나고 한꺼번에 보여요. 주마다 한 번 해서 내 선이 어디로 가는지 봐요.`)}${(() => { const ws = weeksOf(K.recs, term); return ws.length ? `<h3>지금까지 내 선</h3>${weekChart(ws)}` : ''; })()}<button class="pri big" id="s">시작</button> <a class="btn" href="#/me">내 수 다리로</a></div>`;
  root.querySelector('#s').addEventListener('click', one);
}
