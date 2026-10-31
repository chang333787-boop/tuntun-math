# E3 분수·소수 오개념 — 근거 정리 (3~6학년 · 튼튼 수 다리)

읽은 것: `engine/lessons/catalog.js` 차시 · `engine/errors.js` BUG_LIST(분수 fr.* 12 · 소수 dec.* 2 — 모두 `+`·`−`만, `×`·`÷` 분수·소수 버그는 0) · g3~g6 차시 bugs 이름 · `engine/concepts/frac.js`·`dec.js`.
근거 강도: **상** = 여러 실증·수치 확인 · **중** = 한 연구나 초록 수준 · **하** = 직접 실증을 확인하지 못함(엔진 이름만 유지). [번호]는 ④ 참고문헌.

## ① 개념별 표

| 개념(차시) | 오개념 — 아이 생각 | 드러나는 답 | 왜 생기나 | 가려내는 문항 조건 | 고치는 법 | 엔진에 있음? | 근거 |
|---|---|---|---|---|---|---|---|
| 똑같이 나누기·부분-전체 (3-1-6:2~3) | 조각 수만 맞으면 분수 · 칠한 것 : 안 칠한 것 | 크기 다른 4조각 중 1 → 1/4 · 4칸 중 3칸 → 3/1 | 표상(세기) | 조각 수는 같고 크기가 다른 그림 · 칠한 수 ≠ 안 칠한 수 | 똑같이 나눠 주기 경험부터[16] · 조각 겹쳐 대 보기 | 차시 bugs('똑같이 나눈 것과 아닌 것…'·'색칠한 칸 수/안 칠한 칸 수') | 하~중 [16][K5] |
| 분수 읽기·쓰기 (3-1-6:4) | 분수 = 위아래 두 자연수 · 읽은 순서대로 씀 | '4분의 3' → 4/3 | 말·언어(분모부터 읽음) + 자연수 | 말→쓰기 · 그림 고르기에 '자연수 그림' 보기 섞기 | "전체 4 중 3"을 말로 · 분모 = 나눈 수 표시 | 차시 bugs('읽은 순서대로 위에 씀') | 중 [19][20] — 한국 1·2학년도 자연수 그림 보기가 있으면 우연 수준[20] |
| 수직선 위의 수 (3-1-6:5 · 3-2-4:5~7) | 그려진 선 전체가 1 · 눈금(점)을 셈 · 다시 묶기 못 함 | 0~2를 8칸 낸 선의 3칸 → 3/8(정답 3/4) | 표상(단위 구간) | 끝이 1이 아닌 선(0~2) · 필요보다 촘촘한 눈금(6칸 선에 1/3) | "1은 어디?"부터 · 0~1 구간 칠하기 · 수직선 중심 지도[16][17] | 눈금 수·0부터 세기 있음 · **전체 선=1·다시 묶기 없음** | 상 [9][K3: 정답 44%·8%] |
| 단위분수 크기 (3-1-6:7) | 분모가 크면 크다 | 1/3과 1/5 → 1/5 | 자연수 편향 | 분모 순서와 크기 순서가 반대인 2~3개 | 같은 막대를 3·5조각 나란히 · 수직선 | 있음('분모가 클수록 크다고 봄') | 상 [1][8] |
| 진분수·가분수·대분수 (3-2-4:5~7) | 분수는 1보다 작다 · 대분수의 자연수와 가분수의 분자를 바로 견줌 | 7/4 → 진분수 · 2 1/5과 9/5 → 9/5 | 지도 순서(부분-전체만) + 자연수 | 1 너머 수직선 위치 · 자연수 큰 쪽 ≠ 분자 큰 쪽 | 분수를 '수직선 위의 수'로[15] · 같은 꼴로 바꿔 비교 | 차시 bugs('가분수를 진분수로 봄'·'같은 꼴로 바꾸지 않고') | 하~중 [15][16] |
| 크기가 같은 분수·약분 (5-1-4:2~4) | 같은 수를 더해도 같다 | □/12 = 2/3 → 11/12 · 2/3 = 4/5 | 자연수(덧셈) 넘겨 씀 | 분모 차이를 더하기로 맞출 수 있는 빈칸 | 같은 막대를 더 잘게(조각 ×k) · 수직선 같은 점 | 있음('분모·분자에 같은 수를 더함') | 중 [8] |
| 분모 다른 분수 비교 (5-1-4:6) | ① 간격(분모−분자)이 작으면 크다 ② 분자·분모가 큰 수면 크다 | ① 3/5과 5/8 → 3/5 · 3/4과 5/6 → '같다'(예측) ② 5/11과 2/3 → 5/11 | 자연수 편향(두 수 따로) | ① 간격 작은 쪽이 실제로 작은 쌍 · 간격 같은 쌍 ② 큰 분수의 두 수가 작은 쌍 | 1/2·1 기준 어림 → 통분 · 둘 다 수직선에[7] | **없음**(모두 '통분하지 않고 비교함') | 상 [7][12] |
| 분수 ↔ 소수 (5-1-4:7) | 분모를 소수 숫자로 옮김(역수 대응) · 이어 씀 | 1/4 → 0.4(예측) · 3/4 → 0.34 · 0.3 > 0.4("1/3 > 1/4") | 표상(기호만 이음) | 분모 2·4·5 분수 → 소수 · 0.3과 0.4 비교 | 분모를 10·100으로 바꾸는 단계 · 같은 수직선 점 | '분자와 분모를 이어 씀' 있음 · **역수 대응 없음** | 중 [5][6] |
| 분수 덧셈·뺄셈 (4-2-1 · 5-1-5) | 분자끼리·분모끼리 | 1/3 + 1/4 → 2/7 · 2/5 + 1/5 → 3/10 | 자연수 넘겨 씀 · 뜻 없이 절차 | 분모 다른 덧셈 + "1/2보다 큰가" 어림 | 분모 = 단위 이름("1/5이 2개와 1개") · 막대 · 어림 확인 | 있음(fr.addDen·subDen·keepDen·borrow10 …) | 상 [10: 시도의 덧셈 26%·뺄셈 20%][1][K2] |
| 분수 곱셈 (5-2-2) | ① 다른 연산 절차를 가져옴 ② 곱하면 커진다 | ① 3/5 × 4/5 → 12/5 · 2/5 × 3 → 6/15 ② "12 × 3/4 > 12" | ① 앞 규칙 넘겨 씀 ② 직관 모형(반복 덧셈) | ① 분모 같은 두 분수 곱 ② 계산 없이 크다/작다 | 넓이 모형("1/3의 1/4") · 방향 어림 먼저 | ① 차시 bugs('분자만 곱함'·'분모에도 곱함') · BUG_LIST 없음 ② **없음** | 상 [10][12: 곱셈 오류의 46%][11][14] |
| 분수 나눗셈 (6-1-1 · 6-2-1) | ① 큰 수를 작은 수로 나눠야 ② 뒤집을 분수 착오 ③ 나누면 작아진다 | ① 3 ÷ 4 → 4/3 ② 앞 분수 뒤집음·안 뒤집고 곱함 ③ 3 ÷ 1/2 → 3/2 | 직관 모형(등분제: 나누어지는 수가 커야[14]) · 뜻 없이 절차 | ① 나누는 수가 더 큰 식 ③ 나누는 수 < 1 | 포함제("3 안에 1/2이 몇 번") · 수직선 뛰어 세기 | ①②③ 차시·개념 bugs 있음 · BUG_LIST 없음 | 상 [10][12: 나눗셈 오류의 55%][11][K1] |
| 소수 자릿값 (3-1-6:8~9 · 4-2-3:2~5) | 소수점 뒤 = 또 하나의 자연수 · 0.1과 0.01 혼동 | 0.35는 0.1이 35개 · 3 mm → 0.03 cm | 자연수 규칙 | '0.1이 몇 개'·'0.01이 몇 개'를 같은 수로 번갈아 | 길이 측정 + 자릿값 전개(0.35 = 0.3 + 0.05)[K4] | 있음('0.1과 0.01을 헷갈림' 등) | 중 [2][K4][21] |
| 소수 비교 — 길면 크다 (3-1-6:10 · 4-2-3:6) | 자릿수 많은 쪽이 크다 | 0.25와 0.3 → 0.25 · 0.4와 0.35 → 0.35 | 자연수 넘겨 씀 | 짧은 쪽이 큰 쌍. 5.736과 5.62는 오개념이어도 맞혀 못 가림[6] | 수직선 위치 · 빈 자리 0을 뜻으로(0.30 = 0.01이 30개) · 오답 예 견주기[18] | 있음('자릿수가 많으면 크다고 봄') | 상 [2][5: 4학년 74%][6] |
| 소수 비교 — 짧으면 크다 (4-2-3:6 · 5-1-4:7) | 짧을수록 조각이 커서 크다(분모 생각) · 0.3 = 1/3(역수 생각) | 0.4와 0.45 → 0.4 · 0.4와 0.83 → 0.4 · 0.3과 0.4 → 0.3 | 분수 지식 넘겨 씀 · 지도 순서(4학년 9% → 6학년 19%) | 앞자리 같고 긴 쪽이 큰 쌍 · 한 자리끼리 | 0.45 = 0.4 + 0.05를 띠로 · 수직선 | **없음**('높은 자리부터 비교하지 않음'에 섞임) | 상 [2][5][6] |
| 소수 — 끝 숫자 무시 (4-2-3:4~6) | 둘째 자리까지만 본다(돈 생각) | 8.41과 8.41253 → '같다' | 표상(두 자리 습관) | 앞 두 자리가 같은 세 자리 쌍 + '같아요' 보기 | 셋째 자리 띠·수직선 확대 | **없음** | 중 [4: 약 4% · 한때 10% 넘음] |
| 소수 덧셈·뺄셈 (4-2-3:8~11) | 오른쪽 끝을 맞춘다 | 0.32 + 0.7 → 0.39 · 0.86 − 0.3 → 0.83 | 자연수 넘겨 씀(기호 규칙) | 소수 자릿수가 다른 두 수 | 자릿값 표 · 빈 자리 0 · 어림 | 있음(dec.alignRight·alignRightS) | 상 [13: 7학년 0.86−0.3 정답 48% vs 0.60−0.36 84%] |
| 소수 곱셈 (5-2-4) | ① 소수점을 덧셈처럼 맞춤 ② 곱하면 커진다 | ① 1.2 × 3.4 → 40.8 · 0.3 × 0.6 → 1.8 ② "12 × 0.8 > 12" | ① 앞 규칙 넘겨 씀 ② 직관 모형 | ① 두 수 모두 소수 ② 0.x를 곱하는 방향 판단 | 어림(0.3 × 0.6 < 1) · 넓이 모형 | ① 있음('소수점 아래 자리 수를 더하지 않음') ② ×0.1·0.01에만 | 상 [13: 6학년 곱셈 답의 76%][12] |
| 소수 나눗셈 (6-1-3 · 6-2-2) | ① 몫 소수점 ② 나누면 작아진다 | ① 7.44 ÷ 3 → 24.8 ② 6 ÷ 0.5 → 3 | 직관 모형 · 뜻 없이 절차 | 나누는 수 < 1 · 몫 어림 | 포함제("6 안에 0.5가 몇 번") · 어림으로 소수점 | ① 있음 ② **없음**(분수에만 '곱해 버림') | 중 [12][14][K6] |

## ② 오개념 · 버그 · 실수를 가르는 법

1. **표기·연산을 건너 같은 방향이면 오개념, 한 절차 안에서만 되풀이되면 버그, 되풀이 안 되면 실수.** 자연수 계산 오류도 1~2회는 반복되지만 3회 이상은 드물다[K7] → 한 문제 판정은 가설일 뿐(엔진 `judge`의 s ≥ 2 · s ≥ a 규칙이 맞는 방향).
2. **짝 문항이 필수.** 오개념이면 맞히는 문항과 틀리는 문항을 섞어야 한다. 길면 크다는 5.736 vs 5.62를 맞히고 0.4 vs 0.35를 틀린다[6]. 그 규칙으로 '틀렸어야 할' 문항을 맞혀야 반대 증거가 된다.
3. **맞은 답도 틀린 생각에서 나온다.** 간격 생각·짧으면 크다는 일부 쌍에서 정답을 낸다[7][2] → 이유를 묻거나 수직선에 놓게 한다[7].
4. **절차가 맞아도 개념이 빠질 수 있다.** 분수 곱셈·나눗셈 절차를 정확히 하는 중학생·예비교사도 1보다 작은 분수의 곱·몫 방향은 우연보다 덜 맞혔다[11] → 계산 문항만으로는 '곱하면 커진다'를 못 본다. 방향 판단 문항이 따로 있어야 한다.
5. **학년마다 다른 오개념을 기대한다.** 길면 크다는 4학년 74% → 6학년 33%, 짧으면 크다는 9% → 19%로 오히려 는다[5]. 다음 검사에서 같은 분류로 남을 확률은 0.44(L)·0.38(S)[5] → 6개월 뒤 다시 잰다.
6. **엔진 구조 주의:** 고르기 문항은 `readExpr`가 null → `testable` = [] → 차시 bugs(`lesson:` 이름)는 맞힌 문항에서 반대 증거(a)를 못 모은다. 찍어서 두 번 같은 보기를 고른 아이도 '확실'이 될 수 있다.

## ③ 새로 넣을 오개념 모형 후보

고르기·비교 문항용 **'고르기 규칙'** 묶음을 BUG_LIST 옆에 둔다: `pick(xs, ask)` → 그 생각이면 고를 보기 번호(정답과 같으면 이 문항으로 못 가림). 고르기 문항도 `testable`·`judge`의 반대 증거에 들어가게 한다.

**1순위**
```js
// dec.SL 짧으면 크다(분모 생각) — 자연수 부분이 같으면 소수 자릿수가 적은 쪽이 크다
{ id:'dec.SL', kind:'concept', pick:(xs,ask)=> argBest(xs, ask, x => [x.int, -x.places, x.digitsAsInt]) }
// dec.SLr 역수 생각 — 소수 한 자리끼리는 숫자가 작을수록 크다(0.3 > 0.4)
{ id:'dec.SLr', kind:'concept', pick:(xs,ask)=> sameInt(xs) && xs.every(x=>x.places===1) ? argBest(xs, ask, x=>-x.d1) : null }
// fr.gap 간격 생각 — (분모−분자)가 작을수록 크다 · 같으면 '같아요' 보기
{ id:'fr.gap', kind:'concept', pick:(fs,ask)=> tieOr(argBest(fs, ask, f=>-(f.d-f.n)), '같아요') }
// fr.big 큰 수 편향 — 분자(같으면 분모)가 큰 쪽이 크다
{ id:'fr.big', kind:'concept', pick:(fs,ask)=> argBest(fs, ask, f=>[f.n, f.d]) }
// dir.mul / dir.div 방향 판단 새 문항("계산하지 말고: 12 × 0.8 ○ 12") — 아이가 '>'면 곱하면 커진다
{ id:'dir.mulBig', kind:'concept', when: X=> X.op==='×' && val(X.B)<1, predict: '>' }
{ id:'dir.divSmall', kind:'concept', when: X=> X.op==='÷' && val(X.B)<1, predict: '<' }
```
**2순위** (차시 bugs를 BUG_LIST로 올려 숫자가 바뀌어도 예측·반대 증거가 되게)
```js
{ id:'fr.mulKeepDen', op:'×', st:['F'], f:X=> X.A.d===X.B.d ? fr(0, X.A.n*X.B.n, X.A.d) : null }   // 12/5
{ id:'fr.mulDenToo',  op:'×', st:['F'], f:X=> isWhole(X.B) ? fr(0, X.A.n*X.B.i, X.A.d*X.B.i) : null }   // 6/15 (값이 같아 '꼴'로만 가림)
{ id:'fr.divFlipA',   op:'÷', st:['F'], f:X=> fr(0, X.A.d*X.B.n, X.A.n*X.B.d) }   // 앞 분수를 뒤집음
{ id:'fr.divNoFlip',  op:'÷', st:['F'], f:X=> fr(0, X.A.n*X.B.n, X.A.d*X.B.d) }
{ id:'dec.mulPointMax', op:'×', st:['D'], f:X=> X.A.k==='D'&&X.B.k==='D' ? {v:F(X.A.i*X.B.i, 10**max(X.A.p,X.B.p))} : null }   // 40.8
{ id:'dec.divAsMul', op:'÷', st:['D'], f:X=> val(X.B)<1 ? {v: mul(X.A.v, X.B.v)} : null }   // 6 ÷ 0.5 → 3
{ id:'nl.wholeLine', 수직선 max>1: predict n/(d*max) }   // 전체 선을 1로
{ id:'fd.recip', 분수→소수: n===1 && d<10 → predict 0.d }   // 1/4 → 0.4
```
**3순위**: `dec.trunc`(소수 둘째 자리까지만 비교 → '같아요') — 4-2-3:4~6에 '같아요' 보기를 가진 세 자리 쌍 문항이 먼저 있어야 한다.

문항 쪽 할 일: 4-2-3:6에 '앞자리 같고 긴 쪽이 큰 쌍'(0.4 vs 0.45) 고정 비율 · 5-1-4:6에 간격 함정 쌍(3/5 vs 5/8)과 큰 수 함정 쌍(5/11 vs 2/3) · 5-2-2·5-2-4·6-2-2에 방향 판단 문항 한 갈래 · 3-2-4 수직선에 0~2 선.

## ④ 참고문헌 (모두 주소 확인 · JRME = J. for Research in Mathematics Education)

1. Ni & Zhou (2005). The origins and implications of whole number bias. *Educational Psychologist* 40(1) 27–52. https://doi.org/10.1207/s15326985ep4001_3
2. Resnick, Nesher, Leonard 외 (1989). Conceptual bases of arithmetic errors: The case of decimal fractions. *JRME* 20(1) 8–27. https://doi.org/10.5951/jresematheduc.20.1.0008
3. Stacey & Steinle (1998). Refining the classification of students' interpretations of decimal notation. *Hiroshima J. Math. Ed.* 6, 49–70. https://extranet.education.unimelb.edu.au/SME/TNMY/Decimals/Decimals/backinfo/abstracts/sta1998a.htm
4. Steinle & Stacey (2002). Further evidence of conceptual difficulties with decimal notation. MERGA 25. https://merga.net.au/wp-content/uploads/DOCS/common/Uploaded%20files/Annual%20Conference%20Proceedings/2002%20Annual%20Conference%20Proceedings/RP_Steinle_Stacey_2002.pdf
5. Stacey & Steinle, Learning Decimals 누리집(멜버른대): 오개념 갈래 https://extranet.education.unimelb.edu.au/SME/TNMY/Decimals/Decimals/tests/miscon.htm · 학년별 비율 https://extranet.education.unimelb.edu.au/SME/TNMY/Decimals/Decimals/tests/incidenc.htm
6. Nicholson, Boneh, Wilkin, Stacey 외 (2001). A case study in knowledge discovery and elicitation in an intelligent tutoring application. UAI 2001. https://arxiv.org/abs/1301.2297
7. Pearn & Stephens (2004). Why you have to probe to discover what Year 8 students really think about fractions. MERGA 27. https://merga.net.au/wp-content/uploads/DOCS/common/Uploaded%20files/Annual%20Conference%20Proceedings/2004%20Annual%20Conference%20Proceedings/RP512004%20Pearn%20Stephens.pdf
8. Behr, Wachsmuth, Post, Lesh (1984). Order and equivalence of rational numbers. *JRME* 15(5) 323–341. https://doi.org/10.5951/jresematheduc.15.5.0323
9. Bright, Behr, Post, Wachsmuth (1988). Identifying fractions on number lines. *JRME* 19(3) 215–232. https://doi.org/10.5951/jresematheduc.19.3.0215
10. Siegler & Pyke (2013). Developmental and individual differences in understanding of fractions. *Developmental Psychology* 49(10) 1994–2004. https://doi.org/10.1037/a0031200
11. Siegler & Lortie-Forgues (2015). Conceptual knowledge of fraction arithmetic. *J. Educational Psychology* 107(3) 909–918. https://doi.org/10.1037/edu0000025
12. Siegler & Lortie-Forgues (2017). Hard lessons: Why rational number arithmetic is so difficult for so many people. *Current Directions in Psychological Science* 26(4) 346–351. https://doi.org/10.1177/0963721417700129
13. Hiebert & Wearne (1985). A model of students' decimal computation procedures. *Cognition and Instruction* 2(3–4) 175–205. https://doi.org/10.1207/s1532690xci0203&4_1 (수치는 [12]에서 재인용)
14. Fischbein, Deri, Nello, Marino (1985). The role of implicit models in solving verbal problems in multiplication and division. *JRME* 16(1) 3–17. https://doi.org/10.5951/jresematheduc.16.1.0003 (등분제 제약은 Maffia 외 재현 연구로 확인: https://ccpp.leeds.ac.uk/wp-content/uploads/sites/21/2021/05/012-MaffiaEtAl_NumSense_REV.pdf)
15. Siegler, Thompson, Schneider (2011). An integrated theory of whole number and fractions development. *Cognitive Psychology* 62(4) 273–296. https://doi.org/10.1016/j.cogpsych.2011.03.001
16. Siegler 외 (2010). Developing effective fractions instruction for K–8 (NCEE 2010-4039). 요약 https://ies.ed.gov/ncee/rel/fractions-grade-6/pdf/PracticeGuideOverview.pdf
17. Fuchs, Schumacher 외 (2013). Improving at-risk learners' understanding of fractions. *J. Educational Psychology* 105(3) 683–700. https://doi.org/10.1037/a0032446
18. Durkin & Rittle-Johnson (2012). Using incorrect examples to support learning about decimal magnitude. *Learning and Instruction* 22(3) 206–214. https://doi.org/10.1016/j.learninstruc.2011.11.001 (후속 342명 연구는 추가 이득 뚜렷하지 않음 https://ir.vanderbilt.edu/handle/1803/15069)
19. Miura, Okamoto, Vlahovic-Stetic, Kim, Han (1999). Language supports for children's understanding of numerical fractions. *J. Exp. Child Psychology* 74(4) 356–365. https://doi.org/10.1006/jecp.1999.2519
20. Paik & Mix (2003). U.S. and Korean children's comprehension of fraction names. *Child Development* 74(1) 144–154. https://doi.org/10.1111/1467-8624.t01-1-00526
21. Moss & Case (1999). Developing children's understanding of the rational numbers. *JRME* 30(2) 122–147. https://doi.org/10.2307/749607

**한국 연구**
- K1. 김경미·강완 (2008). 초등학생들이 분수의 나눗셈에서 보이는 반복적 오류 분석. 초등수학교육 11(1) 1–19. https://koreascience.kr/article/JAKO200801440607043.pub?lang=ko
- K2. 박미연·박영희 (2017). 초등학교 6학년 학생이 분수 계산문제에서 보이는 오류의 학업성취수준별 분석. 한국초등수학교육학회지 21(1) 23–47. https://www.earticle.net/Article/A307840
- K3. 김정원 (2022). 초등학교 4학년 학생들의 수직선 이해 분석. 초등수학교육 25(3) 213–232. https://doi.org/10.7468/jksmec.2022.25.3.213
- K4. 김은정·강흥규 (2014). 측정활동에 기반한 소수의 학습·지도 방안 및 학생의 이해 실태 분석. 한국초등수학교육학회지 18(1) 37–62. https://www.earticle.net/Article/A233094
- K5. 홍은숙·강완 (2008). 분수 개념에 관한 초등학생의 비형식적 지식. 한국초등수학교육학회지 12(1) 59–78. https://www.earticle.net/Article/A74269
- K6. 송근영·방정숙 (2008). 소수연산에 관한 예비초등교사의 교수내용지식 분석. 한국초등수학교육학회지 12(1) 1–25. https://www.earticle.net/Article/A74266
- K7. 김수미 (2012). 학년 상승에 따른 초등학생들의 자연수 사칙계산 오답유형 및 오답률 추이. 한국초등수학교육학회지 16(1) 125–143. https://www.earticle.net/Article/A181600

확인하지 못해 쓰지 않은 것: Tirosh(2000) 분수 나눗셈 오류 갈래 원문 · Clarke & Roche(2009) 본문 · 가분수 '1보다 작다'와 부분-부분 혼동을 직접 잰 실증 · 0.3 × 10 = 0.30 실증.
