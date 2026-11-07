// 오늘 단원 준비 다리 — 기기에서 도는 적응형 점검(화면과 상관없는 순수 로직 · node에서 그대로 시험)
//  근거(docs/evidence.md): 바로 아래 칸부터 묻고, 막히면 그 아래 칸들을 반씩 갈라 가운데 칸을 물어 좁힌다(지식 공간 이론 [A-R3][A-R4])
//  판정은 종이 점검과 같은 엔진(paper/js/judge.js kidReport) — 묶음 · 결과 꼴도 종이와 같다(그래서 종이 결과와 섞어 볼 수 있음)
//  세션 S = { v, id, unit, made, sheets:[묶음], res:{ 묶음 id: { me: 결과 } }, at:{ sheet, i }, conf:{ 묶음 id: { k: 0|1|2 } }, ms:{…}, done, why, prior }
//    결과 꼴(종이와 같음): { done:{ 장: true }, it:{ k:{ s:'x'|'q'|'ok', a:[답] } } }
//    prior = 이 아이의 지난 묶음 · 결과(14일 안) — 함께 판정해서 어제 멈춘 곳부터 이어 간다
import { NODES, byId, allPre } from '../../engine/lessons/index.js';
import { makeSheet, closure, LES, itemOf } from '../../paper/js/gen.js';
import { kidReport } from '../../paper/js/judge.js';
import { mindsOf, wantFor } from '../../engine/mis.js';

//  한 판 = 선생님이 고른 길이(기본 18문제 · 약 8분 · 교사 11-05 '36개면 애들이 지치려나' → 길게 36 없앰 · 12 · 18 · 24) · 못 찾으면 다음 시간에 지난 기록(14일)과 함께 이어서
//  첫 묶음은 바깥 칸 넷까지(12문제) · 그다음 묶음은 칸 셋까지(9문제) — 묶음이 작을수록 막힌 곳 아래로 빨리 내려감
//  서로 다른 뿌리의 막힌 칸이 넷 이상이면 일찍 멈추고 '선생님과 같이'(why 'teacher') · 한 판을 다 묻고도 막힌 칸 넷 이상인데 못 좁혔어도 — 틀리는 문제만 이어 풀게 두지 않음
export const PREP = { n: 3, first: 4, cap: 3, budget: 18, rounds: 8, fresh: 14, stuck: 4 };
// 한 판 길이 — 선생님이 단원을 열 때 고름(짧게 12 · 약 5분 / 보통 18 · 약 8분 / 길게 24 · 약 10분 · 11-05) · 모의 숫자는 app/test/prep.sim.mjs 끝 주석
export const LEN = [12, 18, 24];
const KID = 'me', DAY = 864e5;
const gi = (c) => { const x = LES(c); return x ? Number(x.g[0]) * 10 + Number(x.g[2]) : 99; };
const SEEN = new Set(['ok', 'pass', 'near', 'stuck', 'shaky']);

// 단원 → 준비 칸(단원 밖 선수 차시) · 가장 바깥 칸(다른 준비 칸 아래에 들지 않는 것 — 이것을 맞히면 그 아래는 '관문 통과')
export function prepPlan(unitId) {
  const own = NODES.filter((n) => n.u === unitId).map((n) => n.id);
  const ownS = new Set(own);
  const pre = new Set();
  for (const c of own) for (const p of allPre(c)) if (!ownS.has(p)) pre.add(p);
  const below = new Set();
  for (const p of pre) for (const q of closure(p)) if (!ownS.has(q)) below.add(q);
  const fringe = [...pre].filter((p) => ![...pre].some((q) => q !== p && closure(q).has(p))).sort((a, b) => gi(b) - gi(a));
  return { unit: unitId, own, pre: [...pre], fringe, below: [...below] };
}

const allSheets = (S) => [...(S.prior ? S.prior.sheets : []), ...S.sheets];
const allRes = (S) => ({ ...(S.prior ? S.prior.res : {}), ...S.res });
export const report = (S) => kidReport(allSheets(S), allRes(S), KID, { from: '1-1', to: '6-2' });

// prior = { sheets, res } — res[묶음 id] = { me: 결과 } · 오래된 것(14일 넘음)은 뺀다
export function newPrep({ unit, id, now = Date.now(), prior = null, budget = null }) {
  const P = prepPlan(unit);
  const keep = prior ? prior.sheets.filter((sh) => now - sh.made < PREP.fresh * DAY && prior.res[sh.id]) : [];
  const S = { v: 1, id, unit, made: now, budget: LEN.includes(Number(budget)) ? Number(budget) : PREP.budget, sheets: [], res: {}, conf: {}, ms: {}, at: null, done: false, why: '', plan: { fringe: P.fringe, below: P.below },
    prior: keep.length ? { sheets: keep, res: Object.fromEntries(keep.map((sh) => [sh.id, prior.res[sh.id]])) } : null };
  if (!P.fringe.length) return finish(S, 'none');
  const rep = S.prior ? report(S) : null;
  const first = P.fringe.filter((c) => !(rep && rep.L[c] && SEEN.has(rep.L[c].st) && rep.L[c].st !== 'shaky'));
  if (!first.length) { advance(S); return S; }   // 바깥 칸은 지난번에 다 봤음 — 이어서(막힌 곳 아래로)
  push(S, first.slice(0, Math.min(PREP.first, Math.floor(S.budget / PREP.n))).map(probe), 'prep');
  return S;
}
const probe = (c) => ({ c, n: PREP.n, gate: true, covers: [...closure(c)] });   // 묻는 칸은 모두 관문 — 맞히면 그 아래 전부 '관문 통과'
function push(S, lessons, kind) {
  const sh = makeSheet({ kind, words: false, id: `${S.id}-${S.sheets.length}`, lessons, mixed: true });
  sh.items = sh.items.filter((it) => it.ch !== 'END'); sh.chapters = sh.chapters.filter((c) => c.key !== 'END');   // 종이용 '맨 끝 쉬운 두 문제'는 기기에선 뺀다
  sh.items.forEach((it, i) => (it.k = i + 1));
  if (!sh.items.length) return false;
  S.sheets.push(sh); S.res[sh.id] = { [KID]: { done: {}, it: {} } }; S.at = { sheet: sh.id, i: 0 };
  return true;
}
function finish(S, why) { S.done = true; S.at = null; S.why = why; return S; }

export const curSheet = (S) => S.at && S.sheets.find((s) => s.id === S.at.sheet);
export function current(S) { const sh = curSheet(S); return sh && !S.done ? sh.items[S.at.i] || null : null; }
export const asked = (S) => S.sheets.reduce((n, sh) => n + Object.keys(S.res[sh.id][KID].it).length, 0);

// 한 문항 답 — a = { vals:[…], raws:[…] } 또는 { idk:true } · conf = 0 모름 · 1 조금 · 2 확실 (풀기 전에 고른 것)
export function answer(S, a, { conf = null, ms = 0 } = {}) {
  const sh = curSheet(S), it = current(S); if (!it) return null;
  const R = S.res[sh.id][KID];
  let ok = false, res = null;
  if (a.idk) R.it[it.k] = { s: 'q' };
  else {
    const raws = a.raws || a.vals.map(String);
    try { res = itemOf(it.c, it.p).check(a.vals, raws); } catch (e) { res = { ok: false }; }
    ok = !!(res && res.ok);
    R.it[it.k] = ok ? { s: 'ok' } : { s: 'x', a: raws };
  }
  if (conf != null) (S.conf[sh.id] = S.conf[sh.id] || {})[it.k] = conf;
  if (ms) (S.ms[sh.id] = S.ms[sh.id] || {})[it.k] = ms;
  S.at.i++;
  if (S.at.i >= sh.items.length) { sh.chapters.forEach((c) => (R.done[c.key] = true)); advance(S); }
  return { ok, k: it.k, c: it.c, bug: res && res.bug ? res.bug : null };
}

// 다음에 물을 칸 — ① 다시 볼 것(흔들림 · 두 원인이 같은 답 · 고립 · 도움 받은 관문) ② 막혔는데 아래를 다 모르는 칸마다 반 가르기 한 칸
export function nextLessons(rep, plan = null) {
  const L = rep.L;
  const again = rep.checkList.filter((c) => byId[c] && L[c] && (L[c].st === 'shaky' || (L[c].amb && L[c].st !== 'ok') || (L[c].gate && L[c].st === 'near' && L[c].help)));
  rep.iso.forEach((x) => { if (!again.includes(x.c)) again.push(x.c); });
  // 반 가르기 — 막힌 칸마다 따로 묻지 않고, 여러 갈래를 한꺼번에 반으로 가르는 칸을 고름(깊은 빈 곳 하나가 위 칸 여럿을 막는 일이 흔함 → 뿌리는 대개 하나)
  //  칸 m의 점수 = m을 품은 갈래마다 (m 아래가 그 갈래 후보의 절반에 가까운 정도)의 합 · 고른 칸이 품은 갈래는 빼고 다음 칸 · 한 묶음 cap칸까지
  //  막힌 칸마다 따로 물을 때보다 하루 한 판에 찾는 비율 74 → 86% · 문항 27 → 24 · 이틀 97 → 98%(app/test/prep.sim.mjs · 10-31 · 한 판 36문항 때)
  const probes = [], seen = (c) => L[c] && SEEN.has(L[c].st);
  let B = rep.below.filter((b) => !plan || plan.includes(b.c)).map((b) => ({ c: b.c, U: new Set([...closure(b.c)].filter((c) => c !== b.c && byId[c] && !seen(c))) })).filter((b) => b.U.size);
  while (B.length && probes.length < PREP.cap) {
    let best = null, bs = -1;
    for (const m of new Set(B.flatMap((b) => [...b.U]))) {
      if (again.includes(m) || probes.includes(m)) continue;
      const cm = closure(m); let q = gi(m) / 1000;
      for (const b of B) if (b.U.has(m)) q += 1 - Math.abs((2 * [...b.U].filter((c) => cm.has(c)).length) / b.U.size - 1);
      if (q > bs) { bs = q; best = m; }
    }
    if (!best) break;
    probes.push(best); B = B.filter((b) => !b.U.has(best));
  }
  return { again: (plan ? again.filter((c) => plan.includes(c)) : again).sort((a, b) => gi(b) - gi(a)), probes };
}
// 이 판에서 물은 칸 가운데 막힌 칸 수(지난 기록의 막힘은 세지 않음 — 다음 시간에 이어 갈 때 곧바로 멈추지 않게)
export const stuckHere = (S, rep = report(S)) => [...new Set(S.sheets.flatMap((sh) => sh.items.map((it) => it.c)))].filter((c) => rep.L[c] && rep.L[c].st === 'stuck').length;
// 막힌 칸이 여럿이어도 뿌리 하나로 설명되면(모두의 아래에 함께 있는 아직 모르는 칸 · 또는 모두의 아래에 있는 막힌 칸) 계속 좁힘 — 빈 곳 하나인 아이가 '선생님과 같이'로 멈추던 것(회귀 10-31)
export function manyRoots(S, rep = report(S)) {
  const st = [...new Set(S.sheets.flatMap((sh) => sh.items.map((it) => it.c)))].filter((c) => rep.L[c] && rep.L[c].st === 'stuck');
  if (st.length < PREP.stuck) return false;
  if (st.some((c) => st.every((o) => o === c || closure(o).has(c)))) return false;
  const seen = (c) => rep.L[c] && SEEN.has(rep.L[c].st);
  const sets = st.map((c) => new Set([...closure(c)].filter((d) => d !== c && byId[d] && !seen(d))));
  return ![...sets[0]].some((d) => sets.every((x) => x.has(d)));
}
// 이 판에서 그 칸을 몇 묶음에서 물었나 — 다시 묻기는 한 번까지(같은 꼴로 늘 틀리면 판정에 맡김)
const timesAsked = (S, c) => S.sheets.filter((sh) => sh.items.some((it) => it.c === c)).length;
function advance(S) {
  for (let guard = 0; guard < 4; guard++) {
    const left = (S.budget || PREP.budget) - asked(S);
    if (left < PREP.n) { const r0 = report(S); return finish(S, stuckHere(S, r0) >= PREP.stuck + 2 && !r0.start.some((x) => S.plan.below.includes(x.c)) ? 'teacher' : 'budget'); }   /* 다 묻고도 못 좁힌 막힌 칸 넷 이상 → 선생님과 같이 */
    if (S.sheets.length >= Math.max(PREP.rounds, Math.ceil((S.budget || PREP.budget) / PREP.n))) return finish(S, 'budget');
    const rep = report(S);
    const nx = nextLessons(rep, S.plan.below), probes = nx.probes, again = nx.again.filter((c) => timesAsked(S, c) < 2);
    // 다른 꼴로 한 번 더 — 한 번 보인 생각은 이름 대신 그 생각을 가려내는 함정 꼴 문항으로(아이는 그냥 다음 문제를 풂) [docs/mis_flow.md]
    const traps = [];
    for (const [id, e] of Object.entries(mindsOf(rep))) { if (e.s) continue; for (const c of e.c) { const want = wantFor(id, c); if (want && S.plan.below.includes(c) && timesAsked(S, c) < 2 && !traps.some((t) => t.c === c)) traps.push({ c, n: PREP.n, want, trapN: 2 }); } }
    // 오늘 고칠 판자를 찾았으면 그만 묻고 고치러 간다 — 아래를 다 메울 때까지 붙잡지 않음 [A-R16] · 남은 갈래는 다음 시간에 지난 기록과 함께 이어서
    //  이 단원 준비 칸 안에서 찾은 것만(다른 단원 기록의 고칠 판자가 오늘 점검을 막지 않게 — 코덱스 10-31)
    const inPlan = rep.start.filter((x) => S.plan.below.includes(x.c));
    if (manyRoots(S, rep) || stuckHere(S, rep) >= PREP.stuck + 2) return finish(S, 'teacher');   /* 막힌 칸 여섯이면 뿌리가 하나여도 선생님과 먼저 */   // 서로 다른 뿌리의 막힌 칸이 넷 이상 — 찾은 판자가 있어도 선생님과 먼저(찾은 판자는 끝 화면 · 홈에 그대로)
    if (inPlan.length && !again.some((c) => inPlan.some((x) => x.c === c))) return finish(S, 'found');
    if (!again.length && !probes.length && !traps.length) return finish(S, 'clear');
    const room = Math.min(PREP.cap, Math.floor(left / PREP.n));
    const take = [...probes.map(probe), ...traps.filter((t) => !again.includes(t.c)), ...again.map((c) => { const t = traps.find((x) => x.c === c); return t || { c, n: PREP.n, hyps: rep.L[c] && rep.L[c].amb }; })].slice(0, room);
    if (push(S, take, 'prep-check')) return S;
  }
  return finish(S, 'clear');
}

// 끝난 뒤 아이에게 보일 것: 고칠 판자(여기서부터) · 튼튼한 판자 · 자신감 비교하기
export function summary(S) {
  const rep = report(S);
  const inP = (c) => S.plan.below.includes(c);
  const fix = rep.start.map((s) => s.c).filter(inP), firstCheck = rep.below.map((b) => b.c).filter(inP), because = rep.under.map((u) => u.c).filter(inP);
  // 두 번 물어도 흔들림(예: 2/3 · 2/3) — '고칠 판자'로 단정하지 않고 '다지면 좋은 판자'로(코덱스 10-31)
  const shaky = Object.values(rep.L).filter((x) => x.st === 'shaky' && inP(x.c) && S.sheets.filter((sh) => sh.items.some((it) => it.c === x.c)).length >= 2).map((x) => x.c);
  const strong = Object.values(rep.L).filter((x) => x.st === 'ok' || x.st === 'pass').map((x) => x.c);
  return { rep, fix, firstCheck, because, shaky, strong, cal: calibration(S), n: asked(S), why: S.why };
}
// 자신감 비교하기 — 확실했는데 틀림(가장 센 신호 [D-1]) · 모름이었는데 맞음 · 짐작이 맞은 비율(조금 = 반)
export function calibration(S) {
  let n = 0, hit = 0, unsureRight = 0, sure = 0;
  const sureWrong = [];
  for (const sh of S.sheets) {
    const R = S.res[sh.id][KID].it, C = S.conf[sh.id] || {};
    for (const it of sh.items) {
      const r = R[it.k], c = C[it.k]; if (!r || c == null) continue;
      const ok = r.s === 'ok'; n++;
      hit += c === 1 ? 0.5 : (c === 2) === ok ? 1 : 0;
      if (c === 2) sure++;
      if (c === 2 && !ok) sureWrong.push({ c: it.c, k: it.k, sheet: sh.id });
      if (c === 0 && ok) unsureRight++;
    }
  }
  return { n, sure, match: n ? hit / n : null, sureWrong, unsureRight };
}
export { KID };
