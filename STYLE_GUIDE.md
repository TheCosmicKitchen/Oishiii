# Oishii style guide & roadmap

## Players
- Two adult beginners. One is the **Kana speller** (romaji helper on), one is the **Kanji reader** (WaniKani around level 10, strong recognition, loves cute things and daily puzzle games, loved her trip to Japan).
- Every activity has two layers: the kana role sees kana + romaji; the kanji role sees bare kanji, with readings revealed after answering.
- Always show romaji alongside kana for the kana role. Typing works like WaniKani: romaji converts to kana live (WanaKana 5.3.1 from jsDelivr, with a built-in fallback).

## Design rule: completion, never engagement
She hates engagement mechanics. No streaks, no wilting or decay, no "come back tomorrow" pressure, no expiring content. Everything is permanent and collectable: stamps, trophies, rally-card stars, and a puzzle archive that keeps every past day playable forever. Grind should always be available (endless modes, levels, archive).

## Progression rule: start from kana, quiz only what you've stamped
Everyone starts in the garden with kana (the Kanji Reader can plant all hiragana at once). Kanji are discovered in the Kanji Pot (spell the reading with planted kana; the extras bed adds ゛ ゃ ゅ ょ っ) or built in Missing Half, and every discovery is stamped. Quizzes and games only use planted kana and stamped kanji; each game unlocks once you have enough to play it (shown as "Next unlocks" in the garden).

## Look and feel (keep consistent)
- **Theme:** a pocket kitchen garden. Soil-brown beds, wooden stakes with kana, sakura-pink accents, leaf greens, sky blue. Very cute: bouncy pops, sakura confetti, buds that talk (おいしい！, うまい！, ちがう…, もう…).
- **The Kanji Pot is a flower pot** (Fluent 'Potted plant'), never a honey pot.
- **Art:** Microsoft Fluent Emoji **3D** only, embedded as 112px WebP data URIs.
- **Fonts:** Mochiy Pop One (headings), M PLUS Rounded 1c (body), Klee One (every kana/kanji glyph you learn from, for textbook handwriting shapes).
- **Color tokens (light):** bg `#F1F6EA`, surface `#FFFFFF`, surface-2 `#E5EFDC`, ink `#22362A`, leaf `#4E9F69`, sakura `#EE7299`, soil `#9C6B4A`, stake `#E9CFA3`, sun `#F5C24F`, sky `#D3ECF6`. Puzzle colors: good `#3E9A5E`, near `#E6AE2E`, kin (same row or vowel) `#4F9FD0`, bad `#D9534F`. Dark mode is a night garden (`#12201A`).
- **Station stamps:** circular ink stamps on cream paper (`#FBF6EA`), ink color by theme (nature red, animals green, people indigo, food orange, things purple), slightly rotated, reading arched on top and meaning arched on the bottom. A "thunk" animation plays for every new kanji.
- **Sushi plates:** porcelain `#FBF7EE`, rim color sets the price (blue ¥100, pink ¥150, green ¥200, gold ¥500).
- **Trophies:** gold medallions with a Fluent Emoji inside; locked ones are grey silhouettes with a hint. A completed stamp page gets a red 完 (kan, complete) seal. Progress is about collecting and completion — no streaks.
- **Rally cards & levels:** every game has a 10-level ladder (same seed for both players, so stars are comparable). Clearing a level stamps that game's rally card; ink is bronze (★), silver (★★) or gold (★★★). Full card = 完 seal and trophy; all gold = 金 seal and a golden trophy.
- Rounded pill buttons with a 3px bottom shadow; bottom tab bar: Garden / Sushi / Puzzles / Stamps.

## Roadmap
1. **Rail trip across Japan:** the game becomes a train line; each station unlocks its own games, kanji, and a stamp page. A hidden "unlock up to a stop" picker (tap the train five times) opens every station up to the chosen one; stamps are still earned.
2. **Scenes:** konbini (orders, prices, 温めますか), ramen ticket machine (食券機), pet store sorting, station exits, shrine fortunes.
3. **More dailies:** Vine Trace (Strands-style), Bee Sort (Connections-style), Shiritori Chain, Trellis mini-crossword, Seed Storm speed round, kanji sudoku, sign fixer.
4. **Grammar:** particle train, N5 grammar recipes, vocab seeds for scene words.
5. Progress stays per device (decided).
