// 문제 속 도형 그림(측정) — 차시 · 문제의 수 → 그림 설명(spec)과 그림에 적힌 수를 옮긴 글(alt)
//  쓰는 곳: engine/lessons/me.js(문제에 그림으로) · engine/hints/pics.js(도움 그림 = 같은 그림에 표시만 얹음 — 자리 · 방향이 문제의 그림과 같아야 해서 여기 한 곳에서 정함)
//  구하는 각은 ㉠(답을 글자로 적지 않음) · 길이는 그림의 변에 적음 · 못 그리는 수면 null(문제는 글로 · 도움 그림은 없음)
import { polyTurn, polyTurned } from './pics.js';

/* 문제 속 그림을 그리는 배율(도움 그림보다 크게 — 좌표는 그대로) */
export const FIGK = 1.4;
const deg = (x) => `${x}°`, Q = '㉠', int = (v) => Number.isInteger(v) && v > 0;
/* 삼각형 · 사각형 — 아는 각 뒤에 구하는 각 · 문제마다 다른 자리부터 그림(구하는 각이 늘 같은 꼭짓점에 오지 않게) */
function polyFig(known) {
  const n = known.length + 1, sum = known.reduce((x, y) => x + y, 0), angs = [...known, (n - 2) * 180 - sum];
  if (!known.every(int) || !(angs[n - 1] > 5)) return null;
  const k = polyTurn(angs, Math.round(sum / 5) % n);
  return { spec: { t: 'poly', angs: polyTurned(angs, k), labs: polyTurned([...known.map(deg), Q], k) }, alt: `${n === 3 ? '세' : '네'} 각 ${known.map(deg).join(', ')}, ${Q}` };
}
const cm = (v) => `${v} cm`;
const FIGS = {
  '4-1-2:5': (p) => {
    if ((p.v !== 'line' && p.v !== 'round') || !int(p.a)) return null;
    const all = p.v === 'line' ? 180 : 360, flip = Math.round(p.a / 5) % 2 === 1;   /* 아는 각이 앞에 오기도 뒤에 오기도 */
    return { spec: { t: 'ang', kind: p.v, a: flip ? all - p.a : p.a, labs: flip ? [Q, deg(p.a)] : [deg(p.a), Q] }, alt: `${p.v === 'line' ? '직선 위의' : '한 바퀴를 나눈'} 두 각 ${deg(p.a)}, ${Q}` };
  },
  '4-1-2:7': (p) => polyFig([p.a, p.b]),
  '4-1-2:8': (p) => polyFig([p.a, p.b, p.c]),
  '5-1-6:6': (p) => (int(p.a) && int(p.h) ? { spec: { t: 'areaf', shape: 'para', a: p.a, h: p.h, s: p.s || 0 }, alt: `밑변 ${cm(p.a)}, 높이 ${cm(p.h)}${p.s ? `, 다른 한 변 ${cm(p.s)}` : ''}` } : null),
  '5-1-6:7': (p) => (int(p.a) && int(p.h) ? { spec: { t: 'areaf', shape: 'tri', a: p.a, h: p.h, s: p.s || 0 }, alt: `밑변 ${cm(p.a)}, 높이 ${cm(p.h)}${p.s ? `, 다른 한 변 ${cm(p.s)}` : ''}` } : null),
  '6-1-6:3': (p) => (int(p.a) && int(p.b) && int(p.c) ? { spec: { t: 'box', a: p.a, b: p.b, c: p.c }, alt: `가로 ${cm(p.a)}, 세로 ${cm(p.b)}, 높이 ${cm(p.c)}` } : null),
};
FIGS['6-1-6:5'] = FIGS['6-1-6:3'];
export const FIG_IDS = Object.keys(FIGS);
export function figOf(id, p) { try { return (FIGS[id] && p && FIGS[id](p)) || null; } catch (e) { return null; } }
