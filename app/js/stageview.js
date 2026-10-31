// 스테이지 화면 — 내 판자들(스테이지 길) · 다듬기 한 판(시계는 내 기록과만) · 끝나면 판자가 바뀜
import { byId, gradeIdx } from '../../engine/lessons/index.js';
import { LES } from '../../paper/js/gen.js';
import { mascot } from '../../paper/js/mascot.js';
import * as KS from './kidstore.js';
import { prepPlan } from './prep.js';
import { draw } from './item.js';
import { plankSVG } from './bridge.js';
import { TIER, TIER_KID, target, drillN, need, newDrill, drillItem, answerDrill, resultOf, applyRun, nextGoal, elapsed, wantOf } from './stage.js';
import { esc, rand } from './local.js';
import { toolBox } from './tools.js';
import { itemOf } from '../../paper/js/gen.js';
import { go, meOf, unitLabel } from './kid.js';

const say = (pose, html, size = 64) => `<div class="say">${mascot(pose, size)}<div class="bub">${html}</div></div>`;
const kidName = (c) => (LES(c) ? LES(c).kid : c);
const byGrade = (a, b) => gradeIdx(LES(a).g) - gradeIdx(LES(b).g) || (LES(a).n || 0) - (LES(b).n || 0);
const sec = (ms) => (ms == null ? '—' : `${(ms / 1000).toFixed(1)}초`);
const clock = (ms) => { const s = Math.floor(ms / 1000); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
export const marks = (tier) => `<span class="marks" aria-label="표 ${tier}개">${[1, 2, 3].map((t) => `<i class="${t <= tier ? 'on' : ''}" title="${TIER[t]}">${TIER[t]}</i>`).join('')}</span>`;

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
      <div class="st-b"><b>${esc(kidName(c))}</b>${marks(tier)}<span class="small muted">${gap ? '빈 판자예요 — 먼저 고쳐요' : esc(nextGoal(m, c))}${m && m.best ? ` · 내 최고 ${m.best.ok}/${m.best.n} · 한 문제 ${sec(m.best.med)}` : ''}</span></div>${btn}</div>`;
  };
  const counts = [1, 2, 3].map((t) => list.filter((c) => K.mx[c] && K.mx[c].tier >= t).length);
  root.innerHTML = `<div class="card">${say('point', `판자 하나가 <b>스테이지</b> 하나예요. 한 번 깨고 끝이 아니라 <b>정확 → 빠르게 → 오래</b> 세 표를 모아요.<br>표를 딸 때마다 판자가 <b>나무 → 못 박은 판자 → 돌 판자</b>로 바뀌어요.`)}
    <p class="small">정확 <b>${counts[0]}</b> · 빠르게 <b>${counts[1]}</b> · 오래 <b>${counts[2]}</b> <span class="muted">(판자 ${list.length}개)</span> · 시계는 다듬기에서만 보이고, 내 기록하고만 견줘요.</p>
    <div class="stages">${list.map(card).join('') || '<p class="muted">아직 판자가 없어요. 먼저 준비 다리를 해요.</p>'}</div>
    <div class="acts"><a class="btn" href="#/me">내 수 다리로</a></div></div>`;
}

// 다듬기 한 판
export function drillView(root, c) {
  const me = meOf(); if (!me) return go('#/join');
  if (!byId[c]) return go('#/stages');
  const K = KS.load(me); K.mx = K.mx || {};
  const m0 = K.mx[c], tier0 = m0 ? m0.tier : 0;
  const showClock = tier0 >= 1 && !(m0 && m0.slow);   // 정확을 딴 뒤에만 · 정답률 낮았던 다음 판은 시계 없이
  const D = newDrill({ c, id: rand(6), clock: showClock, want: wantOf(KS.reportOf(K), K.minds, c) });
  const best = m0 && m0.best && m0.best.n === D.sheet.items.length && m0.best.ok === m0.best.n ? m0.best.total : null;
  let tick = null;
  KS.setNow(me, { mode: 'drill', c });
  const one = () => {
    const it = drillItem(D);
    if (!it) return fin();
    const clockHTML = showClock ? `<div class="clock" aria-live="off"><span id="ck">${clock(elapsed(D))}</span>${best ? `<span class="muted"> · 내 최고 ${clock(best)}</span>` : ''}</div>` : '';
    draw(root, { prompt: it.snap.prompt, choices: it.snap.choices, tag: `${TIER[Math.min(tier0 + 1, 3)] || '다듬기'} 판`, dots: [D.i, D.sheet.items.length], conf: false, extra: clockHTML, onAnswer: (a, cf, ms) => {
      clearInterval(tick);
      const r = answerDrill(D, a, ms);
      if (r.ok) return one();
      // 틀리면 답을 보여 주고(시계는 멈춤) 다음으로
      const box = document.createElement('div'); box.className = 'fb no';
      box.innerHTML = `${a.idk ? '' : '아까워요! '}답은 <b>${esc(r.sol.join(', '))}</b>예요.`;
      if (!a.idk) { const prev = D.sheet.items[D.i - 1]; try { toolBox(box, { it: itemOf(prev.c, prev.p), vals: a.vals, c, onSelfFix: (t) => KS.selfFix(me, K, t) }); } catch (e) { /* */ } }
      const btn = document.createElement('button'); btn.className = 'pri'; btn.textContent = '다음'; btn.style.marginLeft = '10px'; box.appendChild(btn);
      root.querySelector('.qcard').appendChild(box);
      root.querySelectorAll('.qcard input, .qcard .qact button, .qcard .choices button').forEach((x) => (x.disabled = true));
      btn.focus(); btn.addEventListener('click', one);
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
      : !g.good ? say('think', `${res.ok}/${res.n} — 빠르기보다 <b>정확하게</b> 먼저 해요. 다음 판은 시계 없이 천천히 해 봐요.`, 72)
      : say('hi', `좋아요! ${esc(nextGoal(m, c))}`, 72);
    const runs = m.runs.filter((r) => r.med != null);
    root.innerHTML = `<div class="card">${head}
      <div class="drill-res">${g.gained.length ? `${plankSVG(g.before, 96)}<span style="font-size:26px">→</span>` : ''}${plankSVG(m.tier || (g.good ? 1 : 0), 120)}<div><b>${esc(kidName(c))}</b> ${marks(m.tier)}
        <p>맞힌 문제 <b>${res.ok}/${res.n}</b> · 한 문제 가운데값 <b>${sec(res.med)}</b> <span class="muted small">('빠르게' 기준 ${sec(g.T)})</span>${showClock ? ` · 걸린 시간 ${clock(res.total)}` : ''}</p>
        <p class="small muted">${esc(nextGoal(m, c))}</p></div></div>
      ${runs.length >= 2 ? `<h3>내 기록 <small class="muted">(한 문제 가운데값 · 낮을수록 빠름 · 점선 = 빠르게 기준)</small></h3>${runChart(runs, g.T)}` : ''}
      <div class="acts"><a class="btn pri big" href="#/drill/${c}?${Date.now()}">한 판 더</a><a class="btn big" href="#/stages">스테이지로</a></div></div>`;
  };
  const top = tier0 >= 3 ? '세 표를 다 땄어요. 기록을 더 줄여 볼까요?' : showClock ? `이번 판은 <b>시계</b>가 보여요 — 친구가 아니라 <b>내 기록</b>과 겨뤄요. 정확한 게 먼저예요!` : tier0 >= 1 ? '이번 판은 시계 없이 <b>정확하게</b> 해 봐요.' : `먼저 <b>정확</b> 표부터 — ${D.sheet.items.length}문제 중 ${need(D.sheet.items.length)}문제를 맞혀요. 시계는 없어요.`;
  root.innerHTML = `<div class="card">${say('point', `<b>${esc(kidName(c))}</b> ${marks(tier0)}<br>${top}`)}<button class="pri big" id="s">시작</button> <a class="btn" href="#/stages">스테이지로</a></div>`;
  root.querySelector('#s').addEventListener('click', one);
  return () => clearInterval(tick);
}

// 내 기록 선(나와만 견줌 · 밋밋하게)
function runChart(runs, T) {
  const W = 420, H = 120, P = 24, max = Math.max(T * 1.6, ...runs.map((r) => r.med)) || 1;
  const x = (i) => P + (i * (W - 2 * P)) / Math.max(runs.length - 1, 1), y = (v) => H - P - ((H - 2 * P) * v) / max;
  const pts = runs.map((r, i) => `${x(i).toFixed(1)},${y(r.med).toFixed(1)}`).join(' ');
  return `<svg class="runs" viewBox="0 0 ${W} ${H}" role="img" aria-label="한 문제 걸린 시간 기록 ${runs.length}번"><path d="M${P} ${y(T).toFixed(1)} H${W - P}" stroke="#2f6b3a" stroke-dasharray="5 4" stroke-width="1.5"/><polyline points="${pts}" fill="none" stroke="#3b2a1e" stroke-width="2"/>${runs.map((r, i) => `<circle cx="${x(i).toFixed(1)}" cy="${y(r.med).toFixed(1)}" r="4" fill="${r.ok >= need(r.n) ? '#c99a68' : '#fff'}" stroke="#3b2a1e" stroke-width="1.5"/>`).join('')}<text x="${P}" y="14" font-size="12" fill="#6f6355">${sec(max)}</text><text x="${P}" y="${H - 6}" font-size="12" fill="#6f6355">0초</text></svg>`;
}
