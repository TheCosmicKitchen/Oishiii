# Oishii おいしい

A cute Japanese learning game for two adult beginners. Learn kana, then climb a route of 2,211 JLPT kanji from N5 to N1 in sub-levels of ten, take kanji apart into radicals, match them to meanings, feed sushi to your buds, collect 駅スタンプ (station stamps) for every kanji you clear, and play eight daily puzzles together.

## Play

It's a single static page. Open `index.html` in a browser, or serve the repo root with any static host (GitHub Pages: Settings → Pages → deploy from `main`, root folder). On a phone, "Add to Home Screen" gives it an app icon.

Progress is saved per device in the browser (localStorage).

## What's in it

- **The route (Learn tab):** kana first (6 sub-levels), then JLPT N5 → N1, each split into sub-levels of 10 kanji (228 stops in all). Each stop has study cards (meanings, on'yomi and kun'yomi with romaji, and the radicals that build the kanji) and a clear test. Mistakes come back until you get them, WaniKani style; 0–1 mistakes earns ★★★. Clearing a stop stamps its kanji.
- **Secret ticket:** tap the little station on the route five times to unlock up to any stop (stamps and stars still have to be earned).
- **Review:** a mixed quiz of your stamped kanji and learned kana, weighted toward the ones you miss.
- **Radical Builder:** pick the radicals that make up a kanji, and spot a kanji from its parts.
- **Meaning Match:** pair kanji with their meanings against the clock.
- **Sushi Belt:** buds order stamped kanji by picture and meaning; drag them the right plate. Look-alike decoys, combos, plate prices, levelling buds.
- **More daily puzzles** (same seed for both players): Petal Guess, Garden Plot, Garden Logic, Missing Half, Number Line, Chef's Special. Every game has endless mode, 10 levels and a rally stamp card, and every past day stays playable in the archive.
- **Collection:** a stamp for every kanji (one page per JLPT level), trophies, route and rally stars, and a completion meter. No streaks, nothing expires.
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

## Credits

- Emoji art: [Microsoft Fluent Emoji](https://github.com/microsoft/fluentui-emoji) (MIT License).
- Romaji-to-kana typing: [WanaKana](https://github.com/WaniKani/WanaKana) (MIT License), loaded from jsDelivr.
- Kanji, meanings and readings: [KANJIDIC2](https://www.edrdg.org/wiki/index.php/KANJIDIC_Project) via [davidluzgouveia/kanji-data](https://github.com/davidluzgouveia/kanji-data). JLPT levels: Jonathan Waller's lists ([tanos.co.uk](http://www.tanos.co.uk/jlpt/), CC BY).
- Radicals: RADKFILE/KRADFILE by Michael Raine, James Breen and the Electronic Dictionary Research and Development Group, via [@johnmorrisdotca/bushu](https://www.npmjs.com/package/@johnmorrisdotca/bushu). Radical names: [Kanji alive](https://kanjialive.com/) (CC BY 4.0).
- *Radicals and kanji from RADKFILE and KANJIDIC2, the property of the Electronic Dictionary Research and Development Group, used under the Group's licence (https://www.edrdg.org/edrdg/licence.html).* The generated `src/kanji-data.js` is shared under CC BY-SA 4.0.
- Fonts: Mochiy Pop One, M PLUS Rounded 1c, Klee One (Google Fonts, SIL Open Font License).
