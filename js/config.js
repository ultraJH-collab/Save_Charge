/* =========================================================
   SaveCharge 설정
   TMAP_APP_KEY 를 입력하면 실제 T map 지도(JS SDK v2)를 사용합니다.
   비워 두면 목업 지도로 동작합니다. (퍼블리싱 확인용)
   ========================================================= */
window.SC = window.SC || {};

SC.config = {
  TMAP_APP_KEY: '',

  // 위치 권한 거부 시 기본 기준 위치 (서울시청)
  DEFAULT_CENTER: { lat: 37.5665, lng: 126.978, label: '서울시청' },

  // PRD 6.4 추정치 파라미터
  DETOUR_FACTOR: 1.3,   // 직선거리 → 도로거리 우회계수
  AVG_SPEED_KMH: 25,    // 도심 평균속도
  EV_TAPER: 1.15,       // 80% 이후 충전 감속 보정
  STALE_HOURS: 24,      // 가격 갱신 경과 시 "오래된 가격"

  // T map 무료 한도 운영 (실제 연동 시 서버에서 사용)
  TMAP_DAILY_LIMIT: 1000,
  TMAP_SOFT_LIMIT: 900,
  TMAP_TOP_N: 3,

  RESULT_LIMIT: 10
};

/* T map SDK 로더: SDK가 document.write 를 사용하므로 head 파싱 중에 동기 로드해야 합니다. */
SC.loadTmapSdk = function () {
  if (SC.config.TMAP_APP_KEY) {
    document.write('<script src="https://apis.openapi.sk.com/tmap/jsv2?version=1&appKey=' +
      encodeURIComponent(SC.config.TMAP_APP_KEY) + '"><\/script>');
  }
};
