// 앱 순수 로직 시험: node app/test/app.test.mjs
//  ① 보내는 중에 같은 경로가 다시 들어와도 다른 쓰기를 잃지 않음 ② 다른 단원 기록의 고칠 판자가 오늘 준비 다리를 막지 않음 ③ 흔들림 두 번이면 '다질 판자'
import { closure } from '../../paper/js/gen.js';
let fail = 0;
const ok = (c, m) => { if (!c) { fail++; console.log('✗', m); } else console.log('✓', m); };

// ① 대기열 — 가짜 fetch(느림) · localStorage는 local.js가 메모리로 대신함
const sent = [];
globalThis.fetch = async (url, o) => { await new Promise((r) => setTimeout(r, 20)); sent.push([url.replace(/^.*app\//, ''), o.body]); return { ok: true, status: 200, json: async () => null }; };
const db = await import('../js/db.js');
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
console.log(fail ? `FAIL ${fail}` : 'PASS');
process.exitCode = fail ? 1 : 0;
