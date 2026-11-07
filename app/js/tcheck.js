// (자리 잡기 — 팀 B의 '점검 내기' 화면이 들어오면 바뀜)
export function checkView(root, C) { root.innerHTML = `<div class="card"><h2>점검 내기</h2><p>준비 중이에요.</p><a class="btn" href="#/t/c/${C}">반 화면으로</a></div>`; }
export function checkCard() { return ''; }
