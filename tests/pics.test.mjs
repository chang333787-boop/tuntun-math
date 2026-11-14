// 그림 틀 검사(engine/pics.js · engine/hints/pics.js) — 차시마다 문제 40개 × 모든 단계(떠올리기 −1 · 단계 0…n−1 · 처음 문제로 n)
//  ① 그려지나(SVG 꼴 · NaN · undefined 없음 · 폭 446 · 높이 200 안)
//  ② 답이 글자로 새지 않나 — 그림 속 글자에 '문제의 답'(처음 문제로 돌아오기 전) · '지금 단계의 답'이 있으면 실패
//     (문제 · 지금까지 단계의 식에 이미 있는 수와 마친 단계의 답은 됨 · 가르기 띠는 뒤 단계 식의 수도 됨 · 눈금의 0 · 동전의 10 · 100은 됨 · 시계 숫자판은 뺌 · 세어서 아는 것은 됨)
//  ③ 차시마다 그림이 나오는 비율 — 표에 넣었는데 거의 안 나오면(25% 아래) 실패
//  ④ 문제 속 도형 그림(engine/figs.js) — 그림을 그릴 수 있는 문제면 문제에 그림 조각(fig)이 꼭 하나 · 그림 글자에 답이 없음(그림에 준 수와 같은 답은 됨) · 좌표 폭 280 · 높이 160 안(종이 칸 · 크롬북 화면)
//  node tests/pics.test.mjs      V=1이면 차시마다 비율을 다 보임
import { byId, makeItem } from '../engine/lessons/index.js';
import { picSpec, PIC_IDS } from '../engine/hints/index.js';
import { figOf, FIG_IDS } from '../engine/figs.js';
import { picSVG } from '../engine/pics.js';
import { workedSteps } from '../engine/practice.js';
import { rng } from '../engine/math.js';
import { toText } from '../engine/tokens.js';

const N = 40, V = !!process.env.V;
const nums = (t) => (String(t).match(/\d+(?:\.\d+)?/g) || []).map(Number);
const texts = (svg) => [...svg.matchAll(/<text[^>]*>([^<]*)<\/text>/g)].map((m) => m[1]);
/* 화면이 쓰는 단계 꼴(app/js/fix.js stepsOf와 같음) */
const stepsOf = (c, p) => { try { return workedSteps(c, p).map((s) => ({ why: s.why, c: s.c, prompt: s.item.prompt, sol: s.sol, p: s.item.p })); } catch (e) { return []; } };
const bad = [], leak = [], low = [], rows = [];
let drawn = 0, maxW = 0, maxH = 0;
for (const c of PIC_IDS) {
  const n = byId[c];
  if (!n) { bad.push(`${c} 차시가 없어요`); continue; }
  const r = rng(11);
  let made = 0, has = 0;
  const kinds = new Set();
  for (let k = 0; k < N; k++) {
    let p, it; try { p = n.gen(r); it = makeItem(c, p); } catch (e) { continue; }
    made++;
    const steps = stepsOf(c, p), own = nums(toText(it.prompt));
    let any = false;
    for (let i = -1; i <= steps.length; i++) {
      const spec = picSpec(c, p, { i, steps });
      if (!spec) continue;
      const svg = picSVG(spec), at = `${c} ${toText(it.prompt)} [${i}]`;
      if (!svg) { bad.push(`${at} 틀(${spec.t})이 못 그려요`); continue; }
      any = true; drawn++; kinds.add(spec.t);
      if (!svg.startsWith('<svg') || !svg.endsWith('</svg>') || /NaN|undefined|Infinity/.test(svg)) bad.push(`${at} SVG가 깨졌어요`);
      const m = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/), w = m ? Number(m[1]) : 0, h = m ? Number(m[2]) : 0;
      maxW = Math.max(maxW, w); maxH = Math.max(maxH, h);
      if (!(w > 20) || !(h > 20) || w > 446 || h > 200) bad.push(`${at} 크기 ${w} × ${h}`);
      if (spec.t === 'clock') continue;
      const ok = new Set([...own, 0]);
      if (spec.unit > 1) ok.add(spec.unit);   /* 동전에 적힌 10 · 100 */
      /* 가르기 띠의 칸 글은 단계의 식(떠올리기 말이 이미 말하는 가르기) — 뒤 단계의 식에 있는 수도 됨 */
      steps.slice(0, spec.t === 'split' ? steps.length : Math.min(i, steps.length - 1) + 1).forEach((s) => nums(toText(s.prompt)).forEach((v) => ok.add(v)));
      steps.slice(0, Math.max(i, 0)).forEach((s) => (s.sol || []).forEach((v) => ok.add(Number(v))));
      const no = new Set();
      if (i < steps.length && !it.choices) (it.sol || []).map(Number).filter((v) => Number.isFinite(v) && !ok.has(v)).forEach((v) => no.add(v));
      if (i >= 0 && i < steps.length) (steps[i].sol || []).map(Number).filter((v) => Number.isFinite(v) && !ok.has(v)).forEach((v) => no.add(v));
      const seen = texts(svg).flatMap(nums).filter((v) => no.has(v));
      if (seen.length) leak.push(`${at} 그림에 답 ${[...new Set(seen)].join(', ')} · 글자: ${texts(svg).join(' | ')}`);
    }
    if (any) has++;
  }
  rows.push(`${c.padEnd(8)} ${String(has).padStart(2)}/${made} ${[...kinds].join(' · ')}`);
  if (made && has / made < 0.25) low.push(`${c} 그림이 나온 문제 ${has}/${made}`);
}
/* ④ 문제 속 도형 그림 */
let figs = 0;
for (const c of FIG_IDS) {
  const n = byId[c];
  if (!n) { bad.push(`${c} 차시가 없어요(문제 그림 표)`); continue; }
  const r = rng(7);
  let made = 0, has = 0;
  for (let k = 0; k < 120; k++) {
    let p, it; try { p = n.gen(r); it = makeItem(c, p); } catch (e) { continue; }
    made++;
    const f = figOf(c, p), toks = it.prompt.filter((t) => t && typeof t === 'object' && t.fig), at = `${c} ${toText(it.prompt)}`;
    if (!f) { if (toks.length) bad.push(`${at} 그릴 수 없는 문제에 그림 조각`); continue; }
    if (toks.length !== 1) { bad.push(`${at} 문제에 그림 조각 ${toks.length}개`); continue; }
    has++; figs++;
    const svg = toks[0].svg, m = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/), w = m ? Number(m[1]) : 0, h = m ? Number(m[2]) : 0;
    if (!svg.startsWith('<svg') || /NaN|undefined|Infinity/.test(svg)) bad.push(`${at} 문제 그림이 깨졌어요`);
    if (!(w > 20) || !(h > 20) || w > 280 || h > 160) bad.push(`${at} 문제 그림 크기 ${w} × ${h}`);
    if (!toks[0].alt) bad.push(`${at} 문제 그림에 옮긴 글(alt)이 없어요`);
    const given = new Set(nums(JSON.stringify(f.spec))), seen = texts(svg).flatMap(nums).filter((v) => !given.has(v) && (it.sol || []).map(Number).includes(v));
    if (seen.length) leak.push(`${at} 문제 그림에 답 ${[...new Set(seen)].join(', ')}`);
    /* 그림에 준 수가 아닌 글자(㉠ · 단위 말고)가 있으면 실패 — 그림은 준 것만 적음 */
    const extra = texts(svg).flatMap(nums).filter((v) => !given.has(v));
    if (extra.length) bad.push(`${at} 문제 그림에 주지 않은 수 ${[...new Set(extra)].join(', ')}`);
  }
  rows.push(`${c.padEnd(8)} 문제 그림 ${has}/${made}`);
  if (made && has / made < 0.25) low.push(`${c} 문제 그림이 나온 문제 ${has}/${made}`);
}
if (V) console.log(rows.join('\n'));
const show = (title, list) => { if (list.length) console.log(`\n${title} ${list.length}\n  ${[...new Set(list)].slice(0, Number(process.env.MAX) || 20).join('\n  ')}`); };
show('✗ 못 그림 · 깨짐', bad); show('✗ 답이 글자로 샘', leak); show('✗ 그림이 거의 안 나옴', low);
const fail = bad.length + leak.length + low.length;
console.log(`${fail ? '✗' : '✓'} 그림 틀 — 차시 ${PIC_IDS.length} · 그린 그림 ${drawn} · 가장 큰 크기 ${maxW} × ${maxH} · 문제 속 그림 ${figs}(차시 ${FIG_IDS.length})${fail ? ` · 실패 ${fail}` : ''}`);
process.exit(fail ? 1 : 0);
