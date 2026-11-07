// 아이 화면 — 들어가기 · 번호 확인 · 내 수 다리 · 준비 다리 · 판자 고치기
//  근거 번호는 docs/evidence.md · 아이 화면엔 학년 · 원인 이름 · 순위 · 점수 비교가 없다 [A-R11][D-20] · 피드백은 과제에 대해서만 [A-R24]
//  판자는 이름 대신 예시 문제로 부름(fix.js exampleOf — '10에서 빼기'처럼 낮은 학년 이름이 크게 보이지 않게 · 혹평 11-01)
import { byId, unitById, gradeIdx } from '../../engine/lessons/index.js';
import { LES, itemOf } from '../../paper/js/gen.js';
import { mascot } from '../../paper/js/mascot.js';
import { blankCount } from '../../engine/tokens.js';
import { prepPlan, newPrep, current, answer, summary, asked, LEN, PREP } from './prep.js';
import { FIX, jumpTo, newFix, showNext, showLen, showTalk, blankTalk, factTalk, togetherStep, answerItem, afterReStep, checkItem, answerCheck, compareOf, stepsOf, exampleOf, mergeTip } from './fix.js';
import * as KS from './kidstore.js';
import { draw, stepHTML, staticHTML, ansSay, rushGuard, rushPause, fbSlot } from './item.js';
import { P, RO } from '../../engine/concepts/kit.js';
import { colOf, colView, picAns, tenFrameHTML, regroupHTML, rgLag } from './model.js';
import { grantAccurate } from './stage.js';
import { lsGet, lsSet, lsDel, esc, rand } from './local.js';
import { flush, get as dbGet, dec } from './db.js';
import { runPlan, weekHTML, today } from './run.js';
import { toolFor, nextStep } from './tools.js';
import { lineOf, weekTerm, weekPlan, doneThisWeek, weekKey } from './weekcore.js';
import { makeItem as mkItem } from '../../engine/lessons/index.js';
import { icon, tile, ACT, art } from './icons.js';
import { giveTasks } from './give.js';
import { ladder, stepCtx, colFor, planHTML, planNames } from './hint.js';
import { checkTasks } from './check.js';
import { speakButton } from './speak.js';

export const go = (h) => { location.hash = h; };
const say = (pose, html, size = 72) => `<div class="say">${mascot(pose, size)}<div class="bub">${html}</div></div>`;
const sayArt = (k, html, size = 96) => `<div class="say">${art(k, size, 'say-art')}<div class="bub">${html}</div></div>`;   /* 튼튼이 그림(app/img)으로 말하기 */
export const meOf = () => lsGet('tt.me');
const kidName = (c) => (LES(c) ? LES(c).kid : c);
export const unitLabel = (u) => (unitById[u] ? unitById[u].nm : u);
const byGrade = (a, b) => gradeIdx(LES(a).g) - gradeIdx(LES(b).g) || (LES(a).n || 0) - (LES(b).n || 0);
const ro = (s) => RO(s).slice(String(s).length);   // 받침 따라 '으로' · '로'
const plank = (c) => { const x = exampleOf(c); return x ? `${x} 같은 문제` : kidName(c); };   /* 판자 부르기 = 예시 문제(없으면 할 수 있는 것 이름) */
const names = (cs) => cs.map((c) => esc(plank(c))).join(', ');
const eun = (cs) => P(plank(cs[cs.length - 1]), '은', '는');   // 마지막 말 받침으로 은 · 는
// 선생님이 오늘 연 단원(수업 중) — 받은 준비 과제 가운데 오늘 날짜인 것
const mins = (len) => ({ 12: 6, 18: 8, 24: 10, 36: 15 }[Number(len)] || 8);   /* 오늘 단원 점검 길이 → 대략 몇 분 */
export function classTask(K) { return Object.values(K.inbox || {}).filter((x) => x && x.kind === 'prep' && x.t && today(x.t) === today()).sort((a, b) => b.t - a.t)[0] || null; }

// ── 같은 크롬북을 여럿이 쓸 때 — 열 때 · 날짜가 바뀌었을 때 · 오래 쉬었다 누를 때 'n번 맞아요?'(main.js가 부름 · 혹평 17) ──
export const WHO = { ok: false };   // 이 열기에서 확인했나(새로 열면 다시)
export const whoOk = (me) => { const x = lsGet('tt.who'); return WHO.ok && !!x && x.d === today() && x.k === `${me.C}.${me.no}`; };
const whoMark = (me) => { WHO.ok = true; lsSet('tt.who', { d: today(), k: `${me.C}.${me.no}` }); };
export function whoView(root, me, onYes) {
  root.innerHTML = `<div class="card msg">${say('hi', `이 기기에 <b>${esc(me.no)}번</b>으로 들어와 있어요.<br><b>${esc(me.no)}번</b> 맞아요?`, 104)}
    <div class="acts"><button class="pri big" id="y">네, ${esc(me.no)}번이에요</button><button class="big" id="n">아니에요 — 내 번호로 들어갈게요</button></div></div>`;
  root.querySelector('#y').focus();
  root.querySelector('#y').addEventListener('click', () => { whoMark(me); onYes(); });
  root.querySelector('#n').addEventListener('click', () => { lsDel('tt.me'); lsDel('tt.who'); WHO.ok = false; go(`#/join?c=${me.C}`); });
}

// ── 들어가기 ── 카드 QR 주소 #/join?c=<반>&n=<번호> — 둘 다 차 있으면 핀 칸에 바로 · 핀은 보이는 글자(카드에 인쇄된 네 자리 반 비밀)
export function joinView(root) {
  const q = new URLSearchParams(location.hash.split('?')[1] || '');
  const c0 = (q.get('c') || '').toUpperCase(), n0 = /^\d{1,3}$/.test(q.get('n') || '') ? q.get('n') : '';
  root.innerHTML = `<div class="card msg join"><div class="join-a">${say('hi', '안녕하세요! 저는 <b>튼튼이</b>예요.<br>선생님이 준 카드에 적힌 <b>반 코드 · 번호 · 핀</b>을 그대로 써 주세요.', 120)}</div>
    <form id="f" autocomplete="off">
      <div class="field"><label for="c">반 코드 <small>(영어 대문자와 숫자 여섯 개 · 한/영 키로 영어)</small></label><input id="c" maxlength="6" value="${esc(c0)}" autocapitalize="characters" autocomplete="off" lang="en" spellcheck="false" placeholder="예: AB3CD7"></div>
      <div class="field"><label for="n">내 번호</label><input id="n" inputmode="numeric" maxlength="3" autocomplete="off" value="${esc(n0)}"></div>
      <div class="field"><label for="p">핀 <small>(카드에 적힌 비밀 숫자 네 개)</small></label><input id="p" inputmode="numeric" maxlength="4" autocomplete="off" spellcheck="false"></div>
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

// t 뒤에 만든 기록에서 그 칸을 틀리거나 넘어간 적이 있나(푼 문항만)
const missAfter = (K, c, t) => Object.values(K.recs || {}).some((x) => x && x.s && x.s.made > t && Array.isArray(x.s.it) && x.r && x.r.it && x.s.it.some((i) => Array.isArray(i) && i[1] === c && x.r.it[i[0]] && x.r.it[i[0]].s !== 'ok'));

// ── 오늘 할 일 고르기(홈과 같은 규칙) ──
//  준비했나 = 마지막 준비 다리(K.lastPrep · 문제 0개로 끝난 판도 '했음')가 선생님이 연 뒤 · 다른 기기에서 했으면 그 단원 기록이 연 뒤(혹평 5)
//  가장 약한 아이가 사라지지 않게 — 준비 다리가 '선생님과 같이'로 멈췄거나 · 막힌 칸이 셋 넘는데 고칠 판자가 비었거나 · 판자 고치기가 선생님과로 끝났으면 맨 위에 '선생님과 같이 봐요'(혹평 2)
export function todoOf(K, rep) {
  const out = [];
  const tasks = Object.entries(K.inbox || {}).map(([id, x]) => ({ id, ...x })).filter((x) => x && x.kind === 'prep').sort((a, b) => b.t - a.t);
  const t = tasks[0], lp = K.lastPrep, now = Date.now(), td = today();
  const preppedAfter = (u, since) => (lp && lp.unit === u && lp.t >= since) || Object.values(K.recs).some((x) => x && x.s && x.s.unit === u && x.s.made >= since);
  const me0 = meOf(), sp = me0 ? lsGet(`tt.prep.${me0.C}.${me0.no}`) : null;
  const spOn = (u) => !!(sp && sp.unit === u && !sp.done && now - sp.made <= 3 * 3600e3 && asked(sp) > 0);   /* 하다가 나간 점검(3시간 안 · prepView와 같은 기준) */
  if (t && !preppedAfter(t.unit, t.t)) out.push(spOn(t.unit) ? { kind: 'prep', unit: t.unit, pri: true, resume: true, title: '오늘 단원 점검 — 이어서', sub: `${asked(sp) + 1}번째 문제부터 이어서 풀어요`, href: `#/prep/${t.unit}` } : { kind: 'prep', unit: t.unit, pri: true, title: '오늘 단원 점검', sub: `선생님이 연 단원: ${unitLabel(t.unit)} · 약 ${mins(t.len)}분`, href: `#/prep/${t.unit}` });
  /* 하다가 나간 배우기(3시간 안 · 같이 풀기 · 혼자 풀기 · 확인) — 배울 것 맨 앞에 '이어서'(fixView resume과 같은 기준) */
  const fx0 = me0 ? lsGet(`tt.fx.${me0.C}.${me0.no}`) : null, FXN = { together: '같이 풀기', solo: '혼자 풀기', check: '확인 3문제' };
  if (fx0 && byId[fx0.c] && FXN[fx0.phase] && now - fx0.t < 3 * 3600e3 && !(K.fixed && K.fixed[fx0.c] > fx0.t)) out.push({ kind: 'fix', c: fx0.c, resume: true, title: '배우기 — 이어서', sub: `'${FXN[fx0.phase]}'부터 이어서 해요 · ${plank(fx0.c)}`, href: `#/fix/${fx0.c}` });
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
  if (K.back && K.back.root && byId[K.back.root] && !(K.fixed && K.fixed[K.back.root] > K.back.t)) out.push({ kind: 'fix', c: K.back.root, pri: !out.length, title: `배우기 — ${plank(K.back.root)}`, sub: `'${K.back.text}'에서 거꾸로 따라가 찾은 곳이에요`, href: `#/fix/${K.back.root}` });
  else if (K.back && K.back.root && !K.back.solved && K.fixed && K.fixed[K.back.root]) out.push({ kind: 'retry', pri: !out.length, title: `처음 문제 다시 풀기 — ${K.back.text}`, sub: '막혔던 곳을 배웠어요. 이제 풀릴 거예요', href: '#/retry' });
  /* 배우기를 통과한 칸은 통과한 뒤에 다시 틀린 적이 있을 때만 다시 올림 — 확인 넷 중 셋으로 통과해도 판정은 '가끔 틀림'이라 곧바로 같은 배우기가 뜨던 것(코덱스 11-07) */
  const relearn = (c) => !(K.fixed && K.fixed[c]) || missAfter(K, c, K.fixed[c]);
  const fixes = rep.start.map((s) => s.c).sort(byGrade).filter((c) => !(K.back && K.back.root === c && !(K.fixed && K.fixed[c] > K.back.t)) && !helpFix.includes(c) && relearn(c));
  const shakyFixed = Object.keys(K.fixed || {}).filter((c) => rep.L[c] && (rep.L[c].st === 'shaky' || rep.L[c].st === 'stuck') && !fixes.includes(c) && !helpFix.includes(c) && relearn(c));
  [...fixes, ...shakyFixed].slice(0, 3).forEach((c, i) => out.push({ kind: 'fix', c, pri: !out.length && i === 0, title: `배우기 — ${plank(c)}`, sub: K.help && K.help[c] ? '지난번엔 조금 어려웠어요. 선생님과 함께 봐도 좋아요.' : '튼튼이가 먼저 풀어 보이고, 같이 풀고, 혼자 풀어요', href: `#/fix/${c}` }));
  Object.keys(K.firm || {}).filter((c) => byId[c] && rep.L[c] && rep.L[c].st === 'shaky' && !fixes.includes(c) && !shakyFixed.includes(c)).slice(0, 2)
    .forEach((c) => out.push({ kind: 'fix', c, pri: false, title: `다시 연습 — ${plank(c)}`, sub: '거의 되는데 가끔 틀려요. 한 번 더 배우면 단단해져요', href: `#/fix/${c}` }));
  const due = Object.entries(K.rv || {}).filter(([, x]) => x.n < KS.REVIEW_DAYS.length && x.due <= now).map(([c]) => c);
  const ran = (K.jog || []).includes(td), rp = runPlan(K, now, rep);
  const rr = me0 ? lsGet(`tt.run.${me0.C}.${me0.no}`) : null, rOn = rr && rr.d === td && rr.sh && Array.isArray(rr.sh.items) && rr.i > 0 && rr.i < rr.sh.items.length;
  if (rOn) out.push({ kind: 'run', pri: !out.length, resume: true, title: '매일 연습 — 이어서', sub: `${rr.i + 1}번째 문제부터 이어서 풀어요(모두 ${rr.sh.items.length}문제)`, href: '#/run' });
  else if (rp.length && (!ran || due.length)) out.push({ kind: 'run', pri: !out.length, title: `섞어서 ${rp.length * 2}문제`, sub: `3~5분${due.length ? ' · 다시 볼 문제 포함' : ''}`, href: '#/run' });
  // 이어서 찾기 — 지난번에 18문제를 다 써서 멈췄거나, 지난 시간에 '선생님과 같이'로 멈춘 판(지난 기록 14일과 함께 이어 감)
  if (lp && unitById[lp.unit] && (lp.why === 'budget' || lp.why === 'teacher') && today(lp.t) !== td && !out.some((x) => x.kind === 'prep'))   /* '이어서'는 날이 바뀐 뒤에만(방금 '다음 시간에'라고 해 놓고 바로 '지금 시작'이던 것 · 11-07 사용감 점검) */ out.push({ kind: 'prep', unit: lp.unit, pri: !out.length, title: '오늘 단원 점검 이어서', sub: `${unitLabel(lp.unit)} — 지난번에 멈춘 곳부터 · 약 ${mins((tasks.find((x) => x.unit === lp.unit) || {}).len)}분`, href: `#/prep/${lp.unit}` });
  return out;
}
// ── 처음 화면(홈) — 카드 셋: ① 점검 · ② 배울 것 · ③ 매일 연습(docs/what.md · 교사 11-07 '로그인하면 카드 셋으로 뭘 할지 명확히') ──
//  할 일 규칙은 todoOf 그대로 · 카드마다 '무엇을 하는 곳인지' 한 줄 · 지금 할 카드 하나만 주황 단추 · 탭 없음
//  켜 둔 화면도 선생님이 단원 · 점검지 · 보충을 내면 바뀌게 — 보이는 동안 30초마다 받은 과제(in)만 가볍게 확인(서버 GET 하나 · 열린 연결 X · 혹평 18)
const CARDS = [
  { k: 'chk', no: 1, t: '점검', what: '내가 어디까지 아는지 알아봐요', none: '지금 할 점검이 없어요' },
  { k: 'prac', no: 2, t: '배울 것', what: '모르는 것을 배우고 연습해요', none: '지금 배울 것이 없어요' },
  { k: 'daily', no: 3, t: '매일 연습', what: '아는 것을 잊지 않게 날마다 조금씩 풀어요', none: '점검에서 맞힌 문제와 배운 것이 며칠 뒤 여기 다시 나와요' },
];
function helpItem(t) {
  return `<li class="c3-help"><details><summary><b>${esc(t.title)}</b><span>${esc(t.sub)}</span></summary>
    <div class="helpbox"><p>선생님이 오시면 같이 풀어 볼 문제예요.</p>${t.cs.length ? `<ul>${t.cs.map((c) => `<li><b>${esc(plank(c))}</b></li>`).join('')}</ul>` : ''}<p class="small muted">어려운 문제가 있는 건 괜찮아요. 같이 하면 하나씩 풀 수 있어요. ${t.wait ? '선생님을 기다리는 동안 아래 것을 먼저 해도 돼요.' : '선생님이 오실 때까지 이 화면을 켜 두어요.'}</p></div></details></li>`;
}
function cardHTML(c, list, now, extra = '') {
  const first = list[0], go1 = first && first.href ? first : list.find((x) => x.href);
  const items = list.slice(0, 3).map((t) => (t.kind === 'help' ? helpItem(t) : `<li><a href="${t.href}"><b>${esc(t.title)}</b><span>${esc(t.sub)}</span></a></li>`)).join('');
  return `<section class="c3 act-${(ACT[c.k] || ACT.prep)[1]}${now ? ' now' : ''}${list.length ? '' : ' empty'}" aria-label="${c.no}. ${c.t}">
    <div class="c3-h">${art(c.k, 76, 'c3-art') || tile(c.k, 30)}<h2>${c.t}</h2>${list.length ? `<span class="c3-cnt">${list.length}개</span>` : ''}</div>
    <p class="c3-what">${c.what}</p>
    ${list.length ? `<ul class="c3-list">${items}</ul>${list.length > 3 ? `<p class="small muted">그 밖에 ${list.length - 3}개 더 있어요</p>` : ''}` : `<p class="c3-none">${c.none}</p>`}
    ${extra}
    ${go1 && now ? `<a class="btn big c3-go pri" href="${go1.href}">${first && first.kind === 'help' ? '기다리는 동안 다른 것 하기' : go1.resume ? '이어서 하기' : '지금 시작'}${icon('arrow', 22)}</a>` : ''}</section>`;   /* 단추는 지금 할 카드에만(다른 카드도 단추가 있으면 '2번부터'와 1번 단추가 다툼 · 11-07 처음 쓰는 아이 점검) — 다른 카드는 줄을 눌러 시작 */
}
export async function homeView(root) {
  const me = meOf(); if (!me) return go('#/join');
  root.innerHTML = `<div class="card msg">${say('hi', `${esc(me.no)}번, 반가워요! 불러오는 중이에요…`, 104)}</div>`;
  const { K, ok } = await KS.pull(me);
  if (ok) KS.pushSummary(me, K);   // 판정 규칙이 바뀌어도 선생님 화면이 새 요약을 보게(쓰기 한 번)
  flush();
  if (location.hash !== '#/me') return;
  const rep = KS.reportOf(K);
  const todo = todoOf(K, rep);
  const wp = doneThisWeek(K.recs) ? [] : weekPlan(K, rep);
  const ct = classTask(K);
  // 카드 셋에 나눠 담기 — ① 점검(오늘 단원 점검 · 선생님 점검지 · 이번 주 점검) ② 배울 것(선생님과 같이 · 선생님이 준 문제 · 배우기) ③ 매일 연습
  const chk = [...todo.filter((x) => x.kind === 'prep'), ...checkTasks(K).map((x) => ({ ...x, kind: 'check' }))];
  const me1 = meOf(), wr = me1 ? lsGet(`tt.week.${me1.C}.${me1.no}`) : null, wOn = wr && wr.wk === weekKey() && wr.sh && Array.isArray(wr.sh.items) && wr.i > 0 && wr.i < wr.sh.items.length;
  if (wOn) chk.unshift({ kind: 'week', resume: true, title: '이번 주 점검 — 이어서', sub: `${wr.i + 1}번째 문제부터 이어서 풀어요(모두 ${wr.sh.items.length}문제)`, href: '#/week' });
  else if (wp.length >= 4 && Object.keys(K.recs || {}).length) chk.push({ kind: 'week', title: '이번 주 점검', sub: `섞은 문제 ${wp.length}개 · 3~5분 · 주마다 한 번`, href: '#/week' });
  const fixR = todo.find((x) => x.kind === 'fix' && x.resume), gvs = giveTasks(K);
  const prac = [...todo.filter((x) => x.kind === 'help'), ...(fixR ? [fixR] : []), ...gvs, ...todo.filter((x) => (x.kind === 'fix' || x.kind === 'retry') && x !== fixR && !(fixR && x.c === fixR.c))];   /* 이어서 할 배우기 → 선생님이 준 문제(이어서가 앞) → 배우기 */
  const daily = todo.filter((x) => x.kind === 'run');
  const ran = (K.jog || []).includes(today());
  const doneOne = ct && Date.now() - ct.t < 3 * 3600e3 && Object.values(K.fixed || {}).some((t) => t >= ct.t) && !chk.some((x) => x.kind === 'prep') && !prac.some((x) => x.kind === 'help');   // 이번 수업에 하나 배움 → 이제 선생님 수업으로(혹평 13) · 점검 · 선생님과 같이가 남았거나 수업 뒤(3시간)면 그대로(회귀 10-31)
  // 지금 할 카드 하나 — 오늘 수업 점검 → 선생님과 같이 → 선생님이 준 문제 → 점검지 → 배우기 → 이번 주 점검 → 매일 연습
  const classPrep = chk.some((x) => x.kind === 'prep' && ct && x.unit === ct.unit);
  /* 수업 중에 오늘 단원 점검을 끝냈고(찾은 것 없이) 선생님이 준 것 · 같이 볼 것이 없으면 = 이제 선생님 수업 시간(끝 화면 말과 맞춤 · 11-07) */
  const lpN = K.lastPrep, classRest = !doneOne && !!(ct && Date.now() - ct.t < 3 * 3600e3 && lpN && lpN.unit === ct.unit && lpN.t >= ct.t && lpN.why !== 'found' && lpN.why !== 'teacher') && !prac.some((x) => x.kind === 'help' || x.kind === 'give');
  const firstDay = !Object.keys(K.recs || {}).length, hasHelp = prac.some((x) => x.kind === 'help');
  const resN = [chk, prac, daily].findIndex((l) => l[0] && l[0].resume);   /* 하던 것이 있으면 그 카드가 주황 단추(수업 중 선생님이 연 점검만 그보다 앞 · 11-07 '다시 들어와도 이어서') */
  const nowNo = doneOne || classRest ? 0 : classPrep ? 1 : resN >= 0 ? resN + 1 : prac.some((x) => x.kind === 'help' || x.kind === 'give') ? 2 : chk.some((x) => x.kind === 'check') ? 1 : prac.length ? 2 : chk.length ? 1 : daily.length ? 3 : 0;
  const lists = [chk, prac, daily];
  const head = doneOne ? say('cheer', '하나 배웠어요! 이제 <b>선생님 수업</b>으로 가요. 남은 것은 다음 시간에 해요.', 88)
    : classRest ? say('cheer', '오늘 단원 점검을 끝냈어요. 지금은 <b>선생님 수업 시간</b>이에요. 남은 것은 다음 시간에 해요.', 88)
    : hasHelp ? sayArt('hand', '<b>선생님과 같이</b> 볼 것이 있어요. 손을 들고 선생님께 알려요.<br>기다리는 동안 주황 단추로 다른 것을 해도 돼요.', 88)
    : nowNo && lists[nowNo - 1][0] && lists[nowNo - 1][0].resume ? say('point', '하던 것이 있어요. <b>이어서 하기</b>를 눌러요.', 88)
    : nowNo ? say('point', `오늘은 <b>${CARDS[nowNo - 1].t}</b>부터 해요. 주황 단추를 눌러요.`, 88)
    : firstDay ? sayArt('wait', '반가워요! 선생님이 점검을 열면 <b>점검</b> 카드에 나와요.<br>기다리는 동안 아래 <b>이야기 문제 풀기</b>를 해 봐도 돼요.', 88)
    : say('cheer', `오늘 할 것을 다 했어요! 더 하고 싶으면 <a class="btn mini" href="#/story">이야기 문제에 도전</a>해 봐요.`, 88);
  // 내 기록 — 나하고만 견줌 · 사실만(점검 맞힌 수 · 연습한 날 · 배워서 고친 것)
  const ws = lineOf(K.recs, weekTerm(K)), wl = ws[ws.length - 1], wb = ws[ws.length - 2];
  const fixedN = Object.keys(K.fixed || {}).length, cal = KS.calOf(K);
  const ladW = Object.keys(K.lad || {}).sort(), lad0 = K.lad || {}, lw = (w) => (w && lad0[w] ? (lad0[w].r || 0) + (lad0[w].s || 0) : 0), thisW = weekKey();   /* 떠올리기 · 풀이 순서로 고친 것(나하고만 견줌) */
  const selfWk = lw(thisW), prevW = ladW.filter((w) => w < thisW).pop(), selfLast = prevW ? lw(prevW) : null;
  const weekLine = wl ? `${wb ? `지난번 ${wb.ok}개 → ` : ''}이번 ${wl.ok}개 <small>(${wl.n}문제 중)</small>` : '<small>아직 안 했어요</small>';
  const tok = rand(4); root.dataset.home = tok;
  root.innerHTML = `<div class="home3">
    <div class="home3-top">${head}${ok ? '' : '<p class="warn small">서버에 닿지 않아 이 기기에 저장된 것만 보여요. 푼 것은 이 기기에 모았다가 나중에 보내요.</p>'}</div>
    <div class="cards3">${CARDS.map((c, i) => cardHTML(c.k === 'daily' && ran && !lists[i].length ? { ...c, none: '오늘 매일 연습을 했어요. 내일 또 해요.' } : c, lists[i], nowNo === c.no, c.k === 'daily' ? `<p class="c3-days">이번 주 연습한 날 ${weekHTML(K)}</p>` : '')).join('')}</div>
    <section class="mine" aria-label="내 기록"><h2 class="sec">내 기록 <small>나하고만 비교해요</small></h2>
      <div class="mine-row">
        <div class="mine-c"><span class="k">이번 주 점검 맞힌 수</span><span class="v">${weekLine}</span></div>
        <div class="mine-c"><span class="k">배우기로 고친 것</span><span class="v">${fixedN}개</span>${fixedN ? `<details class="more"><summary>보기</summary><p class="small">${names(Object.keys(K.fixed))}</p></details>` : ''}</div>
        <div class="mine-c"><span class="k">다시 풀어 맞힌 문제(이번 주)</span><span class="v">${selfWk}개${selfLast != null ? ` <small>(지난주 ${selfLast}개)</small>` : ''}</span></div>
        <div class="mine-c"><span class="k">'자신 있어요' 하고 맞힌 문제</span><span class="v">${cal.n ? `${cal.sureRight}문제 <small>(${cal.n}문제 중)</small>` : '<small>아직 없어요</small>'}</span></div>
      </div>
      <p class="mine-links small">${(() => { const so = lsGet(`tt.story.${me.C}.${me.no}`, null); return so && !so.done && Date.now() - so.made < 3 * 3600e3 && Array.isArray(so.items) && so.i < so.items.length ? `<a href="#/story"><b>이야기 문제 이어서 하기</b>(${so.i + 1}번째 이야기부터)</a>` : '<a href="#/story">이야기 문제 풀기</a>'; })()}<a href="#/back">막힌 문제 직접 넣어 보기</a></p>
      <p class="out-row small"><button class="link" id="out">나가기(다른 친구가 이 크롬북을 쓸 때)</button></p></section>
  </div>`;
  root.querySelector('#out').addEventListener('click', () => { if (confirm('이 기기에서 나갈까요? 푼 기록은 서버에 남아 있어요.')) { lsDel('tt.me'); lsDel('tt.who'); WHO.ok = false; go('#/'); } });
  const known = K.inbox || {};   /* 같은 날 다시 열면 과제 id(prep<날짜>)가 같음 — 여는 시각(t)으로 견줌 */
  const tick = setInterval(async () => {
    if (root.dataset.home !== tok || location.hash !== '#/me' || !root.isConnected) return clearInterval(tick);
    if (document.visibilityState !== 'visible' || !ok) return;
    let v = null; try { v = await dbGet(`k/${me.C}/${me.no}/${me.pin}/in`); } catch (e) { return; }
    const fresh = Object.entries(v || {}).map(([id, s]) => [id, dec(s)]).filter(([id, x]) => x && ['prep', 'give', 'check'].includes(x.kind) && !(known[id] && known[id].t === x.t));
    if (fresh.length && root.dataset.home === tok && location.hash === '#/me') { clearInterval(tick); homeView(root); }
  }, 30000);
}

// ── 오늘 단원 점검(옛 이름 '준비 다리') ──
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
    draw(root, { prompt: it.snap.prompt, choices: it.snap.choices, tag: '오늘 단원 점검', act: 'chk', dots: [asked(S), -(S.budget || PREP.budget)], onAnswer: (a, cf, ms) => {
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
    const okAll = S.sheets.reduce((n, sh) => n + Object.values(S.res[sh.id].me.it).filter((r) => r && r.s === 'ok').length, 0), askedN = asked(S);
    const okLine = askedN ? `<p class="okline">${askedN}문제 중 <b>${okAll}개</b> 맞혔어요.</p>` : '';   /* 끝 화면에 결과 한 줄(사실만 · 11-07) */
    const calLine = cal.sure ? `<p>'자신 있어요'라고 한 문제 ${cal.sure}개 가운데 ${sw ? `<b>${sw}개</b>는 틀렸어요 — ${swFix ? '그 문제를 배울 때 꼭 다시 봐요.' : "다음엔 '자신 있어요'를 고르기 전에 한 번 더 살펴봐요."}` : '모두 맞았어요. 내 짐작을 믿어도 돼요.'}</p>` : '';
    const fix = sum.fix.slice().sort(byGrade), stuck = Object.values(sum.rep.L).filter((x) => x.st === 'stuck' && S.plan.below.includes(x.c)).map((x) => x.c).sort(byGrade);
    let head, acts;
    if (S.why === 'teacher') {
      head = say('think', `오늘은 여기까지 할게요. 어려운 문제가 몇 개 있어요 — 괜찮아요.<br><b>선생님과 같이</b> 하나씩 풀어요. 손을 들고 선생님께 이 화면을 보여 주세요.`);
      acts = `<div class="panel"><p class="small muted">선생님과 같이 볼 문제</p><ul>${[...new Set([...fix, ...stuck])].slice(0, 3).map((c) => `<li><b>${esc(plank(c))}</b></li>`).join('')}</ul>${fix.length ? '<p class="small">선생님을 기다리는 동안 튼튼이랑 맨 위 문제부터 먼저 해 볼 수 있어요.</p>' : '<p class="small muted">다음 시간에 이어서 찾아요.</p>'}</div><div class="acts">${fix.length ? `<a class="btn pri big" href="#/fix/${fix[0]}">튼튼이랑 먼저 해 보기</a>` : ''}<a class="btn big${fix.length ? '' : ' pri'}" href="#/me">처음 화면으로</a></div>`;   /* 다음에 누를 것 하나를 주황으로(가상 첫 시범 11-07) */
    } else if (fix.length) {
      head = say('fix', `어디서부터 배우면 될지 찾았어요: <b>${esc(plank(fix[0]))}</b>.<br>${inClass ? '지금 튼튼이랑 하나 배우고, 그다음 선생님 수업으로 가요.' : '지금 튼튼이랑 배워 볼까요?'}${fix.length > 1 ? `<br><span class="small">배울 것이 ${fix.length - 1}개 더 있어요 — 처음 화면 2번에서 하나씩 해요.</span>` : ''}`);
      acts = `<div class="acts"><a class="btn pri big" href="#/fix/${fix[0]}">배우러 가기</a><a class="btn big" href="#/me">처음 화면으로</a></div>`;
    } else if (sum.shaky.length) {
      head = say('think', `거의 다 알아요! <b>${names(sum.shaky)}</b>${eun(sum.shaky)} 가끔 틀려요.<br>시간 될 때 한 번 더 연습하고, 지금은 ${inClass ? '선생님 수업으로' : '처음 화면으로'} 가요!`);
      acts = `<div class="acts"><a class="btn big" href="#/fix/${sum.shaky.sort(byGrade)[0]}">다시 연습하기</a><a class="btn big" href="#/me">처음 화면으로</a></div>`;
    } else if (S.why === 'budget') {
      head = say('think', `오늘은 여기까지 했어요(${sum.n}문제). 다음 시간에 멈춘 곳부터 이어서 해요.${inClass ? ' 지금은 선생님 수업으로 가요!' : ''}`);
      acts = '<div class="acts"><a class="btn big" href="#/me">처음 화면으로</a></div>';
    } else {
      head = say('cheer', `<b>${esc(unitLabel(unit))}</b>에 꼭 필요한 것을 다 알고 있어요! ${inClass ? '이제 선생님 수업으로 가요.' : ''}`);
      acts = '<div class="acts"><a class="btn big" href="#/me">처음 화면으로</a></div>';
    }
    root.innerHTML = `<div class="card msg act-prep"><p class="eyebrow">${tile('chk', 22)}오늘 단원 점검</p>${head}${S.why === 'teacher' ? '' : okLine + calLine}${acts}</div>`;
  };
  if (!asked(S) && !S.done) {
    root.innerHTML = `<div class="card msg act-prep"><p class="eyebrow">${tile('chk', 22)}오늘 단원 점검</p>${sayArt('chk', `<b>${esc(unitLabel(unit))}</b> 배우기 전에, 꼭 필요한 앞 문제를 알고 있는지 볼게요(${S.prior ? '지난번에 멈춘 곳부터 · ' : ''}약 ${mins(S.budget)}분).<br>답을 쓰고, <b>얼마나 자신 있는지</b> 단추를 눌러 내요. 모르면 넘어가도 돼요.`, 104)}<div class="acts"><button class="pri big" id="s">시작</button></div></div>`;
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
  const FK = `tt.fx.${me.C}.${me.no}`, fx0 = lsGet(FK, null);
  const resume = fx0 && fx0.c === c && Date.now() - fx0.t < 3 * 3600e3 && ['together', 'solo', 'check'].includes(fx0.phase) ? fx0 : null;
  const F = newFix({ c, id: resume ? resume.id : rand(6) });
  if (resume) jumpTo(F, resume.phase);   /* 3시간 안에 다시 오면 나갔던 걸음부터 */
  const ct0 = classTask(K), inClass = !!(ct0 && Date.now() - ct0.t < 3 * 3600e3);   /* 수업 중(연 뒤 3시간)만 — 저녁 집에서는 보통 끝 화면(회귀 10-31) */
  KS.setNow(me, { mode: 'fix', c });
  const head = (pose, t) => say(pose, t, 64);
  const PH = [['show', '튼튼이가 먼저'], ['together', '같이 풀기'], ['solo', '혼자 풀기'], ['check', '확인 3문제']];
  const bar = () => { const k = PH.findIndex(([p]) => p === F.phase); return k < 0 ? '' : `<div class="fx-top"><p class="fx-t">${tile('fix', 20)}<b>배우기</b></p><ol class="sb-steps fx-steps" aria-label="배우기 걸음">${PH.map(([, t], i) => `<li class="${i === k ? 'now' : i < k ? 'done' : ''}"${i === k ? ' aria-current="step"' : ''}>${i < k ? '<i>✓</i>' : ''}${t}</li>`).join('')}</ol></div>`; };   /* 화면 이름 '배우기'만(예시 문제를 붙이면 바로 아래 문제와 두 문제로 읽히고 '작은 수 · 큰 수'처럼 어긋나 보임 · 11-07 처음 보는 눈) · 걸음 칩엔 숫자 없음(풀이 순서 번호와 겹치지 않게 · 11-07 처음 쓰는 아이) */
  // 화면 틀(docs/ui.md 2차) — 걸음 칩은 위 · 왼쪽(시범 · 모형 · 단계 · 문제) · 오른쪽(튼튼이 말 · 할 일) · 좁으면 튼튼이 말이 맨 위
  //  shell(말, 왼쪽, 오른쪽 아래) → #b(.still — 왼쪽이 시범 · 비교처럼 위에서부터 읽는 것이라 오른쪽 판도 위로) · slot() → 문제 카드 자리(draw에 lead로 튼튼이 말을 넘김 · 오른쪽 판은 문제와 같은 높이 가운데)
  const shell = (top, main, side = '') => { root.innerHTML = `<div class="card fx">${bar()}<div id="b"><div class="qcard still"><div class="qgrid"><div class="qmain">${main}</div><div class="qside"><div class="qlead">${top}</div>${side}</div></div></div></div></div>`; return root.querySelector('#b'); };
  const slot = () => { root.innerHTML = `<div class="card fx">${bar()}<div id="b"><div id="slot"></div></div></div>`; return root.querySelector('#slot'); };
  const nextAct = (label, id = 'n') => `<div class="qact"><button class="pri big" id="${id}">${label}</button></div>`;
  // 시범(11-05 교사 '배치가 어색' — 세 칸 · 오른쪽 아래가 빔) — 위: 문제 · 가운데: 세로셈(덧셈 · 뺄셈 자리 계산) 또는 단계 식 · 옆: 모형 · 아래: 튼튼이 말 한 단계 + [다음]
  //  세로셈은 지금 단계의 자리에 띠 · 바뀐 숫자에 빗금 + 지금 값(model.js colView) · 단계가 없는 칸은 위: 문제(+ 보기) · 아래: 그 문제 숫자로 한 말
  //  좁으면 문제 → 세로셈 → 말 + 단추 → 모형 차례로 한 줄(단추가 늘 손 닿는 자리에)
  const stage = ({ top, mid = '', side = '', pose = 'point', talk, act }) => {
    const cls = ['fxs', mid ? '' : 'nomid', side ? '' : 'one'].filter(Boolean).join(' ');
    root.innerHTML = `<div class="card fx">${bar()}<div id="b"><div class="${cls}"><div class="fxs-q">${top}</div>${mid ? `<div class="fxs-mid">${mid}</div>` : ''}${side ? `<div class="fxs-side">${side}</div>` : ''}<div class="fxs-say">${say(pose, talk, 64)}${act}</div></div></div></div>`;
    const b = root.querySelector('#b'); b.querySelector('#n').addEventListener('click', () => { showNext(F); route(); });
    { const bub = b.querySelector('.fxs-say .bub'); if (bub) speakButton(bub); }   /* 튼튼이 말 읽어 주기(글 읽기가 느린 아이 · 도움 사다리와 같은 단추 · 11-07) */
    return b;
  };
  function show() {
    const n = showLen(F), done = F.si >= n, has = F.steps.length > 0, md = tenFrameHTML(F.ex, { moved: has && F.si >= F.steps.length - 1, anim: has && F.si === F.steps.length - 1 }) || regroupHTML(F.ex, { pre: F.si === 0, anim: F.si === 1 });   /* 한 자리 10 만들기 · 10에서 빼기는 10칸 틀(둘째 단계에서 옮기는 모습 한 번) · 받아올림 · 받아내림은 첫 단계에서 묶음 바꾸기 한 번(docs/motion.md ① ②) */
    const fin = done ? `<p class="fxa">${picAns(F.ex) ? '그래서 답은 ✓ 표시한 보기예요.' : ansSay(F.ex, '그래서 답은')}</p>` : '';
    const choices = F.ex.choices ? `<div class="choices static">${F.ex.choices.map((ch, k) => `<button type="button" disabled class="${done && String(k) === String(F.ex.sol[0]) ? 'right' : ''}">${staticHTML(ch, null)}</button>`).join('')}</div>` : '';   /* 고르기 문제는 단계가 있어도 보기를 보임(11-07 — '가장 큰 수를 고르세요'만 있고 고를 수가 없던 것) */
    if (has) {
      const C = colOf(F.ex, F.steps), st = F.si ? F.steps[F.si - 1] : null, v = C ? colView(C, F.si, F.si === 1 ? rgLag(F.ex) : null) : null;   /* 묶음 바꾸기와 같은 때에 빗금 · 위 숫자 */
      const mid = v ? v.html : F.si ? `<ol class="steps eq">${F.steps.slice(0, F.si).map((x, i) => stepHTML(x, { cls: i === F.si - 1 ? 'now' : '', why: false })).join('')}</ol>` : '';
      const talk = st ? `<p>${esc(st.why).replace(/(\d) ([+−×÷=]) (?=\d)/g, '$1\u00a0$2\u00a0')}</p>${v ? `<p class="fxe">${staticHTML(st.prompt, st.sol)}${v.lead0 ? '<span class="small">맨 앞자리의 0은 쓰지 않아요.</span>' : ''}${done ? `<span class="fxa">${ansSay(F.ex, '그래서 답은')}</span>` : ''}</p>` : fin}`
        : `<p>튼튼이가 먼저 풀어 볼게요. ${C ? '일의 자리부터 한 자리씩 계산해요.' : '한 단계씩 풀면서 생각을 말할게요.'}</p>`;
      const plan = planHTML(F.steps, planNames(F.ex.c || c, F.ex.p, F.steps), done ? F.steps.length : F.si - 1);   /* 풀이 순서 — 처음부터 전체 순서를 보여 주고 지금 단계를 짚음(교사 11-07 '단계적으로 하나씩') */
      stage({ top: `${staticHTML(F.ex.prompt, done ? F.ex.sol : null)}${choices}`, mid: mid || '<span class="fxs-ph" aria-hidden="true"></span>', side: `${md}${plan}`, talk,   /* 첫 화면에도 가운데 자리를 비워 둠(문제가 가운데 → 왼쪽 위로 튀던 것 · 11-07) */ act: nextAct(done ? '이제 같이 풀어요' : F.si ? '다음 단계' : '첫 단계 보기') });
      return;
    }
    const nb = F.ex.choices ? 0 : blankCount(F.ex.prompt);
    const vals = F.ex.choices ? null : F.ex.sol.map((x, i) => (i < F.si ? x : null));
    const say1 = F.si ? [...showTalk(F), ...(nb >= 2 ? Array.from({ length: F.si }, (_, i) => blankTalk(F.ex, i)).filter(Boolean) : [])] : [];
    const talk = say1.length ? `${say1.map((x) => `<p>${esc(x)}</p>`).join('')}${fin}` : done ? fin : '<p>튼튼이가 먼저 풀어 볼게요. 생각을 말하면서 풀게요.</p>';
    stage({ top: `${staticHTML(F.ex.prompt, vals)}${choices}`, side: md, talk, act: nextAct(done ? '이제 같이 풀어요' : F.si ? '다음' : '튼튼이 생각 보기') });
  }
  // 함께 — 단계 빈칸을 아이가(단계 있는 칸) · 튼튼이가 일부를 해 주고 아이는 한 곳만(단계 없는 칸)
  function together() {
    if (F.assist) return assist();
    const st = F.curSteps[F.si];
    if (!st) {   // 단계 다 함 → 원래 문제
      draw(slot(), { lead: head('think', '단계를 다 했어요. 이제 처음 문제의 답을 써요.') + planHTML(F.curSteps, planNames(F.cur.c || c, F.cur.p, F.curSteps), F.curSteps.length), prompt: F.cur.prompt, choices: F.cur.choices, conf: false, idk: false, extra: stepCtx(F.cur, F.curSteps, F.curSteps.length, { C: colFor(F.cur, F.curSteps), head: false, fresh: F.curSteps.length - 1 }), onAnswer: (a) => { const it0 = F.cur; const r = answerItem(F, a.vals, a.raws); feedback({ ...r, it0, how: 'steps' }, route); } });
      return;
    }
    /* 왼쪽 위 = 같이 풀 문제 · 세로셈 · 채운 단계(도움 사다리와 같은 모양 hint.js stepCtx) · 오른쪽 튼튼이 말 = 몇 단계 · 할 일 */
    draw(slot(), { lead: head('point', `<span class="hl-k">${F.si + 1}단계</span> 이번엔 같이 풀어요. <b>${esc(st.why)}</b>`) + planHTML(F.curSteps, planNames(F.cur.c || c, F.cur.p, F.curSteps), F.si), extra: stepCtx(F.cur, F.curSteps, F.si, { C: colFor(F.cur, F.curSteps), label: '같이 풀 문제', fresh: F.si - 1 }), prompt: st.prompt, conf: false, idk: false, onAnswer: (a) => { const r = togetherStep(F, a.vals); if (r.ok) together(); else feedback({ ok: false, msg: `${ansSay({ sol: r.sol }, '이 단계의 답은')} ${esc(r.why)}` }, together); } });
  }
  function assist() {
    const A = F.assist;
    const top = A.kind === 'given' ? '이번엔 같이 풀어요. 앞 빈칸은 튼튼이가 채웠어요 — <b>마지막 빈칸</b>을 채워요.'
      : A.kind === 'pick' ? '이번엔 같이 풀어요. 튼튼이가 <b>답이 아닌 보기</b>를 지웠어요. 남은 것 중에서 골라요.'
      : A.say.length ? '이번엔 같이 풀어요. 튼튼이가 <b>첫 생각</b>을 말해 줄게요. 그다음은 내가 풀어요.' : '이번엔 같이 풀어요. 천천히 풀어 봐요 — 틀려도 튼튼이가 바로 알려 줘요.';
    draw(slot(), { lead: head('point', top), prompt: F.cur.prompt, choices: F.cur.choices, conf: false, idk: false, given: A.given, hide: A.hide, say: A.say, onAnswer: (a) => { const it0 = F.cur; const r = answerItem(F, a.vals, a.raws); feedback({ ...r, it0, how: A.kind }, route); } });
  }
  function solo() {
    if (F.reStep) return reStep();
    draw(slot(), { lead: head('hi', `이제 혼자 풀어 봐요. <span class="muted small">(맞힌 것 ${F.solo.ok} / 3)</span>`), prompt: F.cur.prompt, choices: F.cur.choices, conf: false, idk: false, onAnswer: (a) => { const it0 = F.cur; const r = answerItem(F, a.vals, a.raws); soloBack(r, it0, a); } });
  }
  // 혼자에서 틀린 뒤 — 세 번 내리 틀림이면 같이 한 번 더 / 선생님과 · 아니면 다음에 할 한 가지: 검산 도구(답 보기 전에) → 같은 숫자로 나눠 보기 → 방법 한 줄
  function soloBack(r, it0, a) {
    /* 틀리면(세 번 내리 · 선생님과가 아니면) 도움 사다리 — 떠올리기 → 한 단계씩 → 처음 문제 다시(hint.js · 교사 11-07) · 혼자 풀기 맞힌 수는 첫 답 그대로 */
    if (!r.ok && !r.back && !r.help) return ladder(slot(), { it: mkItem(it0.c || c, it0.p), c: it0.c || c, raws: a.raws, tag: '혼자 풀기', act: 'fix', onEnd: (x) => { KS.ladLog(me, K, x.how); if (x.how === 'recall' || x.how === 'steps') KS.selfFix(me, K, x.how); if (F.reStep) afterReStep(F); route(); } });
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
        const b = shell(head('think', miss == null ? `단계는 모두 맞았어요! ${esc(mergeTip(F.cur))}` : `<b>${miss + 1}번째 단계</b>에서 어긋났어요: ${esc(steps[miss].why)}`), `<ol class="steps">${steps.map((s, k) => stepHTML(s, { cls: k === miss ? 'miss' : '' })).join('')}</ol><p>처음 문제는 ${staticHTML(F.cur.prompt, F.cur.choices ? null : F.cur.sol)} ${F.cur.choices ? ansSay(F.cur) : ''}</p>`, nextAct('다음 문제'));
        b.querySelector('#n').addEventListener('click', () => { afterReStep(F); route(); });
        return;
      }
      draw(slot(), { lead: head('think', '어디서 어긋났는지 같은 숫자로 나눠서 풀어 봐요.'), extra: `${i ? `<ol class="steps">${steps.slice(0, i).map((s, k) => stepHTML(s, { cls: k === miss ? 'miss' : '' })).join('')}</ol>` : ''}<p class="stepwhy"><b>${esc(steps[i].why)}</b></p>`, prompt: steps[i].prompt, conf: false, idk: false, onAnswer: (a) => { const ok = steps[i].sol.every((s, k) => Number(a.vals[k]) === Number(s)); if (!ok && miss == null) miss = i; i++; one(); } });
    };
    one();
  }
  const fbBox = (ok) => {   /* 오른쪽 칸(문제 단추 자리)에 — 쓴 문제 칸 · 단추는 잠그고 숨김 */
    const b = root.querySelector('#b') || root;
    const box = document.createElement('div'); box.className = `fb ${ok ? 'ok' : 'no'}`;
    b.querySelectorAll('.qcard button, .qcard input').forEach((x) => (x.disabled = true));
    fbSlot(b).appendChild(box);
    return box;
  };
  const nextBtn = (box, then) => { const btn = document.createElement('button'); btn.className = 'pri'; btn.textContent = '다음'; box.appendChild(btn); btn.focus(); btn.addEventListener('click', then); };
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
    draw(slot(), { lead: head('point', F.extra && F.ci >= FIX.check ? '거의 다 됐어요! <b>한 문제만 더</b> — 새 숫자예요. 맞히면 통과해요.' : '마지막! 새 숫자 3문제를 <b>도움 없이</b> 풀어요. 답을 쓰고 자신 있는 만큼 단추를 눌러요.'), prompt: it.snap.prompt, choices: it.snap.choices, tag: '확인', act: 'fix', dots: [F.ci, F.check.items.length], onAnswer: (a, cf, ms) => { answerCheck(F, a, { conf: cf, ms }); route(); } });
  }
  function done() {
    const now = Date.now();
    if (F.check) { F.check.unit = K.lastPrep ? K.lastPrep.unit : null; KS.addSheet(me, K, F.check, F.R, F.conf, F.ms); }
    const okN = Object.values(F.R.it).filter((x) => x.s === 'ok').length;
    if (F.passed) { K.mx = K.mx || {}; grantAccurate(K.mx, c); KS.pushMastery(me, K); K.fixed = K.fixed || {}; K.fixed[c] = now; K.rv[c] = { n: 0, due: now + KS.REVIEW_DAYS[0] * KS.DAY, t: now }; if (K.help) delete K.help[c]; if (K.firm) delete K.firm[c]; }
    else { K.help = K.help || {}; K.help[c] = now; K.helpWhy = { ...(K.helpWhy || {}), [c]: F.help ? 'solo' : 'check' }; }   /* 'solo' = 혼자에서 세 번씩 두 번 내리 틀려 확인 없이 끝 · 'check' = 확인 3문제를 못 넘음(메인이 요약에 넣을 값) */
    KS.save(me, K); KS.setReview(me, K); KS.pushSummary(me, K); KS.setNow(me, { mode: 'home' });
    const ex = plank(c);
    const endCard = (top, body) => { root.innerHTML = `<div class="card msg act-fix"><p class="eyebrow">${tile('fix', 22)}배우기</p>${top}${body}</div>`; };
    if (F.help) {   // 혼자에서 세 번씩 두 번 내리 틀림 — 확인 문제 없이 선생님과(혹평 4)
      endCard(say('think', `오늘은 여기까지 해요. 이 문제는 <b>선생님과 같이</b> 풀어요.<br>손을 들고 선생님께 이 화면을 보여 주세요.`, 104),
        `<div class="panel"><p class="small muted">선생님과 같이 볼 문제</p><p><b>${esc(ex)}</b></p></div><div class="acts"><a class="btn big" href="#/me">처음 화면으로</a></div>`);
      return;
    }
    const was = before && before.tot ? ` 처음엔 ${before.tot}문제 중 ${before.ok}개 맞혔어요.` : '';
    const retry = F.passed && K.back && K.back.root === c && !K.back.solved;
    const top = F.passed ? say('cheer', `<b>${esc(ex)}</b> — ${F.extra ? `확인 ${F.check.items.length}문제 중 ${okN}개를 맞혀 통과했어요.` : `확인 ${F.check.items.length}문제를 모두 맞혔어요.`}${was}<br>${inClass ? '이제 <b>선생님 수업</b>으로 가요. 남은 것은 다음 시간에 해요.' : '며칠 뒤 매일 연습에 한 번 더 나와요.'}`, 104)
      : say('think', `확인 ${F.check.items.length}문제 중 ${okN}개 맞혔어요. 선생님과 같이 한 번 더 봐요.${inClass ? '<br>지금은 선생님 수업으로 가요.' : ''}`, 104);
    endCard(top, `<div class="acts">${retry ? `<a class="btn pri big" href="#/retry">처음 문제 다시 풀기 — ${esc(K.back.text)}</a>` : `<a class="btn ${inClass ? '' : 'pri '}big" href="#/me">처음 화면으로</a>`}</div>`);
  }
  // 비교하기 — 함께 풀기 뒤, 혼자 풀기 전에 한 번(맞는 풀이 · 친구 같은 틀린 풀이 · 어디서 어긋났나)
  function compare(X) {
    const A = X.rightFirst ? X.it.sol : X.wrong, B = X.rightFirst ? X.wrong : X.it.sol;
    const b = shell(head('think', '친구 둘이 같은 문제를 풀었어요. <b>누가 맞았을까요?</b>'), `<div class="cmp">
      <button type="button" class="cmpc" data-w="${X.rightFirst ? 1 : 0}"><span class="who2">가 친구</span>${staticHTML(X.rightFirst ? X.it.prompt : (X.wrongPrompt || X.it.prompt), A)}</button>
      <button type="button" class="cmpc" data-w="${X.rightFirst ? 0 : 1}"><span class="who2">나 친구</span>${staticHTML(X.rightFirst ? (X.wrongPrompt || X.it.prompt) : X.it.prompt, B)}</button></div>`);
    /* 고른 뒤 왼쪽에 두 풀이를 그대로 두고 맞음 ✓ · 어긋남 ✕ 표시(오른쪽에서 까닭을 고르는 동안 볼 수 있게) */
    const cmpStatic = () => `<div class="cmp">${[0, 1].map((k) => { const right = X.rightFirst ? k === 0 : k === 1; return `<div class="cmpc ${right ? 'right' : 'no'}"><span class="who2">${k ? '나' : '가'} 친구 <span class="mk">${right ? '✓ 맞음' : '✕ 어긋남'}</span></span>${staticHTML(right ? X.it.prompt : (X.wrongPrompt || X.it.prompt), right ? X.it.sol : X.wrong)}</div>`; }).join('')}</div>`;
    b.querySelectorAll('.cmpc').forEach((btn) => btn.addEventListener('click', () => why(btn.dataset.w === '1')));
    // 도구로 확인 — 친구의 틀린 답에 검산 도구를 써 봄(처음 배우는 자리) → 그다음 어디서 어긋났나
    let T = null; try { T = toolFor({ it: mkItem(X.it.c, X.it.p), vals: X.wrong, c, bug: X.bug }); } catch (e) { T = null; }
    function why(gotIt) {
      if (T && !why.shown) {
        why.shown = true;
        const w = X.wrongText || X.wrong.join(', '), bt = shell(head(gotIt ? 'cheer' : 'think', `${gotIt ? '맞아요! ' : '다시 봐요. '}${X.rightFirst ? '나' : '가'} 친구가 쓴 ${esc(w)}${P(w, '이', '가')} 맞는지 <b>${esc(T.ro)}</b> 확인해 볼까요?<br><span class="small">${esc(T.how)}</span>`), `${cmpStatic()}<div class="panel"><p class="tcheck">${icon('search', 22)} ${T.html}</p></div>`, nextAct('그럼 어디서 어긋났을까?', 'n3'));
        bt.querySelector('#n3').addEventListener('click', () => why(gotIt));
        return;
      }
      const w2 = X.wrongText || X.wrong.join(', '), b2 = shell(head(gotIt ? 'cheer' : 'think', `${gotIt ? '맞아요! ' : '다시 봐요. '}맞게 푼 건 ${staticHTML(X.it.prompt, X.it.sol)} 이에요.<br>그럼 <b>${esc(w2)}</b>${P(w2, '이라고', '라고')} 쓴 친구는 <b>어디서 어긋났을까요?</b>`), cmpStatic(), `<div class="rsn">${X.reasons.map((t, i) => `<button type="button" class="rs" data-i="${i}">${esc(t)}</button>`).join('')}</div>`);
      b2.querySelectorAll('.rs').forEach((btn) => btn.addEventListener('click', () => {
        const ok = X.reasons[Number(btn.dataset.i)] === X.right;
        const st = stepsOf({ c: X.it.c, p: X.it.p });
        if (T) KS.learnTool(me, K, T.tool);
        shell(head(ok ? 'cheer' : 'point', `${ok ? '맞아요! ' : '아쉬워요. '}틀린 친구는 <b>${esc(X.right)}</b>. 그래서 ${esc(w2)}${P(w2, '이', '가')} 나왔어요.${T ? `<br>${icon('search', 18)} <b>${esc(T.name)}</b> — 내 답도 이렇게 확인해 봐요.` : ''}`), st.length ? `<p class="small muted">바르게 풀면 이렇게 이어져요</p><ol class="steps">${st.map((x) => stepHTML(x)).join('')}</ol>` : cmpStatic(), nextAct('이제 혼자 풀어요', 'n2'));
        root.querySelector('#n2').addEventListener('click', route);
      }));
    }
  }
  const prefer = before && before.why ? [...before.why.sure, ...before.why.maybe].map((h) => h.id) : [];
  function route() {
    if (F.phase === 'done') lsDel(FK); else lsSet(FK, { c, id: F.id, phase: F.phase, t: Date.now() });   /* 지금 걸음 적어 두기(이어서 하기) */
    if (F.phase === 'solo' && !F.compared && F.solo.n === 0 && !F.reStep) { F.compared = true; const X = compareOf(c, { prefer }); if (X) return compare(X); }
    ({ show, together, solo, check, done })[F.phase]();
  }
  route();
}

// ── 다시 보기 — 오늘의 구보에 들어 있음(다시 볼 날이 된 판자를 먼저 · run.js) · 예전 주소는 구보로 ──
export function reviewView() { go('#/run'); }
