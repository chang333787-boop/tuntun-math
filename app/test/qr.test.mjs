// QR 모양 시험(읽기는 브라우저 BarcodeDetector로 따로 확인 — 10-31 40/40): node app/test/qr.test.mjs
import { qrMatrix, qrSVG } from '../js/qr.js';
let fail = 0;
const ok = (c, m) => { if (!c) { fail++; console.log('✗', m); } else console.log('✓', m); };
const url = 'https://chang333787-boop.github.io/tuntun-math/app/#/join?c=ABCDEF&n=12';
const M = qrMatrix(url), n = M.length;
ok(n === 33, `카드 주소(${url.length}자) → 판 4(33×33) — ${n}`);
const finder = (x0, y0) => [0, 6].every((k) => M[y0][x0 + k] && M[y0 + k][x0] && M[y0 + 6][x0 + k] && M[y0 + k][x0 + 6]) && M[y0 + 3][x0 + 3] && !M[y0 + 1][x0 + 1];
ok(finder(0, 0) && finder(n - 7, 0) && finder(0, n - 7), '찾기 무늬 셋');
ok(M[n - 8][8] === true, '늘 검은 칸');
ok([...Array(n - 16)].every((_, i) => M[6][8 + i] === ((8 + i) % 2 === 0)), '가로 시간 줄');
ok(qrMatrix('x'.repeat(120)) === null && qrSVG('x'.repeat(120)) === '', '너무 길면 만들지 않음');
ok(qrSVG(url).startsWith('<svg xmlns="http://www.w3.org/2000/svg"') && !qrSVG(url).includes('NaN'), 'SVG');
console.log(fail ? `FAIL ${fail}` : 'PASS');
process.exitCode = fail ? 1 : 0;
