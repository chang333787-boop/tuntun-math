# E1 수 개념 · 자릿값 · 덧셈 · 뺄셈 (1~3학년 중심) — 오개념 근거 정리

- 범위: catalog.js의 1-1-1 · 1-1-3 · 1-1-5 · 1-2-1 · 1-2-2 · 1-2-4 · 1-2-6 · 2-1-1 · 2-1-3 · 2-2-1 · 3-1-1 · 4-1-1(큰 수).
- 읽은 엔진 코드: `engine/errors.js`(BUGS — 이 영역 것은 add.noCarry · add.concat · add.align · sub.big · sub.noDec · sub.zero 여섯), 차시 오답 이름(`g1~g4.js` · `lessons/ops.js` · `concepts/num.js`).
- 확인 방법: 서지는 Crossref · OpenAlex · PubMed로 DOI를 맞췄고, 내용은 초록이나 원문 PDF에서 읽은 것만 썼다. 예측 답은 엔진의 `colSub` · `colAdd`를 그대로 옮겨 돌려 확인했다(`tools/sim*.mjs`).
- 쓰지 않은 것: BUGGY의 개별 버그 이름(0−N=N 등)은 원문을 읽지 못해 뺐다. Hart(1981, CSMS)는 11~16세 대상이고 내용을 확인하지 못해 표에 쓰지 않았다. 한국의 자릿값 · 큰 수 전용 실증 연구는 찾지 못했다.

## ① 핵심 개념별 표

| 개념(차시 id) | 오개념 — 아이 생각 | 드러나는 답 | 왜 생기나 | 가려내는 문항 조건 | 고치는 법(근거) | 엔진에 있음? | 강도 · 출처 |
|---|---|---|---|---|---|---|---|
| 세기 · 기수 (1-1-1:2 · 3) | 수 이름과 물건을 하나씩 짝짓지 못함 · 마지막에 센 수가 '모두 몇'인 줄 모름 | 7개 → 6 · 8 | 표상(흩어진 배열) · 대응 | 흩어진 배열 6~9개. ±1만 보여서 답 하나로는 실수와 못 가름 | 지도 효과를 검증한 연구는 못 찾음(일반 지도만 있음) | 차시: '세다가 하나 어긋남' · '수 이름과 수를 하나 어긋나게 짝지음' | 중 [18][K4] |
| 몇째 (1-1-1:5) | '셋째'를 '세 개'로 받아들임 | 셋째 색칠 → 3개 칠함 | 말(같은 수 낱말) · 기수가 서수보다 먼저 발달 | '셋째'와 '세 개'를 짝 문항으로 · 세는 방향 바꾸기 | 짝 문항으로 맞대기 | 차시: '몇째와 몇 개를 헷갈림' · '반대쪽부터 셈' | 중 [17] |
| 0의 뜻 (1-1-3:12) | 0은 '없음'이라 수가 아님 → 0만 따로 쓰는 규칙을 지어냄 | 6+0 → 7 또는 0 · 5−5 → 5 | 직관 모형 | n±0 · n−n · 0+n을 섞어 냄 | 0도 수직선의 한 수로 다루기(근거는 발달 연구만, 지도 연구는 못 찾음) | 차시: '0을 1처럼 셈' · '0을 더하면(빼면) 0' · '같은 수를 빼도 그대로' | 중 [16] |
| 순서 · 크기 비교 (1-1-1:6~8 · 1-1-5:8 · 9 · 1-2-1:4 · 5 · 2-1-1:7 · 2-2-1:7) | 오른쪽(낱개) 숫자로 비교함 · '작은'을 '큰'으로 들음 | 48 ○ 51 → 48이 큼 · 9보다 1 작은 수 → 10 | 앞 규칙 넘겨 씀(한 자리 비교) · 말 | 십의 자리는 작고 일의 자리는 큰 쌍(48 · 51) · 자리 수가 다른 쌍(98 · 102) | 짧은 훈련으로 크게 나아짐(3~7세) | 차시: '일의 자리만 비교함' · '높은 자리부터 비교하지 않음' · '1만큼 더 큰 수와 더 작은 수를 바꿈'. 자리 수가 다른 쌍은 g4에만 있음 | 중 [15][23](23은 3~4세 대상) |
| 묶음과 낱개 (1-1-5:5 · 6 · 1-2-1:3) | 10개 묶음도 '하나'로만 셈(낱개 단위만 앎) | 묶음 3 · 낱개 4 → 7 또는 43 → 34 | 표상: 10을 단위로 못 봄 | 묶음 수 ≠ 낱개 수 · 낱개 0 넣기 | 말 · 숫자 · 10씩 묶은 양을 잇는 '세 쌍' 짓기를 오래 | 차시: '묶음 수와 낱개 수를 더함' · '묶음과 낱개 자리를 바꿈' | 상 [5][8] |
| 자리 숫자의 값 (2-1-1:5 · 2-2-1:5 · 4-1-1:3) | 숫자는 숫자만큼('16의 1은 하나') | 365의 6이 나타내는 값 → 6 · 자리를 거꾸로 셈 | 뜻 없이 절차(자리 이름만 외움) | 숫자와 값이 다른 자리(십 · 백) · 같은 숫자가 두 번 나오는 수(626) | 수 모형 ↔ 숫자 카드를 한 단계씩 기록 | 차시: '숫자만 씀' · '숫자 대신 나타내는 값을 씀' · '자리를 거꾸로 셈' | 상 [8][9][6] |
| 수 쓰기 · 0이 자리를 지킴 · 큰 수 (1-1-5:3 · 2-1-1:4 · 2-2-1:4 · 4-1-1:2~5) | 들은 대로 이어 씀(확장 쓰기) · 0을 빠뜨림 · 네 자리씩 끊는 줄 모름 | 사백육 → 4006 · 육백사십이 → 600402 · 406 → 46 · 3만 25 → 325 또는 3000025 | 말을 숫자로 옮기는 단계의 구문 오류 | 0이 있는 수와 0 없이 세 부분인 수(642)를 둘 다 · 긴 답도 받는 칸 | 자릿값 표에 써 넣기. 1학년의 자릿값 이해가 3학년 덧셈을 예측함 | 부분: '빈 자리에 0을 쓰지 않음' · '10 뒤에 낱개를 이어 씀'(십몇만) · '네 자리씩 끊지 않음'. **세 자리 이상 확장 쓰기는 없음** | 상(외국 자료) [10][11][12][13] · 한국 연구 못 찾음 |
| 모으기 · 가르기 · 10 만들기 (1-1-3:2 · 3 · 1-1-5:2 · 4 · 1-2-4:4~6) | 부분-전체 관계가 없어 가르기도 더하기로 함 | 7을 3과 □ → 10 · 8+□=10 → 18 | 지도 순서(합을 먼저 배움) | □를 앞 · 뒤로 옮겨 가며 | 부분-부분-전체 수업 → 수 개념 · 문장제 · 자릿값이 모두 나아짐 | 있음: '가르기를 모으기로 함' · '두 수를 그냥 더함' · '10 가르기가 하나 어긋남' | 상 [20] |
| 덧셈 · 뺄셈의 뜻(문장제) (1-1-3:5 · 9) | 낱말과 숫자만 보고 연산을 고름('더' → +) | "8개는 5개보다 몇 개 더 많아요?" → 13 | 말(비교 구문) | 비교형 · 낱말이 반대 연산을 가리키는 문장 | '몇 개 더'를 '짝 없는 것 몇 개'로 바꿔 물으면 잘 풂 | 값만 있음: '뺄셈을 함' · '덧셈을 함'. 문장 구조로 나눈 갈래는 없음 | 상 [21][22][K5] |
| 이어 세기 · 거꾸로 세기 (1-1-3:6 · 10) | 첫 수를 다시 셈 | 5+3 → 7 · 9−3 → 7 | 첫 수의 '모두 몇'을 '세는 말'로 바꾸는 단계가 빠짐 | b ≥ 2(b=1이면 '그 수를 그대로 씀'과 같아짐) | 하위 기능을 한 번 가르치니 8명 중 7명이 이어 세기를 함 | 부분: ops '하나 차이(세다가 어긋남)'. 방향(−1/+1)을 안 갈라 실수로 묶임 | 중 [19] |
| 받아올림 (1-2-6:2 · 2-1-3:2~4 · 3-1-1:3 · 4) | 자리마다 따로 더하고, 10이 넘는 것을 윗자리로 못 넘김 | 38+45 → 713 · 73 · 34+5 → 84 | 뜻 없이 절차 | 일의 자리 합 ≥ 10 · 자리 수가 다른 두 수 | 수 모형으로 바꾸고 바로 숫자로 적기 · 아이 방법 말하기 | 있음: add.concat · add.noCarry · add.align + 차시 | 상 [1][6][7][30][K3] |
| 받아내림 (1-2-6:4 · 2-1-3:5 · 7 · 3-1-1:6) | 위아래 상관없이 큰 수에서 작은 수 · 받아내리고 윗자리를 안 줄임 | 53−27 → 34(SFL) · 36(BND) | 막힌 자리를 아이가 '고친' 규칙(repair) | **일의 자리 차가 5면 두 버그 답이 같음**(52−27 → 35 · 두 자리 받아내림 1620문항 중 180) → 피함 | 10을 낱개로 풀기 + 기록 · 이해 중심 수업 | 있음: sub.big · sub.noDec | 상 [1][2][4][7] |
| 0에서 받아내림 (2-1-3:6 · 3-1-1:7) | 0에서는 빌릴 수 없으니 건너뛰거나 멈춤 | 306−187(정답 119) → 281 SFL · 29 BAZ · 229 BND · **129 SBZ** | 막힘(0)을 고친 규칙 | 가운데 0이 있고 그 오른쪽에서 받아내림 · 700−5는 버그 셋이 모두 705라 못 씀 | 100을 10묶음 10개로 바꾸는 단계를 보이기 | sub.zero(=BAZ) · noDec · big 있음. **Stop-Borrow-At-Zero는 없음** | 상 [4][K3] |
| 세 수의 계산 (1-2-4:2 · 3 · 2-1-3:8) | 하나를 빠뜨림 · −를 앞 수에서 떼어 내고 뒤를 먼저 묶음 | 19−3+6 → 10 · 16 | 식을 읽는 방식 | a−b+c 꼴 | 첫 계산 답을 위에 적기 · '부호+수'를 한 덩이로 보기 | 있음: '뒤의 두 수를 먼저 계산함' · '앞의 두 수만' · '하나 빠뜨림' | 중 [28] |
| 덧셈과 뺄셈의 관계 (1-1-3:13 · 2-1-3:9) | 세 수의 부분-전체 구조를 못 봄 | 17+25=42를 보고 → 25−17=8 | 따로따로 배운 지도 순서 | 가장 큰 수가 놓이는 자리 | 더한 만큼 빼면 그대로(되돌리기) 경험 | 있음: '가장 큰 수(합)에서 빼야 함을 모름' 등 | 중 [29] |
| □가 있는 식 · 등호 (1-1-3:13 · 2-1-3:10 · 11) | '='는 '답을 써라' · 보이는 수를 모두 계산함 | □+5=12 → 17 · 8+4=□+5 → 12 · 17 | 앞 규칙 넘겨 씀(a+b=□ 꼴만 보아 옴) | □가 왼쪽에 있거나 양쪽에 연산이 있는 식 | 17=9+8처럼 비표준 꼴로 연습 · 등호의 뜻을 직접 맞대기 | 부분: '빼야 할 때 더함' · '보이는 수를 그대로 씀'. **양쪽 연산 식과 '등호=답' 모형은 g4에만** | 상 [24][25][26][27][31][K1] |

## ② 오개념과 실수 · 버그를 가르는 법

- **세 갈래**
  - 버그: 틀린 절차. 숫자가 바뀌어도 그 규칙대로 예측한 답이 나온다. 엔진의 `testable`이 이것을 본다.
  - 오개념: 뜻이나 표상이 틀린 것. 문항 꼴(그림 · 말 · 식)이 바뀌어도 같은 생각이 나온다.
  - 실수: 방법은 맞고 한 곳만 삐끗한 것. 되풀이되지 않는다.
- **버그는 흔들린다.** 한 번 보인 증상이 다음 문항에서 안 나올 수 있다[4]. Repair theory도 버그마다 빈도와 안정성이 다르다고 예측한다[2]. 김수미(2012)의 3~6학년 580명 자료에서는 같은 오류가 1~2번 되풀이된 경우가 많았고 3번 이상은 드물었다[K2]. 반면 3학년 대상 연구는 대부분 일관되었다고 요약된다[K3].
  - 엔진 규칙('같은 방법 두 번 + 반대 증거가 더 많지 않음')은 이 두 결과 사이에서 맞는 방향이다. [4]는 '한 번 보이면 그 버그'로 정의했는데, 우리 규칙이 그보다 엄격하다.
- **문항 조건 세 가지**
  - (가) 그 버그의 답이 정답과 달라야 한다. 엔진이 이미 본다.
  - (나) **버그끼리도 답이 달라야 한다.** 일의 자리 차가 5인 두 자리 받아내림 문항(52−27, 71−46)은 SFL과 BND가 같은 답을 낸다. 403−158 → 355는 둘 다, 700−5 → 705는 셋 다 같다. 문항을 만들 때 이런 숫자는 빼야 한다.
  - (다) **계산 실수와 답이 달라야 한다.** BND의 답은 정답에서 10^k만큼만 달라서 `digitSlip`의 '받아내림 하나' 실수와 겹친다. [4]도 BND가 계산 실수처럼 보인다고 했다. 받아내림이 두 번 있는 문항(413−158: BND 365, 차이 110)으로 가려야 한다.
- **오개념 판정 = 버그 판정 + 꼴 바꾸기.** 같은 생각이 꼴이 다른 두 갈래 이상의 문항에서 나와야 개념 문제로 본다. 예: '묶음 수와 낱개를 더함'이 그림 문항과 '10개씩 묶음 □개' 문항 모두에서 나올 때.
  - 실행 가능한 오개념 규칙 101개로 실험한 최근 연구에서, 모형이 틀린 풀이 하나로 꼴이 다른 다음 문항의 답을 맞힌 비율은 40%뿐이었다[32]. 꼴이 바뀌어도 그 규칙이 이어지는지를 따로 확인해야 한다는 뜻이다.
- **특정 오답을 쓰면 진단이 정확해진다.** [4]는 맞음/틀림만 쓸 때보다 특정 오답과 하위 기능을 함께 쓸 때 진단 정확도가 가장 높았다(99%). 우리 앱은 답 숫자를 그대로 쓰므로 이 방식에 가깝다.

## ③ 엔진에 새로 넣을 오개념 모형 후보(우선순위 순)

```js
// 1) sub.stopZero — Stop-Borrow-At-Zero(VanLehn 1981 자료에서 가장 흔한 버그 넷 중 하나[4]) · kind: proc
f(a, b): top = digs(a)
  for i in 0..: if top[i] < b[i] { if (top[i+1] !== 0) top[i+1] -= 1;  /* 0이면 아무것도 안 바꿈 */
                                  out[i] = top[i] + 10 - b[i] } else out[i] = top[i] - b[i]
testable: a의 가운데에 0이 있고 그 오른쪽 자리에서 받아내림 && f ≠ x && f ∉ {sub.big, sub.noDec, sub.zero의 예측}
// 306−187: x=119, f=129 · 305−127: x=178, f=188 · 800−168: x=632, f=642

// 2) eq.leftSum · eq.allSum — 등호를 '답 칸'으로 봄 · kind: concept
//    1-1-3:13 · 2-1-3:10에 문항 꼴 'a + b = □ + c'와 '□ + c = a + b'를 더함(지금 1~2학년에는 이 꼴이 없음)
x = a + b − c;  leftSum: f = a + b;  allSum: f = a + b + c
testable: c ≥ 1 && x ≥ 1        // 8+4=□+5: x=7, leftSum 12, allSum 17

// 3) write.expand — 들은 대로 이어 쓰기 · kind: concept(자릿값)
expandAll(n)   = 0이 아닌 자리마다 d·10^i를 높은 자리부터 이어 붙임   // 642 → 600402 · 406 → 4006
expandFront(n) = String(첫 자리 값) + String(나머지)                  // 3205 → 3000205
expandMan(n)   = String(⌊n/10⁴⌋·10⁴) + String(n mod 10⁴)              // 3만 25 → 3000025
testable: 0이 아닌 자리가 둘 이상 && 답 칸이 긴 수를 받음 && f ≠ noZero(n)

// 4) count.onFrom — 이어 세기 방향(지금의 '하나 차이'를 둘로 나눔) · kind: proc(셈 전략)
덧셈: f = a + b − 1  (첫 수부터 셈)    뺄셈: f = a − b + 1  (첫 수를 넣어 거꾸로 셈)
testable: b ≥ 2 && f ≠ a
judge: 같은 방향이 2번 이상이고 반대 방향이 0번 → 전략 문제, 방향이 섞이면 → 실수(slip)

// (문항 생성 규칙 — 버그가 아님) SFL과 BND를 가릴 받아내림 문항에서는 |일의 자리 차| = 5를 뺀다
```

- 보류: "0을 9로 바꾸지만 왼쪽 자리를 안 줄임"(306−187 → 219)은 2차 요약으로만 보았다. 넣지 말고 실제 오답이 모이는지만 지켜본다.

## ④ 참고문헌(확인한 주소)

1. Brown, J. S., & Burton, R. R. (1978). Diagnostic models for procedural bugs in basic mathematical skills. *Cognitive Science, 2*(2), 155–192. https://doi.org/10.1207/s15516709cog0202_4 — 초록: 학생 1300명 · 문항 2만 개 진단, 진단 문항 자동 생성
2. Brown, J. S., & VanLehn, K. (1980). Repair theory: A generative theory of bugs in procedural skills. *Cognitive Science, 4*(4), 379–426. https://doi.org/10.1207/s15516709cog0404_3
3. VanLehn, K. (1990). *Mind bugs: The origins of procedural misconceptions*. MIT Press. ISBN 9780262220361 — 서지만 확인
4. Lee, J., & Corter, J. E. (2011). Diagnosis of subtraction bugs using Bayesian networks. *Applied Psychological Measurement, 35*(1), 27–47. https://doi.org/10.1177/0146621610377079 — 원문 PDF: VanLehn(1981) 3~5학년 520명 자료 · 306−187 예 · 버그 불안정 · BND는 실수처럼 보임 · 특정 오답 사용 시 99%
5. Fuson, K. C., Wearne, D., Hiebert, J. C., Murray, H. G., Human, P. G., Olivier, A. I., Carpenter, T. P., & Fennema, E. (1997). Children's conceptual structures for multidigit numbers and methods of multidigit addition and subtraction. *JRME, 28*(2), 130–162. https://doi.org/10.5951/jresematheduc.28.2.0130
6. Fuson, K. C., & Briars, D. J. (1990). Using a base-ten blocks learning/teaching approach for first- and second-grade place-value and multidigit addition and subtraction. *JRME, 21*(3), 180–206. https://doi.org/10.5951/jresematheduc.21.3.0180
7. Hiebert, J., & Wearne, D. (1996). Instruction, understanding, and skill in multidigit addition and subtraction. *Cognition and Instruction, 14*(3), 251–283. https://doi.org/10.1207/s1532690xci1403_1
8. Kamii, C. (1986). Place value: An explanation of its difficulty and educational implications for the primary grades. *Journal of Research in Childhood Education, 1*(2), 75–86. https://doi.org/10.1080/02568548609594909
9. Ross, S. H. (1989). Parts, wholes, and place value: A developmental view. *Arithmetic Teacher, 36*(6), 47–51. https://doi.org/10.5951/at.36.6.0047
10. Byrge, L., Smith, L. B., & Mix, K. S. (2014). Beginnings of place value: How preschoolers write three-digit numbers. *Child Development, 85*(2), 437–443. https://doi.org/10.1111/cdev.12162 — 4~6세 172명, '600402'식 확장 쓰기
11. Seron, X., & Fayol, M. (1994). Number transcoding in children: A functional analysis. *BJDP, 12*(3), 281–300. https://doi.org/10.1111/j.2044-835x.1994.tb00635.x
12. Power, R. J. D., & Dal Martello, M. F. (1990). The dictation of Italian numerals. *Language and Cognitive Processes, 5*(3), 237–254. https://doi.org/10.1080/01690969008402106 — 구문 오류가 가장 많음(요약)
13. Moeller, K., Pixner, S., Zuber, J., Kaufmann, L., & Nuerk, H.-C. (2011). Early place-value understanding as a precursor for later arithmetic performance. *Research in Developmental Disabilities, 32*(5), 1837–1851. https://doi.org/10.1016/j.ridd.2011.03.012 (PubMed 21498043)
14. Miura, I. T., Okamoto, Y., Kim, C. C., Steere, M., & Fayol, M. (1993). First graders' cognitive representation of number and understanding of place value: Cross-national comparisons. *J. Educational Psychology, 85*(1), 24–30. https://doi.org/10.1037/0022-0663.85.1.24 — 한국 포함 다섯 나라 비교(배경 자료)
15. Mix, K. S., Prather, R. W., Smith, L. B., & Stockton, J. D. (2014). Young children's interpretation of multidigit number names. *Child Development, 85*(3), 1306–1319. https://doi.org/10.1111/cdev.12197
16. Wellman, H. M., & Miller, K. F. (1986). Thinking about nothing: Development of concepts of zero. *BJDP, 4*(1), 31–42. https://doi.org/10.1111/j.2044-835x.1986.tb00995.x
17. Colomé, À., & Noël, M.-P. (2012). One first? Acquisition of the cardinal and ordinal uses of numbers in preschoolers. *JECP, 113*(2), 233–247. https://doi.org/10.1016/j.jecp.2012.03.005 — 요약만 확인(기수가 서수보다 먼저)
18. Fuson, K. C. (1988). *Children's counting and concepts of number*. Springer. https://doi.org/10.1007/978-1-4612-3754-9 · Wynn, K. (1990). Children's understanding of counting. *Cognition, 36*(2), 155–193. https://doi.org/10.1016/0010-0277(90)90003-3
19. Secada, W. G., Fuson, K. C., & Hall, J. W. (1983). The transition from counting-all to counting-on in addition. *JRME, 14*(1), 47–57. https://doi.org/10.5951/jresematheduc.14.1.0047
20. Fischer, F. E. (1990). A part-part-whole curriculum for teaching number in the kindergarten. *JRME, 21*(3), 207–215. https://doi.org/10.5951/jresematheduc.21.3.0207
21. Carpenter, T. P., & Moser, J. M. (1984). The acquisition of addition and subtraction concepts in grades one through three. *JRME, 15*(3), 179–202. https://doi.org/10.5951/jresematheduc.15.3.0179
22. Hudson, T. (1983). Correspondences and numerical differences between disjoint sets. *Child Development, 54*(1), 84–90. https://doi.org/10.2307/1129864
23. Donaldson, M., & Balfour, G. (1968). Less is more: A study of language comprehension in children. *British J. Psychology, 59*(4), 461–471. https://doi.org/10.1111/j.2044-8295.1968.tb01163.x
24. Lindvall, C. M., & Ibarra, C. G. (1980). Incorrect procedures used by primary grade pupils in solving open addition and subtraction sentences. *JRME, 11*(1), 50–62. https://doi.org/10.5951/jresematheduc.11.1.0050 — 초록: 오류는 식을 틀리고 일관성 없이 읽는 데서 옴(구체 오답 숫자는 미확인)
25. Falkner, K., Levi, L., & Carpenter, T. (1999). Children's understanding of equality: A foundation for algebra. *Teaching Children Mathematics, 6*(4), 232–236. https://doi.org/10.5951/tcm.6.4.0232 — 8+4=□+5를 752명에게 냄, 1 · 6학년 모두 정답 10% 미만([31]에 인용된 내용)
26. McNeil, N. M., & Alibali, M. W. (2005). Why won't you change your mind? *Child Development, 76*(4), 883–899. https://doi.org/10.1111/j.1467-8624.2005.00884.x — '주어진 수를 모두 계산' · '등호 = 합계'
27. McNeil, N. M., Fyfe, E. R., Petersen, L. A., Dunwiddie, A. E., & Brletic-Shipley, H. (2011). Benefits of practicing 4 = 2 + 2. *Child Development, 82*(5), 1620–1633. https://doi.org/10.1111/j.1467-8624.2011.01622.x
28. Linchevski, L., & Livneh, D. (1999). Structure sense. *ESM, 40*(2), 173–196. https://doi.org/10.1023/A:1003606308064 — 19−3+6 → 10 예는 Banerjee & Subramaniam(2005, PME29 2권 121–128쪽)의 인용에서 확인: https://www.maths.tcd.ie/EMIS/proceedings/PME29/PME29RRPapers/PME29Vol2BanerjeeSubramaniam.pdf
29. Bryant, P., Christie, C., & Rendu, A. (1999). Children's understanding of the relation between addition and subtraction: Inversion, identity, and decomposition. *JECP, 74*(3), 194–212. https://doi.org/10.1006/jecp.1999.2517 — 요약만 확인
30. Watson, S. M. R., Lopes, J., Oliveira, C., & Judge, S. (2018). Error patterns in Portuguese students' addition and subtraction calculation tasks. *Journal for Multicultural Education, 12*(1), 67–82. https://doi.org/10.1108/JME-01-2017-0002 — 697명. 받아올림 · 받아내림을 안 함이 두 번째로 흔함(덧셈 17.5% · 뺄셈 16.3%)
31. Theis, L. (2023). Learning the = sign: A significant cognitive obstacle. *For the Learning of Mathematics, 43*(2), 35쪽~. https://flm-journal.org/Articles/5BA0F26DB3DA617AAAA77B8857B5.pdf — 1학년 6주 수업, 등호를 직접 다뤄야 바뀜
32. Chen, X., Liu, N., & Sonkar, S. (2026). MalruleLib: Large-scale executable misconception reasoning with step traces. arXiv:2601.03217. https://arxiv.org/abs/2601.03217
33. Ashlock, R. B. (2010). *Error patterns in computation* (10th ed.). Pearson. ISBN 9780135009109 · Ryan, J., & Williams, J. (2007). *Children's mathematics 4–15: Learning from errors and misconceptions*. Open University Press. ISBN 9780335220427 — 둘 다 서지만 확인(표의 근거로 쓰지 않음)

**한국 연구**
- K1. 김정원 · 방정숙 · 최지영(2016). Rasch 모델을 통한 초등학교 학생들의 등호 이해 분석. *수학교육, 55*(1), 1–19. https://doi.org/10.7468/mathedu.2016.55.1.1 — 2~6학년 695명. 2학년 평균이 가장 낮음(12.8/35). □에 나머지 수를 모두 더해 쓰는 오류 소개
- K2. 김수미(2012). 학년 상승에 따른 초등학생들의 자연수 사칙계산 오답유형 및 오답률 추이와 그에 따른 교수학적 시사점. *한국초등수학교육학회지, 16*(1), 125–143. https://www.earticle.net/Article/A181600
- K3. 최진숙 · 유현주(2006). 덧셈 · 뺄셈의 오류유형 분석 및 지도방안에 대한 연구: 초등학교 3학년을 중심으로. *교과교육학연구, 10*(2), 303–327. — 검색 요약으로만 확인(원문 못 읽음): 받아올림 · 자릿값 혼동 · 0 처리 · 받아내림 오류 유형, 십진 블록으로 지도
- K4. 장수연 · 안병곤(2010). 수와 연산영역의 오류유형에 따른 효과적인 지도 방안. *한국초등수학교육학회지, 14*(2), 355–376. https://www.earticle.net/Article/A132010 — 1학년: 50 이상 세기와 뺄셈에서 오류가 많음
- K5. 이병옥 · 안병곤(2008). 수학 문장제의 문장 구조와 해석상의 오류 분석: 초등학교 2학년을 중심으로. *한국초등수학교육학회지, 12*(2), 185–204. https://www.earticle.net/Article/A99696 — 해석 오류 51.56% > 계산 오류 39.20%
