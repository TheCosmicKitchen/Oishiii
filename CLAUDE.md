# Oishii おいしい

A cute Japanese learning game for two adult beginners (a couple). One plays the **Kana speller** (romaji helper, reading choices), the other the **Kanji reader** (WaniKani ~level 10, typed readings, bare kanji). Read `STYLE_GUIDE.md` before any change; keep the look consistent across updates.

## Non-negotiable design rules
- **Completion and collection, never engagement.** No streaks, no decay or wilting, no expiring content, no "come back tomorrow" pressure. Everything is permanent and collectable (station stamps, kanji stamps, trophies, stars, archive). Grind is always available.
- **Very cute.** Fluent Emoji 3D art (embedded as WebP data URIs in `assets/emoji.json`), soft spring palette, bouncy animations. Stamps carry no emoji.
- **Show romaji alongside kana** for the kana role. Typing converts romaji to kana like WaniKani (WanaKana).
- **Start from kana; quiz only what's been learned/stamped.**
- **The garden/planting metaphor was removed** after playtesting. Don't bring it back.
- Progress is saved per device (localStorage). That's intended.

## Structure
- Learning is **the line**: a rail trip of 228 real stations (`tools/route.tsv`). Each station is a sub-level: 6 kana stops (Tokyo), then all 2,211 JLPT kanji N5 → N1 in sub-levels of 10. Clearing one lays track on the map and earns a station stamp; its kanji get kanji stamps.
- Games: Radical Builder, Meaning Match, Sushi Belt, Petal Guess, Garden Plot, Garden Logic, Missing Half, Number Line. Each has dailies (same seed for both players), endless mode, 10 levels and a rally card.
- Hidden "secret ticket": tap the train on the map 5× to unlock up to any stop (stamps still earned).

## Working on it
- Edit `src/`, then `python3 build.py`. It writes `index.html` (served by GitHub Pages at https://thecosmickitchen.github.io/Oishiii/) and `dist/oishii.html` (the Claude artifact version).
- `src/kanji-data.js` and `src/route-data.js` are generated; regenerate with the scripts in `tools/` (see README). Don't edit them by hand.
- Facts on station cards must be real and verifiable; keep them to one short line.
- Keep the README credits for KANJIDIC2/RADKFILE (EDRDG, CC BY-SA 4.0), Kanji alive, Tanos JLPT lists, ekidata and Global Map Japan.
- Test with a headless browser (Playwright is available) at 400px wide in light and dark before pushing.
