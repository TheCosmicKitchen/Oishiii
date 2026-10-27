# Oishii おいしい

A cute Japanese learning game for two adult beginners. Grow kana in a garden, pop kanji out of the Kanji Pot, feed sushi to your buds, collect 駅スタンプ (station stamps) for every kanji you learn, and play six daily puzzles together.

## Play

It's a single static page. Open `index.html` in a browser, or serve the repo root with any static host (GitHub Pages: Settings → Pages → deploy from `main`, root folder). On a phone, "Add to Home Screen" gives it an app icon.

Progress is saved per device in the browser (localStorage).

## What's in it

- **Garden:** plant hiragana row by row, water them with quick quizzes, watch them grow from sprout to bud to bloom.
- **Kanji Pot:** a flower pot where you spell a word's reading with your grown kana (plus ゛ and small kana from the extras bed) and the kanji grows out and gets stamped.
- **Quiz what you've learned:** every game only uses kana you've planted and kanji you've stamped, and unlocks once you have enough of them.
- **Sushi Belt:** buds order by picture; drag them the right plate before they get grumpy. Look-alike decoys, combos, plate prices, levelling buds.
- **Daily puzzles** (same puzzles for both players each day): Petal Guess, Garden Plot, Garden Logic, Missing Half, Number Line, Chef's Special. Endless mode for each.
- **Levels & rally cards:** each game has 10 levels worth up to ★★★; clearing one stamps that game's rally card in bronze, silver or gold.
- **Collection:** a stamp for every kanji, 49 trophies, page-complete seals, and an overall completion meter.
- **Puzzle archive:** every past day's puzzles stay playable, so nothing expires and there's always more to complete.
- **Two roles:** Kana speller (kana + romaji) and Kanji reader (bare kanji, WaniKani style). Typing converts romaji to kana like WaniKani.

## Develop

Edit files in `src/`, then rebuild:

```
python3 build.py
```

This writes `index.html` (full standalone page) and `dist/oishii.html` (page body for publishing as a Claude artifact).

- `src/data.js` — kana, vocabulary, kanji parts, puzzle content
- `src/core.js` — state, helpers, drag and drop, sounds, stamps, kana typing
- `src/garden.js` — app shell, garden, Kanji Pot, stamp book, settings
- `src/sushi.js` — Sushi Belt
- `src/puzzles.js` — the daily puzzles
- `src/style.css` — all styles and color tokens
- `assets/emoji.json` — Fluent Emoji images embedded as WebP data URIs (regenerate with `python3 tools/fetch_emoji.py`)

See [STYLE_GUIDE.md](STYLE_GUIDE.md) for the look and feel and the roadmap.

## Credits

- Emoji art: [Microsoft Fluent Emoji](https://github.com/microsoft/fluentui-emoji) (MIT License).
- Romaji-to-kana typing: [WanaKana](https://github.com/WaniKani/WanaKana) (MIT License), loaded from jsDelivr.
- Fonts: Mochiy Pop One, M PLUS Rounded 1c, Klee One (Google Fonts, SIL Open Font License).
