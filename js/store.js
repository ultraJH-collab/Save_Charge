/* =========================================================
   로컬 저장소 (비로그인 사용자 = localStorage, PRD F-16)
   ========================================================= */
window.SC = window.SC || {};

SC.store = (function () {
  var KEY = 'savecharge:v1';

  var DEFAULTS = {
    onboarded: false,
    vehicles: [
      { id: 'v1', name: '내 차', model: '', fuel: 'gasoline', efficiency: 12, capacity: 55, connector: '', maxKw: 0 }
    ],
    activeVehicleId: 'v1',
    search: {
      baseType: 'current',       // current | home | work | place | pin
      base: null,                // { lat, lng, label }
      radius: 3,                 // km
      fuelMode: 'amount',        // amount | volume | full
      amount: 50000,
      volume: 40,
      level: 20,                 // 가득 모드: 현재 잔량 %
      socNow: 20,
      socTarget: 80,
      sort: 'recommend',         // recommend | price | distance | time
      filters: { brands: [], self: false, carwash: false, store: false, open24: false, alddeul: false,
                 minKw: 0, operators: [], onlyAvailable: false }
    },
    places: {
      home: null,                // { lat, lng, label }
      work: null,
      custom: []                 // [{ id, name, lat, lng, label }]
    },
    favStations: [],             // [stationId]
    alerts: [],                  // [{ id, stationId, fuel, target, on }]
    trips: [],                   // [{ date, stationId, name, kind, cost, saving }]
    settings: {
      navApp: '',                // tmap | kakao | naver
      theme: 'system',           // system | light | dark
      vot: 10000,                // 시간 가치 원/시간
      push: false,
      discounts: []              // [{ id, brand, label, perLiter }]
    }
  };

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  function merge(base, extra) {
    if (!extra || typeof extra !== 'object' || Array.isArray(extra)) return extra === undefined ? base : extra;
    var out = Array.isArray(base) ? base.slice() : Object.assign({}, base);
    Object.keys(extra).forEach(function (k) {
      if (base && typeof base[k] === 'object' && base[k] !== null && !Array.isArray(base[k])) {
        out[k] = merge(base[k], extra[k]);
      } else {
        out[k] = extra[k];
      }
    });
    return out;
  }

  var state;
  try {
    state = merge(clone(DEFAULTS), JSON.parse(localStorage.getItem(KEY) || '{}'));
  } catch (e) {
    state = clone(DEFAULTS);
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* 저장 불가 환경 무시 */ }
  }

  return {
    get: function () { return state; },
    save: save,
    update: function (fn) { fn(state); save(); },
    reset: function () { state = clone(DEFAULTS); save(); },
    activeVehicle: function () {
      return state.vehicles.find(function (v) { return v.id === state.activeVehicleId; }) || state.vehicles[0];
    },
    isFav: function (id) { return state.favStations.indexOf(id) > -1; },
    toggleFav: function (id) {
      var i = state.favStations.indexOf(id);
      if (i > -1) state.favStations.splice(i, 1); else state.favStations.push(id);
      save();
      return i === -1;
    },
    uid: function () { return Math.random().toString(36).slice(2, 9); }
  };
})();

/* 테마는 최대한 빨리 적용 (깜빡임 방지) */
(function () {
  var t = SC.store.get().settings.theme;
  if (t === 'light' || t === 'dark') document.documentElement.setAttribute('data-theme', t);
})();
