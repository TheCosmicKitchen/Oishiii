"""Build src/deck-data.js: each kanji's main reading and meaning, checked against real usage, plus example words.

  pip install wordfreq
  python3 tools/kanji_deck.py jmdict-eng-common.json JmdictFurigana.txt [--doubtful]

Inputs, all open: JMdict common words (scriptin/jmdict-simplified; EDRDG, CC BY-SA 4.0), JmdictFurigana.txt
(Doublevil/JmdictFurigana, CC BY-SA 4.0), Jonathan Waller's JLPT word lists (tools/waller_vocab.tsv, CC BY), and word
frequencies from wordfreq (CC BY-SA 4.0 data), which only rank things and never ship.

Main reading. KANJIDIC2 lists readings in no useful order, so the card used to lead with rare ones (食 くう, 午 うま).
If the kanji is a word on its own, alone or with okurigana, in Waller's lists no harder than the kanji itself, that word's
reading leads: the word you'd say on seeing it (本 ほん, 食べる たべる, 大きい おおきい). Otherwise we count which of its
readings the common words actually use, weighted by word frequency, reading each character's furigana and the okurigana
that follows it (高い → たか.い, 高まる → たか.まる). The current reading stays if real words use it at least 10% of the time;
otherwise an everyday kun word used 25%+ of the time takes over, or else the most used reading. A change is sure when it
is such a standalone word or kun word, or a reading most common words use (50%+); every other change, and every judgment
call, is hand-checked with a reason in tools/kanji_primary_review.tsv. Never swap a word for its own stem (出 でる → で).
With --doubtful, lists kept readings far less used than another, for a hand check. Most are kun words on purpose
(山 やま, 書 かく): the card leads with the word you would say.

Main meaning, always one of KANJIDIC2's: when the card leads with a word on its own, the meaning that word's JMdict entry
uses (空 そら → "sky", 教える → "teach"). Otherwise the one the kanji's common words mean, weighted by frequency (校: 学校,
高校 → "school", not "exam"), but only when the current first meaning is unused or four times less supported.

Example words: up to three words from Waller's lists, easiest level first and then the most used, no more than one level
harder than the kanji where there are enough, with the third using a different reading where there is one. A word is
kept only if JMdict has the same spelling and reading, and its furigana rebuilds the reading exactly; its meaning is
Waller's when JMdict lists it too, else JMdict's. Kanji with no such words fall back to common JMdict words (zipf 3+).
Writes tools/kanji_deck_report.tsv with every change and its evidence.
"""
import collections, json, os, re, sys
from wordfreq import zipf_frequency

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
jm_path, furi_path = sys.argv[1:3]
tsv = json.loads(re.search(r'const KANJI_TSV = (".*?");\r?\n', open(os.path.join(ROOT, "src", "kanji-data.js"), encoding="utf-8").read(), re.S).group(1))
NUM_ON = set("一二三四五六七八九十百千万")
SPECIAL = {"来": "くる", "入": "はいる"}  # 来る conjugates to き/こ, which KANJIDIC2 files under no reading; 入る is はいる
EXTRA_KUN = {"入": ["はい.る"]}  # missing from our KANJIDIC2 extract, so typed はいる wasn't accepted
MEANING_CASE = {"i": "I", "england": "England", "china": "China", "japan": "Japan", "america": "America", "europe": "Europe", "buddha": "Buddha", "korea": "Korea", "india": "India", "holland": "Holland", "france": "France", "germany": "Germany", "russia": "Russia", "spain": "Spain", "italy": "Italy", "britain": "Britain", "english": "English", "sino-": "Chinese"}
SKIP = {"vulg", "X", "derog", "obsc", "arch", "rare", "sl"}

def hira(s): return "".join(chr(ord(c) - 0x60) if "ァ" <= c <= "ヶ" else c for c in s)
VOICE = dict(zip("がぎぐげござじずぜぞだぢづでどばびぶべぼぱぴぷぺぽ", "かきくけこさしすせそたちつてとはひふへほはひふへほ"))
def unvoice(s): return VOICE.get(s[0], s[0]) + s[1:] if s else s
def matches(stem, got):
    a, b = unvoice(stem), unvoice(got)
    return a == b or (b.endswith("っ") and len(a) == len(b) and a[:-1] == b[:-1] and a[-1] in "くつちきり")
isk = lambda c: "一" <= c <= "鿿" or c == "々"
def tidy(g):
    """Drop bracketed notes (着る "to wear (from the shoulders down)" → "to wear") and cut long glosses at a word."""
    while True:
        t = re.sub(r"\s*\([^()]*\)", "", g)
        if t == g: break
        g = t
    g = g.strip(" ,;") or g
    return g if len(g) <= 32 else g[:32].rsplit(" ", 1)[0].rstrip(",;(") + "…"

K = {}
for line in tsv.split("\n"):
    k, n, s, m, on, kun, r, e = line.split("\t")
    ons, kuns = (on.split(",") if on else []), (kun.split(",") if kun else []) + EXTRA_KUN.get(k, [])
    cur = ((kuns[0] if (k not in NUM_ON and kuns) else (ons[0] if ons else kuns[0]))).replace(".", "").replace("-", "")
    K[k] = dict(n=int(n), ms=m.split(";"), on=ons, kun=kuns, cur=cur)

furi = collections.defaultdict(dict)
for line in open(furi_path, encoding="utf-8-sig"):
    p = line.rstrip("\n").split("|")
    if len(p) == 3: furi[p[0]][p[1]] = p[2]
def segments(word, reading):
    """[(start, end, kana)] per kanji run, or None unless the furigana rebuilds the reading exactly."""
    al = furi.get(word, {}).get(reading)
    if not al: return None
    segs = []
    for seg in al.split(";"):
        pos, kana = seg.split(":"); a, b = (pos.split("-") + [pos])[:2]; segs.append((int(a), int(b), kana))
    out, i = "", 0
    for a, b, kana in segs:
        out += word[i:a] + kana; i = b + 1
    return segs if hira(out + word[i:]) == reading else None

# JMdict: entries by (spelling, reading); per kanji, reading usage (furigana, text after it) and meaning usage,
# both weighted by word frequency; and fallback example words
JM = json.load(open(jm_path, encoding="utf-8"))["words"]
by_form = {}
usage = collections.defaultdict(collections.Counter)
mscore = collections.defaultdict(collections.Counter)
cands = collections.defaultdict(list)
for ent in JM:
    sense = next((s for s in ent["sense"] if not SKIP & set(s.get("misc", [])) and s["gloss"]), None)
    bad = any(SKIP & set(s.get("misc", [])) for s in ent["sense"][:1])
    text = " ; ".join(g["text"].lower() for sn in ent["sense"][:2] for g in sn["gloss"])
    for kx in ent["kanji"]:
        kf = kx["text"]
        rds = [r["text"] for r in ent["kana"] if "*" in r["appliesToKanji"] or kf in r["appliesToKanji"]]
        for rd in rds: by_form.setdefault((kf, hira(rd)), []).append(ent)
        if not kx.get("common"): continue
        rds = [r for r in rds if any(x["text"] == r and x.get("common") for x in ent["kana"])]
        if not rds: continue
        z = zipf_frequency(kf, "ja"); f = 10 ** z / len(rds); nk = sum(map(isk, kf)) or 1
        for ch in set(kf):
            if ch in K:
                for m in K[ch]["ms"]:
                    if re.search(r"(?<![a-z])" + re.escape(m.lower()) + r"(?![a-z])", text): mscore[ch][m] += 10 ** z * (3 if nk == 1 else 1) / nk
        for rd in rds:
            segs = segments(kf, rd)
            if not segs: continue
            for a, b, kana in segs:
                if a == b and kf[a] in K: usage[kf[a]][(kana, kf[a + 1:])] += f
            if sense and not bad and z >= 3 and len(kf) <= 4 and all(c in K or not isk(c) for c in kf):
                for a, b, kana in segs:
                    if a == b and kf[a] in K: cands[kf[a]].append((z, kf, rd, segs, tidy(sense["gloss"][0]["text"]), kana))

# Waller's lists: (level number, zipf, word, reading, segments, meaning, this kanji's kana, JMdict tags)
vocab = collections.defaultdict(list)
for line in open(os.path.join(ROOT, "tools", "waller_vocab.tsv"), encoding="utf-8"):
    if line.startswith("#"): continue
    lv, words, rd, en = line.rstrip("\n").split("\t")
    rd, gloss = hira(rd), re.split(r"[,;]", en)[0].strip()
    for word in re.split(r"[\s/、・]+", words):  # alternative spellings share a cell: 見る 観る
        ents, segs = by_form.get((word, rd), []), segments(word, rd)
        if not word or not ents or not segs: continue  # kana-only, or not in JMdict with this spelling and reading
        gl = lambda e: [g["text"].lower() for sn in e["sense"] for g in sn["gloss"]]
        ent = next((e for e in ents if gloss.lower() in gl(e)), ents[0])  # 円 えん: the "yen" entry, not "circle"
        g = gloss if gloss.lower() in gl(ent) else ent["sense"][0]["gloss"][0]["text"]  # JMdict's when Waller's isn't listed
        tags = set(ent["sense"][0].get("partOfSpeech", [])) | ({"uk"} if "uk" in ent["sense"][0].get("misc", []) else set())
        for a, b, kana in segs:
            if a == b and word[a] in K: vocab[word[a]].append((int(lv[1]), zipf_frequency(word, "ja"), word, rd, segs, tidy(g), kana, tags, gl(ent)))
        break

review = {}
for line in open(os.path.join(ROOT, "tools", "kanji_primary_review.tsv"), encoding="utf-8"):
    if line.strip() and not line.startswith("#"):
        k, use, note = line.rstrip("\n").split("\t"); review[k] = use

rows, report, unsure, doubtful = [], [], [], []
for k, d in K.items():
    cs = [c.replace("-", "") for c in [hira(x) for x in d["on"]] + d["kun"]]
    kuns = [c.replace(".", "").replace("-", "") for c in d["kun"]]
    share = collections.Counter(); raw = collections.Counter(); tot = sum(usage[k].values()) or 1
    for (got, follow), v in usage[k].items():
        raw[unvoice(got)] += v / tot
        hit = [c for c in cs if matches(c.split(".")[0], got)]
        if not hit: continue
        # several readings share a stem: the one whose okurigana the word goes on with; else a bare reading (出口 → で);
        # else the shortest okurigana (高さ → たかい)
        oku = [c for c in hit if "." in c and follow.startswith(c.split(".")[1])]
        pick = max(oku, key=len) if oku else next((c for c in hit if "." not in c), None) or min(hit, key=len)
        share[pick.replace(".", "")] += v / tot
    cur, new = d["cur"], SPECIAL.get(k)
    if not new and k in review: new = cur if review[k] == "keep" else review[k]
    # a word on its own: the kanji alone or with okurigana, in vocabulary no harder than the kanji (higher n = easier);
    # not pre-noun adjectives (大きな), adverbs (特に), words usually written in kana (有る), or rare readings (度 たび)
    alone = sorted((x for x in vocab[k] if k not in NUM_ON and x[0] >= d["n"] and sum(map(isk, x[2])) == 1 and x[2][0] == k
                    and not {"adj-pn", "adv", "uk"} & x[7] and raw[unvoice(x[6])] >= .10),
                   key=lambda x: (-x[0], -x[1], -raw[unvoice(x[6])]))
    if not new and alone: new = cur if any(x[3] == cur for x in alone) and share[cur] >= .10 else alone[0][3]
    if not new:
        kunword = max((c for c in share if c in kuns and share[c] >= .25), key=share.get, default=None)
        new = cur if share[cur] >= .10 or not share else kunword or max(share, key=share.get)
        if new != cur and new in kuns and cur in kuns and (cur.startswith(new) or new.startswith(cur[:2])): new = cur
        if new != cur and not (new == kunword or share[new] >= .50): unsure.append(f"{k}:{cur}→{new}({share[new]:.0%})")
    if new == cur and k not in review and share and max(share.values()) >= 3 * share[cur] and d["n"] >= 3:
        doubtful.append(f"{k} N{d['n']} {cur} {share[cur]:.0%} vs {max(share, key=share.get)} {max(share.values()):.0%}")
    # meaning: when the card leads with a word on its own, the KANJIDIC2 meaning that word's JMdict entry uses (そら → "sky");
    # otherwise the one the common words use, only when it is far better supported than the current first one
    own = next((x for x in alone if x[3] == new), None)
    hits = [m for m in d["ms"] if own and any(re.search(r"(?<![a-z])" + re.escape(m.lower()) + r"(?![a-z])", g) for g in own[8])]
    sc = mscore[k]; best = max(d["ms"], key=lambda m: sc[m])
    if hits: meaning = d["ms"][0] if d["ms"][0] in hits else hits[0]
    else: meaning = best if sc[best] > 0 and (sc[d["ms"][0]] == 0 or sc[best] >= 4 * sc[d["ms"][0]]) else d["ms"][0]
    meaning = MEANING_CASE.get(meaning, meaning)
    # example words: the kanji's own word first, then most used, then one with another reading
    near = [x for x in vocab[k] if x[0] >= d["n"] - 1]  # no more than one level harder than the kanji, if there are enough
    pool = [(x[1] + 10 * x[0], x[2], x[3], x[4], x[5], x[6]) for x in (near if len(near) >= 2 else vocab[k])]
    if not pool: pool = [c for c in cands[k] if all(isk(ch) or "ぁ" <= ch <= "ゖ" for ch in c[1])]
    ranked = sorted(pool, key=lambda x: -x[0])
    if alone and alone[0][3] == new: ranked = sorted(ranked, key=lambda x: x[1] != alone[0][2])
    ex = []
    for c in ranked:
        if len(ex) < 2 and c[1] not in (e[1] for e in ex): ex.append(c)
    rest = [c for c in ranked if c[1] not in (e[1] for e in ex)]
    other = next((c for c in rest if all(not matches(c[5], e[5]) for e in ex)), None)
    if len(ex) == 2 and (other or rest): ex.append(other or rest[0])
    exs = ["|".join([kf, rd, ";".join(f"{a}{'-' + str(b) if b != a else ''}:{kana}" for a, b, kana in segs), gloss]) for z, kf, rd, segs, gloss, kana in ex]
    known = set(kuns) | {hira(x).replace("-", "") for x in d["on"]}
    extra = ",".join(EXTRA_KUN.get(k, []) + ([new] if new not in known and k not in EXTRA_KUN else []))
    rows.append("\t".join([k, new if new != cur else "", meaning if meaning != d["ms"][0] else "", extra] + exs))
    if new != cur or meaning != d["ms"][0]:
        report.append("\t".join([k, "N%d" % d["n"], cur, new, "%.0f%%" % (100 * share[cur]), "%.0f%%" % (100 * share[new]), d["ms"][0], meaning]))

if "--doubtful" in sys.argv:
    print("\n".join(doubtful)); sys.exit(0)
if unsure:
    sys.exit("Hand-check these and add them to tools/kanji_primary_review.tsv: " + " ".join(unsure))
js = ("// ===== Kanji deck: checked main readings and meanings, and example words =====\n"
      "// Built by tools/kanji_deck.py from JMdict and KANJIDIC2 (EDRDG, CC BY-SA 4.0), JmdictFurigana (CC BY-SA 4.0), Jonathan\n"
      "// Waller's JLPT word lists (CC BY) and wordfreq (CC BY-SA 4.0). Each line: kanji, main reading (if changed), main meaning\n"
      "// (if changed), extra kun readings, then up to three example words as word|reading|furigana per kanji|meaning.\n"
      "// Do not edit by hand.\n"
      "const DECK_TSV = " + json.dumps("\n".join(rows), ensure_ascii=False) + ";\n")
open(os.path.join(ROOT, "src", "deck-data.js"), "w", encoding="utf-8", newline="\n").write(js)
open(os.path.join(ROOT, "tools", "kanji_deck_report.tsv"), "w", encoding="utf-8", newline="\n").write(
    "kanji\tlevel\tfrom_reading\tto_reading\tfrom_share\tto_share\tfrom_meaning\tto_meaning\n" + "\n".join(report) + "\n")
nr = sum(1 for r in report if r.split("\t")[2] != r.split("\t")[3])
print(f"{len(rows)} kanji: {nr} readings and {len(report) - nr} meanings-only changed; "
      f"{sum(1 for r in rows if r.count(chr(9)) >= 4)} with example words; {len(js.encode('utf-8')) // 1024} KB")
