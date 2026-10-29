"""Build src/ground-data.js: deal each grounded JLPT level's kanji to the stops where they really appear.

  python3 tools/ground_kanji.py stations.json

For every stop on a grounded level, a kanji can be tied to it by the stop's own name, by a real local word from
tools/local_words.tsv (a landmark, food or nickname), or by the name of a real station within 25 km (ekidata, via
piuccio/open-data-jp-railway-stations), closer stations first. Kanji stay inside their JLPT level;
rarest ties are placed first, each at a tied stop no more than WINDOW stops from its old place in the frequency
order, so easy kanji still come early. Kanji with no tie fill the gaps in frequency order. Every city also teaches one local special
(名物) kanji borrowed from a later level, listed in tools/meibutsu.tsv. Prints a report of what it placed."""
import json, math, os, re, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GROUNDED = ["n5", "n4"]  # levels dealt by place; later levels keep frequency order for now
RADIUS_KM = 25
WINDOW = 1 / 3  # a kanji moves at most this share of its level's stops from its place in frequency order

rd = lambda *p: open(os.path.join(ROOT, *p), encoding="utf-8").read()
tsv = re.search(r'const KANJI_TSV = "(.*?)";\n', rd("src", "kanji-data.js"), re.S).group(1)
KJ = [l.split("\t") for l in json.loads('"' + tsv + '"').split("\n")]
level = {k: "n" + n for k, n, *_ in KJ}
order = {k: i for i, (k, *_) in enumerate(KJ)}
rows = [l.rstrip("\r\n").split("\t") for l in open(os.path.join(ROOT, "tools", "route.tsv"), encoding="utf-8") if l.strip() and not l.startswith("#")]
meis = {r[0]: r[1:] for r in (l.rstrip("\r\n").split("\t") for l in open(os.path.join(ROOT, "tools", "meibutsu.tsv"), encoding="utf-8") if l.strip() and not l.startswith("#"))}
MEI_K = {v[0] for v in meis.values()}
words = {}
for r in (l.rstrip("\r\n").split("\t") for l in open(os.path.join(ROOT, "tools", "local_words.tsv"), encoding="utf-8") if l.strip() and not l.startswith("#")):
    words.setdefault(r[0], []).append(r[1:4])
stations = json.load(open(sys.argv[1], encoding="utf-8"))

pos = {}
for g in stations:
    for s in g["stations"]:
        pos.setdefault((s["name_kanji"], int(s["prefecture"])), []).append((s["lat"], s["lon"]))
pts = [(g["name_kanji"], s["lat"], s["lon"]) for g in stations for s in g["stations"]]
km = lambda a, b: math.hypot((a[0] - b[0]) * 111.0, (a[1] - b[1]) * 111.0 * math.cos(math.radians(a[0])))

def ties_for(row):
    """kanji -> (score, tie) for one stop. 4 = in the stop's own name, 3.5 = in one of its local words, then a station
    sign by distance: 2.5 within 8 km, 2 within 15, 1.5 within 25"""
    st, place, pref = row[1], row[2], int(row[5])
    c = pos[(st, pref)]; here = (sum(p[0] for p in c) / len(c), sum(p[1] for p in c) / len(c))
    best = {}
    for name, lat, lon in pts:
        d = km(here, (lat, lon))
        if d > RADIUS_KM: continue
        sc = 2.5 if d <= 8 else 2 if d <= 15 else 1.5
        for ch in set(name):
            if ch not in best or d < best[ch][2]: best[ch] = (sc, ["st", name, round(d)], d)
    for word, reading, meaning in words.get(place, []):
        for ch in set(word): best[ch] = (3.5, ["word", word, reading, meaning], 0)
    for ch in set(place + st): best[ch] = (4, ["st", st, 0], 0)
    return best

GROUND, TIES, report = {}, {}, []
for lv in GROUNDED:
    stops = [r for r in rows if r[0] == lv]
    borrowed = [meis[r[2]][0] for r in stops if r[2] in meis]
    pool = [k for k, *_ in KJ if level[k] == lv and k not in MEI_K]
    n = len(stops); base, extra = divmod(len(pool), n)
    cap = [base + (1 if i < extra else 0) for i in range(n)]
    home = {}; acc = 0  # where each kanji sat in plain frequency order
    for i, c in enumerate(cap):
        for k in pool[acc:acc + c]: home[k] = i
        acc += c
    tie = [ties_for(r) for r in stops]
    got = [[] for _ in stops]
    cands = {k: [i for i in range(n) if k in tie[i]] for k in pool}
    for k in sorted(pool, key=lambda k: (len(cands[k]) or 99, order[k])):
        if not cands[k]: continue
        reach = lambda i: max(3, round(n * WINDOW * (2 if tie[i][k][0] >= 3.5 else 1)))  # local words and own names may move further
        free = [i for i in cands[k] if len(got[i]) < cap[i] and abs(i - home[k]) <= reach(i)]
        if not free: continue
        i = min(free, key=lambda i: (abs(i - home[k]) - 1.2 * tie[i][k][0], i))
        got[i].append(k); TIES[k] = tie[i][k][1]
    for k in pool:  # no tie: fill gaps nearest the kanji's old place
        if k in TIES: continue
        i = min((i for i in range(n) if len(got[i]) < cap[i]), key=lambda i: (abs(i - home[k]), i)); got[i].append(k)
    out = []
    for i, r in enumerate(stops):
        ks = sorted(got[i], key=lambda k: order[k])
        if r[2] in meis:
            k, word, reading, meaning, why = meis[r[2]]
            assert int(level[k][1]) < int(lv[1]), f"{k} at {r[2]} is not from a later level"
            ks.append(k); TIES[k] = ["mei", word, reading, meaning, why]
        out.append("".join(ks))
        report.append(f"{lv} {r[2]}: {''.join(ks)}  tied {sum(1 for k in ks if k in TIES)}/{len(ks)}")
    GROUND[lv] = out
    placed = [TIES[k] for k in pool if k in TIES]
    kinds = {"own name": sum(t[0] == "st" and t[2] == 0 for t in placed), "local word": sum(t[0] == "word" for t in placed),
             "station <=15 km": sum(t[0] == "st" and 0 < t[2] <= 15 for t in placed), "station 16-25 km": sum(t[0] == "st" and t[2] > 15 for t in placed)}
    print(f"{lv}: {len(placed)}/{len(pool)} kanji tied to their stop ({round(100 * len(placed) / len(pool))}%), {len(borrowed)} local specials; {kinds}")

print("\n".join(report))
js = ("// ===== Kanji grounded in places: which stop teaches which kanji, and why it belongs there =====\n"
      "// Station names: ekidata (ekidata.jp) via piuccio/open-data-jp-railway-stations. Local words and specials: tools/local_words.tsv, tools/meibutsu.tsv.\n"
      "// Generated by tools/ground_kanji.py; do not edit by hand.\n"
      "const GROUND = " + json.dumps(GROUND, ensure_ascii=False) + ";\n"
      "const TIES = " + json.dumps(TIES, ensure_ascii=False, separators=(",", ":")) + ";\n"
      "const LOCAL_WORDS = " + json.dumps(words, ensure_ascii=False, separators=(",", ":")) + ";\n")
open(os.path.join(ROOT, "src", "ground-data.js"), "w", encoding="utf-8").write(js)
