/* World in Numbers — small SVG chart builders (no libraries, no network).
   barChart(rows, opts) draws horizontal bars; lineChart(points, opts) draws a
   line with area fill and year labels. Both return an SVG string. */
(function () {
  'use strict';

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function niceMax(v) {
    if (v <= 0) return 1;
    var p = Math.pow(10, Math.floor(Math.log10(v)));
    var n = v / p;
    var m = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
    return m * p;
  }

  // rows: [{label, value, display}], opts: {width, barColor, highlight}
  function barChart(rows, opts) {
    opts = opts || {};
    var W = opts.width || 640;
    var labelW = opts.labelWidth || 150;
    var rowH = 30, top = 8, bottom = 8;
    var H = top + rows.length * rowH + bottom;
    var max = niceMax(Math.max.apply(null, rows.map(function (r) { return r.value; })));
    var plotW = W - labelW - 90;
    var out = ['<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Bar chart">'];
    rows.forEach(function (r, i) {
      var y = top + i * rowH;
      var w = Math.max(2, (r.value / max) * plotW);
      var color = (opts.highlight === i) ? '#c98a2b' : (opts.barColor || '#0e7c7b');
      out.push('<text class="bar-label" x="0" y="' + (y + 17) + '">' + esc(r.label) + '</text>');
      out.push('<rect x="' + labelW + '" y="' + (y + 5) + '" width="' + w.toFixed(1) + '" height="15" rx="3" fill="' + color + '"/>');
      out.push('<text class="bar-value" x="' + (labelW + w + 7) + '" y="' + (y + 17) + '">' + esc(r.display) + '</text>');
    });
    out.push('</svg>');
    return out.join('');
  }

  // points: [[year, value], ...], opts: {width, height, color, format}
  function lineChart(points, opts) {
    opts = opts || {};
    var W = opts.width || 640, H = opts.height || 260;
    var padL = 64, padR = 14, padT = 14, padB = 28;
    var vals = points.map(function (p) { return p[1]; });
    var min = Math.min.apply(null, vals), max = Math.max.apply(null, vals);
    var span = max - min || 1;
    min = min - span * 0.12; max = max + span * 0.12;
    var xs = function (i) { return padL + (i * (W - padL - padR)) / (points.length - 1); };
    var ys = function (v) { return padT + ((max - v) / (max - min)) * (H - padT - padB); };
    var color = opts.color || '#0e7c7b';
    var fmt = opts.format || function (v) { return String(v); };
    var out = ['<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Trend chart">'];
    // gridlines + y labels (4 ticks)
    for (var t = 0; t <= 3; t++) {
      var gv = min + (max - min) * (t / 3);
      var gy = ys(gv);
      out.push('<line x1="' + padL + '" y1="' + gy.toFixed(1) + '" x2="' + (W - padR) + '" y2="' + gy.toFixed(1) + '" stroke="#e3dcc8" stroke-width="1"/>');
      out.push('<text class="axis" x="' + (padL - 8) + '" y="' + (gy + 4).toFixed(1) + '" text-anchor="end">' + esc(fmt(gv)) + '</text>');
    }
    // area + line
    var area = 'M' + xs(0).toFixed(1) + ',' + (H - padB) + ' ';
    var line = '';
    points.forEach(function (p, i) {
      area += 'L' + xs(i).toFixed(1) + ',' + ys(p[1]).toFixed(1) + ' ';
      line += (i === 0 ? 'M' : 'L') + xs(i).toFixed(1) + ',' + ys(p[1]).toFixed(1) + ' ';
    });
    area += 'L' + xs(points.length - 1).toFixed(1) + ',' + (H - padB) + ' Z';
    out.push('<path d="' + area + '" fill="' + color + '" opacity="0.12"/>');
    out.push('<path d="' + line + '" fill="none" stroke="' + color + '" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>');
    points.forEach(function (p, i) {
      out.push('<circle cx="' + xs(i).toFixed(1) + '" cy="' + ys(p[1]).toFixed(1) + '" r="3.5" fill="#fffdf7" stroke="' + color + '" stroke-width="2"/>');
      if (i % 2 === 0 || i === points.length - 1) {
        out.push('<text class="axis" x="' + xs(i).toFixed(1) + '" y="' + (H - 8) + '" text-anchor="middle">' + p[0] + '</text>');
      }
    });
    // end value label: above and to the left of the last point, so it never
    // sits on the point itself or on the x-axis year label beneath it
    var last = points[points.length - 1];
    out.push('<text class="bar-value" x="' + (xs(points.length - 1) - 9).toFixed(1) + '" y="' + Math.max(13, ys(last[1]) - 9).toFixed(1) + '" text-anchor="end">' + esc(fmt(last[1])) + ' (' + last[0] + ')</text>');
    out.push('</svg>');
    return out.join('');
  }

  window.WINCharts = { barChart: barChart, lineChart: lineChart, esc: esc };
})();
