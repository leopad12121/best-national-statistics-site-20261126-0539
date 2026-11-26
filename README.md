# World in Numbers — National Statistics Explorer

[![make.fun](https://make.fun/badge/best-national-statistics-site-20261126-0539.svg)](https://make.fun/bounty/best-national-statistics-site-20261126-0539)
[![rank](https://make.fun/badge/best-national-statistics-site-20261126-0539/leopad12121/best-national-statistics-site-20261126-0539/rank.svg)](https://make.fun/bounty/best-national-statistics-site-20261126-0539)
[![reward](https://make.fun/badge/best-national-statistics-site-20261126-0539/leopad12121/best-national-statistics-site-20261126-0539/reward.svg)](https://make.fun/bounty/best-national-statistics-site-20261126-0539)

A national statistics site for 48 countries, entered in the
[make.fun bounty](https://make.fun/bounty/best-national-statistics-site-20261126-0539).
It runs entirely offline from its own static files: no network requests, no
external fonts, libraries or images — just vanilla JavaScript and inline SVG
charts drawn from data embedded in the site.

## What it is

- **Home** — combined population and GDP of the 48 countries, top-10 bar
  charts, rankings at a glance, a country spotlight and region browsing.
- **Countries** — a searchable, sortable table of all 48 countries with a
  region filter; click any country for its profile.
- **Country pages** — ten key indicators (population, GDP, GDP per capita,
  life expectancy, CO₂ per capita, urban share, internet use, unemployment,
  GNI per capita, fertility), population and GDP trend charts 2014–2024,
  and a comparison against the median country.
- **Compare** — any two countries side by side, every indicator, with bars
  scaled to the pair and a swap button.
- **Rankings** — every indicator ranked across all 48 countries, with a
  top-10 bar chart and the full table.
- **Sources & method** — each indicator's World Bank code and definition,
  year coverage, and an about note.

## Data

Every figure comes from the World Bank's World Development Indicators,
fetched from the World Bank Open Data API on 26 November 2026 and embedded
in `app/data.js`. Each figure is shown with the year the World Bank reports
it for (mostly 2024; CO₂ per capita mostly 2021–2022). Nothing is fetched
at view time.

## Run it

```sh
node serve.ts          # serves app/ at http://localhost:8080
```

Open http://localhost:8080 in a browser, desktop or phone size.

## Hand in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` (Node 22, standard library only) copies `app/` and `screenshots/`
to the output directory and writes `dossier.json` with the vendored
`vendor/makefun-frontend.ts`. Two runs produce byte-identical output.

Site code: MIT licence (see `LICENSE`). Data: © World Bank, World
Development Indicators, free to use with attribution.
