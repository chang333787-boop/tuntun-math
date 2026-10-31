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
  ok(W.weekTrend(pts([4, 6, 7, 8])) === 'up' && W.weekTrend(pts([8, 8, 6, 5])) === 'down' && W.weekTrend(pts([8, 7, 8, 7, 8, 7])) === 'flat' && W.weekTrend(pts([8, 8, 6])) === null, '선 방향(점 넷부터 · 기울기)');
  { let fa = 0; for (let t = 0; t < 4000; t++) { const ys = Array.from({ length: 5 }, () => { let k = 0; for (let i = 0; i < 10; i++) if (Math.random() < 0.8) k++; return { ok: k, n: 10 }; }); if (W.weekTrend(ys) === 'down') fa++; } ok(fa / 4000 < 0.09, `변화 없는 아이를 '내려가요'로 잘못 짚는 비율 ${(100 * fa / 4000).toFixed(1)}% < 9%`); }
  ok(W.lastLine(W.weeksOf(recs)).length === 1 && W.lastLine(W.weeksOf(recs))[0].term === 'T4-1', '학기가 바뀌면 새 선');
  ok(W.weekTerm({ recs, lastPrep: { unit: '4-2-1' } }) === 'T4-2' && W.weekTerm({ recs }) === 'T4-1', '점검 학기 = 마지막 준비 단원의 학기 → 없으면 지난 점검 학기');
  ok(!LX.UNITS.some((u) => u.id === 'T4-2'), "학기 표시('T4-2')는 단원 id와 겹치지 않음(홈의 '오늘 단원 준비했나'를 건드리지 않음)");
  const pool = W.termPool('T4-1'), units = LX.UNITS.filter((u) => u.g === '4-1');
  ok(pool.length >= 10 && units.every((u) => PP.prepPlan(u.id).pre.filter((c) => LX.byId[c] && LX.gradeIdx(LX.byId[c].g) < LX.gradeIdx('4-1')).every((c) => pool.includes(c))) && pool.every((c) => LX.gradeIdx(LX.byId[c].g) < LX.gradeIdx('4-1')), `4학년 1학기 범위 = 단원 ${units.length}개 준비 칸 가운데 지난 학기까지 ${pool.length}칸(이번 학기 칸 X)`);
  const K = { recs: {}, lastPrep: { unit: '4-1-3' }, fixed: {} }, rep = { L: {} };
  const p1 = W.weekPlan(K, rep);
  ok(p1.length === 10 && new Set(p1).size === 10 && p1.every((c) => pool.includes(c)), '학기 범위에서 서로 다른 10칸');
  const gi = LX.gradeIdx, LES = (await import('../../paper/js/gen.js')).LES, grades = (p) => p.map((c) => gi(LES(c).g)).join('');
  ok(grades(p1) === [...grades(p1)].sort().join(''), `학년 차례로 고르게 뽑음 — ${grades(p1)}`);
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
console.log(fail ? `FAIL ${fail}` : 'PASS');
process.exitCode = fail ? 1 : 0;
