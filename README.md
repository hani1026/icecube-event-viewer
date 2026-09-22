# IceCube Event Viewer

**[브라우저에서 바로 실행하기](https://hani1026.github.io/icecube-event-viewer/)**

IceCube / DeepCore / Upgrade의 검출기 좌표를 사용한 교육용 브라우저 이벤트 뷰어입니다. `index.html`을 브라우저에서 열면 실행됩니다. 별도 빌드나 서버는 필요하지 않으며, Three.js v0.152.2를 CDN에서 가져오므로 인터넷 연결은 필요합니다.

## 이번 수정

- 원본의 `GEO` 좌표 데이터는 그대로 유지했습니다. 총 5,854개 모듈: IceCube 4,680, DeepCore 480, Upgrade 694개입니다.
- 전자 ×20, 타우 ×2000 경로 확대를 제거했습니다. 궤적, 광원 위치, 도달시간에 실제 길이를 사용합니다.
- cascade를 임의의 큰 구체로 그리던 효과를 작은 위치 표시점으로 변경했습니다. 점과 라벨은 식별용 기호이며 실제 물체의 크기를 뜻하지 않습니다. hit 표시 크기는 기존처럼 charge를 나타냅니다.
- 유한 뮤온 트랙의 Cherenkov 방출점이 실제 트랙 구간 안에 있는지 검사합니다. 구간 밖에서는 끝점 광원 근사를 사용하며, 15 m보다 짧은 트랙의 끝점 광량은 실제 길이에 비례합니다.
- 타우 CC 문턱 아래에서는 타우와 신호를 만들지 않습니다. 중성미자가 통과하며, 이유를 화면에 표시합니다. noise가 켜져 있으면 noise만 남습니다. NC는 별개로 동작합니다.
- 타우 CC 문턱 근처의 outgoing energy와 angle에 질량 조건을 적용했습니다. 타우의 평균 비행 거리와 속도에는 momentum과 energy를 사용합니다.
- 이벤트·라벨 재생성 시 전용 geometry, material, texture를 해제합니다. Three.js Sprite가 공유하는 geometry는 유지합니다.

전체 검출기 화면에서 전자·타우의 짧은 경로가 거의 보이지 않는 것은 실제 길이를 사용한 결과입니다. Earth / Detector 전환과 스크롤 확대는 카메라 조작으로 계속 사용할 수 있습니다.

## 조작

기본 화면에는 입자·CC/NC·에너지·방향·검출기와 `New event`, 짧은 결과만 표시합니다. Vertex, dust layer, noise, seed는 항상 펼쳐진 `Options`에서 볼 수 있습니다. 시간 색상 범례는 재생 막대에만 표시합니다. 긴 이벤트 해설과 검출기별 모듈 수는 화면에서 제거했습니다. 타우 문턱·흡수 등 필요한 상태 안내는 짧게 유지합니다.

입자(atmospheric μ, νe, νμ, ντ, noise), CC/NC, 에너지(1 GeV–1 TeV), zenith(0°–180°), 검출기 구성, vertex 영역, noise를 선택할 수 있습니다. 같은 seed와 설정은 같은 이벤트를 생성합니다. `New event`는 새 seed를 선택합니다. 재생 막대로 시간을 조절하며, hit 색은 이른 시간의 빨강에서 늦은 시간의 파랑으로 변합니다.

## Geometry

원본 README에 명시된 출처는 `GeoCalibDetectorStatus_ICUpgrade.v58.mixed.V1.i3.bz2`의 `I3ModuleGeoMap` 및 `Subdetectors`입니다. 이 수정 작업에서는 GCD를 다시 추출하거나 재검증하지 않았습니다. 내장 `GEO` JSON은 원본과 바이트 단위로 비교해 동일함을 확인했습니다.

| 구성 | String | 모듈 |
|---|---|---|
| IceCube | 1–78 | DOM 4,680 |
| DeepCore | 79–86 | DOM 480 |
| Upgrade | 87–93 | mDOM 402, D-Egg 278, pDOM 14 |

좌표 단위는 m이며 z=0은 지표 아래 1,948 m입니다. Earth 반경은 6,371 km입니다.

### IceCube 주변 얼음 / bedrock 단면

`Detector` 보기는 가로·세로 2.2 km의 국소 단면을 보여줍니다. 투명한 얼음층의 윗면은 z=1,948 m, bedrock 경계는 z=−852 m로, 얼음 두께는 2,800 m입니다. 모든 길이에 동일한 m 단위를 사용하며 수직 확대는 없습니다. 기존 5,854개 센서가 이 얼음층 안에 들어가는 것을 확인했습니다.

남극점의 약 2.8 km 얼음 두께를 사용하는 **평평하고 균일한 근사**이며, 실측 bedrock 지형 지도를 사용한 것은 아닙니다. 참고: [IceCube ice transparency paper](https://user-web.icecube.wisc.edu/~dima/work/IceCube-ftp/SPICE/paper/nim.pdf).

Bedrock은 갈색으로 표시하며 경계 아래 300 m만 단면으로 보여줍니다. 이 300 m는 화면에 표시하는 절단 깊이이며 실제 암반의 전체 두께를 뜻하지 않습니다. Surface / Ice · 2.8 km / Bedrock 라벨과 깊이 괄호는 가까운 전체 단면 보기에서 표시됩니다. 아주 가까이 확대하면 라벨이 사라집니다.

지구 전체 보기와 국소 단면은 줌 거리에 따라 전환됩니다. 기존 극지방 cap의 3.186 km 부양 오프셋은 제거하고 Earth 반경에 맞췄습니다. 주변 단면을 볼 때는 지구와 cap을 숨겨 층이 중복되어 보이지 않도록 했습니다. 카메라는 지표에서 암반 단면까지 들어오도록 중심과 거리를 조정했습니다.

얼음 / bedrock 단면은 지질 구조의 시각화입니다. 아래 dust layer에는 광량 감쇠를 적용하지만, 암반 내 수송이나 얼음 경계에서의 굴절은 계산하지 않습니다.

생성 위치에도 알려진 불일치가 있습니다. `ATMO=15000`은 현재 지표와의 교차점에서 궤적 방향으로 15 km 더한 거리이며 일정한 수직 고도가 아닙니다. 기본 seed=1의 νμ 설정에서 zenith 0°/60°/90°의 실제 방사형 고도는 각각 약 15.00/7.52/0.34 km입니다. 얼음 / bedrock 추가 작업에서도 입자 생성 위치 계산은 바꾸지 않았습니다.


## 계산 모델과 한계

이 프로그램은 정량 연구용 MC가 아닙니다. 단면적·flux·trigger·reconstruction 없이 선택한 상호작용을 예시로 생성합니다. 타우 CC의 운동학적 금지 조건만 별도로 적용합니다. 아래 근사는 가시적인 패턴을 설명하기 위한 것으로, GENIE/PROPOSAL/CLSim을 대체하지 않습니다.

- Vertex: 원본과 동일한 outer-array 또는 infill 영역에서 추출합니다.
- Inelasticity: Gaussian을 [0.05, 0.95]로 제한합니다. 평균은 30 GeV 미만 0.5, 이상 0.4, 표준편차 0.17입니다. 타우 CC는 아래 운동학적 영역으로 추가 제한합니다.
- Electron shower length: `0.39 × [ln(max(Ee, 0.1)/0.08) + 4] m`. EM 광원을 경로 끝에 놓는 점광원 근사입니다.
- Muon range: `ln(1 + bE/a)/b`, `a=0.24 GeV/m`, `b=3.3e−4 /m`. 고에너지 트랙의 확률적 에너지 손실은 원본의 시각화용 근사이며, 에너지를 단계별로 보존하는 수송 모델이 아닙니다.
- Tau CC threshold: 정지 핵자와 같은 최소 recoil 질량을 가정해 `mτ + mτ²/(2mN) ≈ 3.46 GeV`, `mτ=1.77686 GeV`, `mN=0.939 GeV`를 사용합니다. 아래 공식 설명의 약 3.5 GeV와 대응합니다.
- Tau CC kinematics: 최소 recoil 질량이 `mN`인 두 입자 운동학의 에너지 경계와 recoil mass 조건으로 기존 energy/angle 추출값을 제한합니다. 이는 허용 범위 검사이며 실제 미분 단면적 분포나 핵 효과 모델은 아닙니다.
- Tau flight: 평균 길이 `4.9e−5 × pτ m`, 속도 `c × pτ/Eτ`. 지수분포 수명을 추출하지 않고 평균 비행을 보여줍니다. 분기비 17% μ, 18% e, 65% hadrons와 고정 daughter energy fraction은 원본의 근사입니다. 완전한 붕괴 운동학은 구현하지 않습니다.
- Atmospheric muon: 설정 에너지는 검출기 기준 에너지입니다. 대기에서 검출기로 오는 경로와 이후 range는 설명용이며 대기·얼음 내 에너지 손실을 일관되게 수송하지 않습니다. 원본의 up-going muon 흡수 예시는 유지합니다.

타우 문턱의 참고 자료: [IceCube — Atmospheric tau neutrino appearance](https://icecube.wisc.edu/news/research/2019/01/atmospheric-tau-neutrino-appearance-in-icecube/).

### Dust layer

[The Design and Performance of IceCube DeepCore, Section 2.1](https://arxiv.org/abs/1109.6096)에서 설명하는 주요 먼지층을 따라 **지표 아래 2,000–2,100 m**를 대표 dust band로 사용합니다. IceCube 좌표로 z=−52…−152 m, 두께 100 m입니다. 실제 층의 기울기·미세 구조·파장 의존성을 생략한 수평 slab 근사입니다. 단면에서는 옅은 갈색 띠와 `Dust` 라벨로 표시합니다.

광원에서 센서까지의 직선 경로 중 이 층을 통과하는 길이 `L_dust`를 계산하고, 기존 기대 광량에 아래 계수를 곱합니다.

```text
additional transmission = exp[−L_dust × (1/25 m − 1/75 m)]
```

기존 유효 감쇠 길이 75 m에 이미 포함된 감쇠를 중복 적용하지 않도록, 추가 optical depth만 곱합니다. 25 m는 효과를 보여주기 위한 **교육용 조정값**이며 실측 absorption length나 SPICE fit 결과가 아닙니다. 먼지층 안을 50 m 통과하면 원래 광량의 약 26%, 수직으로 100 m 전체를 통과하면 약 7%가 남도록 설정했습니다. 먼지층을 지나지 않는 경로에는 추가 감쇠가 없습니다.

Cascade, 뮤온의 직접광 및 끝점 광원, stochastic loss의 광원에 모두 적용합니다. 뮤온의 원래 배경 감쇠식은 수직거리 d를 쓰는 경험식으로 유지하고, dust의 추가 감쇠는 실제 Cherenkov 방출점에서 센서까지의 경로로 계산합니다. 소스와 센서가 모두 층 밖이어도 광경로가 층을 통과하면 약해집니다. 층 안의 센서를 비활성화하지 않으며 dark noise도 줄이지 않습니다.

`Options → Dust layer`에서 표시와 감쇠를 함께 켜고 끌 수 있습니다. 같은 seed로 비교하면 입자·vertex·에너지 손실 위치는 같습니다. Hit는 Poisson 추출이므로 개별 센서의 실현값이 항상 작아진다는 뜻은 아닙니다. 기대 광량이 줄어들며, signal 변화로 난수 소비와 noise 시간창이 달라질 수 있습니다. Noise-only 이벤트는 토글 전후 동일합니다.

산란으로 인한 검출광 손실과 흡수를 하나의 유효 감쇠로 표현했으며, 산란광의 지연·late-photon tail·경로 재분배는 새로 계산하지 않습니다. 시간은 기존 도달시간 모델을 사용합니다.

### Light와 timing

`c=0.29979 m/ns`, group index 1.36, phase index 1.32를 사용합니다. 유효 attenuation length는 75 m, DOM collection area는 0.009 m²입니다. 상대 효율은 DOM 1, mDOM 2.4, D-Egg 1.6, pDOM 1.35이며 DeepCore DOM은 추가로 1.35를 곱합니다. 이 값들은 기존의 조정된 상수입니다. 수정 전 README의 특정 이벤트 hit 수는 수정본의 calibration 결과로 간주하지 않습니다.

Cascade의 평균 p.e.는 `1.2e5 × E × A × exp(−r/75) / [4π(r²+4)]`, 도달시간은 `t0+r/c_ice`입니다.

Track에서 센서의 수선 위치를 s, 수직 거리를 d라고 하면 방출점은 `s_em=s−d/tan(θC)`입니다. **0 ≤ s_em ≤ track length**일 때만 직접 Cherenkov 식을 적용합니다. 이때 도달시간은 `t0+s_em/c+d/[sin(θC)c_ice]`입니다. 해당 구간을 벗어나면 가까운 경계 방출점으로 제한하고, `min(15 m, track length)`에 해당하는 끝점 점광원 근사를 사용합니다. 이 끝점 광원은 실제 산란 모델이 아니며 직접 Cherenkov 광자라고 해석해서는 안 됩니다.

여러 광원은 기대 p.e.로 가중한 평균 시간으로 합칩니다. 3 ns Gaussian jitter와 Poisson charge(평균 50 초과는 Gaussian 근사, 최대 3,000 p.e.)를 적용합니다. Noise는 DOM 550 Hz, D-Egg 800 Hz, mDOM 1,500 Hz이며 최소 12 µs 창에서 추출합니다.

재생은 10초입니다. 긴 접근 구간은 압축하고 검출기 부근 시간은 균일하게 재생합니다. 이는 공간 경로 확대와 별개의 시간 재생 방식입니다.

dust slab 이외의 연속적인 얼음 깊이 의존성, scattering tail, angular acceptance, PMT response, trigger, Earth absorption, oscillation probability는 모델링하지 않습니다. 입자는 검출기에서의 flavor를 선택하는 예시로 해석해야 합니다.

## 검증

```sh
node tests.cjs
```

외부 패키지 없이 Node.js에서 수행합니다. 14개 검증 그룹은 실제 경로 길이·시간, 동일 seed 재현성, 타우 문턱과 recoil mass, 세 붕괴 분기, 유한 트랙 경계, 자원 해제 및 dust 경로 교차·감쇠·noise 보존을 검사합니다. 입자/에너지/방향/noise/검출기 조합 640개에서 유한한 시간·charge와 정렬된 hit를 확인합니다.

이번 환경에서는 브라우저 보안 정책으로 로컬 HTML 열기가 차단되었습니다. 따라서 실제 WebGL 렌더링, 모바일 화면, 브라우저 GPU 메모리 사용량은 확인하지 못했습니다. 자원 해제는 lifecycle 단위 검사로 검증했습니다. 추가로 실제 Three.js 객체를 CPU에서 구성해 얼음·암반 경계, 5,854개 센서의 포함 여부, 줌 전환, 데스크톱/세로 화면 비율의 카메라 범위 및 테마 변경을 검사했습니다. 이 검사는 실제 WebGL 화면 캡처를 대신하지 않습니다.

## 웹 배포

이 저장소는 GitHub Pages의 `main` 브랜치 루트에서 배포합니다. `index.html`이 첫 화면이며, `main`에 push하면 공개 사이트가 자동으로 갱신됩니다. 방문자는 GitHub 계정이나 설치 없이 이용할 수 있습니다.
