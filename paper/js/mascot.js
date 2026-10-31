// 튼튼이 — 수 다리를 놓는 비버(손그림 선화 · 흑백으로 뽑아도 보이게 · 같은 몸에 자세만 바꿈)
//  mascot(pose, size) → SVG 글 · pose: hi(인사) · point(가리키기) · think(생각) · cheer(응원) · fix(망치로 고치기) · plain
const INK = '#3b2a1e', FUR = '#c99a68', BELLY = '#f3dcc0', HAT = '#f2c14e', TOOTH = '#fffdf6', CHEEK = '#f2b3a0';
const S = `stroke="${INK}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"`;
const arm = { // 팔 — 어깨(오른쪽 41,78 · 왼쪽 79,78)에서
  rest: (x, s) => `<path d="M${x} 78 q${s * 6} 12 ${s * 2} 22" ${S} fill="none"/><circle cx="${x + s * 2}" cy="101" r="4.2" fill="${FUR}" ${S}/>`,
  up: (x, s) => `<path d="M${x} 77 q${s * 10} -10 ${s * 14} -26" ${S} fill="none"/><circle cx="${x + s * 14}" cy="49" r="4.6" fill="${FUR}" ${S}/>`,
  out: (x, s) => `<path d="M${x} 79 q${s * 12} -2 ${s * 24} -8" ${S} fill="none"/><path d="M${x + s * 24} 71 l${s * 7} -2" ${S}/><circle cx="${x + s * 24}" cy="71" r="4.2" fill="${FUR}" ${S}/>`,
  chin: (x, s) => `<path d="M${x} 79 q${s * 8} 2 ${s * 14} -10" ${S} fill="none"/><circle cx="${x + s * 14}" cy="68" r="4.2" fill="${FUR}" ${S}/>`,
  hammer: (x, s) => `<path d="M${x} 79 q${s * 10} 0 ${s * 18} -10" ${S} fill="none"/><path d="M${x + s * 18} 69 l${s * 6} -18" stroke="${INK}" stroke-width="3.4" stroke-linecap="round"/><rect x="${x + s * 24 - 9}" y="44" width="18" height="9" rx="2" transform="rotate(${s * 18} ${x + s * 24} 48)" fill="#9aa3ab" ${S}/><circle cx="${x + s * 18}" cy="69" r="4.4" fill="${FUR}" ${S}/>`,
};
const POSE = { hi: ['rest', 'up'], point: ['rest', 'out'], think: ['rest', 'chin'], cheer: ['up', 'up'], fix: ['rest', 'hammer'], plain: ['rest', 'rest'] };
export function mascot(pose = 'plain', size = 64) {
  const [l, r] = POSE[pose] || POSE.plain;
  const happy = pose === 'cheer' || pose === 'hi';
  return `<svg class="mascot" viewBox="0 0 120 120" width="${size}" height="${size}" role="img" aria-label="튼튼이">
  <path d="M30 104 q-22 6 -24 -10 q-2 -16 18 -16 q14 2 14 14" fill="#a8774a" ${S}/><path d="M12 92 l14 -8 M14 99 l16 -9 M20 103 l12 -7" stroke="${INK}" stroke-width="1.3" opacity=".55"/>
  <path d="M40 72 q-8 18 -2 32 q22 10 44 0 q6 -14 -2 -32 q-20 -10 -40 0z" fill="${FUR}" ${S}/>
  <path d="M48 82 q12 -6 24 0 q4 12 -2 20 q-10 4 -20 0 q-6 -8 -2 -20z" fill="${BELLY}" stroke="${INK}" stroke-width="1.6"/>
  ${arm[l](41, -1)}${arm[r](79, 1)}
  <ellipse cx="50" cy="108" rx="8" ry="4.5" fill="${FUR}" ${S}/><ellipse cx="70" cy="108" rx="8" ry="4.5" fill="${FUR}" ${S}/>
  <circle cx="38" cy="30" r="7" fill="${FUR}" ${S}/><circle cx="82" cy="30" r="7" fill="${FUR}" ${S}/>
  <path d="M60 18 q27 0 28 26 q1 26 -28 28 q-29 -2 -28 -28 q1 -26 28 -26z" fill="${FUR}" ${S}/>
  <path d="M33 30 q4 -22 27 -23 q23 1 27 23 q-27 -6 -54 0z" fill="${HAT}" ${S}/><path d="M29 31 q31 -7 62 0" ${S} fill="none"/><path d="M60 8 v8" stroke="${INK}" stroke-width="2"/>
  <ellipse cx="60" cy="54" rx="13" ry="10" fill="${BELLY}" stroke="${INK}" stroke-width="1.8"/>
  ${happy ? `<path d="M46 42 q4 -5 8 0 M66 42 q4 -5 8 0" ${S} fill="none"/>` : `<circle cx="50" cy="42" r="3.6" fill="${INK}"/><circle cx="70" cy="42" r="3.6" fill="${INK}"/><circle cx="51.2" cy="40.8" r="1.1" fill="#fff"/><circle cx="71.2" cy="40.8" r="1.1" fill="#fff"/>`}
  <circle cx="42" cy="51" r="4" fill="${CHEEK}" opacity=".8"/><circle cx="78" cy="51" r="4" fill="${CHEEK}" opacity=".8"/>
  <path d="M55 48 q5 -3 10 0 q-1 4 -5 5 q-4 -1 -5 -5z" fill="${INK}"/>
  <path d="M60 53 v3" stroke="${INK}" stroke-width="1.6"/>
  <rect x="55.5" y="56" width="4.5" height="7" rx="1" fill="${TOOTH}" stroke="${INK}" stroke-width="1.5"/><rect x="60" y="56" width="4.5" height="7" rx="1" fill="${TOOTH}" stroke="${INK}" stroke-width="1.5"/>
  ${pose === 'think' ? `<path d="M92 20 q6 -6 12 0 q4 6 -2 10 q-3 2 -3 6" stroke="${INK}" stroke-width="2.2" fill="none" stroke-linecap="round"/><circle cx="99" cy="41" r="1.8" fill="${INK}"/>` : ''}
</svg>`;
}
// 다리 판자 줄(쪽 아래 · 다 풀면 색칠) — n칸 중 cur번째 칸에 표시
export function plankStrip(n, cur) {
  const w = 100 / Math.max(n, 1);
  return `<svg class="planks" viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden="true"><path d="M0 9.4 H100" stroke="${INK}" stroke-width=".5"/>${Array.from({ length: n }, (_, i) => `<rect x="${i * w + 0.4}" y="1.6" width="${w - 0.8}" height="6.4" rx=".8" fill="${i + 1 === cur ? '#fff6d8' : '#fff'}" stroke="${INK}" stroke-width="${i + 1 === cur ? 0.7 : 0.35}"/>`).join('')}</svg>`;
}
// 영역 그림(작은 표시) — 흑백에서도 구별되게 모양으로
export const STRAND_ICON = {
  N: '<svg viewBox="0 0 20 20" class="si"><rect x="2" y="2" width="7" height="7" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.6"/><rect x="11" y="2" width="7" height="7" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.6"/><rect x="2" y="11" width="7" height="7" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="14.5" cy="14.5" r="2.4" fill="currentColor"/></svg>',
  A: '<svg viewBox="0 0 20 20" class="si"><path d="M5 10 h10 M10 5 v10" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
  M: '<svg viewBox="0 0 20 20" class="si"><path d="M5.5 5.5 l9 9 M14.5 5.5 l-9 9" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
  D: '<svg viewBox="0 0 20 20" class="si"><path d="M4 10 h12" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><circle cx="10" cy="5" r="1.8" fill="currentColor"/><circle cx="10" cy="15" r="1.8" fill="currentColor"/></svg>',
  F: '<svg viewBox="0 0 20 20" class="si"><circle cx="10" cy="10" r="7.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M10 10 V2.5 A7.5 7.5 0 0 1 17.5 10z" fill="currentColor"/></svg>',
  R: '<svg viewBox="0 0 20 20" class="si"><circle cx="4" cy="14" r="2" fill="currentColor"/><circle cx="10" cy="10" r="2" fill="currentColor"/><circle cx="16" cy="6" r="2" fill="currentColor"/></svg>',
  W: '<svg viewBox="0 0 20 20" class="si"><path d="M3 4 h14 v9 h-8 l-4 3 v-3 h-2z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
  END: '<svg viewBox="0 0 20 20" class="si"><path d="M10 2.5 l2.3 4.8 5.2 .7 -3.8 3.6 .9 5.1 -4.6 -2.5 -4.6 2.5 .9 -5.1 -3.8 -3.6 5.2 -.7z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>',
};
