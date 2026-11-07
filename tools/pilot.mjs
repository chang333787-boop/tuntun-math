// 시범 운영 숫자 정리 — 선생님이 주마다 내려받은 '아이별' CSV 여러 장 → 주마다 반 평균 · 처음과 마지막 견주기 · 이번 주 점검 기울기
//  node tools/pilot.mjs <CSV 폴더> [형성평가.csv]   → 마크다운 표(화면에 · 보고서에 붙여 넣기)
//  형성평가.csv(선택) = 번호,사전,사후 (앱 밖 점수 · 효과의 정본 — docs/pilot.md §3 · §4)
//  정직하게: 한 반 · 대조군 없음 · 앱 안 숫자는 과정 지표 · 고친 아이와 못 고친 아이 견주기는 선택 편향이 있음(그대로 적음)
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

export function parseCSV(text) {
  const rows = [], t = text.replace(/^﻿/, '');
  let row = [], cell = '', q = false;
  for (let i = 0; i < t.length; i++) {
    const ch = t[i];
    if (q) { if (ch === '"' && t[i + 1] === '"') { cell += '"'; i++; } else if (ch === '"') q = false; else cell += ch; continue; }
    if (ch === '"') q = true; else if (ch === ',') { row.push(cell); cell = ''; } else if (ch === '\n' || ch === '\r') { if (ch === '\r' && t[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; } else cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const head = rows.shift() || [];
  return rows.filter((r) => r.some((x) => x !== '')).map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] == null ? '' : r[i]])));
}
const num = (v) => (v === '' || v == null || Number.isNaN(Number(v)) ? null : Number(v));
const mean = (xs) => { const v = xs.filter((x) => x != null); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; };
const f1 = (v) => (v == null ? '–' : (Math.round(v * 10) / 10).toString());
const slope = (ys) => { const n = ys.length; if (n < 2) return null; const mx = (n - 1) / 2, my = ys.reduce((a, b) => a + b, 0) / n; let a = 0, b = 0; ys.forEach((y, i) => { a += (i - mx) * (y - my); b += (i - mx) ** 2; }); return a / b; };
// '10-26 6 / 11-02 8' → [6, 8]
const weekPts = (s) => String(s || '').split('/').map((x) => x.trim().split(/\s+/)).filter((p) => p.length === 2 && num(p[1]) != null).map((p) => num(p[1]));

// 장 하나(날짜 · 줄들) → 반 숫자
/* CSV 머리 이름 — 11-07 말 바꾸기 뒤 이름(앞) · 그 전에 받아 둔 CSV 이름(뒤)도 읽음 */
const OLD = { '점검 칸 수': '준비 칸 수', '점검 칸 확인': '준비 칸 확인', '점검 칸 막힘': '준비 칸 막힘', '배울 것': '고칠 판자', '배워서 고친 것 수': '고친 판자 수', '정확하게 됨': '정확 표', '빠르게도 됨': '빠르게 표', '며칠 뒤에도 됨': '오래 표', '매일 연습(7일)': '구보(7일)' };
export const col = (r, k) => (r[k] !== undefined ? r[k] : OLD[k] ? r[OLD[k]] : undefined);
export function classNums(rows) {
  const has = rows.filter((r) => r['마지막 기록']);
  const g = (k) => has.map((r) => num(col(r, k)));
  const pre = has.map((r) => (num(col(r, '점검 칸 수')) ? num(col(r, '점검 칸 확인')) / num(col(r, '점검 칸 수')) : null));
  return {
    n: rows.length, active: has.length,
    준비칸확인: mean(pre) == null ? null : mean(pre) * 100,
    막힘: mean(g('점검 칸 막힘')),
    고칠판자있음: has.filter((r) => col(r, '배울 것')).length,
    고친판자: mean(g('배워서 고친 것 수')),
    짐작: mean(g('짐작 맞은 정도')),
    자신있는데틀림: mean(g("'자신 있어요'인데 틀림")),
    정확: mean(g('정확하게 됨')), 빠르게: mean(g('빠르게도 됨')), 오래: mean(g('며칠 뒤에도 됨')),
    구보: mean(g('매일 연습(7일)')), 스스로: has.reduce((a, r) => a + (num(r['도구로 스스로 고침']) || 0), 0), 빨리넘김: has.reduce((a, r) => a + (num(r['빨리 넘김']) || 0), 0),
  };
}

export function report(files, formative = null) {
  const sheets = files.map(({ name, text }) => ({ date: (name.match(/(\d{4}-\d\d-\d\d)/) || [])[1] || name, rows: parseCSV(text) })).sort((a, b) => (a.date < b.date ? -1 : 1));
  const out = [];
  out.push(`# 시범 운영 숫자(${sheets.length}장 · ${sheets[0] ? sheets[0].date : ''} ~ ${sheets.length ? sheets[sheets.length - 1].date : ''})`);
  out.push('', '앱 안 숫자는 **과정 지표**예요. 효과는 앱 밖 형성평가로 봐요(docs/pilot.md). 한 반 · 대조군 없음.', '');
  const cols = [['active', '기록 있는 아이'], ['준비칸확인', '점검 칸 확인 %'], ['막힘', '점검 칸 막힘(평균)'], ['고칠판자있음', '배울 것이 있는 아이'], ['고친판자', '배워서 고친 것(평균)'], ['짐작', '짐작 맞은 정도 %'], ['자신있는데틀림', '자신 있었는데 틀림(평균)'], ['정확', '정확하게 됨(평균)'], ['빠르게', '빠르게도 됨(평균)'], ['오래', '며칠 뒤에도 됨(평균)'], ['구보', '매일 연습 한 날(7일)'], ['스스로', '도구로 스스로 고침(합)'], ['빨리넘김', '빨리 넘김(합)']];
  const nums = sheets.map((s) => ({ date: s.date, ...classNums(s.rows) }));
  out.push(`| 날짜 | ${cols.map((c) => c[1]).join(' | ')} |`, `|---|${cols.map(() => '---').join('|')}|`);
  for (const x of nums) out.push(`| ${x.date} | ${cols.map(([k]) => f1(x[k])).join(' | ')} |`);
  if (nums.length >= 2) {
    const a = nums[0], b = nums[nums.length - 1];
    out.push('', `**처음 → 마지막**: ${cols.filter(([k]) => a[k] != null && b[k] != null).map(([k, t]) => `${t} ${f1(a[k])} → ${f1(b[k])}`).join(' · ')}`);
  }
  // 이번 주 점검 — 마지막 장의 아이마다 선 기울기(주당 점수 변화)
  const last = sheets[sheets.length - 1];
  if (last) {
    const lines = last.rows.map((r) => ({ no: r['번호'], ys: weekPts(r['이번 주 점검(주 · 10점 · 최근 8주)']) })).filter((x) => x.ys.length >= 2);
    if (lines.length) {
      const sl = lines.map((x) => slope(x.ys));
      out.push('', `## 이번 주 점검 선(${lines.length}명 · 점 둘 이상)`, `- 주당 기울기 평균 ${f1(mean(sl))}점 · 오르는 아이(+0.5 넘게) ${sl.filter((v) => v > 0.5).length}명 · 그대로 ${sl.filter((v) => v >= -0.5 && v <= 0.5).length}명 · 내리는 아이(−0.5 넘게) ${sl.filter((v) => v < -0.5).length}명`, `- 첫 점 평균 ${f1(mean(lines.map((x) => x.ys[0])))} → 마지막 점 평균 ${f1(mean(lines.map((x) => x.ys[x.ys.length - 1])))}(10점)`);
    }
  }
  // 형성평가(앱 밖) — 배울 것을 찾고 배워서 고친 아이 vs 아닌 아이
  if (formative && last) {
    const F = Object.fromEntries(parseCSV(formative).map((r) => [String(r['번호']), { pre: num(r['사전']), post: num(r['사후']) }]));
    const fixedBy = Object.fromEntries(last.rows.map((r) => [String(r['번호']), num(col(r, '배워서 고친 것 수')) || 0]));
    const grp = (f) => Object.entries(F).filter(([no, v]) => v.post != null && f(fixedBy[no] || 0)).map(([, v]) => v);
    const A = grp((n) => n > 0), B = grp((n) => n === 0);
    const gain = (xs) => mean(xs.map((v) => (v.pre != null ? v.post - v.pre : null)));
    out.push('', '## 형성평가(앱 밖 · 정본)', `- 배워서 고친 것이 있는 아이 ${A.length}명: 사후 평균 ${f1(mean(A.map((v) => v.post)))} · 오른 폭 ${f1(gain(A))}`, `- 배워서 고친 것이 없는 아이 ${B.length}명: 사후 평균 ${f1(mean(B.map((v) => v.post)))} · 오른 폭 ${f1(gain(B))}`, '- ⚠️ 두 무리는 무작위로 나뉜 것이 아님(고칠 판자가 있던 아이 = 처음에 더 어려웠던 아이) — 사후 점수보다 **오른 폭**을 보고, 그래도 인과로 쓰지 않음.');
  }
  return out.join('\n');
}

if (process.argv[1] && process.argv[1].endsWith('pilot.mjs')) {
  const dir = process.argv[2];
  if (!dir) { console.log('쓰는 법: node tools/pilot.mjs <아이별 CSV 폴더> [형성평가.csv]'); process.exit(1); }
  const files = readdirSync(dir).filter((f) => /아이별.*\.csv$/.test(f)).map((f) => ({ name: f, text: readFileSync(join(dir, f), 'utf8') }));
  const formative = process.argv[3] ? readFileSync(process.argv[3], 'utf8') : null;
  console.log(report(files, formative));
}
