# E4 관계 · 식 · 비 영역 오개념 — 이론 · 진단 · 교정 근거 (2026-10-31)

범위: 튼튼 수 다리 `engine/errors.js` BUG_LIST 30개(자연수 · 분수 · 소수 두 수 계산만, 관계 영역은 0개)와 관계 차시 bugs(g2 · g4 · g5 · g6, concepts/num · ratio · dec)를 읽고 견줌. 출처는 이번에 웹에서 서지를 확인한 것만 넣었다. [n]은 ④ 번호, '재인용'은 원문을 열지 못해 2차 자료로 확인한 것.

## ① 일반 이론 · 진단 · 교정 원칙

**1. 세 가지 구분**
- **실수(slip)**: 체계가 없고 짚어 주면 곧 고친다. 개념 처방 대상이 아니다 [1].
- **오류 · 절차 버그**: 같은 조건에서 되풀이되는 틀린 답(증상). 맞는 절차를 조금 바꾼 '버그'를 그 숫자로 돌려 보면 답이 예측된다 [2]. 우리 errors.js가 이 방식이다.
- **오개념**: 체계적 오류를 낳는 밑바탕 믿음(원인) [1]. 한 오개념이 여러 버그로 나오고, 버그는 아이 안에서 옮겨 다닌다(bug migration) [3]. 한국 3~6학년 580명의 계산 오답도 1~2번 되풀이가 대부분이고 3번 넘게 되풀이하는 일은 드물었다 [20]. → 진단은 늘 잠정 가설로 둔다. (근거: 구분 틀 상 · 불안정성 중)

**2. 오개념이 생기는 갈래**
| 갈래 | 뜻 | 관계 영역 예 | 출처 |
|---|---|---|---|
| 앞 규칙의 과잉 일반화 | 옳던 규칙을 맞지 않는 곳까지 씀 | 차 비교 → 비, 비례 → 1차 규칙 | [1][34] |
| 직관 규칙 'A가 많으면 B도 많다' | 세기 양(농도 · 밀도)에서 특히 | 소금이 많은 쪽이 더 진하다 | [5] |
| 암묵 모형 | 곱하면 커지고 나누면 작아진다 | 비율 < 1, 소수가 든 비례식 | [6][1] |
| 전형 꼴 반복 · 뜻 없는 절차 | 3 + 4 = □만 보며 굳은 틀이 새 학습을 막음(변화 저항) | 등호, 내항 · 외항 곱셈만 | [7][8][35] |
| 표상 | 기호나 표를 한 방향으로만 읽음 | 대응표를 세로로만 | [31] |
| 언어 | % 낱말의 뜻이 흐려짐, 덧셈 말로 곱셈 뜻, 'of'의 여러 뜻 | 기준량, 할인율 | [36] |
| 교수 순서 | 초등 경험이 등호 오해를 만든다는 견해 | 등호 | [22] |

**3. 두 관점**: 오개념을 갈등으로 바꿔 끼울 '지울 대상'으로 보는 관점과, 좁은 맥락에서는 쓸모 있던 앎이라 적용 범위를 다듬어 이어 쓸 '재료'로 보는 관점이 있다. Smith · diSessa · Roschelle은 맞서 없애기보다 다듬어 잇기를 권한다 [4]. Olivier도 오류를 뽑아낼 나쁜 것으로 다루지 말고, 옛 규칙과 새 규칙이 각각 언제 맞는지 가르라고 한다 [1]. 우리 앱에 적용하면 "차로 비교도 맞는 생각이에요. 이 문제는 몇 배인지를 물어요"처럼 범위를 갈라 준다.

**4. 교정 방법의 근거**
| 방법 | 근거와 효과 | 한계 | 강도 |
|---|---|---|---|
| 인지 갈등 · 개념 변화 전략 | 과학 메타분석 218편, 전통 수업 대비 g = 1.10(베이즈 보정 0.93) [10] | 과학 영역이다. 교실 결과는 엇갈리고 동기 변수가 크다 [9] | 중 |
| 틀린 풀이 분석(오답 예) | 대수: 틀린 예(단독 · 함께)가 개념 이해를 높이고 절차 차이는 없음(한 개념 측정 63% 대 맞는 예만 51%) [11] · 소수 4~5학년: 맞는 풀이와 틀린 풀이 비교로 오개념이 줄었다(재인용) [14][17] | 메타분석 g = .136으로 약함. 오류를 설명하게 할 때만 효과가 커짐 [13] · 풀이 예 메타분석(g = .48)에서는 맞는 예 단독이 더 컸다 [12] · 4~5학년 342명 후속 연구에서는 차이가 없었다 [14] | 중 |
| 비교하기 | 7학년 70명: 두 풀이를 나란히 비교 → 절차 · 유연성이 늘고 개념은 비슷 [15] · 비교의 효과는 메타분석으로 확인됨 [18] | 아는 방법이 하나도 없으면 벅차다. 속도를 늦춰야 [16][17] | 상 |
| 표상 바꾸기 | 4학년 % 먼저 가르치기(길이 모델) → 개념 이해가 늘고 자연수 전략 의존이 줄었다 [37] · 4학년 시각 모델 → 최대공약수 · 최소공배수 개념 이해 [39] | 한 교육과정 실험 · 한 학급 | 중 · 하 |
| 등호 직접 지도 | 수학이 어려운 3학년 80명: 문장제 지도에 등호 지도를 더한 집단이 등호 과제 · 열린 식에서 앞섰다 [24] | 특정 집단 | 중 |

**5. 실천 원칙**: 학생은 오류를 자기를 위협하는 것으로 느끼기 쉽고, 교실의 오류 분위기가 오류에 대한 반응을 좌우한다 [19]. 그래서 아이에게 오개념 꼬리표를 붙이지 않는다.

## ② 영역별 오개념 (괄호 안 = 정답)

| 개념(차시) | 오개념 — 아이 생각 | 드러나는 답 | 왜 생기나 | 가려내는 문항 조건 | 고치는 법 | 엔진 | 강도 · 출처 |
|---|---|---|---|---|---|---|---|
| 등호(4-1-6:8 · R0) | =는 '답을 쓰라'는 표시 | 8 + 4 = □ + 5 → 12(답 자리) · 17(모두 더함) (7) | 3 + 4 = □ 꼴만 반복. 6~8학년도 관계적 정의는 31~43% | □가 오른쪽 가운데 · 양쪽에 연산 · 7 · 12 · 17이 서로 다른 수 | '양쪽이 같다'를 말로, 저울, 비전형 꼴(□ = 3 + 4, 7 = 7) 섞기 | 있음(12 · 17 · 이어서 계산) / 없음: '7 = 3 + 4'를 틀렸다고 함 | 상 [21][22][7][8][24][25] |
| □가 있는 식(2-1-3:10 · 11) | 보이는 수끼리 계산 | 8 + □ = 15 → 23 (7) · □ − 6 = 9 → 3 (15) | 기호만 보고 연산, 등호의 조작적 이해(모든 수를 더함) | □ 자리를 앞 · 뒤로 바꿔 냄 | 덧셈식 ↔ 뺄셈식 바꾸기(2-1-3:9), 부분–전체 띠 | 있음(보이는 수를 더함 · 가장 큰 수가 합임을 모름) | 중 [22][23] |
| 혼합 계산(5-1-1:2~6) | 앞에서부터만 · 괄호 무시 · 이름 순서(덧셈 다음 뺄셈) | 3 + 4 × 5 → 35 (23) · 20 − (5 + 3) → 18 (12) · 10 − 3 + 2 → 5 (9) | 왼쪽→오른쪽 읽기 습관, 규약을 뜻 없이 외움 | 높은 연산이 오른쪽에 있어야 가려짐(4 × 5 + 3은 앞에서부터 해도 23) | 문장제로 식 세우기, 괄호 있는 식 · 없는 식 나란히. 군더더기 괄호가 돕는다는 근거는 약함 | 있음(5가지) | 중 [26][27][29][28] · 이름 순서는 하 |
| 수 배열 n째(4-1-6:2 · 3) | 순서 = 뛴 횟수 | 4, 7, 10, … 10째 → 34 (31) | 순서 n과 뛴 횟수 n − 1을 헷갈림 | 시작 수 ≠ 차, 먼 항 | 수직선 화살표 세기, 위치 번호 카드 | 있음 | 중 [30][31] |
| 대응 — 다음 칸만(5-1-3:2 · 3) | 표를 세로로만(재귀) | △ 1 · 2 · 3 → ○ 3 · 6 · 9에서 △ = 10이면 → 12 (30) | 재귀 규칙이 먼저 발달하고 대응은 늦음 | 순서를 섞은 표, 먼 칸(10째 · 100째) | 가로 화살표로 짝 짓기, 함수 상자 · T표 | 있음(표의 다음 칸만 구함) | 중 [31][32] |
| 대응 — 곱을 차로(5-1-3:2) | 첫 칸의 차이가 규칙 | △ 2 · 3 · 4, ○ 6 · 9 · 12 → ○ = △ + 4 → △ = 10이면 14 (30) | 덧셈적 생각이 먼저 | 첫 칸의 차가 배가 되는 수와 달라야 | 반례: 아이 규칙으로 둘째 칸을 계산 → 3 + 4 = 7 ≠ 9 | 있음 | 중 [33][1] |
| 1차 규칙(4-1-6:3 · 5-1-3:4) | 통째 배(비례가 아닌데 비례) · 상수를 빠뜨림 | 성냥 삼각형 3, 5, 7, …(2n + 1) 10째 → 22(5째 11 × 2) · 20(차 × 순서) (21) | 비례의 과잉 일반화 | b ≠ 0인 규칙에서 n째와 2n째를 함께 | 그림을 '처음 하나' + '늘어나는 몫'으로 색 나누기 | 없음 | 중 [30][34] |
| 비 · 비례(6-1-4:2 · 6-2-4:2 · 6) | 차로 지킴(덧셈적) | 2 : 3 = 6 : □ → 7 (9) · 4에 6이 맞으면 6에는 → 8 (9) | 차 비교가 먼저 발달, 정수 배일 때는 숨음 | 배가 정수가 아닌 쌍(4 : 6 = 6 : □), 차로 해도 자연수 답 | 비 표 · 이중 수직선, '같은 수를 더하면 1 : 2가 2 : 3' 반례 | 있음(덧셈으로 지키기 · 몇 배를 차이로) | 상 [33][34][35] |
| 비례가 아닌 상황(6-2-4:6) | 무엇이든 비례 | 빨래 1벌이 2시간에 마르면 3벌은 → 6시간 (2시간) | 비례식 절차만 연습. 교과서에 비례 · 비비례를 가리는 과제가 없음 | 비례가 아닌 문항 섞기 | '두 배가 되면 두 배가 되나?' 먼저 묻기 | 없음 | 중 [34][35] |
| 기준량(6-1-4:3 · 4 · 5 · 7) | 앞 수가 기준 · 부분을 기준으로 봄 | 5에 대한 3의 비 → 5 : 3 · 비율 5/3 · 소금 20 g + 물 180 g → 11% (10%) | '~에 대한' · '의'의 말 구조, 'A가 많으면 B도 많다' | 말 순서와 기호 순서가 다른 문항, 전체가 합으로 숨은 문항 | 기준량을 말로 먼저 정하기, 전체 띠 | 있음 | 중 [36][5] |
| 백분율(6-1-4:6 · 7) | %는 그냥 붙이는 표시 | 3/4 → 3% · 7.5% · 0.75 (75%) · 20000원 → 15000원의 할인율 → 75% · 5000 (25%) | 100을 기준량으로 보지 못함, 'of'의 여러 뜻 | 분모 ≠ 100, 낸 값과 할인 값이 둘 다 나오는 문항 | 100칸 띠 · 길이 모델, % 먼저 | 있음 | 중 [36][37] |
| 비례식 · 비례배분(6-2-4:4~7) | 외항 · 내항 자리를 헷갈림 · 뒤 항을 전체로 봄 | 35를 2 : 5로 → 14 · 17.5(반으로) (10) | 부분–부분 비를 부분–전체로 읽음 | 전체가 두 항의 합과 다른 수 | 비 막대 7칸 중 2칸 | 있음 | 하(직접 확인한 연구 없음) [35] |
| 수의 범위 · 어림(5-2-1) | 끝 수를 넣고 빼기 · 차례로 반올림 · 0이어도 올림 | 15 초과 20 이하 자연수 개수 → 6 · 4 (5) · 1449를 백의 자리까지 반올림 → 1500 (1400) · 3000을 천의 자리까지 올림 → 4000 (3000) | 낱말 뜻(이상 · 초과), 끝자리부터 처리하는 습관 | 끝 수 포함 · 불포함을 섞기, 바로 아래 자리 < 5인데 그 아래 ≥ 5 | 수직선의 ● · ○, '바로 아래 한 자리만 본다' | 있음(5가지) | 하(교사 자료만) [40] |
| 약수 · 배수(5-1-2) | 약수와 배수를 뒤바꿈 · 1과 자기 자신을 빠뜨림 · 최소공배수 = 두 수의 곱 | 12의 약수 → 24, 36 · 약수 개수 → 4 (6) · 4와 6의 최소공배수 → 24 (12) | 낱말 뜻 혼동, 곱셈 약함, 절차만 익힘 | 서로소가 아닌 쌍(4와 6은 가려짐, 3과 5는 곱 = 최소공배수라 못 가림) | 직사각형 배열(약수) · 수직선 뛰어 세기(배수) | 있음(1 · 자기 자신 · 두 수 곱 · 최대 ↔ 최소) / 없음: 약수 ↔ 배수 뒤바꿈 | 중 [38][39] |

## ③ 우리 앱 설계 원칙

1. 아이 화면에는 오개념 이름을 띄우지 않는다. '다음에 해 볼 것'과 힌트만 보인다 — [19][1]
2. 교사 화면에는 오답 이름마다 '왜 생기나(갈래) · 어떻게 고치나 · 근거 강도'를 한 줄씩 붙인다. 지금은 차시 `tip` 하나와 `to`(앞 차시 잇기)뿐이다. ②의 열을 bugs에 붙이면 된다 — [1][4]
3. 진단은 잠정이다. judge의 '같은 방법 두 번 + 반대 증거가 더 많지 않음'은 그대로 두고, '확실'도 2주 뒤 다시 확인한다 — [3][20]
4. **코드 확인 결과**: `testable()`은 BUG_LIST(두 수 계산식)만 돌린다. 그래서 관계 차시 오답(`lesson:…`)은 반대 증거 `a`가 늘 0이고, 두 번 맞아떨어지면 곧바로 '확실'이 된다. 차시 bugs에도 '이 숫자로 가려지나'를 표시해야 한다 — [2]
5. 진단 문항은 가려내는 숫자로 낸다. 오답 방법을 써도 정답과 같아지는 숫자(4 × 5 + 3, 서로소 쌍, 정수 배인 비)는 진단용에서 뺀다. ②의 '가려내는 문항 조건'을 생성기 조건(`until`)에 넣는다 — [2]
6. 고칠 때 1순위는 맞는 풀이와 아이가 낸 틀린 풀이를 나란히 놓고 '왜 틀렸을까'를 고르거나 말하게 하는 것이다. 틀린 예만 단독으로 쓰지 않고, 설명 활동을 꼭 붙인다 — [11][13][14][12]
7. 비교는 아는 방법이 하나라도 있을 때 쓴다. 사전지식이 낮으면 맞는 예부터 천천히 — [16][17]
8. 반례는 아이 규칙으로 직접 계산하게 한다("네 규칙이면 둘째 칸은 7"). 갈등으로 끝내지 말고 맞는 규칙과 '언제 쓰나'로 잇는다 — [9][1][4]
9. 표상을 바꾸는 고리를 둔다: 등호 = 저울, 비 = 이중 수직선 · 비 표, % = 100칸 띠, 약수 = 직사각형 배열, 대응 = 가로 화살표 — [37][39][31]
10. 비전형 꼴을 일부러 섞는다(□ = 3 + 4, 7 = 7, 순서를 섞은 표, 비례가 아닌 상황). 전형 꼴만 되풀이하면 굳는다 — [7][8][35]
11. 실수(slip)에는 개념 처방을 하지 않고 '다시 보기'만 권한다 — [1]

## ④ 참고문헌 (확인한 주소)

1. Olivier, A. (1989). Handling pupils' misconceptions. 13th National Convention on Mathematics, Physical Science and Biology Education 기조 강연, Pretoria. https://academic.sun.ac.za/mathed/MALATI/Misconceptions.htm
2. Brown, J. S., & Burton, R. R. (1978). Diagnostic models for procedural bugs in basic mathematical skills. *Cognitive Science*, 2, 155–192. doi:10.1207/s15516709cog0202_4
3. Brown, J. S., & VanLehn, K. (1980). Repair theory: A generative theory of bugs in procedural skills. *Cognitive Science*, 4, 379–426. bug migration 설명은 재인용: https://instructionaldesign.org/?p=195
4. Smith, J. P., diSessa, A. A., & Roschelle, J. (1993). Misconceptions reconceived. *Journal of the Learning Sciences*, 3(2), 115–163. doi:10.1207/s15327809jls0302_1
5. Stavy, R., & Tirosh, D. (1996). Intuitive rules in science and mathematics: The case of "more of A – more of B". *International Journal of Science Education*, 18, 653–667. 같은 저자의 책: *How students (mis-)understand science and mathematics: Intuitive rules* (2000, Teachers College Press)
6. Fischbein, E., Deri, M., Nello, M. S., & Marino, M. S. (1985). The role of implicit models in solving verbal problems in multiplication and division. *JRME*, 16(1), 3–17.
7. McNeil, N. M., & Alibali, M. W. (2005). Why won't you change your mind? Knowledge of operational patterns hinders learning and performance on equations. *Child Development*, 76, 883–899.
8. McNeil, N. M. (2008). Limitations to teaching children 2 + 2 = 4. *Child Development*, 79(5), 1524–1537.
9. Limón, M. (2001). On the cognitive conflict as an instructional strategy for conceptual change: A critical appraisal. *Learning and Instruction*, 11(4), 357–380. doi:10.1016/S0959-4752(00)00037-2
10. Paçacı 외 (2023 온라인; 2024 권 61(6)). Effectiveness of conceptual change strategies in science education: A meta-analysis. *Journal of Research in Science Teaching*. https://avesis.metu.edu.tr/yayin/7ceb2c4a-0149-4e54-b445-fe7e1e937d5f
11. Booth, J. L., Lange, K. E., Koedinger, K. R., & Newton, K. J. (2013). Using example problems to improve student learning in algebra: Differentiating between correct and incorrect examples. *Learning and Instruction*, 25, 24–34. https://files.eric.ed.gov/fulltext/ED543090.pdf
12. Barbieri, C. A., Miller-Cotto, D., Clerjuste, S. N., & Chawla, K. (2023). A meta-analysis of the worked examples effect on mathematics performance. *Educational Psychology Review*, 35, 11. doi:10.1007/s10648-023-09745-1
13. Alemdag, E., Eichelmann, A., & Narciss, S. (2025). A framework for learning from erroneous examples and meta-analysis of empirical research. *Review of Educational Research*. doi:10.3102/00346543251390901
14. Durkin, K., & Rittle-Johnson, B. (2012). The effectiveness of using incorrect examples to support learning about decimal magnitude. *Learning and Instruction*, 22(3), 206–214. 후속 박사논문(Durkin, 4~5학년 342명 · 조건 간 차이 없음): https://ir.vanderbilt.edu/handle/1803/15069
15. Rittle-Johnson, B., & Star, J. R. (2007). Does comparing solution methods facilitate conceptual and procedural knowledge? *Journal of Educational Psychology*, 99(3), 561–574.
16. Rittle-Johnson, B., Star, J. R., & Durkin, K. (2009). The importance of prior knowledge when comparing examples. *Journal of Educational Psychology*, 101(4), 836–852 (IES 기록).
17. Rittle-Johnson, B., Star, J. R., & Durkin, K. (2017). The power of comparison in mathematics instruction. In Geary 외 (편), *Mathematical Cognition and Learning* Vol. 3 (pp. 273–296). Elsevier. https://cdn.vanderbilt.edu/t2-my/my-prd/wp-content/uploads/sites/3147/2020/01/RittleJohnson_Star_Durkin_2017_ComparisonChapter.pdf
18. Alfieri, L., Nokes-Malach, T. J., & Schunn, C. D. (2013). Learning through case comparisons: A meta-analytic review. *Educational Psychologist*, 48(2), 87–113. doi:10.1080/00461520.2013.775712 (효과 크기 수치는 원문을 열지 못해 적지 않음)
19. Steuer, G., Rosentritt-Brunn, G., & Dresel, M. (2013). Dealing with errors in mathematics classrooms: Structure and relevance of perceived error climate. *Contemporary Educational Psychology*, 38(3), 196–210. doi:10.1016/j.cedpsych.2013.03.002
20. 김수미 (2012). 학년 상승에 따른 초등학생들의 자연수 사칙계산 오답유형 및 오답률 추이와 그에 따른 교수학적 시사점. 한국초등수학교육학회지, 16(1), 125–143. https://www.earticle.net/Article/A181600
21. Falkner, K. P., Levi, L., & Carpenter, T. P. (1999). Children's understanding of equality: A foundation for algebra. *Teaching Children Mathematics*, 6(4), 232–236. doi:10.5951/TCM.6.4.0232 (Knuth 2006 참고문헌에는 6, 56–60으로 적혀 있음)
22. Knuth, E. J., Stephens, A. C., McNeil, N. M., & Alibali, M. W. (2006). Does understanding the equal sign matter? Evidence from solving equations. *JRME*, 37(4), 297–312. doi:10.2307/30034852 (표 1: 관계적 정의 6학년 32% · 7학년 43% · 8학년 31%)
23. Alibali, M. W. (1999). How children change their minds: Strategy change can be gradual or abrupt. *Developmental Psychology*, 35, 127–145. (Knuth 2006에서 재인용: 모든 수를 더하는 답)
24. Powell, S. R., & Fuchs, L. S. (2010). Contribution of equal-sign instruction beyond word-problem tutoring for third-grade students with mathematics difficulty. *Journal of Educational Psychology*. https://pmc.ncbi.nlm.nih.gov/articles/PMC2904558
25. 이유진 (2023). 등호의 관계적 이해를 강조한 수업에서 나타나는 학생의 노티싱 분석. 수학교육, 62(3), 341–362. doi:10.7468/mathedu.2023.62.3.341
26. 백선수 · 김원경 · 문승호 (2008). 초등학교 5학년 학생의 자연수 혼합계산에서 나타난 오류에 관한 연구. East Asian Mathematical Journal, 24(5), 547–564. https://koreascience.kr/article/JAKO200805441023236.page
27. 이대현 (2017). 자연수의 혼합계산에 대한 초등학생들과 예비교사들의 오류 분석. 한국학교수학회논문집, 20(2), 141–161. https://www.earticle.net/Article/A305450
28. Gunnarsson, R., Sönnerhed, W. W., & Hernell, B. (2016). Does it help to use mathematically superfluous brackets when teaching the rules for the order of operations? *Educational Studies in Mathematics*, 92(1), 91–105. doi:10.1007/s10649-015-9667-2
29. Ngo, V., Perez Lacera, L., Closser, A. H., & Ottmar, E. (2023). The effects of operator position and superfluous brackets on student performance in simple arithmetic. *Journal of Numerical Cognition*, 9(1), 107–128. doi:10.5964/jnc.9535
30. Stacey, K. (1989). Finding and using patterns in linear generalising problems. *Educational Studies in Mathematics*, 20(2), 147–164. doi:10.1007/BF00579460
31. Rycroft-Smith, L., & Blanton, M. (2024). What does research suggest about the early development of functional thinking? *Cambridge Mathematics Espresso* 48. https://cambridgemaths.org/Images/espresso_48_early_development_of_functional_thinking.pdf
32. Stephens, A. C. 외 (2017). A learning progression for elementary students' functional thinking. *Mathematical Thinking and Learning*, 19(3), 143–166. doi:10.1080/10986065.2017.1328636
33. Hart, K. M. (1981). *Children's understanding of mathematics: 11–16*. John Murray · Hart (1984). *Ratio: Children's strategies and errors*. NFER-Nelson. 키 문항(Mr Short · Mr Tall)의 덧셈 오류는 재인용: Chick (2010), MERGA33. https://merga.net.au/wp-content/uploads/DOCS/common/Uploaded%20files/Annual%20Conference%20Proceedings/2010%20Annual%20Conference%20Proceedings/MERGA33_Chick.pdf
34. Van Dooren, W., De Bock, D., Hessels, A., Janssens, D., & Verschaffel, L. (2005). Not everything is proportional: Effects of age and problem type on propensities for overgeneralization. *Cognition and Instruction*, 23(1), 57–86.
35. 정은실 (2013). 초등학교 수학 교과에서의 비례 추론에 대한 연구. 수학교육학연구, 23(4), 505–516. https://koreascience.kr/article/JAKO201336448943078.page
36. Parker, M., & Leinhardt, G. (1995). Percent: A privileged proportion. *Review of Educational Research*. ERIC 기록: https://eric.ed.gov/?q=%22Percent%3A+A+Privileged+Proportion%22
37. Moss, J., & Case, R. (1999). Developing children's understanding of the rational numbers: A new model and an experimental curriculum. *JRME*, 30(2), 122–147.
38. Sutarto 외 (2021). Fourth-grade primary school students' misconception on greatest common factor and least common multiple. *Education Research International*, 6581653. doi:10.1155/2021/6581653 · https://repo.uinsatu.ac.id/33391/
39. 방정숙 · 이유진 (2018). 최대공약수와 최소공배수를 구하는 과정에서 의미를 강조한 지도방안 탐색. 한국초등수학교육학회지, 22(3), 283–308. https://www.earticle.net/Article/A347834
40. Barton, C. Probing Questions: Rounding (교사 자료, 연구 아님 — 차례로 반올림하는 오류). https://mrbartonmaths.com/rounding-to-decimal-places/

확인하지 못해 넣지 않은 것: Falkner 1999의 학년별 비율, Alfieri 2013의 d 값, Lamon 2007 · Misailidou & Williams 2003의 본문 내용, 이상 · 이하 · 초과 · 미만과 비례배분 오개념을 직접 다룬 연구.
