/* =========================================================
   공통 UI 유틸: 아이콘, 포맷, 토스트, 바텀시트, 탭바, 길안내, 위치
   ========================================================= */
window.SC = window.SC || {};

SC.ui = (function () {
  /* ---------- 아이콘 (24px stroke) ---------- */
  var P = {
    home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M10 21v-6h4v6"/>',
    star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z"/>',
    starFill: '<path fill="currentColor" d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z"/>',
    chart: '<path d="M4 20V10"/><path d="M10 20V4"/><path d="M16 20v-7"/><path d="M22 20H2"/>',
    car: '<path d="M5 17h14v-4.5l-1.8-5A2 2 0 0 0 15.3 6H8.7a2 2 0 0 0-1.9 1.5L5 12.5z"/><path d="M5 12.5h14"/><circle cx="8" cy="17" r="1.8"/><circle cx="16" cy="17" r="1.8"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    back: '<path d="M15 5l-7 7 7 7"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
    chevron: '<path d="m9 6 6 6-6 6"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    locate: '<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>',
    pin: '<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    work: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/>',
    filter: '<path d="M4 6h16M7 12h10M10 18h4"/>',
    nav: '<path d="M3 11 21 3l-8 18-2-8z"/>',
    fuel: '<path d="M4 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16"/><path d="M3 21h12"/><path d="M4 10h10"/><path d="M14 8h2a2 2 0 0 1 2 2v6a1.5 1.5 0 0 0 3 0V8l-3-3"/>',
    bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/>',
    flag: '<path d="M4 22V4"/><path d="M4 4h12l-2 4 2 4H4"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    alert: '<path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17h.01"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6"/><path d="M6 7l1 13h10l1-13"/><path d="M9 7V4h6v3"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    wallet: '<rect x="3" y="6" width="18" height="14" rx="2"/><path d="M3 10h18"/><path d="M16 15h2"/>',
    check: '<path d="m5 12 5 5L20 7"/>',
    phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>',
    wash: '<path d="M7 16a3 3 0 0 0 6 0c0-2-3-5-3-5s-3 3-3 5z"/><path d="M14 12a2.5 2.5 0 0 0 5 0c0-1.7-2.5-4-2.5-4S14 10.3 14 12z"/>',
    shop: '<path d="M4 9h16l-1 11H5z"/><path d="M8 9V7a4 4 0 0 1 8 0v2"/>',
    route: '<circle cx="6" cy="19" r="2"/><circle cx="18" cy="5" r="2"/><path d="M8 19h8a3 3 0 0 0 0-6H8a3 3 0 0 1 0-6h8"/>',
    layers: '<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>'
  };

  function icon(name, cls) {
    return '<svg class="icon ' + (cls || '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (P[name] || '') + '</svg>';
  }

  /* data-icon="name" 속성 요소에 아이콘 주입 */
  function hydrateIcons(root) {
    (root || document).querySelectorAll('[data-icon]').forEach(function (el) {
      if (el.querySelector(':scope > svg.icon')) return;
      el.insertAdjacentHTML('afterbegin', icon(el.getAttribute('data-icon')));
    });
  }

  /* ---------- 포맷 ---------- */
  function won(n) { return Math.round(n).toLocaleString('ko-KR') + '원'; }
  function num(n, d) { return (+n).toLocaleString('ko-KR', { maximumFractionDigits: d || 0, minimumFractionDigits: d || 0 }); }
  function km(n) { return n < 1 ? Math.round(n * 1000) + 'm' : num(n, 1) + 'km'; }
  function min(n) { return n < 60 ? Math.max(1, Math.round(n)) + '분' : Math.floor(n / 60) + '시간 ' + Math.round(n % 60) + '분'; }
  function ago(ts) {
    var h = (Date.now() - ts) / 3600e3;
    if (h < 1 / 60) return '방금';
    if (h < 1) return Math.round(h * 60) + '분 전';
    if (h < 24) return Math.round(h) + '시간 전';
    return Math.floor(h / 24) + '일 전';
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ---------- 토스트 ---------- */
  var toastEl, toastT;
  function toast(msg) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'toast';
      toastEl.setAttribute('role', 'status');
      toastEl.setAttribute('aria-live', 'polite');
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.classList.add('is-show');
    clearTimeout(toastT);
    toastT = setTimeout(function () { toastEl.classList.remove('is-show'); }, 2400);
  }

  /* ---------- 바텀시트 ---------- */
  var backdrop, openStack = [];
  function ensureBackdrop() {
    if (backdrop) return;
    backdrop = document.createElement('div');
    backdrop.className = 'sheet-backdrop';
    backdrop.addEventListener('click', function () { closeSheet(); });
    document.body.appendChild(backdrop);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeSheet(); });
  }
  function openSheet(id) {
    ensureBackdrop();
    var el = typeof id === 'string' ? document.getElementById(id) : id;
    if (!el) return;
    el.hidden = false;
    void el.offsetHeight; // display 전환 직후 강제 리플로우 → 슬라이드 트랜지션 적용
    el.classList.add('is-open');
    backdrop.classList.add('is-open');
    el.setAttribute('aria-hidden', 'false');
    openStack.push(el);
    var f = el.querySelector('[autofocus], input, button');
    if (f) setTimeout(function () { f.focus({ preventScroll: true }); }, 260);
  }
  function closeSheet(id) {
    var el = id ? (typeof id === 'string' ? document.getElementById(id) : id) : openStack[openStack.length - 1];
    if (!el) return;
    el.classList.remove('is-open');
    el.setAttribute('aria-hidden', 'true');
    openStack = openStack.filter(function (x) { return x !== el; });
    if (!openStack.length && backdrop) backdrop.classList.remove('is-open');
  }
  document.addEventListener('click', function (e) {
    var c = e.target.closest('[data-close-sheet]');
    if (c) closeSheet(c.closest('.sheet'));
  });

  /* ---------- 탭바 ---------- */
  var TABS = [
    { id: 'home', href: 'index.html', label: '홈', icon: 'home' },
    { id: 'favorites', href: 'favorites.html', label: '즐겨찾기', icon: 'star' },
    { id: 'report', href: 'report.html', label: '리포트', icon: 'chart' },
    { id: 'vehicle', href: 'vehicle.html', label: '내 차량', icon: 'car' },
    { id: 'settings', href: 'settings.html', label: '설정', icon: 'gear' }
  ];
  function renderTabbar() {
    var nav = document.querySelector('[data-tabbar]');
    if (!nav) return;
    var active = nav.getAttribute('data-tabbar');
    nav.className = 'tabbar';
    nav.setAttribute('aria-label', '주요 메뉴');
    nav.innerHTML = TABS.map(function (t) {
      return '<a href="' + t.href + '"' + (t.id === active ? ' aria-current="page"' : '') + '>' + icon(t.icon) + '<span>' + t.label + '</span></a>';
    }).join('');
  }

  /* ---------- 길안내 (PRD F-06) ---------- */
  var NAV_APPS = {
    tmap: {
      name: 'T map',
      app: function (s) { return 'tmap://route?goalname=' + encodeURIComponent(s.name) + '&goalx=' + s.lng + '&goaly=' + s.lat; },
      web: function (s) { return 'https://map.kakao.com/link/to/' + encodeURIComponent(s.name) + ',' + s.lat + ',' + s.lng; }
    },
    kakao: {
      name: '카카오맵',
      app: function (s) { return 'kakaomap://route?ep=' + s.lat + ',' + s.lng + '&by=CAR'; },
      web: function (s) { return 'https://map.kakao.com/link/to/' + encodeURIComponent(s.name) + ',' + s.lat + ',' + s.lng; }
    },
    naver: {
      name: '네이버지도',
      app: function (s) { return 'nmap://route/car?dlat=' + s.lat + '&dlng=' + s.lng + '&dname=' + encodeURIComponent(s.name) + '&appname=savecharge'; },
      web: function (s) { return 'https://map.naver.com/p/directions/-/' + s.lng + ',' + s.lat + ',' + encodeURIComponent(s.name) + ',,/-/car'; }
    }
  };
  var isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  function launchNav(appId, station) {
    var a = NAV_APPS[appId];
    if (!a) return;
    if (isMobile) {
      var t = Date.now();
      location.href = a.app(station);
      setTimeout(function () {
        if (Date.now() - t < 1600 && !document.hidden) window.open(a.web(station), '_blank');
      }, 1200);
    } else {
      toast('모바일에서는 ' + a.name + ' 앱이 실행됩니다. 웹 지도로 엽니다.');
      window.open(a.web(station), '_blank');
    }
  }

  /** 길안내 시작: 기본 앱이 없으면 선택 시트 표시. onStart 콜백으로 절약 기록 */
  function startNav(station, onStart) {
    var st = SC.store.get();
    if (st.settings.navApp) {
      if (onStart) onStart();
      launchNav(st.settings.navApp, station);
      return;
    }
    var sheet = document.getElementById('sc-nav-sheet');
    if (!sheet) {
      sheet = document.createElement('section');
      sheet.id = 'sc-nav-sheet';
      sheet.className = 'sheet';
      sheet.setAttribute('role', 'dialog');
      sheet.setAttribute('aria-modal', 'true');
      sheet.setAttribute('aria-labelledby', 'sc-nav-title');
      sheet.innerHTML =
        '<div class="sheet__handle"></div>' +
        '<div class="sheet__head"><h2 id="sc-nav-title">길안내 앱 선택</h2><button class="icon-btn" data-close-sheet aria-label="닫기">' + icon('close') + '</button></div>' +
        '<div class="sheet__body">' +
        '<ul class="card card--flush list">' +
        Object.keys(NAV_APPS).map(function (k) {
          return '<li><button class="list-item" data-nav-app="' + k + '">' + icon('nav') + '<span class="list-item__body list-item__title">' + NAV_APPS[k].name + '</span>' + icon('chevron') + '</button></li>';
        }).join('') +
        '</ul>' +
        '<label class="check"><input type="checkbox" id="sc-nav-remember" checked> 이 앱을 기본으로 사용</label>' +
        '<p class="xsmall muted">운전 중에는 조작하지 마세요. 정차 후 이용해 주세요.</p>' +
        '</div>';
      document.body.appendChild(sheet);
    }
    sheet.onclick = function (e) {
      var b = e.target.closest('[data-nav-app]');
      if (!b) return;
      var id = b.getAttribute('data-nav-app');
      if (document.getElementById('sc-nav-remember').checked) {
        SC.store.update(function (s) { s.settings.navApp = id; });
      }
      closeSheet(sheet);
      if (onStart) onStart();
      launchNav(id, station);
    };
    openSheet(sheet);
  }

  /* ---------- 위치 ---------- */
  function getCurrentPosition() {
    return new Promise(function (resolve, reject) {
      if (!navigator.geolocation) return reject(new Error('unsupported'));
      navigator.geolocation.getCurrentPosition(function (p) {
        resolve({ lat: p.coords.latitude, lng: p.coords.longitude, label: '현재 위치' });
      }, reject, { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 });
    });
  }

  /** 홈 외 화면에서 쓰는 기준 위치 (마지막 검색 기준) */
  function lastBase() {
    return SC.store.get().search.base || SC.config.DEFAULT_CENTER;
  }

  /* ---------- 절약 기록 (PRD F-10) ---------- */
  function recordTrip(r) {
    SC.store.update(function (s) {
      s.trips.unshift({
        date: Date.now(), stationId: r.station.id, name: r.station.name,
        kind: r.station.kind, cost: Math.round(r.pay), saving: Math.max(0, Math.round(r.saving || 0))
      });
      s.trips = s.trips.slice(0, 300);
    });
  }

  function fuelLabel(f) { return (SC.data.FUELS[f] || {}).label || f; }

  document.addEventListener('DOMContentLoaded', function () {
    renderTabbar();
    hydrateIcons();
  });

  /* PWA: http(s) 로 열었을 때만 서비스 워커 등록 */
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () { /* 등록 실패 무시 */ });
    });
  }

  return {
    icon: icon, hydrateIcons: hydrateIcons,
    won: won, num: num, km: km, min: min, ago: ago, esc: esc,
    toast: toast, openSheet: openSheet, closeSheet: closeSheet,
    startNav: startNav, NAV_APPS: NAV_APPS,
    getCurrentPosition: getCurrentPosition, lastBase: lastBase,
    recordTrip: recordTrip, fuelLabel: fuelLabel
  };
})();
