/* =========================================================
   더미 데이터
   - 실제 서비스에서는 오피넷 / 환경공단 충전소 API 결과를 서버 DB에서 조회합니다 (PRD 8장).
   - 여기서는 위경도 격자(타일)마다 결정적으로 업장을 생성해
     어느 위치에서 검색해도 주변 업장이 나오고, ID 로 다시 조회할 수 있게 합니다.
   ========================================================= */
window.SC = window.SC || {};

SC.data = (function () {
  var TILE_LAT = 0.02;   // 약 2.2km
  var TILE_LNG = 0.025;  // 약 2.2km (중위도)

  var FUELS = {
    gasoline: { label: '휘발유', unit: 'L' },
    diesel: { label: '경유', unit: 'L' },
    premium: { label: '고급휘발유', unit: 'L' },
    lpg: { label: 'LPG', unit: 'L' },
    ev: { label: '전기', unit: 'kWh' }
  };

  var BRANDS = [
    { id: 'SK', name: 'SK에너지', color: '#e4002b' },
    { id: 'GS', name: 'GS칼텍스', color: '#00a19a' },
    { id: 'HD', name: 'HD현대오일뱅크', color: '#0055a5' },
    { id: 'SO', name: 'S-OIL', color: '#f2a900' },
    { id: 'EX', name: '알뜰(ex)', color: '#6b8e23', alddeul: true },
    { id: 'NH', name: 'NH알뜰', color: '#2e8b57', alddeul: true }
  ];

  var OPERATORS = [
    { id: 'ME', name: '환경부', fast: 324, slow: 295 },
    { id: 'KP', name: '한국전력', fast: 324, slow: 290 },
    { id: 'CV', name: '차지비', fast: 385, slow: 310 },
    { id: 'EO', name: '에버온', fast: 375, slow: 305 },
    { id: 'SE', name: 'SK일렉링크', fast: 395, slow: 0 },
    { id: 'EP', name: 'E-pit', fast: 405, slow: 0 },
    { id: 'TS', name: '테슬라', fast: 420, slow: 0 }
  ];

  var CONNECTORS = ['DC콤보', '차데모', 'AC3상', 'NACS'];

  var VEHICLE_SPECS = [
    { model: '현대 아반떼 1.6', fuel: 'gasoline', efficiency: 15.0, capacity: 47 },
    { model: '현대 쏘나타 2.0', fuel: 'gasoline', efficiency: 12.6, capacity: 60 },
    { model: '기아 K5 2.0', fuel: 'gasoline', efficiency: 13.0, capacity: 60 },
    { model: '제네시스 G80 2.5T', fuel: 'premium', efficiency: 10.7, capacity: 72 },
    { model: '기아 쏘렌토 2.2 디젤', fuel: 'diesel', efficiency: 14.3, capacity: 67 },
    { model: '현대 포터2 디젤', fuel: 'diesel', efficiency: 9.9, capacity: 65 },
    { model: '기아 K5 LPi', fuel: 'lpg', efficiency: 9.0, capacity: 64 },
    { model: '현대 아이오닉5 롱레인지', fuel: 'ev', efficiency: 5.0, capacity: 84, connector: 'DC콤보', maxKw: 250 },
    { model: '기아 EV6 롱레인지', fuel: 'ev', efficiency: 5.2, capacity: 84, connector: 'DC콤보', maxKw: 240 },
    { model: '기아 레이 EV', fuel: 'ev', efficiency: 5.1, capacity: 35, connector: 'DC콤보', maxKw: 50 },
    { model: '테슬라 모델 Y', fuel: 'ev', efficiency: 5.6, capacity: 75, connector: 'NACS', maxKw: 250 },
    { model: '쉐보레 볼트 EV', fuel: 'ev', efficiency: 5.4, capacity: 66, connector: 'DC콤보', maxKw: 55 }
  ];

  var PLACES = [
    { name: '서울시청', addr: '서울 중구 세종대로 110', lat: 37.5665, lng: 126.978 },
    { name: '강남역', addr: '서울 강남구 강남대로 396', lat: 37.4979, lng: 127.0276 },
    { name: '여의도역', addr: '서울 영등포구 여의나루로 40', lat: 37.5216, lng: 126.9243 },
    { name: '판교역', addr: '경기 성남시 분당구 판교역로 160', lat: 37.3948, lng: 127.1112 },
    { name: '수원역', addr: '경기 수원시 팔달구 덕영대로 924', lat: 37.2659, lng: 127.0001 },
    { name: '일산 킨텍스', addr: '경기 고양시 일산서구 킨텍스로 217-60', lat: 37.6688, lng: 126.7451 },
    { name: '인천시청', addr: '인천 남동구 정각로 29', lat: 37.4563, lng: 126.7052 },
    { name: '청주시청', addr: '충북 청주시 상당구 상당로 155', lat: 36.6424, lng: 127.489 },
    { name: '대전역', addr: '대전 동구 중앙로 215', lat: 36.3324, lng: 127.4346 },
    { name: '동대구역', addr: '대구 동구 동대구로 550', lat: 35.8793, lng: 128.6286 },
    { name: '광주송정역', addr: '광주 광산구 상무대로 201', lat: 35.1378, lng: 126.793 },
    { name: '부산역', addr: '부산 동구 중앙대로 206', lat: 35.1151, lng: 129.0422 }
  ];

  var NAME_PREFIX = ['행복', '중앙', '제일', '한빛', '푸른', '대성', '동부', '서부', '남문', '북문', '센트럴', '새솔', '미래', '하나', '청솔', '드림', '그린', '만세', '삼거리', '로터리'];
  var ROADS = ['중앙로', '시청로', '역전로', '대학로', '공원로', '산업로', '하늘길', '문화로', '평화로', '세종로'];
  var EV_SITES = ['공영주차장', '주민센터', '이마트', '홈플러스', '롯데마트', '복합문화센터', '체육공원', '스타필드', '아파트 상가', '공원 주차장'];

  /* ---------- 결정적 난수 ---------- */
  function hash(a, b, c) {
    var h = 2166136261 ^ c;
    h = Math.imul(h ^ (a & 0xffff), 16777619);
    h = Math.imul(h ^ (a >>> 16), 16777619);
    h = Math.imul(h ^ (b & 0xffff), 16777619);
    h = Math.imul(h ^ (b >>> 16), 16777619);
    // 인접 타일끼리 값이 비슷하게 나오지 않도록 섞기 (murmur3 finalizer)
    h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b);
    h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35);
    h ^= h >>> 16;
    return h >>> 0;
  }
  function rng(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function pick(r, arr) { return arr[Math.floor(r() * arr.length)]; }
  function between(r, a, b) { return a + (b - a) * r(); }
  function round10(n) { return Math.round(n / 10) * 10; }

  /* ---------- 업장 생성 ---------- */
  function makeFuel(tx, ty, n) {
    var r = rng(hash(tx, ty, 100 + n));
    var brand = pick(r, BRANDS);
    var lat = (ty + r()) * TILE_LAT;
    var lng = (tx + r()) * TILE_LNG;
    var base = between(r, 1610, 1760) - (brand.alddeul ? 35 : 0);
    var hasLpg = r() < 0.18;
    var prices = {
      gasoline: round10(base) - Math.round(r() * 9),
      diesel: round10(base - between(r, 90, 140)),
      premium: r() < 0.6 ? round10(base + between(r, 230, 330)) : null,
      lpg: hasLpg ? round10(between(r, 960, 1060)) : null
    };
    var updatedH = r() < 0.12 ? between(r, 25, 40) : between(r, 0.1, 6);
    return {
      id: 'g' + tx + '_' + ty + '_' + n,
      kind: 'fuel',
      name: pick(r, NAME_PREFIX) + ' ' + (brand.alddeul ? '알뜰' : '') + '주유소',
      brand: brand,
      lat: lat, lng: lng,
      addr: pick(r, ROADS) + ' ' + (10 + Math.floor(r() * 290)),
      tel: '0' + (2 + Math.floor(r() * 60)) + '-' + (200 + Math.floor(r() * 799)) + '-' + (1000 + Math.floor(r() * 8999)),
      prices: prices,
      self: r() < 0.55,
      carwash: r() < 0.45,
      store: r() < 0.35,
      open24: r() < 0.3,
      hours: null,
      updatedAt: Date.now() - updatedH * 3600e3,
      seed: hash(tx, ty, 900 + n)
    };
  }

  function makeEv(tx, ty, n) {
    var r = rng(hash(tx, ty, 500 + n));
    var op = pick(r, OPERATORS);
    var lat = (ty + r()) * TILE_LAT;
    var lng = (tx + r()) * TILE_LNG;
    var bucket = Math.floor(Date.now() / 300000); // 5분 단위로 상태 변화
    var sr = rng(hash(tx, ty, bucket % 100000 + n * 7));
    var count = 2 + Math.floor(r() * 6);
    var chargers = [];
    for (var i = 0; i < count; i++) {
      var fast = op.slow === 0 || r() < 0.7;
      var kw = fast ? pick(r, op.id === 'TS' ? [250] : (op.id === 'EP' ? [200, 350] : [50, 100, 100, 200])) : 7;
      var conn = op.id === 'TS' ? ['NACS'] : (fast ? (r() < 0.25 ? ['DC콤보', '차데모'] : ['DC콤보']) : ['AC3상']);
      var s = sr();
      var status = s < 0.08 ? 'broken' : (s < 0.5 ? 'charging' : 'available');
      chargers.push({
        no: i + 1, kw: kw, fast: fast, connectors: conn, status: status,
        remainMin: status === 'charging' ? 5 + Math.floor(sr() * 40) : 0
      });
    }
    var fastPrice = op.fast + Math.round(between(r, -6, 6));
    return {
      id: 'e' + tx + '_' + ty + '_' + n,
      kind: 'ev',
      name: pick(r, NAME_PREFIX) + ' ' + pick(r, EV_SITES) + ' 충전소',
      operator: op,
      lat: lat, lng: lng,
      addr: pick(r, ROADS) + ' ' + (10 + Math.floor(r() * 290)),
      tel: '1661-' + (1000 + Math.floor(r() * 8999)),
      prices: { fast: fastPrice, slow: op.slow || null },
      chargers: chargers,
      open24: r() < 0.6,
      parkingFree: r() < 0.5,
      updatedAt: Date.now() - between(r, 0.02, 0.08) * 3600e3,
      seed: hash(tx, ty, 950 + n)
    };
  }

  function tileStations(tx, ty) {
    var r = rng(hash(tx, ty, 7));
    var out = [];
    var nf = 2 + Math.floor(r() * 3);
    var ne = 1 + Math.floor(r() * 3);
    for (var i = 0; i < nf; i++) out.push(makeFuel(tx, ty, i));
    for (var j = 0; j < ne; j++) out.push(makeEv(tx, ty, j));
    return out;
  }

  function distanceKm(a, b) {
    var R = 6371, toRad = Math.PI / 180;
    var dLat = (b.lat - a.lat) * toRad, dLng = (b.lng - a.lng) * toRad;
    var s = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(a.lat * toRad) * Math.cos(b.lat * toRad) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return 2 * R * Math.asin(Math.sqrt(s));
  }

  /** 기준점 반경 내 업장 (kind: 'fuel' | 'ev') */
  function near(center, radiusKm, kind) {
    var dLat = radiusKm / 111 + TILE_LAT, dLng = radiusKm / (111 * Math.cos(center.lat * Math.PI / 180)) + TILE_LNG;
    var tx0 = Math.floor((center.lng - dLng) / TILE_LNG), tx1 = Math.floor((center.lng + dLng) / TILE_LNG);
    var ty0 = Math.floor((center.lat - dLat) / TILE_LAT), ty1 = Math.floor((center.lat + dLat) / TILE_LAT);
    var out = [];
    for (var tx = tx0; tx <= tx1; tx++) {
      for (var ty = ty0; ty <= ty1; ty++) {
        tileStations(tx, ty).forEach(function (s) {
          if (kind && s.kind !== kind) return;
          var d = distanceKm(center, s);
          if (d <= radiusKm) { s.straightKm = d; out.push(s); }
        });
      }
    }
    return out;
  }

  function get(id) {
    var m = /^([ge])(-?\d+)_(-?\d+)_(\d+)$/.exec(id || '');
    if (!m) return null;
    var tx = +m[2], ty = +m[3], n = +m[4];
    return m[1] === 'g' ? makeFuel(tx, ty, n) : makeEv(tx, ty, n);
  }

  /** 최근 N일 가격 추이 (더미) */
  function history(station, key, days) {
    var r = rng(station.seed + key.length);
    var now = key === 'fast' || key === 'slow' ? station.prices[key] : station.prices[key];
    if (!now) return [];
    var arr = [], p = now;
    for (var i = 0; i < days; i++) {
      arr.unshift({ day: i, price: Math.round(p) });
      p += between(r, -6, 9) * (station.kind === 'ev' ? 0.3 : 1);
    }
    var today = new Date(); today.setHours(0, 0, 0, 0);
    return arr.map(function (d, idx) {
      var dt = new Date(today.getTime() - (days - 1 - idx) * 86400e3);
      return { date: dt, price: d.price };
    });
  }

  return {
    FUELS: FUELS, BRANDS: BRANDS, OPERATORS: OPERATORS, CONNECTORS: CONNECTORS,
    VEHICLE_SPECS: VEHICLE_SPECS, PLACES: PLACES,
    near: near, get: get, history: history, distanceKm: distanceKm
  };
})();
