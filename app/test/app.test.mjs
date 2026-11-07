// 앱 순수 로직 시험: node app/test/app.test.mjs
//  ① 보내는 중에 같은 경로가 다시 들어와도 다른 쓰기를 잃지 않음 ② 다른 단원 기록의 고칠 판자가 오늘 준비 다리를 막지 않음 ③ 흔들림 두 번이면 '다질 판자'
import { closure } from '../../paper/js/gen.js';
let fail = 0;
const ok = (c, m) => { if (!c) { fail++; console.log('✗', m); } else console.log('✓', m); };

// ① 대기열 — 가짜 fetch(느림) · localStorage는 local.js가 메모리로 대신함
const sent = [];
globalThis.fetch = async (url, o) => { await new Promise((r) => setTimeout(r, 20)); sent.push([url.replace(/^.*app\//, ''), o.body]); return { ok: true, status: 200, json: async () => null }; };
const db = await import('../js/db.js');
await db.flush();   // 앱 시작처럼 빈 줄로 먼저 — 이것 뒤에도 보내야 함(10-31 배포에서 찾은 멈춤)
await new Promise((r) => setTimeout(r, 5));
db.queuePut('k/A/1/0000/r/s1', '"one"');
db.queuePut('k/A/1/0000/st', '"st1"');
await new Promise((r) => setTimeout(r, 5));   // s1 보내는 중
db.queuePut('k/A/1/0000/r/s1', '"one-b"');     // 같은 경로가 다시 — st1을 지우면 안 됨
db.queuePut('k/A/1/0000/r/s2', '"two"');
await db.flush(); await new Promise((r) => setTimeout(r, 200)); await db.flush();
const got = sent.map((x) => x[0].replace('.json', '').replace(/^https?:\/\/[^/]+\//, '') + '=' + x[1]);
ok(got.some((x) => x.includes('/st=') && x.includes('st1')), `보내는 중 같은 경로가 다시 들어와도 다른 쓰기(st)를 보냄 — ${got.join(' · ')}`);
ok(got.some((x) => x.includes('r/s1=') && x.includes('one-b')) && got.some((x) => x.includes('r/s2=') && x.includes('two')), '새로 들어온 쓰기도 보냄');
ok(db.pending() === 0, '줄이 비었음');

// ② 다른 단원에서 생긴 고칠 판자(지난 기록)가 있어도 오늘 단원 점검을 한다
const P = await import('../js/prep.js');
const old = P.newPrep({ unit: '2-2-2', id: 'OLD' });   // 곱셈구구 준비 — 묶어 세기에서 막히는 아이
let it; while ((it = P.current(old))) P.answer(old, closure(it.c).has('2-1-6:3') ? { idk: true } : { vals: it.snap.sol.map(Number), raws: it.snap.sol.map(String) });
const prior = { sheets: old.sheets, res: old.res };
const S = P.newPrep({ unit: '1-2-2', id: 'NEW', prior });   // 다른 단원(1학년 덧셈 · 뺄셈)
ok(S.sheets.length > 0 && P.current(S), `다른 단원 기록이 있어도 오늘 단원 문제를 냄(묶음 ${S.sheets.length}개)`);
while ((it = P.current(S))) P.answer(S, { vals: it.snap.sol.map(Number), raws: it.snap.sol.map(String) });
const sum = P.summary(S);
ok(!sum.fix.some((c) => !S.plan.below.includes(c)), `고칠 판자는 오늘 단원 준비 칸 안에서만 — ${sum.fix.join(',') || '없음'}`);

// ③ 같은 칸을 2/3 · 2/3 — '고칠 판자'로 단정하지 않고 '다질 판자'로
const T = P.newPrep({ unit: '3-1-3', id: 'SHK' });
const cnt = {};
while ((it = P.current(T))) { const k = (cnt[it.c] = (cnt[it.c] || 0) + 1); const wrong = it.c === T.plan.fringe[0] && k % 3 === 0; P.answer(T, wrong ? { vals: it.snap.sol.map((x) => Number(x) + 1), raws: it.snap.sol.map((x) => String(Number(x) + 1)) } : { vals: it.snap.sol.map(Number), raws: it.snap.sol.map(String) }); }
const s3 = P.summary(T);
ok(s3.shaky.includes(T.plan.fringe[0]) || s3.fix.includes(T.plan.fringe[0]) || s3.rep.L[T.plan.fringe[0]].st !== 'shaky', `두 번 흔들린 칸이 끝 화면에 나옴 — 흔들 ${s3.shaky.join(',') || '없음'} · 끝 ${T.why}`);
// ④ 스테이지 표: 정확 → 빠르게 → (3일 뒤) 오래 · 느리면 빠르게 X · 정답률 낮으면 다음 판 시계 감춤
const G2 = await import('../js/stage.js');
{
const c = '2-2-2:4', T = G2.target(c), n = G2.drillN(c), mx = {}, day = 864e5, t0 = Date.now();
let g = G2.applyRun(mx, c, { n, ok: n, med: T * 2, total: 1 }, t0);
ok(g.after === 1 && g.gained.join() === '정확', `다 맞히되 느림 → 정확만 (${g.gained})`);
g = G2.applyRun(mx, c, { n, ok: n - 1, med: T * 0.8, total: 1 }, t0 + 1000);
ok(g.after === 2, `정확한 뒤 기준 시간 안 → 빠르게 (${mx[c].tier})`);
g = G2.applyRun(mx, c, { n, ok: n, med: T * 0.9, total: 1 }, t0 + day);
ok(mx[c].tier === 2, '하루 뒤엔 아직 오래 아님');
g = G2.applyRun(mx, c, { n, ok: n, med: T * 1.1, total: 1 }, t0 + 3 * day + 2000);
ok(mx[c].tier === 3 && g.gained.join() === '오래', '3일 뒤 그대로면 오래');
G2.applyRun(mx, '1-1-3:6', { n: 8, ok: 5, med: 3000, total: 1 }, t0);
ok(mx['1-1-3:6'].slow === true && mx['1-1-3:6'].tier === 0, '정답률 낮으면 표 없음 · 다음 판 시계 감춤');
const D = G2.newDrill({ c, id: 'DR', clock: true });
ok(D.sheet.items.length === n && new Set(D.sheet.items.map((it) => JSON.stringify(it.snap.prompt))).size === n, `다듬기 한 판 ${n}문제 · 겹침 없음`);
}
// ⑤ 다른 꼴로 한 번 더 — 소수 비교에서 '짧을수록 크다' 보기를 한 번 고른 아이 → 다음 묶음에 그 함정 꼴 문항이 나옴
{
  const { itemOf: io } = await import('../../paper/js/gen.js');
  let picked = false, sawTrap = false;
  for (let k = 0; k < 40 && !picked; k++) {
    const S = P.newPrep({ unit: k % 2 ? '6-1-3' : '5-1-4', id: 'TRAP' + k });
    let it, mine = false;
    while ((it = P.current(S))) {
      if (it.c === '4-2-3:6' && it.snap.choices) {
        if (mine && it.trap) sawTrap = true;
        const sh = it.snap.choices.findIndex((_, i) => { const r = io(it.c, it.p).check([i], [String(i)]); return r.bug && /짧을수록/.test(r.bug.name); });
        if (!mine && sh >= 0) { mine = true; picked = true; P.answer(S, { vals: [sh], raws: [String(sh)] }); continue; }
      }
      P.answer(S, { vals: it.snap.sol.map(Number), raws: it.snap.sol.map(String) });
    }
  }
  ok(picked && sawTrap, `'짧을수록 크다' 보기를 한 번 고르면 다음 묶음에 함정 꼴로 다시 물음(고름 ${picked} · 함정 ${sawTrap})`);
}
// ⑥ 함정 짝 — 생각이 보였던 칸의 다듬기는 절반이 함정 꼴 · 오래는 함정까지 맞아야
{
  const G3 = await import('../js/stage.js'), M3 = await import('../../engine/mis.js');
  const D = G3.newDrill({ c: '2-1-3:10', id: 'TRP', clock: true, want: M3.wantFor('eq.answer', '2-1-3:10') });
  const tn = D.sheet.items.filter((x) => x.trap).length;
  ok(tn === Math.ceil(D.sheet.items.length / 2), `등호 생각이 보였던 칸 다듬기: 함정 꼴 ${tn}/${D.sheet.items.length}`);
  const mx = { '2-1-3:10': { tier: 2, t2: Date.now() - 4 * 864e5, runs: [], best: null } };
  G3.applyRun(mx, '2-1-3:10', { n: 6, ok: 5, med: 1000, total: 1, trapN: 3, trapOk: 2 });
  ok(mx['2-1-3:10'].tier === 2, '함정 하나를 틀리면 오래 X');
  G3.applyRun(mx, '2-1-3:10', { n: 6, ok: 6, med: 1000, total: 1, trapN: 3, trapOk: 3 });
  ok(mx['2-1-3:10'].tier === 3, '함정까지 맞으면 오래');
}
// ⑨ 이번 주 점검 — 월요일로 주 가름 · 같은 주 둘이면 먼저 것 · 범위는 학기 준비 칸 전체에서 고르게(학기 내내 같은 범위) · 선 방향 · 학기 표시는 단원 id와 안 겹침
{
  const W = await import('../js/weekcore.js'), PP = await import('../js/prep.js'), LX = await import('../../engine/lessons/index.js');
  ok(W.weekKey(new Date(2026, 10, 1, 9).getTime()) === '2026-10-26' && W.weekKey(new Date(2026, 9, 26, 0, 5).getTime()) === '2026-10-26', '일요일 · 월요일 새벽이 같은 주(월요일 날짜)');
  const rec = (made, okN, unit = 'T3-1') => ({ s: { id: 'w' + made, kind: 'week', made, unit, it: Array.from({ length: 10 }, (_, i) => ['k' + i, '2-1-3:1', {}, 0, 'A']) }, r: { done: { A: true }, it: Object.fromEntries(Array.from({ length: 10 }, (_, i) => ['k' + i, { s: i < okN ? 'ok' : 'x' }])) }, ms: Object.fromEntries(Array.from({ length: 10 }, (_, i) => ['k' + i, 3000 + i])) });
  const d0 = new Date(2026, 9, 5, 10).getTime(), wk = 7 * 864e5;
  const recs = { a: rec(d0, 4), b: rec(d0 + 3600e3, 9), c: rec(d0 + wk, 6), d: rec(d0 + 2 * wk, 8), e: rec(d0 + 3 * wk, 8, 'T4-1') };
  const ws = W.weeksOf(recs, 'T3-1');
  ok(ws.length === 3 && ws[0].ok === 4 && ws[0].med === 3002, `같은 주 두 번이면 먼저 푼 것 · 맞힌 문제 시간 가운데값 — ${ws.map((w) => w.ok).join(',')}`);
  const pts = (xs) => xs.map((ok) => ({ ok, n: 10 }));
  ok(W.weekTrend(pts([4, 5, 6, 7, 8])) === 'up' && W.weekTrend(pts([9, 9, 8, 6, 5])) === 'down' && W.weekTrend(pts([8, 8, 8, 8, 5])) === 'flat' && W.weekTrend(pts([8, 7, 8, 7, 8, 7])) === 'flat' && W.weekTrend(pts([8, 8, 6, 5])) === null, '선 방향(점 다섯부터 · 두 주 이어서 같은 쪽일 때만 · 마지막 한 점만 떨어지면 그대로)');
  { let fa = 0; for (let t = 0; t < 4000; t++) { const ys = Array.from({ length: 6 }, () => { let k = 0; for (let i = 0; i < 10; i++) if (Math.random() < 0.8) k++; return { ok: k, n: 10 }; }); if (W.weekTrend(ys) === 'down') fa++; } ok(fa / 4000 < 0.05, `변화 없는 아이를 '내려가요'로 잘못 짚는 비율(한 번 볼 때) ${(100 * fa / 4000).toFixed(1)}% < 5%`); }
  ok(W.lastLine(W.weeksOf(recs)).length === 1 && W.lastLine(W.weeksOf(recs))[0].term === 'T4-1', '학기가 바뀌면 새 선');
  ok(W.weekTerm({ recs, lastPrep: { unit: '4-2-1' } }) === 'T4-2' && W.weekTerm({ recs }) === 'T4-1', '점검 학기 = 마지막 준비 단원의 학기 → 없으면 지난 점검 학기');
  ok(!LX.UNITS.some((u) => u.id === 'T4-2'), "학기 표시('T4-2')는 단원 id와 겹치지 않음(홈의 '오늘 단원 준비했나'를 건드리지 않음)");
  const pool = W.termPool('T4-1'), units = LX.UNITS.filter((u) => u.g === '4-1');
  ok(pool.length >= 10 && pool.every((c) => units.some((u) => PP.prepPlan(u.id).pre.includes(c)) && LX.gradeIdx(LX.byId[c].g) < LX.gradeIdx('4-1') && LX.gradeIdx(LX.byId[c].g) >= LX.gradeIdx('4-1') - 3), `4학년 1학기 범위 = 단원 ${units.length}개 준비 칸 가운데 지난 세 학기 ${pool.length}칸(이번 학기 · 먼 학기 X)`);
  ok(W.termPool('T5-2').length >= 10 || W.termPool('T5-2').length === PP.prepPlan('5-2-1').pre.length, `칸이 모자라면 한 학기씩 넓힘(T5-2 ${W.termPool('T5-2').length}칸)`);
  const K = { recs: {}, lastPrep: { unit: '4-1-3' }, fixed: {} }, rep = { L: {} };
  const p1 = W.weekPlan(K, rep);
  const cur = W.curPool('T4-1');
  ok(p1.length === 10 && new Set(p1).size === 10 && p1.filter((c) => cur.includes(c)).length === 6 && p1.filter((c) => pool.includes(c)).length === 4, `이번 학기 여섯 + 앞 학기 기초 넷 = 서로 다른 10칸(${p1.filter((c) => cur.includes(c)).length} + ${p1.filter((c) => pool.includes(c)).length})`);
  const gi = LX.gradeIdx, LES = (await import('../../paper/js/gen.js')).LES, grades = (p) => p.map((c) => gi(LES(c).g)).join('');
  ok(grades(p1.filter((c) => pool.includes(c))) === [...grades(p1.filter((c) => pool.includes(c)))].sort().join(''), `기초 칸은 학년 차례로 고르게 — ${grades(p1)}`);
  ok(W.weekChart(ws).includes('<polyline') && W.weekChart(ws.slice(0, 1)).includes('<circle') && !W.weekChart(ws.slice(0, 1)).includes('<polyline'), '선 그래프(점 하나면 선 없이)');
  const mk = W.weekChart(ws, { marks: [{ t: d0 + 1.5 * wk, x: '소집단' }, { t: d0 - 30 * 864e5, x: '너무 옛날' }] });
  ok((mk.match(/stroke-dasharray/g) || []).length === 1 && !W.weekChart(ws).includes('stroke-dasharray'), '지도를 바꾼 때 = 점선 하나(선보다 한참 앞은 뺌)');
}
// ⑩ 종이 결과 → 아이 기록 — 문장제 칸은 빼고 · 채점 안 한 장은 X · 큰 장은 칸 덩이로 나눠 8000자 안 · 바꾼 기록으로 판정해도 종이에서 판정한 것과 칸 상태가 같음 · 번호 짐작
{
  const T = await import('../js/teacher.js'), G = await import('../../paper/js/gen.js'), J = await import('../../paper/js/judge.js'), KS2 = await import('../js/kidstore.js');
  for (const [from, to, kind, seed] of [['2-1', '3-1', 'gate', 7], ['1-1', '4-1', 'gate', 3], ['1-1', '4-1', 'check', 2]]) {
    const sh = G.makeSheet({ kind, from, to, id: 'PAPER' + seed, seed });
    const r = { done: Object.fromEntries(sh.chapters.map((c) => [c.key, true])), it: {}, w: {}, t: {}, at: Date.now() };
    sh.items.forEach((it, i) => { if (it.form === 'w') r.w[it.k] = { f: 1, a: 0 }; else r.it[it.k] = i % 4 === 1 ? { s: 'x', a: ['1'], t: 5 } : { s: 'ok', t: 5 }; });
    const recs = T.paperRecs(sh, r, 'P' + seed + '_kid1'), sizes = recs.map((x) => db.enc(x).length);
    const nIt = recs.reduce((a, x) => a + x.s.it.length, 0), nSh = sh.items.filter((it) => it.form !== 'w').length;
    ok(recs.length && recs.every(KS2.okRec) && sizes.every((n) => n <= 8000) && nIt === nSh && !recs.some((x) => x.s.it.some((i) => i[4] === 'W')), `${kind} ${from}~${to}: ${nSh}문제 → 기록 ${recs.length}개(가장 긴 것 ${Math.max(...sizes)}자 ≤ 8000) · 문장제 칸 뺌`);
    const sh2 = { ...sh, items: sh.items.filter((it) => it.form !== 'w'), chapters: sh.chapters.filter((c) => c.key !== 'W') };
    const a = J.kidReport([sh2], { [sh.id]: { me: { ...r, w: {} } } }, 'me', { from: '1-1', to: '6-2' }), b = KS2.reportOf({ recs: Object.fromEntries(recs.map((x) => [x.s.id, x])) });
    const diff = Object.keys({ ...a.L, ...b.L }).filter((c) => (a.L[c] || {}).st !== (b.L[c] || {}).st);
    ok(!diff.length && Object.keys(b.L).length > 0 && a.start.map((x) => x.c).join() === b.start.map((x) => x.c).join(), `${kind} ${from}~${to}: 종이 판정과 앱 판정의 칸 상태 · 고칠 판자가 같음(${Object.keys(b.L).length}칸${diff.length ? ` · 다름 ${diff.slice(0, 5).join(',')}` : ''})`);
  }
  ok(T.paperRecs(G.makeSheet({ kind: 'gate', from: '2-1', to: '3-1', id: 'X', seed: 1 }), { done: {}, it: {} }).length === 0, '채점 안 한 장은 넣지 않음');
  const K = { n: 25, names: { 7: '하늘', 12: '바다' } };
  ok(T.guessNo('3번', K) === '3' && T.guessNo('12 바다', K) === '12' && T.guessNo('하늘', K) === '7' && T.guessNo('구름', K) === '' && T.guessNo('31', K) === '', '번호 짐작(번호 · 이름 · 없음 · 반 밖)');
}
// ⑪ 선생님 AI 묻기 글 — 막힌 칸 · 틀린 문항(아이 답 · 바른 답) · 엔진 원인이 들어감 · 이름 칸 없음 · 너무 길지 않음
{
  const CP = await import('../js/copilot.js'), P2 = await import('../js/prep.js'), G2 = await import('../../paper/js/gen.js');
  const S = P2.newPrep({ unit: '2-2-2', id: 'AIQ' });
  let it; while ((it = P2.current(S))) P2.answer(S, G2.closure(it.c).has('2-1-6:3') ? (it.snap.choices ? { vals: [(Number(it.snap.sol[0]) + 1) % it.snap.choices.length], raws: [String((Number(it.snap.sol[0]) + 1) % it.snap.choices.length)] } : { vals: it.snap.sol.map((v) => Number(v) + 1), raws: it.snap.sol.map((v) => String(Number(v) + 1)) }) : { vals: it.snap.sol.map(Number), raws: it.snap.sol.map(String) });
  const rep = P2.report(S), pk = CP.packetOf(rep, { cal: { n: 9, m: 0.7 }, sw: { '2-1-6:3': 2 }, rush: 0 }, { unit: '덧셈과 뺄셈', weeks: [{ ok: 6, n: 10 }, { ok: 7, n: 10 }] });
  const q = CP.promptOf('7', pk);
  ok(pk.먼저_배울_차시.length && pk.먼저_배울_차시[0].틀린_문항.length && pk.먼저_배울_차시[0].틀린_문항[0].mine && pk.먼저_배울_차시[0].틀린_문항[0].right, `먼저 배울 차시 · 틀린 문항(내 답 · 바른 답) — ${pk.먼저_배울_차시.map((x) => x.칸).join(', ')}`);
  ok(q.includes('7번 아이(이름 X)') && !/이름[":]\s*"/.test(q) && q.length < 6000 && q.includes('모름'), `붙여 넣을 글 ${q.length}자 · 이름 칸 없음`);
}
// ⑫ 다듬기 기록이 많아도 서버 규칙(mx 6만 자) 안 — 판마다 최근 기록만 보냄 · 표(tier)는 그대로
{
  const KS3 = await import('../js/kidstore.js'), LX3 = await import('../../engine/lessons/index.js');
  const ids = LX3.NODES.map((n) => n.id).filter((c) => LX3.byId[c]).slice(0, 200), mx = {};
  ids.forEach((c, i) => { mx[c] = { tier: i % 4, t2: 1730000000000, best: { ok: 6, n: 6, med: 4321, total: 30000 }, runs: Array.from({ length: 10 }, (_, j) => ({ t: 1730000000000 + j * 864e5, ok: 5, n: 6, med: 4000 + j })) }; });
  const v = KS3.mxOut({ mx, jog: Array.from({ length: 80 }, (_, i) => `2026-10-${String(i % 28 + 1).padStart(2, '0')}`), tools: {} }), o = JSON.parse(v);
  ok(v.length <= 60000 && Object.keys(o).filter((c) => !c.startsWith('_')).length === 200 && o[ids[3]].tier === 3 && o._jog.length <= 60, `판자 200개 다듬은 아이: 보낼 글 ${v.length}자 ≤ 60000 · 표 그대로 · 판마다 기록 ${o[ids[0]].runs.length}개`);
}
// ⑬ 시범 운영 숫자 — 선생님 CSV(csvRows) 두 장 → tools/pilot.mjs 표 · 이름 없음 · 주간 기울기 · 형성평가(오른 폭 · 편향 경고)
{
  const T = await import('../js/teacher.js'), PL = await import('../../tools/pilot.mjs');
  const K = { n: 3, names: { 1: '하늘' } };
  const st = (o) => ({ st: { L: {}, start: [], below: [], under: [], sw: {}, fixed: {}, help: {}, due: [], t: Date.now(), last: Date.now(), cal: { n: 10, m: 0.6 }, rush: 0, mx: {}, mis: {}, story: {}, tools: {}, jog: [], wk: [], ...o } });
  const S1 = { 1: st({ start: ['2-1-6:3'], cal: { n: 10, m: 0.5 }, wk: [{ wk: '2026-10-19', ok: 5, n: 10 }] }), 2: st({}) };
  const S2 = { 1: st({ fixed: { '2-1-6:3': 1 }, cal: { n: 20, m: 0.7 }, mx: { '2-1-6:3': 2 }, wk: [{ wk: '2026-10-19', ok: 5, n: 10 }, { wk: '2026-10-26', ok: 7, n: 10 }, { wk: '2026-11-02', ok: 8, n: 10 }] }), 2: st({ cal: { n: 15, m: 0.8 } }) };
  const f = (S, d) => ({ name: `튼튼수다리_ZZ_아이별_${d}.csv`, text: T.csvText(T.csvRows('ZZAAAA', K, S, '2-2-2')[0]) });
  const md = PL.report([f(S2, '2026-11-02'), f(S1, '2026-10-26')], '번호,사전,사후\n1,40,70\n2,80,85\n');
  const oldName = (x) => ({ ...x, text: x.text.replace('점검 칸 수', '준비 칸 수').replace('배워서 고친 것 수', '고친 판자 수').replace('매일 연습(7일)', '구보(7일)') });   /* 11-07 말 바꾸기 전에 받아 둔 CSV도 같은 숫자 */
  ok(PL.report([oldName(f(S2, '2026-11-02')), oldName(f(S1, '2026-10-26'))]).includes('배워서 고친 것(평균) 0 → 0.5'), '옛 머리 이름 CSV도 읽음');
  ok(md.includes('2026-10-26 ~ 2026-11-02') && md.includes('배워서 고친 것(평균) 0 → 0.5') && md.includes('짐작 맞은 정도 % 55 → 75') && /주당 기울기 평균 1\.5/.test(md) && md.includes('오른 폭 30') && md.includes('무작위로 나뉜 것이 아님') && !md.includes('하늘'), '시범 숫자: 날짜 차례 · 처음 → 마지막 · 주간 기울기 · 형성평가 오른 폭 · 이름 X');
}
// ⑭ 이야기 다리 10분 카드 — 유형 일곱 모두 예 셋 · 그 유형 · 같은 수 두 번 X · 셋째는 되도록 불일치 이야기
{
  const T = await import('../js/teacher.js'), SC = await import('../../engine/schema.js');
  const bad = [];
  for (const ty of Object.keys(SC.TYPES)) for (const seed of [3, 17]) {
    const ex = T.storyExamples(ty, 3, seed);
    if (ex.length !== 3 || ex.some((p) => p.sc.type !== ty)) bad.push(`${ty}/${seed}:${ex.length}`);
    ex.forEach((p) => { const vs = Object.entries(p.sc.v || {}).filter(([k, v]) => k !== 'x' && v != null).map(([, v]) => JSON.stringify(v)); if (new Set(vs).size < vs.length) bad.push(`${ty} 같은 수`); });
  }
  ok(!bad.length, `유형 일곱 × 두 번: 예 셋씩 · 같은 수 없음${bad.length ? ` — ${bad.join(' ')}` : ''}`);
}
// ⑮ 이번 주 점검 묶음은 판정에 들어가지 않음 — 준비 다리에서 3/3 '확인'된 칸이 점검 한 문제 틀림으로 흔들리지 않게
{
  const KS4 = await import('../js/kidstore.js'), G4 = await import('../../paper/js/gen.js');
  const mk = (kind, id, ok, made) => { const sh = G4.makeSheet({ kind, words: false, id, lessons: [{ c: '2-1-3:5', n: kind === 'week' ? 1 : 3 }], mixed: true }); sh.items = sh.items.filter((it) => it.ch !== 'END'); sh.chapters = sh.chapters.filter((c) => c.key !== 'END'); sh.made = made; if (kind === 'week') sh.unit = 'T3-1'; return { s: KS4.pack(sh), r: { done: Object.fromEntries(sh.chapters.map((c) => [c.key, true])), it: Object.fromEntries(sh.items.map((it) => [it.k, ok ? { s: 'ok' } : { s: 'x', a: ['1'] }])) }, cf: {}, ms: {} }; };
  const K = { recs: { P1: mk('prep', 'P1', true, Date.now() - 864e5), W1: mk('week', 'W1', false, Date.now()) } };
  const st = KS4.reportOf(K).L['2-1-3:5'];
  ok(st && st.st === 'ok' && st.tot === 3, `점검에서 틀려도 판정은 그대로 '${st && st.st}'(${st && st.tot}문제)`);
}
// ⑯ 준비 다리 한 판 = 선생님이 고른 길이 안(12 · 기본 18 · 24 — 11-05 길게 36 없앰) · 막힌 칸이 넷 넘으면 일찍 '선생님과 같이'(teacher) · 다음 판은 지난 기록과 이어 감(물었던 바깥 칸을 다시 묻지 않음)
{
  const P6 = await import('../js/prep.js');
  ok(P6.PREP.budget === 18 && P6.LEN.join() === '12,18,24' && P6.newPrep({ unit: '2-1-3', id: 'L', budget: 12 }).budget === 12 && P6.newPrep({ unit: '2-1-3', id: 'L1', budget: 36 }).budget === 18 && P6.newPrep({ unit: '2-1-3', id: 'L2', budget: 99 }).budget === 18, `한 판 길이 기본 ${P6.PREP.budget} · 고른 길이(12) 따름 · 없앤 36 · 이상한 값은 기본`);
  const wrong = (it) => (it.snap.choices ? { vals: [(Number(it.snap.sol[0]) + 1) % it.snap.choices.length], raws: [String((Number(it.snap.sol[0]) + 1) % it.snap.choices.length)] } : { vals: it.snap.sol.map((v) => Number(v) + 7), raws: it.snap.sol.map((v) => String(Number(v) + 7)) });
  const S = P6.newPrep({ unit: '2-1-3', id: 'WEAK' });
  let it, n = 0; while ((it = P6.current(S)) && n++ < 60) P6.answer(S, wrong(it));
  ok(S.done && S.why === 'teacher' && P6.asked(S) <= S.budget && P6.stuckHere(S) >= 4, `다 틀리는 아이: ${P6.asked(S)}문항에서 '${S.why}'로 멈춤(막힌 칸 ${P6.stuckHere(S)})`);
  const first = new Set(S.sheets[0].items.map((x) => x.c));
  const S2 = P6.newPrep({ unit: '2-1-3', id: 'WEAK2', prior: { sheets: S.sheets, res: S.res } });
  const again = S2.sheets.length ? S2.sheets[0].items.filter((x) => first.has(x.c) && x.gate).length : 0;
  ok(!S2.done && S2.sheets.length && !again, `다음 판은 이어서 — 첫 묶음에 지난번 바깥 칸 ${again}개`);
  const C = P6.newPrep({ unit: '2-1-3', id: 'GOOD' });
  while ((it = P6.current(C))) P6.answer(C, { vals: it.snap.sol.map(Number), raws: it.snap.sol.map(String) });
  ok(P6.asked(C) <= 18 && C.why !== 'teacher', `다 맞히는 아이: ${P6.asked(C)}문항 · 끝 '${C.why}'`);
}
// ⑰ 단계 없는 칸도 '시범 → 함께 → 혼자'(11-07 engine/hints가 단계를 더해 단계 없는 칸이 60 → 41) — 시범 다음은 늘 함께 · 함께는 튼튼이가 일부를 해 줌(보기는 지움 · 빈칸 여럿은 마지막만 · 하나는 첫 생각) · 앞 빈칸 답이 마지막과 같으면 채워 주지 않음
{
  const FX = await import('../js/fix.js'), LX = await import('../../engine/lessons/index.js'), TK = await import('../../engine/tokens.js');
  let none = 0, bad = [];
  for (const n of LX.NODES) {
    if (!LX.byId[n.id]) continue;
    const F = FX.newFix({ c: n.id, id: 'T17' });
    if (F.steps.length) continue;
    none++;
    let g = 0; while (F.phase === 'show' && g++ < 20) FX.showNext(F);
    const A = F.assist, nb = F.cur.choices ? 0 : TK.blankCount(F.cur.prompt);
    if (F.phase !== 'together') bad.push(`${n.id}:${F.phase}`);
    else if (!F.curSteps.length && !A) bad.push(`${n.id}:도움 없음`);
    else if (A && A.kind === 'pick' && !(A.hide.length && !A.hide.includes(Number(F.cur.sol[0])))) bad.push(`${n.id}:지운 보기`);
    else if (A && A.kind === 'given' && (Object.keys(A.given).length !== nb - 1 || Object.values(A.given).map(String).includes(String(F.cur.sol[nb - 1])))) bad.push(`${n.id}:채운 빈칸`);
  }
  ok(none > 30 && !bad.length, `단계 없는 칸 ${none}개: 시범 → 함께(튼튼이가 일부) ${bad.length ? `— ${bad.slice(0, 6).join(' ')}` : ''}`);
}
// ⑱ 혼자에서 세 번 내리 틀리면 함께로 한 번 · 또 세 번이면 확인 없이 '선생님과 같이'(아홉 번 내리 틀리지 않음)
{
  const FX = await import('../js/fix.js');
  const F = FX.newFix({ c: '2-2-2:4', id: 'T18' });
  const bad = () => ({ vals: F.cur.sol.map((v) => Number(v) + 1), raws: F.cur.sol.map((v) => String(Number(v) + 1)) });
  let g = 0; while (F.phase === 'show' && g++ < 20) FX.showNext(F);
  const sol = () => ({ vals: F.cur.sol.map(Number), raws: F.cur.sol.map(String) });
  if (F.assist) { const s = sol(); FX.answerItem(F, s.vals, s.raws); } else { while (F.curSteps[F.si]) FX.togetherStep(F, F.curSteps[F.si].sol); const s = sol(); FX.answerItem(F, s.vals, s.raws); }
  const seen = [];
  for (let k = 0; k < 12 && F.phase !== 'done' && F.phase !== 'check'; k++) {
    if (F.phase === 'together') { seen.push('함께'); const s = sol(); if (F.assist) FX.answerItem(F, s.vals, s.raws); else { while (F.curSteps[F.si]) FX.togetherStep(F, F.curSteps[F.si].sol); FX.answerItem(F, s.vals, s.raws); } continue; }
    if (F.reStep) FX.afterReStep(F);
    const b = bad(); const r = FX.answerItem(F, b.vals, b.raws); seen.push(r.back ? '돌아감' : r.help ? '선생님' : '틀림');
  }
  ok(F.phase === 'done' && F.help && !F.passed && !F.check && F.solo.n === 6, `혼자 흐름: ${seen.join(' → ')} · 확인 문제 없음`);
}
// ⑲ 시범 · 함께 · 틀린 뒤 말은 그 문제 숫자로 — 힌트의 다른 숫자 예('3씩 4묶음' · '한 명이 4개씩')를 붙이지 않음 · 셈 사실은 그 문제 수로 이어 세기 · 뺄셈에 '받아올림'이라 하지 않음
{
  const FX = await import('../js/fix.js'), LX = await import('../../engine/lessons/index.js'), G9 = await import('../../paper/js/gen.js'), M9 = await import('../../engine/math.js'), TK = await import('../../engine/tokens.js');
  const KEEP = new Set(['0', '1', '2', '10', '100', '1000', '10000', '0.1', '0.01', '0.001']);
  const bad = [];
  for (const n of LX.NODES) {
    if (!LX.byId[n.id]) continue;
    for (let k = 0; k < 3; k++) {
      const [it] = G9.pickItems(n.id, 1, M9.rng(31 + k), new Set()); if (!it) continue;
      const rule = FX.ruleFor(n.id, it), txt = TK.toText(it.prompt);
      for (const t of rule.match(/\d+(?:\.\d+)?(?:만|억|조)?(?:씩|배|단)?/g) || []) if (/[씩배단]$/.test(t) ? !txt.includes(t) : !KEEP.has(t)) bad.push(`${n.id}:${t}`);
    }
  }
  ok(!bad.length, `방법 한 줄에 이 문제와 다른 수가 없음${bad.length ? ` — ${bad.slice(0, 6).join(' ')}` : ''}`);
  const io = G9.itemOf;
  ok(FX.factTalk(io('2-2-2:4', { a: 6, b: 4 }), true).includes('6, 12, 18, 24') || FX.factTalk(io('2-2-2:4', { a: 6, b: 4 }), true).includes('4, 8, 12'), `곱셈구구 시범: ${FX.factTalk(io('2-2-2:4', { a: 6, b: 4 }), true)}`);
  const sub = G9.pickItems('2-1-3:6', 1, M9.rng(5), new Set())[0];
  ok(sub && /받아내림/.test(FX.mergeTip(sub)) && !/받아올림/.test(FX.mergeTip(sub)), `뺄셈 단계 합치기 말: ${sub && FX.mergeTip(sub)}`);
  ok(FX.blankTalk({ prompt: ['5씩 뛰어 세어 보세요. ', '5, 10, ', { b: 0 }, ', ', { b: 1 }], sol: [15, 20] }, 1) === '5씩 커져요. 15 다음은 20.', '뛰어 세기 빈칸은 그 문제 수로');
}
// ⑳ 오늘 할 일 — 준비했나는 lastPrep 시각으로(문제 0개로 끝난 판도 '했음') · '선생님과 같이 로 멈춤'은 맨 위 '선생님과 같이 봐요' · 다음 날엔 '이어서 찾기' · 판자는 예시 문제로 부름
{
  const KD = await import('../js/kid.js'), KS5 = await import('../js/kidstore.js');
  const now = Date.now(), K0 = (o) => ({ recs: {}, rv: {}, fixed: {}, log: [], inbox: { a1: { kind: 'prep', unit: '4-1-3', t: now - 60000 } }, ...o });
  const rep0 = KS5.reportOf(K0({}));
  ok(KD.todoOf(K0({}), rep0)[0].title === '오늘 단원 점검', '단원을 열면 맨 위가 오늘 단원 점검');
  ok(!KD.todoOf(K0({ lastPrep: { unit: '4-1-3', why: 'clear', t: now - 1000 } }), rep0).some((x) => x.title === '오늘 단원 점검'), "문제 0개로 끝난 판(기록 없음)도 '했음'");
  const P7 = await import('../js/prep.js');
  const S = P7.newPrep({ unit: '2-1-3', id: 'TD' }); let it;
  while ((it = P7.current(S))) P7.answer(S, { vals: it.snap.sol.map((v) => Number(v) + 7), raws: it.snap.sol.map((v) => String(Number(v) + 7)) });
  const recs = {}; for (const sh of S.sheets) { sh.unit = '2-1-3'; recs[sh.id] = { s: KS5.pack(sh), r: S.res[sh.id].me, cf: {}, ms: {} }; }
  const Kt = K0({ inbox: {}, recs, lastPrep: { unit: '2-1-3', why: S.why, t: now } }), rept = KS5.reportOf(Kt), td = KD.todoOf(Kt, rept);
  ok(S.why === 'teacher' && td[0].kind === 'help' && td[0].cs.length >= 1 && td[0].cs.length <= 3, `'선생님과 같이'로 멈춘 날: 맨 위 '${td[0].title}' · 같이 볼 문제 ${td[0].cs.length}개`);
  const Ky = { ...Kt, lastPrep: { ...Kt.lastPrep, t: now - 864e5 * 1.5 } }, ty = KD.todoOf(Ky, KS5.reportOf(Ky));
  ok(ty[0] && (ty[0].title === '오늘 단원 점검 이어서' || ty[0].kind === 'fix') && ty.some((x) => x.title === '오늘 단원 점검 이어서') && !ty.some((x) => x.kind === 'help'), `다음 날엔 '선생님과 같이' 대신 찾은 판자 고치기 · 이어서 찾기(${ty.map((x) => x.title).join(' · ')})`);
  ok(!td.concat(ty).some((x) => /— (10에서 빼기|한 자리 수 빼기)$/.test(x.title)), '판자 할 일 이름은 예시 문제로');
}
// ㉑ '빠르게'는 셈 사실 칸만 — 큰 수 · 비교 같은 칸은 정확 → (3일 뒤) 오래 · 셈 사실은 그대로 정확 → 빠르게 → 오래
{
  const G5 = await import('../js/stage.js');
  ok(G5.isFact('2-2-2:4') && G5.isFact('1-2-6:4') && G5.isFact('3-1-3:6') && !G5.isFact('4-1-1:3') && !G5.isFact('2-1-1:7') && !G5.isFact('3-1-6:6'), '셈 사실 칸(구구 · 한 자리 받아내림 · 구구단으로 나누기) / 아닌 칸(큰 수 · 비교 · 분수)');
  const c = '4-1-1:3', mx = {}, t0 = Date.now(), n = G5.drillN(c), day = 864e5;
  G5.applyRun(mx, c, { n, ok: n, med: 500, total: 1 }, t0);
  ok(mx[c].tier === 1, `셈 사실이 아닌 칸은 아주 빨라도 '빠르게' X (표 ${mx[c].tier})`);
  G5.applyRun(mx, c, { n, ok: n, med: 99999, total: 1 }, t0 + day);
  ok(mx[c].tier === 1, '하루 뒤엔 아직');
  const g = G5.applyRun(mx, c, { n, ok: n, med: 99999, total: 1 }, t0 + 3 * day + 1000);
  ok(mx[c].tier === 3 && g.gained.join() === '오래', `3일 뒤 그대로 정확하면 오래(느려도) — 얻은 표 ${g.gained.join()}`);
  ok(G5.tiersOf(c).join() === '1,3' && G5.tiersOf('2-2-2:4').join() === '1,2,3', '표 칸: 정확 · 오래 / 정확 · 빠르게 · 오래');
}
// ㉒ 매일 연습은 오늘 이미 푼 칸을 내지 않음(11-07 · 예전엔 뒤로만) — 마지막으로 푼 때에 모든 기록 시각
{
  const RN = await import('../js/run.js'), G6 = await import('../../paper/js/gen.js'), KS6 = await import('../js/kidstore.js');
  const now = Date.now(), day = 864e5;
  const mk = (c, made) => { const sh = G6.makeSheet({ kind: 'prep', words: false, id: 'R' + made, lessons: [{ c, n: 3 }], mixed: true }); sh.items = sh.items.filter((x) => x.ch !== 'END'); sh.chapters = sh.chapters.filter((x) => x.key !== 'END'); sh.made = made; return { s: KS6.pack(sh), r: { done: Object.fromEntries(sh.chapters.map((x) => [x.key, true])), it: Object.fromEntries(sh.items.map((x) => [x.k, { s: 'ok' }])) }, cf: {}, ms: {} }; };
  const K = { recs: { a: mk('2-2-2:4', now - 60000), b: mk('2-2-2:3', now - 5 * day) }, rv: {}, fixed: {}, mx: { '2-2-2:4': { tier: 1, runs: [] }, '2-2-2:3': { tier: 1, runs: [] } } };
  const plan = RN.runPlan(K, now);
  ok(plan[0] === '2-2-2:3' && !plan.includes('2-2-2:4'), `오늘 이미 푼 칸은 매일 연습에서 뺌(11-07) — ${plan.join(' · ')}`);
}
// ㉓ 판자 부르기 = 예시 문제 — 그림 없음 · 짧음 · 같은 칸은 늘 같은 예
{
  const FX = await import('../js/fix.js'), LX = await import('../../engine/lessons/index.js');
  const xs = LX.NODES.filter((n) => LX.byId[n.id]).map((n) => [n.id, FX.exampleOf(n.id)]);
  ok(xs.filter(([, x]) => x).length >= 180 && xs.every(([, x]) => !x.includes('[그림]') && x.length <= 34) && xs.every(([c, x]) => FX.exampleOf(c) === x), `예시 문제가 있는 칸 ${xs.filter(([, x]) => x).length}/${xs.length} · 예: ${FX.exampleOf('1-2-4:5')}`);
}
// ㉔ 코덱스 11-07 — 점검지 · 보충만 푼 새 아이도 매일 연습이 생김(판정된 칸) · 오늘 푼 것뿐이면 '내일부터'(later)
{
  const RN = await import('../js/run.js'), G7 = await import('../../paper/js/gen.js'), KS7 = await import('../js/kidstore.js');
  const now = Date.now(), day = 864e5;
  const mk = (c, made) => { const sh = G7.makeSheet({ kind: 'prep', words: false, id: 'Q' + made, lessons: [{ c, n: 3 }], mixed: true }); sh.items = sh.items.filter((x) => x.ch !== 'END'); sh.chapters = sh.chapters.filter((x) => x.key !== 'END'); sh.made = made; return { s: KS7.pack(sh), r: { done: Object.fromEntries(sh.chapters.map((x) => [x.key, true])), it: Object.fromEntries(sh.items.map((x) => [x.k, { s: 'ok' }])) }, cf: {}, ms: {} }; };
  const one = (x) => ({ [x.s.id]: x });   /* 기록 id = 묶음 id(addSheet와 같게 — 판정이 이 id로 결과를 찾음) */
  const K = { recs: one(mk('2-2-2:3', now - 3 * day)), rv: {}, fixed: {}, mx: {} };
  const p0 = RN.runPlan(K, now), p1 = RN.runPlan(K, now, KS7.reportOf(K));
  ok(!p0.length && p1.includes('2-2-2:3'), `판정을 주면 점검에서 맞힌 칸이 매일 연습 후보 — 없이 ${p0.length} · 판정 ${p1.join(' · ')}`);
  const K2 = { recs: one(mk('2-2-2:3', now - 60000)), rv: {}, fixed: {}, mx: {} }, p2 = RN.runPlan(K2, now, KS7.reportOf(K2));
  ok(!p2.length && p2.later >= 1, `오늘 점검한 칸뿐이면 비고 later ${p2.later}(화면: '내일부터 나와요')`);
}
// ㉕ 묶음 바꾸기 움직임(model.js regroupHTML · docs/motion.md ① ②) — 문제 숫자 그대로 · 끝 모습 · 세로셈 표시가 같은 때에(lag)
{
  const MD = await import('../js/model.js'), G8 = await import('../../paper/js/gen.js'), RR = await import('../../engine/math.js'), FX8 = await import('../js/fix.js');
  const find = (c) => { for (let k = 0; k < 40; k++) { const [x] = G8.pickItems(c, 1, RR.rng(500 + k), new Set()); if (x && MD.regroupHTML(x)) return x; } return null; };
  const sub = find('2-1-3:7'), add = find('2-1-3:3');
  const cnt = (h, cls) => (h.match(new RegExp(`class="${cls}"`, 'g')) || []).length;
  const hs = MD.regroupHTML(sub), hp = MD.regroupHTML(sub, { pre: true }), ha = MD.regroupHTML(add, { anim: true });
  ok(cnt(hs, 'c-new') === 10 && hs.includes('rg-re') && !hp.includes('rg-re') && hp.includes(' pre'), '뺄셈: 새 낱개 10개 · 끝 모습에 다시 보기 · 바꾸기 전엔 다시 보기 없음');
  ok(cnt(ha, 'go') === 10 && cnt(ha, 'rod-new') === 1 && ha.includes(' anim'), '덧셈: 모여 십 막대가 되는 낱개 10개 · 새 십 막대 1개');
  ok(!MD.regroupHTML({ prompt: ['3', '+', '4', '=', '□'], sol: [7] }) && MD.rgLag(sub).mk === 600 && MD.rgLag(add).put === 1300, '받아올림 · 받아내림이 없으면 그리지 않음 · 늦춤 시각');
  const C = MD.colOf(sub, FX8.stepsOf({ c: sub.c, p: sub.p }));
  const v1 = MD.colView(C, 1, MD.rgLag(sub)).html, v0 = MD.colView(C, 1).html;
  ok(C && v1.includes('class="lag"') && v1.includes('x lag') && !v0.includes('lag'), '세로셈: 첫 단계의 빗금 · 위 숫자 · 답만 늦게 나타남(lag 없으면 그대로)');
  /* 11-07 처음 보는 눈: 덧셈은 모으면 칸으로(처음 수의 줄에 붙이지 않음) · 뺄셈 끝 모습에 낱개 묶음 수 · 글은 움직임과 같은 때에 */
  const h29 = MD.regroupHTML({ prompt: ['29 + 69 = ', { b: 0 }], sol: [98] }), h93 = MD.regroupHTML({ prompt: ['93 − 89 = ', { b: 0 }], sol: [4] });
  ok(cnt(h29, 'mv') === 8 && cnt(h29, 'go') === 10 && h29.includes('>모으면<') && h29.includes('class="c0"') && h29.includes('십의 자리로 올려요'), '덧셈 29 + 69: 낱개 18개가 모두 모으면 칸으로 · 10개는 십 막대 · 8개는 남음');
  ok(h93.includes('낱개 13개</text>') && h93.includes('class="c0" aria-hidden="true">낱개 3개에서 9개를 뺄 수 없어요.') && !MD.regroupHTML(sub, { pre: true }).includes('class="c0"'), '뺄셈 93 − 89: 끝 모습에 낱개 13개 묶음 · 움직이는 동안은 바꾸기 전 글');
  const HI = await import('../../engine/hints/index.js'), TK8 = await import('../../engine/tokens.js');
  const pl = JSON.stringify(HI.planOf(sub.c, sub.p, FX8.stepsOf({ c: sub.c, p: sub.p }).length) || []);
  ok(pl.includes('받아내려') && !pl.includes('윗자리'), `풀이 순서에 '윗자리' 대신 가져오는 자리 이름 — ${pl}`);
  let odd = 0;
  for (let k = 0; k < 30; k++) { const F = FX8.newFix({ c: '2-1-3:7', id: `zz${k}` }), A = TK8.toText(F.ex.prompt).match(/\d+/g) || []; if (A.length >= 2 && String(F.ex.sol[0]).length !== Math.max(A[0].length, A[1].length)) odd++; }
  ok(odd === 0, `배우기 시범 문제는 보통 꼴(답의 맨 앞 0 · 자리 늘어남 X) — 30번 중 ${odd}번`);
}
// ㉖ 차별점을 증거로(11-07) — 보충에 섞은 함정 문항(그 생각으로 풀면 틀리는 꼴)을 첫 답에 몇 개 맞혔나가 기록 · 요약까지 감
{
  const GV = await import('../js/give.js'), KS9 = await import('../js/kidstore.js');
  const task = { kind: 'give', sk: 's.d22', n: 10, seed: 7, t: Date.now(), want: { '2-1-3:7': 'sub.borrow' } };
  const sh = GV.giveSheet('gvZZTRAP1', task), T = sh.items.filter((x) => x.tr);
  ok(T.length >= 1 && T.length < sh.items.length, `함정 꼴이 섞임(${T.length}/${sh.items.length})`);
  const R = { done: { G: true }, it: Object.fromEntries(sh.items.map((x) => [x.k, { s: 'ok' }])) };
  sh.tr = [T.length, T.length];
  const K = { recs: { gvZZTRAP1: { s: KS9.pack(sh), r: R, cf: {}, ms: {} } }, fixed: {}, rv: {}, inbox: {}, mx: {}, lad: {} };
  const g = KS9.summaryOf(K).gv.gvZZTRAP1;
  ok(Array.isArray(g) && g.length === 5 && g[3] === T.length && g[4] === T.length, `요약 gv에 함정 맞힘 · 수 — ${JSON.stringify(g)}`);
  const plain = GV.giveSheet('gvZZTRAP2', { ...task, want: undefined });
  ok(!plain.items.some((x) => x.tr) && !('tr' in KS9.pack(plain)), '함정을 안 섞은 보충은 tr 없음');
}
// ㉗ 아이 자세히 '다음 할 것'(11-07 '교사도 안 헷갈리고 바로 다음 거') — 기록 없음 → 점검 · 막힌 차시 → 그 기능 보충 · 보낸 보충 푸는 중
{
  const T9 = await import('../js/teacher.js');
  const none = T9.nextOf({ C: 'ZZ', no: '3', rep: { L: {}, start: [] } });
  ok(/점검을 하지 않았어요/.test(none.t) && /check$/.test(none.href), `기록 없음 → 점검 내기 — ${none.t}`);
  const rep = { L: { '1-2-6:4': { c: '1-2-6:4', st: 'stuck' }, '2-1-3:7': { c: '2-1-3:7', st: 'stuck' } }, start: [] };
  const a = T9.nextOf({ C: 'ZZ', no: '3', rep });
  ok(/부족한 것/.test(a.t) && /give\?sk=/.test(a.href) && /who=3/.test(a.href), `막힌 차시 중 가장 아래 → 보충 주기 — ${a.t}`);
  const sk = a.href.match(/sk=([^&]+)/)[1], b = T9.nextOf({ C: 'ZZ', no: '3', rep, inbox: { gvZZ1: { kind: 'give', sk } } });
  ok(/푸는 중/.test(b.t) && !b.href, `보낸 보충을 푸는 중이면 기다림 — ${b.t}`);
}
console.log(fail ? `FAIL ${fail}` : 'PASS');
process.exitCode = fail ? 1 : 0;
