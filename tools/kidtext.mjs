// 아이에게 보이는 설명 글 전수(설명 층 다시 짓기 · 11-08) — node tools/kidtext.mjs · OUT=폴더/ 이면 kidtext.json · 차시마다 떠올리기 · 단계 까닭 · 힌트 · 길이 · 이름표 말투(—) · 그림 유무 · 글 무게 순
import { NODES, makeItem, stepsOf } from '../engine/lessons/index.js';
import { cueOf } from '../engine/hints/index.js';
import { rng } from '../engine/math.js';
import { toText } from '../engine/tokens.js';
import fs from 'fs';
const rows = [], sents = (t) => (String(t).match(/[^.?!]+[.?!]/g) || [String(t)]).length;
for (const n of NODES) {
  const r = rng(77); let p, it; try { p = n.gen(r); it = makeItem(n.id, p); } catch (e) { continue; }
  const cue = cueOf(n.id, p) || '', st = (() => { try { return stepsOf(n.id, p) || []; } catch (e) { return []; } })();
  const whys = st.map((s) => s.why || ''), pic = JSON.stringify(it.prompt).includes('svg');
  const all = [cue, ...whys, n.hint || ''];
  const score = all.reduce((a, t) => a + t.length, 0) + 40 * all.filter((t) => / — /.test(t)).length + 20 * all.filter((t) => sents(t) > 2).length;
  rows.push({ id: n.id, s: n.s, kid: n.kid, q: toText(it.prompt).slice(0, 60), pic, cue, whys, hint: n.hint || '', cueLen: cue.length, whyMax: Math.max(0, ...whys.map((w) => w.length)), steps: st.length, dash: all.filter((t) => / — /.test(t)).length, score });
}
rows.sort((a, b) => b.score - a.score);
const D = process.env.OUT || '/tmp/';
fs.writeFileSync(D + 'kidtext.json', JSON.stringify(rows, null, 1));
const avg = (k) => Math.round(rows.reduce((a, x) => a + x[k], 0) / rows.length);
console.log('차시', rows.length, '· 떠올리기 평균', avg('cueLen'), '자 · 단계 까닭 최장 평균', avg('whyMax'), '자 · 그림 있는 문제', rows.filter((x) => x.pic).length, '· 이름표 말투(—) 있는 차시', rows.filter((x) => x.dash).length);
console.log('글 무게 상위 12:'); rows.slice(0, 12).forEach((x) => console.log(' ', x.id, x.score, '|', x.cue.slice(0, 70)));
