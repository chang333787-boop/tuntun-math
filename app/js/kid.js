// 아이 화면 — 들어가기 · 내 수 다리 · 준비 다리 · 판자 고치기 · 다시 보기
//  근거 번호는 docs/evidence.md · 아이 화면엔 학년 · 원인 이름 · 순위 · 점수 비교가 없다 [A-R11][D-20] · 피드백은 과제에 대해서만 [A-R24]
import { byId, UNITS, unitById, gradeIdx } from '../../engine/lessons/index.js';
import { makeSheet, LES, itemOf } from '../../paper/js/gen.js';
import { mascot } from '../../paper/js/mascot.js';
import { prepPlan, newPrep, current, answer, summary, asked } from './prep.js';
import { newFix, showNext, togetherStep, answerItem, afterReStep, checkItem, answerCheck, hintOf, compareOf, stepsOf } from './fix.js';
import * as KS from './kidstore.js';
import { draw, stepHTML, staticHTML } from './item.js';
import { bridgeSVG, KIND } from './bridge.js';
import { modelHTML } from './model.js';
import { grantAccurate, nextGoal, target, TIER } from './stage.js';
import { lsGet, lsSet, lsDel, esc, rand } from './local.js';
import { flush } from './db.js';
import { runPlan, weekHTML, today } from './run.js';
import { toolFor, toolBox, TOOLS } from './tools.js';
import { makeItem as mkItem } from '../../engine/lessons/index.js';

export const go = (h) => { location.hash = h; };
const say = (pose, html, size = 72) => `<div class="say">${mascot(pose, size)}<div class="bub">${html}</div></div>`;
export const meOf = () => lsGet('tt.me');
const kidName = (c) => (LES(c) ? LES(c).kid : c);
export const unitLabel = (u) => (unitById[u] ? unitById[u].nm : u);
const byGrade = (a, b) => gradeIdx(LES(a).g) - gradeIdx(LES(b).g) || (LES(a).n || 0) - (LES(b).n || 0);

// ── 들어가기 ──
export function joinView(root) {
  const q = new URLSearchParams(location.hash.split('?')[1] || '');
  root.innerHTML = `<div class="card">${say('hi', '안녕하세요! 저는 <b>튼튼이</b>예요. 같이 수 다리를 튼튼하게 놓아요.<br>선생님이 준 카드를 보고 써 주세요.')}
    <form id="f" autocomplete="off">
      <div class="field"><label for="c">반 코드</label><input id="c" maxlength="6" value="${esc(q.get('c') || '')}" autocapitalize="characters" placeholder="여섯 글자"></div>
      <div class="field"><label for="n">내 번호</label><input id="n" inputmode="numeric" maxlength="3"></div>
      <div class="field"><label for="p">핀(숫자 네 개)</label><input id="p" inputmode="numeric" maxlength="4" type="password"></div>
      <p class="qmsg" id="msg" role="alert"></p>
      <button class="pri big">들어가기</button>
    </form></div>`;
  root.querySelector(q.get('c') ? '#n' : '#c').focus();
  root.querySelector('#f').addEventListener('submit', async (e) => {
    e.preventDefault();
    const m = root.querySelector('#msg'); m.textContent = '확인하는 중…';
    try { const me = await KS.join(root.querySelector('#c').value, root.querySelector('#n').value, root.querySelector('#p').value); lsSet('tt.me', me); go('#/me'); }
    catch (err) { m.textContent = err.status === 401 ? '코드 · 번호 · 핀이 맞지 않아요. 카드를 다시 봐 주세요.' : err.message || '들어가지 못했어요'; }
  });
}

// ── 오늘 할 일 고르기(홈과 같은 규칙) ──
function todoOf(K, rep) {
  const out = [];
  const tasks = Object.entries(K.inbox || {}).map(([id, x]) => ({ id, ...x })).filter((x) => x && x.kind === 'prep').sort((a, b) => b.t - a.t);
  const t = tasks[0];
  const preppedAfter = (u, since) => Object.values(K.recs).some((x) => x.s.unit === u && x.s.made >= since);
  if (t && !preppedAfter(t.unit, t.t)) out.push({ kind: 'prep', unit: t.unit, pri: true, title: `오늘 단원 준비하기`, sub: `선생님이 연 단원: ${unitLabel(t.unit)} — 필요한 판자가 튼튼한지 봐요`, href: `#/prep/${t.unit}` });
  if (K.back && K.back.root && byId[K.back.root] && !(K.fixed && K.fixed[K.back.root] > K.back.t)) out.push({ kind: 'fix', c: K.back.root, pri: !out.length, title: `끊긴 곳 고치기 — ${kidName(K.back.root)}`, sub: `'${K.back.text}'을(를) 거꾸로 따라가서 찾은 곳이에요`, href: `#/fix/${K.back.root}` });
  else if (K.back && K.back.root && !K.back.solved && K.fixed && K.fixed[K.back.root]) out.push({ kind: 'retry', pri: !out.length, title: `처음 문제 다시 풀기 — ${K.back.text}`, sub: '끊긴 곳을 고쳤어요. 이제 풀릴 거예요', href: '#/retry' });
  const fixes = rep.start.map((s) => s.c).sort(byGrade).filter((c) => !(K.back && K.back.root === c && !(K.fixed && K.fixed[c] > K.back.t)));
  const shakyFixed = Object.keys(K.fixed || {}).filter((c) => rep.L[c] && (rep.L[c].st === 'shaky' || rep.L[c].st === 'stuck') && !fixes.includes(c));
  [...fixes, ...shakyFixed].slice(0, 3).forEach((c, i) => out.push({ kind: 'fix', c, pri: !out.length && i === 0, title: `판자 고치기 — ${kidName(c)}`, sub: K.help && K.help[c] ? '지난번엔 조금 흔들렸어요. 선생님과 함께 봐도 좋아요.' : '튼튼이가 먼저 풀어 보이고, 같이 풀고, 혼자 풀어요', href: `#/fix/${c}` }));
  Object.keys(K.firm || {}).filter((c) => byId[c] && rep.L[c] && rep.L[c].st === 'shaky' && !fixes.includes(c) && !shakyFixed.includes(c)).slice(0, 2)
    .forEach((c) => out.push({ kind: 'fix', c, pri: false, title: `판자 다지기 — ${kidName(c)}`, sub: '거의 되는데 가끔 흔들려요. 한 바퀴 다지면 튼튼해져요', href: `#/fix/${c}` }));
  const due = Object.entries(K.rv || {}).filter(([, x]) => x.n < KS.REVIEW_DAYS.length && x.due <= Date.now()).map(([c]) => c);
  const ran = (K.jog || []).includes(today()), plan = runPlan(K);
  if (plan.length && (!ran || due.length)) out.push({ kind: 'run', pri: !out.length, title: `오늘의 구보 (3~5분)${due.length ? ` — 다시 볼 판자 ${due.length}칸 포함` : ''}`, sub: '고친 판자를 섞어서 두 문제씩 — 매일 조금씩 뛰면 수학 체력이 붙어요', href: '#/run' });
  // 다듬기 하나 — '오래'를 딸 날이 된 판자 → '빠르게'에 가까운 판자 → 정확만 있는 판자 (주인공 할 일이 없을 때만 맨 위)
  const mx = K.mx || {}, now = Date.now();
  const pickD = Object.entries(mx).filter(([c, m]) => byId[c] && m.tier === 2 && now - m.t2 >= 3 * KS.DAY)[0]
    || Object.entries(mx).filter(([c, m]) => byId[c] && m.tier === 1 && m.best && m.best.med != null).sort((a, b) => a[1].best.med / target(a[0]) - b[1].best.med / target(b[0]))[0]
    || Object.entries(mx).filter(([c, m]) => byId[c] && m.tier === 1)[0];
  if (pickD) { const [c, m] = pickD; out.push({ kind: 'drill', c, pri: !out.length, title: `다듬기 — ${kidName(c)}`, sub: `다음 표: ${nextGoal(m, c)}`, href: `#/drill/${c}` }); }
  if (K.lastPrep && K.lastPrep.why === 'budget' && !out.some((x) => x.kind === 'prep')) out.push({ kind: 'prep', unit: K.lastPrep.unit, pri: !out.length, title: '이어서 찾기', sub: `${unitLabel(K.lastPrep.unit)} — 지난번에 멈춘 곳부터`, href: `#/prep/${K.lastPrep.unit}` });
  return out;
}

// ── 내 수 다리(홈) ──
export async function homeView(root) {
  const me = meOf(); if (!me) return go('#/join');
  root.innerHTML = `<div class="card">${say('hi', `${esc(me.no)}번, 반가워요! 수 다리를 불러오는 중이에요…`)}</div>`;
  const { K, ok } = await KS.pull(me);
  if (ok) KS.pushSummary(me, K);   // 판정 규칙이 바뀌어도 선생님 화면이 새 요약을 보게(쓰기 한 번)
  flush();
  const rep = KS.reportOf(K);
  const todo = todoOf(K, rep);
  const unit = (todo.find((x) => x.unit) || {}).unit || (K.lastPrep && K.lastPrep.unit) || null;
  const cal = KS.calOf(K);
  const sw = Object.values(cal.sureWrong).reduce((a, b) => a + b, 0);
  let planks = [];
  if (unit) {
    const P = prepPlan(unit);
    const show = new Set(P.pre);
    rep.start.forEach((s) => { if (P.below.includes(s.c)) show.add(s.c); });
    planks = [...show].filter((c) => LES(c)).sort(byGrade).map((c) => ({ c, st: rep.L[c] ? rep.L[c].st : 'none', tier: K.mx && K.mx[c] ? K.mx[c].tier : 0, label: kidName(c) + (K.mx && K.mx[c] && K.mx[c].tier ? ` (${TIER.slice(1, K.mx[c].tier + 1).join(' · ')})` : '') }));
  }
  const fixedN = Object.keys(K.fixed || {}).length;
  root.innerHTML = `
    <div class="card">${say(todo.length ? 'point' : 'cheer', todo.length ? '오늘 할 일이에요. 위에서부터 하면 돼요.' : '오늘 할 일을 다 했어요! 아래에서 단원을 골라 더 볼 수도 있어요.')}
      <div class="todo">${todo.map((t) => `<a class="item" href="${t.href}"><span><b>${esc(t.title)}</b><br><span class="muted small">${esc(t.sub)}</span></span><span class="go btn ${t.pri ? 'pri' : ''}">시작</span></a>`).join('') || ''}</div>
      ${ok ? '' : '<p class="warn small">서버에 닿지 않아 이 기기에 저장된 것만 보여요. 푼 것은 이 기기에 모았다가 나중에 보내요.</p>'}
    </div>
    ${unit ? `<div class="card"><h2>내 수 다리 <small>${esc(unitLabel(unit))}로 가는 다리</small></h2>${bridgeSVG(planks, { goal: unitLabel(unit) })}
      <div class="legend"><span><i style="background:#c99a68"></i>튼튼(정확)</span><span><i style="background:#b07f50"></i>못 박은 판자(빠르게)</span><span><i style="background:#c9c4bb"></i>돌 판자(오래)</span><span><i style="background:#efd6a8"></i>흔들</span><span><i style="border:2px dashed #b4482b;background:none"></i>고칠 판자</span><span><i style="background:#fff;opacity:.7"></i>아직 안 봄</span></div>
      <div class="acts"><a class="btn teal" href="#/stages">스테이지 — 판자 다듬기</a></div>
      <div class="plank-list" style="margin-top:10px">${planks.map((p) => `<span class="pk ${KIND(p.st) === 'ok' ? 'ok' : KIND(p.st) === 'gap' ? 'fix' : KIND(p.st)}">${esc(p.label)}</span>`).join('')}</div></div>` : ''}
    <div class="card"><h2>내 스테이지 <small>판자 하나 = 스테이지 하나 · 정확 → 빠르게 → 오래</small></h2>${(() => { const xs = Object.values(K.mx || {}); const n = (t) => xs.filter((m) => m.tier >= t).length; return xs.length ? `<p>정확 <b>${n(1)}</b> · 빠르게 <b>${n(2)}</b> · 오래 <b>${n(3)}</b> <span class="muted small">— 표를 모으면 판자가 나무 → 못 박은 판자 → 돌 판자로 바뀌어요</span></p>` : '<p class="muted">판자를 고치거나 준비 다리에서 셋 다 맞히면 스테이지가 생겨요. 한 번 깨고 끝이 아니라 더 정확하고 빠르게 다듬어요.</p>'; })()}
      <p class="small">이번 주 구보 ${weekHTML(K)}</p>
      <div class="acts"><a class="btn teal" href="#/stages">스테이지 보기</a>${runPlan(K).length ? '<a class="btn" href="#/run">오늘의 구보</a>' : ''}</div></div>
    ${Object.keys(K.tools || {}).length ? `<div class="card"><h2>내 도구함 <small>내 답을 스스로 확인하는 도구</small></h2><div class="plank-list">${Object.entries(K.tools).filter(([t]) => TOOLS[t]).map(([t, x]) => `<span class="pk ok">🔍 ${esc(TOOLS[t].name)}${x.self ? ` · 스스로 고친 ${x.self}번` : ''}</span>`).join('')}</div><p class="small muted">틀렸을 때 '도구로 확인'을 눌러 다시 써 보면, 스스로 고친 횟수가 늘어요.</p></div>` : ''}
    <div class="card"><h2>내 짐작 견주기</h2>${cal.n ? `<p>풀기 전에 고른 짐작이 결과와 맞은 정도: <b>${Math.round(cal.match * 100)}%</b> <span class="muted small">(${cal.n}문제)</span></p>
      ${sw ? `<p>'자신 있어요'라고 했는데 틀린 문제가 <b>${sw}개</b> 있어요. 이게 가장 중요한 신호예요 — 그 판자부터 다시 봐요.</p>` : '<p>\'자신 있어요\'라고 한 문제는 다 맞았어요. 내 짐작을 믿어도 돼요.</p>'}` : '<p class="muted">문제를 풀 때마다 먼저 짐작을 골라요. 짐작이 결과와 점점 맞아 가는 것도 실력이 느는 거예요.</p>'}
      ${fixedN ? `<p>내가 고친 판자: <b>${fixedN}개</b> — ${Object.keys(K.fixed).map((c) => esc(kidName(c))).join(', ')}</p>` : ''}</div>
    <div class="card"><h2>막힌 문제 거꾸로 찾기</h2>${say('think', '풀기 어려운 문제를 그대로 쓰면, 튼튼이가 <b>거꾸로</b> 따라가며 어디서 끊겼는지 찾아 줘요.', 56)}
      <div class="acts"><a class="btn pri" href="#/back">거꾸로 찾기</a>${K.back && K.back.root && !K.back.solved && K.fixed && K.fixed[K.back.root] ? `<a class="btn" href="#/retry">처음 문제 다시 풀기 — ${esc(K.back.text)}</a>` : ''}</div>
      <p class="small"><button class="link" id="out">이 기기에서 나가기</button></p></div>`;
  root.querySelector('#out').addEventListener('click', () => { if (confirm('이 기기에서 나갈까요? 푼 기록은 서버에 남아 있어요.')) { lsDel('tt.me'); go('#/'); } });
}

// ── 준비 다리 ──
export function prepView(root, unit) {
  const me = meOf(); if (!me) return go('#/join');
  if (!unitById[unit]) return go('#/me');
  const K = KS.load(me);
  const SK = `tt.prep.${me.C}.${me.no}`;
  let S = lsGet(SK);
  if (!S || S.unit !== unit || S.done || Date.now() - S.made > 3 * 3600e3) S = newPrep({ unit, id: rand(6), prior: KS.history(K) });
  const saved = new Set(S.saved || []);
  const keep = () => { S.saved = [...saved]; lsSet(SK, S); };
  const store = () => {
    for (const sh of S.sheets) {
      const R = S.res[sh.id].me;
      if (saved.has(sh.id) || !sh.chapters.length || !sh.chapters.every((c) => R.done[c.key])) continue;
      sh.unit = unit; KS.addSheet(me, K, sh, R, S.conf[sh.id] || {}, S.ms[sh.id] || {}); saved.add(sh.id);
    }
    keep();
  };
  let lastNow = 0, rush = 0;
  // 2초 안에 틀린 답(찍기)이 세 번 이어지면 잠깐 멈춤 — 찍기는 학습 저하와 가장 세게 묶인다 [A-R29] · 선생님 화면에도 남김
  const pause = () => {
    K.rush = (K.rush || 0) + 1; KS.save(me, K);
    root.innerHTML = `<div class="card">${say('think', '잠깐! 조금 빨라요. 문제를 <b>끝까지 읽고</b> 풀어요.<br>모르면 넘어가도 괜찮아요 — 찍지만 않으면 돼요.')}<button class="pri big" id="r" disabled>다시 해 볼게요</button></div>`;
    const b = root.querySelector('#r'); setTimeout(() => { b.disabled = false; b.focus(); }, 3000);
    b.addEventListener('click', step);
  };
  const step = () => {
    const it = current(S);
    if (!it) return finished();
    const sh = S.sheets.find((x) => x.id === S.at.sheet);
    if (Date.now() - lastNow > 5000) { lastNow = Date.now(); KS.setNow(me, { mode: 'prep', unit, n: asked(S) }); }
    draw(root, { prompt: it.snap.prompt, choices: it.snap.choices, tag: '준비 다리', dots: [S.at.i, sh.items.length], onAnswer: (a, cf, ms) => {
      const r = answer(S, a, { conf: cf, ms }); store();
      rush = ms < 2000 && !a.idk && r && !r.ok ? rush + 1 : a.idk ? rush : 0;   // '넘어가기'는 솔직한 모름 — 세지 않음(찍은 오답만)
      if (rush >= 3 && current(S)) { rush = 0; return pause(); }
      step();
    } });
  };
  const finished = () => {
    store();
    const sum = summary(S);
    K.lastPrep = { unit, why: S.why, t: Date.now() };
    if (sum.shaky.length) { K.firm = K.firm || {}; sum.shaky.forEach((c) => (K.firm[c] = Date.now())); }
    K.mx = K.mx || {};
    const mine = {}; for (const sh of S.sheets) for (const it of sh.items) { const r = S.res[sh.id].me.it[it.k]; if (!r) continue; const x = (mine[it.c] = mine[it.c] || { n: 0, ok: 0 }); x.n++; if (r.s === 'ok') x.ok++; }
    const won = Object.entries(mine).filter(([c, x]) => x.n >= 3 && x.ok === x.n && !(K.mx[c] && K.mx[c].tier >= 1)).map(([c]) => c);
    won.forEach((c) => grantAccurate(K.mx, c)); if (won.length) KS.pushMastery(me, K);
    KS.save(me, K); KS.pushSummary(me, K);
    KS.setNow(me, { mode: 'home' });
    lsDel(SK);
    const cal = sum.cal, sw = cal.sureWrong.length;
    const calLine = cal.sure ? `<p>'자신 있어요'라고 한 문제 ${cal.sure}개 가운데 ${sw ? `<b>${sw}개</b>는 틀렸어요 — 그 판자를 고칠 때 꼭 다시 봐요.` : '모두 맞았어요. 내 짐작을 믿어도 돼요.'}</p>` : '';
    const head = sum.fix.length ? say('fix', `고칠 판자를 찾았어요: <b>${sum.fix.map((c) => esc(kidName(c))).join(', ')}</b>.<br>지금 튼튼이랑 고쳐 볼까요? 고치고 나면 바로 오늘 단원으로 가요.`)
      : sum.shaky.length ? say('think', `다리는 거의 튼튼해요! <b>${sum.shaky.map((c) => esc(kidName(c))).join(', ')}</b>은(는) 조금 흔들려요 — 시간 될 때 다져요. 지금은 오늘 수업으로 가요!`)
      : S.why === 'budget' ? say('think', '오늘은 여기까지 찾았어요. 다음에 이어서 찾아요. 지금은 오늘 수업으로 가요!')
      : say('cheer', `<b>${esc(unitLabel(unit))}</b>로 가는 다리가 튼튼해요! 오늘 단원으로 건너가요.`);
    root.innerHTML = `<div class="card">${head}${calLine}
      <div class="acts">${sum.fix.length ? `<a class="btn pri big" href="#/fix/${sum.fix.sort(byGrade)[0]}">고치러 가기</a>` : sum.shaky.length ? `<a class="btn big" href="#/fix/${sum.shaky.sort(byGrade)[0]}">다지러 가기</a>` : ''}<a class="btn big" href="#/me">내 수 다리 보기</a></div></div>`;
  };
  if (!asked(S) && !S.done) {
    root.innerHTML = `<div class="card">${say('point', `<b>${esc(unitLabel(unit))}</b>을(를) 배우기 전에, 꼭 필요한 판자가 튼튼한지 볼게요.<br>문제마다 <b>먼저 짐작</b>을 하나 고르고 풀어요. 모르면 넘어가도 괜찮아요.`)}<button class="pri big" id="s">시작</button></div>`;
    root.querySelector('#s').addEventListener('click', step);
  } else step();
}

// ── 판자 고치기 ──
export function fixView(root, c) {
  const me = meOf(); if (!me) return go('#/join');
  if (!byId[c]) return go('#/me');
  const K = KS.load(me);
  const before = KS.reportOf(K).L[c];
  const F = newFix({ c, id: rand(6) });
  KS.setNow(me, { mode: 'fix', c });
  const head = (pose, t) => say(pose, t, 64);
  const shell = (top, body) => { root.innerHTML = `<div class="card">${top}<div id="b">${body || ''}</div></div>`; return root.querySelector('#b'); };
  function show() {
    const done = F.si >= F.steps.length;
    const b = shell(head('point', F.steps.length ? '튼튼이가 먼저 풀어 볼게요. 한 단계씩 생각을 말할게요.' : `튼튼이가 먼저 풀어 볼게요. ${esc(hintOf(c))}`),
      `<div class="qcard">${staticHTML(F.ex.prompt, done || !F.steps.length ? F.ex.sol : null)}${modelHTML(F.ex)}
        <ol class="steps">${F.steps.slice(0, F.si).map((st, i) => stepHTML(st, { cls: i === F.si - 1 ? 'now' : '' })).join('')}</ol>
        ${done && F.steps.length ? `<p class="fb ok">그래서 답은 <b>${esc(F.ex.sol.join(', '))}</b>예요.</p>` : ''}
        <div class="qact"><button class="pri big" id="n">${!F.steps.length ? '이제 내가 풀어요' : done ? '이제 같이 풀어요' : '다음 단계'}</button></div></div>`);
    b.querySelector('#n').addEventListener('click', () => { if (!F.steps.length || done) { F.si = F.steps.length; showNext(F); route(); } else { showNext(F); show(); } });
  }
  function together() {
    const st = F.curSteps[F.si];
    if (!st) {   // 단계 다 함 → 원래 문제
      const b = shell(head('think', '단계를 다 했어요. 이제 처음 문제의 답을 써요.'), '<div id="slot"></div>');
      draw(b.querySelector('#slot'), { prompt: F.cur.prompt, choices: F.cur.choices, conf: false, idk: false, extra: `<ol class="steps">${F.curSteps.map((s) => stepHTML(s)).join('')}</ol>`, onAnswer: (a) => { const r = answerItem(F, a.vals, a.raws); feedback(r, route); } });
      return;
    }
    const b = shell(head('point', '이번엔 같이 풀어요. 단계마다 빈칸을 채워요.'), `<div class="qcard" style="margin-bottom:10px">${staticHTML(F.cur.prompt, null)}<ol class="steps">${F.curSteps.slice(0, F.si).map((s) => stepHTML(s)).join('')}</ol></div><p><b>${esc(st.why)}</b></p><div id="slot"></div>`);
    draw(b.querySelector('#slot'), { prompt: st.prompt, conf: false, idk: false, onAnswer: (a) => { const r = togetherStep(F, a.vals); if (r.ok) together(); else feedback({ ok: false, sol: r.sol, msg: `이 단계의 답은 <b>${esc(r.sol.join(', '))}</b>예요. ${esc(r.why)}` }, together); } });
  }
  function solo() {
    if (F.reStep) return reStep();
    const b = shell(head('hi', `이제 혼자 풀어 봐요. <span class="muted small">(맞힌 것 ${F.solo.ok} / 3)</span>`), '<div id="slot"></div>');
    draw(b.querySelector('#slot'), { prompt: F.cur.prompt, choices: F.cur.choices, conf: false, idk: false, onAnswer: (a) => { const r = answerItem(F, a.vals, a.raws); feedback(r, route); } });
  }
  // 혼자에서 틀린 문제 → 같은 숫자로 단계를 나눠 아이가 채움 · 처음 어긋난 단계를 표시 [D-15]
  function reStep() {
    const steps = F.lastSteps || [];
    if (!steps.length) { afterReStep(F); return route(); }
    let i = 0, miss = null;
    const one = () => {
      if (i >= steps.length) {
        const b = shell(head('think', miss == null ? '단계는 모두 맞았어요! 단계 답을 합칠 때(자리 · 받아올림)를 한 번 더 살펴요.' : `<b>${miss + 1}번째 단계</b>에서 어긋났어요: ${esc(steps[miss].why)}`), `<ol class="steps">${steps.map((s, k) => stepHTML(s, { cls: k === miss ? 'miss' : '' })).join('')}</ol><div class="qact"><button class="pri big" id="n">다음 문제</button></div>`);
        b.querySelector('#n').addEventListener('click', () => { afterReStep(F); route(); });
        return;
      }
      const b = shell(head('think', '어디서 어긋났는지 같은 숫자로 나눠서 풀어 봐요.'), `<ol class="steps">${steps.slice(0, i).map((s, k) => stepHTML(s, { cls: k === miss ? 'miss' : '' })).join('')}</ol><p><b>${esc(steps[i].why)}</b></p><div id="slot"></div>`);
      draw(b.querySelector('#slot'), { prompt: steps[i].prompt, conf: false, idk: false, onAnswer: (a) => { const ok = steps[i].sol.every((s, k) => Number(a.vals[k]) === Number(s)); if (!ok && miss == null) miss = i; i++; one(); } });
    };
    one();
  }
  function feedback(r, then) {
    if (r.steps) F.lastSteps = r.steps;
    const b = root.querySelector('#b') || root;
    const box = document.createElement('div');
    box.className = `fb ${r.ok ? 'ok' : 'no'}`;
    box.innerHTML = r.ok ? '맞았어요! 단계를 차례로 따라 해서 맞혔어요.' : r.msg || `답은 <b>${esc((r.sol || []).join(', '))}</b>예요. ${F.phase === 'solo' && F.reStep ? '어디서 어긋났는지 나눠서 볼까요?' : ''}`;
    const btn = document.createElement('button'); btn.className = 'pri'; btn.textContent = '다음'; btn.style.marginTop = '8px';
    if (!r.ok && F.phase === 'solo' && F.solo.log.length) { const last = F.solo.log[F.solo.log.length - 1]; try { toolBox(box, { it: mkItem(c, last.p), vals: (last.a || []).map(Number), c, onSelfFix: (t) => KS.selfFix(me, K, t) }); } catch (e) { /* 도구가 없는 문항 */ } }
    box.appendChild(document.createElement('br')); box.appendChild(btn);
    b.appendChild(box);
    b.querySelectorAll('.qcard button, .qcard input').forEach((x) => { if (x !== btn) x.disabled = true; });
    btn.focus();
    btn.addEventListener('click', then);
  }
  function check() {
    const it = checkItem(F);
    if (!it) return done();
    const b = shell(head('point', '마지막! 새 숫자 3문제를 <b>도움 없이</b> 풀어요. 먼저 짐작도 골라요.'), '<div id="slot"></div>');
    draw(b.querySelector('#slot'), { prompt: it.snap.prompt, choices: it.snap.choices, tag: '확인', dots: [F.ci, F.check.items.length], onAnswer: (a, cf, ms) => { answerCheck(F, a, { conf: cf, ms }); route(); } });
  }
  function done() {
    F.check.unit = K.lastPrep ? K.lastPrep.unit : null;
    KS.addSheet(me, K, F.check, F.R, F.conf, F.ms);
    const now = Date.now();
    const okN = Object.values(F.R.it).filter((x) => x.s === 'ok').length;
    if (F.passed) { K.mx = K.mx || {}; grantAccurate(K.mx, c); KS.pushMastery(me, K); K.fixed = K.fixed || {}; K.fixed[c] = now; K.rv[c] = { n: 0, due: now + KS.REVIEW_DAYS[0] * KS.DAY, t: now }; if (K.help) delete K.help[c]; if (K.firm) delete K.firm[c]; }
    else { K.help = K.help || {}; K.help[c] = now; }
    KS.save(me, K); KS.setReview(me, K); KS.pushSummary(me, K); KS.setNow(me, { mode: 'home' });
    const was = before && before.tot ? `처음엔 ${before.ok}/${before.tot} → 지금 ${okN}/${F.check.items.length}` : `${okN}/${F.check.items.length}`;
    shell(F.passed ? say('cheer', `판자를 고쳤어요! <b>${esc(kidName(c))}</b> — ${was}.<br>1일 · 3일 · 7일 뒤에 다시 보면 오래 튼튼해요.`) : say('think', `아직 조금 흔들려요(${okN}/${F.check.items.length}). 괜찮아요 — 선생님과 함께 한 번 더 봐요.`),
      `<div class="acts">${F.passed && K.back && K.back.root === c && !K.back.solved ? `<a class="btn pri big" href="#/retry">처음 문제 다시 풀기 — ${esc(K.back.text)}</a>` : `<a class="btn pri big" href="#/me">내 수 다리로</a>`}${F.passed ? `<a class="btn big" href="#/drill/${c}">이어서 다듬기 — '빠르게' 표</a>` : ''}</div>`);
  }
  // 비교하기 — 함께 풀기 뒤, 혼자 풀기 전에 한 번(맞는 풀이 · 친구 같은 틀린 풀이 · 어디서 어긋났나)
  function compare(X) {
    const A = X.rightFirst ? X.it.sol : X.wrong, B = X.rightFirst ? X.wrong : X.it.sol;
    const b = shell(head('think', '친구 둘이 같은 문제를 풀었어요. <b>누가 맞았을까요?</b>'), `<div class="qcard"><div class="cmp">
      <button type="button" class="cmpc" data-w="${X.rightFirst ? 1 : 0}"><span class="who2">가 친구</span>${staticHTML(X.it.prompt, A)}</button>
      <button type="button" class="cmpc" data-w="${X.rightFirst ? 0 : 1}"><span class="who2">나 친구</span>${staticHTML(X.it.prompt, B)}</button></div></div>`);
    b.querySelectorAll('.cmpc').forEach((btn) => btn.addEventListener('click', () => why(btn.dataset.w === '1')));
    // 도구로 확인 — 친구의 틀린 답에 검산 도구를 써 봄(처음 배우는 자리) → 그다음 어디서 어긋났나
    let T = null; try { T = toolFor({ it: mkItem(X.it.c, X.it.p), vals: X.wrong, c, bug: X.bug }); } catch (e) { T = null; }
    function why(gotIt) {
      if (T && !why.shown) {
        why.shown = true;
        const bt = shell(head(gotIt ? 'cheer' : 'think', `${gotIt ? '맞아요! ' : '다시 봐요 — '}${X.rightFirst ? '나' : '가'} 친구가 쓴 ${esc(X.wrong.join(', '))}이(가) 맞는지 <b>${esc(T.ro)}</b> 확인해 볼까요?<br><span class="small">${esc(T.how)}</span>`), `<div class="qcard"><p class="tcheck">${T.html}</p></div><div class="qact"><button class="pri big" id="n3">그럼 어디서 어긋났을까?</button></div>`);
        bt.querySelector('#n3').addEventListener('click', () => why(gotIt));
        return;
      }
      const b2 = shell(head(gotIt ? 'cheer' : 'think', `${gotIt ? '맞아요! ' : '다시 봐요 — '}맞게 푼 건 ${staticHTML(X.it.prompt, X.it.sol)} 이에요.<br>그럼 <b>${esc(X.wrong.join(', '))}</b>라고 쓴 친구는 <b>어디서 어긋났을까요?</b>`), `<div class="todo">${X.reasons.map((t, i) => `<button type="button" class="item rs" data-i="${i}" style="text-align:left">${esc(t)}</button>`).join('')}</div>`);
      b2.querySelectorAll('.rs').forEach((btn) => btn.addEventListener('click', () => {
        const ok = X.reasons[Number(btn.dataset.i)] === X.right;
        const st = stepsOf({ c: X.it.c, p: X.it.p });
        if (T) KS.learnTool(me, K, T.tool);
        shell(head(ok ? 'cheer' : 'point', `${ok ? '맞아요! ' : '아쉬워요 — '}틀린 친구는 <b>${esc(X.right)}</b>. 그래서 ${esc(X.wrong.join(', '))}이(가) 나왔어요.${T ? `<br>🔍 <b>${esc(T.name)}</b> 도구를 내 도구함에 넣었어요 — 내 답도 이렇게 확인해요.` : ''}`), `${st.length ? `<p class="small muted">바르게 풀면 이렇게 이어져요</p><ol class="steps">${st.map((x) => stepHTML(x)).join('')}</ol>` : ''}<div class="qact"><button class="pri big" id="n2">이제 혼자 풀어요</button></div>`);
        root.querySelector('#n2').addEventListener('click', route);
      }));
    }
  }
  const prefer = before && before.why ? [...before.why.sure, ...before.why.maybe].map((h) => h.id) : [];
  function route() {
    if (F.phase === 'solo' && !F.compared && F.solo.n === 0 && !F.reStep) { F.compared = true; const X = compareOf(c, { prefer }); if (X) return compare(X); }
    ({ show, together, solo, check, done })[F.phase]();
  }
  route();
}

// ── 다시 보기(고친 판자 · 섞어서 [D-10][D-11]) ──
export function reviewView(root) {
  const me = meOf(); if (!me) return go('#/join');
  const K = KS.load(me);
  const due = Object.entries(K.rv || {}).filter(([, x]) => x.n < KS.REVIEW_DAYS.length && x.due <= Date.now()).map(([c]) => c).filter((c) => byId[c]);
  if (!due.length) return go('#/me');
  const sh = makeSheet({ kind: 'review', words: false, id: rand(6), lessons: due.slice(0, 6).map((c) => ({ c, n: 2 })), mixed: true });
  sh.items = sh.items.filter((it) => it.ch !== 'END'); sh.chapters = sh.chapters.filter((ch) => ch.key !== 'END');
  for (let i = sh.items.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [sh.items[i], sh.items[j]] = [sh.items[j], sh.items[i]]; }
  const R = { done: {}, it: {} }, conf = {}, ms = {};
  let i = 0;
  const one = () => {
    if (i >= sh.items.length) return fin();
    const it = sh.items[i];
    draw(root, { prompt: it.snap.prompt, choices: it.snap.choices, tag: '다시 보기', dots: [i, sh.items.length], onAnswer: (a, cf, t) => {
      let ok = false;
      if (a.idk) R.it[it.k] = { s: 'q' };
      else { ok = checkAns(it, a); R.it[it.k] = ok ? { s: 'ok' } : { s: 'x', a: a.raws }; }
      conf[it.k] = cf; ms[it.k] = t; i++;
      const box = document.createElement('div'); box.className = `fb ${ok ? 'ok' : 'no'}`;
      box.innerHTML = ok ? '맞았어요!' : `답은 <b>${esc(it.snap.sol.join(', '))}</b>예요. 이 판자는 다시 한 번 고쳐요.`;
      const btn = document.createElement('button'); btn.className = 'pri'; btn.textContent = '다음'; btn.style.marginLeft = '10px'; box.appendChild(btn);
      root.querySelector('.qcard').appendChild(box); root.querySelectorAll('.qcard input, .qcard .qact button, .qcard .choices button, .qcard .conf button').forEach((x) => (x.disabled = true));
      btn.focus(); btn.addEventListener('click', one);
    } });
  };
  const fin = () => {
    sh.chapters.forEach((ch) => (R.done[ch.key] = true));
    KS.addSheet(me, K, sh, R, conf, ms);
    const now = Date.now(), back = [];
    for (const c of due.slice(0, 6)) {
      const its = sh.items.filter((x) => x.c === c), good = its.every((x) => R.it[x.k] && R.it[x.k].s === 'ok');
      const x = K.rv[c];
      if (good) { x.n++; x.t = now; x.due = x.n < KS.REVIEW_DAYS.length ? now + (KS.REVIEW_DAYS[x.n] - KS.REVIEW_DAYS[x.n - 1]) * KS.DAY : Infinity; }
      else { K.rv[c] = { n: 0, due: now + KS.DAY, t: now }; back.push(c); }
    }
    KS.save(me, K); KS.setReview(me, K); KS.pushSummary(me, K);
    root.innerHTML = `<div class="card">${back.length ? say('think', `다시 보기 끝! <b>${back.map((c) => esc(kidName(c))).join(', ')}</b>은(는) 조금 흔들려서 한 번 더 고쳐요.`) : say('cheer', '다시 보기 끝! 고친 판자가 그대로 튼튼해요.')}<div class="acts"><a class="btn pri big" href="#/me">내 수 다리로</a></div></div>`;
  };
  root.innerHTML = `<div class="card">${say('point', '고친 판자를 <b>섞어서</b> 다시 꺼내 풀어요. 섞으면 지금은 조금 어렵지만 오래 남아요.')}<button class="pri big" id="s">시작</button></div>`;
  root.querySelector('#s').addEventListener('click', one);
}
function checkAns(it, a) { try { const r = itemOf(it.c, it.p).check(a.vals, a.raws); return !!(r && r.ok); } catch (e) { return false; } }
