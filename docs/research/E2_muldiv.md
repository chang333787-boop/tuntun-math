# E2 곱셈 · 나눗셈 오개념 (2~4학년 중심 · 5~6학년 연결)

엔진에서 읽은 것: `engine/errors.js` BUGS(곱셈 mul.noCarry · preAdd · noShift · noShiftSw · same · zero / 나눗셈 div.dropZero · underQ · dropRem · swapQR), `concepts/mul.js` · `concepts/div.js` · `lessons/ops.js`(mulBugs · divBugs) · g2~g6 차시 bugs, `words.js` 곱셈·나눗셈 문장제 wrongs.
근거 강도: **상** = 실증 연구 둘 이상, 초록까지 확인 · **중** = 한 연구이거나 2차 인용으로만 내용 확인 · **하** = 문헌을 확인하지 못함(엔진 관찰).

## ① 핵심 개념표

| 개념(차시) | 오개념 — 아이 생각 | 드러나는 답 | 왜 생기나 | 가려내는 문항 조건 | 고치는 법 | 엔진 | 근거 |
|---|---|---|---|---|---|---|---|
| 곱셈의 뜻 — 묶음·동수누가 (2-1-6:3·6·7) | ×도 두 수를 합치는 것 | 4씩 3묶음 → 7 | 앞 규칙 넘겨 씀(덧셈) · 직관 모형(곱셈적 사고는 늦게 자람: 2학년 45%가 '조금', 5학년 48%만 늘) | a + k ≠ a × k(2 × 2 빼기 · a, k ≥ 3) | "몇씩 · 몇 묶음"을 먼저 말하고, 같은 수 더하기를 ×로 줄여 씀 · 단위 두 겹(개 / 묶음) | 있음 '곱 대신 합' · '묶음 수와 한 묶음의 수를 더함' · 문장제 '곱셈 대신 덧셈' | 상 [5][6][7] |
| 몇의 몇 배 (2-1-6:4) | 배 = 그만큼 더하기 · 몇 배를 묻는데 전체 수를 씀 | 3의 4배 → 7 · "12는 3의 몇 배" → 12 | 말·언어 · 지도 순서(배를 일찍 들이고 뒤에서 이어 쓰지 않음) | 전체 · 한 묶음 · 배가 서로 다른 수 | 배를 '묶음 수'로 바꿔 읽는 줄 그림 · 3~4학년 문장제에서 배를 다시 씀 | 있음(차시 bug 넷) | 중 [25] |
| 0과 1의 곱 (2-2-2:8) | 0을 곱하면 '아무것도 안 함' → 그대로 · 1을 곱하면 1 | 7 × 0 → 7 · 7 × 1 → 1 | 앞 규칙 넘겨 씀(+0은 그대로) | a ≥ 2 | 0씩 7묶음 · 7씩 0묶음 그림, 덧셈의 0과 나란히 | 있음 '0을 곱해도 그 수 그대로' · '1을 곱하면 1' | 중 [20](2차 인용) |
| 분배를 덧셈으로 (2-2-2:9 · 3-1-4:3~6 · 3-2-1:6) | 6 × 8 = 48이면 6 × 9 = 49 · 4 × 23 = 4 × 20 + 3 | 49 · 83(정답 92) | 직관 모형 — 9·10세가 교환은 잘 알지만 분배는 단서 답 ±1을 고름(곱셈 원리를 덧셈 원리와 헷갈림) | a ≥ 2, 일의 자리 o ≥ 1 → a×T + o ≠ a×(T+o) | 직사각형(넓이)을 20칸 · 3칸으로 자르기 · '몇씩 묶음' 맥락에서 먼저(그 맥락에서 가장 잘 앎) | **없음** | 중 [10][25] |
| 몇십 곱하기 (3-1-4:2 · 3-2-1:5 · 4-1-3:2 → 5-2-4:8) | "0을 붙인다"를 까닭 없이 → 0 개수 틀림 · 소수에 넘겨 씀 | 30 × 4 → 12 · 1200 / 2.5 × 10 → 2.50 | 뜻 없이 절차만 · 자연수 규칙 넘겨 씀 | 곱셈구구 곱이 0으로 끝나는 수(50 × 40 = 2000)에서 '0 개수 맞추기'가 200을 냄 · 소수는 답을 **글자로** 읽어야 2.50이 보임 | "몇십 = 몇의 10배"를 말로(엔진 tip) · 자리판 | 있음 mul.zero · '0의 개수를 틀림' / 2.50은 값이 2.5라 '옮길 자리 수를 하나 적게 셈'으로 잘못 이름 붙음 | 하(문헌 미확인) |
| 세로 곱셈 올림·자리 (3-1-4:4~6 · 3-2-1:3~8 · 4-1-3:3) | 절차 버그: 올린 수 안 더함 · 먼저 더함 · 둘째 줄 안 밀기 · 같은 자리끼리 · 부분곱 한 줄만 | 47 × 6 → 242 · 482 / 23 × 14 → 115 · 92 | 뜻 없이 절차만 — 막힌 자리를 땜질(repair) | 올림이 생기는 자리 · 곱하는 수 일의 자리 ≠ 0 | 둘째 줄 = 몇십을 곱한 것을 말로 · 부분곱을 넓이 칸에 적기 | 있음 noCarry · preAdd · noShift · same / 한 줄만은 **없음** | 중 [16][17][18][19] |
| 나눗셈의 뜻 — 등분·포함 (3-1-3:2·3) | ÷ = 나눠 주기만 → 몇씩 덜어 내기 · 몫으로 묶인 그림에서 막힘 · ÷를 한 번 빼기로 | 12 ÷ 3 → 9(한 번 뺌) · 3(사람 수) / 등분·포함 혼동은 숫자로 안 보임 | 직관 모형(나눠 주기가 뿌리 · 포함은 늦음) · 표상(나누는 수로 묶인 그림이 훨씬 쉬움) · 지도 순서(교과서가 두 맥락을 편의로 섞음) | 숫자로는 같은 답 → 단위(개 / 봉지) · 묶음 그림 고르기 | 나누는 수로 묶인 그림 → 몫으로 묶인 그림 차례 · 두 맥락을 각각 세로셈과 잇기 | 일부(차시 bug 넷) / 맥락 혼동은 **없음** | 상 [1][5][6][8][24] |
| 역관계 — 나누는 수와 몫 (3-1-3 · 4-1-6) | 나누는 수가 크면 몫도 크다(덧셈·곱셈처럼 함께 커짐) | "24 ÷ 4와 24 ÷ 6 중 몫이 큰 것" → 24 ÷ 6 | 앞 규칙 넘겨 씀 · 나눠 주기 경험만으로는 관계를 모름(6세 절반만 앎 · 포함이 등분보다 어려움) | 같은 수를 두 나누는 수로 비교 | 나누어 갖는 사람 수를 늘려 보며 한 명 몫 비교 | 일부(4-1-6 '나누는 수도 커진 것을 안 봄') / 3학년 비교 문항 **없음** | 상 [9][8] |
| 나머지 크기·몫 어림 (3-2-2:6·7 · 4-1-3:5~7) | 나머지가 나누는 수보다 커도 멈춤 · 어림한 몫을 안 고침 | 50 ÷ 7 → 6 … 8 · 196 ÷ 28 → 6 … 28 | 뜻 없이 절차만(나머지 < 나누는 수 확인 안 함) | 몫을 하나 작게 하면 나머지 ≥ 나누는 수가 되는 수 | 나누는 수 × 몫 + 나머지로 확인 · 몫 1 늘리기 / 줄이기를 말로 | 있음 div.underQ · '나머지가 나누는 수보다 큼' · '어림한 몫을 고치지 않음' | 하(문헌 미확인) |
| 나머지 해석 — 문장제 (3-2-2:6·7·10 문장제) | 계산한 몫을 그대로 답 · 올려야 할 때 버림 · 나머지를 답으로 | 한 대 40명, 328명 → 8(정답 9) · 8 … 8 | 말·언어 · 답을 상황과 떼어 놓음(sense-making 단절) — 6학년 상위 집단도 해석 단계에서 틀림 | 나누어떨어지지 않음 + 물음이 '모두 태우려면'(올림) · '몇 개까지'(버림) · '남는 것'(나머지) | 계산 뒤 "이 수가 상황에서 무엇?"을 한 줄로 · 그림 · 더해 가기 전략 허용(3학년 14명 중 11명이 더하기로 맞힘 — 2차 인용) | **없음**(문장제는 몫 · 나머지를 따로 묻기만) | 상 [11][12][13][22] |
| 몫의 0 · 내림 (3-2-2:4·5·9·10 · 4-1-3:6) | 나눌 수 없는 자리를 건너뜀 · 자리마다 따로 나눔 | 618 ÷ 3 → 26(정답 206) · 72 ÷ 3 → 20(정답 24) | 뜻 없이 절차만(자릿값) · 지도 순서(교과서에 몫 가운데 0 지도가 적음) | 몫 가운데 0이 생기는 수 · 앞자리 나머지가 생기는 수 | 몫 자리를 칸으로 미리 그리고 0을 적기 · 십 모형을 일 모형으로 풀기 | 있음 div.dropZero · div.dropRem · '0을 빠뜨림' | 중 [23] |
| 곱하면 커진다 · 나누면 작아진다 (5-2-2 · 5-2-4 · 6-1-3 · 6-2-2 / 뿌리 2~4학년) | 곱하면 늘 커지고 나누면 늘 작아짐 → 곱하는 수가 1보다 작으면 나눗셈을 고름 | "1 kg 3000원, 0.8 kg은?" → 3000 ÷ 0.8 · "6 × 0.8 > 6" | 자연수 규칙 넘겨 씀 · 직관 모형(되풀이 더하기 · 나눠 주기가 수업 뒤에도 남음 · 연산을 수의 종류로 고름) | 곱하는 수 · 나누는 수가 1보다 작은 문장제 · 크기 판단 문항 | 연산을 고르기 **전에** 답 크기부터 어림(어림이 연산 고르기보다 쉬움) | 일부(5-2-4:8 '0.1을 곱하면 커진다고 봄' · 문장제 '나눗셈 대신 곱셈') / 연산 고르기 · 크기 판단 **없음** | 상 [1][2][3][4] |
| 큰 수 ÷ 작은 수만 (6-1-1:2 · 6 문장제 / 뿌리 3-1-3) | 나누어지는 수는 늘 더 크다 → 두 수를 바꿔 나눔 | 3 L를 5명이 → 5 ÷ 3 · 5/3 | 직관 모형(정수 · 작은 수로 나누기를 선호) · 3~4학년엔 늘 큰 ÷ 작 | 나누어지는 수 < 나누는 수 | 1 ÷ 5 = 1/5부터 그림 · 3~4학년에도 "사탕 3개를 4명이?" 질문 | 있음 '나누는 수를 위로 씀' · 문장제(6학년만) '나누는 수와 나뉘는 수를 바꿈' | 상 [1][3] |
| 문장제 구조 — 몇 배 거꾸로 · 모르는 자리 (3-1-3 · 4-1-3 문장제) | '배' · '씩' 낱말만 보고 곱함 | "형 구슬 24개는 동생의 3배. 동생은?" → 72 | 말·언어(관계 문장과 연산이 어긋나면 거꾸로 셈) · 지도 순서(교과서는 결과 모르는 꼴이 대부분 · 4학년도 결과 모르는 꼴을 가장 잘 풂) | 모르는 것이 기준량 · 한 묶음 | 관계를 띠 그림으로 먼저 · 곱셈 구조(같은 묶음 · 비율 · 비교 · 배열 · 조합)를 고루 | **없음**(곱셈 문장제는 결과 모르는 꼴만) | 중 [14][21][26] |

## ② 오개념 · 실수 · 버그를 가르는 법

- **실수(slip)**: 방법은 맞고 한 곳만 삐끗 · 다시 풀면 맞음. 곱셈구구 오답 대부분은 표 안의 다른 곱(이웃 곱 간섭)이다 [15] → 엔진의 '곱셈구구 하나를 틀림' · '이웃 칸'은 실수로 두고 오개념 처방을 하지 않는다.
- **버그(절차 오류)**: 틀린 절차를 여러 문제에 꾸준히 씀 — 그 규칙을 문제 숫자로 돌린 예측이 아이 답과 맞는다 [17][18]. 다만 체계적 오류는 옮겨 다닌다(1년 뒤 23%가 같은 또는 **다른** 체계적 오류 [16] · repair theory의 bug migration [18]). → 하나의 id보다 **같은 막힘 무리**(올림 무리 noCarry · preAdd / 자릿값 무리 noShift · zero · dropZero)로 모아 '확실'을 정하면 덜 놓친다.
- **오개념**: 절차가 아니라 연산의 **뜻**에 대한 믿음 · 수업 뒤에도 남는 직관 모형 [1][3]. 계산은 맞히면서 연산 고르기 · 크기 판단 · 그림에서만 드러난다.
- 가르는 규칙
  1. 숫자 예측이 2번 이상 맞고 반대 증거가 적음(현행 judge) → 버그.
  2. 오개념은 **갈래가 다른 문항**(계산 · 크기 판단 · 연산 / 그림 고르기) 중 둘 이상이 같은 방향일 때만. 계산 정답은 오개념의 반대 증거로 쓰지 않는다(6 × 0.8 = 4.8을 맞혀도 '곱했는데 작아져 이상하다'면 남아 있음).
  3. 숫자로 못 가리는 것(등분 / 포함, 3 × 4와 4 × 3의 구조)은 숫자 진단에서 빼고 단위 · 그림 문항으로 — '같은 답, 다른 생각'.
  4. 이유 한 줄("곱하면 커지니까")에서 규칙 진술이 나오면 오개념.

## ③ 엔진에 새로 넣을 후보(우선순위)

1. **나머지 해석**(상 · 3학년 직결 · 지금 비어 있음) — words.js에 물음 꼴 셋: need(모두 담으려면 → q + 1) · fit(몇 개까지 → q) · left(남는 것 → r).
   ```
   { id:'rem.floor', kind:'concept', name:'올려야 하는데 몫만 답함', when: ask==='need' && r>0, pred: q }
   { id:'rem.asAns', kind:'concept', name:'나머지를 답으로 씀', when: ask!=='left' && r>0 && r!==q, pred: r }
   { id:'rem.ceil',  kind:'concept', name:'남는 것까지 하나로 셈', when: ask==='fit' && r>0, pred: q+1 }
   // testable: r > 0 (나누어떨어지면 못 가림)
   ```
2. **분배를 덧셈으로**(중 · 3-2-1:6 · 3-1-4 · 2-2-2:9)
   ```
   { id:'mul.addDist', op:'×', st:['W'], kind:'concept', name:'곱셈을 쪼갠 뒤 한쪽만 곱함(분배를 덧셈처럼)',
     f: X => { [s,t] = 한 자리·두 자리; if (s<2 || t<10 || t%10===0) return null;
               T = t - t%10, o = t%10; return [MW(s*T + o), MW(s*o + T)] } }   // 4 × 23 → 83 · 32
   // 곱셈표 이어 쓰기(a × b를 알 때 a × (b+1)): pred a*b + 1
   ```
3. **역관계**(상 · 3-1-3 판단 문항 새로) — "24 ÷ 4와 24 ÷ 6 중 몫이 큰 것" · 4-1-3 "240 ÷ 30과 240 ÷ 40". 판정: 나누는 수가 큰 쪽을 고름 → `div.inverse`(concept). 두 번 같은 방향일 때만 '확실'.
4. **곱하면 커진다 · 나누면 작아진다**(상 · 5~6 연결)
   ```
   words.mul:    if (곱하는 수 < 1) wrongs.push({ t: E(a,'÷',b), name:'곱하면 커진다고 봄 — 작아질 거라 나눗셈을 고름' })
   words.divide: if (나누는 수 < 1) '나눗셈 대신 곱셈을 고름' → '나누면 작아진다고 봄'으로 이름을 바꿈
   판단 문항: "6 × 0.8은 6보다 (큰가 / 작은가)" — 규칙 ②-2대로 갈래 둘이 맞을 때만 concept
   ```
5. **몇 배 거꾸로**(중) — words.js 'times'에 기준량 모르는 꼴: right = A ÷ k, `cmp.reverse` pred = A × k.
6. **부분곱 한 줄만**(하) — `mul.oneRow`: 두 자리 곱하는 수(일의 자리 ≠ 0)에서 pred a × (b % 10) · a × (b − b % 10).
7. **이름 고치기**(하) — 5-2-4:8에서 답 글자가 원래 수 + '0'(2.5 × 10 → "2.50")이면 '자연수의 0 붙이기를 소수에 넘겨 씀'. 값이 아니라 글자로 읽어야 한다(answerOf가 지금은 값으로 읽음).
- 등분 / 포함은 새 버그보다 **묶음 그림 고르기 문항**(몫으로 묶인 그림이 가려냄 [8])이 맞다.

## ④ 참고문헌(확인한 주소)

1. Fischbein, E., Deri, M., Nello, M. S., & Marino, M. S. (1985). The role of implicit models in solving verbal problems in multiplication and division. *JRME*, 16(1), 3–17. https://doi.org/10.2307/748969 (초록: 5·7·9학년 623명, 되풀이 더하기 · 나눠 주기 모형)
2. Bell, A., Fischbein, E., & Greer, B. (1984). Choice of operation in verbal arithmetic problems: The effects of number size, problem structure and context. *ESM*, 15(2), 129–147. https://doi.org/10.1007/BF00305893 (서지 확인 · 내용은 2차 인용)
3. Bell, A., Greer, B., Grimison, L., & Mangan, C. (1989). Children's performance on multiplicative word problems: Elements of a descriptive theory. *JRME*, 20(5), 434–449. https://doi.org/10.5951/jresematheduc.20.5.0434 (초록: 정수 · 작은 수로 나누기 선호, '곱하면 커진다', 어림이 연산 고르기보다 쉬움)
4. Graeber, A. O., & Tirosh, D. (1990). Insights fourth and fifth graders bring to multiplication and division with decimals. *ESM*, 21(6), 565–588. https://doi.org/10.1007/BF00315945 (서지만 확인)
5. Mulligan, J. T., & Mitchelmore, M. C. (1997). Young children's intuitive models of multiplication and division. *JRME*, 28(3), 309–330. https://nctm.org/Publications/journal-for-research-in-mathematics-education/1997/Vol28/Issue3/Young-Children_s-Intuitive-Models-of-Multiplication-and-Division
6. Kouba, V. L. (1989). Children's solution strategies for equivalent set multiplication and division word problems. *JRME*, 20(2), 147–158. https://doi.org/10.2307/749279
7. Clark, F. B., & Kamii, C. (1996). Identification of multiplicative thinking in children in grades 1–5. *JRME*, 27(1), 41–51. https://doi.org/10.2307/749196
8. Squire, S., & Bryant, P. (2002). The influence of sharing on children's initial concept of division. *JECP*, 81(1), 1–43. https://doi.org/10.1006/jecp.2001.2640 (초록 https://pubmed.ncbi.nlm.nih.gov/11741373/)
9. Correa, J., Nunes, T., & Bryant, P. (1998). Young children's understanding of division: The relationship between division terms in a noncomputational task. *J. Educ. Psychol.*, 90(2), 321–329. https://doi.org/10.1037/0022-0663.90.2.321
10. Squire, S., Davies, C., & Bryant, P. (2004). Does the cue help? Children's understanding of multiplicative concepts in different problem contexts. *BJEP*, 74(4), 515–532. https://doi.org/10.1348/0007099042376364
11. Silver, E. A., Shapiro, L. J., & Deutsch, A. (1993). Sense making and the solution of division problems involving remainders. *JRME*, 24(2), 117–135. https://doi.org/10.2307/749216
12. Li, Y., & Silver, E. A. (2000). Can younger students succeed where older students fail? An examination of third graders' solutions of a division-with-remainder (DWR) problem. *JMB*, 19(2), 233–246. https://doi.org/10.1016/S0732-3123(00)00046-8 (결과 11/14는 2차 인용: https://link.springer.com/chapter/10.1007/978-3-032-16065-2_17)
13. Verschaffel, L., De Corte, E., & Lasure, S. (1994). Realistic considerations in mathematical modeling of school arithmetic word problems. *Learning and Instruction*, 4(4), 273–294. https://doi.org/10.1016/0959-4752(94)90002-7 (10~11세 · 문제 문항 10개 중 8개에서 현실 반응 0~17% · 버스 문항 예 DeFranco & Curcio 1997 — 2차: https://sites.unipa.it/grim/Jdecorte.PDF)
14. Lewis, A. B., & Mayer, R. E. (1987). Students' miscomprehension of relational statements in arithmetic word problems. *J. Educ. Psychol.*, 79(4), 363–371. https://doi.org/10.1037/0022-0663.79.4.363 (거꾸로 셈 · 일관성 효과는 2차 인용 · '배' 문장에 적용한 것은 우리 확장)
15. Campbell, J. I. D., & Graham, D. J. (1985). Mental multiplication skill: Structure, process, and acquisition. *Canadian J. Psychol.*, 39(2), 338–366. https://doi.org/10.1037/h0080065 (표 안 다른 곱 오류는 2차 인용)
16. Cox, L. S. (1975). Systematic errors in the four vertical algorithms in normal and handicapped populations. *JRME*, 6(4), 202–220. https://doi.org/10.2307/748696
17. Brown, J. S., & Burton, R. R. (1978). Diagnostic models for procedural bugs in basic mathematical skills. *Cognitive Science*, 2(2), 155–192. https://doi.org/10.1207/s15516709cog0202_4
18. VanLehn, K. (1990). *Mind bugs: The origins of procedural misconceptions*. MIT Press. (서지 확인 · bug migration은 repair theory 요약 https://instructionaldesign.org/?p=195)
19. Attisha, M., & Yazdani, M. (1984). An expert system for diagnosing children's multiplication errors. *Instructional Science*, 13(1), 79–92. https://doi.org/10.1007/BF00051842
20. Anthony, G. J., & Walshaw, M. A. (2004). Zero: A "none" number? *Teaching Children Mathematics*, 11(1), 38–42. https://doi.org/10.5951/tcm.11.1.0038 ('아무것도 안 함' 설명은 2차 인용)
21. Greer, B. (1992). Multiplication and division as models of situations. In D. A. Grouws (Ed.), *Handbook of research on mathematics teaching and learning* (pp. 276–295). Macmillan. (서지 · 구조 갈래는 2차 인용)
22. 하미현 · 장혜원 (2016). 나머지가 있는 나눗셈 문장제에 대한 초등학교 6학년 학생들의 해결 전략 및 오류 분석. 한국초등수학교육학회지, 20(4), 717–735. https://www.earticle.net/Article/A307838
23. 장혜원 · 최민아 · 임미인 (2014). 0처리 오류에 기초한 교과용 도서 분석 및 활동 구성. 한국초등수학교육학회지, 18(2), 257–278. https://www.earticle.net/Article/A233104
24. 임재훈 (2013). 포함제와 등분제 맥락에서 자연수 나눗셈 계산법 지도의 문제. 한국초등수학교육학회지, 17(3), 395–411. https://www.earticle.net/Article/A233084
25. 강문봉 · 김정하 (2018). 곱셈 지도에 관한 고찰. 한국초등수학교육학회지, 22(4), 369–384. https://www.earticle.net/Article/A347837
26. 임자선 · 김성준 (2015). 곱셈과 나눗셈 문장제 유형에 따른 문제해결능력. 한국초등수학교육학회지, 19(4), 501–525. https://www.earticle.net/Article/A268987
