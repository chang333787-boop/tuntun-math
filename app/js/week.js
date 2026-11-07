// 이번 주 점검 — 주 1회 3~5분 · 섞은 10문제 · 맞고 틀림은 끝나고 · 시간은 조용히 → 주마다 맞힌 수(나와만 견줌 · 교사 11-05 '내 선이 어디로 가나 = AI 말투' → 사실만)
//  근거: 진행 점검(CBM)은 주 1회 · 짧게 · 같은 범위에서 고르게 뽑은 혼합 문항 → 선 그래프 → 선생님이 그 선을 보고 수업을 바꿀 때 효과 [B-R12][B-R18][B-R19][B-R20] · 순위 X [D-20]
//  범위는 학기마다 고정 — 이번 학기 단원 칸 여섯(아직 안 배운 것도 · weekcore curPool) + 앞 학기 기초 넷(termPool) · 학기 초엔 낮고 배울수록 오름(CBM 표준) · 주마다 고르는 칸이 바뀌면 선끼리 비교할 수 없음
//  기록은 따로 두지 않음 — 푼 묶음(kind 'week' · unit = 'T4-2') 자체가 기록 → 다른 기기 · 선생님 화면에서도 같은 선 · 판정(판자 상태)에는 넣지 않음(kidstore history)
//  아이에게는 점수 대신 선 · 말은 선이 두 주 이어서 한쪽으로 갈 때만(weekTrend) — 한 번의 흔들림에 '올랐어요/낮아요' X [혹평 10-31]
//  찍기: 2초 안 오답 세 번 이어지면 잠깐 멈춤 · 두 번 멈췄으면 이번 점검은 선에 넣지 않음(r.rush) [A-R29]
import { makeSheet, itemOf, lessonName } from '../../paper/js/gen.js';
import { mascot } from '../../paper/js/mascot.js';
import * as KS from './kidstore.js';
import { draw, staticHTML, ansSay } from './item.js';
import { lineOf, weekTerm, weekPlan, weekChart, weekTrend, doneThisWeek, weekKey } from './weekcore.js';
import { esc, rand, lsGet, lsSet, lsDel } from './local.js';
import { go, meOf } from './kid.js';
import { exampleOf } from './fix.js';
import { tile } from './icons.js';

const say = (pose, html, size = 104) => `<div class="say">${mascot(pose, size)}<div class="bub">${html}</div></div>`;
const EB = `<p class="eyebrow">${tile('week', 22)}이번 주 점검</p>`;

export function weekView(root) {
  const me = meOf(); if (!me) return go('#/join');
  const K = KS.load(me), rep = KS.reportOf(K), term = weekTerm(K);
  if (doneThisWeek(K.recs)) {
    root.innerHTML = `<div class="card msg act-week">${EB}${say('cheer', '이번 주 점검은 벌써 했어요. 다음 주에 또 해요!')}${weekChart(lineOf(K.recs, term))}<div class="acts"><a class="btn big" href="#/me">처음 화면으로</a></div></div>`;
    return;
  }
  const WK = `tt.week.${me.C}.${me.no}`, W0 = lsGet(WK, null), resume = W0 && W0.wk === weekKey() && W0.sh && Array.isArray(W0.sh.items) && W0.i > 0 && W0.i < W0.sh.items.length ? W0 : null;   /* 이번 주 하던 판(이어서) */
  const plan = resume ? W0.sh.items.map((x) => x.c) : weekPlan(K, rep, term);
  if (plan.length < 4) {
    root.innerHTML = `<div class="card msg act-week">${EB}${say('think', '아직 점검할 문제가 적어요. 오늘 단원 점검이나 배우기를 하고 나서 해요.')}<div class="acts"><a class="btn big" href="#/me">처음 화면으로</a></div></div>`;
    return;
  }
  const sh = resume ? resume.sh : makeSheet({ kind: 'week', words: false, id: rand(6), lessons: plan.map((c) => ({ c, n: 1 })), mixed: true });
  if (!resume) { sh.unit = term;   /* 'T4-2' — 단원 id가 아님(홈이 단원 준비 여부를 unit으로 봄) */
  sh.items = sh.items.filter((it) => it.ch !== 'END'); sh.chapters = sh.chapters.filter((ch) => ch.key !== 'END');
  for (let i = sh.items.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [sh.items[i], sh.items[j]] = [sh.items[j], sh.items[i]]; } }
  const R = resume ? resume.R : { done: {}, it: {} }, ms = resume ? resume.ms : {};
  let i = resume ? resume.i : 0, fast = 0, pauses = resume ? resume.pauses || 0 : 0;
  const keep = () => lsSet(WK, { wk: weekKey(), sh, R, ms, i, pauses });
  KS.setNow(me, { mode: 'week' });
  const one = () => {
    if (i >= sh.items.length) return fin();
    const it = sh.items[i];
    draw(root, { prompt: it.snap.prompt, choices: it.snap.choices, tag: '이번 주 점검', act: 'week', dots: [i, sh.items.length], conf: false, onAnswer: (a, cf, t) => {
      let ok = false;
      if (a.idk) R.it[it.k] = { s: 'q' };
      else { try { ok = !!itemOf(it.c, it.p).check(a.vals, a.raws).ok; } catch (e) { ok = false; } R.it[it.k] = ok ? { s: 'ok' } : { s: 'x', a: a.raws }; }
      ms[it.k] = t; i++; keep();
      fast = !ok && !a.idk && t < 2000 ? fast + 1 : a.idk ? fast : 0;   /* 몰라서 넘어감은 찍기가 아님(준비 다리와 같게 — 세지도 끊지도 않음) */
      if (fast < 3) return one();
      fast = 0; pauses++; K.rush = (K.rush || 0) + 1;
      root.innerHTML = `<div class="card msg">${say('think', '잠깐! 조금 빨라요. 문제를 <b>끝까지 읽고</b> 풀어요. 모르면 \'못 풀겠어요 · 넘어가기\'를 눌러도 돼요.')}<div class="acts"><button class="pri big" id="r" disabled>다시 할게요</button></div></div>`;
      const b = root.querySelector('#r'); setTimeout(() => { b.disabled = false; b.focus(); }, 3000); b.addEventListener('click', one);
    } });
  };
  const fin = () => {
    lsDel(WK);
    sh.chapters.forEach((ch) => (R.done[ch.key] = true));
    if (pauses >= 2) R.rush = pauses;   /* 두 번 멈춘 점검은 선에 넣지 않음(weekcore weeksOf) */
    KS.addSheet(me, K, sh, R, {}, ms);
    const ws = lineOf(K.recs, term), n = sh.items.length, tr = weekTrend(ws);
    KS.setNow(me, { mode: 'home' });
    const okN = sh.items.filter((it) => R.it[it.k] && R.it[it.k].s === 'ok').length, prev = ws.length >= 2 ? ws[ws.length - 2] : null;
    const head = R.rush ? say('think', '이번 점검은 너무 빨리 풀어서 <b>기록에 넣지 않았어요</b>. 이번 주에 한 번 더, 천천히 해 봐요.')
      : say(tr === 'up' ? 'cheer' : tr === 'down' ? 'think' : 'hi', `이번 주 점검 끝! ${n}문제 중 <b>${okN}개</b> 맞혔어요.${prev ? ` 지난번엔 ${prev.ok}개였어요.` : ' 다음 주에 또 해서 비교해 봐요.'}${tr === 'up' ? '<br>몇 주째 맞힌 수가 늘고 있어요.' : tr === 'down' ? '<br>몇 주째 맞힌 수가 줄었어요. 선생님과 같이 봐요.' : ''}`);
    const miss = sh.items.filter((it) => !R.it[it.k] || R.it[it.k].s !== 'ok');
    const li = (it) => { const r = R.it[it.k] || {}, mine = r.s === 'q' ? '넘어감' : it.snap.choices ? '' : `내 답 ${esc((r.a || []).join(', '))}`;
      return `<li class="${r.s === 'q' ? 'skipq' : 'miss'}"><span class="why">${esc(lessonName(it.c))}${mine ? ` · ${mine}` : ''}</span>${it.snap.choices ? `${staticHTML(it.snap.prompt)} <span class="small">${ansSay(it.snap)}</span>` : staticHTML(it.snap.prompt, it.snap.sol)}</li>`; };
    const cs = [...new Set(miss.map((it) => it.c))];
    const drill = cs.length ? `<p class="small">틀린 문제와 같은 꼴은 튼튼이와 배울 수 있어요.</p><div class="acts">${cs.slice(0, 3).map((c) => `<a class="btn teal" href="#/fix/${encodeURIComponent(c)}">배우기 — ${esc(exampleOf(c) || lessonName(c))}</a>`).join('')}</div>` : '';
    const list = miss.length ? `<h3>다시 볼 문제 ${miss.length}개 <small class="muted">(바른 답을 넣어 보여 줘요)</small></h3><ul class="steps">${miss.slice(0, 4).map(li).join('')}</ul>${miss.length > 4 ? `<details><summary>${miss.length - 4}개 더 보기</summary><ul class="steps">${miss.slice(4).map(li).join('')}</ul></details>` : ''}${drill}` : `<p>${n}문제 모두 맞혔어요.</p>`;
    root.innerHTML = `<div class="card msg msg2 act-week">${EB}${head}<div class="split"><div><h3>주마다 맞힌 수 <small class="muted">(나하고만 비교해요)</small></h3>${weekChart(ws)}</div><div>${list}</div></div><div class="acts"><a class="btn pri big" href="#/me">처음 화면으로</a></div></div>`;   /* 넓으면 왼쪽 주마다 맞힌 수 · 오른쪽 다시 볼 문제 */
  };
  root.innerHTML = `<div class="card msg act-week">${EB}${say('hi', `<b>이번 주 점검</b> — 이번 학기 문제와 앞에서 배운 문제를 섞은 ${plan.length}문제, 3~5분이면 돼요.<br>아직 안 배운 문제도 섞여 있어요. 모르면 '못 풀겠어요 · 넘어가기'를 눌러도 괜찮아요. 학기 끝으로 갈수록 더 많이 맞혀요.`)}${(() => { const ws = lineOf(K.recs, term); return ws.length ? `<h3>주마다 맞힌 수</h3>${weekChart(ws)}` : ''; })()}<div class="acts"><button class="pri big" id="s">시작</button><a class="btn" href="#/me">처음 화면으로</a></div></div>`;
  if (resume) return one();   /* 이어서 — 시작 화면 없이 그 문제부터 */
  root.querySelector('#s').addEventListener('click', one);
}
