# SaveCharge 퍼블리싱

PRD 기준 화면 퍼블리싱 결과물입니다. HTML, CSS, JS(바닐라)로 만들었고 빌드 과정은 없습니다.

## 실행

서비스 워커와 위치 권한 때문에 `file://` 가 아니라 로컬 서버로 여는 것을 권장합니다.

```bash
npx http-server -p 5173 -c-1
```

VS Code Live Server 등 아무 정적 서버나 써도 됩니다. 처음 접속하면 온보딩 화면으로 이동합니다.

## T map 지도

`js/config.js` 의 `TMAP_APP_KEY` 에 appKey 를 넣으면 T map JS SDK v2 지도가 표시됩니다.
비워 두면 같은 기능(마커, 반경, 드래그, 확대/축소, 지도에서 위치 선택)을 하는 목업 지도로 대신합니다.

## 화면

| 파일 | 화면 | PRD |
| --- | --- | --- |
| `onboarding.html` | 유종 → 차종/연비 → 위치 권한 | 7장 |
| `index.html` | 홈: 기준 위치, 주유량/충전량, 지도, 추천 리스트, 검색 조건·장소 검색·차량 선택·계산 방법 시트 | F-01~F-03, F-05~F-08, F-14 |
| `station.html?id=` | 업장 상세: 비용 구성, 유종별 가격/충전기 현황, 30일 추이, 가격 알림·제보, 길안내 | F-11, F-12, F-15 |
| `favorites.html` | 장소(집·회사·내 장소) / 업장 / 가격 알림 | F-02, F-11 |
| `report.html` | 월별 절약액, 6개월 그래프, 기록 | F-10 |
| `vehicle.html` | 차량 목록·추가·편집·삭제 | F-04 |
| `settings.html` | 로그인(자리), 시간 가치, 반경, 카드 할인, 내비 앱, 테마, 푸시, PWA, 초기화 | F-13, F-16, F-17 |

## 구조

```
css/common.css   컬러 토큰(라이트/다크), 공통 컴포넌트
css/home.css     홈 (모바일 1단, 960px 이상 2단)
css/pages.css    서브 페이지
js/config.js     T map 키, 추정치 파라미터(우회계수 1.3, 25km/h 등)
js/store.js      localStorage 상태 (비로그인 저장)
js/data.js       더미 업장 데이터 생성기, 차종 스펙, 장소 검색 목록
js/cost.js       실질 비용 계산·정렬·필터 (PRD 6장 계산식)
js/ui.js         아이콘, 포맷, 토스트, 바텀시트, 탭바, 내비 딥링크, 위치
js/map.js        지도 어댑터 (T map / 목업)
js/<page>.js     페이지별 스크립트
sw.js            서비스 워커, manifest.webmanifest
```

## 개발 연동 시 바꿀 부분

- **업장·가격 데이터**: `SC.data.near()`, `SC.data.get()`, `SC.data.history()` 를 서버 API 호출로 교체 (오피넷, 환경공단 충전소).
- **실시간 경로**: `SC.cost.rank()` 결과 상위 3곳에 대해 서버에서 T map 자동차 경로안내(`totalValue=2`)를 호출하고, `travel` 의 `D`·`T`·`F` 를 교체한 뒤 다시 정렬. 일 900건 초과 시 추정치 유지 (PRD 6.4).
- **장소 검색**: `SC.data.PLACES` 를 T map POI 검색으로 교체.
- **로그인·동기화, 가격 제보, 푸시 발송**: 현재는 토스트만 표시합니다. 서버 연동이 필요합니다.
- 차종 연비와 충전 단가는 화면 확인용 예시값입니다.
