/* Action-timing clock for the X Algorithm Handbook.
 * Computes recommended posting windows for a chosen posting language by
 * overlaying typical audience activity across that language's timezones,
 * then renders a 24h dial in the viewer's (selectable) timezone.
 * Defaults: browser timezone + system language. No external deps.
 */
(function () {
  'use strict';

  var PAGE_LANG = (document.documentElement.lang || 'en').toLowerCase().indexOf('zh') === 0 ? 'zh' : 'en';

  /* ---------- i18n ---------- */
  var T = {
    zh: {
      yourTz: '你的时区', postLang: '发帖语言', now: '现在',
      best: '最佳', good: '良好', mid: '一般', low: '冷门',
      bestWindows: '最佳窗口', goodWindows: '次选窗口',
      audience: '该语言的受众时区构成(可按自己后台数据理解为权重)',
      hover: '把鼠标移到色块上查看该小时的活跃受众',
      activeAt: '活跃受众', localTime: '当地',
      langNames: { en: '英语', zh: '中文', ja: '日语', es: '西班牙语', pt: '葡萄牙语', ar: '阿拉伯语', hi: '印地语', fr: '法语', de: '德语', ko: '韩语' },
      zoneNames: {
        'America/New_York': '美国东部', 'America/Chicago': '美国中部', 'America/Denver': '美国山区',
        'America/Los_Angeles': '美国西部', 'America/Toronto': '加拿大(东)', 'America/Mexico_City': '墨西哥',
        'America/Bogota': '哥伦比亚/秘鲁', 'America/Argentina/Buenos_Aires': '阿根廷', 'America/Sao_Paulo': '巴西',
        'Europe/London': '英国', 'Europe/Paris': '法国', 'Europe/Berlin': '德国/中欧', 'Europe/Madrid': '西班牙',
        'Europe/Lisbon': '葡萄牙', 'Europe/Istanbul': '土耳其', 'Europe/Moscow': '俄罗斯(莫斯科)',
        'Africa/Casablanca': '摩洛哥/西非', 'Africa/Cairo': '埃及', 'Asia/Riyadh': '沙特', 'Asia/Dubai': '阿联酋',
        'Asia/Kolkata': '印度', 'Asia/Bangkok': '泰国/越南', 'Asia/Singapore': '新加坡/马来',
        'Asia/Shanghai': '中国大陆/港台', 'Asia/Taipei': '台湾', 'Asia/Tokyo': '日本', 'Asia/Seoul': '韩国',
        'Australia/Sydney': '澳大利亚(东)', 'Pacific/Auckland': '新西兰', 'Pacific/Honolulu': '夏威夷', 'UTC': 'UTC'
      }
    },
    en: {
      yourTz: 'Your timezone', postLang: 'Posting language', now: 'Now',
      best: 'Best', good: 'Good', mid: 'OK', low: 'Quiet',
      bestWindows: 'Best windows', goodWindows: 'Second-best',
      audience: 'Audience timezone mix for this language (treat weights as estimates; calibrate with your own analytics)',
      hover: 'Hover a segment to see who is awake in that hour',
      activeAt: 'Active audiences', localTime: 'local',
      langNames: { en: 'English', zh: 'Chinese', ja: 'Japanese', es: 'Spanish', pt: 'Portuguese', ar: 'Arabic', hi: 'Hindi', fr: 'French', de: 'German', ko: 'Korean' },
      zoneNames: {
        'America/New_York': 'US East', 'America/Chicago': 'US Central', 'America/Denver': 'US Mountain',
        'America/Los_Angeles': 'US West', 'America/Toronto': 'Canada (E)', 'America/Mexico_City': 'Mexico',
        'America/Bogota': 'Colombia/Peru', 'America/Argentina/Buenos_Aires': 'Argentina', 'America/Sao_Paulo': 'Brazil',
        'Europe/London': 'UK', 'Europe/Paris': 'France', 'Europe/Berlin': 'Germany/CET', 'Europe/Madrid': 'Spain',
        'Europe/Lisbon': 'Portugal', 'Europe/Istanbul': 'Türkiye', 'Europe/Moscow': 'Russia (Moscow)',
        'Africa/Casablanca': 'Morocco/W. Africa', 'Africa/Cairo': 'Egypt', 'Asia/Riyadh': 'Saudi Arabia', 'Asia/Dubai': 'UAE',
        'Asia/Kolkata': 'India', 'Asia/Bangkok': 'Thailand/Vietnam', 'Asia/Singapore': 'Singapore/Malaysia',
        'Asia/Shanghai': 'China/HK/TW', 'Asia/Taipei': 'Taiwan', 'Asia/Tokyo': 'Japan', 'Asia/Seoul': 'South Korea',
        'Australia/Sydney': 'Australia (E)', 'Pacific/Auckland': 'New Zealand', 'Pacific/Honolulu': 'Hawaii', 'UTC': 'UTC'
      }
    }
  }[PAGE_LANG];

  /* ---------- data ---------- */
  // Typical hour-by-hour social activity in a user's LOCAL time (0..23).
  // Generic engagement curve: morning ramp, lunch bump, evening prime time.
  var ACTIVITY = [0.15, 0.08, 0.05, 0.04, 0.05, 0.10, 0.25, 0.50, 0.70, 0.75, 0.70, 0.70,
                  0.85, 0.80, 0.65, 0.60, 0.60, 0.65, 0.80, 0.95, 1.00, 1.00, 0.85, 0.45];

  // Audience timezone mix per posting language (top-10 languages).
  // Weights are rough estimates of where each language's X audience lives.
  var LANG_AUDIENCE = {
    en: [
      { tz: 'America/New_York', w: 0.26 }, { tz: 'America/Chicago', w: 0.10 },
      { tz: 'America/Los_Angeles', w: 0.16 }, { tz: 'Europe/London', w: 0.16 },
      { tz: 'Europe/Berlin', w: 0.08 }, { tz: 'Asia/Kolkata', w: 0.14 },
      { tz: 'Australia/Sydney', w: 0.10 }
    ],
    zh: [
      { tz: 'Asia/Shanghai', w: 0.78 }, { tz: 'America/Los_Angeles', w: 0.08 },
      { tz: 'America/New_York', w: 0.08 }, { tz: 'Europe/Berlin', w: 0.06 }
    ],
    ja: [{ tz: 'Asia/Tokyo', w: 0.95 }, { tz: 'America/Los_Angeles', w: 0.05 }],
    es: [
      { tz: 'Europe/Madrid', w: 0.22 }, { tz: 'America/Mexico_City', w: 0.28 },
      { tz: 'America/Bogota', w: 0.18 }, { tz: 'America/Argentina/Buenos_Aires', w: 0.14 },
      { tz: 'America/Chicago', w: 0.18 }
    ],
    pt: [{ tz: 'America/Sao_Paulo', w: 0.85 }, { tz: 'Europe/Lisbon', w: 0.15 }],
    ar: [
      { tz: 'Asia/Riyadh', w: 0.35 }, { tz: 'Africa/Cairo', w: 0.30 },
      { tz: 'Asia/Dubai', w: 0.15 }, { tz: 'Africa/Casablanca', w: 0.20 }
    ],
    hi: [{ tz: 'Asia/Kolkata', w: 1.0 }],
    fr: [
      { tz: 'Europe/Paris', w: 0.68 }, { tz: 'America/Toronto', w: 0.12 },
      { tz: 'Africa/Casablanca', w: 0.20 }
    ],
    de: [{ tz: 'Europe/Berlin', w: 1.0 }],
    ko: [{ tz: 'Asia/Seoul', w: 1.0 }]
  };

  var TZ_CHOICES = [
    'Pacific/Honolulu', 'America/Los_Angeles', 'America/Denver', 'America/Chicago',
    'America/Mexico_City', 'America/Bogota', 'America/New_York', 'America/Toronto',
    'America/Argentina/Buenos_Aires', 'America/Sao_Paulo', 'UTC', 'Europe/London',
    'Africa/Casablanca', 'Europe/Paris', 'Europe/Berlin', 'Europe/Madrid', 'Europe/Lisbon',
    'Africa/Cairo', 'Europe/Istanbul', 'Europe/Moscow', 'Asia/Riyadh', 'Asia/Dubai',
    'Asia/Kolkata', 'Asia/Bangkok', 'Asia/Singapore', 'Asia/Shanghai', 'Asia/Taipei',
    'Asia/Tokyo', 'Asia/Seoul', 'Australia/Sydney', 'Pacific/Auckland'
  ];

  /* ---------- tz helpers (all via Intl, DST-safe) ---------- */
  function hourInTz(tz, date) {
    return parseInt(new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', hour12: false }).format(date), 10) % 24;
  }
  function hmInTz(tz, date) {
    var p = new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false }).format(date);
    var m = p.split(':');
    return { h: parseInt(m[0], 10) % 24, m: parseInt(m[1], 10) };
  }
  function offsetLabel(tz, date) {
    try {
      var parts = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'shortOffset' }).formatToParts(date);
      for (var i = 0; i < parts.length; i++) if (parts[i].type === 'timeZoneName') return parts[i].value.replace('GMT', 'UTC');
    } catch (e) { /* older browsers */ }
    return '';
  }
  function zoneName(tz) { return T.zoneNames[tz] || tz.split('/').pop().replace(/_/g, ' '); }

  /* ---------- scoring ---------- */
  // Returns array[24]: for each hour of the day in userTz, the audience-weighted activity.
  function computeScores(userTz, lang) {
    var audience = LANG_AUDIENCE[lang] || LANG_AUDIENCE.en;
    var scores = new Array(24).fill(0);
    var detail = new Array(24);
    var now = new Date();
    for (var utcH = 0; utcH < 24; utcH++) {
      var d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), utcH, 30));
      var uh = hourInTz(userTz, d);
      var s = 0; var det = [];
      for (var i = 0; i < audience.length; i++) {
        var lh = hourInTz(audience[i].tz, d);
        var a = ACTIVITY[lh];
        s += audience[i].w * a;
        det.push({ tz: audience[i].tz, w: audience[i].w, localH: lh, act: a, contrib: audience[i].w * a });
      }
      scores[uh] = s;
      det.sort(function (x, y) { return y.contrib - x.contrib; });
      detail[uh] = det;
    }
    return { scores: scores, detail: detail };
  }

  // Rank hours into tiers: top4 best, next5 good, bottom6 low, rest mid.
  function tiers(scores) {
    var idx = scores.map(function (s, i) { return [s, i]; }).sort(function (a, b) { return b[0] - a[0]; });
    var tier = new Array(24).fill('mid');
    idx.slice(0, 4).forEach(function (p) { tier[p[1]] = 'best'; });
    idx.slice(4, 9).forEach(function (p) { tier[p[1]] = 'good'; });
    idx.slice(18).forEach(function (p) { tier[p[1]] = 'low'; });
    return tier;
  }

  function mergeRanges(hours) {
    if (!hours.length) return [];
    hours = hours.slice().sort(function (a, b) { return a - b; });
    // merge contiguous, wrapping midnight
    var ranges = []; var start = hours[0]; var prev = hours[0];
    for (var i = 1; i < hours.length; i++) {
      if (hours[i] === prev + 1) { prev = hours[i]; continue; }
      ranges.push([start, prev]); start = prev = hours[i];
    }
    ranges.push([start, prev]);
    if (ranges.length > 1) {
      var first = ranges[0], last = ranges[ranges.length - 1];
      if (first[0] === 0 && last[1] === 23) { ranges.pop(); ranges[0] = [last[0], first[1]]; }
    }
    return ranges.map(function (r) {
      return pad(r[0]) + ':00–' + pad((r[1] + 1) % 24) + ':00';
    });
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }

  /* ---------- colors ---------- */
  var TIER_COLOR = { best: '#00ba7c', good: '#79d2ab', mid: '#c9d6dd', low: '#eef2f4' };
  var TIER_COLOR_DARK = { best: '#00ba7c', good: '#3e8e6e', mid: '#3c4a55', low: '#222d36' };
  function isDark() { return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches; }
  function tierColor(t) { return (isDark() ? TIER_COLOR_DARK : TIER_COLOR)[t]; }

  /* ---------- svg ---------- */
  var NS = 'http://www.w3.org/2000/svg';
  function el(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function polar(cx, cy, r, deg) {
    var rad = (deg - 90) * Math.PI / 180;
    return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
  }
  function sectorPath(cx, cy, r0, r1, a0, a1) {
    var p0 = polar(cx, cy, r1, a0), p1 = polar(cx, cy, r1, a1),
        p2 = polar(cx, cy, r0, a1), p3 = polar(cx, cy, r0, a0);
    var large = (a1 - a0) > 180 ? 1 : 0;
    return 'M' + p0.join(',') + ' A' + r1 + ',' + r1 + ' 0 ' + large + ' 1 ' + p1.join(',') +
           ' L' + p2.join(',') + ' A' + r0 + ',' + r0 + ' 0 ' + large + ' 0 ' + p3.join(',') + ' Z';
  }

  /* ---------- main ---------- */
  var root = document.getElementById('timing-clock');
  if (!root) return;

  var browserTz = 'UTC';
  try { browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; } catch (e) {}
  var navLang = (navigator.language || 'en').slice(0, 2).toLowerCase();
  var defaultLang = LANG_AUDIENCE[navLang] ? navLang : 'en';

  // controls
  var wrap = document.createElement('div'); wrap.className = 'clock-controls'; root.appendChild(wrap);
  function makeSelect(labelText, id) {
    var box = document.createElement('label'); box.className = 'clock-ctl';
    var span = document.createElement('span'); span.textContent = labelText; box.appendChild(span);
    var sel = document.createElement('select'); sel.id = id; box.appendChild(sel);
    wrap.appendChild(box); return sel;
  }
  var tzSel = makeSelect(T.yourTz, 'tz-select');
  var langSel = makeSelect(T.postLang, 'lang-select');

  var tzList = TZ_CHOICES.slice();
  if (tzList.indexOf(browserTz) === -1) tzList.unshift(browserTz);
  var nowDate = new Date();
  tzList.forEach(function (tz) {
    var o = document.createElement('option'); o.value = tz;
    o.textContent = zoneName(tz) + ' (' + (offsetLabel(tz, nowDate) || tz) + ')';
    if (tz === browserTz) o.selected = true;
    tzSel.appendChild(o);
  });
  Object.keys(LANG_AUDIENCE).forEach(function (lg) {
    var o = document.createElement('option'); o.value = lg;
    o.textContent = T.langNames[lg] || lg;
    if (lg === defaultLang) o.selected = true;
    langSel.appendChild(o);
  });

  // svg stage
  var stage = document.createElement('div'); stage.className = 'clock-stage'; root.appendChild(stage);
  var SIZE = 460, CX = SIZE / 2, CY = SIZE / 2, R0 = 92, R1 = 168;
  var svg = el('svg', { viewBox: '0 0 ' + SIZE + ' ' + SIZE, 'class': 'timing-svg' }, null);
  stage.appendChild(svg);

  var tip = document.createElement('div'); tip.className = 'clock-tip'; tip.style.display = 'none';
  stage.appendChild(tip);

  var windowsBox = document.createElement('div'); windowsBox.className = 'clock-windows'; root.appendChild(windowsBox);
  var audienceBox = document.createElement('div'); audienceBox.className = 'clock-audience'; root.appendChild(audienceBox);
  var hint = document.createElement('p'); hint.className = 'src'; hint.textContent = T.hover; root.appendChild(hint);

  var needleG = null, centerText = null, centerSub = null;

  function render() {
    var userTz = tzSel.value, lang = langSel.value;
    var res = computeScores(userTz, lang);
    var tier = tiers(res.scores);
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    // sectors
    for (var h = 0; h < 24; h++) {
      (function (h) {
        var a0 = h * 15 + 0.6, a1 = (h + 1) * 15 - 0.6;
        var path = el('path', {
          d: sectorPath(CX, CY, R0, R1, a0, a1),
          fill: tierColor(tier[h]),
          'class': 'clock-sector' + (tier[h] === 'best' ? ' best' : '')
        }, svg);
        path.addEventListener('mousemove', function (ev) {
          var det = res.detail[h] || [];
          var rows = det.slice(0, 4).map(function (d) {
            return '<div>' + zoneName(d.tz) + ' · ' + T.localTime + ' ' + pad(d.localH) + ':00' +
                   (d.act >= 0.7 ? ' 🟢' : d.act >= 0.4 ? ' 🟡' : ' ⚫') + '</div>';
          }).join('');
          tip.innerHTML = '<strong>' + pad(h) + ':00–' + pad((h + 1) % 24) + ':00 · ' +
            ({ best: T.best, good: T.good, mid: T.mid, low: T.low })[tier[h]] + '</strong>' +
            '<div class="tip-sub">' + T.activeAt + ':</div>' + rows;
          tip.style.display = 'block';
          var r = stage.getBoundingClientRect();
          tip.style.left = Math.min(ev.clientX - r.left + 14, r.width - 190) + 'px';
          tip.style.top = (ev.clientY - r.top + 14) + 'px';
        });
        path.addEventListener('mouseleave', function () { tip.style.display = 'none'; });
      })(h);
    }

    // hour labels
    for (var lh = 0; lh < 24; lh += 3) {
      var pos = polar(CX, CY, R1 + 18, lh * 15 + 7.5);
      el('text', { x: pos[0], y: pos[1] + 4, 'text-anchor': 'middle', 'class': 'clock-num' }, svg)
        .textContent = pad(lh);
    }
    // ticks
    for (var t = 0; t < 24; t++) {
      var pa = polar(CX, CY, R1 + 4, t * 15), pb = polar(CX, CY, R1 + 9, t * 15);
      el('line', { x1: pa[0], y1: pa[1], x2: pb[0], y2: pb[1], 'class': 'clock-tick' }, svg);
    }

    // center
    el('circle', { cx: CX, cy: CY, r: R0 - 10, 'class': 'clock-center' }, svg);
    centerText = el('text', { x: CX, y: CY - 4, 'text-anchor': 'middle', 'class': 'clock-time' }, svg);
    centerSub = el('text', { x: CX, y: CY + 22, 'text-anchor': 'middle', 'class': 'clock-sub' }, svg);
    centerSub.textContent = T.langNames[lang] + ' · ' + zoneName(userTz);

    needleG = el('g', {}, svg);
    drawNeedle(userTz);

    // windows summary
    var bestHours = [], goodHours = [];
    for (var i = 0; i < 24; i++) {
      if (tier[i] === 'best') bestHours.push(i);
      else if (tier[i] === 'good') goodHours.push(i);
    }
    windowsBox.innerHTML =
      '<div class="win-row"><span class="badge pos">' + T.bestWindows + '</span> ' +
      mergeRanges(bestHours).map(function (r) { return '<code>' + r + '</code>'; }).join(' ') + '</div>' +
      '<div class="win-row"><span class="badge info">' + T.goodWindows + '</span> ' +
      mergeRanges(goodHours).map(function (r) { return '<code>' + r + '</code>'; }).join(' ') + '</div>';

    // audience mix
    var audience = LANG_AUDIENCE[lang];
    var bars = audience.map(function (a) {
      return '<div class="aud-row"><span class="aud-name">' + zoneName(a.tz) + '</span>' +
        '<span class="aud-bar"><span style="width:' + Math.round(a.w * 100) + '%"></span></span>' +
        '<span class="aud-pct">' + Math.round(a.w * 100) + '%</span></div>';
    }).join('');
    audienceBox.innerHTML = '<div class="aud-title">' + T.audience + '</div>' + bars;
  }

  function drawNeedle(userTz) {
    if (!needleG) return;
    while (needleG.firstChild) needleG.removeChild(needleG.firstChild);
    var hm = hmInTz(userTz, new Date());
    var deg = (hm.h + hm.m / 60) * 15;
    var po = polar(CX, CY, R1 - 2, deg), pi = polar(CX, CY, R0 - 26, deg);
    el('line', { x1: pi[0], y1: pi[1], x2: po[0], y2: po[1], 'class': 'clock-needle' }, needleG);
    el('circle', { cx: po[0], cy: po[1], r: 5, 'class': 'clock-needle-dot' }, needleG);
    if (centerText) centerText.textContent = T.now + ' ' + pad(hm.h) + ':' + pad(hm.m);
  }

  tzSel.addEventListener('change', render);
  langSel.addEventListener('change', render);
  setInterval(function () { drawNeedle(tzSel.value); }, 30000);
  if (window.matchMedia) {
    try { window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', render); } catch (e) {}
  }
  render();
})();
