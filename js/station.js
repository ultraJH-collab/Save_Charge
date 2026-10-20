/* =========================================================
   업장 상세: 비용 구성 · 가격/충전기 · 30일 추이 · 알림 · 제보 · 길안내
   ========================================================= */
(function () {
  var S = SC.store, U = SC.ui, D = SC.data;
  var $ = function (id) { return document.getElementById(id); };
  var st = S.get();

  var id = new URLSearchParams(location.search).get('id');
  var station = D.get(id);

  function vehicleFor(kind) {
    var a = S.activeVehicle();
    if ((a.fuel === 'ev') === (kind === 'ev')) return a;
    return st.vehicles.find(function (v) { return (v.fuel === 'ev') === (kind === 'ev'); }) ||
      (kind === 'ev'
        ? { id: 'tmp-ev', name: '기본 전기차', fuel: 'ev', efficiency: 5.0, capacity: 84, connector: 'DC콤보', maxKw: 250 }
        : { id: 'tmp-fuel', name: '기본 차량', fuel: 'gasoline', efficiency: 12, capacity: 55 });
  }

  function init() {
    if (!station) {
      $('station-page').innerHTML = '<div class="empty">' + U.icon('alert') + '<span>업장 정보를 찾을 수 없습니다.</span><a class="btn btn--sm" href="index.html">홈으로</a></div>';
      document.querySelector('.sticky-cta').hidden = true;
      return;
    }
    var isEv = station.kind === 'ev';
    var base = U.lastBase();
    var vehicle = vehicleFor(station.kind);
    var out = SC.cost.single(station, base, vehicle);
    var r = out.r, res = out.res;
    var unit = isEv ? '원/kWh' : '원/L';

    document.title = station.name + ' · SaveCharge';

    /* 요약 */
    $('st-dot').style.setProperty('--c', isEv ? 'var(--info)' : station.brand.color);
    $('st-name').textContent = station.name;
    $('st-brand').textContent = isEv ? station.operator.name + ' · 전기차 충전소' : station.brand.name + (station.self ? ' · 셀프' : '');
    $('st-addr-text').textContent = station.addr;
    var badges = [];
    if (!isEv && station.brand.alddeul) badges.push('<span class="badge badge--brand">알뜰</span>');
    if (station.open24) badges.push('<span class="badge">24시간</span>');
    if ((Date.now() - station.updatedAt) / 3600e3 > SC.config.STALE_HOURS) badges.push('<span class="badge badge--danger">오래된 가격</span>');
    if (r && r.recRank) badges.push('<span class="badge badge--info">추천 ' + r.recRank + '위</span>');
    $('st-badges').innerHTML = badges.join('');

    if (r) {
      $('st-total').textContent = U.won(r.total);
      // 기준 = 반경 내 실질 비용 최저 업장
      var best = res.best;
      if (!best || best.station.id === station.id || Math.abs(r.gap) < 1) {
        $('st-saving').textContent = '주변에서 실질 비용이 가장 낮은 업장이에요';
      } else if (r.gap < 0) {
        $('st-saving').textContent = '검색 조건 내 최저(' + best.station.name + ')보다 ' + U.won(-r.gap) + ' 저렴';
      } else {
        $('st-saving').innerHTML = '최저 비용 업장보다 +' + U.won(r.gap) + ' 더 듦 · <a href="station.html?id=' +
          best.station.id + '">' + U.esc(best.station.name) + ' ' + U.won(best.total) + '</a>';
      }
      $('st-saving').className = 'saving' + (r.gap < 1 ? '' : ' saving--neg');
      $('st-dist-label').textContent = '기준 위치에서 (편도)';
      $('st-dist').textContent = U.km(r.travel.oneKm) + ' · ' + U.min(r.travel.oneMin);
      renderCost(r, vehicle, isEv, unit);
    } else {
      $('st-total').textContent = '-';
      $('st-saving').textContent = isEv ? '내 차량 커넥터와 맞는 충전기가 없습니다.' : U.fuelLabel(vehicle.fuel) + '를 판매하지 않는 업장입니다.';
      $('st-saving').className = 'saving saving--neg';
      $('cost-kv').innerHTML = '';
      $('cost-note').textContent = '현재 차량 조건으로는 비용을 계산할 수 없습니다.';
    }

    /* 가격 / 충전기 */
    $('st-updated').textContent = '갱신 ' + U.ago(station.updatedAt);
    if (isEv) {
      $('price-title-text').textContent = '충전기 현황 · 급속 ' + U.num(station.prices.fast) + unit + (station.prices.slow ? ' / 완속 ' + U.num(station.prices.slow) + unit : '');
      $('price-list').innerHTML = station.chargers.map(function (c) {
        var stLabel = c.status === 'available' ? '<span class="badge badge--brand">사용 가능</span>'
          : c.status === 'charging' ? '<span class="badge badge--warn">충전 중 · 약 ' + c.remainMin + '분</span>'
          : '<span class="badge badge--danger">고장·점검</span>';
        var compatible = !vehicle.connector || c.connectors.indexOf(vehicle.connector) > -1;
        return '<li class="list-item' + (compatible ? '' : ' is-dim') + '">' + U.icon('bolt') +
          '<span class="list-item__body"><span class="list-item__title">' + c.no + '번 · ' + (c.fast ? '급속 ' : '완속 ') + c.kw + 'kW</span><br>' +
          '<span class="list-item__sub">' + c.connectors.join(', ') + (compatible ? '' : ' · 내 차량 미지원') + '</span></span>' + stLabel + '</li>';
      }).join('');
    } else {
      $('price-list').innerHTML = ['gasoline', 'diesel', 'premium', 'lpg'].filter(function (f) { return station.prices[f]; }).map(function (f) {
        var mine = f === vehicle.fuel;
        return '<li class="list-item' + (mine ? ' is-mine' : '') + '"><span class="list-item__body list-item__title">' + U.fuelLabel(f) +
          (mine ? ' <span class="badge badge--brand">내 차량</span>' : '') + '</span>' +
          '<span class="price-cell num"><strong>' + U.num(station.prices[f]) + '</strong>' + unit +
          (mine && res.avgPrice ? '<br><span class="xsmall ' + (station.prices[f] <= res.avgPrice ? 'brand-text' : 'muted') + '">평균 대비 ' +
            (station.prices[f] <= res.avgPrice ? '-' : '+') + U.num(Math.abs(station.prices[f] - res.avgPrice)) + '원</span>' : '') +
          '</span></li>';
      }).join('');
    }

    /* 추이 */
    var key = isEv ? 'fast' : vehicle.fuel;
    if (!station.prices[key]) key = isEv ? 'fast' : 'gasoline';
    renderTrend(D.history(station, key, 30), unit, isEv ? '급속' : U.fuelLabel(key));

    /* 편의시설 / 정보 */
    var am = isEv
      ? [['parkingFree', '주차 무료', 'pin'], ['open24', '24시간', 'clock']]
      : [['self', '셀프', 'fuel'], ['carwash', '세차장', 'wash'], ['store', '편의점', 'shop'], ['open24', '24시간', 'clock']];
    $('amenities').innerHTML = am.map(function (a) {
      return '<span class="amenity' + (station[a[0]] ? ' is-on' : '') + '">' + U.icon(a[2]) + a[1] + '</span>';
    }).join('');
    $('info-kv').innerHTML =
      '<dt>주소</dt><dd>' + U.esc(station.addr) + '</dd>' +
      '<dt>전화</dt><dd><a href="tel:' + station.tel + '" class="brand-text">' + station.tel + '</a></dd>' +
      '<dt>운영시간</dt><dd>' + (station.open24 ? '24시간' : '06:00 ~ 23:00') + '</dd>' +
      '<dt>가격 출처</dt><dd>' + (isEv ? '환경공단 충전소 API' : '오피넷') + ' · ' + U.ago(station.updatedAt) + '</dd>';

    /* 즐겨찾기 */
    var fav = $('btn-fav');
    function syncFav() {
      var on = S.isFav(station.id);
      fav.setAttribute('aria-pressed', String(on));
      fav.innerHTML = U.icon(on ? 'starFill' : 'star');
    }
    syncFav();
    fav.onclick = function () {
      var on = S.toggleFav(station.id);
      syncFav();
      U.toast(on ? '즐겨찾기에 추가했습니다.' : '즐겨찾기에서 뺐습니다.');
    };

    /* 알림 */
    $('btn-alert').onclick = function () {
      var cur = station.prices[key];
      var existing = st.alerts.find(function (a) { return a.stationId === station.id; });
      $('alert-desc').textContent = (isEv ? '급속' : U.fuelLabel(key)) + ' 현재 ' + U.num(cur) + unit;
      $('alert-unit').textContent = unit;
      $('alert-target').value = existing ? existing.target : cur - (isEv ? 10 : 30);
      U.openSheet('sheet-alert');
    };
    $('alert-save').onclick = function () {
      var target = +$('alert-target').value;
      if (!target) { U.toast('목표 단가를 입력해 주세요.'); return; }
      S.update(function (s) {
        s.alerts = s.alerts.filter(function (a) { return a.stationId !== station.id; });
        s.alerts.push({ id: S.uid(), stationId: station.id, name: station.name, fuel: key, target: target, on: true });
      });
      U.closeSheet('sheet-alert');
      U.toast('목표가 ' + U.num(target) + '원 알림을 저장했습니다.');
      if (!st.settings.push) setTimeout(function () { U.toast('설정에서 푸시 알림을 켜면 앱 밖에서도 받을 수 있어요.'); }, 2600);
    };

    /* 제보 */
    $('report-fuel').innerHTML = isEv
      ? '<option value="fast">급속 단가</option>' + (station.prices.slow ? '<option value="slow">완속 단가</option>' : '')
      : ['gasoline', 'diesel', 'premium', 'lpg'].filter(function (f) { return station.prices[f]; })
          .map(function (f) { return '<option value="' + f + '"' + (f === key ? ' selected' : '') + '>' + U.fuelLabel(f) + '</option>'; }).join('');
    $('report-unit').textContent = unit;
    $('btn-report').onclick = function () { $('report-price').value = ''; U.openSheet('sheet-report'); };
    $('report-form').onsubmit = function (e) {
      e.preventDefault();
      var type = document.querySelector('input[name="report-type"]:checked').value;
      if (type === 'price' && !$('report-price').value) { U.toast('현장 가격을 입력해 주세요.'); return; }
      U.closeSheet('sheet-report');
      U.toast('제보해 주셔서 감사합니다. 확인 후 반영할게요.');
    };

    /* 길안내 */
    $('btn-nav').onclick = function () {
      U.startNav(station, function () { if (r) U.recordTrip(r); });
    };
  }

  function renderCost(r, vehicle, isEv, unit) {
    var parts = [
      { k: isEv ? '충전비' : '주유비', v: r.pay, c: 'var(--brand)', d: U.num(r.unitPrice) + unit + ' × ' + U.num(r.qty, 1) + (isEv ? 'kWh' : 'L') },
      { k: '이동 연료비', v: r.travelEnergy, c: 'var(--info)', d: '왕복 ' + U.km(r.travel.D) + ' ÷ ' + vehicle.efficiency + (isEv ? 'km/kWh' : 'km/L') },
      { k: '시간 비용', v: r.timeCost, c: 'var(--warn)', d: (isEv ? '이동 ' + U.min(r.travel.T) + (r.waitMin ? ' + 대기 ' + U.min(r.waitMin) : '') + ' + 충전 ' + U.min(r.chargeMin) : '왕복 ' + U.min(r.travel.T)) + ' × ' + U.num(st.settings.vot) + '원/시간' },
      { k: '통행료', v: r.toll, c: 'var(--danger)', d: 'T map 경로 응답값 (연동 전 0원)' }
    ];
    $('cost-bar').innerHTML = parts.filter(function (p) { return p.v > 0; }).map(function (p) {
      return '<span style="flex:' + p.v + ';background:' + p.c + '"></span>';
    }).join('');
    $('cost-kv').innerHTML = parts.map(function (p) {
      return '<dt><span class="legend" style="--c:' + p.c + '"></span>' + p.k + '<br><span class="xsmall muted">' + p.d + '</span></dt><dd class="num">' + U.won(p.v) + '</dd>';
    }).join('') + '<dt class="bold" style="color:var(--text)">합계</dt><dd class="num cost-sum">' + U.won(r.total) + '</dd>';
    if (r.discount) {
      $('cost-kv').insertAdjacentHTML('afterbegin', '<dt>카드·멤버십 할인</dt><dd class="num brand-text">-' + U.num(r.discount) + unit + '</dd>');
    }
    $('cost-note').textContent = '거리·시간은 직선거리 × ' + SC.config.DETOUR_FACTOR + ', 평균 ' + SC.config.AVG_SPEED_KMH +
      'km/h 기준 예상치입니다. 차량: ' + vehicle.name + (st.search.fuelMode === 'amount' && !isEv ? ' · 금액 모드는 주변 평균단가 기준 동일 용량으로 비교' : '');
  }

  function renderTrend(data, unit, label) {
    if (!data.length) { $('trend-section').hidden = true; return; }
    var W = 320, H = 140, pl = 44, pr = 10, pt = 12, pb = 24;
    var ps = data.map(function (d) { return d.price; });
    var lo = Math.min.apply(null, ps), hi = Math.max.apply(null, ps);
    var pad = Math.max(5, (hi - lo) * 0.15); lo -= pad; hi += pad;
    var X = function (i) { return pl + i / (data.length - 1) * (W - pl - pr); };
    var Y = function (p) { return pt + (hi - p) / (hi - lo) * (H - pt - pb); };
    var line = data.map(function (d, i) { return (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(d.price).toFixed(1); }).join('');
    var area = line + 'L' + X(data.length - 1) + ' ' + (H - pb) + 'L' + pl + ' ' + (H - pb) + 'Z';
    var ticks = [lo + pad, (lo + hi) / 2, hi - pad].map(Math.round);
    var fmt = function (d) { return (d.getMonth() + 1) + '/' + d.getDate(); };
    var last = data[data.length - 1].price, first = data[0].price, avg = ps.reduce(function (a, b) { return a + b; }, 0) / ps.length;

    $('trend-chart').innerHTML =
      '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + label + ' 30일 가격 추이, 현재 ' + U.num(last) + unit + '">' +
      ticks.map(function (t) { return '<line x1="' + pl + '" x2="' + (W - pr) + '" y1="' + Y(t) + '" y2="' + Y(t) + '" class="trend__grid"/><text x="' + (pl - 6) + '" y="' + (Y(t) + 4) + '" class="trend__tick" text-anchor="end">' + U.num(t) + '</text>'; }).join('') +
      '<path d="' + area + '" class="trend__area"/><path d="' + line + '" class="trend__line"/>' +
      '<circle cx="' + X(data.length - 1) + '" cy="' + Y(last) + '" r="4" class="trend__dot"/>' +
      '<text x="' + pl + '" y="' + (H - 6) + '" class="trend__tick">' + fmt(data[0].date) + '</text>' +
      '<text x="' + (W - pr) + '" y="' + (H - 6) + '" class="trend__tick" text-anchor="end">오늘</text></svg>';
    $('trend-range').textContent = label + ' · 30일 평균 ' + U.num(avg) + unit;
    var diff = last - first;
    $('trend-hint').textContent = last <= avg ? '평균보다 낮아요 · 오늘 넣기 좋아요' : '평균보다 높아요 · 급하지 않다면 대기';
    $('trend-hint').className = 'bold ' + (last <= avg ? 'brand-text' : 'danger-text');
    $('trend-hint').title = '30일 전 대비 ' + (diff >= 0 ? '+' : '') + U.num(diff) + '원';
  }

  document.addEventListener('DOMContentLoaded', init);
})();
