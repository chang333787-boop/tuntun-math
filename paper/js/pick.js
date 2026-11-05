// 맞춤 연습지 문제 뽑기 — paper/practice.js(종이) · app/js/sheet.js(선생님 화면의 함정 문항 수 · 모자람 알림) · tests/skills.test.mjs가 같은 것을 씀
//  설정 spec = { v?, who, seed, chk?, ex?, key?, s:[{ t, note, dup?, mix?, it:[{ c, n, re?, want? }] }] }
//    같은 설정(씨앗 포함) = 같은 문제 · 갈래 안에서 같은 답은 dup번까지(기본 2) · 같은 문제 두 번 X · 보기는 첫 차시에서 문제와 다른 것
//    want = 오개념 카드 id(engine/mis.js WANT) — 그 차시 문제의 절반을 '그 생각으로 풀면 틀리는 꼴'로 · 섞어 냄 · 종이엔 표시 X(it.trap은 선생님 화면만 셈)
//    mix = 갈래 안 차례를 섞음(곱셈구구 섞기처럼)
//  v: 2(선생님 화면이 만듦) — '같은 글'을 문제 글 + 보기로 견줌(글이 같은 고르기 '더 큰 수를 고르세요'가 한 문제만 나오던 것) · 보기 후보를 넉넉히
//  v 없는 예전 설정은 예전과 같은 문제가 나옴(tests/skills.test.mjs가 예전 뽑기와 견줌)
import { pickItems } from './gen.js';
import { rng } from '../../engine/math.js';
import { toText } from '../../engine/tokens.js';
import { wantFor } from '../../engine/mis.js';

const txtOf = (it) => toText(it.prompt);
const keyOf = (it) => (it.choices ? `${toText(it.prompt)} ⟨${it.choices.map((c) => toText(c)).join(' / ')}⟩` : toText(it.prompt));
export function pickSection(sec, r, used, v2 = false) {
  const same = v2 ? keyOf : txtOf;
  const out = [], ans = {}, lim = Number(sec.dup) > 0 ? Number(sec.dup) : 2, warn = [];
  for (const sp of sec.it) {
    const re = sp.re ? new RegExp(sp.re) : null, from = out.length;
    /* 한 차시에서 need개 — want가 있으면 함정 꼴만 받음(모자라면 덜 받고 나머지는 보통 문제로) */
    const take = (need, want, rounds) => {
      let got = 0;
      for (let round = 0; round < rounds && got < need; round++) {
        for (const it of pickItems(sp.c, need * 4, r, used, want)) {
          if (got >= need) break;
          if (want && !it.trap) continue;
          const txt = toText(it.prompt), key = JSON.stringify(it.sol);
          if (re && !re.test(txt)) continue;
          if (!it.choices && (ans[key] || 0) >= lim) continue;   /* 같은 답이 셋째부터는 빼기(16 − 7 · 14 − 5 · 17 − 8이 다 9이던 것) · 고르기는 답이 '짝수/홀수'처럼 늘 겹쳐 빼지 않음 */
          if (out.some((x) => same(x) === same(it))) continue;
          ans[key] = (ans[key] || 0) + 1; out.push(it); got++;
        }
      }
      return got;
    };
    const wf = sp.want ? wantFor(sp.want, sp.c) : null;
    let tn = 0;
    if (wf) tn = take(Math.ceil(sp.n / 2), wf, 3);
    take(sp.n - tn, null, 12);
    if (tn) {   /* 함정 꼴과 보통 문제를 번갈아(한쪽으로 몰리지 않게) */
      const mine = out.splice(from), T = mine.filter((x) => x.trap), N = mine.filter((x) => !x.trap), mixd = [];
      for (let i = 0; i < Math.max(T.length, N.length); i++) { if (N[i]) mixd.push(N[i]); if (T[i]) mixd.push(T[i]); }
      out.push(...mixd);
    }
    if (out.length - from < sp.n) warn.push({ c: sp.c, n: sp.n, got: out.length - from });
  }
  if (sec.mix && out.length > 1) { const rr = rng(Math.floor(r.next() * 1e9)); for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(rr.next() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; } }
  out.warn = warn;
  return out;
}

// 기능 카드의 예시 둘(선생님 화면 #/t/sheet) — 첫 갈래에서 쉬운 쪽 하나 · 끝 갈래에서 어려운 쪽 하나(갈래가 하나면 그 안에서 작은 수 · 큰 수)
//  씨앗은 기능 id로 고정(늘 같은 예시) · 거르기(re) 지킴 · 글이 짧은 것 먼저(카드가 길어지지 않게 — 글 문제뿐인 칸은 그대로) · 둘은 서로 다름
//  크기 = 문제 글 · 보기 속 수의 자릿값 합(작은 수 · 적은 수 = 쉬운 쪽)
const hashS = (s) => [...String(s)].reduce((h, ch) => (Math.imul(h, 31) + ch.charCodeAt(0)) >>> 0, 7);
const sizeOf = (it) => { const t = keyOf(it); return (t.match(/\d+(?:\.\d+)?/g) || []).reduce((a, x) => a + Math.log10(Number(x) + 1), 0) + t.length / 200; };
export function examplesOf(s) {
  const r = rng(hashS(`ex:${s.id}`));
  const cands = (p) => {
    const re = p.re ? new RegExp(p.re) : null, xs = pickItems(p.c, 24, r, new Set()).filter((it) => !re || re.test(toText(it.prompt))).slice(0, 8);
    const sh = xs.filter((it) => keyOf(it).length <= 46);
    return (sh.length >= 2 ? sh : xs).map((it) => ({ it, z: sizeOf(it) })).sort((a, b) => a.z - b.z).map((x) => x.it);
  };
  const first = s.parts[0], last = s.parts[s.parts.length - 1], multi = s.parts.length > 1;
  const A = cands(first), B = multi ? cands(last) : A;
  const easy = A[Math.floor((A.length - 1) / (multi ? 3 : 4))];
  const hard = [...B].reverse().find((it) => !easy || keyOf(it) !== keyOf(easy));
  return [easy && { it: easy, c: first.c, label: multi ? first.label : '' }, hard && { it: hard, c: multi ? last.c : first.c, label: multi ? last.label : '' }].filter(Boolean);
}

// 연습지 한 벌 — 갈래마다 { ...갈래 설정, items, ex(보기), warn } · 보기를 끄더라도 뽑기는 같게(보기를 켜고 끄면 문제가 바뀌지 않게)
export function buildSheet(spec) {
  const r = rng(Number(spec.seed) || 1), used = new Set(), v2 = Number(spec.v) >= 2, same = v2 ? keyOf : txtOf;
  return spec.s.map((sec) => {
    const items = pickSection(sec, r, used, v2), seen = new Set(items.map(same));
    const [ex] = pickItems(sec.it[0].c, v2 ? 40 : 12, r, new Set()).filter((it) => !seen.has(same(it)) && (!sec.it[0].re || new RegExp(sec.it[0].re).test(toText(it.prompt))));   /* 보기는 문제와 글이 다른 것(수가 적은 칸은 고른 문제가 다 써서 보기가 비던 것) */
    return { ...sec, items, ex, warn: items.warn };
  });
}
