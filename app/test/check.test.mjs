// 점검지(화면) 시험: node app/test/check.test.mjs
//  ① 같은 id면 같은 문제(종이 makeSheet와도 같음) ② 12문제씩 나뉨 ③ 푼 문항만 기록(안 푼 문항이 묶음에 들어가면 판정이 '맞음'으로 읽음)
//  ④ 일부러 틀린 칸만 흔들림 · 막힘 ⑤ 안 푼 칸은 '안 봄' ⑥ 아이 할 일(checkTasks) · 요약 st.ck
globalThis.fetch = async () => ({ ok: true, status: 200, json: async () => null });   /* 서버로 나가지 않게 */
const { makeSheet, closure } = await import('../../paper/js/gen.js');
const KS = await import('../js/kidstore.js');
const CKM = await import('../js/check.js');
let fail = 0;
const ok = (c, m) => { if (!c) { fail++; console.log('✗', m); } else console.log('✓', m); };
const sig = (sh) => JSON.stringify(sh.items.map((it) => [it.k, it.c, it.p, it.ch, it.gate, it.covers]));

const id = 'ck20261107TEST', from = '3-2', to = '4-1';
const paper = makeSheet({ kind: 'gate', from, to, words: false, id });
const task = { kind: 'check', id, from, to, words: false, n: paper.items.length, seed: paper.seed, t: Date.now() };
// ① 같은 문제
const A = CKM.checkSheet(id, task), B = CKM.checkSheet(id, { ...task, seed: null }), O = CKM.checkSheet('ck20261107OTHR', task);
ok(A && sig(A) === sig(B) && sig(A) === sig(paper), `같은 id → 같은 문제 · 종이 점검지와 같음(${A.items.length}문제 · seed 있든 없든)`);
ok(O && JSON.stringify(O.items.map((it) => it.p)) !== JSON.stringify(A.items.map((it) => it.p)), '다른 id → 다른 숫자');
ok(!CKM.checkSheet('bad_id', task) && !CKM.checkSheet(id, { ...task, from: '4-1', to: '3-2' }) && !CKM.checkSheet(id, { ...task, kind: 'prep' }), '이상한 과제(밑줄 id · 거꾸로 범위 · 다른 갈래)는 만들지 않음');

// ② 12문제씩
const N = A.items.length, sizes = [];
{ const done = new Set(); for (let g = 0; g < 20; g++) { const b = CKM.nextBatch(A, done); if (!b.length) break; sizes.push(b.length); b.forEach((it) => done.add(it.k)); } }
ok(sizes.length === Math.ceil(N / 12) && sizes.slice(0, -1).every((x) => x === 12) && sizes.reduce((a, b) => a + b, 0) === N, `12문제씩 나뉨 — ${sizes.join(' + ')} = ${N}`);

// ③ 푼 문항만 기록 — 한 칸(X)은 늘 틀리게, 나머지는 맞게 · 두 번 다 풀고 셋째 번은 5문제만 풀고 멈춤
const X = A.items.find((it) => it.gate && it.ch === A.items[0].ch && A.items.filter((y) => y.c === it.c).length === 3).c;
const wrong = (it) => (it.snap.choices ? { s: 'x', a: [String((Number(it.snap.sol[0]) + 1) % it.snap.choices.length)] } : { s: 'x', a: it.snap.sol.map((v) => String(Number(v) + 7)) });
const K = { recs: {}, rv: {}, fixed: {}, log: [], inbox: { [id]: task } };
const put = (b) => { const { sh, r } = CKM.batchRec(id, CKM.nextNo(K, id), b.items, b.R); K.recs[sh.id] = { s: KS.pack(sh), r, cf: {}, ms: {} }; return sh; };
const solve = (items, upto = items.length) => { const R = {}; items.slice(0, upto).forEach((it) => (R[it.k] = it.c === X ? wrong(it) : { s: 'ok' })); return { items, R }; };
ok(CKM.checkTasks(K).length === 1 && CKM.checkTasks(K)[0].left === N && CKM.checkTasks(K)[0].total === N && CKM.checkTasks(K)[0].href === `#/check/${id}`, `할 일 하나 — 남은 ${N} / 모두 ${N}`);
const b1 = put(solve(CKM.nextBatch(A, CKM.doneKs(K, id))));
const b2 = put(solve(CKM.nextBatch(A, CKM.doneKs(K, id))));
const third = CKM.nextBatch(A, CKM.doneKs(K, id));
const b3 = put(solve(third, 5));
const answered = 12 + 12 + 5;
ok(b1.id === `${id}_0` && b2.id === `${id}_1` && b3.id === `${id}_2`, `기록 id = <점검 id>_<번째> (${b1.id} · ${b2.id} · ${b3.id})`);
ok(b3.items.length === 5 && Object.keys(K.recs[b3.id].r.it).length === 5, '셋째 번 — 푼 5문제만 묶음에 들어감(안 푼 7문제는 없음)');
ok(Object.values(K.recs).every((x) => x.s.it.every((i) => x.r.it[i[0]])), '모든 묶음의 문항마다 결과가 있음');
ok(CKM.doneKs(K, id).size === answered && CKM.nextBatch(A, CKM.doneKs(K, id))[0].k === third[5].k, `이어서 — 푼 ${answered}문제 다음은 ${third[5].k}번부터`);
const un = KS.unpack(K.recs[b1.id].s), orig = Object.fromEntries(A.items.map((it) => [it.k, it]));
ok(un.items.every((it) => it.gate === !!orig[it.k].gate && JSON.stringify([...(it.covers || [])].sort()) === JSON.stringify([...(orig[it.k].covers || (orig[it.k].gate ? [...closure(it.c)] : []))].sort()) && JSON.stringify(it.p) === JSON.stringify(orig[it.k].p)), '묶음을 풀어도 원래 번호 · params · 관문 · 덮는 칸 그대로');

// ④ · ⑤ 판정
const rep = KS.reportOf(K);
const bad = Object.values(rep.L).filter((x) => x.st === 'shaky' || x.st === 'stuck').map((x) => x.c);
ok(bad.length === 1 && bad[0] === X, `일부러 틀린 칸만 흔들림 · 막힘 — ${bad.join(', ')} (${rep.L[X] && rep.L[X].st})`);
const seenC = new Set([...A.items.filter((it) => CKM.doneKs(K, id).has(it.k)).map((it) => it.c)]);
const untouched = [...new Set(A.items.map((it) => it.c))].filter((c) => !seenC.has(c));
const okCovers = new Set(Object.values(rep.L).filter((x) => x.st === 'ok' && x.gate).flatMap((x) => x.covers || []));
const shouldNone = untouched.filter((c) => !okCovers.has(c) && !(rep.L[X].covers || []).includes(c));
ok(shouldNone.length > 0 && shouldNone.every((c) => !rep.L[c] || rep.L[c].st === 'none'), `안 푼 칸 ${shouldNone.length}개는 '안 봄'(판정에 없음)`);
// 대조 — 안 푼 문항까지 묶음에 넣으면(하면 안 되는 것) 그 칸이 '맞음'으로 읽힘 → 이 시험이 그 실수를 잡는다
{
  const K2 = { recs: {}, rv: {}, fixed: {}, log: [] };
  const all = third, R = solve(third, 5).R, chs = [...new Set(all.map((it) => it.ch))];
  K2.recs.bad = { s: KS.pack({ id: 'bad', kind: 'ck', made: Date.now(), unit: null, items: all }), r: { done: Object.fromEntries(chs.map((c) => [c, true])), it: R }, cf: {}, ms: {} };
  const r2 = KS.reportOf(K2), ghost = all.slice(5).map((it) => it.c).filter((c) => !all.slice(0, 5).some((y) => y.c === c));
  ok(ghost.some((c) => r2.L[c] && (r2.L[c].st === 'ok' || r2.L[c].st === 'near')), `대조: 안 푼 문항을 넣으면 '맞음'으로 읽힘(${ghost.filter((c) => r2.L[c]).map((c) => `${c} ${r2.L[c].st}`).slice(0, 2).join(' · ')}) — 그래서 넣지 않음`);
}

// ⑥ 요약 · 할 일
const S = KS.summaryOf(K);
ok(S.ck[id] === answered, `요약 st.ck[${id}] = ${S.ck[id]} (푼 문항 수)`);
const T = CKM.checkTasks(K);
ok(T.length === 1 && T[0].left === N - answered && /남은 문제/.test(T[0].sub), `할 일 — 남은 ${T[0] && T[0].left}개 · '${T[0] && T[0].sub}'`);
{ let g = 0; while (g++ < 20) { const b = CKM.nextBatch(A, CKM.doneKs(K, id)); if (!b.length) break; put(solve(b)); } }
ok(CKM.checkTasks(K).length === 0 && KS.summaryOf(K).ck[id] === N, `다 풀면 할 일에서 빠짐 · 요약 ${KS.summaryOf(K).ck[id]}/${N}`);
// 다른 기기에서 푼 기록도 셈(기록이 정본) — 같은 기록을 다른 K에 옮겨도 진행이 같음
{ const K3 = { recs: JSON.parse(JSON.stringify(K.recs)), inbox: { [id]: task } }; ok(CKM.doneKs(K3, id).size === N && CKM.checkTasks(K3).length === 0, '다른 기기 기록(pull로 들어온 것)으로도 진행을 셈'); }
// ⑦ 하다가 나간 묶음(이 기기의 wip · 아직 기록 전)도 처음 화면에서 '이어서' · 남은 수에 넣음(11-07 '다시 들어와도 이어서')
{
  const mem = new Map(); globalThis.localStorage = { getItem: (k) => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, String(v)), removeItem: (k) => mem.delete(k) };
  localStorage.setItem('tt.me', JSON.stringify({ C: 'ZZCK', no: '2', pin: '0000' }));
  const ks3 = A.items.slice(0, 3).map((it) => it.k);
  localStorage.setItem('tt.ck.ZZCK.2', JSON.stringify({ id, items: A.items.slice(0, 12).map((it) => ({ k: it.k, c: it.c, p: it.p })), R: Object.fromEntries(ks3.map((k) => [k, { s: 'ok' }])), ms: {} }));
  const t = CKM.checkTasks({ recs: {}, inbox: { [id]: task } })[0];
  ok(t && t.resume && /이어서/.test(t.title) && t.left === N - 3, `하다가 나간 묶음 → '${t && t.title}' · 남은 ${t && t.left}/${N}`);
  delete globalThis.localStorage;
}
// 기록 크기 — 서버 규칙(r/ 8000자) 안
{ const big = Math.max(...Object.values(K.recs).map((x) => JSON.stringify(x).length)); ok(big <= 8000, `기록 하나 가장 큰 것 ${big}자 ≤ 8000`); }

console.log(fail ? `FAIL ${fail}` : 'PASS');
if (fail) process.exit(1);
