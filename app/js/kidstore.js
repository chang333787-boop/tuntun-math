// 아이 기록 — 이 기기 + 서버(k/<반>/<번호>/<핀>/)
//  기록 하나 = 다 푼 묶음 하나: r/<묶음 id> = { s: 짧게 싼 묶음, r: 결과, cf: 자신감, ms: 걸린 시간 }
//    묶음은 문항마다 [번호, 차시, params, 관문?, 장]만 — 문제 글은 엔진이 (차시, params)로 다시 만든다(그래서 작다)
//  st = 선생님 화면용 요약(판정 · 고칠 판자 · 확실했는데 틀림 · 다시 볼 날) — 선생님은 이것만 훑고, 자세히 볼 때만 r/ 전부
//  rv = 다시 보기 일정 { 차시: { n: 지난 다시 보기 수, due: 다음 날 } } — 고친 뒤 1 · 3 · 7일 [D-6][D-8]
import { closure, itemOf, formOf, LES } from '../../paper/js/gen.js';
import { kidReport } from '../../paper/js/judge.js';
import { lsGet, lsSet } from './local.js';
import * as db from './db.js';

export const DAY = 864e5;
export const REVIEW_DAYS = [1, 3, 7];
const KID = 'me';

export function pack(sh) { return { id: sh.id, kind: sh.kind, made: sh.made, unit: sh.unit || null, it: sh.items.map((it) => [it.k, it.c, it.p, it.gate ? 1 : 0, it.ch]) }; }
export function unpack(o) {
  const items = [], chs = new Map();
  for (const [k, c, p, g, ch] of o.it) {
    if (!LES(c)) continue;
    let it; try { it = itemOf(c, p); } catch (e) { continue; }
    items.push({ k, c, p, gate: !!g, covers: g ? [...closure(c)] : null, ch, form: formOf(it), cls: '', snap: { prompt: it.prompt, sol: it.sol, choices: it.choices || null } });
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
  if (srv && srv.rv) { const rv = db.dec(srv.rv); if (rv) for (const [c, x] of Object.entries(rv)) if (!K.rv[c] || (x.t || 0) > (K.rv[c].t || 0)) K.rv[c] = x; }
  if (srv && srv.mx) { const mx = db.dec(srv.mx); K.mx = K.mx || {}; if (mx && Array.isArray(mx._jog)) K.jog = [...new Set([...(K.jog || []), ...mx._jog.filter((d) => typeof d === 'string')])].sort().slice(-60); if (mx && typeof mx === 'object') for (const [c, x] of Object.entries(mx)) { if (c === '_jog') continue; const a = K.mx[c]; if (x && (!a || (x.tier || 0) > (a.tier || 0) || ((x.tier || 0) === (a.tier || 0) && (x.runs || []).length > (a.runs || []).length))) K.mx[c] = x; } }
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
export function pushMastery(me, K) { db.queuePut(`${base(me)}/mx`, db.enc({ ...(K.mx || {}), _jog: K.jog || [] })); }   // 스테이지 표 · 내 기록 · 구보한 날(_jog)
export function setReview(me, K) { save(me, K); db.queuePut(`${base(me)}/rv`, db.enc(K.rv)); }   // 규칙에 rv 칸 있음
export function setNow(me, now) { db.put(`${base(me)}/now`, db.enc({ ...now, t: Date.now() })).catch(() => {}); }

// 모든 기록 → 종이와 같은 판정
export function history(K) {
  const sheets = [], res = {};
  for (const [id, x] of Object.entries(K.recs)) {
    if (!okRec(x)) continue;   // 모양이 이상한 기록은 건너뜀(판정 · 선생님 화면이 멈추지 않게)
    let sh; try { sh = unpack(x.s); } catch (e) { continue; }
    if (!sh.items.length) continue; sheets.push(sh); res[id] = { [KID]: x.r };
  }
  sheets.sort((a, b) => a.made - b.made);
  return { sheets, res };
}
export const okRec = (x) => !!(x && x.s && Array.isArray(x.s.it) && Number.isFinite(x.s.made) && x.r && typeof x.r === 'object' && x.r.it && typeof x.r.it === 'object' && x.r.done && typeof x.r.done === 'object' && x.s.it.every((i) => Array.isArray(i) && i.length >= 5));
export const reportOf = (K) => { const H = history(K); return kidReport(H.sheets, H.res, KID, { from: '1-1', to: '6-2' }); };

// 자신감 견주기(모든 기록) — 확실했는데 틀림 · 짐작이 맞은 비율
export function calOf(K, since = 0) {
  let n = 0, hit = 0; const sureWrong = {};
  for (const x of Object.values(K.recs)) {
    if (!okRec(x) || x.s.made < since) continue;
    for (const [k, c] of x.s.it) {
      const r = x.r.it[k], cf = x.cf ? x.cf[k] : null; if (!r || cf == null) continue;
      const ok = r.s === 'ok'; n++;
      hit += cf === 1 ? 0.5 : (cf === 2) === ok ? 1 : 0;
      if (cf === 2 && !ok) sureWrong[c] = (sureWrong[c] || 0) + 1;
    }
  }
  return { n, match: n ? hit / n : null, sureWrong };
}

// 선생님 화면용 요약
export function summaryOf(K) {
  const rep = reportOf(K);
  const L = Object.fromEntries(Object.values(rep.L).map((x) => [x.c, x.st]));
  const cal = calOf(K);
  const now = Date.now();
  const due = Object.entries(K.rv).filter(([, x]) => x.n < REVIEW_DAYS.length && x.due <= now).map(([c]) => c);
  const last = Object.values(K.recs).filter(okRec).reduce((m, x) => Math.max(m, x.s.made), 0);
  return { t: now, last, L, start: rep.start.map((s) => s.c), below: rep.below.map((b) => b.c), under: rep.under.map((u) => u.c), sw: cal.sureWrong, cal: { n: cal.n, m: cal.match }, fixed: K.fixed, due, help: K.help || {}, rush: K.rush || 0, jog: (K.jog || []).slice(-14), mx: Object.fromEntries(Object.entries(K.mx || {}).filter(([c]) => c !== '_jog').map(([c, x]) => [c, x.tier || 0])) };
}
export function pushSummary(me, K) { db.queuePut(`${base(me)}/st`, db.enc(summaryOf(K))); }

// 들어가기 — 핀이 맞으면 서버가 읽기를 허락(없는 칸이면 null) · 틀리면 401
export async function join(C, no, pin) {
  const me = { C: String(C).toUpperCase().trim(), no: String(Number(no)), pin: String(pin).trim() };
  if (!/^[A-HJ-NP-Z2-9]{6}$/.test(me.C) || !/^[1-9][0-9]{0,2}$/.test(me.no) || !/^[0-9]{4}$/.test(me.pin)) throw new Error('반 코드 여섯 글자 · 번호 · 핀 네 자리를 확인해 주세요');
  await db.get(`${base(me)}/st`);
  return me;
}
