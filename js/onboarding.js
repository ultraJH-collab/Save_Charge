/* =========================================================
   온보딩: 유종 → 차종/연비 → 위치 권한 (건너뛰면 휘발유·12km/L 기본값)
   ========================================================= */
(function () {
  var S = SC.store, U = SC.ui, D = SC.data;
  var $ = function (id) { return document.getElementById(id); };
  var step = 1;
  var draft = { fuel: 'gasoline', model: '', efficiency: 12, capacity: 55, connector: 'DC콤보', maxKw: 200 };

  function show() {
    document.querySelectorAll('[data-step]').forEach(function (s) { s.hidden = +s.getAttribute('data-step') !== step; });
    document.querySelectorAll('.onb__dots span').forEach(function (d, i) { d.classList.toggle('is-on', i === step - 1); });
    $('onb-progress').textContent = step + '/3 단계';
    $('btn-prev').hidden = step === 1;
    $('btn-next').textContent = step === 3 ? '위치 허용하고 시작' : '다음';
    if (step === 2) syncStep2();
  }

  function syncStep2() {
    var ev = draft.fuel === 'ev';
    $('onb-eff-label').textContent = ev ? '전비' : '연비';
    $('onb-eff-unit').textContent = ev ? 'km/kWh' : 'km/L';
    $('onb-cap-label').textContent = ev ? '배터리 용량' : '연료탱크';
    $('onb-cap-unit').textContent = ev ? 'kWh' : 'L';
    document.querySelectorAll('[data-ev-only]').forEach(function (el) { el.hidden = !ev; });
    $('onb-eff').value = draft.efficiency;
    $('onb-cap').value = draft.capacity;
    $('onb-kw').value = draft.maxKw;
    $('onb-model').value = draft.model;
  }

  function renderSuggest(q) {
    var list = D.VEHICLE_SPECS.filter(function (v) {
      return (draft.fuel === 'ev') === (v.fuel === 'ev') && (!q || v.model.indexOf(q) > -1);
    });
    var ul = $('onb-model-list');
    ul.hidden = !list.length;
    $('onb-model').setAttribute('aria-expanded', String(!!list.length));
    ul.innerHTML = list.map(function (v, i) {
      return '<li role="option"><button type="button" class="list-item" data-i="' + i + '"><span class="list-item__body"><span class="list-item__title">' + v.model +
        '</span><br><span class="list-item__sub">' + U.fuelLabel(v.fuel) + ' · ' + v.efficiency + (v.fuel === 'ev' ? 'km/kWh · ' : 'km/L · ') + v.capacity + (v.fuel === 'ev' ? 'kWh' : 'L') + '</span></span></button></li>';
    }).join('');
    ul.onclick = function (e) {
      var b = e.target.closest('[data-i]');
      if (!b) return;
      var v = list[+b.getAttribute('data-i')];
      draft.model = v.model;
      draft.efficiency = v.efficiency;
      draft.capacity = v.capacity;
      if (v.fuel !== 'ev') draft.fuel = v.fuel;
      if (v.connector) { draft.connector = v.connector; draft.maxKw = v.maxKw; $('onb-conn').value = v.connector; }
      ul.hidden = true;
      syncStep2();
    };
  }

  function readStep2() {
    draft.model = $('onb-model').value.trim();
    draft.efficiency = +$('onb-eff').value || draft.efficiency;
    draft.capacity = +$('onb-cap').value || draft.capacity;
    draft.connector = $('onb-conn').value;
    draft.maxKw = +$('onb-kw').value || draft.maxKw;
  }

  function finish(withLocation) {
    S.update(function (s) {
      s.vehicles = [{
        id: 'v1', name: draft.model ? draft.model.split(' ').slice(-2).join(' ') : '내 차', model: draft.model,
        fuel: draft.fuel, efficiency: draft.efficiency, capacity: draft.capacity,
        connector: draft.fuel === 'ev' ? draft.connector : '', maxKw: draft.fuel === 'ev' ? draft.maxKw : 0
      }];
      s.activeVehicleId = 'v1';
      s.onboarded = true;
      s.search.baseType = 'current';
    });
    if (!withLocation) { location.href = 'index.html'; return; }
    $('loc-result').textContent = '위치 권한을 확인하고 있어요…';
    U.getCurrentPosition().then(function () {
      location.href = 'index.html';
    }).catch(function () {
      $('loc-result').textContent = '위치 권한이 없어 기본 위치로 시작합니다.';
      setTimeout(function () { location.href = 'index.html'; }, 900);
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    $('onb-conn').innerHTML = D.CONNECTORS.map(function (c) { return '<option>' + c + '</option>'; }).join('');

    $('fuel-options').addEventListener('click', function (e) {
      var b = e.target.closest('[data-fuel]');
      if (!b) return;
      var f = b.getAttribute('data-fuel');
      if ((f === 'ev') !== (draft.fuel === 'ev')) {
        draft.model = '';
        draft.efficiency = f === 'ev' ? 5.0 : 12;
        draft.capacity = f === 'ev' ? 70 : 55;
      }
      draft.fuel = f;
      document.querySelectorAll('[data-fuel]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
    });

    $('onb-model').addEventListener('input', function (e) { renderSuggest(e.target.value.trim()); });
    $('onb-model').addEventListener('focus', function (e) { renderSuggest(e.target.value.trim()); });
    document.addEventListener('click', function (e) {
      if (!e.target.closest('.suggest')) $('onb-model-list').hidden = true;
    });

    $('btn-next').onclick = function () {
      if (step === 2) {
        readStep2();
        if (draft.efficiency <= 0 || draft.capacity <= 0) { U.toast('연비와 용량을 확인해 주세요.'); return; }
      }
      if (step < 3) { step++; show(); }
      else finish(true);
    };
    $('btn-prev').onclick = function () { if (step === 2) readStep2(); step--; show(); };
    $('btn-skip').onclick = function () { finish(false); };
    show();
  });
})();
