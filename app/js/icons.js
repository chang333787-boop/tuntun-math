// 선 아이콘 — 한 벌(24 칸 · 선 굵기 2 · 둥근 끝 · 칠 없음 · 글자색을 따름) · 이모지 대신(윈도10에서 안 깨지게 · 화면마다 같은 모양)
//  icon(이름, 크기) → SVG 글 · 활동 타일 · 탭 · 할 일 카드 · 단추에 씀(docs/ui.md 2차)
//  활동과 짝: 준비 다리 = bridge · 판자 고치기 = hammer · 다듬기 · 스테이지 = stairs(정확 → 빠르게 → 오래 세 칸을 오름 · 대패보다 아이가 바로 알아봄) · 구보 = shoe · 이야기 다리 = book · 이번 주 점검 = chart · 거꾸로 찾기 = back · 처음 문제 다시 = star · 선생님과 같이 = chat
const P = {
  bridge: '<path d="M3 5.5v14M21 5.5v14"/><path d="M3 7.5c4 5.5 14 5.5 18 0"/><path d="M3 14c4 4.5 14 4.5 18 0"/><path d="M7.3 10.9v5.4M12 11.9v5.4M16.7 10.9v5.4"/>',
  hammer: '<path d="M4.5 19.5l9-9"/><path d="M9.8 6.8l3.6-3.6 7.4 7.4-3.6 3.6z"/>',
  stairs: '<path d="M3 20v-5h6v-5h6V5h6v15z"/>',
  shoe: '<path d="M3 17.5V8c1.7.7 3.4.7 5 0l2.3 3.4 7 2A3.2 3.2 0 0 1 21 16.5v1z"/><path d="M3 20.5h18"/><path d="M9.6 10.9l1.7-1M11.5 12.4l1.7-1"/>',
  book: '<path d="M12 6.5C10 5 7 4.5 3.5 5v13c3.5-.5 6.5 0 8.5 1.5 2-1.5 5-2 8.5-1.5V5C17 4.5 14 5 12 6.5z"/><path d="M12 6.5v13"/>',
  chart: '<path d="M4 4v16h16"/><path d="M7.5 15l3.5-4 3 2.5 5-6"/>',
  search: '<circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5 5"/>',
  back: '<path d="M9 13.5L4 8.5l5-5"/><path d="M4 8.5h10.5a5.5 5.5 0 0 1 0 11H11"/>',
  star: '<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  chat: '<path d="M5 4.5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-7.5L7 20v-3.5H5a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2z"/><path d="M8 10.5h.01M12 10.5h.01M16 10.5h.01"/>',
  arrow: '<path d="M5 12h14"/><path d="M13 6l6 6-6 6"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  sound: '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4 4 0 0 1 0 6"/><path d="M18 6.5a7.5 7.5 0 0 1 0 11"/>',
  stop: '<rect x="6.5" y="6.5" width="11" height="11" rx="1.5"/>',
  clip: '<rect x="5" y="4.5" width="14" height="16.5" rx="2"/><path d="M9 4.5V3h6v1.5"/><path d="M8.5 12.5l2.2 2.2 4.8-4.8"/>',
  pencil: '<path d="M4 20l1-4.5L15.5 5a2.1 2.1 0 0 1 3 3L8 18.5z"/><path d="M13.5 7l3 3"/>',
  cal: '<rect x="4" y="5.5" width="16" height="15" rx="2"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4"/><path d="M8.5 14.5l2 2 4-4"/>',
  users: '<circle cx="9" cy="8.5" r="3.2"/><path d="M3.5 19.5c.6-3.3 2.8-5 5.5-5s4.9 1.7 5.5 5"/><path d="M15.5 5.6a3.2 3.2 0 0 1 0 5.8M17.5 14.8c1.6.7 2.6 2.3 3 4.7"/>',
  table: '<rect x="3.5" y="4.5" width="17" height="15" rx="1.5"/><path d="M3.5 9.5h17M3.5 14.5h17M9 4.5v15"/>',
  send: '<path d="M4 12l16-7-6 15-2.5-6.5z"/><path d="M11.5 13.5L20 5"/>',
};
export const ICONS = Object.keys(P);
export const icon = (name, size = 24, cls = '') => (P[name] ? `<svg class="ic${cls ? ` ${cls}` : ''}" viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true" focusable="false"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${P[name]}</g></svg>` : '');
// 활동 하나 = 아이콘 + 색 이름(app.css .act-<색>) — 할 일 · 타일 · 탭이 같은 짝을 씀
export const ACT = {
  prep: ['bridge', 'prep'], fix: ['hammer', 'fix'], drill: ['stairs', 'drill'], stages: ['stairs', 'drill'], run: ['shoe', 'run'],
  story: ['book', 'story'], week: ['chart', 'week'], back: ['back', 'back'], retry: ['star', 'back'], help: ['chat', 'help'],
  chk: ['clip', 'week'], prac: ['pencil', 'fix'], give: ['pencil', 'fix'], daily: ['cal', 'run'],
};
// 아이콘 타일(색 바탕 + 흰 선) — 활동 이름(ACT 열쇠)으로
export const tile = (kind, size = 26) => { const a = ACT[kind] || ACT.prep; return `<span class="ico act-${a[1]}">${icon(a[0], size)}</span>`; };
