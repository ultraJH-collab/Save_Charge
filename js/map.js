/* =========================================================
   지도 어댑터
   - T map JS SDK v2 (window.Tmapv2) 가 로드되면 실제 지도
   - 아니면 목업 지도 (드래그 이동, 확대/축소, 핀 지정 지원)
   공통 API: setView(center, radiusKm) / setMarkers(items) / select(id) / setPickMode(bool)
   items: [{ id, lat, lng, label, rank, top, off }]
   ========================================================= */
window.SC = window.SC || {};

SC.map = (function () {
  var KM_LAT = 110.57;
  function kmLng(lat) { return 111.32 * Math.cos(lat * Math.PI / 180); }

  /* ---------------- 목업 지도 ---------------- */
  function MockMap(el, opts) {
    this.el = el;
    this.opts = opts;
    this.view = { lat: opts.center.lat, lng: opts.center.lng };
    this.center = opts.center;
    this.radius = opts.radiusKm || 3;
    this.items = [];
    this.selected = null;
    this.pick = false;

    el.innerHTML = '<div class="mock-map" role="application" aria-label="지도">' +
      '<div class="mock-map__layer"></div><span class="mock-map__badge">목업 지도 · T map 키 입력 시 실제 지도</span></div>';
    this.root = el.querySelector('.mock-map');
    this.layer = el.querySelector('.mock-map__layer');
    this.fit();
    this.bind();
  }

  MockMap.prototype.fit = function () {
    var w = this.el.clientWidth || 360, h = this.el.clientHeight || 300;
    this.scale = Math.min(w, h) / 2 / (this.radius * 1.12); // px per km
  };

  MockMap.prototype.project = function (p) {
    var w = this.el.clientWidth, h = this.el.clientHeight;
    return {
      x: w / 2 + (p.lng - this.view.lng) * kmLng(this.view.lat) * this.scale,
      y: h / 2 - (p.lat - this.view.lat) * KM_LAT * this.scale
    };
  };

  MockMap.prototype.unproject = function (x, y) {
    var w = this.el.clientWidth, h = this.el.clientHeight;
    return {
      lat: this.view.lat - (y - h / 2) / this.scale / KM_LAT,
      lng: this.view.lng + (x - w / 2) / this.scale / kmLng(this.view.lat)
    };
  };

  MockMap.prototype.drawBg = function () {
    var minor = 0.6 * this.scale, major = 2.4 * this.scale;
    var ox = this.el.clientWidth / 2 - this.view.lng * kmLng(this.view.lat) * this.scale;
    var oy = this.el.clientHeight / 2 + this.view.lat * KM_LAT * this.scale;
    var mw = Math.max(2, this.scale * 0.025), Mw = Math.max(5, this.scale * 0.06);
    this.root.style.backgroundColor = 'var(--map-block)';
    this.root.style.backgroundImage = [
      'linear-gradient(var(--map-road-2) ' + Mw + 'px, transparent ' + Mw + 'px)',
      'linear-gradient(90deg, var(--map-road-2) ' + Mw + 'px, transparent ' + Mw + 'px)',
      'linear-gradient(var(--map-road) ' + mw + 'px, transparent ' + mw + 'px)',
      'linear-gradient(90deg, var(--map-road) ' + mw + 'px, transparent ' + mw + 'px)'
    ].join(',');
    this.root.style.backgroundSize = [major + 'px ' + major + 'px', major + 'px ' + major + 'px', minor + 'px ' + minor + 'px', minor + 'px ' + minor + 'px'].join(',');
    var px = (ox % major) + 'px ' + (oy % major) + 'px', pm = (ox % minor) + 'px ' + (oy % minor) + 'px';
    this.root.style.backgroundPosition = [px, px, pm, pm].join(',');
  };

  MockMap.prototype.render = function () {
    var self = this;
    this.drawBg();
    var c = this.project(this.center);
    var html = '<div class="map-radius" style="left:' + c.x + 'px;top:' + c.y + 'px;width:' + (this.radius * 2 * this.scale) + 'px;height:' + (this.radius * 2 * this.scale) + 'px"></div>';
    html += '<div class="map-base' + (this.center.pin ? ' map-base--pin' : '') + '" style="left:' + c.x + 'px;top:' + c.y + 'px" title="기준 위치"></div>';
    this.items.slice().reverse().forEach(function (it) {
      var p = self.project(it);
      var cls = 'map-marker' + (it.top ? ' map-marker--top' : '') + (it.off ? ' map-marker--off' : '') + (self.selected === it.id ? ' is-selected' : '');
      html += '<button type="button" class="' + cls + '" data-id="' + it.id + '" style="left:' + p.x + 'px;top:' + p.y + 'px" aria-label="' + SC.ui.esc(it.title || it.label) + '">' +
        (it.rank ? '<span class="map-marker__rank">' + it.rank + '</span>' : '') + SC.ui.esc(it.label) +
        (it.sub ? '<span class="map-marker__save ' + (it.gap < 1 ? 'is-gain' : 'is-loss') + '">' + SC.ui.esc(it.sub) + '</span>' : '') + '</button>';
    });
    this.layer.innerHTML = html;
  };

  MockMap.prototype.bind = function () {
    var self = this, drag = null, moved = false;
    this.root.addEventListener('pointerdown', function (e) {
      if (e.target.closest('.map-marker')) return;
      drag = { x: e.clientX, y: e.clientY, lat: self.view.lat, lng: self.view.lng };
      moved = false;
      self.root.setPointerCapture(e.pointerId);
    });
    this.root.addEventListener('pointermove', function (e) {
      if (!drag) return;
      var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (Math.abs(dx) + Math.abs(dy) > 4) moved = true;
      self.view.lng = drag.lng - dx / self.scale / kmLng(drag.lat);
      self.view.lat = drag.lat + dy / self.scale / KM_LAT;
      self.render();
    });
    this.root.addEventListener('pointerup', function (e) {
      if (drag && !moved && self.pick) {
        var r = self.root.getBoundingClientRect();
        var ll = self.unproject(e.clientX - r.left, e.clientY - r.top);
        self.opts.onPick && self.opts.onPick(ll);
      }
      drag = null;
    });
    this.root.addEventListener('click', function (e) {
      var m = e.target.closest('.map-marker');
      if (m && self.opts.onSelect) self.opts.onSelect(m.getAttribute('data-id'));
    });
    this.root.addEventListener('wheel', function (e) {
      e.preventDefault();
      self.zoom(e.deltaY < 0 ? 1.2 : 1 / 1.2);
    }, { passive: false });
    // 컨테이너 크기가 바뀌면(첫 레이아웃, 화면 회전 등) 사용자가 확대/축소하기 전까지는 반경에 맞춰 다시 맞춤
    var refit = function () { if (!self.userZoomed) self.fit(); self.render(); };
    if ('ResizeObserver' in window) new ResizeObserver(refit).observe(this.el);
    else window.addEventListener('resize', refit);
  };

  MockMap.prototype.zoom = function (f) {
    this.userZoomed = true;
    this.scale = Math.max(8, Math.min(800, this.scale * f));
    this.render();
  };
  MockMap.prototype.setView = function (center, radiusKm) {
    this.center = center;
    this.view = { lat: center.lat, lng: center.lng };
    if (radiusKm) this.radius = radiusKm;
    this.userZoomed = false;
    this.fit();
    this.render();
  };
  MockMap.prototype.recenter = function () { this.setView(this.center, this.radius); };
  MockMap.prototype.setMarkers = function (items) { this.items = items; this.render(); };
  MockMap.prototype.select = function (id, pan) {
    this.selected = id;
    var it = this.items.find(function (x) { return x.id === id; });
    if (it && pan) { this.view = { lat: it.lat, lng: it.lng }; }
    this.render();
  };
  MockMap.prototype.setPickMode = function (on) {
    this.pick = on;
    this.root.style.cursor = on ? 'crosshair' : '';
  };

  /* ---------------- T map 지도 ---------------- */
  function TmapMap(el, opts) {
    var T = window.Tmapv2;
    this.T = T;
    this.opts = opts;
    this.center = opts.center;
    this.radius = opts.radiusKm || 3;
    this.markers = [];
    this.items = [];
    this.selected = null;
    this.pick = false;
    el.innerHTML = '<div id="tmap-canvas" class="map__canvas"></div>';
    this.map = new T.Map('tmap-canvas', {
      center: new T.LatLng(opts.center.lat, opts.center.lng),
      width: '100%', height: '100%', zoom: 14, zoomControl: false, scrollwheel: true
    });
    var self = this;
    this.map.addListener('click', function (e) {
      if (self.pick && self.opts.onPick) self.opts.onPick({ lat: e.latLng.lat(), lng: e.latLng.lng() });
    });
    this.setView(opts.center, this.radius);
  }

  function markerSvg(it, selected) {
    var text = (it.rank ? it.rank + ' · ' : '') + it.label;
    var sub = it.sub || '';
    var tw = text.length * 7.6, sw = sub.length * 6.6;
    var w = 20 + tw + (sub ? 6 + sw : 0);
    var bg = it.top ? '#12a150' : '#ffffff', fg = it.top ? '#ffffff' : '#121a16', bd = selected ? '#2563eb' : (it.top ? '#12a150' : '#c9d2cd');
    var sc = it.top ? '#ffffff' : (it.gap < 1 ? '#0b7a3b' : '#d93a3a');
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="34">' +
      '<rect x="1" y="1" width="' + (w - 2) + '" height="24" rx="12" fill="' + bg + '" stroke="' + bd + '" stroke-width="' + (selected ? 3 : 1.5) + '"/>' +
      '<path d="M' + (w / 2 - 5) + ' 25 L' + (w / 2) + ' 32 L' + (w / 2 + 5) + ' 25z" fill="' + bg + '"/>' +
      '<text x="10" y="17.5" font-family="Malgun Gothic, sans-serif" font-size="12" font-weight="700" fill="' + fg + '">' + SC.ui.esc(text) +
      (sub ? '<tspan dx="6" font-size="11" fill="' + sc + '">' + SC.ui.esc(sub) + '</tspan>' : '') + '</text></svg>';
    return { url: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg), w: w };
  }

  TmapMap.prototype.zoomForRadius = function (r) {
    return r <= 1 ? 15 : r <= 3 ? 14 : r <= 5 ? 13 : 12;
  };
  TmapMap.prototype.setView = function (center, radiusKm) {
    var T = this.T;
    this.center = center;
    if (radiusKm) this.radius = radiusKm;
    this.map.setCenter(new T.LatLng(center.lat, center.lng));
    this.map.setZoom(this.zoomForRadius(this.radius));
    if (this.circle) this.circle.setMap(null);
    if (this.base) this.base.setMap(null);
    this.circle = new T.Circle({
      center: new T.LatLng(center.lat, center.lng), radius: this.radius * 1000,
      strokeWeight: 1.5, strokeColor: '#12a150', fillColor: '#12a150', fillOpacity: 0.06, map: this.map
    });
    this.base = new T.Marker({ position: new T.LatLng(center.lat, center.lng), map: this.map, title: '기준 위치' });
  };
  TmapMap.prototype.recenter = function () { this.setView(this.center, this.radius); };
  TmapMap.prototype.zoom = function (f) { this.map.setZoom(this.map.getZoom() + (f > 1 ? 1 : -1)); };
  TmapMap.prototype.setMarkers = function (items) {
    var T = this.T, self = this;
    this.items = items;
    this.markers.forEach(function (m) { m.setMap(null); });
    this.markers = items.map(function (it) {
      var ic = markerSvg(it, self.selected === it.id);
      var m = new T.Marker({
        position: new T.LatLng(it.lat, it.lng), icon: ic.url, iconSize: new T.Size(ic.w, 34),
        map: self.map, title: it.title || it.label
      });
      m.addListener('click', function () { self.opts.onSelect && self.opts.onSelect(it.id); });
      return m;
    });
  };
  TmapMap.prototype.select = function (id, pan) {
    this.selected = id;
    this.setMarkers(this.items);
    var it = this.items.find(function (x) { return x.id === id; });
    if (it && pan) this.map.panTo(new this.T.LatLng(it.lat, it.lng));
  };
  TmapMap.prototype.setPickMode = function (on) { this.pick = on; };

  function create(el, opts) {
    if (window.Tmapv2 && SC.config.TMAP_APP_KEY) {
      try { return new TmapMap(el, opts); } catch (e) { console.warn('T map 초기화 실패, 목업 지도로 대체', e); }
    }
    return new MockMap(el, opts);
  }

  return { create: create };
})();
