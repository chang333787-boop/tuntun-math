// 배포 버전 — app/version.json(앱이 처음에 캐시 없이 읽음) = 앱이 쓰는 파일 목록 + 내용 해시
//  버전이 바뀌면 앱이 모든 파일을 새로 받아 둔 뒤 시작한다(옛 파일과 새 파일이 섞이지 않게 · GitHub Pages 캐시 10분)
//  node tools/ver.mjs        → 다시 씀 · node tools/ver.mjs --check → 맞지 않으면 실패(시험용)
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, relative, dirname, normalize } from 'node:path';
const ROOT = new URL('..', import.meta.url).pathname, APP = join(ROOT, 'app');
const walk = (d) => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
const files = [...walk(join(APP, 'js')), ...walk(join(APP, 'css')), ...walk(join(ROOT, 'engine')), ...walk(join(ROOT, 'paper', 'js'))].filter((f) => /\.(js|css)$/.test(f)).sort();
const h = createHash('sha1');
for (const f of files) { h.update(relative(ROOT, f)); h.update(readFileSync(f)); }
// 미리 받을 목록 = 앱 시작(main.js)에서 import로 닿는 파일 + css(시험만 쓰는 엔진 파일 · 종이 앱 화면 파일은 받지 않음 — 버전마다 120KB 덜 받음 · 11-08) · 해시는 모든 파일로(어디가 바뀌어도 새 버전)
const reach = new Set(), q = [];
const add = (p) => { p = normalize(p); if (!reach.has(p) && files.includes(p)) { reach.add(p); q.push(p); } };
add(join(APP, 'js', 'main.js'));
while (q.length) { const f = q.shift(); for (const m of readFileSync(f, 'utf8').matchAll(/(?:from|import)\s*\(?\s*['"]([^'"]+\.js)/g)) add(join(dirname(f), m[1])); }
const out = JSON.stringify({ v: h.digest('hex').slice(0, 12), files: files.filter((f) => /\.css$/.test(f) || reach.has(f)).map((f) => relative(APP, f)) }, null, 1) + '\n';
const P = join(APP, 'version.json');
if (process.argv.includes('--check')) {
  let cur = ''; try { cur = readFileSync(P, 'utf8'); } catch (e) { /* */ }
  if (cur !== out) { console.log('✗ app/version.json이 지금 파일과 다름 — node tools/ver.mjs'); process.exit(1); }
  console.log('✓ app/version.json 맞음');
} else { writeFileSync(P, out); console.log('app/version.json', JSON.parse(out).v, JSON.parse(out).files.length, '파일'); }
