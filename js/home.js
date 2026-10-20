/* =========================================================
   홈: 기준 위치 → 주유량/충전량 → 추천 → 길안내
   ========================================================= */
(function () {
  var S = SC.store, U = SC.ui, D = SC.data;
  var st = S.get();

  if (!st.onboarded) { location.replace('onboarding.html'); return; }

  var DEFAULT_EV = { id: 'tmp-ev', name: '기본 전기차', model: '아이오닉5 기준', fuel: 'ev', efficiency: 5.0, capacity: 84, connector: 'DC콤보', maxKw: 250 };
  var DEFAULT_FUEL = { id: 'tmp-fuel', name: '기본 차량', model: '', fuel: 'gasoline', efficiency: 12, capacity: 55 };

  var $ = function (id) { return document.getElementById(id); };
  var state = {
    mode: S.activeVehicle().fuel === 'ev' ? 'ev' : 'fuel',
    base: null,
    result: null,
    selected: null,
    picking: false
  };

  /* ---------- 차량 ---------- */
  function vehicle() {
    var a = S.activeVehicle();
    if ((a.fuel === 'ev') === (state.mode === 'ev')) return a;
    var m = st.vehicles.find(function (v) { return (v.fuel === 'ev') === (state.mode === 'ev'); });
    return m || (state.mode === 'ev' ? DEFAULT_EV : DEFAULT_FUEL);
  }

  function renderVehicle() {
    var v = vehicle();
    $('vehicle-name').textContent = v.name;
    $('vehicle-spec').textContent = U.fuelLabel(v.fuel) + ' · ' + v.efficiency + (v.fuel === 'ev' ? 'km/kWh' : 'km/L') +
      (v.fuel === 'ev' ? ' · ' + v.capacity + 'kWh' : '') + (v.id.indexOf('tmp') === 0 ? ' (임시)' : '');
    document.querySelectorAll('[data-mode]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-mode') === state.mode));
    });
    $('qty-fuel').hidden = state.mode === 'ev';
    $('qty-ev').hidden = state.mode !== 'ev';
  }

  /* ---------- 주유량 프리셋 ---------- */
  var PRESETS = {
    amount: [30000, 50000, 70000, 100000],
    volume: [20, 40, 60],
    full: [10, 20, 30, 50]
  };
  function renderQty() {
    var s = st.search;
    document.querySelectorAll('[data-fuel-mode]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-fuel-mode') === s.fuelMode));
    });
    var cur = s.fuelMode === 'amount' ? s.amount : s.fuelMode === 'volume' ? s.volume : s.level;
    var list = PRESETS[s.fuelMode].slice();
    if (list.indexOf(cur) === -1) list.push(cur);
    $('qty-presets').innerHTML = list.map(function (v) {
      var label = s.fuelMode === 'amount' ? (v % 10000 === 0 ? v / 10000 + '만원' : U.num(v) + '원')
        : s.fuelMode === 'volume' ? v + 'L' : '잔량 ' + v + '%';
      return '<button type="button" class="chip" data-preset="' + v + '" aria-pressed="' + (v === cur) + '">' + label + '</button>';
    }).join('') + '<button type="button" class="chip" data-preset="custom" data-icon="edit">직접 입력</button>';
    U.hydrateIcons($('qty-presets'));

    var v = vehicle();
    var add = Math.max(0, s.socTarget - s.socNow);
    $('soc-now-bar').style.width = s.socNow + '%';
    $('soc-add-bar').style.width = add + '%';
    $('soc-text').textContent = s.socNow + '% → ' + s.socTarget + '%';
    $('soc-kwh').textContent = U.num(v.capacity * add / 100, 1) + 'kWh 필요';
  }

  /* ---------- 기준 위치 ---------- */
  function setBaseChips() {
    document.querySelectorAll('[data-base]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-base') === st.search.baseType));
    });
  }

  function useBase(base, type) {
    state.base = base;
    S.update(function (s) { s.search.base = base; if (type) s.search.baseType = type; });
    setBaseChips();
    $('base-text').textContent = base.label + (base.addr ? ' · ' + base.addr : '');
    if (map) map.setView(base, st.search.radius);
    run();
  }

  function locate() {
    $('base-text').textContent = '현재 위치 확인 중…';
    U.getCurrentPosition().then(function (p) {
      useBase(p, 'current');
    }).catch(function () {
      var c = Object.assign({}, SC.config.DEFAULT_CENTER);
      c.label = '위치 권한 없음 · ' + c.label + ' 기준';
      U.toast('위치를 가져오지 못해 ' + SC.config.DEFAULT_CENTER.label + ' 기준으로 검색합니다.');
      useBase(c, 'current');
    });
  }

  function onBaseChip(type) {
    if (type === 'current') return locate();
    if (type === 'home' || type === 'work') {
      var p = st.places[type];
      if (!p) {
        U.toast((type === 'home' ? '집' : '회사') + ' 위치를 먼저 등록해 주세요.');
        openPlaceSheet(type);
        return;
      }
      return useBase(Object.assign({}, p, { label: type === 'home' ? '집' : '회사' }), type);
    }
    if (type === 'place') return openPlaceSheet();
    if (type === 'pin') return startPick();
  }

  /* ---------- 장소 검색 시트 ---------- */
  var placeSaveTarget = null;
  function openPlaceSheet(saveAs) {
    placeSaveTarget = saveAs || null;
    $('place-title').textContent = saveAs ? (saveAs === 'home' ? '집' : '회사') + ' 위치 등록' : '기준 위치 검색';
    $('place-q').value = '';
    renderPlaces('');
    U.openSheet('sheet-place');
  }
  function renderPlaces(q) {
    q = q.trim();
    var list = D.PLACES.concat(st.places.custom.map(function (c) { return Object.assign({ saved: true }, c); }))
      .filter(function (p) { return !q || p.name.indexOf(q) > -1 || (p.addr || '').indexOf(q) > -1; });
    $('place-list').innerHTML = list.length ? list.map(function (p, i) {
      return '<li><button type="button" class="list-item" data-place="' + i + '">' + U.icon('pin') +
        '<span class="list-item__body"><span class="list-item__title">' + U.esc(p.name) + '</span><br><span class="list-item__sub">' + U.esc(p.addr || '') + '</span></span>' +
        (p.saved ? '<span class="badge">저장됨</span>' : '') + '</button></li>';
    }).join('') : '<li class="empty">' + U.icon('search') + '<span>검색 결과가 없습니다</span></li>';
    $('place-list').onclick = function (e) {
      var b = e.target.closest('[data-place]');
      if (!b) return;
      var p = list[+b.getAttribute('data-place')];
      var base = { lat: p.lat, lng: p.lng, label: p.name, addr: p.addr };
      U.closeSheet('sheet-place');
      if (placeSaveTarget) {
        S.update(function (s) { s.places[placeSaveTarget] = base; });
        U.toast((placeSaveTarget === 'home' ? '집' : '회사') + ' 위치를 저장했습니다.');
        useBase(Object.assign({}, base, { label: placeSaveTarget === 'home' ? '집' : '회사' }), placeSaveTarget);
      } else {
        useBase(base, 'place');
      }
    };
  }

  /* ---------- 지도에서 선택 ---------- */
  function startPick() {
    U.closeSheet('sheet-place');
    state.picking = true;
    map.setPickMode(true);
    $('pick-hint').hidden = false;
    document.querySelector('.home-map').scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  function onPick(ll) {
    state.picking = false;
    map.setPickMode(false);
    $('pick-hint').hidden = true;
    useBase({ lat: ll.lat, lng: ll.lng, label: '지도에서 선택한 위치', pin: true }, 'pin');
  }

  /* ---------- 검색 실행 ---------- */
  function run() {
    if (!state.base) return;
    var v = vehicle();
    state.result = SC.cost.rank(state.base, { vehicle: v });
    renderResults();
  }

  function priceUnit() { return state.mode === 'ev' ? '원/kWh' : '원/L'; }

  function renderResults() {
    var res = state.result, s = st.search;
    document.querySelectorAll('[data-sort]').forEach(function (b) {
      var on = b.getAttribute('data-sort') === s.sort;
      b.setAttribute('aria-selected', String(on));
      b.setAttribute('aria-pressed', String(on));
    });
    $('results-summary').textContent = '반경 ' + s.radius + 'km · ' + res.all.length + '곳 · 평균 ' +
      U.num(res.avgPrice) + priceUnit() + (res.best ? ' · 최저 실질 비용 ' + U.won(res.best.total) : '');

    var list = $('result-list');
    if (!res.results.length) {
      list.innerHTML = '<li class="empty">' + U.icon('search') + '<span>조건에 맞는 업장이 없습니다.<br>반경을 넓히거나 필터를 줄여 보세요.</span><button type="button" class="btn btn--sm" id="btn-empty-cond">조건 변경</button></li>';
      $('btn-empty-cond').onclick = openCond;
      map.setMarkers([]);
      return;
    }

    list.innerHTML = res.results.map(function (r) { return card(r); }).join('');
    U.hydrateIcons(list);

    map.setMarkers(res.results.map(function (r) {
      return {
        id: r.station.id, lat: r.station.lat, lng: r.station.lng,
        label: U.num(r.unitPrice), rank: r.recRank <= 3 ? r.recRank : 0, top: r.recRank === 1,
        // 최저 실질 비용 업장 대비 추가 비용 (최저 업장은 '최저')
        gap: Math.round(r.gap),
        sub: r.gap < 1 ? '최저' : '+' + U.num(r.gap) + '원',
        title: r.station.name + ' ' + U.num(r.unitPrice) + priceUnit() + ', ' +
          (r.gap < 1 ? '최저 실질 비용' : '최저보다 ' + U.won(r.gap) + ' 더 듦')
      };
    }));
    if (state.selected) map.select(state.selected);
  }

  function card(r) {
    var stn = r.station, s = st.search, isEv = stn.kind === 'ev';
    var rank = s.sort === 'recommend' ? r.recRank : r.recRank;
    var top = r.recRank === 1;
    var meta = ['<span>' + U.km(r.travel.oneKm) + '</span>', '<span>' + U.min(r.travel.oneMin) + '</span>'];
    var badges = [];
    if (isEv) {
      meta.push('<span>' + (r.charger.fast ? '급속 ' : '완속 ') + r.charger.kw + 'kW</span>');
      meta.push('<span>' + (r.freeCount ? '대기 ' + r.freeCount + '/' + r.chargerTotal + '대 가능' : '빈 충전기 없음 · 약 ' + r.waitMin + '분 대기') + '</span>');
      meta.push('<span>충전 ' + U.min(r.chargeMin) + '</span>');
      badges.push('<span class="badge">' + U.esc(stn.operator.name) + '</span>');
      if (!r.freeCount) badges.push('<span class="badge badge--warn">대기 필요</span>');
    } else {
      if (s.fuelMode === 'amount') meta.push('<span>' + U.num(s.amount / 10000, s.amount % 10000 ? 1 : 0) + '만원 → ' + U.num(r.receivable, 1) + 'L</span>');
      else meta.push('<span>' + U.num(r.qty, 1) + 'L → ' + U.won(r.pay) + '</span>');
      if (stn.self) badges.push('<span class="badge">셀프</span>');
      if (stn.brand.alddeul) badges.push('<span class="badge badge--brand">알뜰</span>');
      if (stn.open24) badges.push('<span class="badge">24시</span>');
    }
    if (r.recRank <= SC.config.TMAP_TOP_N) badges.push('<span class="badge badge--info">실시간 경로 보정 대상</span>');
    else badges.push('<span class="badge">예상치</span>');
    if (r.stale) badges.push('<span class="badge badge--danger">오래된 가격 · ' + U.ago(stn.updatedAt) + '</span>');

    var saving = r.gap < 1
      ? '<span class="saving">최저 비용</span>'
      : '<span class="saving saving--neg">최저보다 +' + U.won(r.gap) + '</span>';

    return '<li class="result' + (top ? ' result--top' : '') + (state.selected === stn.id ? ' is-selected' : '') + '" data-id="' + stn.id + '">' +
      '<button type="button" class="result__main" data-select="' + stn.id + '" aria-label="' + U.esc(stn.name) + ' 지도에서 보기">' +
        '<span class="result__rank" aria-label="추천 ' + rank + '위">' + rank + '</span>' +
        '<span class="result__body">' +
          '<span class="result__title"><span class="brand-dot" style="--c:' + (isEv ? 'var(--info)' : stn.brand.color) + '"></span><span class="name">' + U.esc(stn.name) + '</span></span>' +
          '<span class="result__price"><strong class="num">' + U.num(r.unitPrice) + '</strong>' + priceUnit() +
            (r.discount ? '<del class="num">' + U.num(r.listPrice) + '</del> <span class="brand-text">할인 ' + U.num(r.discount) + '원</span>' : '') +
            (isEv ? '' : ' · ' + (stn.brand.name)) + '</span>' +
          '<span class="result__meta num">' + meta.join('') + '</span>' +
          '<span class="result__badges">' + badges.join('') + '</span>' +
        '</span>' +
        '<span class="result__cost"><span class="label">실질 비용</span><strong class="num">' + U.won(r.total) + '</strong>' + saving + '</span>' +
      '</button>' +
      '<div class="result__actions">' +
        '<a class="btn btn--sm" href="station.html?id=' + stn.id + '">상세 · 비용 내역</a>' +
        '<button type="button" class="btn btn--sm btn--primary" data-nav="' + stn.id + '" data-icon="nav">길안내</button>' +
      '</div></li>';
  }

  function select(id, fromMap) {
    state.selected = id;
    document.querySelectorAll('.result').forEach(function (el) {
      el.classList.toggle('is-selected', el.getAttribute('data-id') === id);
    });
    map.select(id, !fromMap);
    if (fromMap) {
      var el = document.querySelector('.result[data-id="' + id + '"]');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  /* ---------- 검색 조건 시트 ---------- */
  var draft;
  function openCond() {
    draft = JSON.parse(JSON.stringify({ search: st.search, vot: st.settings.vot }));
    renderCond();
    U.openSheet('sheet-cond');
  }
  function seg(id, value) {
    document.querySelectorAll('#' + id + ' [data-v]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-v') === String(value)));
    });
  }
  function renderCond() {
    var s = draft.search, v = vehicle(), isEv = state.mode === 'ev';
    $('cond-fuel').hidden = isEv;
    $('cond-ev').hidden = !isEv;
    seg('cond-radius', s.radius);
    seg('cond-fuel-mode', s.fuelMode);
    seg('cond-minkw', s.filters.minKw);
    $('cond-amount-field').hidden = s.fuelMode !== 'amount';
    $('cond-volume-field').hidden = s.fuelMode !== 'volume';
    $('cond-level-field').hidden = s.fuelMode !== 'full';
    $('cond-amount').value = s.amount;
    $('cond-volume').value = s.volume;
    $('cond-level').value = s.level;
    $('cond-level-v').textContent = s.level + '%';
    $('cond-level-hint').textContent = '탱크 ' + v.capacity + 'L 기준 약 ' + U.num(v.capacity * (100 - s.level) / 100, 1) + 'L 주유';
    $('cond-soc-now').value = s.socNow;
    $('cond-soc-target').value = s.socTarget;
    $('cond-soc-now-v').textContent = s.socNow + '%';
    $('cond-soc-target-v').textContent = s.socTarget + '%';
    $('cond-soc-hint').textContent = '배터리 ' + v.capacity + 'kWh 기준 ' + U.num(v.capacity * Math.max(0, s.socTarget - s.socNow) / 100, 1) + 'kWh 충전';
    $('cond-vot').value = draft.vot;
    $('cond-vot-v').textContent = U.num(draft.vot) + '원/시간';

    $('cond-brands').innerHTML = D.BRANDS.map(function (b) {
      return '<button type="button" class="chip" data-brand="' + b.id + '" aria-pressed="' + (s.filters.brands.indexOf(b.id) > -1) + '"><span class="brand-dot" style="--c:' + b.color + '"></span>' + b.name + '</button>';
    }).join('');
    $('cond-operators').innerHTML = D.OPERATORS.map(function (o) {
      return '<button type="button" class="chip" data-operator="' + o.id + '" aria-pressed="' + (s.filters.operators.indexOf(o.id) > -1) + '">' + o.name + '</button>';
    }).join('');
    document.querySelectorAll('#sheet-cond [data-filter]').forEach(function (c) {
      c.checked = !!s.filters[c.getAttribute('data-filter')];
    });
  }
  function toggleIn(arr, v) { var i = arr.indexOf(v); if (i > -1) arr.splice(i, 1); else arr.push(v); }

  function bindCond() {
    var sheet = $('sheet-cond');
    sheet.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b) return;
      var s = draft.search, group = b.parentElement && b.parentElement.id;
      if (group === 'cond-radius') s.radius = +b.getAttribute('data-v');
      else if (group === 'cond-fuel-mode') s.fuelMode = b.getAttribute('data-v');
      else if (group === 'cond-minkw') s.filters.minKw = +b.getAttribute('data-v');
      else if (b.hasAttribute('data-brand')) toggleIn(s.filters.brands, b.getAttribute('data-brand'));
      else if (b.hasAttribute('data-operator')) toggleIn(s.filters.operators, b.getAttribute('data-operator'));
      else return;
      renderCond();
    });
    sheet.addEventListener('input', function (e) {
      var t = e.target, s = draft.search;
      if (t.id === 'cond-amount') s.amount = Math.max(0, +t.value || 0);
      else if (t.id === 'cond-volume') s.volume = Math.max(0, +t.value || 0);
      else if (t.id === 'cond-level') s.level = +t.value;
      else if (t.id === 'cond-soc-now') { s.socNow = +t.value; if (s.socTarget <= s.socNow) s.socTarget = Math.min(100, s.socNow + 5); }
      else if (t.id === 'cond-soc-target') { s.socTarget = +t.value; if (s.socTarget <= s.socNow) s.socNow = Math.max(0, s.socTarget - 5); }
      else if (t.id === 'cond-vot') draft.vot = +t.value;
      else if (t.hasAttribute('data-filter')) s.filters[t.getAttribute('data-filter')] = t.checked;
      else return;
      if (t.type === 'range' || t.type === 'checkbox') renderCond();
    });
    $('cond-reset').onclick = function () {
      draft.search.radius = 3;
      draft.search.filters = { brands: [], self: false, carwash: false, store: false, open24: false, alddeul: false, minKw: 0, operators: [], onlyAvailable: false };
      draft.vot = 10000;
      renderCond();
    };
    $('cond-apply').onclick = function () {
      if (draft.search.fuelMode === 'amount' && draft.search.amount < 5000) { U.toast('주유 금액은 5,000원 이상 입력해 주세요.'); return; }
      if (draft.search.fuelMode === 'volume' && draft.search.volume < 1) { U.toast('주유 용량을 입력해 주세요.'); return; }
      var radiusChanged = draft.search.radius !== st.search.radius;
      S.update(function (s) { s.search = draft.search; s.settings.vot = draft.vot; });
      st = S.get();
      U.closeSheet('sheet-cond');
      renderQty();
      if (radiusChanged) map.setView(state.base, st.search.radius);
      run();
    };
  }

  /* ---------- 차량 선택 시트 ---------- */
  function openVehicleSheet() {
    $('veh-list').innerHTML = st.vehicles.map(function (v) {
      var on = v.id === vehicle().id;
      return '<li><button type="button" class="list-item" data-veh="' + v.id + '" aria-pressed="' + on + '">' + U.icon(v.fuel === 'ev' ? 'bolt' : 'fuel') +
        '<span class="list-item__body"><span class="list-item__title">' + U.esc(v.name) + '</span><br><span class="list-item__sub">' +
        U.esc((v.model ? v.model + ' · ' : '') + U.fuelLabel(v.fuel) + ' · ' + v.efficiency + (v.fuel === 'ev' ? 'km/kWh' : 'km/L')) + '</span></span>' +
        (on ? '<span class="brand-text">' + U.icon('check') + '</span>' : '') + '</button></li>';
    }).join('');
    $('veh-list').onclick = function (e) {
      var b = e.target.closest('[data-veh]');
      if (!b) return;
      S.update(function (s) { s.activeVehicleId = b.getAttribute('data-veh'); });
      state.mode = S.activeVehicle().fuel === 'ev' ? 'ev' : 'fuel';
      U.closeSheet('sheet-vehicle');
      renderVehicle(); renderQty(); run();
    };
    U.openSheet('sheet-vehicle');
  }

  /* ---------- 가격 알림 체크 (PRD F-11, 데모) ---------- */
  function checkAlerts() {
    var hits = st.alerts.filter(function (a) { return a.on; }).map(function (a) {
      var stn = D.get(a.stationId);
      var p = stn && (stn.kind === 'ev' ? stn.prices.fast : stn.prices[a.fuel]);
      return p && p <= a.target ? { a: a, stn: stn, p: p } : null;
    }).filter(Boolean);
    if (!hits.length) return;
    var h = hits[0];
    var msg = h.stn.name + ' ' + U.num(h.p) + '원 · 목표가 ' + U.num(h.a.target) + '원 도달';
    U.toast('가격 알림: ' + msg);
    if (st.settings.push && 'Notification' in window && Notification.permission === 'granted') {
      try { new Notification('SaveCharge 가격 알림', { body: msg, icon: 'img/icon.svg' }); } catch (e) { /* 일부 브라우저 미지원 */ }
    }
  }

  /* ---------- 이벤트 ---------- */
  var map;
  function init() {
    map = SC.map.create($('map'), {
      center: st.search.base || SC.config.DEFAULT_CENTER,
      radiusKm: st.search.radius,
      onSelect: function (id) { select(id, true); },
      onPick: onPick
    });

    renderVehicle();
    renderQty();
    setBaseChips();
    bindCond();

    document.querySelector('.home-mode').addEventListener('click', function (e) {
      var b = e.target.closest('[data-mode]');
      if (!b || b.getAttribute('data-mode') === state.mode) return;
      state.mode = b.getAttribute('data-mode');
      var v = vehicle();
      if (v.id.indexOf('tmp') !== 0) S.update(function (s) { s.activeVehicleId = v.id; });
      else U.toast((state.mode === 'ev' ? '등록된 전기차가 없어 기본 전기차' : '등록된 내연기관 차량이 없어 기본 차량') + ' 기준으로 계산합니다.');
      renderVehicle(); renderQty(); run();
    });
    $('vehicle-chip').onclick = openVehicleSheet;
    $('base-chips').addEventListener('click', function (e) {
      var b = e.target.closest('[data-base]');
      if (b) onBaseChip(b.getAttribute('data-base'));
    });
    document.querySelectorAll('[data-fuel-mode]').forEach(function (b) {
      b.onclick = function () {
        S.update(function (s) { s.search.fuelMode = b.getAttribute('data-fuel-mode'); });
        renderQty(); run();
      };
    });
    $('qty-presets').addEventListener('click', function (e) {
      var b = e.target.closest('[data-preset]');
      if (!b) return;
      var v = b.getAttribute('data-preset');
      if (v === 'custom') return openCond();
      S.update(function (s) {
        var k = s.search.fuelMode === 'amount' ? 'amount' : s.search.fuelMode === 'volume' ? 'volume' : 'level';
        s.search[k] = +v;
      });
      renderQty(); run();
    });
    $('soc-bar').onclick = openCond;
    $('btn-cond').onclick = openCond;
    $('btn-how').onclick = function () { U.openSheet('sheet-how'); };
    $('sort-tabs').addEventListener('click', function (e) {
      var b = e.target.closest('[data-sort]');
      if (!b) return;
      S.update(function (s) { s.search.sort = b.getAttribute('data-sort'); });
      run();
    });
    $('place-q').addEventListener('input', function (e) { renderPlaces(e.target.value); });
    $('btn-pick-map').onclick = startPick;
    $('btn-recenter').onclick = function () { map.recenter(); };
    $('btn-zoom-in').onclick = function () { map.zoom(1.25); };
    $('btn-zoom-out').onclick = function () { map.zoom(0.8); };

    $('result-list').addEventListener('click', function (e) {
      var nav = e.target.closest('[data-nav]');
      if (nav) {
        var r = state.result.all.find(function (x) { return x.station.id === nav.getAttribute('data-nav'); });
        U.startNav(r.station, function () { U.recordTrip(r); });
        return;
      }
      var sel = e.target.closest('[data-select]');
      if (sel) select(sel.getAttribute('data-select'), false);
    });

    // 초기 기준 위치
    var t = st.search.baseType;
    if (t === 'current' || !st.search.base) locate();
    else useBase(st.search.base, t);

    checkAlerts();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
