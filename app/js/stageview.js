// 스테이지 화면 — 내 판자들(스테이지 길) · 다듬기 한 판(시계는 아이가 켤 때만 · 내 기록과만) · 끝나면 판자가 바뀜
//  '빠르게' 표 · 시계 · 기록 선은 셈 사실 칸에만(stage.js isFact) · 다듬기에도 찍기 멈춤 [A-R29] · 틀리면 다음에 할 한 가지(tools.js nextStep)
import { byId, gradeIdx } from '../../engine/lessons/index.js';
import { LES } from '../../paper/js/gen.js';
import { mascot } from '../../paper/js/mascot.js';
import * as KS from './kidstore.js';
import { prepPlan } from './prep.js';
import { draw, ansSay, rushGuard, rushPause } from './item.js';
import { plankSVG } from './bridge.js';
import { TIER, TIER_KID, target, drillN, need, newDrill, drillItem, answerDrill, resultOf, applyRun, nextGoal, elapsed, wantOf, isFact, tiersOf } from './stage.js';
import { esc, rand, lsGet, lsSet } from './local.js';
import { nextStep } from './tools.js';
import { exampleOf } from './fix.js';
import { itemOf } from '../../paper/js/gen.js';
import { go, meOf, unitLabel } from './kid.js';

const say = (pose, html, size = 64) => `<div class="say">${mascot(pose, size)}<div class="bub">${html}</div></div>`;
const kidName = (c) => (LES(c) ? LES(c).kid : c);
const plank = (c) => { const x = exampleOf(c); return x ? `${x} 같은 문제` : kidName(c); };   /* 판자 = 예시 문제(이름은 작게) */
const byGrade = (a, b) => gradeIdx(LES(a).g) - gradeIdx(LES(b).g) || (LES(a).n || 0) - (LES(b).n || 0);
const sec = (ms) => (ms == null ? '—' : `${(ms / 1000).toFixed(1)}초`);
const clock = (ms) => { const s = Math.floor(ms / 1000); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
export const marks = (tier, c = null) => { const ts = c ? tiersOf(c) : [1, 2, 3]; return `<span class="marks" aria-label="표 ${ts.filter((t) => t <= tier).length}개">${ts.map((t) => `<i class="${t <= tier ? 'on' : ''}" title="${TIER[t]}">${TIER[t]}</i>`).join('')}</span>`; };

// 스테이지 길 — 오늘 단원 준비 칸 + 고쳤거나 다듬은 판자 + 고칠 판자
export function stagesView(root) {
  const me = meOf(); if (!me) return go('#/join');
  const K = KS.load(me); K.mx = K.mx || {};
  const rep = KS.reportOf(K);
  const unit = K.lastPrep && K.lastPrep.unit;
  const set = new Set(Object.keys(K.mx));
  Object.keys(K.fixed || {}).forEach((c) => set.add(c));
  rep.start.forEach((s) => set.add(s.c));
  if (unit) prepPlan(unit).pre.forEach((c) => set.add(c));
  const list = [...set].filter((c) => byId[c]).sort(byGrade);
  const card = (c, i) => {
    const m = K.mx[c], st = rep.L[c] ? rep.L[c].st : 'none', tier = m ? m.tier : 0;
    const gap = st === 'stuck' || rep.start.some((s) => s.c === c);
    const btn = gap ? `<a class="btn pri" href="#/fix/${c}">고치기</a>` : `<a class="btn ${tier ? 'teal' : ''}" href="#/drill/${c}">${tier ? '다듬기' : '도전'}</a>`;
    return `<div class="stage${gap ? ' gap' : ''}"><span class="no">${i + 1}</span>${plankSVG(gap ? 'gap' : tier ? tier : st === 'ok' || st === 'pass' ? 1 : 0)}
      <div class="st-b"><b>${esc(plank(c))}</b>${marks(tier, c)}<span class="small muted">${gap ? '빈 판자예요 — 먼저 고쳐요' : esc(nextGoal(m, c))}${m && m.best ? ` · 내 최고 ${m.best.ok}/${m.best.n}${isFact(c) ? ` · 한 문제 ${sec(m.best.med)}` : ''}` : ''}</span></div>${btn}</div>`;
  };
  const counts = [1, 2, 3].map((t) => list.filter((c) => K.mx[c] && K.mx[c].tier >= t).length);
  root.innerHTML = `<div class="card">${say('point', `판자 하나가 <b>스테이지</b> 하나예요.<br><b>정확 → 빠르게 → 오래</b> 표를 모으면 판자가 단단해져요.`)}
    <p class="small">모은 표: 정확 <b>${counts[0]}</b> · 빠르게 <b>${counts[1]}</b> · 오래 <b>${counts[2]}</b> <span class="muted">(판자 ${list.length}개) · 판자는 나무 → 못 박은 판자 → 돌 판자로 바뀌어요. '빠르게'는 셈을 외워 두면 좋은 판자(한 자리 셈 · 곱셈구구 같은)에만 있어요.</span></p>
    <div class="stages">${list.map(card).join('') || '<p class="muted">아직 판자가 없어요. 먼저 준비 다리를 해요.</p>'}</div>
    <div class="acts"><a class="btn" href="#/me">내 수 다리로</a></div></div>`;
}

// 다듬기 한 판
//  시계 = 켜고 끄는 단추(기본 꺼짐 · 이 아이 기기에 기억) · 셈 사실 칸에서 '정확'을 딴 뒤에만 고를 수 있음 · 정답률 낮았던 다음 판은 저절로 꺼짐 [B-R16]
export function drillView(root, c) {
  const me = meOf(); if (!me) return go('#/join');
  if (!byId[c]) return go('#/stages');
  const K = KS.load(me); K.mx = K.mx || {};
  const m0 = K.mx[c], tier0 = m0 ? m0.tier : 0, fact = isFact(c);
  const CK = `tt.clock.${me.C}.${me.no}`;
  const canClock = fact && tier0 >= 1 && !(m0 && m0.slow);
  let showClock = canClock && lsGet(CK, false) === true;
  const D = newDrill({ c, id: rand(6), clock: showClock, want: wantOf(KS.reportOf(K), K.minds, c) });
  const best = m0 && m0.best && m0.best.n === D.sheet.items.length && m0.best.ok === m0.best.n ? m0.best.total : null;
  let tick = null;
  const rush = rushGuard();
  KS.setNow(me, { mode: 'drill', c });
  const one = () => {
    const it = drillItem(D);
    if (!it) return fin();
    const clockHTML = showClock ? `<div class="clock" aria-live="off"><span id="ck">${clock(elapsed(D))}</span>${best ? `<span class="muted"> · 내 최고 ${clock(best)}</span>` : ''}</div>` : '';
    draw(root, { prompt: it.snap.prompt, choices: it.snap.choices, tag: `${TIER[Math.min(tier0 + 1, 3)] || '다듬기'} 판`, dots: [D.i, D.sheet.items.length], conf: false, extra: clockHTML, onAnswer: (a, cf, ms) => {
      clearInterval(tick);
      const r = answerDrill(D, a, ms);
      if (rush(ms, a, r.ok) && drillItem(D)) { K.rush = (K.rush || 0) + 1; KS.save(me, K); return rushPause(root, one); }
      if (r.ok) return one();
      // 틀리면 다음에 할 한 가지(시계는 멈춤) → 다음으로
      const box = document.createElement('div'); box.className = 'fb no';
      const prev = D.sheet.items[D.i - 1];
      try { nextStep(box, { it: itemOf(prev.c, prev.p), vals: a.vals || [], c, idk: !!a.idk, onSelfFix: (t) => KS.selfFix(me, K, t) }); } catch (e) { box.innerHTML = ansSay({ sol: r.sol, choices: it.snap.choices }); }
      const btn = document.createElement('button'); btn.className = 'pri'; btn.textContent = '다음'; btn.style.marginLeft = '10px'; box.appendChild(btn);
      root.querySelector('.qcard').appendChild(box);
      root.querySelectorAll('.qcard > .math input, .qcard .qact button, .qcard .choices button').forEach((x) => (x.disabled = true));
      btn.addEventListener('click', one); btn.focus();   /* 자판 Enter로 넘어가게(회귀 10-31) */
    } });
    if (showClock) { const t0 = performance.now(), base = elapsed(D), el = root.querySelector('#ck'); tick = setInterval(() => { if (el.isConnected) el.textContent = clock(base + performance.now() - t0); else clearInterval(tick); }, 250); }
  };
  const fin = () => {
    clearInterval(tick);
    const res = resultOf(D);
    KS.addSheet(me, K, D.sheet, D.R, {}, D.ms);
    const g = applyRun(K.mx, c, res);
    KS.save(me, K); KS.pushMastery(me, K); KS.pushSummary(me, K); KS.setNow(me, { mode: 'home' });
    const m = K.mx[c];
    const head = g.gained.length ? say('cheer', `<b>'${g.gained.join("' · '")}'</b> 표를 땄어요! 판자가 <b>${esc(TIER_KID[m.tier])}</b>로 바뀌었어요.`, 72)
      : g.record ? say('cheer', '내 최고 기록을 넘었어요!', 72)
      : !g.good ? say('think', `${res.ok}/${res.n} — 빠르기보다 <b>정확하게</b> 먼저 해요. 다음 판은 천천히 해 봐요.`, 72)
      : say('hi', `좋아요! ${esc(nextGoal(m, c))}`, 72);
    const runs = m.runs.filter((r) => r.med != null);
    root.innerHTML = `<div class="card">${head}
      <div class="drill-res">${g.gained.length ? `${plankSVG(g.before, 96)}<span style="font-size:26px">→</span>` : ''}${plankSVG(m.tier || (g.good ? 1 : 0), 120)}<div><b>${esc(plank(c))}</b> ${marks(m.tier, c)}
        <p>맞힌 문제 <b>${res.ok}/${res.n}</b>${fact ? ` · 한 문제에 보통 <b>${sec(res.med)}</b> <span class="muted small">('빠르게'는 ${sec(g.T)} 안)</span>` : ''}${showClock ? ` · 모두 ${clock(res.total)}` : ''}</p>
        <p class="small muted">${esc(nextGoal(m, c))}</p></div></div>
      ${fact && runs.length >= 2 ? `<h3>내 기록 <small>한 문제에 보통 걸린 시간 · 아래로 갈수록 빨라요 · 점선은 '빠르게'</small></h3>${runChart(runs, g.T)}` : ''}
      <div class="acts"><a class="btn pri big" href="#/drill/${c}?${Date.now()}">한 판 더</a><a class="btn big" href="#/stages">스테이지로</a></div></div>`;
  };
  const start = () => {
    const top = tier0 >= 3 ? '표를 다 땄어요. 한 판 더 정확하게 해 볼까요?'
      : tier0 < 1 ? `먼저 <b>정확</b> 표부터 — ${D.sheet.items.length}문제 중 ${need(D.sheet.items.length)}문제를 맞혀요.`
      : !fact ? `이 판자는 <b>정확 → 오래</b> 두 표예요. 시계 없이 정확하게 해요.`
      : m0 && m0.slow ? '지난번엔 조금 헷갈렸어요. 이번 판은 시계 없이 <b>정확하게</b> 해 봐요.'
      : showClock ? '시계가 켜져 있어요 — 친구가 아니라 <b>내 기록</b>과 겨뤄요. 정확한 게 먼저예요!' : '정확하게 풀어요. 원하면 시계를 켜고 내 기록과 겨룰 수 있어요.';
    root.innerHTML = `<div class="card">${say('point', `<b>${esc(plank(c))}</b> ${marks(tier0, c)}<br>${top}`)}
      <div class="acts"><button class="pri big" id="s">시작</button>${canClock ? `<button type="button" class="big" id="ck" aria-pressed="${showClock}">${showClock ? '시계 끄기' : '시계 켜기'}</button>` : ''}<a class="btn" href="#/stages">스테이지로</a></div></div>`;
    root.querySelector('#s').addEventListener('click', one);
    const cb = root.querySelector('#ck');
    if (cb) cb.addEventListener('click', () => { showClock = !showClock; D.clock = showClock; lsSet(CK, showClock); start(); });
  };
  start();
  return () => clearInterval(tick);
}

// 내 기록 선(나와만 견줌 · 밋밋하게)
function runChart(runs, T) {
  const W = 420, H = 120, P = 24, max = Math.max(T * 1.6, ...runs.map((r) => r.med)) || 1;
  const x = (i) => P + (i * (W - 2 * P)) / Math.max(runs.length - 1, 1), y = (v) => H - P - ((H - 2 * P) * v) / max;
  const pts = runs.map((r, i) => `${x(i).toFixed(1)},${y(r.med).toFixed(1)}`).join(' ');
  return `<svg class="runs" viewBox="0 0 ${W} ${H}" role="img" aria-label="한 문제 걸린 시간 기록 ${runs.length}번"><path d="M${P} ${y(T).toFixed(1)} H${W - P}" stroke="#2f6b3a" stroke-dasharray="5 4" stroke-width="1.5"/><polyline points="${pts}" fill="none" stroke="#3b2a1e" stroke-width="2"/>${runs.map((r, i) => `<circle cx="${x(i).toFixed(1)}" cy="${y(r.med).toFixed(1)}" r="4" fill="${r.ok >= need(r.n) ? '#c99a68' : '#fff'}" stroke="#3b2a1e" stroke-width="1.5"/>`).join('')}<text x="${P}" y="14" font-size="12" fill="#6f6355">${sec(max)}</text><text x="${P}" y="${H - 6}" font-size="12" fill="#6f6355">0초</text></svg>`;
}
