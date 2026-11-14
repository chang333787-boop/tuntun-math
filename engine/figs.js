// 문제 속 도형 그림(측정) — 차시 · 문제의 수 → 그림 설명(spec)과 그림에 적힌 수를 옮긴 글(alt)
//  쓰는 곳: engine/lessons/me.js(문제에 그림으로) · engine/hints/pics.js(도움 그림 = 같은 그림에 표시만 얹음 — 자리 · 방향이 문제의 그림과 같아야 해서 여기 한 곳에서 정함)
//  구하는 각은 ㉠(답을 글자로 적지 않음) · 길이는 그림의 변에 적음 · 못 그리는 수면 null(문제는 글로 · 도움 그림은 없음)
//  시계 · 자는 눈금 숫자가 원래 그림에 있음(읽는 것이 문제 — tests/pics.test.mjs가 이 둘의 숫자는 세지 않음)
import { polyTurn, polyTurned } from './pics.js';
import { J } from './concepts/kit.js';

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
/* 시계 — 그림을 못 보는 곳(글 · 읽어 주기)에 바늘 자리를 옮긴 글. 시각을 말하지 않고 바늘이 있는 곳만 */
const hOK = (p) => int(p.h) && p.h <= 12 && Number.isInteger(p.m) && p.m >= 0 && p.m < 60;
function clockAlt(p) {
  const k = Math.floor(p.m / 5), rest = p.m % 5;
  if (!p.m) return `짧은바늘은 ${p.h}, 긴바늘은 12`;
  return `짧은바늘은 ${J(p.h, '과', '와')} ${(p.h % 12) + 1} 사이, 긴바늘은 ${rest ? `${k || 12}에서 작은 눈금 ${rest}칸 더 간 곳` : k}`;
}
const clockFig = (p) => (hOK(p) ? { spec: { t: 'clock', h: p.h, m: p.m, r: 72, label: '시계' }, alt: clockAlt(p) } : null);
/* 원 — 문제가 준 길이 하나만 그림에(지름을 주면 지름 선, 반지름을 주면 반지름 선) */
function circFig(p) {
  const d = p.v === 'd' ? p.d || 2 * p.r : 0;
  if (p.v === 'd') return int(d) ? { spec: { t: 'circle', d }, alt: `지름 ${cm(d)}인 원` } : null;
  return int(p.r) ? { spec: { t: 'circle', r: p.r }, alt: `반지름 ${cm(p.r)}인 원` } : null;
}
const FIGS = {
  '1-2-3:5': clockFig,
  '2-1-4:5': (p) => (Number.isInteger(p.a) && p.a >= 0 && int(p.b) && p.b > p.a && p.b <= 10 ? { spec: { t: 'ruler', a: p.a, b: p.b }, alt: `색 테이프의 왼쪽 끝은 눈금 ${p.a}, 오른쪽 끝은 눈금 ${p.b}` } : null),
  '2-2-4:2': clockFig,
  '3-2-3:3': (p) => (p.v === 'comp' ? null : circFig({ r: p.r, v: p.v === 'd2r' ? 'd' : 'r' })),
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
FIGS['5-1-6:8'] = (p) => (int(p.a) && int(p.b) ? { spec: { t: 'rhom', a: p.a, b: p.b }, alt: `한 대각선 ${cm(p.a)}, 다른 대각선 ${cm(p.b)}` } : null);
FIGS['5-1-6:9'] = (p) => (int(p.a) && int(p.b) && int(p.h) ? { spec: { t: 'trap', a: p.a, b: p.b, h: p.h }, alt: `윗변 ${cm(p.a)}, 아랫변 ${cm(p.b)}, 높이 ${cm(p.h)}` } : null);
FIGS['6-2-5:3'] = circFig;
FIGS['6-2-5:5'] = circFig;
export const FIG_IDS = Object.keys(FIGS);
export function figOf(id, p) { try { return (FIGS[id] && p && FIGS[id](p)) || null; } catch (e) { return null; } }
