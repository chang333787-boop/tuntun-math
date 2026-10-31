// 아이 화면 — 들어가기 · 번호 확인 · 내 수 다리 · 준비 다리 · 판자 고치기
//  근거 번호는 docs/evidence.md · 아이 화면엔 학년 · 원인 이름 · 순위 · 점수 비교가 없다 [A-R11][D-20] · 피드백은 과제에 대해서만 [A-R24]
//  판자는 이름 대신 예시 문제로 부름(fix.js exampleOf — '10에서 빼기'처럼 낮은 학년 이름이 크게 보이지 않게 · 혹평 11-01)
import { byId, unitById, gradeIdx } from '../../engine/lessons/index.js';
import { LES, itemOf } from '../../paper/js/gen.js';
import { mascot } from '../../paper/js/mascot.js';
import { blankCount } from '../../engine/tokens.js';
import { prepPlan, newPrep, current, answer, summary, asked, LEN } from './prep.js';
import { newFix, showNext, showLen, showTalk, blankTalk, factTalk, togetherStep, answerItem, afterReStep, checkItem, answerCheck, compareOf, stepsOf, exampleOf, mergeTip } from './fix.js';
import * as KS from './kidstore.js';
import { draw, stepHTML, staticHTML, ansSay, rushGuard, rushPause } from './item.js';
import { P, RO } from '../../engine/concepts/kit.js';
import { bridgeSVG, KIND } from './bridge.js';
import { modelHTML } from './model.js';
import { grantAccurate, nextGoal, target, TIER, isFact } from './stage.js';
import { lsGet, lsSet, lsDel, esc, rand } from './local.js';
import { flush, get as dbGet, dec } from './db.js';
import { runPlan, weekHTML, today } from './run.js';
import { toolFor, TOOLS, nextStep } from './tools.js';
import { lineOf, weekTerm, weekPlan, weekChart, doneThisWeek } from './weekcore.js';
import { makeItem as mkItem } from '../../engine/lessons/index.js';

export const go = (h) => { location.hash = h; };
const say = (pose, html, size = 72) => `<div class="say">${mascot(pose, size)}<div class="bub">${html}</div></div>`;
export const meOf = () => lsGet('tt.me');
const kidName = (c) => (LES(c) ? LES(c).kid : c);
export const unitLabel = (u) => (unitById[u] ? unitById[u].nm : u);
const byGrade = (a, b) => gradeIdx(LES(a).g) - gradeIdx(LES(b).g) || (LES(a).n || 0) - (LES(b).n || 0);
const ro = (s) => RO(s).slice(String(s).length);   // 받침 따라 '으로' · '로'
const plank = (c) => { const x = exampleOf(c); return x ? `${x} 같은 문제` : kidName(c); };   /* 판자 부르기 = 예시 문제(없으면 할 수 있는 것 이름) */
const names = (cs) => cs.map((c) => esc(plank(c))).join(', ');
const eun = (cs) => P(plank(cs[cs.length - 1]), '은', '는');   // 마지막 말 받침으로 은 · 는
// 선생님이 오늘 연 단원(수업 중) — 받은 준비 과제 가운데 오늘 날짜인 것
const mins = (len) => ({ 18: 8, 24: 10, 36: 15 }[Number(len)] || 10);   /* 준비 다리 길이 → 대략 몇 분 */
export function classTask(K) { return Object.values(K.inbox || {}).filter((x) => x && x.kind === 'prep' && x.t && today(x.t) === today()).sort((a, b) => b.t - a.t)[0] || null; }

// ── 같은 크롬북을 여럿이 쓸 때 — 열 때 · 날짜가 바뀌었을 때 · 오래 쉬었다 누를 때 'n번 맞아요?'(main.js가 부름 · 혹평 17) ──
export const WHO = { ok: false };   // 이 열기에서 확인했나(새로 열면 다시)
export const whoOk = (me) => { const x = lsGet('tt.who'); return WHO.ok && !!x && x.d === today() && x.k === `${me.C}.${me.no}`; };
const whoMark = (me) => { WHO.ok = true; lsSet('tt.who', { d: today(), k: `${me.C}.${me.no}` }); };
export function whoView(root, me, onYes) {
  root.innerHTML = `<div class="card">${say('hi', `이 기기에 <b>${esc(me.no)}번</b>으로 들어와 있어요.<br><b>${esc(me.no)}번</b> 맞아요?`, 84)}
    <div class="acts"><button class="pri big" id="y">네, ${esc(me.no)}번이에요</button><button class="big" id="n">아니에요 — 내 번호로 들어갈게요</button></div></div>`;
  root.querySelector('#y').focus();
  root.querySelector('#y').addEventListener('click', () => { whoMark(me); onYes(); });
  root.querySelector('#n').addEventListener('click', () => { lsDel('tt.me'); lsDel('tt.who'); WHO.ok = false; go(`#/join?c=${me.C}`); });
}

// ── 들어가기 ── 카드 QR 주소 #/join?c=<반>&n=<번호> — 둘 다 차 있으면 핀 칸에 바로 · 핀은 보이는 글자(카드에 인쇄된 네 자리 반 비밀)
export function joinView(root) {
  const q = new URLSearchParams(location.hash.split('?')[1] || '');
  const c0 = (q.get('c') || '').toUpperCase(), n0 = /^\d{1,3}$/.test(q.get('n') || '') ? q.get('n') : '';
  root.innerHTML = `<div class="card">${say('hi', '안녕하세요! 저는 <b>튼튼이</b>예요. 같이 수 다리를 튼튼하게 놓아요.<br>선생님이 준 카드를 보고 써 주세요.')}
    <form id="f" autocomplete="off">
      <div class="field"><label for="c">반 코드</label><input id="c" maxlength="6" value="${esc(c0)}" autocapitalize="characters" autocomplete="off" placeholder="여섯 글자"></div>
      <div class="field"><label for="n">내 번호</label><input id="n" inputmode="numeric" maxlength="3" autocomplete="off" value="${esc(n0)}"></div>
      <div class="field"><label for="p">핀(숫자 네 개)</label><input id="p" inputmode="numeric" maxlength="4" autocomplete="off" spellcheck="false"></div>
      <p class="qmsg" id="msg" role="alert"></p>
      <button class="pri big">들어가기</button>
    </form></div>`;
  root.querySelector(c0 && n0 ? '#p' : c0 ? '#n' : '#c').focus();
  root.querySelector('#f').addEventListener('submit', async (e) => {
    e.preventDefault();
    const m = root.querySelector('#msg'); m.textContent = '확인하는 중…';
    try { const me = await KS.join(root.querySelector('#c').value, root.querySelector('#n').value, root.querySelector('#p').value); lsSet('tt.me', me); whoMark(me); go('#/me'); }
    catch (err) { m.textContent = err.status === 401 ? '코드 · 번호 · 핀이 맞지 않아요. 카드를 다시 봐 주세요.' : err.message || '들어가지 못했어요'; }
  });
}

// ── 오늘 할 일 고르기(홈과 같은 규칙) ──
//  준비했나 = 마지막 준비 다리(K.lastPrep · 문제 0개로 끝난 판도 '했음')가 선생님이 연 뒤 · 다른 기기에서 했으면 그 단원 기록이 연 뒤(혹평 5)
//  가장 약한 아이가 사라지지 않게 — 준비 다리가 '선생님과 같이'로 멈췄거나 · 막힌 칸이 셋 넘는데 고칠 판자가 비었거나 · 판자 고치기가 선생님과로 끝났으면 맨 위에 '선생님과 같이 봐요'(혹평 2)
export function todoOf(K, rep) {
  const out = [];
  const tasks = Object.entries(K.inbox || {}).map(([id, x]) => ({ id, ...x })).filter((x) => x && x.kind === 'prep').sort((a, b) => b.t - a.t);
  const t = tasks[0], lp = K.lastPrep, now = Date.now(), td = today();
  const preppedAfter = (u, since) => (lp && lp.unit === u && lp.t >= since) || Object.values(K.recs).some((x) => x && x.s && x.s.unit === u && x.s.made >= since);
  if (t && !preppedAfter(t.unit, t.t)) out.push({ kind: 'prep', unit: t.unit, pri: true, title: '오늘 단원 준비하기', sub: `선생님이 연 단원: ${unitLabel(t.unit)} — 필요한 판자가 튼튼한지 봐요(${mins(t.len)}분쯤)`, href: `#/prep/${t.unit}` });
  // 선생님과 같이 볼 판자
  const plan = lp && unitById[lp.unit] ? prepPlan(lp.unit) : null;
  const stuck = Object.values(rep.L).filter((x) => x.st === 'stuck' && byId[x.c] && (!plan || plan.below.includes(x.c))).map((x) => x.c).sort(byGrade);
  const helpFix = Object.entries(K.help || {}).filter(([c, h]) => byId[c] && today(h) === td && !(K.fixed && K.fixed[c] > h)).map(([c]) => c);
  const prepHelp = lp && lp.why === 'teacher' && today(lp.t) === td;
  const lost = !rep.start.length && stuck.length >= 3 && !(lp && (lp.why === 'budget' || lp.why === 'teacher'));   /* 이어서 찾을 수 있으면 그게 먼저 */
  if (prepHelp || lost || helpFix.length) {
    const cs = [...new Set([...helpFix, ...(prepHelp || lost ? [...rep.start.map((s) => s.c).filter((c) => !plan || plan.below.includes(c)).sort(byGrade), ...stuck] : [])])].slice(0, 3);
    out.push({ kind: 'help', cs, wait: rep.start.some((s) => !helpFix.includes(s.c)), pri: !out.length, title: '선생님과 같이 봐요', sub: '손을 들고 선생님께 이 화면을 보여 주세요' });
  }
  if (K.back && K.back.root && byId[K.back.root] && !(K.fixed && K.fixed[K.back.root] > K.back.t)) out.push({ kind: 'fix', c: K.back.root, pri: !out.length, title: `끊긴 곳 고치기 — ${plank(K.back.root)}`, sub: `'${K.back.text}'에서 거꾸로 따라가 찾은 곳이에요`, href: `#/fix/${K.back.root}` });
  else if (K.back && K.back.root && !K.back.solved && K.fixed && K.fixed[K.back.root]) out.push({ kind: 'retry', pri: !out.length, title: `처음 문제 다시 풀기 — ${K.back.text}`, sub: '끊긴 곳을 고쳤어요. 이제 풀릴 거예요', href: '#/retry' });
  const fixes = rep.start.map((s) => s.c).sort(byGrade).filter((c) => !(K.back && K.back.root === c && !(K.fixed && K.fixed[c] > K.back.t)) && !helpFix.includes(c));
  const shakyFixed = Object.keys(K.fixed || {}).filter((c) => rep.L[c] && (rep.L[c].st === 'shaky' || rep.L[c].st === 'stuck') && !fixes.includes(c) && !helpFix.includes(c));
  [...fixes, ...shakyFixed].slice(0, 3).forEach((c, i) => out.push({ kind: 'fix', c, pri: !out.length && i === 0, title: `판자 고치기 — ${plank(c)}`, sub: K.help && K.help[c] ? '지난번엔 조금 흔들렸어요. 선생님과 함께 봐도 좋아요.' : '튼튼이가 먼저 풀어 보이고, 같이 풀고, 혼자 풀어요', href: `#/fix/${c}` }));
  Object.keys(K.firm || {}).filter((c) => byId[c] && rep.L[c] && rep.L[c].st === 'shaky' && !fixes.includes(c) && !shakyFixed.includes(c)).slice(0, 2)
    .forEach((c) => out.push({ kind: 'fix', c, pri: false, title: `판자 다지기 — ${plank(c)}`, sub: '거의 되는데 가끔 흔들려요. 한 바퀴 다지면 튼튼해져요', href: `#/fix/${c}` }));
  const due = Object.entries(K.rv || {}).filter(([, x]) => x.n < KS.REVIEW_DAYS.length && x.due <= now).map(([c]) => c);
  const ran = (K.jog || []).includes(td), rp = runPlan(K);
  if (rp.length && (!ran || due.length)) out.push({ kind: 'run', pri: !out.length, title: `오늘의 구보 (3~5분)${due.length ? ` — 다시 볼 판자 ${due.length}칸 포함` : ''}`, sub: '튼튼한 판자를 섞어서 두 문제씩 — 매일 조금씩 뛰면 수학 체력이 붙어요', href: '#/run' });
  // 다듬기 하나 — '오래'를 딸 날이 된 판자 → '빠르게'에 가까운 판자 → 정확만 있는 판자 (주인공 할 일이 없을 때만 맨 위)
  const mx = K.mx || {};
  const pickD = Object.entries(mx).filter(([c, m]) => byId[c] && m.tier === 2 && now - m.t2 >= 3 * KS.DAY)[0]
    || Object.entries(mx).filter(([c, m]) => byId[c] && m.tier === 1 && isFact(c) && m.best && m.best.med != null).sort((a, b) => a[1].best.med / target(a[0]) - b[1].best.med / target(b[0]))[0]
    || Object.entries(mx).filter(([c, m]) => byId[c] && m.tier === 1 && (isFact(c) || now - (m.t1 || 0) >= 3 * KS.DAY))[0];   /* 셈 사실이 아닌 칸은 '오래'를 딸 날(3일 뒤)이 돼야 할 일에(회귀 10-31) */
  if (pickD) { const [c, m] = pickD; out.push({ kind: 'drill', c, pri: !out.length, title: `다듬기 — ${plank(c)}`, sub: `다음 표: ${nextGoal(m, c)}`, href: `#/drill/${c}` }); }
  // 이어서 찾기 — 지난번에 18문제를 다 써서 멈췄거나, 지난 시간에 '선생님과 같이'로 멈춘 판(지난 기록 14일과 함께 이어 감)
  if (lp && unitById[lp.unit] && (lp.why === 'budget' || (lp.why === 'teacher' && today(lp.t) !== td)) && !out.some((x) => x.kind === 'prep')) out.push({ kind: 'prep', unit: lp.unit, pri: !out.length, title: '이어서 찾기', sub: `${unitLabel(lp.unit)} — 지난번에 멈춘 곳부터(${mins((tasks.find((x) => x.unit === lp.unit) || {}).len)}분쯤)`, href: `#/prep/${lp.unit}` });
  return out;
}
// 할 일 한 줄 — '선생님과 같이 봐요'는 누르면 펼쳐져 선생님께 보여 줄 문제가 나옴(가는 곳 없음)
function todoRow(t) {
  if (t.kind === 'help') return `<details class="item help"><summary><span><b>${esc(t.title)}</b><br><span class="muted small">${esc(t.sub)}</span></span><span class="go btn ${t.pri ? 'pri' : ''}">보기</span></summary>
    <div class="helpbox"><p>선생님이 오시면 같이 풀어 볼 문제예요.</p>${t.cs.length ? `<ul>${t.cs.map((c) => `<li><b>${esc(plank(c))}</b></li>`).join('')}</ul>` : ''}<p class="small muted">어려운 판자가 있는 건 괜찮아요. 같이 하면 하나씩 놓을 수 있어요. ${t.wait ? "선생님을 기다리는 동안 아래 '판자 고치기'를 먼저 해도 돼요." : '선생님이 오실 때까지 이 화면을 켜 두어요.'}</p></div></details>`;
  return `<a class="item" href="${t.href}"><span><b>${esc(t.title)}</b><br><span class="muted small">${esc(t.sub)}</span></span><span class="go btn ${t.pri ? 'pri' : ''}">시작</span></a>`;
}

// ── 내 수 다리(홈) ──
//  켜 둔 화면도 선생님이 단원을 열면 바뀌게 — 보이는 동안 30초마다 받은 과제(in)만 가볍게 확인(서버 GET 하나 · 열린 연결 X · 혹평 18)
export async function homeView(root) {
  const me = meOf(); if (!me) return go('#/join');
  root.innerHTML = `<div class="card">${say('hi', `${esc(me.no)}번, 반가워요! 수 다리를 불러오는 중이에요…`)}</div>`;
  const { K, ok } = await KS.pull(me);
  if (ok) KS.pushSummary(me, K);   // 판정 규칙이 바뀌어도 선생님 화면이 새 요약을 보게(쓰기 한 번)
  flush();
  if (location.hash !== '#/me') return;
  const rep = KS.reportOf(K);
  const todo = todoOf(K, rep);
  const wp = doneThisWeek(K.recs) ? [] : weekPlan(K, rep);
  if (wp.length >= 4) todo.push({ kind: 'week', pri: !todo.length, title: `이번 주 점검 — 섞은 문제 ${wp.length}개`, sub: '주마다 한 번 · 3~5분 · 내 선이 어디로 가나', href: '#/week' });
  const ct = classTask(K);
  const doneOne = ct && Date.now() - ct.t < 3 * 3600e3 && Object.values(K.fixed || {}).some((t) => t >= ct.t) && !todo.some((x) => x.kind === 'prep' || x.kind === 'help');   // 이번 수업에 판자 하나를 고침 → 이제 선생님 수업으로(혹평 13) · 준비 · 선생님과 같이가 남았거나 수업 뒤(3시간)면 접지 않음(회귀 10-31)
  const unit = (todo.find((x) => x.unit) || {}).unit || (ct && ct.unit) || (K.lastPrep && K.lastPrep.unit) || null;
  const cal = KS.calOf(K);
  const sw = Object.values(cal.sureWrong).reduce((a, b) => a + b, 0);
  let planks = [];
  if (unit) {
    const PP = prepPlan(unit);
    const show = new Set(PP.pre);
    rep.start.forEach((s) => { if (PP.below.includes(s.c)) show.add(s.c); });
    planks = [...show].filter((c) => LES(c)).sort(byGrade).map((c) => ({ c, st: rep.L[c] ? rep.L[c].st : 'none', tier: K.mx && K.mx[c] ? K.mx[c].tier : 0, label: kidName(c) + (K.mx && K.mx[c] && K.mx[c].tier ? ` (${TIER.slice(1, K.mx[c].tier + 1).join(' · ')})` : '') }));
  }
  const gapN = planks.filter((p) => KIND(p.st) === 'gap').length, fixN = planks.filter((p) => KIND(p.st) === 'gap' && rep.start.some((s) => s.c === p.c)).length;
  const helpRow = todo.find((x) => x.kind === 'help');
  const gapLine = !gapN ? '' : helpRow ? '점선은 빈 판자예요. 선생님과 같이 하나씩 놓아요.' : fixN ? `점선은 빈 판자예요. 위 '판자 고치기'로 하나씩 놓으면 다리가 이어져요.` : K.lastPrep && K.lastPrep.why === 'budget' ? `점선은 빈 판자예요. '이어서 찾기'로 어디부터 놓을지 찾아요.` : '점선은 빈 판자예요. 다음 준비 다리에서 이어서 찾고, 하나씩 놓아요.';
  const goal = unit ? (unitLabel(unit).length <= 5 ? unitLabel(unit) : ct && ct.unit === unit ? '오늘 단원' : '이 단원') : '';   /* 다리 끝 글은 칸이 좁아 다섯 글자까지(긴 이름은 제목에) */
  const fixedN = Object.keys(K.fixed || {}).length, tools = Object.entries(K.tools || {}).filter(([tl]) => TOOLS[tl]);
  const help = helpRow;
  const head = doneOne ? say('cheer', '판자 하나를 고쳤어요! 이제 <b>선생님 수업</b>으로 가요. 남은 할 일은 다음 시간에 해요.')
    : help && help.pri ? say('think', '오늘은 <b>선생님과 같이</b> 보는 판자가 있어요. 맨 위를 눌러 선생님께 보여 드려요.')
    : todo.length ? say('point', '오늘 할 일이에요. 위에서부터 하면 돼요.') : say('cheer', '오늘 할 일을 다 했어요! 아래에서 더 해 볼 수도 있어요.');
  const list = doneOne ? `<details class="more"><summary>다음 시간에 할 일 ${todo.length}개</summary><div class="todo">${todo.map(todoRow).join('')}</div></details>`
    : `<div class="todo">${todo.slice(0, 3).map(todoRow).join('')}</div>${todo.length > 3 ? `<details class="more"><summary>할 일 ${todo.length - 3}개 더</summary><div class="todo">${todo.slice(3).map(todoRow).join('')}</div></details>` : ''}`;
  const tok = rand(4); root.dataset.home = tok;
  root.innerHTML = `
    <div class="card">${head}${todo.length ? list : ''}
      ${ok ? '' : '<p class="warn small">서버에 닿지 않아 이 기기에 저장된 것만 보여요. 푼 것은 이 기기에 모았다가 나중에 보내요.</p>'}
    </div>
    ${unit ? `<div class="card"><h2>내 수 다리 <small>${esc(unitLabel(unit))}${ro(unitLabel(unit))} 가는 다리</small></h2>${bridgeSVG(planks, { goal })}
      <div class="legend"><span><i style="background:#c99a68"></i>튼튼(정확)</span><span><i style="background:#b07f50"></i>못 박은 판자(빠르게)</span><span><i style="background:#c9c4bb"></i>돌 판자(오래)</span><span><i style="background:#efd6a8"></i>흔들</span><span><i style="border:2px dashed #b4482b;background:none"></i>빈 판자</span><span><i style="background:#fff;opacity:.7"></i>아직 안 봄</span></div>
      ${gapLine ? `<p class="small">${esc(gapLine)}</p>` : ''}
      <details class="more"><summary>판자 이름 보기</summary><div class="plank-list">${planks.map((p) => `<span class="pk ${KIND(p.st) === 'ok' ? 'ok' : KIND(p.st) === 'gap' ? 'fix' : KIND(p.st)}">${esc(p.label)}</span>`).join('')}</div></details></div>` : ''}
    <div class="card"><h2>내 기록 <small>나하고만 견줘요</small></h2>
      ${(() => { const xs = Object.values(K.mx || {}); const n = (t) => xs.filter((m) => m.tier >= t).length; return xs.length ? `<p>스테이지 표: 정확 <b>${n(1)}</b> · 빠르게 <b>${n(2)}</b> · 오래 <b>${n(3)}</b> <span class="muted small">— 표를 모으면 판자가 나무 → 못 박은 판자 → 돌 판자로 바뀌어요</span></p>` : '<p class="muted">판자를 고치거나 준비 다리에서 셋 다 맞히면 스테이지가 생겨요.</p>'; })()}
      <p class="small">이번 주 구보 ${weekHTML(K)}</p>
      ${(() => { const ws = lineOf(K.recs, weekTerm(K)); return ws.length ? `<h3>이번 주 점검 — 내 선</h3>${weekChart(ws)}` : ''; })()}
      ${cal.n ? `<p>풀기 전에 고른 짐작이 맞은 정도: <b>${Math.round(cal.match * 100)}%</b> <span class="muted small">(${cal.n}문제)</span>${sw ? ` · '자신 있어요'인데 틀린 문제 <b>${sw}개</b> — 다음엔 고르기 전에 한 번 더 살펴봐요.` : ''}</p>` : ''}
      ${fixedN || tools.length ? `<details class="more"><summary>내가 고친 판자 · 내 도구함</summary>${fixedN ? `<p class="small">내가 고친 판자 <b>${fixedN}개</b>: ${names(Object.keys(K.fixed))}</p>` : ''}${tools.length ? `<div class="plank-list">${tools.map(([tl, x]) => `<span class="pk ok">🔍 ${esc(TOOLS[tl].name)}${x.self ? ` · 스스로 고친 ${x.self}번` : ''}</span>`).join('')}</div><p class="small muted">틀렸을 때 답을 보기 전에 도구로 확인해서 고치면 '스스로 고친 횟수'가 늘어요.</p>` : ''}</details>` : ''}
      <div class="acts"><a class="btn teal" href="#/stages">스테이지 — 판자 다듬기</a>${runPlan(K).length ? '<a class="btn" href="#/run">오늘의 구보</a>' : ''}</div></div>
    <div class="card"><h2>더 해 보기</h2>
      <div class="acts"><a class="btn teal" href="#/story">이야기 다리 — 문장제 나눠 읽기</a><a class="btn" href="#/back">막힌 문제 거꾸로 찾기</a>${K.back && K.back.root && !K.back.solved && K.fixed && K.fixed[K.back.root] ? `<a class="btn" href="#/retry">처음 문제 다시 풀기 — ${esc(K.back.text)}</a>` : ''}</div>
      <p class="small muted">거꾸로 찾기: 풀기 어려운 문제를 그대로 쓰면 튼튼이가 어디서 끊겼는지 거꾸로 따라가 찾아 줘요.</p>
      <p class="small"><button class="link" id="out">이 기기에서 나가기</button></p></div>`;
  root.querySelector('#out').addEventListener('click', () => { if (confirm('이 기기에서 나갈까요? 푼 기록은 서버에 남아 있어요.')) { lsDel('tt.me'); lsDel('tt.who'); WHO.ok = false; go('#/'); } });
  const known = K.inbox || {};   /* 같은 날 다시 열면 과제 id(prep<날짜>)가 같음 — 여는 시각(t)으로 견줌 */
  const tick = setInterval(async () => {
    if (root.dataset.home !== tok || location.hash !== '#/me' || !root.isConnected) return clearInterval(tick);
    if (document.visibilityState !== 'visible' || !ok) return;
    let v = null; try { v = await dbGet(`k/${me.C}/${me.no}/${me.pin}/in`); } catch (e) { return; }
    const fresh = Object.entries(v || {}).map(([id, s]) => [id, dec(s)]).filter(([id, x]) => x && x.kind === 'prep' && !(known[id] && known[id].t === x.t));
    if (fresh.length && root.dataset.home === tok && location.hash === '#/me') { clearInterval(tick); homeView(root); }
  }, 30000);
}

// ── 준비 다리 ──
//  한 판 길이는 선생님이 고른 것(18 · 24 · 36문제 · prep.js LEN) · 못 찾으면 다음 시간에 이어서 · 막힌 칸이 넷 넘으면 일찍 '선생님과 같이'(혹평 1)
export function prepView(root, unit) {
  const me = meOf(); if (!me) return go('#/join');
  if (!unitById[unit]) return go('#/me');
  const K = KS.load(me);
  const SK = `tt.prep.${me.C}.${me.no}`;
  let S = lsGet(SK);
  let fresh = false;
  if (!S || S.unit !== unit || S.done || Date.now() - S.made > 3 * 3600e3) { fresh = true; const task = Object.values(K.inbox || {}).filter((x) => x && x.kind === 'prep' && x.unit === unit).sort((a, b) => b.t - a.t)[0]; S = newPrep({ unit, id: rand(6), prior: KS.history(K), budget: task && task.len }); }   /* 길이는 선생님이 연 과제(len)대로 */
  const saved = new Set(S.saved || []);
  const keep = () => { S.saved = [...saved]; lsSet(SK, S); };
  // 선생님이 방금 다른 길이로 다시 열었는데 이 기기 과제가 아직 옛것이면 — 서버 과제를 한 번 읽어 아직 하나도 안 풀었으면 길이를 맞춤(회귀 10-31)
  if (fresh) (async () => { try { const v = await dbGet(`k/${me.C}/${me.no}/${me.pin}/in`); const ts = Object.values(v || {}).map(dec).filter((x) => x && x.kind === 'prep' && x.unit === unit).sort((a, b) => b.t - a.t)[0]; if (ts && LEN.includes(Number(ts.len)) && Number(ts.len) !== S.budget && asked(S) === 0) { S.budget = Number(ts.len); keep(); } } catch (e) { /* 그대로 */ } })();
  const store = () => {
    for (const sh of S.sheets) {
      const R = S.res[sh.id].me;
      if (saved.has(sh.id) || !sh.chapters.length || !sh.chapters.every((c) => R.done[c.key])) continue;
      sh.unit = unit; KS.addSheet(me, K, sh, R, S.conf[sh.id] || {}, S.ms[sh.id] || {}); saved.add(sh.id);
    }
    keep();
  };
  let lastNow = 0;
  const rush = rushGuard();   // 찍기 멈춤 [A-R29] · 선생님 화면에도 남김(K.rush)
  const step = () => {
    const it = current(S);
    if (!it) return finished();
    const sh = S.sheets.find((x) => x.id === S.at.sheet);
    if (Date.now() - lastNow > 5000) { lastNow = Date.now(); KS.setNow(me, { mode: 'prep', unit, n: asked(S) }); }
    draw(root, { prompt: it.snap.prompt, choices: it.snap.choices, tag: '준비 다리', dots: [S.at.i, sh.items.length], onAnswer: (a, cf, ms) => {
      const r = answer(S, a, { conf: cf, ms }); store();
      if (rush(ms, a, r && r.ok) && current(S)) { K.rush = (K.rush || 0) + 1; KS.save(me, K); return rushPause(root, step); }
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
    const ct = classTask(K), inClass = !!(ct && ct.unit === unit && Date.now() - ct.t < 3 * 3600e3);
    const cal = sum.cal, sw = cal.sureWrong.length, swFix = cal.sureWrong.some((x) => sum.fix.includes(x.c));
    const calLine = cal.sure ? `<p>'자신 있어요'라고 한 문제 ${cal.sure}개 가운데 ${sw ? `<b>${sw}개</b>는 틀렸어요 — ${swFix ? '그 판자를 고칠 때 꼭 다시 봐요.' : "다음엔 '자신 있어요'를 고르기 전에 한 번 더 살펴봐요."}` : '모두 맞았어요. 내 짐작을 믿어도 돼요.'}</p>` : '';
    const fix = sum.fix.slice().sort(byGrade), stuck = Object.values(sum.rep.L).filter((x) => x.st === 'stuck' && S.plan.below.includes(x.c)).map((x) => x.c).sort(byGrade);
    let head, acts;
    if (S.why === 'teacher') {
      head = say('think', `오늘은 여기까지 할게요. 어려운 판자가 몇 개 있어요 — 괜찮아요.<br><b>선생님과 같이</b> 하나씩 놓아요. 손을 들고 선생님께 이 화면을 보여 주세요.`);
      acts = `<div class="qcard"><p class="small muted">선생님과 같이 볼 문제</p><ul>${[...new Set([...fix, ...stuck])].slice(0, 3).map((c) => `<li><b>${esc(plank(c))}</b></li>`).join('')}</ul>${fix.length ? '<p class="small">선생님을 기다리는 동안 튼튼이랑 맨 위 문제부터 먼저 해 볼 수 있어요.</p>' : '<p class="small muted">다음 시간에 이어서 찾아요.</p>'}</div><div class="acts">${fix.length ? `<a class="btn big" href="#/fix/${fix[0]}">튼튼이랑 먼저 해 보기</a>` : ''}<a class="btn big" href="#/me">내 수 다리 보기</a></div>`;
    } else if (fix.length) {
      head = say('fix', `고칠 판자를 찾았어요: <b>${esc(plank(fix[0]))}</b>.<br>${inClass ? '지금 튼튼이랑 하나 고치고, 그다음 선생님 수업으로 가요.' : '지금 튼튼이랑 고쳐 볼까요?'}${fix.length > 1 ? `<br><span class="small">고칠 판자가 ${fix.length - 1}개 더 있어요 — 다음에 하나씩 해요.</span>` : ''}`);
      acts = `<div class="acts"><a class="btn pri big" href="#/fix/${fix[0]}">고치러 가기</a><a class="btn big" href="#/me">내 수 다리 보기</a></div>`;
    } else if (sum.shaky.length) {
      head = say('think', `다리는 거의 튼튼해요! <b>${names(sum.shaky)}</b>${eun(sum.shaky)} 조금 흔들려요.<br>시간 될 때 다지고, 지금은 ${inClass ? '선생님 수업으로' : '내 수 다리로'} 가요!`);
      acts = `<div class="acts"><a class="btn big" href="#/fix/${sum.shaky.sort(byGrade)[0]}">다지러 가기</a><a class="btn big" href="#/me">내 수 다리 보기</a></div>`;
    } else if (S.why === 'budget') {
      head = say('think', `오늘은 여기까지 찾았어요(${sum.n}문제). 다음 시간에 멈춘 곳부터 이어서 찾아요.${inClass ? ' 지금은 선생님 수업으로 가요!' : ''}`);
      acts = '<div class="acts"><a class="btn big" href="#/me">내 수 다리 보기</a></div>';
    } else {
      head = say('cheer', `<b>${esc(unitLabel(unit))}</b>${ro(unitLabel(unit))} 가는 다리가 튼튼해요! ${inClass ? '이제 선생님 수업으로 가요.' : '오늘 단원으로 건너가요.'}`);
      acts = '<div class="acts"><a class="btn big" href="#/me">내 수 다리 보기</a></div>';
    }
    root.innerHTML = `<div class="card">${head}${S.why === 'teacher' ? '' : calLine}${acts}</div>`;
  };
  if (!asked(S) && !S.done) {
    root.innerHTML = `<div class="card">${say('point', `<b>${esc(unitLabel(unit))}</b> 배우기 전에, 필요한 판자가 튼튼한지 볼게요(${S.prior ? '지난번에 멈춘 곳부터 · ' : ''}${mins(S.budget)}분쯤).<br>문제마다 <b>먼저 짐작</b>을 고르면 답 칸이 열려요. 모르면 넘어가도 돼요.`)}<button class="pri big" id="s">시작</button></div>`;
    root.querySelector('#s').addEventListener('click', step);
  } else step();
}

// ── 판자 고치기 ──
//  시범 → 함께 → 혼자 → 확인(fix.js) · 단계가 없는 칸도 '함께'가 있음(튼튼이가 일부를 해 줌) · 칭찬은 실제로 한 것만 · 틀리면 다음에 할 한 가지
//  선생님이 단원을 연 수업 중이면 판자 하나 고친 뒤 '이제 선생님 수업으로'(혹평 13)
export function fixView(root, c) {
  const me = meOf(); if (!me) return go('#/join');
  if (!byId[c]) return go('#/me');
  const K = KS.load(me);
  const before = KS.reportOf(K).L[c];
  const F = newFix({ c, id: rand(6) });
  const ct0 = classTask(K), inClass = !!(ct0 && Date.now() - ct0.t < 3 * 3600e3);   /* 수업 중(연 뒤 3시간)만 — 저녁 집에서는 보통 끝 화면(회귀 10-31) */
  KS.setNow(me, { mode: 'fix', c });
  const head = (pose, t) => say(pose, t, 64);
  const shell = (top, body) => { root.innerHTML = `<div class="card">${top}<div id="b">${body || ''}</div></div>`; return root.querySelector('#b'); };
  const tsay = (xs) => (xs.length ? `<div class="tsay">${xs.map((x) => `<p>${esc(x)}</p>`).join('')}</div>` : '');
  // 시범 — 단계가 있으면 단계마다 · 없으면 그 문제 숫자로 말하며 빈칸을 하나씩(보기는 답 보기에 표시)
  function show() {
    const n = showLen(F), done = F.si >= n, has = F.steps.length > 0;
    if (has) {
      const b = shell(head('point', '튼튼이가 먼저 풀어 볼게요. 한 단계씩 생각을 말할게요.'),
        `<div class="qcard">${staticHTML(F.ex.prompt, done ? F.ex.sol : null)}${modelHTML(F.ex)}
          <ol class="steps">${F.steps.slice(0, F.si).map((st, i) => stepHTML(st, { cls: i === F.si - 1 ? 'now' : '' })).join('')}</ol>
          ${done ? `<p class="fb ok">${ansSay(F.ex, '그래서 답은')}</p>` : ''}
          <div class="qact"><button class="pri big" id="n">${done ? '이제 같이 풀어요' : '다음 단계'}</button></div></div>`);
      b.querySelector('#n').addEventListener('click', () => { showNext(F); route(); });
      return;
    }
    const nb = F.ex.choices ? 0 : blankCount(F.ex.prompt);
    const vals = F.ex.choices ? null : F.ex.sol.map((v, i) => (i < F.si ? v : null));
    const say1 = F.si ? [...showTalk(F), ...(nb >= 2 ? Array.from({ length: F.si }, (_, i) => blankTalk(F.ex, i)).filter(Boolean) : [])] : [];
    const choices = F.ex.choices ? `<div class="choices static">${F.ex.choices.map((ch, k) => `<button type="button" disabled class="${done && String(k) === String(F.ex.sol[0]) ? 'right' : ''}">${staticHTML(ch, null)}</button>`).join('')}</div>` : '';
    const b = shell(head('point', '튼튼이가 먼저 풀어 볼게요. 생각을 말하면서 풀게요.'),
      `<div class="qcard">${staticHTML(F.ex.prompt, vals)}${choices}${modelHTML(F.ex)}${tsay(say1)}
        ${done ? `<p class="fb ok">${ansSay(F.ex, '그래서 답은')}</p>` : ''}
        <div class="qact"><button class="pri big" id="n">${done ? '이제 같이 풀어요' : F.si ? '다음' : '튼튼이 생각 보기'}</button></div></div>`);
    b.querySelector('#n').addEventListener('click', () => { showNext(F); route(); });
  }
  // 함께 — 단계 빈칸을 아이가(단계 있는 칸) · 튼튼이가 일부를 해 주고 아이는 한 곳만(단계 없는 칸)
  function together() {
    if (F.assist) return assist();
    const st = F.curSteps[F.si];
    if (!st) {   // 단계 다 함 → 원래 문제
      const b = shell(head('think', '단계를 다 했어요. 이제 처음 문제의 답을 써요.'), '<div id="slot"></div>');
      draw(b.querySelector('#slot'), { prompt: F.cur.prompt, choices: F.cur.choices, conf: false, idk: false, extra: `<ol class="steps">${F.curSteps.map((s) => stepHTML(s)).join('')}</ol>`, onAnswer: (a) => { const it0 = F.cur; const r = answerItem(F, a.vals, a.raws); feedback({ ...r, it0, how: 'steps' }, route); } });
      return;
    }
    const b = shell(head('point', '이번엔 같이 풀어요. 단계마다 빈칸을 채워요.'), `<div class="qcard" style="margin-bottom:10px">${staticHTML(F.cur.prompt, null)}<ol class="steps">${F.curSteps.slice(0, F.si).map((s) => stepHTML(s)).join('')}</ol></div><p><b>${esc(st.why)}</b></p><div id="slot"></div>`);
    draw(b.querySelector('#slot'), { prompt: st.prompt, conf: false, idk: false, onAnswer: (a) => { const r = togetherStep(F, a.vals); if (r.ok) together(); else feedback({ ok: false, msg: `${ansSay({ sol: r.sol }, '이 단계의 답은')} ${esc(r.why)}` }, together); } });
  }
  function assist() {
    const A = F.assist;
    const top = A.kind === 'given' ? '이번엔 같이 풀어요. 앞 빈칸은 튼튼이가 채웠어요 — <b>마지막 빈칸</b>을 채워요.'
      : A.kind === 'pick' ? '이번엔 같이 풀어요. 튼튼이가 <b>답이 아닌 보기</b>를 지웠어요. 남은 것 중에서 골라요.'
      : A.say.length ? '이번엔 같이 풀어요. 튼튼이가 <b>첫 생각</b>을 말해 줄게요. 그다음은 내가 풀어요.' : '이번엔 같이 풀어요. 천천히 풀어 봐요 — 틀려도 튼튼이가 바로 알려 줘요.';
    const b = shell(head('point', top), '<div id="slot"></div>');
    draw(b.querySelector('#slot'), { prompt: F.cur.prompt, choices: F.cur.choices, conf: false, idk: false, given: A.given, hide: A.hide, say: A.say, onAnswer: (a) => { const it0 = F.cur; const r = answerItem(F, a.vals, a.raws); feedback({ ...r, it0, how: A.kind }, route); } });
  }
  function solo() {
    if (F.reStep) return reStep();
    const b = shell(head('hi', `이제 혼자 풀어 봐요. <span class="muted small">(맞힌 것 ${F.solo.ok} / 3)</span>`), '<div id="slot"></div>');
    draw(b.querySelector('#slot'), { prompt: F.cur.prompt, choices: F.cur.choices, conf: false, idk: false, onAnswer: (a) => { const it0 = F.cur; const r = answerItem(F, a.vals, a.raws); soloBack(r, it0, a); } });
  }
  // 혼자에서 틀린 뒤 — 세 번 내리 틀림이면 같이 한 번 더 / 선생님과 · 아니면 다음에 할 한 가지: 검산 도구(답 보기 전에) → 같은 숫자로 나눠 보기 → 방법 한 줄
  function soloBack(r, it0, a) {
    const box = fbBox(r.ok);
    let selfFixed = false;
    if (r.ok) box.innerHTML = '맞았어요! 혼자서 풀었어요.';
    else if (r.back) box.innerHTML = `${ansSay(it0)}<br>세 번 이어서 어려웠어요. 괜찮아요 — 튼튼이랑 <b>한 번 더 같이</b> 풀어요.`;
    else if (r.help) box.innerHTML = `${ansSay(it0)}<br>오늘은 여기까지 해요. 다음은 선생님과 같이 해요.`;
    else {
      let T = null; try { T = toolFor({ it: mkItem(c, it0.p), vals: (a.vals || []).map(Number), c, bug: r.bug ? r.bug.id : null }); } catch (e) { T = null; }
      if (T) nextStep(box, { it: mkItem(c, it0.p), vals: (a.vals || []).map(Number), c, bug: r.bug ? r.bug.id : null, onSelfFix: (t) => { selfFixed = true; KS.selfFix(me, K, t); } });
      else if (r.steps) { F.lastSteps = r.steps; box.innerHTML = '아직 아니에요. 같은 숫자로 <b>나눠서</b> 어디서 어긋났는지 봐요.'; }
      else nextStep(box, { it: itemOf(c, it0.p), vals: (a.vals || []).map(Number), c });
      if (r.steps) F.lastSteps = r.steps;
    }
    nextBtn(box, () => { if (selfFixed && F.reStep) afterReStep(F); route(); });
  }
  // 혼자에서 틀린 문제 → 같은 숫자로 단계를 나눠 아이가 채움 · 처음 어긋난 단계를 표시 [D-15]
  function reStep() {
    const steps = F.lastSteps || [];
    if (!steps.length) { afterReStep(F); return route(); }
    let i = 0, miss = null;
    const one = () => {
      if (i >= steps.length) {
        const b = shell(head('think', miss == null ? `단계는 모두 맞았어요! ${esc(mergeTip(F.cur))}` : `<b>${miss + 1}번째 단계</b>에서 어긋났어요: ${esc(steps[miss].why)}`), `<ol class="steps">${steps.map((s, k) => stepHTML(s, { cls: k === miss ? 'miss' : '' })).join('')}</ol><p>처음 문제는 ${staticHTML(F.cur.prompt, F.cur.choices ? null : F.cur.sol)} ${F.cur.choices ? ansSay(F.cur) : ''}</p><div class="qact"><button class="pri big" id="n">다음 문제</button></div>`);
        b.querySelector('#n').addEventListener('click', () => { afterReStep(F); route(); });
        return;
      }
      const b = shell(head('think', '어디서 어긋났는지 같은 숫자로 나눠서 풀어 봐요.'), `<ol class="steps">${steps.slice(0, i).map((s, k) => stepHTML(s, { cls: k === miss ? 'miss' : '' })).join('')}</ol><p><b>${esc(steps[i].why)}</b></p><div id="slot"></div>`);
      draw(b.querySelector('#slot'), { prompt: steps[i].prompt, conf: false, idk: false, onAnswer: (a) => { const ok = steps[i].sol.every((s, k) => Number(a.vals[k]) === Number(s)); if (!ok && miss == null) miss = i; i++; one(); } });
    };
    one();
  }
  const fbBox = (ok) => {
    const b = root.querySelector('#b') || root;
    const box = document.createElement('div'); box.className = `fb ${ok ? 'ok' : 'no'}`;
    b.appendChild(box);
    b.querySelectorAll('.qcard button, .qcard input').forEach((x) => (x.disabled = true));
    return box;
  };
  const nextBtn = (box, then) => { const btn = document.createElement('button'); btn.className = 'pri'; btn.textContent = '다음'; btn.style.marginTop = '8px'; box.appendChild(document.createElement('br')); box.appendChild(btn); btn.focus(); btn.addEventListener('click', then); };
  // 함께에서의 되먹임 — 칭찬은 실제로 한 것만('단계를 차례로'는 단계를 했을 때만) · 틀리면 답 + 그 문제 숫자로 한 생각
  function feedback(r, then) {
    const box = fbBox(r.ok);
    if (r.msg) box.innerHTML = r.msg;
    else if (r.ok) box.innerHTML = r.how === 'steps' ? '맞았어요! 단계를 차례로 따라 해서 맞혔어요.' : r.how === 'given' ? '맞았어요! 튼튼이와 같이 끝까지 풀었어요.' : '맞았어요!';
    else {
      const it0 = r.it0 || {}, nb = it0.choices ? 0 : blankCount(it0.prompt || []);
      const why = factTalk(it0, true) || (nb ? blankTalk(it0, nb - 1, true) : '');
      box.innerHTML = `${ansSay({ sol: r.sol || [], choices: it0.choices })}${why ? `<br><span class="small">${esc(why)}</span>` : ''}`;
    }
    nextBtn(box, then);
  }
  function check() {
    const it = checkItem(F);
    if (!it) return done();
    const b = shell(head('point', '마지막! 새 숫자 3문제를 <b>도움 없이</b> 풀어요. 먼저 짐작도 골라요.'), '<div id="slot"></div>');
    draw(b.querySelector('#slot'), { prompt: it.snap.prompt, choices: it.snap.choices, tag: '확인', dots: [F.ci, F.check.items.length], onAnswer: (a, cf, ms) => { answerCheck(F, a, { conf: cf, ms }); route(); } });
  }
  function done() {
    const now = Date.now();
    if (F.check) { F.check.unit = K.lastPrep ? K.lastPrep.unit : null; KS.addSheet(me, K, F.check, F.R, F.conf, F.ms); }
    const okN = Object.values(F.R.it).filter((x) => x.s === 'ok').length;
    if (F.passed) { K.mx = K.mx || {}; grantAccurate(K.mx, c); KS.pushMastery(me, K); K.fixed = K.fixed || {}; K.fixed[c] = now; K.rv[c] = { n: 0, due: now + KS.REVIEW_DAYS[0] * KS.DAY, t: now }; if (K.help) delete K.help[c]; if (K.firm) delete K.firm[c]; }
    else { K.help = K.help || {}; K.help[c] = now; K.helpWhy = { ...(K.helpWhy || {}), [c]: F.help ? 'solo' : 'check' }; }   /* 'solo' = 혼자에서 세 번씩 두 번 내리 틀려 확인 없이 끝 · 'check' = 확인 3문제를 못 넘음(메인이 요약에 넣을 값) */
    KS.save(me, K); KS.setReview(me, K); KS.pushSummary(me, K); KS.setNow(me, { mode: 'home' });
    const ex = plank(c);
    if (F.help) {   // 혼자에서 세 번씩 두 번 내리 틀림 — 확인 문제 없이 선생님과(혹평 4)
      shell(say('think', `오늘은 여기까지 해요. 이 판자는 <b>선생님과 같이</b> 놓아요.<br>손을 들고 선생님께 이 화면을 보여 주세요.`),
        `<div class="qcard"><p class="small muted">선생님과 같이 볼 문제</p><p><b>${esc(ex)}</b></p><p class="small">어려운 판자가 있는 건 괜찮아요. 같이 하면 하나씩 놓을 수 있어요.</p></div><div class="acts"><a class="btn big" href="#/me">내 수 다리로</a></div>`);
      return;
    }
    const was = before && before.tot ? `처음엔 ${before.ok}/${before.tot} → 지금 ${okN}/${F.check.items.length}` : `${okN}/${F.check.items.length}`;
    const retry = F.passed && K.back && K.back.root === c && !K.back.solved;
    const top = F.passed ? say('cheer', `판자를 고쳤어요! <b>${esc(ex)}</b> — ${was}.<br>${inClass ? '이제 <b>선생님 수업</b>으로 가요. 남은 판자는 다음 시간에 해요.' : '1일 · 3일 · 7일 뒤에 다시 보면 오래 튼튼해요.'}`)
      : say('think', `아직 조금 흔들려요(${okN}/${F.check.items.length}). 괜찮아요 — 선생님과 함께 한 번 더 봐요.${inClass ? '<br>지금은 선생님 수업으로 가요.' : ''}`);
    shell(top, `<div class="acts">${retry ? `<a class="btn pri big" href="#/retry">처음 문제 다시 풀기 — ${esc(K.back.text)}</a>` : `<a class="btn ${inClass ? '' : 'pri '}big" href="#/me">내 수 다리로</a>`}${F.passed && !inClass ? `<a class="btn big" href="#/drill/${c}">이어서 다듬기</a>` : ''}</div>`);
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
        const w = X.wrong.join(', '), bt = shell(head(gotIt ? 'cheer' : 'think', `${gotIt ? '맞아요! ' : '다시 봐요. '}${X.rightFirst ? '나' : '가'} 친구가 쓴 ${esc(w)}${P(w, '이', '가')} 맞는지 <b>${esc(T.ro)}</b> 확인해 볼까요?<br><span class="small">${esc(T.how)}</span>`), `<div class="qcard"><p class="tcheck">${T.html}</p></div><div class="qact"><button class="pri big" id="n3">그럼 어디서 어긋났을까?</button></div>`);
        bt.querySelector('#n3').addEventListener('click', () => why(gotIt));
        return;
      }
      const w2 = X.wrong.join(', '), b2 = shell(head(gotIt ? 'cheer' : 'think', `${gotIt ? '맞아요! ' : '다시 봐요. '}맞게 푼 건 ${staticHTML(X.it.prompt, X.it.sol)} 이에요.<br>그럼 <b>${esc(w2)}</b>${P(w2, '이라고', '라고')} 쓴 친구는 <b>어디서 어긋났을까요?</b>`), `<div class="todo">${X.reasons.map((t, i) => `<button type="button" class="item rs" data-i="${i}" style="text-align:left">${esc(t)}</button>`).join('')}</div>`);
      b2.querySelectorAll('.rs').forEach((btn) => btn.addEventListener('click', () => {
        const ok = X.reasons[Number(btn.dataset.i)] === X.right;
        const st = stepsOf({ c: X.it.c, p: X.it.p });
        if (T) KS.learnTool(me, K, T.tool);
        shell(head(ok ? 'cheer' : 'point', `${ok ? '맞아요! ' : '아쉬워요. '}틀린 친구는 <b>${esc(X.right)}</b>. 그래서 ${esc(w2)}${P(w2, '이', '가')} 나왔어요.${T ? `<br>🔍 <b>${esc(T.name)}</b> 도구를 내 도구함에 넣었어요. 내 답도 이렇게 확인해요.` : ''}`), `${st.length ? `<p class="small muted">바르게 풀면 이렇게 이어져요</p><ol class="steps">${st.map((x) => stepHTML(x)).join('')}</ol>` : ''}<div class="qact"><button class="pri big" id="n2">이제 혼자 풀어요</button></div>`);
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

// ── 다시 보기 — 오늘의 구보에 들어 있음(다시 볼 날이 된 판자를 먼저 · run.js) · 예전 주소는 구보로 ──
export function reviewView() { go('#/run'); }
