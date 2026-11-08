// 읽어 주기 — 이야기(문장제)를 기기의 한국어 목소리로 · 고를 수 있는 단추(기본은 누를 때만)
//  근거: 문장제 어려움은 언어와 묶임 [C-24] · 읽기 · 이해 · 바꾸기 오류가 40% [C-28] · 소리 내어 읽어 주기의 수학 점수 효과는 평균 +0.13 SD로 작고(Buzick & Stone 2014)
//    초등 학습 어려움 아이에게 더 큼(Elbaum 2007) → 모두에게 켜지 않고 필요한 아이가 누르게
//  분수 3/5 → '5분의 3' · □ → '네모' · m · kg … → 미터 · 킬로그램 … · 목소리가 없으면 말로 알림
import { icon } from './icons.js';
const SAY = `${icon('sound', 18)} 읽어 주기`;
export const hasSpeech = () => typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';
const koVoice = () => (hasSpeech() ? speechSynthesis.getVoices().find((v) => /^ko/i.test(v.lang)) || null : null);
export function sayText(el) {
  const c = el.cloneNode(true);
  c.querySelectorAll('.fr').forEach((f) => { const t = f.querySelector('.fr-t'), b = f.querySelector('.fr-b'); f.replaceWith(document.createTextNode(` ${b ? b.textContent : ''}분의 ${t ? t.textContent : ''} `)); });
  c.querySelectorAll('.sb-say').forEach((x) => x.remove());
  const U = { km: '킬로미터', cm: '센티미터', mm: '밀리미터', m: '미터', kg: '킬로그램', g: '그램', mL: '밀리리터', L: '리터', t: '톤' };
  return c.textContent.replace(/□/g, ' 네모 ').replace(/(\d\s*|\s)(km|cm|mm|kg|mL|m|g|L|t)(?=[\s.,?!)가-힣]|$)/g, (_, a, u) => `${a}${U[u]}`).replace(/\s+/g, ' ').trim();
}
export function stopSpeak() { if (hasSpeech()) speechSynthesis.cancel(); }
// 단추 하나를 붙임 · 다시 누르면 멈춤 · 반환 = 단추(없으면 null)
export function speakButton(box, onNoVoice = null) {
  if (!hasSpeech()) return null;
  const b = document.createElement('button'); b.type = 'button'; b.className = 'sb-say'; b.innerHTML = SAY; b.setAttribute('aria-label', '소리로 읽어 주기');
  b.addEventListener('click', () => {
    if (speechSynthesis.speaking) { stopSpeak(); b.innerHTML = SAY; return; }
    const v = koVoice();
    if (!v) { if (onNoVoice) onNoVoice(); return; }
    const u = new SpeechSynthesisUtterance(sayText(box)); u.voice = v; u.lang = v.lang; u.rate = 0.9;
    u.onend = u.onerror = () => { b.innerHTML = SAY; };
    b.innerHTML = `${icon('stop', 18)} 멈추기`; speechSynthesis.speak(u);
  });
  box.prepend(b); box.classList.add('has-say');   /* 좁은 화면에서 단추를 말풍선 오른쪽 위 작은 소리 그림으로(app.css) */
  return b;
}
