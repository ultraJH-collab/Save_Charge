/* =========================================================
   절약 리포트 (PRD F-10): 월별 절약액 · 지출 · 기록
   절약액 = 길안내 시점의 "주변 평균 실질 비용 − 선택 업장 실질 비용"
   ========================================================= */
(function () {
  var S = SC.store, U = SC.ui;
  var $ = function (id) { return document.getElementById(id); };
  var trips = S.get().trips;
  var sample = !trips.length;

  if (sample) {
    // 예시 데이터 (저장하지 않음)
    var names = ['한빛 주유소', '중앙 알뜰주유소', '푸른 공영주차장 충전소', '센트럴 주유소', '드림 주유소'];
    var seed = 7;
    var r = function () { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    trips = [];
    for (var i = 0; i < 34; i++) {
      var ev = r() < 0.2;
      trips.push({
        date: Date.now() - Math.floor(r() * 175) * 86400e3 - Math.floor(r() * 12) * 3600e3,
        name: names[Math.floor(r() * names.length)], kind: ev ? 'ev' : 'fuel',
        cost: ev ? Math.round(12000 + r() * 14000) : Math.round(40000 + r() * 40000),
        saving: Math.round(400 + r() * 3600)
      });
    }
    trips.sort(function (a, b) { return b.date - a.date; });
  }

  var now = new Date();
  var cur = new Date(now.getFullYear(), now.getMonth(), 1);

  function monthKey(d) { return d.getFullYear() * 12 + d.getMonth(); }
  function inMonth(t, m) { return monthKey(new Date(t.date)) === monthKey(m); }
  function sum(arr, k) { return arr.reduce(function (a, x) { return a + x[k]; }, 0); }

  function render() {
    $('sample-banner').hidden = !sample;
    $('m-label').textContent = cur.getFullYear() + '년 ' + (cur.getMonth() + 1) + '월';
    $('m-next').disabled = monthKey(cur) >= monthKey(now);

    var list = trips.filter(function (t) { return inMonth(t, cur); });
    var saving = sum(list, 'saving'), spend = sum(list, 'cost');
    var isThis = monthKey(cur) === monthKey(now);
    $('hero-label').textContent = (isThis ? '이번 달' : (cur.getMonth() + 1) + '월에') + ' 아낀 돈';
    $('hero-value').textContent = U.won(saving);
    $('hero-sub').textContent = list.length ? '주변 평균보다 ' + U.num(spend ? saving / (spend + saving) * 100 : 0, 1) + '% 적게 썼어요' : '기록이 없어요';
    $('s-count').textContent = list.length + '회';
    $('s-spend').textContent = U.won(spend);
    $('s-avg').textContent = list.length ? U.won(saving / list.length) : '-';
    $('s-total').textContent = U.won(sum(trips, 'saving'));
    $('trips-title').textContent = (isThis ? '이번 달' : (cur.getMonth() + 1) + '월') + ' 기록';

    $('trips').innerHTML = list.length ? list.map(function (t) {
      var d = new Date(t.date);
      return '<li class="trip"><span class="trip__date"><b>' + d.getDate() + '</b><span>' + ['일', '월', '화', '수', '목', '금', '토'][d.getDay()] + '요일</span></span>' +
        '<span class="list-item__body"><span class="list-item__title">' + U.esc(t.name) + '</span><br><span class="list-item__sub">' + (t.kind === 'ev' ? '충전' : '주유') + ' · ' + U.won(t.cost) + '</span></span>' +
        '<span class="saving num">+' + U.won(t.saving) + '</span></li>';
    }).join('') : '<li class="empty small">이 달에는 기록이 없어요.</li>';

    renderBars();
  }

  function renderBars() {
    var months = [];
    for (var i = 5; i >= 0; i--) months.push(new Date(cur.getFullYear(), cur.getMonth() - i, 1));
    var vals = months.map(function (m) { return sum(trips.filter(function (t) { return inMonth(t, m); }), 'saving'); });
    var max = Math.max.apply(null, vals.concat([1]));
    var W = 320, H = 150, pb = 22, pt = 18, bw = 30, gap = (W - bw * 6) / 6;
    $('bars').innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="최근 6개월 월별 절약액">' +
      months.map(function (m, i) {
        var h = vals[i] / max * (H - pb - pt), x = gap / 2 + i * (bw + gap), y = H - pb - h;
        var curCls = i === 5 ? ' is-current' : '';
        return '<rect class="bars__bar' + curCls + '" x="' + x + '" y="' + y + '" width="' + bw + '" height="' + Math.max(h, 1) + '" rx="5"/>' +
          (vals[i] ? '<text class="bars__value" x="' + (x + bw / 2) + '" y="' + (y - 5) + '" text-anchor="middle">' + U.num(vals[i] / 1000, 1) + '천</text>' : '') +
          '<text class="bars__label" x="' + (x + bw / 2) + '" y="' + (H - 6) + '" text-anchor="middle">' + (m.getMonth() + 1) + '월</text>';
      }).join('') + '</svg>';
  }

  document.addEventListener('DOMContentLoaded', function () {
    $('m-prev').onclick = function () { cur = new Date(cur.getFullYear(), cur.getMonth() - 1, 1); render(); };
    $('m-next').onclick = function () { if (monthKey(cur) < monthKey(now)) { cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1); render(); } };
    render();
  });
})();
