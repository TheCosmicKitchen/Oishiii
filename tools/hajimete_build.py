"""Build hajimete/data.js: the Japanese for Hajimete, the first-trip page. Nothing in it is hand-written Japanese.

  pip install fugashi unidic-lite
  python3 tools/hajimete_build.py tatoeba/ jmdict-eng.json JmdictFurigana.txt   (the full JMdict, not just common words)

- Each phrase word keeps its part of speech (from UniDic), so the page can join endings to their word in romaji.
- Phrases: Tatoeba sentences (CC BY 2.0 FR), picked by id from short native sentences for each travel need, with a
  chosen English translation that must be by a native English speaker. The Japanese must be by a native speaker, or have
  human-checked furigana, or be all kana. Readings come from human furigana where there is one and must agree with the
  UniDic parser or JMdict; otherwise the parser's reading must match a JMdict word. Set expressions (いただきます,
  お願いします) come from JMdict with its English. A phrase that fails any check is left out and reported.
- Sign words: each must be a JMdict word with that exact spelling and reading; its meaning is JMdict's.
- Katakana words: a chosen list of words travellers meet (menus, hotels, transport); each must be a common JMdict word,
  with JMdict's meaning and Jonathan Waller's JLPT level (CC BY) where it has one.
Writes tools/hajimete_report.txt with what was kept and what was dropped.
"""
import collections, csv, json, os, re, sys
from fugashi import Tagger

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
tdir, jm_path, furi_path = sys.argv[1:4]
csv.field_size_limit(10 ** 9)
TAG = Tagger()
def hira(s): return "".join(chr(ord(c) - 0x60) if "ァ" <= c <= "ヶ" else c for c in s)
isk = lambda c: "一" <= c <= "鿿" or c == "々"
def rows(name): return csv.reader(open(os.path.join(tdir, name), encoding="utf-8"), delimiter="\t", quoting=csv.QUOTE_NONE)
def tidy(g):
    while True:
        t = re.sub(r"\s*\([^()]*\)", "", g)
        if t == g: break
        g = t
    return g.strip(" ,;") or g

JM = json.load(open(jm_path, encoding="utf-8"))["words"]
PAIRS = {}
for e in JM:
    for k in e["kanji"] or e["kana"]:
        for r in e["kana"]:
            if e["kanji"] and not ("*" in r["appliesToKanji"] or k["text"] in r["appliesToKanji"]): continue
            PAIRS.setdefault((k["text"], r["text"]), e)
KANA_ENT, KANA_COMMON = {}, set()
for e in JM:
    for r in e["kana"]:
        if r.get("common") and r["text"] not in KANA_COMMON: KANA_ENT[r["text"]] = e; KANA_COMMON.add(r["text"])  # the common entry wins
        else: KANA_ENT.setdefault(r["text"], e)
furi = collections.defaultdict(dict)
for line in open(furi_path, encoding="utf-8-sig"):
    p = line.rstrip("\n").split("|")
    if len(p) == 3: furi[p[0]][p[1]] = p[2]
def segs_of(word, reading):
    al = furi.get(word, {}).get(reading)
    if not al: return None
    out = []
    for seg in al.split(";"):
        pos, kana = seg.split(":"); a, b = (pos.split("-") + [pos])[:2]; out.append([int(a), int(b), kana])
    return out
report = []

# ---- phrases, by scene: Tatoeba sentence id and the English to show (both checked below), or a JMdict set expression
PICKS = [
    ("basics", 408301, "Excuse me."), ("basics", 11831589, "Thank you very much."), ("basics", "お願いします", "おねがいします"),
    ("basics", 2304911, None), ("basics", 2270779, "I don't understand it."), ("basics", 189023, None), ("basics", 214165, None),
    ("basics", 194120, "Please speak a little more slowly."),
    ("food", "頂きます", "いただきます"), ("food", 10100070, None), ("food", 12890046, None), ("food", 143718, None), ("food", 8583430, "Please give me this."),
    ("food", 12890061, "It's delicious."), ("food", 12890072, None), ("food", 184053, None),
    ("food", 3549484, "Do you have an English menu?"), ("food", 227687, "What do you recommend?"),
    ("shopping", 5332, None), ("shopping", 344924, "What's this?"), ("shopping", 226473, "Can I pay by credit card?"), ("shopping", 2413217, None),
    ("shopping", 11890833, "Can I pay in cash?"), ("shopping", 12024148, "I don't need a receipt."),  # not 12024147 レシートはいりません: the parser reads 入りません
    ("getting around", 188894, None), ("getting around", 201726, None), ("getting around", 8727059, None), ("getting around", 123603, "I got lost."),
    ("getting around", 11265000, "Is this the right train for Tokyo?"),
    ("help", 1039551, "Help me, please."), ("help", 176088, "Please call the police."), ("help", 182412, None), ("help", 10647294, "Where is the nearest hospital?"),
]
native = collections.defaultdict(set)
for r in rows("user_languages.csv"):
    if len(r) > 2 and r[1] == "5": native[r[0]].add(r[2])
ids = {str(x[1]) for x in PICKS if isinstance(x[1], int)}
links = collections.defaultdict(list)
for r in rows("jpn-eng_links.tsv"):
    if r[0] in ids: links[r[0]].append(r[1])
jpn = {r[0]: (r[2], r[3]) for r in rows("jpn_sentences_detailed.tsv") if r[0] in ids}
need = {e for xs in links.values() for e in xs}
eng = {r[0]: (r[2], r[3]) for r in rows("eng_sentences_detailed.tsv") if r[0] in need}
trans = {r[0]: r[4] for r in rows("transcriptions.csv") if r[1] == "jpn" and r[3] and r[0] in ids}

def parse_trans(t):
    out, segs = "", []
    for m in re.finditer(r"\[([^|\]]+)\|([^\]]+)\]|([^\[]+)", t):
        if m.group(3): out += m.group(3); continue
        k, rs = m.group(1), m.group(2).split("|")
        if len(rs) == len(k):
            for i, r in enumerate(rs): segs.append([len(out) + i, len(out) + i, r])
        else: segs.append([len(out), len(out) + len(k) - 1, "".join(rs)])
        out += k
    return out, segs

def reading_of(sid, ja):
    """[(text, kana, segs)] per word, or None. Human furigana first (checked against the parser or JMdict), else the
    parser's reading checked against JMdict."""
    ts = [(w.surface, hira(w.feature.kana or w.surface), w.feature.orthBase or w.surface, w.feature.pos1, w.feature.pos2 or "") for w in TAG(ja)]
    hs = None
    if sid in trans:
        plain, hs = parse_trans(trans[sid])
        if plain != ja: hs = None
    out, pos = [], 0
    byc = {c: s0 for s0 in (hs or []) for c in range(s0[0], s0[1] + 1)}
    for surf, kana, base, pos1, pos2 in ts:
        tag = pos1 + ("/" + pos2 if pos2 in ("接続助詞", "係助詞", "格助詞", "終助詞", "副助詞") else "")  # for joining words in romaji
        a = pos; pos += len(surf)
        if not any(isk(c) for c in surf): out.append([surf, hira(surf), [], tag]); continue
        if hs is not None:
            mine, rd, i = [], "", a
            while i < a + len(surf):
                if i in byc:
                    s0 = byc[i]
                    if s0[0] < a or s0[1] >= a + len(surf): return None
                    mine.append([s0[0] - a, s0[1] - a, s0[2]]); rd += s0[2]; i = s0[1] + 1
                elif isk(ja[i]): return None
                else: rd += hira(ja[i]); i += 1
            if rd != kana and (surf, rd) not in PAIRS: return None
            out.append([surf, rd, mine, tag])
        else:
            if (surf, kana) not in PAIRS and (base, kana) not in PAIRS: return None
            sg = segs_of(surf, kana) or [[0, len(surf) - 1, kana]]
            out.append([surf, kana, sg, tag])
    return out

phrases = []
for scene, src, want_en in PICKS:
    if isinstance(src, str):  # a JMdict set expression
        e = PAIRS.get((src, want_en))
        if not e: report.append(f"phrase DROPPED {src} (not in JMdict)"); continue
        show = want_en if "uk" in e["sense"][0].get("misc", []) else src  # usually written in kana (いただきます)
        segs = [] if show == want_en else (segs_of(src, want_en) or [[0, len(src) - 1, want_en]])
        phrases.append(dict(id=0, ja=show + "。", en=tidy(e["sense"][0]["gloss"][0]["text"]).capitalize() + ".", w=[[show, want_en, segs, "感動詞"], ["。", "。", [], "補助記号"]], scene=scene, src="JMdict"))
        report.append(f"phrase kept   {phrases[-1]['ja']} = {phrases[-1]['en']} (JMdict set expression)"); continue
    sid = str(src)
    if sid not in jpn: report.append(f"phrase DROPPED #{sid} (not on Tatoeba)"); continue
    ja, owner = jpn[sid]
    ens = [eng[e] for e in links[sid] if e in eng and eng[e][1] in native["eng"]]
    en = next((t for t, u in ens if want_en is None or t == want_en), None)
    ok_ja = owner in native["jpn"] or sid in trans or not any(isk(c) for c in ja)
    w = reading_of(sid, ja) if ok_ja and en else None
    if not w: report.append(f"phrase DROPPED #{sid} {ja} (native: {owner in native['jpn']}, native English: {bool(en)}, readings: {bool(w)})"); continue
    phrases.append(dict(id=int(sid), ja=ja, en=en, w=w, scene=scene, src="Tatoeba"))
    report.append(f"phrase kept   {ja} | {en} (Tatoeba #{sid}; Japanese by a native speaker: {owner in native['jpn']})")

# ---- sign words: spelling, reading, and where you'll see it (the note is English only)
SIGNS = [
    ("出口", "でぐち", "Stations, shops, car parks"), ("入口", "いりぐち", "Doors and gates"), ("男", "おとこ", "Toilets, baths: men"),
    ("女", "おんな", "Toilets, baths: women"), ("駅", "えき", "Station signs"), ("改札", "かいさつ", "Where you tap your IC card"),
    ("切符", "きっぷ", "Ticket machines"), ("乗り換え", "のりかえ", "Changing trains"), ("番線", "ばんせん", "Platform numbers: 3番線"),
    ("各駅停車", "かくえきていしゃ", "Trains that stop everywhere"), ("快速", "かいそく", "Trains that skip some stops"),
    ("急行", "きゅうこう", "Trains that skip more stops"), ("特急", "とっきゅう", "The fastest trains, often an extra fee"),
    ("優先席", "ゆうせんせき", "Seats for elderly, pregnant or disabled riders"), ("女性専用車", "じょせいせんようしゃ", "Women-only carriage, at busy times"),
    ("指定席", "していせき", "Shinkansen and express trains: cars with booked seats"), ("自由席", "じゆうせき", "Unreserved cars: no booking, sit in any free seat"),
    ("地下鉄", "ちかてつ", "Subway entrances"), ("空港", "くうこう", "Airport trains and buses"), ("北口", "きたぐち", "Station exits. Meet friends at a named exit, not just 'the station'"),
    ("東口", "ひがしぐち", "Station exits"), ("南口", "みなみぐち", "Station exits"), ("西口", "にしぐち", "Station exits"),
    ("男湯", "おとこゆ", "Bath curtains: the men's side"), ("女湯", "おんなゆ", "Bath curtains: the women's side"),
    ("撮影禁止", "さつえいきんし", "Temples, museums and some shops"), ("休業", "きゅうぎょう", "Notices on shop doors, with the dates"),
    ("休日", "きゅうじつ", "Opening hours: the days off"),
    ("お手洗い", "おてあらい", "Toilet signs"), ("化粧室", "けしょうしつ", "Toilet signs in shops and stations"), ("非常口", "ひじょうぐち", "Green signs over doors"),
    ("禁煙", "きんえん", "Most indoor places"), ("喫煙所", "きつえんじょ", "Where smoking is allowed"), ("立入禁止", "たちいりきんし", "Keep out"),
    ("危険", "きけん", "Danger signs"), ("注意", "ちゅうい", "Caution signs"), ("営業中", "えいぎょうちゅう", "On shop and restaurant doors"),
    ("準備中", "じゅんびちゅう", "On restaurant doors between lunch and dinner"), ("定休日", "ていきゅうび", "The shop's regular day off"),
    ("本日", "ほんじつ", "Today's specials and notices"), ("売り切れ", "うりきれ", "Vending machines and menus"), ("無料", "むりょう", "Free Wi-Fi, free refills"),
    ("税込", "ぜいこみ", "Prices that include tax"), ("現金", "げんきん", "Cash only signs: 現金のみ"), ("円", "えん", "Every price tag"),
    ("大人", "おとな", "Ticket prices"), ("子供", "こども", "Ticket prices"), ("食券", "しょっけん", "Buy at the machine before you sit"),
    ("温泉", "おんせん", "Hot spring baths"), ("交番", "こうばん", "Small police posts"), ("病院", "びょういん", "Hospitals"), ("薬局", "やっきょく", "Pharmacies"),
]
# the sense a sign means, where JMdict lists another sense first (急行 "hurrying" before "express")
SIGN_SENSE = {"改札": "ticket gate", "急行": "express", "快速": "rapid", "禁煙": "No Smoking", "注意": "caution", "北口": "north exit",
              "東口": "east exit", "南口": "south exit", "西口": "west exit", "男": "man", "女": "woman", "営業中": "open", "準備中": "in preparation",
              "本日": "today", "大人": "adult", "子供": "child", "円": "yen", "無料": "free of charge", "立入禁止": "No Entry",
              "休業": "temporary closure", "撮影禁止": "no photography", "男湯": "men's bath", "女湯": "women's bath"}
signs = []
for k, r, where in SIGNS:
    e = PAIRS.get((k, r))
    if not e: report.append(f"sign DROPPED {k} {r} (not a JMdict word with this reading)"); continue
    glosses = [tidy(gl["text"]) for sn in e["sense"] for gl in sn["gloss"]]
    want = SIGN_SENSE.get(k)
    g = next((x for x in glosses if want and x.lower() == want.lower()), None) or glosses[0]
    if want and g.lower() != want.lower(): report.append(f"sign NOTE {k}: JMdict has no gloss '{want}', using '{g}'")
    signs.append(dict(k=k, r=r, m=g, where=where, g=segs_of(k, r) or [[0, len(k) - 1, r]]))
    report.append(f"sign kept   {k} {r} = {g}")
# single-kanji door signs: 押 push and 引 pull (KANJIDIC2 meanings)
DOOR = [("押", "おす", "push", "On doors"), ("引", "ひく", "pull", "On doors")]

KATA = re.compile(r"^[ァ-ヶー・]+$")
# ---- katakana words: the ones a traveller meets, in this order; each must be a common JMdict word (Waller's level if it has one)
KATA_PICK = """コーヒー ビール ジュース ミルク お茶 パン バター ジャム ケーキ サラダ サンドイッチ ステーキ カレー ラーメン アイス チーズ
コンビニ カード レシート チケット ロッカー ゲーム
タクシー バス ホテル トイレ レストラン デパート レジ エレベーター エスカレーター ドア スーツケース シャワー スリッパ ベッド テーブル
スプーン フォーク ナイフ カップ コップ ナプキン メニュー カメラ プール ポスト ビル ハンカチ プレゼント コンサート テレビ ニュース
ガソリンスタンド オートバイ アルコール ペン ノート シャツ セーター コート スカート""".split()
waller_kana = {}
for line in open(os.path.join(ROOT, "tools", "waller_vocab.tsv"), encoding="utf-8"):
    if line.startswith("#"): continue
    lv, words, kana, en = line.rstrip("\n").split("\t")
    if lv in ("N5", "N4"):
        for w in re.split(r"[\s/、]+", kana): waller_kana.setdefault(w, lv)
# the sense a traveller meets, added after the first, where JMdict lists it later (アイス "ice", then "ice cream")
KATA_SENSE = {"アイス": "ice cream", "ジュース": "soft drink", "カード": "credit card"}
# where a word came from, from JMdict's source-language notes: only when not plain English
LANG = {"chi": "Chinese", "por": "Portuguese", "dut": "Dutch", "ger": "German", "fre": "French", "ita": "Italian", "spa": "Spanish", "rus": "Russian"}
def origin(e):
    ls = [x for s in e["sense"][:1] for x in s.get("languageSource", [])]
    if not ls or any(x["lang"] == "eng" and not x["wasei"] for x in ls): return ""
    x = ls[0]
    if x["wasei"]: return f"made-in-Japan English ({x['text']})" if x.get("text") else "made-in-Japan English"
    return f"from {LANG.get(x['lang'], x['lang'])}" + (f" {x['text']}" if x.get("text") else "")
kata = []
for w in KATA_PICK:
    if not KATA.match(w): continue  # only katakana words here
    e = KANA_ENT.get(w)
    if not e or w not in KANA_COMMON: report.append(f"katakana DROPPED {w} (not a common JMdict word)"); continue
    m = tidy(e["sense"][0]["gloss"][0]["text"])
    if w in KATA_SENSE:
        g = next((tidy(gl["text"]) for sn in e["sense"][1:] for gl in sn["gloss"] if tidy(gl["text"]).lower() == KATA_SENSE[w]), None)
        if g: m += "; " + g
        else: report.append(f"katakana NOTE {w}: JMdict has no later gloss '{KATA_SENSE[w]}'")
    kata.append(dict(k=w, m=m, n=waller_kana.get(w, ""), o=origin(e)))
    if kata[-1]["o"]: report.append(f"katakana origin {w}: {kata[-1]['o']}")
report.append(f"katakana words: {len(kata)}")

# ---- single kanji, a few per stop, for someone who has never read Japanese: meaning only (KANJIDIC2, via Oishii's
# src/kanji-data.js), a plain-English note on where you'll see it, and an emoji to hang it on. No single-kanji readings:
# a lone kanji has several, so readings come only with whole words (the combos, which are checked JMdict sign words).
# (stop, kanji, the KANJIDIC sense to show (must be one of its meanings; None = its first), where, emoji)
KANJI_PICK = [
    (1, "出", "exit", "On every exit sign. Follow it to get out.", "door"),
    (1, "入", "enter", "On entrances and gates.", "door"),
    (1, "口", "mouth", "On signs it means an opening: a way in or out.", "mouth"),
    (1, "男", "male", "On toilet and bath doors: the men's side.", "boy"),
    (1, "女", "woman", "On toilet and bath doors: the women's side.", "girl"),
    (2, "駅", "station", "Station names end with it.", "station"),
    (2, "東", "east", "Big stations name their exits after directions.", "sunrise"),
    (2, "西", "west", "Exits again: the west side.", None),
    (2, "南", "south", "Exits again: the south side.", None),
    (2, "北", "north", "Exits again: the north side.", None),
    (3, "円", "yen", "On every price: 500円 is 500 yen.", "yen"),
    (3, "大", "big", "Big, and the large size of a drink or bowl.", None),
    (3, "中", "middle", "Middle, and the medium size. It can also mean inside.", None),
    (3, "小", "small", "Small, and the small size.", None),
    (3, "人", "person", "A person. Ticket prices use it.", "person"),
    (4, "押", "push", "On doors and buttons.", "hand"),
    (4, "引", "pull", "On doors, often next to 押.", None),
    (4, "休", "rest", "Rest, or a day off: shops use it when they're closed.", "bed"),
    (4, "日", "day", "A day, and also the sun.", "sun"),
    (4, "水", "water", "Water, on menus and drinks.", "droplet"),
    (5, "温", "warm", "Warm.", None),
    (5, "泉", "spring", "A spring, where water comes up out of the ground.", None),
    (5, "湯", "hot water", "Hot water, and the bath. A big ゆ curtain means a bathhouse.", "onsen"),
]
# sign words built only from kanji met at or before that stop: (stop, word); each must be a kept JMdict sign word
COMBO_PICK = [(1, "出口"), (1, "入口"), (2, "東口"), (2, "西口"), (2, "南口"), (2, "北口"), (3, "大人"), (4, "休日"), (5, "温泉"), (5, "男湯"), (5, "女湯")]
KD = {}
for line in json.loads(re.search(r'const KANJI_TSV = (".*?");', open(os.path.join(ROOT, "src", "kanji-data.js"), encoding="utf-8").read(), re.S).group(1)).split("\n"):
    c = line.split("\t")
    if len(c) > 3: KD.setdefault(c[0], c[3].split(";"))
kanji = []
for stop, k, sense, where, emo in KANJI_PICK:
    ms = KD.get(k)
    if not ms: report.append(f"kanji DROPPED {k} (not in KANJIDIC data)"); continue
    m = sense if sense in ms else None
    if m is None: report.append(f"kanji DROPPED {k} (KANJIDIC has no meaning '{sense}': {ms})"); continue
    kanji.append(dict(k=k, m=m, stop=stop, where=where, e=emo or ""))
    report.append(f"kanji kept   {k} = {m} (stop {stop}; KANJIDIC: {'; '.join(ms)})")
met = lambda stop: {x["k"] for x in kanji if x["stop"] <= stop}
combos = []
sign_by = {s["k"]: s for s in signs}
for stop, w in COMBO_PICK:
    if w not in sign_by: report.append(f"combo DROPPED {w} (not a kept sign word)"); continue
    if not set(w) <= met(stop): report.append(f"combo DROPPED {w} (uses kanji not met by stop {stop})"); continue
    combos.append(dict(k=w, stop=stop)); report.append(f"combo kept   {w} at stop {stop}")

data = dict(phrases=phrases, signs=signs, door=[dict(k=k, r=r, m=m, where=w) for k, r, m, w in DOOR], kata=kata, kanji=kanji, combos=combos)
os.makedirs(os.path.join(ROOT, "hajimete"), exist_ok=True)
open(os.path.join(ROOT, "hajimete", "data.js"), "w", encoding="utf-8", newline="\n").write(
    "// Built by tools/hajimete_build.py. Phrases: Tatoeba (CC BY 2.0 FR), native speakers, with sentence ids; meanings:\n"
    "// JMdict (EDRDG, CC BY-SA 4.0); katakana words: Jonathan Waller's JLPT lists (CC BY). Do not edit by hand.\n"
    "const HAJIMETE = " + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";\n")
open(os.path.join(ROOT, "tools", "hajimete_report.txt"), "w", encoding="utf-8", newline="\n").write("\n".join(report) + "\n")
print(f"{len(phrases)} phrases, {len(signs)} signs, {len(kata)} katakana words")
print("\n".join(x for x in report if "DROPPED" in x))
