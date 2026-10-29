# Oishii おいしい

A cute Japanese learning game for two adult beginners. Learn kana, then climb a route of 2,211 JLPT kanji from N5 to N1 in sub-levels of ten, take kanji apart into radicals, match them to meanings, feed sushi to your buds, collect 駅スタンプ (station stamps) for every kanji you clear, and play eight daily puzzles together.

## Play

It's a single static page. Open `index.html` in a browser, or serve the repo root with any static host (GitHub Pages: Settings → Pages → deploy from `main`, root folder). On a phone, "Add to Home Screen" gives it an app icon.

Progress is saved per device in the browser (localStorage).

## What's in it

- **The line (Learn tab):** a rail trip across Japan. Every sub-level is a real station (228 in all), from Tokyo for kana, down the Tōkaidō for N5, through Kansai, Kyushu, Shikoku, the Alps and Tōhoku, to Wakkanai, Japan's northernmost station, at the end of N1. Clearing a sub-level lays track on the map and earns that station's 駅スタンプ. Kana come first (6 stops), then JLPT N5 → N1 in sub-levels of 10 kanji. Each stop has study cards (meanings, on'yomi and kun'yomi with romaji, and the radicals that build the kanji) and a clear test. Mistakes come back until you get them, WaniKani style; 0–1 mistakes earns ★★★. Clearing a stop stamps its kanji.
- **Secret ticket:** tap the little train on the line five times to unlock up to any stop (stamps and stars still have to be earned).
- **Review:** a mixed quiz of your stamped kanji and learned kana, weighted toward the ones you miss.
- **Radical Builder:** pick the radicals that make up a kanji, and spot a kanji from its parts.
- **Meaning Match:** pair kanji with their meanings against the clock.
- **Sushi Belt:** buds order stamped kanji by picture and meaning; drag them the right plate. Look-alike decoys, combos, plate prices, levelling buds.
- **More daily puzzles** (same seed for both players): Petal Guess, Garden Plot, Garden Logic, Missing Half, Number Line, Chef's Special. Every game has endless mode, 10 levels and a rally stamp card, and every past day stays playable in the archive.
- **Collection:** a station stamp for every stop, a kanji stamp for every kanji (one page per JLPT level), trophies, route and rally stars, and a completion meter. No streaks, nothing expires.
- **Two roles:** Kana speller (reading choices with romaji) and Kanji reader (typed readings, WaniKani style, bare kanji). Typing converts romaji to kana like WaniKani.

## Develop

Edit files in `src/`, then rebuild:

```
python3 build.py
```

This writes `index.html` (full standalone page) and `dist/oishii.html` (page body for publishing as a Claude artifact).

- `src/data.js` — kana, puzzle content, buds, games
- `src/kanji-data.js` — generated JLPT kanji and radical data (do not edit by hand)
- `src/kanji.js` — kanji entries, tracks and sub-levels
- `src/ground-data.js` — generated: which stop teaches which N5/N4 kanji and why (`tools/ground_kanji.py`)
- `src/route-data.js` — generated stations and map outline (edit `tools/route.tsv`, then run `tools/make_route_data.py`)
- `src/rail.js` — the rail map, station cards and station stamps
- `src/core.js` — state, helpers, drag and drop, sounds, stamps, kana typing
- `src/learn.js` — app shell, the route, study cards, quiz engine, review, stamp book, settings
- `src/sushi.js` — Sushi Belt
- `src/puzzles.js` — the daily puzzles
- `src/style.css` — all styles and color tokens
- `assets/emoji.json` — Fluent Emoji images embedded as WebP data URIs (regenerate with `python3 tools/fetch_emoji.py`)

See [STYLE_GUIDE.md](STYLE_GUIDE.md) for the look and feel and the roadmap.

### Regenerating the kanji data

```
npm pack @johnmorrisdotca/bushu@1.1.0 && tar xzf johnmorrisdotca-bushu-1.1.0.tgz
curl -O https://raw.githubusercontent.com/davidluzgouveia/kanji-data/master/kanji.json
node tools/extract_radicals.mjs "$PWD/package" kanji.json tools/data/kraw.json
python3 tools/make_kanji_data.py tools/data/kraw.json
```

### Regenerating the route

`tools/route.tsv` lists every stop in order (station name as ekidata spells it, place, reading, romaji, prefecture code, what it's known for). Then:

```
curl -O https://raw.githubusercontent.com/piuccio/open-data-jp-railway-stations/master/stations.json
curl -O https://raw.githubusercontent.com/dataofjapan/land/master/japan.geojson
pip install shapely
python3 tools/make_route_data.py stations.json japan.geojson
```

### Grounding kanji in places

N5 and N4 kanji are dealt to the stops where they really appear: in the stop's name, in a local word from `tools/local_words.tsv` (landmarks, foods, nicknames), or on a real station sign within 25 km. Each city also teaches one local special kanji from `tools/meibutsu.tsv`. After editing either file, or `route.tsv`, run (with the same `stations.json`):

```
python3 tools/ground_kanji.py stations.json
```

It writes `src/ground-data.js` and prints how many kanji each stop ties to its town.

## Credits

- Emoji art: [Microsoft Fluent Emoji](https://github.com/microsoft/fluentui-emoji) (MIT License).
- Romaji-to-kana typing: [WanaKana](https://github.com/WaniKani/WanaKana) (MIT License), loaded from jsDelivr.
- Kanji, meanings and readings: [KANJIDIC2](https://www.edrdg.org/wiki/index.php/KANJIDIC_Project) via [davidluzgouveia/kanji-data](https://github.com/davidluzgouveia/kanji-data). JLPT levels: Jonathan Waller's lists ([tanos.co.uk](http://www.tanos.co.uk/jlpt/), CC BY).
- Radicals: RADKFILE/KRADFILE by Michael Raine, James Breen and the Electronic Dictionary Research and Development Group, via [@johnmorrisdotca/bushu](https://www.npmjs.com/package/@johnmorrisdotca/bushu). Radical names: [Kanji alive](https://kanjialive.com/) (CC BY 4.0).
- *Radicals and kanji from RADKFILE and KANJIDIC2, the property of the Electronic Dictionary Research and Development Group, used under the Group's licence (https://www.edrdg.org/edrdg/licence.html).* The generated `src/kanji-data.js` is shared under CC BY-SA 4.0.
- Station coordinates: [ekidata](https://www.ekidata.jp/) via [piuccio/open-data-jp-railway-stations](https://github.com/piuccio/open-data-jp-railway-stations). Map of Japan: Global Map Japan, Geospatial Information Authority of Japan (出典: 地球地図日本), via [dataofjapan/land](https://github.com/dataofjapan/land).
- Fonts: Mochiy Pop One, M PLUS Rounded 1c, Klee One (Google Fonts, SIL Open Font License).
