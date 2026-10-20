/* =========================================================
   내 차량 (PRD F-04): 목록 · 선택 · 추가 · 편집 · 삭제
   ========================================================= */
(function () {
  var S = SC.store, U = SC.ui, D = SC.data;
  var $ = function (id) { return document.getElementById(id); };
  var st = S.get();
  var editing = null; // 편집 중 차량 draft

  function unitEff(f) { return f === 'ev' ? 'km/kWh' : 'km/L'; }
  function unitCap(f) { return f === 'ev' ? 'kWh' : 'L'; }

  function renderList() {
    $('vehicle-list').innerHTML = st.vehicles.map(function (v) {
      var on = v.id === st.activeVehicleId;
      return '<li class="card vehicle-card' + (on ? ' is-active' : '') + '">' +
        '<span class="vehicle-card__icon">' + U.icon(v.fuel === 'ev' ? 'bolt' : 'car') + '</span>' +
        '<div class="vehicle-card__body">' +
          '<p class="vehicle-card__name">' + U.esc(v.name) + (on ? ' <span class="badge badge--brand">사용 중</span>' : '') + '</p>' +
          '<p class="small muted">' + U.esc((v.model ? v.model + ' · ' : '') + U.fuelLabel(v.fuel)) + '</p>' +
          '<p class="small text-2 num">' + v.efficiency + unitEff(v.fuel) + ' · ' + v.capacity + unitCap(v.fuel) +
            (v.fuel === 'ev' ? ' · ' + v.connector + ' · 최대 ' + v.maxKw + 'kW' : '') + '</p>' +
        '</div>' +
        '<div class="stack" style="gap:6px">' +
          (on ? '' : '<button type="button" class="btn btn--sm btn--primary" data-use="' + v.id + '">사용</button>') +
          '<button type="button" class="btn btn--sm" data-edit="' + v.id + '">편집</button>' +
        '</div></li>';
    }).join('');
  }

  function openEdit(v) {
    editing = v ? Object.assign({}, v) : { id: null, name: '', model: '', fuel: 'gasoline', efficiency: 12, capacity: 55, connector: 'DC콤보', maxKw: 200 };
    $('edit-title').textContent = v ? '차량 편집' : '차량 추가';
    $('btn-delete').hidden = !v || st.vehicles.length < 2;
    $('f-model').value = editing.model;
    $('f-name').value = editing.name;
    syncForm();
    U.openSheet('sheet-edit');
  }

  function syncForm() {
    var f = editing.fuel, ev = f === 'ev';
    document.querySelectorAll('#f-fuel [data-v]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-v') === f)); });
    $('f-eff-label').textContent = ev ? '전비' : '연비';
    $('f-eff-unit').textContent = unitEff(f);
    $('f-cap-label').textContent = ev ? '배터리 용량' : '연료탱크';
    $('f-cap-unit').textContent = unitCap(f);
    $('f-eff').value = editing.efficiency;
    $('f-cap').value = editing.capacity;
    $('f-conn').value = editing.connector || 'DC콤보';
    $('f-kw').value = editing.maxKw || 200;
    document.querySelectorAll('[data-ev-only]').forEach(function (el) { el.hidden = !ev; });
  }

  function readForm() {
    editing.model = $('f-model').value.trim();
    editing.name = $('f-name').value.trim();
    editing.efficiency = +$('f-eff').value;
    editing.capacity = +$('f-cap').value;
    editing.connector = $('f-conn').value;
    editing.maxKw = +$('f-kw').value;
  }

  function renderSuggest(q) {
    var list = D.VEHICLE_SPECS.filter(function (v) { return !q || v.model.indexOf(q) > -1; });
    var ul = $('f-model-list');
    ul.hidden = !list.length;
    $('f-model').setAttribute('aria-expanded', String(!!list.length));
    ul.innerHTML = list.map(function (v, i) {
      return '<li role="option"><button type="button" class="list-item" data-i="' + i + '"><span class="list-item__body"><span class="list-item__title">' + v.model +
        '</span><br><span class="list-item__sub">' + U.fuelLabel(v.fuel) + ' · ' + v.efficiency + unitEff(v.fuel) + ' · ' + v.capacity + unitCap(v.fuel) + '</span></span></button></li>';
    }).join('');
    ul.onclick = function (e) {
      var b = e.target.closest('[data-i]');
      if (!b) return;
      var v = list[+b.getAttribute('data-i')];
      readForm();
      Object.assign(editing, { model: v.model, fuel: v.fuel, efficiency: v.efficiency, capacity: v.capacity });
      if (v.connector) { editing.connector = v.connector; editing.maxKw = v.maxKw; }
      if (!editing.name) editing.name = v.model.split(' ').slice(-2).join(' ');
      $('f-model').value = v.model;
      $('f-name').value = editing.name;
      ul.hidden = true;
      syncForm();
    };
  }

  document.addEventListener('DOMContentLoaded', function () {
    $('f-conn').innerHTML = D.CONNECTORS.map(function (c) { return '<option>' + c + '</option>'; }).join('');
    renderList();

    $('btn-add').onclick = $('btn-add-2').onclick = function () { openEdit(null); };
    $('vehicle-list').addEventListener('click', function (e) {
      var use = e.target.closest('[data-use]'), ed = e.target.closest('[data-edit]');
      if (use) {
        S.update(function (s) { s.activeVehicleId = use.getAttribute('data-use'); });
        renderList();
        U.toast('추천 기준 차량을 바꿨습니다.');
      } else if (ed) {
        openEdit(st.vehicles.find(function (v) { return v.id === ed.getAttribute('data-edit'); }));
      }
    });

    $('f-fuel').addEventListener('click', function (e) {
      var b = e.target.closest('[data-v]');
      if (!b) return;
      readForm();
      var f = b.getAttribute('data-v');
      if ((f === 'ev') !== (editing.fuel === 'ev')) {
        editing.efficiency = f === 'ev' ? 5.0 : 12;
        editing.capacity = f === 'ev' ? 70 : 55;
      }
      editing.fuel = f;
      syncForm();
    });
    $('f-model').addEventListener('input', function (e) { renderSuggest(e.target.value.trim()); });
    $('f-model').addEventListener('focus', function (e) { renderSuggest(e.target.value.trim()); });
    document.addEventListener('click', function (e) { if (!e.target.closest('.suggest')) $('f-model-list').hidden = true; });

    $('edit-form').onsubmit = function (e) {
      e.preventDefault();
      readForm();
      if (!editing.name) { U.toast('차량 별칭을 입력해 주세요.'); $('f-name').focus(); return; }
      if (!(editing.efficiency > 0) || !(editing.capacity > 0)) { U.toast('연비와 용량을 확인해 주세요.'); return; }
      if (editing.fuel !== 'ev') { editing.connector = ''; editing.maxKw = 0; }
      S.update(function (s) {
        if (editing.id) {
          var i = s.vehicles.findIndex(function (v) { return v.id === editing.id; });
          s.vehicles[i] = editing;
        } else {
          editing.id = 'v' + S.uid();
          s.vehicles.push(editing);
        }
      });
      U.closeSheet('sheet-edit');
      renderList();
      U.toast('저장했습니다.');
    };
    $('btn-delete').onclick = function () {
      if (!confirm('"' + editing.name + '" 차량을 삭제할까요?')) return;
      S.update(function (s) {
        s.vehicles = s.vehicles.filter(function (v) { return v.id !== editing.id; });
        if (s.activeVehicleId === editing.id) s.activeVehicleId = s.vehicles[0].id;
      });
      st = S.get();
      U.closeSheet('sheet-edit');
      renderList();
      U.toast('삭제했습니다.');
    };
  });
})();
