# Oishii おいしい

A cute Japanese learning game for two adult beginners. Learn kana, then climb a route of 2,211 JLPT kanji from N5 to N1 in sub-levels of ten, take kanji apart into radicals, match them to meanings, feed sushi to your buds, collect 駅スタンプ (station stamps) for every kanji you clear, and play eight daily puzzles together.

## Play

It's a single static page. Open `index.html` in a browser, or serve the repo root with any static host (GitHub Pages: Settings → Pages → deploy from `main`, root folder). On a phone, "Add to Home Screen" gives it an app icon.

Progress is saved per device in the browser (localStorage).

## What's in it

- **Today:** your next kanji stop and grammar stop, kanji and grammar reviews, and JLPT N5 readiness (kana, N5 kanji, N5 grammar, reading), with the exam's sections and pass marks from jlpt.jp.
- **Grammar (the road):** walk the old Tōkaidō from Nihonbashi, one post town per stop. Each teaches JLPT N5 grammar with a card (pattern, how to make it, notes) and real sentences by native speakers that you can tap for readings, meanings and English; a drill in the JLPT's styles (choose the particle or form, make the verb form, what does it mean); and reading practice with a quick check. Chapter 1 runs to Hakone (27 N5 points, polite style) chapter 2 on to Mariko (20 more: wants, ている, time, plain forms, reasons, rules, before and after, comparisons) and chapter 3 on to Maisaka on Lake Hamana (20 more: lists, amounts, change, experience, while/after/when, and describing nouns with verbs). Kanji you've stamped show in the sentences; everything else is kana.
- **The line (Kanji tab):** a rail trip across Japan. Every sub-level is a real station (228 in all), from Tokyo for kana, down the Tōkaidō for N5, through Kansai, Kyushu, Shikoku, the Alps and Tōhoku, to Wakkanai, Japan's northernmost station, at the end of N1. Clearing a sub-level lays track on the map and earns that station's 駅スタンプ. Kana come first (6 stops), then JLPT N5 → N1 in sub-levels of 10 kanji. Each stop has study cards (meanings, on'yomi and kun'yomi with romaji, and the radicals that build the kanji) and a clear test. Mistakes come back until you get them, WaniKani style; 0–1 mistakes earns ★★★. Clearing a stop stamps its kanji.
- **Garden:** trade in your stamps for seeds (they stay in your stamp book), then buy flowers, veggies, trees and decor in the garden shop. Plant them, water them up through their stages, clear more land, and twelve garden friends move in when the garden suits them. Harvest grown veggies (and cherry blossoms) into a pantry and cook real Japanese dishes in the Oishii kitchen (curry rice, hot pot, hanami dango, kakigōri…) for a recipe book; learn the Japanese names of everything in Garden words; name your garden and grow its rank from Sprout patch to Imperial garden. The sky follows your clock and the season (sakura petals in spring, maple leaves in autumn, snow in winter) as scenery only.
- **Secret ticket:** tap the little train on the line five times to unlock up to any stop (stamps and stars still have to be earned).
- **Review:** a mixed quiz of your stamped kanji and learned kana, weighted toward the ones you miss.
- **Radical Builder:** pick the radicals that make up a kanji, and spot a kanji from its parts.
- **Meaning Match:** pair kanji with their meanings against the clock.
- **Sushi Belt:** buds order stamped kanji by picture and meaning; drag them the right plate. Look-alike decoys, combos, plate prices, levelling buds.
- **Transfer Chain:** ride from one kanji to another by linking real two-kanji words (東京 → 京都 → 都市 → …); each word's second kanji is where you change trains. Fewest rides wins, and the destination often comes from your latest stop.
- **More daily puzzles** (same seed for both players): Petal Guess, Garden Plot, Garden Logic, Missing Half, Number Line, Chef's Special. Every game has endless mode and 10 levels with stars, and every past day stays playable in the archive.
- **Collection:** a station stamp for every stop, a kanji stamp for every kanji (one page per JLPT level), trophies, route and puzzle stars, and a completion meter. No streaks, nothing expires.
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
- `src/compound-data.js` — generated: common two-kanji words for Transfer Chain (`tools/make_compounds.py`)
- `src/deck-data.js` — generated: each kanji's checked main reading and meaning, and its example words (`tools/kanji_deck.py`)
- `src/photo-data.js` — generated: approved town photos with credits (`tools/photos.tsv` + `assets/photos/`, `python3 tools/make_photo_data.py`)
- `src/ground-data.js` — generated: which stop teaches which N5/N4 kanji and why (`tools/ground_kanji.py`)
- `src/route-data.js` — generated stations and map outline (edit `tools/route.tsv`, then run `tools/make_route_data.py`)
- `src/rail.js` — the rail map, station cards and station stamps
- `src/core.js` — state, helpers, drag and drop, sounds, stamps, kana typing
- `src/learn.js` — app shell, the route, study cards, quiz engine, review, stamp book, settings
- `src/sushi.js` — Sushi Belt
- `src/home.js` — the Today tab and the Play tab
- `src/grammar.js` — the grammar road: cards, drills, reading practice, review
- `src/grammar-data.js` — generated: post towns, grammar points, native sentences and verb drills (`tools/grammar_build.py`)
- `src/garden.js` — the Garden tab: stamp trade-in, shop, plots, garden friends
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

### Regenerating the kanji deck (main readings, meanings, example words)

KANJIDIC2 lists a kanji's readings in no useful order, so the cards used to lead with rare ones (食 くう, 午 うま, 天 あまつ). `tools/kanji_deck.py` checks every kanji against open data only: which reading the common JMdict words use, weighted by how often each word appears, with per-kanji furigana; and if the kanji is a word on its own in Jonathan Waller's JLPT lists (本 ほん, 食べる たべる), that word leads. Judgment calls are hand-checked with a reason in `tools/kanji_primary_review.tsv`, and every change is listed with its evidence in `tools/kanji_deck_report.tsv`.

Waller's lists are in `tools/waller_vocab.tsv`, fetched verbatim by `tools/fetch_waller.py` from the Internet Archive's copies of tanos.co.uk (the site is offline). Other downloads: `jmdict-eng-common-*.json` (as below) and `JmdictFurigana.txt` from [Doublevil/JmdictFurigana](https://github.com/Doublevil/JmdictFurigana/releases). Then:

```
pip install wordfreq
python3 tools/kanji_deck.py jmdict-eng-common-*.json JmdictFurigana.txt
python3 tools/kanji_deck.py jmdict-eng-common-*.json JmdictFurigana.txt --doubtful   # kept readings far less used than another
```

### Regenerating the grammar road

Grammar points and their explanations are hand-written in `tools/grammar_points.json` (checked against Tae Kim's Guide to Learning Japanese). Example and reading sentences are never written by hand: `tools/grammar_build.py` picks Tatoeba sentences written by native Japanese speakers, translated by native English speakers, with human-checked furigana that the UniDic parser agrees with (or that JMdict lists for that word), using only N5/N4 words (N3 only to top up thin points) and only grammar already taught by that stop. It writes `src/grammar-data.js` and `tools/grammar_report.txt` (every chosen sentence with its Tatoeba id). Download from [tatoeba.org/downloads](https://tatoeba.org/en/downloads) into one folder: `jpn_sentences_detailed.tsv`, `eng_sentences_detailed.tsv`, `jpn-eng_links.tsv` (per-language exports), `user_languages.csv` and `transcriptions.csv`. Then:

```
pip install fugashi unidic-lite
python3 tools/grammar_build.py tatoeba/ jmdict-eng-common-*.json JmdictFurigana.txt
```

### Regenerating the Transfer Chain words

Transfer Chain uses common two-kanji words from JMdict. Download `jmdict-eng-common-*.json.tgz` from [scriptin/jmdict-simplified](https://github.com/scriptin/jmdict-simplified/releases), unpack it, then run:

```
python3 tools/make_compounds.py jmdict-eng-common-*.json
```

It writes `src/compound-data.js`: every common word made of two N5–N2 kanji, with a reading and a short meaning.

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
- Two-kanji words for Transfer Chain: [JMdict](https://www.edrdg.org/wiki/index.php/JMdict-EDICT_Dictionary_Project) (EDRDG, CC BY-SA 4.0) via [scriptin/jmdict-simplified](https://github.com/scriptin/jmdict-simplified). The generated `src/compound-data.js` is shared under CC BY-SA 4.0.
- Grammar sentences: [Tatoeba](https://tatoeba.org) (CC BY 2.0 FR; Tanaka Corpus sentences public domain), each kept with its sentence id so its authors can be traced at tatoeba.org/sentences/show/<id>. Words parsed with [UniDic](https://clrd.ninjal.ac.jp/unidic/) (BSD) via [fugashi](https://github.com/polm/fugashi) (MIT) at build time. Grammar explanations are Oishii's own, cross-checked against [Tae Kim's Guide to Learning Japanese](https://guidetojapanese.org/learn/) (CC BY-NC-SA 3.0; nothing copied). N5 exam facts from [jlpt.jp](https://www.jlpt.jp/e/). The generated `src/grammar-data.js` is shared under CC BY-SA 4.0.
- Kanji deck: example words from Jonathan Waller's JLPT word lists (tanos.co.uk, CC BY; `tools/waller_vocab.tsv`), with each word and meaning checked against JMdict; per-kanji furigana from [JmdictFurigana](https://github.com/Doublevil/JmdictFurigana) (CC BY-SA 4.0); word frequencies from [wordfreq](https://github.com/rspeer/wordfreq) (CC BY-SA 4.0), used only for ranking. The generated `src/deck-data.js` is shared under CC BY-SA 4.0.
- Town photos (resized) from Wikimedia Commons, listed with their authors and licences in `tools/photos.tsv` and credited on each postcard: Zenrin Gate by Suicasmo (CC BY-SA 4.0); Ōsanbashi Pier at night by Matthide127 (CC0); Kanagawa Prefectural Office on Nihon Ōdōri by 663highland (CC BY 2.5); Yokohama Station north-west exit by NEO-NEED (CC0).
- Radicals: RADKFILE/KRADFILE by Michael Raine, James Breen and the Electronic Dictionary Research and Development Group, via [@johnmorrisdotca/bushu](https://www.npmjs.com/package/@johnmorrisdotca/bushu). Radical names: [Kanji alive](https://kanjialive.com/) (CC BY 4.0).
- *Radicals and kanji from RADKFILE and KANJIDIC2, the property of the Electronic Dictionary Research and Development Group, used under the Group's licence (https://www.edrdg.org/edrdg/licence.html).* The generated `src/kanji-data.js` is shared under CC BY-SA 4.0.
- Station coordinates: [ekidata](https://www.ekidata.jp/) via [piuccio/open-data-jp-railway-stations](https://github.com/piuccio/open-data-jp-railway-stations). Map of Japan: Global Map Japan, Geospatial Information Authority of Japan (出典: 地球地図日本), via [dataofjapan/land](https://github.com/dataofjapan/land).
- Fonts: Mochiy Pop One, M PLUS Rounded 1c, Klee One (Google Fonts, SIL Open Font License).
