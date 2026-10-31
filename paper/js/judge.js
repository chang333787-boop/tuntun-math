// 끊긴 곳 찾기 — 결과 → 판정(한 아이) · 반 표
//  결과 res = { done:{장: true}, it:{ k:{ s:'x'|'q'|'h', a:[아이 답] } }, w:{ k:{ f:0|1, a:0|1 } }, t:{ 장: 분 }, at }
//    채점 끝(done)인 장만 셈 — 표시 없는 문항은 맞음 · s: x 틀림 · q 모름(? 씀 · 비움) · h 도움 받고 맞음
//  판정은 숫자 규칙(사람마다 다르지 않게): 맞힌 수 / 푼 수
//    확인 = 셋 이상 다 맞음(도움 없이) · 거의 = 다 맞았지만 셋보다 적음 또는 도움 · 흔들림 = 60% 이상(셋보다 적게 보고 틀린 것 포함) · 막힘 = 60% 미만(두 문제 이상) · 안 봄
//  관문(선별)을 '확인'하면 그 아래 차시는 '관문 통과'(직접 본 것과 구별) · 관문이 흔들리거나 막히면 그 아래는 '자세히 볼 것'
//  '여기서부터' = 막힌 차시 중 선수 차시(학년을 넘는 줄)가 모두 됨인 것 · 선수 차시를 안 봤으면 '아래 먼저 확인' — 원인을 단정하지 않음
import { allPre } from '../../engine/lessons/index.js';
import { readExpr, answerOf, diagnose, testable, judge, BUG_LIST } from '../../engine/errors.js';
import { itemOf, LES, lessonsIn, ENG } from './gen.js';

export const ST = { ok: '확인', near: '거의', pass: '관문 통과', shaky: '흔들림', stuck: '막힘', need: '자세히 볼 것', none: '안 봄' };
const GOOD = new Set(['ok', 'near', 'pass']);
const BUGNAME = Object.fromEntries(BUG_LIST.map((b) => [b.id, b.name]));

// 문항 하나의 결과 + 원인 가설
export function readItem(sheet, it, r) {
  if (!r || !r.done || !r.done[it.ch]) return null;
  if (it.form === 'w') { const w = (r.w || {})[it.k] || {}; return { k: it.k, c: it.c, word: true, kind: it.word.kind, f: w.f !== 0, a: w.a !== 0 }; }
  const m = (r.it || {})[it.k] || {}, s = m.s || 'ok';
  const out = { k: it.k, c: it.c, s, help: s === 'h', ok: s === 'ok' || s === 'h', gate: !!it.gate, covers: it.covers };
  if (s === 'x' && m.a && m.a.some((v) => v !== '' && v != null)) {
    let vals = m.a.map(Number), extraRem = null;
    if (it.form === 'd' && it.snap.sol.length === 1 && m.a.length > 1) { extraRem = m.a[1] === '' || m.a[1] == null ? null : Number(m.a[1]); vals = [vals[0]]; }
    const filled = m.a.slice(0, it.form === 'd' && it.snap.sol.length === 1 ? 1 : it.snap.sol.length).every((v) => v !== '' && v != null);
    let item = null, lessonBug = null; try { item = itemOf(it.c, it.p); const res = item.check(vals, vals.map(String)); if (res && res.ok && filled) { if (extraRem) { out.remNote = '몫은 맞고 나머지를 잘못 씀(나누어떨어지는 나눗셈)'; out.ans = m.a; out.d = null; out.tests = []; return out; } out.ok = true; out.s = 'ok'; out.fix = '입력한 답이 맞는 답이에요 — 맞음으로 셈'; return out; } lessonBug = res && res.bug ? res.bug : null; } catch (e) { /* 엔진이 바뀌어 다시 못 만듦 — 겉모습으로만 */ }
    const view = item || { prompt: it.snap.prompt, sol: it.snap.sol };
    let d = null; try { const ans = answerOf(view, vals); d = ans && readExpr(view) ? diagnose(view, ans, { lessonBug }) : null; } catch (e) { d = null; }
    // 고르기 문제는 어느 보기를 골라도 오답 이름이 붙음(보기 둘이면 오답 = 그 이름) — 원인 근거로 세지 않고 이름만 보여 줌
    if (it.snap.choices) { out.ans = m.a; out.note = lessonBug ? lessonBug.name : null; out.d = null; out.tests = []; return out; }
    if (!d && lessonBug) d = { kind: 'bug', hyps: [{ id: `lesson:${lessonBug.name}`, name: lessonBug.name, kind: 'proc', to: lessonBug.to }], slip: null };
    if (d && d.hyps.length > 1) { const gen = d.hyps.filter((h) => !String(h.id).startsWith('lesson:')); if (gen.length) { d.alt = d.hyps.filter((h) => String(h.id).startsWith('lesson:')).map((h) => h.name); d.hyps = gen; } }   // 같은 답을 설명하는 차시 오답 이름은 같은 원인의 다른 이름 — 생성 모형만 셈
    out.ans = m.a; out.d = d; out.tests = readExpr(view) ? testable(view) : [];
  } else if (s !== 'q' && s !== 'x') { try { out.tests = readExpr(it.snap) ? testable({ prompt: it.snap.prompt, sol: it.snap.sol }) : []; } catch (e) { out.tests = []; } }
  return out;
}

// 한 아이 — 모든 묶음의 결과를 모아 차시마다
export function kidReport(sheets, results, kid, { from = '1-1', to = '4-1' } = {}) {
  const recs = [];
  for (const sh of sheets) {
    const r = results[sh.id] && results[sh.id][kid]; if (!r) continue;
    for (const it of sh.items) { const x = readItem(sh, it, r); if (x) recs.push({ ...x, sheet: sh.id, made: sh.made, skind: sh.kind }); }
  }
  const calc = recs.filter((x) => !x.word), words = recs.filter((x) => x.word);
  // 차시마다: 최근 묶음부터 모아 셋 이상이 될 때까지
  const byC = {};
  calc.forEach((x) => (byC[x.c] = byC[x.c] || []).push(x));
  const L = {};
  for (const [c, xs] of Object.entries(byC)) {
    const sheetsOrd = [...new Set(xs.sort((a, b) => b.made - a.made).map((x) => x.sheet))];
    let use = [];
    for (const s of sheetsOrd) { use = use.concat(xs.filter((x) => x.sheet === s)); if (use.length >= 3) break; }
    const ok = use.filter((x) => x.ok).length, tot = use.length, help = use.some((x) => x.help);
    // 셋보다 적게 보고 틀렸으면 늘 '흔들림'(확인 필요) — 적은 문제로 단정하지 않음
    const st = tot === 0 ? 'none' : ok === tot ? (tot >= 3 && !help ? 'ok' : 'near') : tot < 3 ? 'shaky' : ok / tot >= 0.6 ? 'shaky' : 'stuck';
    const first = xs.filter((x) => x.sheet === sheetsOrd[sheetsOrd.length - 1]), firstOk = first.filter((x) => x.ok).length;
    L[c] = { c, st, ok, tot, help, use, all: xs.length, first: sheetsOrd.length > 1 ? { ok: firstOk, tot: first.length } : null, gate: xs.some((x) => x.gate), covers: (xs.find((x) => x.covers) || {}).covers || null, recs: xs };
  }
  // 원인 가설(차시마다 · errors.judge — 두 번 맞아떨어지고 반대 증거가 더 많지 않아야 '가능성 높음')
  for (const x of Object.values(L)) {
    const J = judge(x.recs.map((r) => ({ ok: r.ok, idk: r.s === 'q', d: r.ok || r.s === 'q' ? null : r.d ? { hyps: r.d.hyps.map((h) => ({ id: h.id, name: h.name, kind: h.kind })), slip: r.d.slip || null, kind: r.d.kind } : null, tests: r.tests || [] })));
    const ev = (id) => x.recs.filter((r) => r.d && r.d.hyps.some((h) => h.id === id)).map((r) => ({ k: r.k, sheet: r.sheet, a: r.ans }));
    x.why = { verdict: J.verdict, sure: J.sure.map((h) => ({ ...h, ev: ev(h.id) })), maybe: J.maybe.map((h) => ({ ...h, ev: ev(h.id) })), slips: J.slips, idk: J.idk };
    // 같은 답을 두 원인이 설명 → 가르는 문항이 필요 · 한 원인만 맞아떨어진 문항들이 모두 같은 원인을 가리킬 때만 '갈림'(서로 다른 원인을 가리키면 그대로)
    const ids = [...new Set(x.recs.filter((r) => r.d && r.d.hyps.length >= 2).flatMap((r) => r.d.hyps.map((h) => h.id)))];
    const singles = ids.length ? [...new Set(x.recs.filter((r) => r.d && r.d.hyps.length === 1 && ids.includes(r.d.hyps[0].id)).map((r) => r.d.hyps[0].id))] : [];
    x.amb = ids.length && singles.length !== 1 ? ids : null;
    if (ids.length && singles.length === 1) x.split = singles[0];
  }
  // 실수로만 틀림 · 경계선 — 막힘으로 단정하지 않음
  for (const x of Object.values(L)) {
    const wrong = (x.use || []).filter((r) => !r.ok);
    if (x.st === 'stuck' && x.ok >= 1 && wrong.length && wrong.every((r) => r.d && !r.d.hyps.length && r.d.slip)) { x.st = 'shaky'; x.slipOnly = true; continue; }   // 하나도 못 맞혔으면 '실수'가 아님(같은 자리를 늘 틀림 — 10-31)
    const q = (x.use || []).filter((r) => r.s === 'q').length, sure = x.why && x.why.sure.length;
    if (x.st === 'stuck' && x.ok >= 1 && wrong.length - q <= 2 && q < 2 && !sure) { x.st = 'shaky'; x.borderline = true; }
  }
  // 관문 미루기 — 도움 없이 확인한 관문만 아래를 '관문 통과'로 · 막힌 관문만 아래를 '자세히 볼 것'으로 · 흔들림 · 도움은 관문부터 다시
  //  맞힌 관문을 먼저(같은 칸이 맞힌 관문 아래이기도 하고 막힌 관문 아래이기도 하면 '관문 통과'가 이김 — 먼저 본 관문이 이기던 것 10-31)
  const gatesSeen = Object.values(L).filter((x) => x.gate && x.covers && (x.st === 'ok' || x.st === 'stuck')).sort((a, b) => (a.st === 'ok' ? 0 : 1) - (b.st === 'ok' ? 0 : 1));
  for (const x of gatesSeen) for (const c of x.covers) if (c !== x.c && !L[c]) L[c] = { c, st: x.st === 'ok' ? 'pass' : 'need', ok: 0, tot: 0, via: x.c, recs: [] };
  const good = (p) => L[p] && (L[p].st === 'ok' || L[p].st === 'pass' || (L[p].st === 'near' && !L[p].help));
  // 고립 — 이 차시에 기대는 위 차시를 셋 이상 다 맞힌 것이 둘 이상이면 진짜 빈 곳이 아닐 수 있음(빈 곳은 위로 번짐) → 여기서부터에서 빼고 다시 확인
  const deps = (c) => Object.values(L).filter((y) => y.c !== c && y.st === 'ok' && y.tot >= 3 && byPre(y.c).length && closureOf(y.c).has(c));
  //  원인이 두 번 맞아떨어졌거나 '모름'(?)이 둘 이상이면 고립으로 보지 않음 — 위 차시는 다른 길(□ − 29 = 19를 덧셈으로)로도 풀리므로
  for (const x of Object.values(L)) { const q = (x.use || []).filter((r) => r.s === 'q').length; if ((x.st === 'stuck' || x.st === 'shaky') && !(x.why && x.why.sure.some((h) => !String(h.id).startsWith('lesson:'))) && q < 2 && deps(x.c).length >= 2) x.iso = deps(x.c).map((y) => y.c); }
  // 여기서부터 · 아래 먼저 확인
  const start = [], below = [], under = [], iso = [];
  for (const x of Object.values(L)) {
    if (x.st !== 'stuck' && !(x.st === 'shaky' && x.why && x.why.sure.length)) continue;
    if (x.iso) { iso.push({ c: x.c, ok: x.iso }); continue; }
    const pre = byPre(x.c);   // 고른 범위 밖의 선수 차시도(안 봤으면 '아래 먼저 확인')
    const bad = pre.filter((p) => L[p] && (L[p].st === 'stuck' || L[p].st === 'shaky'));
    const unk = pre.filter((p) => !good(p) && !bad.includes(p));
    if (bad.length) under.push({ c: x.c, because: bad });
    else if (unk.length) below.push({ c: x.c, check: unk });
    else start.push({ c: x.c });
  }
  const ord = (a, b) => gi(a.c) - gi(b.c);
  start.sort(ord); below.sort(ord); under.sort(ord);
  // 문장제
  const wk = words.map((w) => ({ k: w.k, c: w.c, kind: w.kind, f: w.f, a: w.a, sheet: w.sheet }));
  const wsum = { n: wk.length, f: wk.filter((w) => w.f).length, a: wk.filter((w) => w.a).length, calcOnly: wk.filter((w) => w.f && !w.a).length, setup: wk.filter((w) => !w.f) };
  // 다음 할 일
  //  확인지(꼭) = 막힌 차시 아래에서 아직 안 본 것 · 흔들리거나 막힌 관문 아래 · 흔들림 — '거의'(한두 문제만 봄)는 덧붙임으로
  const checkList = [...new Set([
    ...below.flatMap((b) => b.check),
    ...Object.values(L).filter((x) => x.st === 'need' || x.st === 'shaky').map((x) => x.c),
    ...Object.values(L).filter((x) => x.amb && (x.st === 'stuck' || x.st === 'shaky')).map((x) => x.c),   // 두 원인이 같은 답 — 가르는 숫자로 다시
    ...iso.map((x) => x.c),   // 고립된 막힘 — 한 번 더
  ])].filter((c) => LES(c)).sort((a, b) => gi(a) - gi(b));
  const thin = Object.values(L).filter((x) => x.st === 'near').map((x) => x.c).sort((a, b) => gi(a) - gi(b));
  // 도움 받아 맞힌 관문은 도움 없이 다시
  Object.values(L).filter((x) => x.gate && x.st === 'near' && x.help).forEach((x) => { if (!checkList.includes(x.c)) checkList.push(x.c); });
  // 이야기 문제 — 식은 맞고 답이 틀림 → 그 계산 차시 확인 · 식이 틀림 → 같은 구조를 다시(이야기 확인지)
  wk.filter((w) => w.f && !w.a).forEach((w) => { if (!checkList.includes(w.c) && !(L[w.c] && L[w.c].st === 'ok')) checkList.push(w.c); });
  const wordCheck = [...new Map(wk.filter((w) => !w.f).map((w) => [w.kind, [w.c, w.kind]])).values()];
  const teach = start.slice(0, 3).map((s) => s.c);
  return { L, start, below, under, iso, words: wk, wsum, checkList, thin, teach, wordCheck, n: calc.length };
}
const gi = (c) => { const x = LES(c); return x ? Number(x.g[0]) * 10 + Number(x.g[2]) + (x.n || 0) / 100 : 99; };
const closCache = {};
function closureOf(c) { if (closCache[c]) return closCache[c]; const s = new Set([c]); for (const p of byPre(c)) for (const q of closureOf(p)) s.add(q); return (closCache[c] = s); }
const preCache = {};
function byPre(c) { if (preCache[c]) return preCache[c]; let p = []; try { p = LES(c) && !c.startsWith('est:') ? allPre(c) : []; } catch (e) { p = []; } return (preCache[c] = p); }

export const bugName = (id) => BUGNAME[id] || String(id).replace(/^lesson:/, '');

// ── 반 표 ──
export function classTable(sheets, results, kids, range) {
  const reps = Object.fromEntries(kids.map((k) => [k.id, kidReport(sheets, results, k.id, range)]));
  const seen = new Set(); Object.values(reps).forEach((r) => Object.keys(r.L).forEach((c) => seen.add(c)));
  const rows = [...seen].filter((c) => LES(c)).sort((a, b) => gi(a) - gi(b));
  // 같은 '여기서부터'를 가진 아이끼리 묶음
  const groups = {};
  for (const k of kids) for (const s of reps[k.id].start) (groups[s.c] = groups[s.c] || []).push(k.id);
  return { reps, rows, groups };
}
export { ENG };
