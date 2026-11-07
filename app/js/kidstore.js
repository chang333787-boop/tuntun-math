// 아이 기록 — 이 기기 + 서버(k/<반>/<번호>/<핀>/)
//  기록 하나 = 다 푼 묶음 하나: r/<묶음 id> = { s: 짧게 싼 묶음, r: 결과, cf: 자신감, ms: 걸린 시간 }
//    묶음은 문항마다 [번호, 차시, params, 관문?, 장]만 — 문제 글은 엔진이 (차시, params)로 다시 만든다(그래서 작다)
//  st = 선생님 화면용 요약(판정 · 고칠 판자 · 확실했는데 틀림 · 다시 볼 날) — 선생님은 이것만 훑고, 자세히 볼 때만 r/ 전부
//  rv = 다시 보기 일정 { 차시: { n: 지난 다시 보기 수, due: 다음 날 } } — 고친 뒤 1 · 3 · 7일 [D-6][D-8]
import { closure, itemOf, formOf, LES } from '../../paper/js/gen.js';
import { kidReport } from '../../paper/js/judge.js';
import { mindsOf } from '../../engine/mis.js';
import { sheetOf, storySum } from './storylog.js';
import { lsGet, lsSet } from './local.js';
import * as db from './db.js';
import { weeksOf, weekKey } from './weekcore.js';

export const DAY = 864e5;
export const REVIEW_DAYS = [1, 3, 7];
const KID = 'me';

export function pack(sh) { return { id: sh.id, kind: sh.kind, made: sh.made, unit: sh.unit || null, ...(Array.isArray(sh.tr) ? { tr: sh.tr.slice(0, 2).map((v) => Number(v) || 0) } : {}), it: sh.items.map((it) => (it.form === 'w' && it.word ? [it.k, it.c, it.p, 0, it.ch, it.word.ws] : it.gate && Array.isArray(it.covers) && it.covers.length !== closure(it.c).size ? [it.k, it.c, it.p, 1, it.ch, null, it.covers] : [it.k, it.c, it.p, it.gate ? 1 : 0, it.ch])) }; }   /* 문장제(이야기 다리)는 여섯째에 이야기 seed · 일곱째 = 관문이 덮는 칸(아래 전부와 다를 때만 · 종이 관문은 구간만 덮음) */
export function unpack(o) {
  const items = [], chs = new Map();
  for (const [k, c, p, g, ch, ws, cov] of o.it) {
    if (!LES(c)) continue;
    if (ws != null) { const w = sheetOf({ id: o.id, items: [{ c, p, ws }] }).items[0]; if (!w) continue; items.push({ ...w, k, ch }); if (!chs.has(ch)) chs.set(ch, []); chs.get(ch).push(k); continue; }   /* 문장제 — form 'w'(판정이 식 · 답으로 읽음) */
    let it; try { it = itemOf(c, p); } catch (e) { continue; }
    items.push({ k, c, p, gate: !!g, covers: g ? (Array.isArray(cov) ? cov.filter((x) => typeof x === 'string' && LES(x)) : [...closure(c)]) : null, ch, form: formOf(it), cls: '', snap: { prompt: it.prompt, sol: it.sol, choices: it.choices || null } });
    if (!chs.has(ch)) chs.set(ch, []); chs.get(ch).push(k);
  }
  return { v: 1, id: o.id, kind: o.kind, made: o.made, unit: o.unit, items, chapters: [...chs].map(([key, ks]) => ({ key, ks })) };
}

const keyOf = (me) => `tt.k.${me.C}.${me.no}`;
const base = (me) => `k/${me.C}/${me.no}/${me.pin}`;
export function load(me) { return lsGet(keyOf(me), { recs: {}, rv: {}, fixed: {}, log: [] }); }
export function save(me, K) { lsSet(keyOf(me), K); }

// 서버에서 받아 이 기기와 합치기(다른 기기에서 푼 것도) — 같은 묶음이면 서버 것 그대로(묶음은 다 푼 뒤에만 올라가서 바뀌지 않음)
export async function pull(me) {
  const K = load(me);
  let srv = null;
  try { srv = await db.get(base(me)); } catch (e) { return { K, ok: false, err: e }; }
  if (srv && srv.r) for (const [id, s] of Object.entries(srv.r)) { const o = db.dec(s); if (o && !K.recs[id]) K.recs[id] = o; }
  if (srv) for (const [id, x] of Object.entries(K.recs)) if (x && x.s && x.s.src === 'paper' && !(srv.r && db.dec(srv.r[id]))) delete K.recs[id];   /* 예전에 남은 글자 "null"도 없는 것으로 */
  // 다른 기기에서 쓴 상태 되살리기 — 요약(st)의 준비 다리 끝 · 고친 판자 · 도움이 이 기기보다 새로우면(새 크롬북에서 들어오면 선생님 띠에서 사라지던 것 · 회귀 10-31)
  const st0 = srv && srv.st ? db.dec(srv.st) : null;
  if (st0 && typeof st0 === 'object') {
    const p = st0.prep; if (p && typeof p.u === 'string' && Number(p.t) > ((K.lastPrep && K.lastPrep.t) || 0)) K.lastPrep = { unit: p.u, why: String(p.why || ''), t: Number(p.t) };
    if (st0.fixed && typeof st0.fixed === 'object') { K.fixed = K.fixed || {}; for (const [c, t] of Object.entries(st0.fixed)) if (Number(t) > (K.fixed[c] || 0)) K.fixed[c] = Number(t); }
    if (Array.isArray(st0.lad)) { K.lad = K.lad || {}; for (const v of st0.lad) { if (!Array.isArray(v) || typeof v[0] !== 'string') continue; const a = (K.lad[v[0]] = K.lad[v[0]] || {}); ['r', 's', 'x', 'p'].forEach((k, i) => { const n = Number(v[i + 1]) || 0; if (n > (a[k] || 0)) a[k] = n; }); } }   /* 새 기기에서 빈 기록으로 덮어쓰던 것(코덱스 11-07) — 주마다 칸별 큰 값 */
    if (st0.help && typeof st0.help === 'object') { K.help = K.help || {}; for (const [c, n] of Object.entries(st0.help)) if (Number(n) > (K.help[c] || 0)) K.help[c] = Number(n); }
  }   /* 선생님이 뺀 종이 기록(번호를 잘못 골랐을 때) — 종이 기록은 서버가 정본 */
  if (srv && srv.rv) { const rv = db.dec(srv.rv); if (rv) for (const [c, x] of Object.entries(rv)) if (!K.rv[c] || (x.t || 0) > (K.rv[c].t || 0)) K.rv[c] = x; }
  if (srv && srv.mx) { const mx = db.dec(srv.mx); K.mx = K.mx || {}; if (mx && Array.isArray(mx._jog)) K.jog = [...new Set([...(K.jog || []), ...mx._jog.filter((d) => typeof d === 'string')])].sort().slice(-60); if (mx && mx._tools && typeof mx._tools === 'object') { K.tools = K.tools || {}; for (const [t, v] of Object.entries(mx._tools)) if (v && (!K.tools[t] || (v.self || 0) > (K.tools[t].self || 0))) K.tools[t] = v; } if (mx && typeof mx === 'object') for (const [c, x] of Object.entries(mx)) { if (c === '_jog' || c === '_tools') continue; const a = K.mx[c]; if (x && (!a || (x.tier || 0) > (a.tier || 0) || ((x.tier || 0) === (a.tier || 0) && (x.runs || []).length > (a.runs || []).length))) K.mx[c] = x; } }
  K.inbox = srv && srv.in ? Object.fromEntries(Object.entries(srv.in).map(([id, s]) => [id, db.dec(s)])) : {};
  save(me, K);
  return { K, ok: true };
}

// 다 푼 묶음 하나 넣기 → 이 기기 저장 → 서버(줄에 넣어 보냄) → 요약 다시
export function addSheet(me, K, sh, R, conf = {}, ms = {}) {
  K.recs[sh.id] = { s: pack(sh), r: R, cf: conf, ms };
  save(me, K);
  db.queuePut(`${base(me)}/r/${sh.id}`, db.enc(K.recs[sh.id]));
  pushSummary(me, K);
}
// 스테이지 표 · 내 기록 · 구보한 날(_jog) — 서버 규칙 6만 자 안: 판자를 많이 다듬은 아이는 판마다 기록(runs)을 최근 것만 보냄(이 기기엔 그대로)
export function mxOut(K, max = 56000) {
  const pack1 = (keep) => db.enc({ ...Object.fromEntries(Object.entries(K.mx || {}).map(([c, m]) => [c, keep == null || !m || !Array.isArray(m.runs) ? m : { ...m, runs: m.runs.slice(-keep) }])), _jog: (K.jog || []).slice(-60), _tools: K.tools || {} });
  for (const keep of [null, 5, 3, 1, 0]) { const v = pack1(keep); if (v.length <= max) return v; }
  return pack1(0);
}
export function pushMastery(me, K) { db.queuePut(`${base(me)}/mx`, mxOut(K)); }
export function setReview(me, K) { save(me, K); db.queuePut(`${base(me)}/rv`, db.enc(K.rv)); }   // 규칙에 rv 칸 있음
let lastNow = { mode: 'home' };
export function setNow(me, now) { lastNow = now; db.put(`${base(me)}/now`, db.enc({ ...now, t: Date.now() })).catch(() => {}); }

// 모든 기록 → 종이와 같은 판정
export function history(K) {
  const sheets = [], res = {};
  for (const [id, x] of Object.entries(K.recs)) {
    if (!okRec(x)) continue;   // 모양이 이상한 기록은 건너뜀(판정 · 선생님 화면이 멈추지 않게)
    if (x.s.kind === 'week') continue;   /* 이번 주 점검은 선(weekcore)에만 — 재는 도구가 판자 상태를 바꾸지 않게(한 문제 틀림으로 '확인' 칸이 흔들림이 되던 것 · 혹평 10-31) */
    let sh; try { sh = unpack(x.s); } catch (e) { continue; }
    if (!sh.items.length) continue; sheets.push(sh); res[id] = { [KID]: x.r };
  }
  sheets.sort((a, b) => a.made - b.made);
  return { sheets, res };
}
export const okRec = (x) => !!(x && x.s && Array.isArray(x.s.it) && Number.isFinite(x.s.made) && x.r && typeof x.r === 'object' && x.r.it && typeof x.r.it === 'object' && x.r.done && typeof x.r.done === 'object' && x.s.it.every((i) => Array.isArray(i) && i.length >= 5));
export const reportOf = (K) => { const H = history(K); return kidReport(H.sheets, H.res, KID, { from: '1-1', to: '6-2' }); };

// 자신감 비교하기(모든 기록) — 확실했는데 틀림 · 짐작이 맞은 비율
export function calOf(K, since = 0) {
  let n = 0, hit = 0, sureRight = 0; const sureWrong = {};
  for (const x of Object.values(K.recs)) {
    if (!okRec(x) || x.s.made < since) continue;
    for (const [k, c] of x.s.it) {
      const r = x.r.it[k], cf = x.cf ? x.cf[k] : null; if (!r || cf == null) continue;
      const ok = r.s === 'ok'; n++;
      hit += cf === 1 ? 0.5 : (cf === 2) === ok ? 1 : 0;
      if (cf === 2 && !ok) sureWrong[c] = (sureWrong[c] || 0) + 1;
      if (cf === 2 && ok) sureRight++;
    }
  }
  return { n, match: n ? hit / n : null, sureWrong, sureRight };   /* sureRight = '자신 있어요' 하고 맞힌 문제 수(아이 내 기록 · 11-07) */
}

// 선생님 화면용 요약
export function summaryOf(K) {
  const rep = reportOf(K);
  const L = Object.fromEntries(Object.values(rep.L).map((x) => [x.c, x.st]));
  const cal = calOf(K);
  const now = Date.now();
  const due = Object.entries(K.rv).filter(([, x]) => x.n < REVIEW_DAYS.length && x.due <= now).map(([c]) => c);
  const last = Object.values(K.recs).filter(okRec).reduce((m, x) => Math.max(m, x.s.made), 0);
  // 오개념 카드 — 되풀이됨(s) · 한 번 보임(m) — 선생님 반 화면에서 모아 봄
  const mis = {};
  for (const [id, e] of Object.entries(mindsOf(rep))) mis[id] = e.s ? 's' : 'm';
  // 고친 생각 — 예전에 되풀이됐는데 지금은 안 보이고 그 칸이 됨(다른 꼴 함정까지 맞혀야 됨 — 판정이 최근 문항으로 봄)
  K.minds = K.minds || {};
  for (const [id, v] of Object.entries(mis)) if (v === 's') K.minds[id] = { s: (K.minds[id] && K.minds[id].s) || now, fixed: 0 };
  for (const [id, x] of Object.entries(K.minds)) if (!mis[id] && x.s && !x.fixed) { x.fixed = now; }
  for (const [id, x] of Object.entries(K.minds)) if (x.fixed && !mis[id]) mis[id] = 'r';
  // 최근 14일 — '먼저 봐 줄 아이'가 쌓이기만 하지 않게(혹평 10-31) · 찍기는 횟수만 있어 늘어난 때를 여기서 적어 둠
  const sw14 = calOf(K, now - 14 * DAY).sureWrong;
  if (K.rushSeen == null) K.rushSeen = K.rush || 0;   /* 고친 앞의 찍기 횟수는 '최근 2주'로 세지 않음(회귀 10-31) */
  if ((K.rush || 0) > (K.rushSeen || 0)) { K.rushLog = [...(K.rushLog || []), ...Array.from({ length: Math.min(20, K.rush - (K.rushSeen || 0)) }, () => now)].slice(-40); K.rushSeen = K.rush; }
  const rush14 = (K.rushLog || []).filter((t) => now - t < 14 * DAY).length;
  const prep = K.lastPrep && K.lastPrep.unit ? { u: K.lastPrep.unit, why: K.lastPrep.why || '', t: K.lastPrep.t || 0 } : null;
  /* 선생님이 낸 점검지(ck · 기록 id = <점검 id>_<번째> · 푼 문항 수)와 보충(gv · 기록 id = 과제 id · [맞힘, 문제 수, 때]) — 반 화면 '다 푼 아이' · '보충 결과' */
  const ck = {}, cko = {}, gv = {};   /* cko = 점검지마다 맞힌 수(사전 · 사후 비교하기 · 11-07) */
  for (const [id, x] of Object.entries(K.recs)) { if (!okRec(x)) continue; if (x.s.kind === 'ck') { const cid = String(id).split('_')[0]; ck[cid] = (ck[cid] || 0) + x.s.it.length; cko[cid] = (cko[cid] || 0) + x.s.it.filter((i) => x.r.it[i[0]] && x.r.it[i[0]].s === 'ok').length; } else if (x.s.kind === 'gv') gv[id] = [x.s.it.filter((i) => x.r.it[i[0]] && x.r.it[i[0]].s === 'ok').length, x.s.it.length, Math.round(x.s.made), ...(Array.isArray(x.s.tr) ? x.s.tr.slice(0, 2) : [])]; }   /* [맞힘, 문제 수, 때, 함정 맞힘, 함정 수] */
  /* 틀린 뒤 도움 사다리 결과 — 주마다 [주, 떠올려 고침, 풀이 순서로 고침, 답 봄, 보기 다시 골라 맞힘](교사 11-07 '단계적으로 하나씩 해내는 힘'의 기록) */
  const lad = Object.entries(K.lad || {}).sort((p, q) => (p[0] < q[0] ? -1 : 1)).slice(-8).map(([w, v]) => [w, v.r || 0, v.s || 0, v.x || 0, v.p || 0]);
  return { t: now, last, mis, L, sw14, rush14, prep, start: rep.start.map((s) => s.c), below: rep.below.map((b) => b.c), under: rep.under.map((u) => u.c), sw: cal.sureWrong, cal: { n: cal.n, m: cal.match }, fixed: K.fixed, due, help: K.help || {}, rush: K.rush || 0, jog: (K.jog || []).slice(-14), tools: K.tools || {}, ck, cko, gv, lad, story: storySum(K), wk: weeksOf(K.recs).slice(-12).map((w) => [w.wk, w.ok, w.n, w.term]), mx: Object.fromEntries(Object.entries(K.mx || {}).filter(([c]) => c !== '_jog' && c !== '_tools').map(([c, x]) => [c, x.tier || 0])) };
}
export function pushSummary(me, K) { db.queuePut(`${base(me)}/st`, db.enc(summaryOf(K))); }

// 들어가기 — 핀이 맞으면 서버가 읽기를 허락(없는 칸이면 null) · 틀리면 401
export async function join(C, no, pin) {
  const me = { C: String(C).toUpperCase().trim(), no: String(Number(no)), pin: String(pin).trim() };
  if (!/^[A-HJ-NP-Z2-9]{6}$/.test(me.C) || !/^[1-9][0-9]{0,2}$/.test(me.no) || !/^[0-9]{4}$/.test(me.pin)) throw new Error('반 코드 여섯 글자 · 번호 · 핀 네 자리를 확인해 주세요');
  await db.get(`${base(me)}/st`);
  return me;
}

// 내 도구함 — 배운 도구(t) · 스스로 고친 횟수(self)
export function learnTool(me, K, tool) { K.tools = K.tools || {}; if (!K.tools[tool]) K.tools[tool] = { t: Date.now(), self: 0 }; save(me, K); pushMastery(me, K); }
export function selfFix(me, K, tool) { K.tools = K.tools || {}; const x = (K.tools[tool] = K.tools[tool] || { t: Date.now(), self: 0 }); x.self = (x.self || 0) + 1; save(me, K); pushMastery(me, K); }

// 도움 사다리 한 번의 결과(hint.js onEnd how) — 이번 주 칸에 하나 더 · 요약은 다음 pushSummary 때
export function ladLog(me, K, how) {
  const k = { recall: 'r', steps: 's', shown: 'x', pick: 'p' }[how]; if (!k) return;
  if (how === 'shown') setNow(me, { ...lastNow, sos: Date.now() });   /* 도움을 다 쓰고 답을 봄 → 선생님 '지금 우리 반'에 '막혀서 답을 봤어요'(10분) */
  const w = weekKey(); K.lad = K.lad || {}; const v = (K.lad[w] = K.lad[w] || {}); v[k] = (v[k] || 0) + 1;
  const ws = Object.keys(K.lad).sort(); if (ws.length > 12) ws.slice(0, ws.length - 12).forEach((x) => delete K.lad[x]);
  save(me, K);
}
