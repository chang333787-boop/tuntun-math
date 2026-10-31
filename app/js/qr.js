// QR 부호(밖 라이브러리 X) — 아이 카드에 들어가기 주소를 찍어 크롬북 카메라 · 태블릿으로 바로 열게
//  바이트 모드 · 오류 정정 L · 판 1~5(한 덩어리 — 글자 약 100자까지) · 마스크 여덟 가운데 벌점이 가장 낮은 것
//  qrSVG(글, { px }) → <svg> 글 · 너무 길면 '' · 확인: 브라우저 BarcodeDetector로 읽어 봄(app.test는 모양만)
const VER = [null, [26, 7], [44, 10], [70, 15], [100, 20], [134, 26]];   /* [모든 낱말, 오류 정정 낱말] — L · 한 덩어리 */
const ALIGN = [null, null, 18, 22, 26, 30];

// GF(256) · 리드-솔로몬
const EXP = new Array(512), LOG = new Array(256);
(() => { let x = 1; for (let i = 0; i < 255; i++) { EXP[i] = x; LOG[x] = i; x <<= 1; if (x & 0x100) x ^= 0x11d; } for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255]; })();
const mul = (a, b) => (a && b ? EXP[LOG[a] + LOG[b]] : 0);
function rsGen(n) { let g = [1]; for (let i = 0; i < n; i++) { const ng = new Array(g.length + 1).fill(0); for (let j = 0; j < g.length; j++) { ng[j] ^= g[j]; ng[j + 1] ^= mul(g[j], EXP[i]); } g = ng; } return g; }
function rsEc(data, n) { const g = rsGen(n), r = [...data, ...new Array(n).fill(0)]; for (let i = 0; i < data.length; i++) { const c = r[i]; if (c) for (let j = 0; j < g.length; j++) r[i + j] ^= mul(g[j], c); } return r.slice(data.length); }

function codewords(bytes) {
  for (let v = 1; v <= 5; v++) {
    const [tot, ec] = VER[v], cap = tot - ec;
    if (4 + 8 + bytes.length * 8 > cap * 8) continue;
    const bits = []; const put = (val, len) => { for (let i = len - 1; i >= 0; i--) bits.push((val >>> i) & 1); };
    put(4, 4); put(bytes.length, 8); bytes.forEach((b) => put(b, 8));
    put(0, Math.min(4, cap * 8 - bits.length)); while (bits.length % 8) bits.push(0);
    const data = []; for (let i = 0; i < bits.length; i += 8) data.push(bits.slice(i, i + 8).reduce((a, b) => (a << 1) | b, 0));
    for (let p = 0; data.length < cap; p++) data.push(p % 2 ? 0x11 : 0xec);
    return { v, all: [...data, ...rsEc(data, ec)] };
  }
  return null;
}

function build(v, all, mask) {
  const n = 17 + 4 * v, M = Array.from({ length: n }, () => new Array(n).fill(false)), F = Array.from({ length: n }, () => new Array(n).fill(false));
  const set = (x, y, d) => { M[y][x] = d; F[y][x] = true; };
  const finder = (cx, cy) => { for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) { const x = cx + dx, y = cy + dy; if (x < 0 || y < 0 || x >= n || y >= n) continue; const d = Math.max(Math.abs(dx), Math.abs(dy)); set(x, y, d !== 2 && d !== 4); } };
  finder(3, 3); finder(n - 4, 3); finder(3, n - 4);
  for (let i = 0; i < n; i++) { if (!F[6][i]) set(i, 6, i % 2 === 0); if (!F[i][6]) set(6, i, i % 2 === 0); }
  if (ALIGN[v]) { const a = ALIGN[v]; for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) set(a + dx, a + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1); }
  // 형식 자리(나중에 채움)
  for (let i = 0; i < 9; i++) { F[8][i] = true; F[i][8] = true; } for (let i = 0; i < 8; i++) { F[8][n - 1 - i] = true; F[n - 1 - i][8] = true; }
  // 자료 놓기(오른쪽 아래에서 두 줄씩 지그재그 · 6번 세로줄은 건너뜀)
  let k = 0; const bitAt = (i) => (i < all.length * 8 ? (all[i >>> 3] >>> (7 - (i & 7))) & 1 : 0);
  for (let right = n - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < n; vert++) for (let j = 0; j < 2; j++) {
      const x = right - j, up = ((right + 1) & 2) === 0, y = up ? n - 1 - vert : vert;
      if (F[y][x]) continue;
      M[y][x] = !!bitAt(k++);
    }
  }
  // 마스크
  const MASK = [(x, y) => (x + y) % 2 === 0, (x, y) => y % 2 === 0, (x) => x % 3 === 0, (x, y) => (x + y) % 3 === 0, (x, y) => (Math.floor(y / 2) + Math.floor(x / 3)) % 2 === 0, (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0, (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0, (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0][mask];
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (!F[y][x] && MASK(x, y)) M[y][x] = !M[y][x];
  // 형식 정보(L = 01 · 마스크)
  const data = (1 << 3) | mask; let rem = data; for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
  const bits = ((data << 10) | rem) ^ 0x5412, b = (i) => ((bits >>> i) & 1) === 1;
  for (let i = 0; i <= 5; i++) M[i][8] = b(i);
  M[7][8] = b(6); M[8][8] = b(7); M[8][7] = b(8);
  for (let i = 9; i < 15; i++) M[8][14 - i] = b(i);
  for (let i = 0; i < 8; i++) M[8][n - 1 - i] = b(i);
  for (let i = 8; i < 15; i++) M[n - 15 + i][8] = b(i);
  M[n - 8][8] = true;   /* 늘 검은 칸 */
  return M;
}
// 벌점(읽기 쉬운 마스크 고르기) — 같은 색 다섯 넘게 이어짐 · 2×2 덩이 · 찾기 무늬 닮은꼴 · 검은 칸 비율
function penalty(M) {
  const n = M.length; let p = 0;
  const line = (get) => { for (let i = 0; i < n; i++) { let run = 1; for (let j = 1; j <= n; j++) { if (j < n && get(i, j) === get(i, j - 1)) run++; else { if (run >= 5) p += run - 2; run = 1; } } const s = Array.from({ length: n }, (_, j) => (get(i, j) ? 1 : 0)).join(''); p += 40 * ((s.match(/(?=10111010000|00001011101)/g) || []).length); } };
  line((i, j) => M[i][j]); line((i, j) => M[j][i]);
  for (let y = 0; y < n - 1; y++) for (let x = 0; x < n - 1; x++) { const c = M[y][x]; if (c === M[y][x + 1] && c === M[y + 1][x] && c === M[y + 1][x + 1]) p += 3; }
  const dark = M.flat().filter(Boolean).length; p += 10 * Math.floor(Math.abs((dark * 100) / (n * n) - 50) / 5);
  return p;
}
export function qrMatrix(text) {
  const bytes = [...new TextEncoder().encode(String(text))], cw = codewords(bytes); if (!cw) return null;
  let best = null, bp = Infinity;
  for (let m = 0; m < 8; m++) { const M = build(cw.v, cw.all, m), p = penalty(M); if (p < bp) { bp = p; best = M; } }
  return best;
}
export function qrSVG(text, { px = 120 } = {}) {
  const M = qrMatrix(text); if (!M) return '';
  const n = M.length, q = 4, size = n + 2 * q;
  let d = ''; M.forEach((row, y) => row.forEach((on, x) => { if (on) d += `M${x + q} ${y + q}h1v1h-1z`; }));
  return `<svg xmlns="http://www.w3.org/2000/svg" class="qr" viewBox="0 0 ${size} ${size}" width="${px}" height="${px}" shape-rendering="crispEdges" role="img" aria-label="들어가기 주소 QR"><rect width="${size}" height="${size}" fill="#fff"/><path d="${d}" fill="#000"/></svg>`;
}
