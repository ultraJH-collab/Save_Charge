/* =========================================================
   설정: 계정 · 추천 기준 · 카드 할인 · 길안내 앱 · 테마 · 푸시 · PWA · 초기화
   ========================================================= */
(function () {
  var S = SC.store, U = SC.ui, D = SC.data;
  var $ = function (id) { return document.getElementById(id); };
  var st = S.get();
  var installEvt = null;

  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); installEvt = e; });

  function applyTheme(t) {
    if (t === 'light' || t === 'dark') document.documentElement.setAttribute('data-theme', t);
    else document.documentElement.removeAttribute('data-theme');
  }

  function renderDiscounts() {
    var list = st.settings.discounts;
    $('disc-list').innerHTML = list.length ? list.map(function (d) {
      var b = D.BRANDS.find(function (x) { return x.id === d.brand; });
      return '<li class="list-item"><span class="list-item__body"><span class="list-item__title">' + U.esc(d.label || '할인') + '</span><br>' +
        '<span class="list-item__sub">' + (b ? b.name : '전체 주유소') + ' · 리터당 ' + U.num(d.perLiter) + '원</span></span>' +
        '<button type="button" class="icon-btn" data-del-disc="' + d.id + '" aria-label="할인 삭제">' + U.icon('trash') + '</button></li>';
    }).join('') : '<li class="list-item"><span class="small muted">등록된 할인이 없습니다. 할인을 등록하면 실구매가로 순위를 계산해요.</span></li>';
  }

  function segRadius() {
    document.querySelectorAll('#set-radius [data-v]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(+b.getAttribute('data-v') === st.search.radius));
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    $('set-vot').value = st.settings.vot;
    $('set-vot-v').textContent = U.num(st.settings.vot) + '원/시간';
    $('set-vot').oninput = function (e) {
      $('set-vot-v').textContent = U.num(+e.target.value) + '원/시간';
      S.update(function (s) { s.settings.vot = +e.target.value; });
    };
    segRadius();
    $('set-radius').onclick = function (e) {
      var b = e.target.closest('[data-v]');
      if (!b) return;
      S.update(function (s) { s.search.radius = +b.getAttribute('data-v'); });
      segRadius();
    };

    $('disc-brand').innerHTML = '<option value="ALL">전체 주유소</option>' + D.BRANDS.map(function (b) { return '<option value="' + b.id + '">' + b.name + '</option>'; }).join('');
    renderDiscounts();
    $('disc-form').onsubmit = function (e) {
      e.preventDefault();
      var amt = +$('disc-amount').value;
      if (!amt || amt <= 0) { U.toast('리터당 할인액을 입력해 주세요.'); return; }
      S.update(function (s) {
        s.settings.discounts.push({ id: S.uid(), brand: $('disc-brand').value, label: $('disc-label').value.trim() || '카드 할인', perLiter: amt });
      });
      $('disc-label').value = ''; $('disc-amount').value = '';
      renderDiscounts();
      U.toast('할인을 등록했습니다.');
    };
    $('disc-list').onclick = function (e) {
      var b = e.target.closest('[data-del-disc]');
      if (!b) return;
      S.update(function (s) { s.settings.discounts = s.settings.discounts.filter(function (d) { return d.id !== b.getAttribute('data-del-disc'); }); });
      renderDiscounts();
    };

    $('set-nav').value = st.settings.navApp;
    $('set-nav').onchange = function (e) { S.update(function (s) { s.settings.navApp = e.target.value; }); U.toast('저장했습니다.'); };
    $('set-theme').value = st.settings.theme;
    $('set-theme').onchange = function (e) {
      S.update(function (s) { s.settings.theme = e.target.value; });
      applyTheme(e.target.value);
    };

    var push = $('set-push');
    push.checked = st.settings.push && 'Notification' in window && Notification.permission === 'granted';
    if (!('Notification' in window)) { push.disabled = true; $('push-desc').textContent = '이 브라우저는 알림을 지원하지 않습니다'; }
    push.onchange = function () {
      if (!push.checked) { S.update(function (s) { s.settings.push = false; }); return; }
      Notification.requestPermission().then(function (p) {
        var ok = p === 'granted';
        push.checked = ok;
        S.update(function (s) { s.settings.push = ok; });
        U.toast(ok ? '푸시 알림을 켰습니다.' : '알림이 차단되어 있습니다. 브라우저 설정을 확인해 주세요.');
      });
    };

    $('btn-install').onclick = function () {
      if (installEvt) { installEvt.prompt(); installEvt = null; }
      else U.toast('브라우저 메뉴의 "홈 화면에 추가"를 이용해 주세요.');
    };

    document.querySelectorAll('[data-login]').forEach(function (b) {
      b.onclick = function () { U.toast(b.getAttribute('data-login') + ' 로그인은 서버 연동 후 제공됩니다.'); };
    });

    $('btn-reset').onclick = function () {
      if (!confirm('차량, 즐겨찾기, 알림, 절약 기록이 모두 삭제됩니다. 초기화할까요?')) return;
      S.reset();
      location.href = 'onboarding.html';
    };
  });
})();
