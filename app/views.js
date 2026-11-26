/* World in Numbers — page renderers and router (hash routes, no network).
   Routes: #/ (home), #/countries, #/country/XX, #/compare, #/rankings, #/sources.
   Every figure comes from window.WIN_DATA (World Bank, retrieved 2026-11-26)
   and is shown with the year the World Bank reports it for. */
(function () {
  'use strict';

  var DATA = window.WIN_DATA;
  var C = DATA.countries;
  var BY_CODE = {};
  C.forEach(function (c) { BY_CODE[c.code] = c; });

  var INDICATORS = [
    { key: 'pop', label: 'Population', unit: 'people', fmt: fmtPeople, higher: true, blurb: 'Total population (World Bank, SP.POP.TOTL).' },
    { key: 'gdp', label: 'GDP', unit: 'US$', fmt: fmtMoney, higher: true, blurb: 'Gross domestic product, current US$ (NY.GDP.MKTP.CD).' },
    { key: 'gdppc', label: 'GDP per capita', unit: 'US$', fmt: fmtMoney, higher: true, blurb: 'GDP per capita, current US$ (NY.GDP.PCAP.CD).' },
    { key: 'life', label: 'Life expectancy', unit: 'years', fmt: fmtYears, higher: true, blurb: 'Life expectancy at birth, years (SP.DYN.LE00.IN).' },
    { key: 'co2', label: 'CO2 per capita', unit: 'tonnes', fmt: fmtTonnes, higher: false, blurb: 'CO2 emissions excluding LULUCF per capita, tonnes (EN.GHG.CO2.PC.CE.AR5).' },
    { key: 'urban', label: 'Urban population', unit: '%', fmt: fmtPct, higher: true, blurb: 'Urban population, % of total (SP.URB.TOTL.IN.ZS).' },
    { key: 'internet', label: 'Internet users', unit: '%', fmt: fmtPct, higher: true, blurb: 'Individuals using the Internet, % of population (IT.NET.USER.ZS).' },
    { key: 'unemp', label: 'Unemployment', unit: '%', fmt: fmtPct, higher: false, blurb: 'Unemployment, % of total labour force, modelled ILO estimate (SL.UEM.TOTL.ZS).' },
    { key: 'gnipc', label: 'GNI per capita', unit: 'US$', fmt: fmtMoney, higher: true, blurb: 'GNI per capita, Atlas method, current US$ (NY.GNP.PCAP.CD).' },
    { key: 'fert', label: 'Fertility rate', unit: 'births', fmt: fmtBirths, higher: false, blurb: 'Fertility rate, births per woman (SP.DYN.TFRT.IN).' }
  ];
  function ind(key) { return INDICATORS.filter(function (i) { return i.key === key; })[0]; }

  function fmtInt(n) { return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function fmtPeople(v) {
    if (v >= 1e9) return (v / 1e9).toFixed(2) + ' bn';
    if (v >= 1e6) return (v / 1e6).toFixed(1) + ' m';
    return fmtInt(v);
  }
  function fmtMoney(v) {
    if (v >= 1e12) return '$' + (v / 1e12).toFixed(2) + ' tn';
    if (v >= 1e9) return '$' + (v / 1e9).toFixed(1) + ' bn';
    if (v >= 1e6) return '$' + (v / 1e6).toFixed(1) + ' m';
    return '$' + fmtInt(v);
  }
  function fmtYears(v) { return v.toFixed(1) + ' yrs'; }
  function fmtTonnes(v) { return v.toFixed(1) + ' t'; }
  function fmtPct(v) { return v.toFixed(1) + '%'; }
  function fmtBirths(v) { return v.toFixed(2); }
  function fmt1(v) { return v.toFixed(1); }

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function linkCountry(c) { return '<a href="#/country/' + c.code + '">' + esc(c.name) + '</a>'; }
  function val(c, key) { var f = c[key]; return f ? ind(key).fmt(f.v) : 'n/a'; }
  function yearOf(c, key) { return c[key] ? c[key].y : ''; }
  function withYear(c, key) { return c[key] ? ind(key).fmt(c[key].v) + ' <span class="muted small">(' + c[key].y + ')</span>' : 'n/a'; }

  function ranked(key, n, desc) {
    var rows = C.filter(function (c) { return c[key]; });
    rows.sort(function (a, b) { return desc === false ? a[key].v - b[key].v : b[key].v - a[key].v; });
    return rows.slice(0, n || 10);
  }
  function median(key) {
    var vs = C.filter(function (c) { return c[key]; }).map(function (c) { return c[key].v; }).sort(function (a, b) { return a - b; });
    return vs[Math.floor(vs.length / 2)];
  }
  function total(key) { return C.reduce(function (s, c) { return s + (c[key] ? c[key].v : 0); }, 0); }

  function rankRows(key, n, desc) {
    return ranked(key, n, desc).map(function (c, i) {
      return '<div class="rank-row"><span><span class="pos">' + (i + 1) + '</span>' + linkCountry(c) +
        '</span><span class="val">' + val(c, key) + ' <span class="muted small">(' + yearOf(c, key) + ')</span></span></div>';
    }).join('');
  }

  function barCard(title, sub, key, n, desc, highlightCode) {
    var rows = ranked(key, n, desc).map(function (c) {
      return { label: c.name, value: c[key].v, display: val(c, key) };
    });
    var hi = highlightCode ? rows.findIndex(function (r) { return r.label === BY_CODE[highlightCode].name; }) : -1;
    return '<div class="card"><p class="chart-title">' + esc(title) + '</p>' +
      '<p class="chart-note">' + esc(sub) + '</p>' +
      window.WINCharts.barChart(rows, { highlight: hi }) + '</div>';
  }

  function kpiCard(label, valueHtml, note, cls) {
    return '<div class="kpi ' + (cls || '') + '"><div class="label">' + esc(label) + '</div>' +
      '<div class="value">' + valueHtml + '</div><div class="note">' + note + '</div></div>';
  }

  /* ---------------- home ---------------- */
  function viewHome() {
    var popTotal = total('pop'), gdpTotal = total('gdp');
    var medLife = median('life');
    var spotlight = BY_CODE['JP'];
    var regions = {};
    C.forEach(function (c) { regions[c.region] = (regions[c.region] || 0) + 1; });
    var regionChips = Object.keys(regions).sort().map(function (r) {
      return '<span class="chip navy">' + esc(r) + ' · ' + regions[r] + ' countries</span>';
    }).join('');
    return '' +
      '<p class="eyebrow">National statistics · World Bank data</p>' +
      '<h1>The world, counted.</h1>' +
      '<p class="lede">Population, GDP, life expectancy, emissions and more for 48 countries — ' +
      'real figures from the World Bank, each labelled with its year, free to explore, ' +
      'and readable on any screen. Pick a country, compare two, or browse the rankings.</p>' +
      '<div class="kpis">' +
      kpiCard('Countries covered', '48', 'Across 6 regions, all World Bank members', 'navy') +
      kpiCard('Combined population', fmtPeople(popTotal), 'Sum of the 48 countries, 2024', 'gold') +
      kpiCard('Combined GDP', fmtMoney(gdpTotal), 'Current US$, latest year reported', '') +
      kpiCard('Median life expectancy', fmtYears(medLife), 'Across the 48 countries, latest year', 'red') +
      '</div>' +
      '<div class="grid2">' +
      barCard('Largest populations', 'Total population, latest year (World Bank)', 'pop', 8) +
      barCard('Largest economies', 'GDP, current US$, latest year (World Bank)', 'gdp', 8) +
      '</div>' +
      '<h2 class="section-title">Rankings at a glance</h2>' +
      '<p class="section-sub">Tap any country to open its full profile. Every figure shows its year.</p>' +
      '<div class="grid3">' +
      '<div class="card"><h3>Richest per person</h3>' + rankRows('gdppc', 5) + '<p class="small"><a href="#/rankings">All rankings →</a></p></div>' +
      '<div class="card"><h3>Longest lives</h3>' + rankRows('life', 5) + '<p class="small"><a href="#/rankings">All rankings →</a></p></div>' +
      '<div class="card"><h3>Lowest CO₂ per person</h3>' + rankRows('co2', 5, false) + '<p class="small"><a href="#/rankings">All rankings →</a></p></div>' +
      '</div>' +
      '<div class="grid2" style="margin-top:18px">' +
      '<div class="card spot"><h3>Country spotlight</h3>' +
      '<p class="big">' + esc(spotlight.name) + '</p>' +
      '<p>Population ' + withYear(spotlight, 'pop') + ' · GDP ' + withYear(spotlight, 'gdp') +
      ' · life expectancy ' + withYear(spotlight, 'life') + ' — the longest-lived of the 48 countries, ' +
      'and the world’s fourth-largest economy.</p>' +
      '<p><a href="#/country/JP">Open Japan’s full profile →</a></p></div>' +
      '<div class="card"><h3>Browse by region</h3><p>' + regionChips + '</p>' +
      '<p class="small muted">Every country page lists its capital, income group, and ten key indicators, ' +
      'with population and GDP trends from 2014 to 2024.</p>' +
      '<p><a href="#/countries">See all 48 countries →</a></p></div>' +
      '</div>' +
      '<h2 class="section-title">How to use this site</h2>' +
      '<div class="grid3">' +
      '<div class="card"><h3>1 · Explore</h3><p>Search or sort the <a href="#/countries">country table</a> by any indicator, or filter by region.</p></div>' +
      '<div class="card"><h3>2 · Compare</h3><p>Put any two countries side by side in <a href="#/compare">Compare</a> — every indicator, with bars scaled to the pair.</p></div>' +
      '<div class="card"><h3>3 · Check the source</h3><p>Every figure carries its year. <a href="#/sources">Sources &amp; method</a> lists each indicator, its World Bank code, and what it means.</p></div>' +
      '</div>';
  }

  /* ---------------- countries table ---------------- */
  var tableState = { q: '', region: 'All', sortKey: 'pop', sortDir: -1 };
  function viewCountries() {
    var regions = ['All'].concat(Object.keys(C.reduce(function (m, c) { m[c.region] = 1; return m; }, {})).sort());
    var pills = regions.map(function (r) {
      return '<button class="btn ghost' + (tableState.region === r ? ' active' : '') + '" data-region="' + esc(r) + '">' + esc(r) + '</button>';
    }).join('');
    return '' +
      '<p class="eyebrow">Country explorer</p>' +
      '<h1>All 48 countries</h1>' +
      '<p class="lede">Search by name, filter by region, or click a column heading to sort. ' +
      'Click a country for its full profile with charts.</p>' +
      '<div class="toolbar"><input type="search" id="country-search" placeholder="Search countries… (try “land” or “stan”)" value="' + esc(tableState.q) + '" aria-label="Search countries"></div>' +
      '<div class="pill-row" id="region-pills">' + pills + '</div>' +
      '<div class="table-wrap"><table class="data" id="country-table"><thead><tr>' +
      '<th data-sort="name">Country</th><th data-sort="region">Region</th>' +
      '<th data-sort="pop">Population</th><th data-sort="gdp">GDP</th>' +
      '<th data-sort="gdppc">GDP / capita</th><th data-sort="life">Life exp.</th>' +
      '<th data-sort="co2">CO₂ / capita</th><th data-sort="urban">Urban</th>' +
      '</tr></thead><tbody id="country-rows"></tbody></table></div>' +
      '<p class="small muted" id="country-count"></p>' +
      '<p class="small muted">Figures: World Bank, latest year reported for each country (2024, except unemployment for Ukraine, 2021). See <a href="#/sources">Sources &amp; method</a>.</p>';
  }

  function renderCountryRows() {
    var rows = C.filter(function (c) {
      if (tableState.region !== 'All' && c.region !== tableState.region) return false;
      if (tableState.q && c.name.toLowerCase().indexOf(tableState.q.toLowerCase()) === -1) return false;
      return true;
    });
    var k = tableState.sortKey, d = tableState.sortDir;
    rows.sort(function (a, b) {
      if (k === 'name' || k === 'region') return d * a[k].localeCompare(b[k]);
      var av = a[k] ? a[k].v : -Infinity, bv = b[k] ? b[k].v : -Infinity;
      return d * (av - bv);
    });
    var tb = document.getElementById('country-rows');
    if (!tb) return;
    tb.innerHTML = rows.map(function (c) {
      return '<tr><td>' + linkCountry(c) + '</td><td>' + esc(c.region) + '</td>' +
        '<td class="num">' + val(c, 'pop') + ' <span class="muted small">(' + yearOf(c, 'pop') + ')</span></td>' +
        '<td class="num">' + val(c, 'gdp') + '</td>' +
        '<td class="num">' + val(c, 'gdppc') + '</td>' +
        '<td class="num">' + val(c, 'life') + '</td>' +
        '<td class="num">' + val(c, 'co2') + '</td>' +
        '<td class="num">' + val(c, 'urban') + '</td></tr>';
    }).join('') || '<tr><td colspan="8">No countries match that search.</td></tr>';
    var cc = document.getElementById('country-count');
    if (cc) cc.textContent = 'Showing ' + rows.length + ' of 48 countries.';
    document.querySelectorAll('#country-table th').forEach(function (th) {
      th.classList.toggle('sorted', th.getAttribute('data-sort') === tableState.sortKey);
    });
  }

  function bindCountries() {
    var s = document.getElementById('country-search');
    if (s) s.addEventListener('input', function () { tableState.q = s.value; renderCountryRows(); });
    document.querySelectorAll('#region-pills button').forEach(function (b) {
      b.addEventListener('click', function () {
        tableState.region = b.getAttribute('data-region');
        document.querySelectorAll('#region-pills button').forEach(function (x) { x.classList.toggle('active', x === b); });
        renderCountryRows();
      });
    });
    document.querySelectorAll('#country-table th').forEach(function (th) {
      th.addEventListener('click', function () {
        var k = th.getAttribute('data-sort');
        if (tableState.sortKey === k) tableState.sortDir *= -1;
        else { tableState.sortKey = k; tableState.sortDir = (k === 'name' || k === 'region') ? 1 : -1; }
        renderCountryRows();
      });
    });
    renderCountryRows();
  }

  /* ---------------- country page ---------------- */
  function viewCountry(code) {
    var c = BY_CODE[code];
    if (!c) return '<h1>Country not found</h1><p>That code is not one of the 48 countries. <a href="#/countries">Browse all countries →</a></p>';
    var popChange = null;
    if (c.popSeries.length >= 2) {
      var first = c.popSeries[0][1], last = c.popSeries[c.popSeries.length - 1][1];
      popChange = (((last - first) / first) * 100).toFixed(1);
    }
    var gdpChange = null;
    if (c.gdpSeries.length >= 2) {
      var gf = c.gdpSeries[0][1], gl = c.gdpSeries[c.gdpSeries.length - 1][1];
      gdpChange = (((gl - gf) / gf) * 100).toFixed(1);
    }
    var rankPop = ranked('pop', 48).findIndex(function (x) { return x.code === code; }) + 1;
    var rankGdp = ranked('gdp', 48).findIndex(function (x) { return x.code === code; }) + 1;
    var rankLife = ranked('life', 48).findIndex(function (x) { return x.code === code; }) + 1;
    return '' +
      '<p class="breadcrumb"><a href="#/">Home</a> · <a href="#/countries">Countries</a> · ' + esc(c.region) + '</p>' +
      '<p class="eyebrow">' + esc(c.region) + ' · ' + esc(c.income) + '</p>' +
      '<h1>' + esc(c.name) + '</h1>' +
      '<p class="lede">Capital: ' + esc(c.capital || '—') + ' · Ranked #' + rankPop + ' of 48 by population, #' + rankGdp +
      ' by GDP and #' + rankLife + ' by life expectancy.</p>' +
      '<div class="kpis">' +
      kpiCard('Population', fmtPeople(c.pop.v), 'World Bank, ' + c.pop.y, 'navy') +
      kpiCard('GDP', fmtMoney(c.gdp.v), 'Current US$, ' + c.gdp.y, 'gold') +
      kpiCard('GDP per capita', fmtMoney(c.gdppc.v), 'Current US$, ' + c.gdppc.y, '') +
      kpiCard('Life expectancy', fmtYears(c.life.v), 'At birth, ' + c.life.y, 'red') +
      '</div>' +
      '<div class="facts">' +
      '<div class="fact"><div class="label">CO₂ per capita</div><div class="value">' + withYear(c, 'co2') + '</div></div>' +
      '<div class="fact"><div class="label">Urban population</div><div class="value">' + withYear(c, 'urban') + '</div></div>' +
      '<div class="fact"><div class="label">Internet users</div><div class="value">' + withYear(c, 'internet') + '</div></div>' +
      '<div class="fact"><div class="label">Unemployment</div><div class="value">' + withYear(c, 'unemp') + '</div></div>' +
      '<div class="fact"><div class="label">GNI per capita</div><div class="value">' + withYear(c, 'gnipc') + '</div></div>' +
      '<div class="fact"><div class="label">Fertility rate</div><div class="value">' + withYear(c, 'fert') + '</div></div>' +
      '<div class="fact"><div class="label">Capital</div><div class="value">' + esc(c.capital || '—') + '</div></div>' +
      '<div class="fact"><div class="label">Income group</div><div class="value">' + esc(c.income) + '</div></div>' +
      '</div>' +
      '<div class="grid2">' +
      '<div class="card"><p class="chart-title">Population, 2014–2024</p>' +
      '<p class="chart-note">Total population. ' + (popChange !== null ? 'Change over the decade: ' + (popChange >= 0 ? '+' : '') + popChange + '%.' : '') + ' World Bank (SP.POP.TOTL).</p>' +
      window.WINCharts.lineChart(c.popSeries, { format: fmtPeople }) + '</div>' +
      '<div class="card"><p class="chart-title">GDP, 2014–2024</p>' +
      '<p class="chart-note">Current US$. ' + (gdpChange !== null ? 'Change over the decade: ' + (gdpChange >= 0 ? '+' : '') + gdpChange + '%.' : '') + ' World Bank (NY.GDP.MKTP.CD).</p>' +
      window.WINCharts.lineChart(c.gdpSeries, { color: '#c98a2b', format: fmtMoney }) + '</div>' +
      '</div>' +
      '<h2 class="section-title">' + esc(c.name) + ' against the median country</h2>' +
      '<p class="section-sub">How this country compares with the median of the 48 countries on this site.</p>' +
      '<div class="grid2">' +
      (function () {
        // Top 5 by GDP per capita, plus this country itself when it is not
        // already among them, highlighted so the visitor can find it.
        var top = ranked('gdppc', 5);
        var rows = top.map(function (x) { return { label: x.name, value: x.gdppc.v, display: val(x, 'gdppc') }; });
        var hi = rows.findIndex(function (r) { return r.label === c.name; });
        if (hi === -1) { rows.push({ label: c.name, value: c.gdppc.v, display: val(c, 'gdppc') }); hi = rows.length - 1; }
        return '<div class="card"><p class="chart-title">GDP per capita — the five richest, and ' + esc(c.name) + '</p>' +
          '<p class="chart-note">GDP per capita, current US$, latest year. ' + esc(c.name) + ' is highlighted.</p>' +
          window.WINCharts.barChart(rows, { highlight: hi }) + '</div>';
      })() +
      '<div class="card"><h3>At a glance</h3>' +
      '<div class="rank-row"><span>Life expectancy</span><span class="val">' + val(c, 'life') + ' · median ' + fmtYears(median('life')) + '</span></div>' +
      '<div class="rank-row"><span>CO₂ per capita</span><span class="val">' + val(c, 'co2') + ' · median ' + fmtTonnes(median('co2')) + '</span></div>' +
      '<div class="rank-row"><span>Urban population</span><span class="val">' + val(c, 'urban') + ' · median ' + fmtPct(median('urban')) + '</span></div>' +
      '<div class="rank-row"><span>Internet users</span><span class="val">' + val(c, 'internet') + ' · median ' + fmtPct(median('internet')) + '</span></div>' +
      '<div class="rank-row"><span>Unemployment</span><span class="val">' + val(c, 'unemp') + ' · median ' + fmtPct(median('unemp')) + '</span></div>' +
      '<p class="small" style="margin-top:12px"><a href="#/compare">Compare ' + esc(c.name) + ' with another country →</a></p>' +
      '<p class="small"><a href="#/countries">← Back to all countries</a></p></div>' +
      '</div>';
  }

  /* ---------------- compare ---------------- */
  var cmpState = { a: 'US', b: 'CN' };
  function viewCompare() {
    var opts = C.map(function (c) { return '<option value="' + c.code + '">' + esc(c.name) + '</option>'; }).join('');
    return '' +
      '<p class="eyebrow">Head to head</p>' +
      '<h1>Compare two countries</h1>' +
      '<p class="lede">Pick any two of the 48 countries. Every indicator is shown side by side, ' +
      'with bars scaled to the larger of the pair.</p>' +
      '<div class="toolbar"><label>Country A <select id="cmp-a">' + opts + '</select></label>' +
      '<button class="btn ghost" id="cmp-swap">⇄ Swap</button>' +
      '<label>Country B <select id="cmp-b">' + opts + '</select></label></div>' +
      '<div class="vs" id="cmp-out"></div>' +
      '<p class="small muted" style="margin-top:14px">Figures: World Bank, latest year reported for each country. ' +
      'Bars are scaled within each row, so a longer bar means a larger value for that indicator.</p>';
  }
  function renderCompare() {
    var a = BY_CODE[cmpState.a], b = BY_CODE[cmpState.b];
    var out = document.getElementById('cmp-out');
    if (!out) return;
    function col(c, other) {
      var rows = INDICATORS.map(function (indx) {
        var f = c[indx.key], of = other[indx.key];
        var pct = (f && of) ? Math.min(100, (f.v / Math.max(f.v, of.v)) * 100) : 0;
        var cls = c.code === cmpState.a ? '' : 'other';
        return '<div class="cmp-row"><div class="cmp-label">' + esc(indx.label) + '</div>' +
          '<div class="cmp-val">' + (f ? indx.fmt(f.v) + ' <span class="muted small">(' + f.y + ')</span>' : 'n/a') + '</div>' +
          '<div class="cmp-bar"><i class="' + cls + '" style="width:' + pct.toFixed(1) + '%"></i></div></div>';
      }).join('');
      return '<div class="vs-col"><h3>' + esc(c.name) + '</h3><p class="small muted">' + esc(c.region) + ' · Capital ' + esc(c.capital || '—') + ' · ' + esc(c.income) + '</p>' + rows + '</div>';
    }
    out.innerHTML = col(a, b) + col(b, a);
    var sa = document.getElementById('cmp-a'), sb = document.getElementById('cmp-b');
    if (sa) sa.value = cmpState.a;
    if (sb) sb.value = cmpState.b;
  }
  function bindCompare() {
    var sa = document.getElementById('cmp-a'), sb = document.getElementById('cmp-b');
    if (sa) sa.addEventListener('change', function () { cmpState.a = sa.value; renderCompare(); });
    if (sb) sb.addEventListener('change', function () { cmpState.b = sb.value; renderCompare(); });
    var sw = document.getElementById('cmp-swap');
    if (sw) sw.addEventListener('click', function () { var t = cmpState.a; cmpState.a = cmpState.b; cmpState.b = t; renderCompare(); });
    renderCompare();
  }

  /* ---------------- rankings ---------------- */
  var rankState = { key: 'gdp' };
  function viewRankings() {
    var tabs = INDICATORS.map(function (i) {
      return '<button class="btn ghost' + (rankState.key === i.key ? ' active' : '') + '" data-ind="' + i.key + '">' + esc(i.label) + '</button>';
    }).join('');
    return '' +
      '<p class="eyebrow">Rankings</p>' +
      '<h1>Ranked lists</h1>' +
      '<p class="lede">Every indicator, ranked across all 48 countries. Switch indicators to re-rank the chart and the table.</p>' +
      '<div class="pill-row" id="rank-tabs">' + tabs + '</div>' +
      '<div id="rank-out"></div>';
  }
  function renderRankings() {
    var out = document.getElementById('rank-out');
    if (!out) return;
    var i = ind(rankState.key);
    var rows = ranked(rankState.key, 48, i.higher !== false);
    var chartRows = ranked(rankState.key, 10, i.higher !== false).map(function (c) {
      return { label: c.name, value: c[rankState.key].v, display: val(c, rankState.key) };
    });
    var table = rows.map(function (c, n) {
      return '<tr><td>' + (n + 1) + '</td><td>' + linkCountry(c) + '</td><td>' + esc(c.region) + '</td>' +
        '<td class="num">' + val(c, rankState.key) + '</td><td class="num">' + yearOf(c, rankState.key) + '</td></tr>';
    }).join('');
    out.innerHTML = '<div class="card"><p class="chart-title">Top 10 — ' + esc(i.label) + '</p>' +
      '<p class="chart-note">' + esc(i.blurb) + '</p>' +
      window.WINCharts.barChart(chartRows) + '</div>' +
      '<h2 class="section-title">Full ranking — ' + esc(i.label) + '</h2>' +
      '<div class="table-wrap"><table class="data"><thead><tr><th>#</th><th>Country</th><th>Region</th><th>' + esc(i.label) + '</th><th>Year</th></tr></thead><tbody>' + table + '</tbody></table></div>';
    document.querySelectorAll('#rank-tabs button').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-ind') === rankState.key);
    });
  }
  function bindRankings() {
    document.querySelectorAll('#rank-tabs button').forEach(function (b) {
      b.addEventListener('click', function () { rankState.key = b.getAttribute('data-ind'); renderRankings(); });
    });
    renderRankings();
  }

  /* ---------------- sources ---------------- */
  function viewSources() {
    var rows = INDICATORS.map(function (i) {
      return '<tr><td style="text-align:left">' + esc(i.label) + '</td><td style="text-align:left">' + esc(i.blurb) + '</td></tr>';
    }).join('');
    return '' +
      '<p class="eyebrow">Sources &amp; method</p>' +
      '<h1>Where every number comes from</h1>' +
      '<p class="lede">All figures on this site come from the World Bank’s World Development Indicators, ' +
      'fetched from the World Bank Open Data API (api.worldbank.org) on 26 November 2026 and embedded in the site. ' +
      'The site then works entirely offline: it makes no network requests at all.</p>' +
      '<div class="card"><h3>The indicators</h3>' +
      '<div class="table-wrap"><table class="data" style="min-width:0"><thead><tr><th>Indicator</th><th>What it is (World Bank code)</th></tr></thead><tbody>' + rows + '</tbody></table></div></div>' +
      '<h2 class="section-title">Years and coverage</h2>' +
      '<div class="card"><p>Each figure is shown with the year the World Bank reports it for. ' +
      'Every indicator is current to 2024, with one exception: unemployment for Ukraine, ' +
      'whose latest World Bank value is 2021. Population and GDP charts run from 2014 to 2024. ' +
      'Where the World Bank reports no value for a country, the site says so rather than guessing.</p>' +
      '<p>48 countries are covered: the world’s largest economies and populations plus a spread across every region, ' +
      'so the rankings and comparisons stay meaningful. The site covers 6 regions: Africa, Asia, Europe, North America, South America and Oceania.</p></div>' +
      '<h2 class="section-title">About this site</h2>' +
      '<div class="card"><p><b>World in Numbers</b> is an original, independent statistics explorer built for the make.fun ' +
      '“best national statistics site” bounty. It is not affiliated with the World Bank, and it copies no other site’s brand, text or images. ' +
      'All charts are drawn as inline SVG from the embedded data; there are no external fonts, libraries or images, ' +
      'so the whole site is a handful of small files that load instantly and work offline.</p>' +
      '<p class="small muted">Data: © World Bank, World Development Indicators, retrieved 26 November 2026. ' +
      'World Bank data is free to use with attribution. Site code: MIT licence.</p></div>';
  }

  /* ---------------- router ---------------- */
  function render() {
    var hash = (location.hash || '#/').replace(/^#/, '');
    var parts = hash.split('/').filter(Boolean);
    var main = document.getElementById('app');
    var nav = document.querySelectorAll('.topnav a');
    var route = parts[0] || '';
    var html = '', bind = null;
    if (route === '') { html = viewHome(); }
    else if (route === 'countries') { html = viewCountries(); bind = bindCountries; }
    else if (route === 'country' && parts[1]) { html = viewCountry(parts[1].toUpperCase()); }
    else if (route === 'compare') { html = viewCompare(); bind = bindCompare; }
    else if (route === 'rankings') { html = viewRankings(); bind = bindRankings; }
    else if (route === 'sources') { html = viewSources(); }
    else { html = '<h1>Page not found</h1><p><a href="#/">Back to the home page →</a></p>'; }
    main.innerHTML = html;
    nav.forEach(function (a) {
      var href = a.getAttribute('href');
      a.classList.toggle('active', href === '#/' + route || (route === '' && href === '#/') || (route === 'country' && href === '#/countries'));
    });
    if (bind) bind();
    window.scrollTo(0, 0);
    document.title = 'World in Numbers — National Statistics Explorer';
  }

  window.WINViews = { render: render };
})();
