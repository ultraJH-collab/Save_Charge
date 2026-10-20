/* =========================================================
   실질 비용 계산 (PRD 6장)
   주유소:  C = P·Q + (D/E)·P + V·T/60 + F
   충전소:  C = P·K + (D/Ev)·P + V·(T + W + 충전시간)/60 + F
   - D, T: 왕복 추가 거리/시간. 여기서는 추정치(직선거리 × 우회계수, 평균속도).
     실서비스에서는 상위 N곳만 T map 자동차 경로안내로 교체합니다 (PRD 6.4).
   ========================================================= */
window.SC = window.SC || {};

SC.cost = (function () {
  var cfg = SC.config;

  function discountFor(brandId) {
    var list = SC.store.get().settings.discounts || [];
    return list.filter(function (d) { return d.brand === brandId || d.brand === 'ALL'; })
      .reduce(function (m, d) { return Math.max(m, +d.perLiter || 0); }, 0);
  }

  function travel(station) {
    var oneKm = station.straightKm * cfg.DETOUR_FACTOR;
    var oneMin = oneKm / cfg.AVG_SPEED_KMH * 60;
    return { oneKm: oneKm, oneMin: oneMin, D: oneKm * 2, T: oneMin * 2, F: 0, estimated: true };
  }

  /** 차량에 맞는 사용 가능 충전기 선택 → { charger, waitMin } | null */
  function pickCharger(station, vehicle, minKw) {
    var ok = station.chargers.filter(function (c) {
      if (c.status === 'broken') return false;
      if (minKw && c.kw < minKw) return false;
      if (!vehicle.connector) return true;
      return c.connectors.indexOf(vehicle.connector) > -1;
    });
    if (!ok.length) return null;
    var carKw = vehicle.maxKw || 400;
    function eff(c) { return Math.min(c.kw, carKw); }
    var free = ok.filter(function (c) { return c.status === 'available'; })
      .sort(function (a, b) { return eff(b) - eff(a); });
    if (free.length) return { charger: free[0], waitMin: 0, freeCount: free.length, total: ok.length };
    var busy = ok.slice().sort(function (a, b) { return a.remainMin - b.remainMin; });
    return { charger: busy[0], waitMin: busy[0].remainMin, freeCount: 0, total: ok.length };
  }

  /** 단일 업장 평가 */
  function evaluate(station, ctx) {
    var v = ctx.vehicle, s = ctx.search, vot = ctx.vot;
    var tr = travel(station);
    var r = { station: station, travel: tr, stale: (Date.now() - station.updatedAt) / 3600e3 > cfg.STALE_HOURS };

    if (station.kind === 'fuel') {
      var listPrice = station.prices[v.fuel];
      if (!listPrice) return null;
      var disc = discountFor(station.brand.id);
      var P = listPrice - disc;
      var Q;
      if (s.fuelMode === 'amount') Q = s.amount / ctx.avgPrice;          // 동일 용량 비교 기준
      else if (s.fuelMode === 'volume') Q = s.volume;
      else Q = v.capacity * (100 - s.level) / 100;
      r.unitPrice = P;
      r.listPrice = listPrice;
      r.discount = disc;
      r.qty = Q;
      r.pay = P * Q;
      r.receivable = s.fuelMode === 'amount' ? s.amount / P : null;     // 금액 모드: 받을 수 있는 양
      r.travelEnergy = tr.D / v.efficiency * P;
      r.timeMin = tr.T;
      r.timeCost = vot * tr.T / 60;
    } else {
      var pick = pickCharger(station, v, s.filters.minKw);
      if (!pick) return null;
      if (s.filters.onlyAvailable && pick.freeCount === 0) return null;
      var c = pick.charger;
      var K = v.capacity * Math.max(0, s.socTarget - s.socNow) / 100;
      var Pe = c.fast ? station.prices.fast : station.prices.slow;
      var kw = Math.min(c.kw, v.maxKw || c.kw);
      var chargeMin = K / kw * 60 * cfg.EV_TAPER;
      r.charger = c;
      r.freeCount = pick.freeCount;
      r.chargerTotal = pick.total;
      r.unitPrice = Pe;
      r.listPrice = Pe;
      r.discount = 0;
      r.qty = K;
      r.pay = Pe * K;
      r.travelEnergy = tr.D / v.efficiency * Pe;
      r.waitMin = pick.waitMin;
      r.chargeMin = chargeMin;
      r.timeMin = tr.T + pick.waitMin + chargeMin;
      r.timeCost = vot * r.timeMin / 60;
    }
    r.toll = tr.F;
    r.total = r.pay + r.travelEnergy + r.timeCost + r.toll;
    return r;
  }

  function passesFilters(st, f) {
    if (st.kind === 'fuel') {
      if (f.brands.length && f.brands.indexOf(st.brand.id) === -1) return false;
      if (f.self && !st.self) return false;
      if (f.carwash && !st.carwash) return false;
      if (f.store && !st.store) return false;
      if (f.open24 && !st.open24) return false;
      if (f.alddeul && !st.brand.alddeul) return false;
    } else {
      if (f.operators.length && f.operators.indexOf(st.operator.id) === -1) return false;
      if (f.open24 && !st.open24) return false;
    }
    return true;
  }

  var SORTS = {
    recommend: function (a, b) { return a.total - b.total; },
    price: function (a, b) { return a.unitPrice - b.unitPrice || a.total - b.total; },
    distance: function (a, b) { return a.travel.oneKm - b.travel.oneKm; },
    time: function (a, b) { return a.timeMin - b.timeMin; }
  };

  /** 검색 실행 → { results, all, best, avgPrice, avgTotal, ctx } */
  function rank(center, opts) {
    var st = SC.store.get();
    var vehicle = opts.vehicle || SC.store.activeVehicle();
    var search = opts.search || st.search;
    var kind = vehicle.fuel === 'ev' ? 'ev' : 'fuel';
    var stations = SC.data.near(center, search.radius, kind).filter(function (s) {
      return passesFilters(s, search.filters);
    });

    // 반경 내 평균단가 (금액 모드의 Q 기준, 절약액 기준)
    var prices = stations.map(function (s) {
      return kind === 'fuel' ? s.prices[vehicle.fuel] : s.prices.fast;
    }).filter(Boolean);
    var avgPrice = prices.length ? prices.reduce(function (a, b) { return a + b; }, 0) / prices.length : 0;

    var ctx = { vehicle: vehicle, search: search, vot: opts.vot != null ? opts.vot : st.settings.vot, avgPrice: avgPrice };
    var all = stations.map(function (s) { return evaluate(s, ctx); }).filter(Boolean);
    var avgTotal = all.length ? all.reduce(function (a, r) { return a + r.total; }, 0) / all.length : 0;

    // 추천 1위 = 실질 비용 최저 업장. 모든 비교의 기준
    all.sort(SORTS.recommend);
    var best = all[0] || null;
    all.forEach(function (r, i) {
      r.recRank = i + 1;
      r.gap = r.total - best.total;          // 최저 업장 대비 추가 비용 (0 = 최저)
      r.saving = avgTotal - r.total;         // 주변 평균 대비 절약액 (리포트 기록용)
    });

    var sorted = all.slice().sort(SORTS[search.sort] || SORTS.recommend);
    var results = sorted.slice(0, cfg.RESULT_LIMIT);
    // 다른 정렬에서도 기준(최저 업장)은 항상 목록·지도에 노출
    if (best && results.indexOf(best) === -1) results[results.length - 1] = best;
    return {
      kind: kind, vehicle: vehicle, avgPrice: avgPrice, avgTotal: avgTotal, best: best,
      all: sorted, results: results, ctx: ctx
    };
  }

  /** 상세 화면 등 단일 업장 평가 (주변 평균 포함) */
  function single(station, center, vehicle) {
    var res = rank(center, { vehicle: vehicle });
    var found = res.all.find(function (r) { return r.station.id === station.id; });
    if (found) return { r: found, res: res };
    station.straightKm = SC.data.distanceKm(center, station);
    var r = evaluate(station, res.ctx);
    if (r) {
      r.saving = res.avgTotal ? res.avgTotal - r.total : 0;
      r.gap = res.best ? r.total - res.best.total : 0;   // 반경·필터 밖 업장은 음수일 수 있음
      r.recRank = null;
    }
    return { r: r, res: res };
  }

  return { rank: rank, evaluate: evaluate, single: single, pickCharger: pickCharger };
})();
