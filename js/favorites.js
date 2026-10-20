/* =========================================================
   즐겨찾기: 장소(집·회사·내 장소) / 업장 / 가격 알림 (PRD F-02, F-11)
   ========================================================= */
(function () {
  var S = SC.store, U = SC.ui, D = SC.data;
  var $ = function (id) { return document.getElementById(id); };
  var st = S.get();
  var placeTarget = null; // 'home' | 'work' | 'custom'

  function selectTab(tab) {
    document.querySelectorAll('[data-tab]').forEach(function (b) {
      var on = b.getAttribute('data-tab') === tab;
      b.setAttribute('aria-pressed', String(on));
      b.setAttribute('aria-selected', String(on));
      $('panel-' + b.getAttribute('data-tab')).hidden = !on;
    });
    history.replaceState(null, '', '#' + tab);
  }

  /* ---------- 장소 ---------- */
  function placeRow(icon, title, sub, actions, muted) {
    return '<li class="list-item"><span class="place-icon' + (muted ? ' place-icon--muted' : '') + '">' + U.icon(icon) + '</span>' +
      '<span class="list-item__body"><span class="list-item__title">' + U.esc(title) + '</span><br><span class="list-item__sub">' + U.esc(sub) + '</span></span>' + actions + '</li>';
  }
  function renderPlaces() {
    var p = st.places;
    $('place-fixed').innerHTML =
      placeRow('home', '집', p.home ? p.home.label : '등록되지 않음',
        p.home ? '<button type="button" class="btn btn--sm" data-search="home">이 위치로 검색</button><button type="button" class="icon-btn" data-set="home" aria-label="집 변경">' + U.icon('edit') + '</button>'
               : '<button type="button" class="btn btn--sm btn--primary" data-set="home">등록</button>', !p.home) +
      placeRow('work', '회사', p.work ? p.work.label : '등록되지 않음',
        p.work ? '<button type="button" class="btn btn--sm" data-search="work">이 위치로 검색</button><button type="button" class="icon-btn" data-set="work" aria-label="회사 변경">' + U.icon('edit') + '</button>'
               : '<button type="button" class="btn btn--sm btn--primary" data-set="work">등록</button>', !p.work);
    $('place-custom').innerHTML = p.custom.length ? p.custom.map(function (c) {
      return placeRow('pin', c.name, c.addr || c.label,
        '<button type="button" class="btn btn--sm" data-search-custom="' + c.id + '">검색</button><button type="button" class="icon-btn" data-del-place="' + c.id + '" aria-label="' + U.esc(c.name) + ' 삭제">' + U.icon('trash') + '</button>');
    }).join('') : '<li class="empty small">자주 가는 장소를 추가해 두면 원탭으로 검색할 수 있어요.</li>';
  }

  function openPlace(target) {
    placeTarget = target;
    $('place-title').textContent = target === 'home' ? '집 등록' : target === 'work' ? '회사 등록' : '장소 추가';
    $('place-name-field').hidden = target !== 'custom';
    $('place-name').value = '';
    $('place-q').value = '';
    renderPlaceResults('');
    U.openSheet('sheet-place');
  }
  function renderPlaceResults(q) {
    var list = D.PLACES.filter(function (p) { return !q || p.name.indexOf(q) > -1 || p.addr.indexOf(q) > -1; });
    $('place-results').innerHTML = list.map(function (p, i) {
      return '<li><button type="button" class="list-item" data-i="' + i + '">' + U.icon('pin') + '<span class="list-item__body"><span class="list-item__title">' + p.name + '</span><br><span class="list-item__sub">' + p.addr + '</span></span></button></li>';
    }).join('') || '<li class="empty small">검색 결과가 없습니다</li>';
    $('place-results').onclick = function (e) {
      var b = e.target.closest('[data-i]');
      if (!b) return;
      var p = list[+b.getAttribute('data-i')];
      var base = { lat: p.lat, lng: p.lng, label: p.name, addr: p.addr };
      if (placeTarget === 'custom') {
        var name = $('place-name').value.trim() || p.name;
        S.update(function (s) { s.places.custom.push(Object.assign({ id: S.uid(), name: name }, base)); });
      } else {
        S.update(function (s) { s.places[placeTarget] = base; });
      }
      U.closeSheet('sheet-place');
      renderPlaces();
      U.toast('저장했습니다.');
    };
  }

  function searchFrom(base, type) {
    S.update(function (s) { s.search.base = base; s.search.baseType = type; });
    location.href = 'index.html';
  }

  /* ---------- 업장 ---------- */
  function renderStations() {
    var base = U.lastBase();
    $('station-base').textContent = '거리는 "' + (base.label || '기준 위치') + '" 기준입니다.';
    if (!st.favStations.length) {
      $('station-list').innerHTML = '<li class="empty">' + U.icon('star') + '<span>업장 상세에서 ☆ 를 눌러 추가하세요.</span></li>';
      return;
    }
    var v = S.activeVehicle();
    $('station-list').innerHTML = st.favStations.map(function (id) {
      var s = D.get(id);
      if (!s) return '';
      var isEv = s.kind === 'ev';
      var price = isEv ? s.prices.fast : (s.prices[v.fuel] || s.prices.gasoline);
      var dist = D.distanceKm(base, s) * SC.config.DETOUR_FACTOR;
      return '<li class="list-item"><span class="place-icon' + (isEv ? '' : ' place-icon--muted') + '">' + U.icon(isEv ? 'bolt' : 'fuel') + '</span>' +
        '<a class="list-item__body" href="station.html?id=' + s.id + '"><span class="list-item__title">' + U.esc(s.name) + '</span><br>' +
        '<span class="list-item__sub">' + (isEv ? s.operator.name + ' · 급속' : s.brand.name + ' · ' + U.fuelLabel(v.fuel === 'ev' ? 'gasoline' : v.fuel)) + ' · ' + U.km(dist) + '</span></a>' +
        '<span class="price-cell num"><strong>' + U.num(price) + '</strong>' + (isEv ? '원/kWh' : '원/L') + '<br><span class="xsmall muted">' + U.ago(s.updatedAt) + '</span></span>' +
        '<button type="button" class="icon-btn" data-unfav="' + s.id + '" aria-label="즐겨찾기 해제" style="color:var(--warn)">' + U.icon('starFill') + '</button></li>';
    }).join('');
  }

  /* ---------- 알림 ---------- */
  function renderAlerts() {
    var perm = 'Notification' in window ? Notification.permission : 'unsupported';
    $('push-banner').hidden = perm === 'granted' && st.settings.push;
    if (!st.alerts.length) {
      $('alert-list').innerHTML = '<li class="empty">' + U.icon('bell') + '<span>업장 상세에서 목표 가격을 정하면<br>그 가격 이하일 때 알려드려요.</span></li>';
      return;
    }
    $('alert-list').innerHTML = st.alerts.map(function (a) {
      var s = D.get(a.stationId);
      var now = s ? (s.kind === 'ev' ? s.prices.fast : s.prices[a.fuel]) : 0;
      var hit = now && now <= a.target;
      var pct = now ? Math.max(5, Math.min(100, 100 - (now - a.target) / a.target * 1000)) : 0;
      var unit = s && s.kind === 'ev' ? '원/kWh' : '원/L';
      return '<li class="alert-row"><div class="alert-row__body">' +
        '<a href="station.html?id=' + a.stationId + '" class="list-item__title">' + U.esc(a.name) + '</a>' +
        '<p class="alert-row__now num">' + (s && s.kind === 'ev' ? '급속' : U.fuelLabel(a.fuel)) + ' 현재 <b>' + U.num(now) + '</b> / 목표 ' + U.num(a.target) + unit +
          (hit ? ' <span class="badge badge--brand">도달</span>' : '') + '</p>' +
        '<div class="alert-progress" aria-hidden="true"><span style="width:' + pct + '%"></span></div></div>' +
        '<label class="switch"><input type="checkbox" data-toggle-alert="' + a.id + '"' + (a.on ? ' checked' : '') + ' aria-label="' + U.esc(a.name) + ' 알림 켜기"></label>' +
        '<button type="button" class="icon-btn" data-del-alert="' + a.id + '" aria-label="알림 삭제">' + U.icon('trash') + '</button></li>';
    }).join('');
  }

  document.addEventListener('DOMContentLoaded', function () {
    renderPlaces(); renderStations(); renderAlerts();
    var initial = (location.hash || '#places').slice(1);
    selectTab(['places', 'stations', 'alerts'].indexOf(initial) > -1 ? initial : 'places');

    document.querySelector('.fav-tabs').addEventListener('click', function (e) {
      var b = e.target.closest('[data-tab]');
      if (b) selectTab(b.getAttribute('data-tab'));
    });

    $('panel-places').addEventListener('click', function (e) {
      var b;
      if ((b = e.target.closest('[data-set]'))) openPlace(b.getAttribute('data-set'));
      else if ((b = e.target.closest('[data-search]'))) {
        var t = b.getAttribute('data-search');
        searchFrom(Object.assign({}, st.places[t], { label: t === 'home' ? '집' : '회사' }), t);
      } else if ((b = e.target.closest('[data-search-custom]'))) {
        var c = st.places.custom.find(function (x) { return x.id === b.getAttribute('data-search-custom'); });
        searchFrom({ lat: c.lat, lng: c.lng, label: c.name, addr: c.addr }, 'place');
      } else if ((b = e.target.closest('[data-del-place]'))) {
        var id = b.getAttribute('data-del-place');
        S.update(function (s) { s.places.custom = s.places.custom.filter(function (x) { return x.id !== id; }); });
        renderPlaces();
      }
    });
    $('btn-add-place').onclick = function () { openPlace('custom'); };
    $('place-q').addEventListener('input', function (e) { renderPlaceResults(e.target.value.trim()); });

    $('station-list').addEventListener('click', function (e) {
      var b = e.target.closest('[data-unfav]');
      if (!b) return;
      S.toggleFav(b.getAttribute('data-unfav'));
      renderStations();
      U.toast('즐겨찾기에서 뺐습니다.');
    });

    $('alert-list').addEventListener('change', function (e) {
      var id = e.target.getAttribute('data-toggle-alert');
      if (!id) return;
      S.update(function (s) { s.alerts.forEach(function (a) { if (a.id === id) a.on = e.target.checked; }); });
    });
    $('alert-list').addEventListener('click', function (e) {
      var b = e.target.closest('[data-del-alert]');
      if (!b) return;
      S.update(function (s) { s.alerts = s.alerts.filter(function (a) { return a.id !== b.getAttribute('data-del-alert'); }); });
      renderAlerts();
    });

    $('btn-push').onclick = function () {
      if (!('Notification' in window)) { U.toast('이 브라우저는 알림을 지원하지 않습니다.'); return; }
      Notification.requestPermission().then(function (p) {
        S.update(function (s) { s.settings.push = p === 'granted'; });
        U.toast(p === 'granted' ? '알림을 허용했습니다.' : '알림이 차단되었습니다. 브라우저 설정에서 바꿀 수 있어요.');
        renderAlerts();
      });
    };
  });
})();
