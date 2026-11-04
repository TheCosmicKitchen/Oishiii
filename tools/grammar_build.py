"""Build src/grammar-data.js: the grammar road (Tōkaidō post towns), with native example sentences and verb drills.

  pip install fugashi unidic-lite wordfreq
  python3 tools/grammar_build.py tatoeba/ jmdict-eng-common.json JmdictFurigana.txt

Grammar points and their explanations are in tools/grammar_points.json. No example sentence is written by hand: every
sentence is a Tatoeba sentence (CC BY 2.0 FR) that passes all of these checks:
  - written by a contributor who lists Japanese as their native language, with an English translation by a native
    English speaker;
  - its kanji readings come from a human-checked Tatoeba transcription, and the parser (UniDic, via fugashi) reads every
    word the same way: two independent sources must agree, or the sentence is dropped;
  - every word is in Jonathan Waller's N5 or N4 lists (tools/waller_vocab.tsv), or is a number or a person's name;
  - every bit of grammar in it is one the player has met by that stop, found by the detectors below; anything the
    detectors don't recognise drops the sentence;
  - it is polite (ends in です or a ます form), short, and has no quotes or brackets.
Word meanings come from JMdict. Verb drills are built by rule and kept only if the parser reads every form back as that
verb in that form. Writes tools/grammar_report.txt with counts and every point's sentences, for review.
"""
import collections, csv, json, os, re, sys
from fugashi import Tagger

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
tdir, jm_path, furi_path = sys.argv[1:4]
csv.field_size_limit(10 ** 9)
P = json.load(open(os.path.join(ROOT, "tools", "grammar_points.json"), encoding="utf-8"))
STOPS = P["stops"]
STOP_OF = {pt: i for i, s in enumerate(STOPS) for pt in s["points"]}
TAG = Tagger()

def hira(s): return "".join(chr(ord(c) - 0x60) if "ァ" <= c <= "ヶ" else c for c in s)
isk = lambda c: "一" <= c <= "鿿" or c == "々"
def rows(name, delim="\t"): return csv.reader(open(os.path.join(tdir, name), encoding="utf-8"), delimiter=delim, quoting=csv.QUOTE_NONE)

# ---- vocabulary: Waller N5 + N4, and N3 for topping up points that have few examples; by spelling and by kana
VOCAB, VOCAB3 = set(), set()
for line in open(os.path.join(ROOT, "tools", "waller_vocab.tsv"), encoding="utf-8"):
    if line.startswith("#"): continue
    lv, words, kana, en = line.rstrip("\n").split("\t")
    if lv not in ("N5", "N4", "N3"): continue
    for w in re.split(r"[\s/、・]+", words) + re.split(r"[\s/、・]+", kana): (VOCAB if lv != "N3" else VOCAB3).add(hira(w))
VOCAB3 |= VOCAB

# ---- JMdict glosses by (spelling, reading) and by spelling
JM = json.load(open(jm_path, encoding="utf-8"))["words"]
GLOSS, GLOSS1 = {}, {}
def tidy(g):
    while True:
        t = re.sub(r"\s*\([^()]*\)", "", g)
        if t == g: break
        g = t
    g = g.strip(" ,;") or g
    return g if len(g) <= 28 else g[:28].rsplit(" ", 1)[0].rstrip(",;(") + "…"
JMPAIRS = {(k["text"], r["text"]) for e in JM for k in e["kanji"] for r in e["kana"] if "*" in r["appliesToKanji"] or k["text"] in r["appliesToKanji"]}
for e in JM:
    if not e["sense"] or not e["sense"][0]["gloss"]: continue
    g = tidy(e["sense"][0]["gloss"][0]["text"])
    for k in [x["text"] for x in e["kanji"]] + [x["text"] for x in e["kana"]]:
        GLOSS1.setdefault(k, g)
        for r in e["kana"]: GLOSS.setdefault((k, r["text"]), g)
furi = collections.defaultdict(dict)
for line in open(furi_path, encoding="utf-8-sig"):
    p = line.rstrip("\n").split("|")
    if len(p) == 3: furi[p[0]][p[1]] = p[2]

# ---- Tatoeba: native Japanese sentences with native English translations and human-checked furigana
native = collections.defaultdict(set)
for r in rows("user_languages.csv"):
    if len(r) > 2 and r[1] == "5": native[r[0]].add(r[2])
links = collections.defaultdict(list)
for r in rows("jpn-eng_links.tsv"): links[r[0]].append(r[1])
jpn = {r[0]: r[2] for r in rows("jpn_sentences_detailed.tsv") if r[3] in native["jpn"] and links.get(r[0])}
need = {e for s in jpn for e in links[s]}
eng = {r[0]: r[2] for r in rows("eng_sentences_detailed.tsv") if r[0] in need and r[3] in native["eng"]}
trans = {r[0]: r[4] for r in rows("transcriptions.csv") if r[1] == "jpn" and r[3] and r[0] in jpn}

def parse_trans(t):
    """[漢字|か|ん] → plain text and [(start, end, kana)] per kanji run (per character where it gives one reading each)."""
    out, segs = "", []
    for m in re.finditer(r"\[([^|\]]+)\|([^\]]+)\]|([^\[]+)", t):
        if m.group(3): out += m.group(3); continue
        k, rs = m.group(1), m.group(2).split("|")
        if len(rs) == len(k):
            for i, (c, r) in enumerate(zip(k, rs)): segs.append((len(out) + i, len(out) + i, r))
        else: segs.append((len(out), len(out) + len(k) - 1, "".join(rs)))
        out += k
    return out, segs

# ---- particles and forms: what a tap shows
PART = {"は": "topic marker (said wa)", "が": "marks the subject", "を": "marks the object (said o)", "に": "to, at, in",
        "へ": "toward (said e)", "で": "at, by, with", "と": "with", "も": "also, too", "の": "'s, of", "か": "question marker",
        "ね": "right? isn't it?", "よ": "you know", "て": "joins to the next part"}
PLACE = set("家 学校 図書館 駅 店 公園 部屋 教室 会社 台所 庭 海 山 川 町 東京 日本 銀行 病院 食堂 レストラン 喫茶店 デパート 大学 プール 外 中 ここ そこ あそこ どこ 道 外国 京都 大阪 アメリカ 国 ホテル 映画館 本屋 郵便局 交番 空港 うち お風呂 机 店 前".split())
MEANS = set("バス 電車 車 自転車 飛行機 タクシー 地下鉄 船 箸 ペン 鉛筆 日本語 英語 手 足 電話 ナイフ フォーク 紙 ボールペン 万年筆 歩き 漢字 ひらがな カタカナ 言葉 声 テレビ ラジオ メール".split())  # not 一人で "alone": another use
PERSON = set("私 僕 あなた 彼 彼女 友達 母 父 お母さん お父さん 兄 姉 弟 妹 お兄さん お姉さん 先生 家族 子供 両親 犬 猫 皆 みんな 誰 友人 学生 奥さん 主人 妻 夫".split())
GO = {"行く", "来る", "帰る"}
LIKE = {"好き", "嫌い", "上手", "下手", "大好き"}
# に after a time (二時半に来ます "comes at 2:30") is a different に, not taught yet
TIME = set("夏 冬 春 秋 週末 日曜日 月曜日 火曜日 水曜日 木曜日 金曜日 土曜日 誕生日 時 時半 半 分 日 月 年 頃 後".split())  # take に
RELTIME = set("朝 昼 夜 晩 今日 明日 昨日 毎日 毎朝 毎晩 今週 来週 先週 今年 来年 去年 毎年 午前 午後 今 前 休み 夏休み".split())  # don't take に
QUESTION = {"いつ", "誰", "だれ", "どこ", "何", "なに", "なん", "どれ", "どちら"}  # いつも, 誰も…ない, どこも…ない are other grammar
NOT_INVITE = {"有る", "居る", "思う", "呉れる", "出来る", "分かる", "知る", "下さる", "貰う", "見える", "聞こえる"}  # ませんか with these isn't an invitation
KEIGO = {"参る", "申す", "いらっしゃる", "致す", "召し上がる", "仰る", "存じる", "伺う"}  # humble and honorific verbs: not taught
INTERJ = {"はい", "いいえ", "ええ", "いえ", "ありがとう", "すみません", "こんにちは", "おはよう", "さようなら", "じゃあ"}

def toks(s):
    out = []
    for w in TAG(s):
        f = w.feature
        out.append(dict(s=w.surface, p1=f.pos1, p2=f.pos2, p3=f.pos3, cf=f.cForm or "", ct=f.cType or "",
                        lemma=(f.lemma or "").split("-")[0], base=f.orthBase or w.surface, kana=hira(f.kana or ""), lkana=hira(f.kanaBase or f.kana or ""),
                        lform=hira(f.lForm or "")))
    return out

# Multi-word patterns found on the sentence text first; their words are then skipped one by one
SEQ = [(re.compile(r"なければ(なりません|ならない|ならなかった|なりませんでした)|なくては(いけません|いけない|なりません|ならない)"), "nakereba"),
       (re.compile(r"ないで(ください|下さい)"), "naide_kudasai"),
       (re.compile(r"(?<=[ただ])ことが(ありませんでした|ありません|ありました|あります|あった|ある|なかった|ない)"), "ta_koto"),
       (re.compile(r"なくても(いい|良い|よい|かまいません|大丈夫)"), "nakute_ii")]
NEG = lambda ts: any(t["s"] in ("ない", "ませ", "なかっ", "なく") or t["lemma"] in ("無い",) for t in ts)
SENT_END = ("補助記号",)

def analyse(ts):
    """Grammar points found in a parsed sentence, or None if anything in it is beyond the points we teach."""
    pts, n = set(), len(ts)
    text, starts, o = "".join(t["s"] for t in ts), [], 0
    for t in ts: starts.append(o); o += len(t["s"])
    used = {}
    for rx, p in SEQ:
        for m in rx.finditer(text):
            idx = [k for k in range(n) if starts[k] >= m.start() and starts[k] + len(ts[k]["s"]) <= m.end()]
            if not idx or starts[idx[0]] != m.start(): return None  # the pattern starts mid-word: don't guess
            after = idx[-1] + 1
            if after < n and not (ts[after]["p1"] == "補助記号" or ts[after]["p1"] == "助詞" and ts[after]["p2"] in ("終助詞", "接続助詞") or ts[after]["s"] == "です"): return None
            pts.add(p); used.update({k: p for k in idx})
    after_te = lambda k: k and ts[k - 1]["s"] in ("て", "で") and ts[k - 1]["p1"] == "助詞"
    verbs = {t["lemma"] for k, t in enumerate(ts) if t["p1"] == "動詞" and k not in used and not (t["lemma"] == "居る" and after_te(k))
             and not (t["lemma"] == "有る" and k and ts[k - 1]["s"] in ("じゃ", "は", "で"))}
    def ends(k):  # nothing but punctuation or sentence-final particles after word k, or a clause joiner
        return k + 1 >= n or ts[k + 1]["p1"] == "補助記号" or (ts[k + 1]["p1"] == "助詞" and (ts[k + 1]["p2"] == "終助詞" or ts[k + 1]["s"] in ("から", "が") and ts[k + 1]["p2"] == "接続助詞"))
    i = 0
    while i < n:
        if i in used: i += 1; continue
        t = ts[i]; s, p1, p2 = t["s"], t["p1"], t["p2"]
        nxt = ts[i + 1] if i + 1 < n else None
        prv = ts[i - 1] if i else None
        tail = "".join(x["s"] for x in ts[i + 1:i + 7])
        if p1 == "補助記号":
            if s not in "。、？！?!": return None
        elif p1 == "助詞":
            if s == "は" and p2 == "係助詞":
                if prv and prv["s"] in ("て", "で") and tail.startswith("いけ"): pts.add("te_wa_ikenai")
                elif prv and prv["s"] in ("じゃ", "で") and prv["p1"] in ("助動詞", "助詞"): pass  # では(ありません)
                else: pts.add("wa_desu")
            elif s == "も" and p2 == "係助詞":
                pp = ts[i - 2] if i >= 2 else None
                if prv and (prv["s"] in QUESTION or prv["s"] in ("に", "へ", "で") and pp and pp["s"] in QUESTION):
                    if NEG(ts): pts.add("nanimo"); i += 1; continue  # 何も食べません, どこにも行きません
                    return None
                if prv and prv["s"] == "より": i += 1; continue  # よりも: "than", not "also"
                pts.add("te_mo_ii" if prv and prv["s"] in ("て", "で") and tail.startswith(("いい", "良い", "よい")) else "mo_also")
            elif s == "を" and p2 == "格助詞": pts.add("wo_obj")
            elif s == "の" and p2 == "格助詞" and prv and prv["p1"] in ("名詞", "代名詞") and nxt and nxt["base"] in ("方",) and i + 2 < n and ts[i + 2]["s"] == "が": pts.add("hou_ga")
            elif s == "の" and p2 == "格助詞" and prv and prv["p1"] in ("名詞", "代名詞") and nxt and nxt["p1"] in ("名詞", "代名詞", "接頭辞"): pts.add("no_pos")
            elif s == "か" and p2 == "終助詞" and (not nxt or nxt["p1"] == "補助記号"): pts.add("ka_q")
            elif s == "か" and p2 == "副助詞" and prv and prv["s"] in QUESTION: pts.add("nanika")  # 何か, 誰か
            elif s == "か" and p2 == "副助詞" and prv and prv["p1"] in ("名詞", "代名詞") and prv["s"] not in TIME | RELTIME | {"日"} and nxt and nxt["p1"] in ("名詞", "代名詞"): pts.add("ka_or")
            elif s == "や" and prv and prv["p1"] in ("名詞", "代名詞") and nxt and nxt["p1"] in ("名詞", "代名詞"): pts.add("ya")
            elif s == "だけ" and p2 == "副助詞" and prv and prv["p1"] in ("名詞", "代名詞", "副詞", "接尾辞"): pts.add("dake")
            elif s in ("ぐらい", "くらい") and p2 == "副助詞": pts.add("gurai_goro")
            elif s == "ながら" and p2 == "接続助詞" and prv and prv["p1"] == "動詞": pts.add("nagara")
            elif s in ("たり", "だり") and prv and prv["p1"] == "動詞": pts.add("tari")
            elif s in ("ね", "よ") and p2 == "終助詞": pts.add("ne_yo")
            elif s in ("に", "へ") and p2 == "格助詞":
                if s == "に" and prv and prv["s"] == "一緒": pts.add("to_with")
                elif s == "に" and prv and prv["p1"] == "動詞" and prv["cf"].startswith("連用形") and nxt and nxt["lemma"] in GO: pts.add("ni_iku")
                elif s == "に" and nxt and nxt["lemma"] == "成る": pts.add("naru")
                elif s == "に" and nxt and nxt["lemma"] == "為る" and prv and prv["s"] in ("気", "楽しみ"): return None  # 気にする, 楽しみにする: set phrases
                elif s == "に" and nxt and nxt["lemma"] == "為る" and prv and prv["p1"] in ("名詞", "代名詞", "形状詞"): pts.add("ni_suru")
                elif s == "に" and prv and prv["s"] in ("前", "まえ") and prv["p1"] == "名詞":
                    pp = ts[i - 2] if i >= 2 else None
                    if pp and pp["p1"] == "動詞": pts.add("mae_ni")  # 寝る前に
                    elif pp and pp["s"] == "の" and verbs and verbs <= {"有る", "居る"}: pts.add("ni_exist")  # 駅の前にいます: in front of
                    else: return None
                elif s == "に" and prv and (prv["base"] in RELTIME or prv["s"] in RELTIME): return None  # 明日には: not as taught
                elif s == "に" and prv and (prv["p2"] == "数詞" or prv["base"] in TIME or prv["s"] in TIME or prv["p1"] == "接尾辞" and prv["s"] in TIME): pts.add("ni_time")
                elif verbs & GO and not (verbs - GO - {"有る", "居る"}): pts.add("ni_dest")
                elif s == "に" and verbs and verbs <= {"有る", "居る"}: pts.add("ni_exist")
                else: return None
            elif s == "で" and p2 == "格助詞" and prv:
                if prv["s"] in ("後", "あと") and prv["kana"] == "あと": pts.add("atode")
                elif prv["base"] in PLACE or prv["s"] in PLACE: pts.add("de_place")
                elif prv["base"] in MEANS or prv["s"] in MEANS: pts.add("de_means")
                else: return None
            elif s == "と" and p2 == "格助詞" and prv and prv["p1"] in ("名詞",) and prv["base"] not in PERSON and prv["s"] not in PERSON and prv["p2"] != "固有名詞" and nxt and nxt["p1"] in ("名詞", "代名詞") and nxt["p3"] != "サ変可能": pts.add("to_and")
            elif s == "と" and p2 == "格助詞" and prv and (prv["base"] in PERSON or prv["s"] in PERSON or prv["p2"] == "固有名詞") and nxt and (nxt["s"] == "一緒" or nxt["p1"] == "動詞"):
                if nxt["lemma"] in ("言う", "申す", "思う", "呼ぶ"): return None  # トムと申します: と quoting a name
                pts.add("to_with")
            elif s == "が" and p2 == "格助詞":
                rest = ts[i + 1:]
                if prv and prv["base"] == "方": pts.add("hou_ga")
                elif any(x["base"] in LIKE or x["lemma"] in LIKE for x in rest): pts.add("ga_suki")
                elif any(x["lemma"] == "欲しい" for x in rest): pts.add("hoshii")
                elif any(x["lemma"] in ("有る", "居る") and x["p1"] == "動詞" and not after_te(i + 1 + k) for k, x in enumerate(rest)): pts.add("aru_iru")
                else: pts.add("ga_subj")
            elif s == "が" and p2 == "接続助詞": pts.add("ga_but")
            elif s == "から" and prv and prv["s"] in ("て", "で") and prv["p1"] == "助詞": pts.add("tekara")  # 食べてから (tagged either way)
            elif s == "から" and p2 == "格助詞": pts.add("kara_made")
            elif s == "から" and p2 == "接続助詞": pts.add("tekara" if prv and prv["s"] in ("て", "で") and prv["p1"] == "助詞" else "kara_because")
            elif s == "まで" and p2 in ("副助詞", "格助詞"): pts.add("kara_made")
            elif s == "より" and p2 == "格助詞": pts.add("hou_ga")
            elif s in ("て", "で") and p2 == "接続助詞":
                if tail.startswith(("ください", "下さい")): pts.add("te_kudasai")
                elif tail.startswith(("もいい", "も良い", "もよい", "はいけ", "から")): pass  # counted at も / は / から
                elif nxt and nxt["lemma"] == "居る": pts.add("te_iru")
                else: return None
            else: return None
        elif p1 == "助動詞":
            def before_noun(k):
                """A plain form followed by a noun: とき, 後で, or a description of the noun. None if not taught."""
                x = ts[k + 1] if k + 1 < n else None
                if not x or x["p1"] not in ("名詞", "代名詞") or x["s"] in ("前",): return False
                if x["base"] in ("こと", "事", "の", "物", "もの", "方", "所", "ところ", "様", "よう", "筈", "はず", "積もり", "つもり", "為", "ため", "訳", "わけ", "儘", "まま") and (k + 1) not in used: return None
                if x["kana"] == "とき" or x["s"] in ("時", "とき") and x["kana"] == "とき": pts.add("toki")
                elif x["s"] in ("後", "あと") and x["kana"] == "あと": pass  # counted at で
                elif (k + 1) not in used: pts.add("rel_clause")
                return True
            if t["lemma"] == "です":
                if s == "です": pts.add("wa_desu")
                elif s == "でし" and nxt and nxt["s"] == "た": pts.add("deshita"); i += 1
                elif s in ("でしょう", "でしょ"):
                    pts.add("deshou")
                    if s == "でしょ" and nxt and nxt["s"] == "う": i += 1
                else: return None
            elif t["lemma"] == "だ":
                if s in ("じゃ", "で") and tail.startswith(("ない", "ありませ", "はありませ", "はない", "なかった")): pts.add("ja_nai")
                elif s == "だ" and ends(i): pts.add("da")
                elif s in ("だろう", "だろ"):
                    pts.add("deshou")
                    if s == "だろ" and nxt and nxt["s"] == "う": i += 1
                elif s == "だっ" and nxt and nxt["s"] == "た": pts.add("deshita"); i += 1
                elif s == "な" and prv and prv["p1"] == "形状詞": pass  # 静かな町
                else: return None
            elif t["lemma"] == "ます":
                seq = "".join(x["s"] for x in ts[i:i + 5])
                if prv and prv["lemma"] == "有る" and i >= 2 and ts[i - 2]["s"] in ("じゃ", "は", "で") and seq.startswith("ません") and not seq.startswith("ませんでした"): i += 1  # じゃありません
                elif seq.startswith("ませんでした"): pts.add("masendeshita"); i += 4
                elif seq.startswith("ませんか") and prv and prv["lemma"] in NOT_INVITE: pts.add("masen"); i += 1
                elif seq.startswith("ませんか"): pts.add("masenka"); i += 1
                elif seq.startswith("ません"): pts.add("masen"); i += 1
                elif seq.startswith("ました"): pts.add("mashita"); i += 1
                elif seq.startswith("ましょう"): pts.add("mashou")
                elif s == "ます": pts.add("masu")
                else: return None
            elif t["lemma"] == "たい" and prv and prv["p1"] == "動詞":
                pts.add("tai")
                bn = before_noun(i)
                if bn is None: return None
                if bn: i += 1; continue
                if s == "たかっ" and nxt and nxt["s"] == "た": i += 1  # 行きたかった
                elif s == "たく" and nxt and nxt["lemma"] in ("無い", "ない"): i += 1  # 行きたくない
                elif not (s == "たい" and (ends(i) or nxt and nxt["s"] == "です")): return None
            elif t["lemma"] == "ない" and prv and prv["p1"] == "動詞" and prv["cf"].startswith("未然形"):
                pts.add("plain_nai")
                bn = before_noun(i)
                if bn is None: return None
                if bn: i += 1; continue
                if s == "なかっ" and nxt and nxt["s"] == "た": pts.add("plain_ta"); i += 1
                elif not (s == "ない" and (ends(i) or nxt and nxt["s"] == "です")): return None
            elif t["lemma"] == "た" and s in ("た", "だ") and prv and (prv["p1"] == "動詞" or prv["s"] in ("て", "で")):
                pts.add("plain_ta")
                bn = before_noun(i)
                if bn is None: return None
                if not bn and not ends(i) and (i + 1) not in used: return None
            elif s == "ない" and prv and (prv["s"] in ("じゃ",) or prv["cf"].startswith("連用形") and prv["p1"] == "形容詞"): pass
            else: return None
        elif p1 == "動詞":
            def before_noun(k):
                """A plain form followed by a noun: とき, 後で, or a description of the noun. None if not taught."""
                x = ts[k + 1] if k + 1 < n else None
                if not x or x["p1"] not in ("名詞", "代名詞") or x["s"] in ("前",): return False
                if x["base"] in ("こと", "事", "の", "物", "もの", "方", "所", "ところ", "様", "よう") and (k + 1) not in used: return None
                if x["kana"] == "とき" or x["s"] in ("時", "とき") and x["kana"] == "とき": pts.add("toki")
                elif x["s"] in ("後", "あと") and x["kana"] == "あと": pass  # counted at で
                elif (k + 1) not in used: pts.add("rel_clause")
                return True
            if t["s"] == "いけ" and prv and prv["s"] == "は": i += 1; continue  # てはいけません (parsed as 行ける)
            if t["lform"] and t["lkana"] and t["lform"] != t["lkana"]: return None  # potential (泳げる from 泳ぐ) or おる: not taught
            if t["lemma"] in KEIGO: return None
            if t["lemma"] == "下さる" and not after_te(i): return None  # 水をください: not taught
            if t["lemma"] == "居る" and after_te(i):  # ている / てる
                bn = before_noun(i)
                if bn is None: return None
                if not (bn or nxt and (nxt["lemma"] in ("ます", "た", "ない") or ends(i))): return None
            elif prv and prv["s"] in ("じゃ", "で", "は") and t["lemma"] == "有る": pass  # じゃありません
            elif t["lemma"] in ("有る", "居る") and nxt and nxt["lemma"] == "ます": pts.add("aru_iru")
            elif nxt and nxt["lemma"] == "ます" and t["cf"].startswith("連用形"): pass
            elif nxt and nxt["s"] in ("て", "で") and nxt["p1"] == "助詞": pass
            elif nxt and nxt["lemma"] in ("たい", "た") and t["cf"].startswith("連用形"): pass
            elif nxt and (nxt["lemma"] == "ない" or (i + 1) in used) and t["cf"].startswith("未然形"): pass
            elif t["lemma"] == "下さる" and t["s"] in ("ください", "下さい"): pass
            elif t["cf"].startswith(("終止形", "連体形")) and nxt and nxt["s"] in ("前", "まえ") and nxt["p1"] == "名詞": pass  # 寝る前に
            elif t["cf"].startswith("連用形") and nxt and (nxt["s"] in ("たり", "だり", "ながら") or nxt["s"] == "に" and i + 2 < n and ts[i + 2]["lemma"] in GO): pass
            elif t["cf"].startswith(("終止形", "連体形")) and nxt and nxt["p1"] in ("名詞", "代名詞"):
                if not before_noun(i): return None  # 私が読む本, 寝るとき
            elif t["cf"].startswith("終止形") and ends(i):
                pts.add("plain_dict")
                if t["lemma"] in ("有る", "居る"): pts.add("aru_iru")
            else: return None
        elif p1 == "形容詞":
            if t["lemma"] in ("無い",) and prv and (prv["s"] == "じゃ" or prv["p1"] == "形容詞" or prv["lemma"] == "たい"): pass
            elif t["lemma"] in ("良い",) and prv and prv["s"] == "も": pass  # てもいい
            elif t["lemma"] == "欲しい" and (t["cf"].startswith("終止形") and (ends(i) or nxt and nxt["s"] == "です")): pts.add("hoshii")
            elif t["cf"].startswith("終止形") and nxt and nxt["s"] == "です": pts.add("i_adj")
            elif t["cf"].startswith("終止形") and ends(i): pts.add("i_adj")
            elif t["cf"].startswith("連体形") and nxt and nxt["p1"] in ("名詞", "代名詞"): pts.add("i_adj")
            elif t["cf"].startswith("連用形") and nxt and nxt["s"] in ("ない", "なかっ"): pts.add("i_adj"); pts.add("i_adj_past") if nxt["s"] == "なかっ" else None
            elif t["cf"].startswith("連用形") and nxt and nxt["lemma"] == "成る": pts.add("naru")
            elif t["cf"].startswith("連用形") and nxt and nxt["lemma"] == "為る": pts.add("ni_suru")
            elif t["s"].endswith("かっ") and nxt and nxt["s"] == "た": pts.add("i_adj_past"); i += 1
            else: return None
        elif p1 == "形状詞":
            if nxt and nxt["s"] in ("な", "です", "じゃ", "だ", "でし", "だっ", "に"):
                pts.add("ga_suki" if t["base"] in LIKE else "na_adj")
                if nxt["s"] == "な": i += 1
            else: return None
        elif p1 == "代名詞":
            if s in ("これ", "それ", "あれ", "どれ", "ここ", "そこ", "あそこ", "どこ"): pts.add("kore")
        elif p1 == "連体詞":
            if s in ("この", "その", "あの", "どの"): pts.add("kono")
            else: return None
        elif p1 == "感動詞":
            if s not in INTERJ: return None  # includes fillers: あの人 misread as "uh… person"
        elif p1 == "接続詞": return None
        elif t["base"] == "一番": pts.add("ichiban")
        elif p1 == "副詞" and s in ("もう", "まだ"): pts.add("mou_mada")
        elif p1 == "副詞" and s in ("あまり", "余り", "全然", "ぜんぜん"):
            if not NEG(ts): return None  # あまり without a negative ("too much") isn't taught
            pts.add("amari_zenzen")
        elif s in ("ごろ", "頃") and p1 in ("接尾辞", "名詞"): pts.add("gurai_goro")
        elif t["base"] == "方" and t["p1"] == "名詞":
            if not (prv and prv["s"] == "の" and nxt and nxt["s"] == "が"): return None
        i += 1
    # how it ends: polite (です or a ます form) is chapter 1; anything else is the plain style, taught at Yoshiwara
    core = [t for t in ts if t["p1"] != "補助記号" and not (t["p1"] == "助詞" and t["p2"] == "終助詞")]
    if not core: return None
    last = core[-1]
    if last["p1"] == "助詞": return None
    polite = last["lemma"] in ("です", "ます") or last["s"] in ("ましょう", "ください", "下さい") or \
        (last["s"] in ("ん", "た") and any(x["lemma"] in ("ます", "です") for x in core[-4:]))
    if not polite:
        if last["p1"] == "名詞" or last["p1"] == "代名詞": return None  # casual sentences ending in a bare noun: skip
        pts.add("plain_dict")
    return pts

def vocab_ok(ts, vocab):
    for t in ts:
        if t["p1"] in ("助詞", "助動詞", "補助記号") or t["p2"] in ("数詞",) or t["p3"] == "人名" or t["p2"] == "固有名詞": continue
        if t["p1"] == "接尾辞" and t["s"] in ("さん", "ちゃん", "くん", "君", "人", "語", "時", "分", "円", "年", "月", "日", "歳", "才", "本", "枚", "個", "回", "階", "番", "達", "たち"): continue
        if t["p1"] == "接頭辞" and t["s"] in ("お", "ご", "御"): continue
        if t["lemma"] in ("下さる", "無い", "良い", "居る", "有る", "為る", "来る", "行く") or t["s"] in ("いけ",): continue
        if not ({hira(t["base"]), hira(t["lemma"]), t["lkana"], hira(t["s"])} & vocab): return False
    return True

def readings(plain, segs, ts):
    """Per word: (text, reading, furigana segments relative to the word), or None if the parser and the
    human transcription disagree anywhere."""
    out, pos = [], 0
    byc = {}
    for a, b, k in segs:
        for c in range(a, b + 1): byc[c] = (a, b, k)
    for t in ts:
        a, b = pos, pos + len(t["s"]) - 1; pos += len(t["s"])
        if not any(isk(c) for c in t["s"]): out.append((t["s"], hira(t["s"]), [])); continue
        mine, rd, i = [], "", a
        while i <= b:
            if i in byc:
                sa, sb, k = byc[i]
                if sa < a or sb > b: return None  # a reading spans two words: can't check it word by word
                mine.append((sa - a, sb - a, k)); rd += k; i = sb + 1
            elif isk(plain[i]): return None  # a kanji with no human reading
            else: rd += hira(plain[i]); i += 1
        # the human reading must agree with the parser, or be a JMdict reading of this exact word (私 わたし, where the
        # parser says わたくし)
        if rd != t["kana"] and (t["s"], rd) not in JMPAIRS: return None
        out.append((t["s"], rd, mine))
    return out

COPULA = {"だ", "です"}  # after a noun: its own chunk, so 学生じゃありません reads "gakusei ja arimasen"
COP_GLOSS = {"です": "is, am, are (polite)", "だ": "is (casual)", "じゃ": "is not", "で": "is not", "でし": "was", "だっ": "was", "でしょ": "probably", "でしょう": "probably", "だろ": "probably", "だろう": "probably"}

def chunk(ts, rd):
    """Tap units: a word with its endings (行き+ませ+ん → 行きません), a copula after a noun on its own (学生 + じゃない),
    and each particle on its own. Each keeps its dictionary form and whether it is negative, for matching the English."""
    out = []
    for k, (t, (txt, r, segs)) in enumerate(zip(ts, rd)):
        prv = ts[k - 1] if k else None
        cop = t["p1"] == "助動詞" and t["lemma"] in COPULA and prv and prv["p1"] in ("名詞", "代名詞", "形状詞", "接尾辞")
        tail = not cop and (t["p1"] == "助動詞" or (t["p1"] == "形容詞" and t["lemma"] == "無い" and out) or (t["p1"] == "助詞" and t["p2"] == "接続助詞") or t["p1"] == "接尾辞"
                            or (t["lemma"] == "下さる" and out) or (t["s"] == "いけ" and out))
        if tail and out and out[-1]["k"] == "w":
            o = out[-1]; off = len(o["t"]); o["t"] += txt; o["r"] += r; o["g"] += [(a + off, b + off, kk) for a, b, kk in segs]
            if t["lemma"] in ("ない", "無い", "ず", "ぬ"): o["_neg"] = True
        else:
            kind = "p" if t["p1"] == "助詞" else "x" if t["p1"] == "補助記号" else "w"
            if cop: gloss = COP_GLOSS.get(t["s"], "is")
            elif kind == "p": gloss = PART.get(txt, "")
            elif kind == "x": gloss = ""
            else: gloss = GLOSS.get((t["base"], t["lkana"])) or GLOSS.get((t["lemma"], t["lkana"])) or GLOSS1.get(t["base"]) or GLOSS1.get(t["s"]) or ""
            if t["p3"] == "人名" or t["p2"] == "固有名詞": gloss = "a name"
            out.append(dict(t=txt, r=r, g=list(segs), k=kind, m=gloss, b=t["base"] if kind == "w" and t["base"] != txt and not cop else "",
                            _base=t["base"], _lemma=t["lemma"], _kana=t["lkana"], _pos=t["p1"], _cop=cop, _neg=False, _name=t["p3"] == "人名" or t["p2"] == "固有名詞"))
    return out

# ---- matching chunks to words of the English translation, so both can share a colour. Tatoeba pairs whole sentences,
# not words, so this only colours a pair when it is sure: the word's JMdict meanings (or a particle's usual English)
# must fit exactly one word of the English that nothing else has taken.
STOP = set("to a an the of be one s something someone somebody thing etc or and in on at for with as by up out oneself one's it is are am do does did get make have about from into over off down away back through around like so than very much there here up some any many all few each every other".split())
GLOSSW = collections.defaultdict(set)
for e in JM:
    words = set()
    for sn in e["sense"]:
        for gl in sn["gloss"]:
            for w in re.findall(r"[a-z]+", re.sub(r"\([^)]*\)", "", gl["text"].lower())):
                if w not in STOP and len(w) > 1: words.add(w)
    for k in [x["text"] for x in e["kanji"]] + [x["text"] for x in e["kana"]]: GLOSSW[k] |= words
PRON = {"私": "i me my mine myself", "わたし": "i me my mine", "僕": "i me my", "ぼく": "i me my", "あなた": "you your", "君": "you your", "きみ": "you your",
        "彼": "he him his", "彼女": "she her", "私たち": "we us our", "わたしたち": "we us our", "これ": "this", "それ": "that it", "あれ": "that",
        "ここ": "here", "そこ": "there", "あそこ": "there", "どこ": "where", "何": "what", "なに": "what", "なん": "what", "誰": "who", "だれ": "who", "いつ": "when",
        "どれ": "which", "この": "this", "その": "that the", "あの": "that", "どの": "which", "今": "now", "今日": "today", "明日": "tomorrow", "昨日": "yesterday"}
PART_EN = {"に": {"to", "at", "in", "on", "into"}, "へ": {"to", "toward", "towards"}, "で": {"at", "in", "by", "with", "on"}, "と": {"with", "and"},
           "も": {"too", "also", "either", "even"}, "の": {"of"}, "から": {"from", "since", "because", "so"}, "まで": {"until", "till", "to"},
           "より": {"than"}, "や": {"and"}, "か": {"?", "or"}, "だけ": {"only", "just"}, "ぐらい": {"about", "around"}, "くらい": {"about", "around"}}
NEG_EN = {"not", "n't", "never", "no"}
BE_EN = {"is", "am", "are", "was", "were", "'m", "'re"}
IRREG = dict(x.split(":") for x in "went:go gone:go going:go came:come became:become begun:begin ate:eat saw:see did:do had:have was:be were:be bought:buy said:say took:take got:get made:make knew:know thought:think wrote:write gave:give left:leave slept:sleep met:meet told:tell felt:feel found:find ran:run sat:sit stood:stand spoke:speak drank:drink swam:swim sang:sing forgot:forget began:begin understood:understand taught:teach brought:bring caught:catch heard:hear lost:lose paid:pay sent:send spent:spend built:build won:win broke:break chose:choose wore:wear woke:wake fell:fall flew:fly grew:grow threw:throw kept:keep held:hold meant:mean children:child men:man women:woman feet:foot teeth:tooth mice:mouse people:person better:good best:good".split())
def variants(w):
    w = w.lower(); out = {w, IRREG.get(w, w)}
    for suf, rep in (("ies", "y"), ("es", ""), ("s", ""), ("ed", ""), ("ed", "e"), ("ing", ""), ("ing", "e"), ("ly", ""), ("er", ""), ("est", "")):
        if w.endswith(suf) and len(w) >= len(suf) + 2: out.add(w[:-len(suf)] + rep)
    if len(w) > 4 and w[-3] == w[-4] and w.endswith(("ped", "ted", "ned", "ged", "med", "ning", "ting", "ping")): out.add(w[:-3] if w.endswith("ed") else w[:-4])
    return out

DET = {"the", "a", "an", "my", "your", "his", "her", "our", "their", "this", "that", "these", "those", "home", "school", "work", "bed", "me", "him", "us", "them", "you", "her"}
def align(ch, en):
    """Colour group per chunk (key "c") and the English as [[text, group], ...]; group 0 means no colour."""
    toks = re.findall(r"\s+|[A-Za-z]+(?=n't\b)|n't\b|'[A-Za-z]+|[A-Za-z]+|\d+(?:[:.,]\d+)*|.", en)
    words = [(i, tk.lower()) for i, tk in enumerate(toks) if tk.strip() and (tk[0].isalnum() or tk[0] == "'" or tk == "?")]
    order = [i for i, _ in words]
    nxt_word = lambda i: next((toks[j] for j in order if j > i), "")
    taken, group, owner = {}, 0, {}
    def take(c, cands, strict, where=lambda i: True):
        nonlocal group
        hits = [i for i, w in words if i not in taken and cands(w) and where(i)]
        if not hits or (strict and len(hits) != 1) or len({toks[i].lower() for i in hits}) != 1: return
        group += 1; c["c"] = group; taken[hits[0]] = group; owner[group] = c
    for c in ch:  # content words first; pronouns by their main meanings only (そこ "there", not its rare "you")
        if c["k"] != "w" or c["_cop"] or c["_name"] or c["_lemma"] == "為る": continue
        pron = PRON.get(c["_base"]) or PRON.get(c["t"])
        meant = set(pron.split()) if pron else GLOSSW.get(c["_base"], set()) | GLOSSW.get(c["_lemma"], set())
        if meant: take(c, lambda w, m=meant: bool(variants(w) & m), False)
    def followed_well(i):  # a preposition only counts when what follows belongs to it: the, my, a number, a matched word
        j = next((j for j in order if j > i), None)
        return j is not None and ((j in taken and owner[taken[j]]["_pos"] in ("名詞", "代名詞")) or toks[j].lower() in DET or toks[j][0].isdigit() or toks[j][0].isupper())
    for c in ch:  # copulas and negatives; "is" as part of a passive or -ing verb (are wanted, is going) doesn't count
        if c["k"] != "w" or "c" in c: continue
        if c["_neg"] or c["t"].startswith(("じゃ", "では")): take(c, lambda w: w in NEG_EN, True)
        elif c["_cop"]: take(c, lambda w: w in BE_EN, True, lambda i: not nxt_word(i).lower().endswith(("ed", "en", "ing")))
    last = max((k for k, c in enumerate(ch) if c["k"] != "x"), default=-1)
    for k, c in enumerate(ch):  # particles with a usual English counterpart
        if c["k"] != "p" or c["t"] not in PART_EN: continue
        if c["t"] == "か":
            if k == last: take(c, lambda w: w == "?", True)  # only the question か at the end
            continue
        if c["t"] == "に" and k and ch[k - 1]["t"] in ("前", "後", "時", "まえ", "あと", "とき"): continue  # 前に "before": not "to"
        take(c, lambda w, e=PART_EN[c["t"]]: w in e, True, followed_well)
    segs = []
    for i, tk in enumerate(toks):
        g = taken.get(i, 0)
        if segs and segs[-1][1] == g == 0: segs[-1][0] += tk
        else: segs.append([tk, g])
    for c in ch:
        for k in [k for k in c if k.startswith("_")]: del c[k]
    return segs

# ---- go through the sentences
cands, stats = [], collections.Counter()
for sid, ja in jpn.items():
    stats["native ja+en"] += 1
    en = next((eng[e] for e in links[sid] if e in eng), None)
    if not en: continue
    stats["native English translation"] += 1
    if sid not in trans or len(ja) > 22 or re.search(r"[「」『』（）()…・〜]", ja): continue
    plain, segs = parse_trans(trans[sid])
    if plain != ja: continue
    stats["human furigana, short"] += 1
    ts = toks(ja)
    pts = analyse(ts)
    if pts is None: continue
    stats["grammar all taught"] += 1
    tier = 0 if vocab_ok(ts, VOCAB) else 1 if vocab_ok(ts, VOCAB3) else None
    if tier is None: continue
    stats["words all N5/N4" if tier == 0 else "words N3 at most"] += 1
    rd = readings(ja, segs, ts)
    if rd is None: continue
    stats["readings agree"] += 1
    stop = max((STOP_OF[p] for p in pts), default=0)
    ch = chunk(ts, rd); eseg = align(ch, en)
    cands.append(dict(id=int(sid), ja=ja, en=en, p=sorted(pts), s=stop, w=ch, e=eseg, tier=tier))
    cands[-1]["plain"] = "plain_dict" in pts

# per point: the clearest examples (the point is the newest grammar in them; N5/N4 words first, then short);
# N3 words only top up points with fewer than four examples; per stop: a reading set of easy sentences
cands.sort(key=lambda c: (c["tier"], len(c["ja"]), c["id"]))
keep, per_point, per_stop = {}, collections.defaultdict(list), collections.defaultdict(list)
# an example must show its point plainly: は and です for "A は B です", と for "with", も for "also"
SHOWS = {"wa_desu": lambda c: "は" in c["ja"] and "です" in c["ja"], "to_with": lambda c: "と" in c["ja"], "mo_also": lambda c: "も" in c["ja"],
         "ja_nai": lambda c: re.search("じゃ|では", c["ja"]), "tai": lambda c: "た" in c["ja"], "hoshii": lambda c: re.search("ほし|欲し", c["ja"]),
         "te_iru": lambda c: re.search("[てで](い|る)", c["ja"]), "kara_made": lambda c: re.search("まで", c["ja"]) or re.search("(?<!これ)(?<!今)(?<!後)から", c["ja"]), "plain_dict": lambda c: c["plain"],
         "da": lambda c: "だ" in c["ja"], "plain_nai": lambda c: "な" in c["ja"], "plain_ta": lambda c: c["plain"], "deshita": lambda c: re.search("でした|だった", c["ja"]),
         "i_adj_past": lambda c: "かった" in c["ja"], "kara_because": lambda c: re.search("から、?[^。？！?!]", c["ja"]), "ga_but": lambda c: re.search("が、?[^。？！?!]", c["ja"]),
         "tekara": lambda c: re.search("[てで]から", c["ja"]), "mae_ni": lambda c: re.search("前に|まえに", c["ja"]), "hou_ga": lambda c: re.search("ほう|方|より", c["ja"]),
         "ichiban": lambda c: re.search("一番|いちばん", c["ja"]), "to_and": lambda c: "と" in c["ja"], "ya": lambda c: "や" in c["ja"],
         "dake": lambda c: "だけ" in c["ja"], "naru": lambda c: re.search("な[るりっら]", c["ja"]), "ni_suru": lambda c: re.search("[にく]し|[にく]す", c["ja"]),
         "mou_mada": lambda c: re.search("もう|まだ", c["ja"]), "nanika": lambda c: re.search("(何|誰|どこ|なに|だれ)か", c["ja"]),
         "nanimo": lambda c: re.search("(何|誰|どこ|なに|だれ)(に)?も", c["ja"]), "ta_koto": lambda c: "ことが" in c["ja"], "tari": lambda c: re.search("[ただ]り", c["ja"]),
         "nagara": lambda c: "ながら" in c["ja"], "atode": lambda c: re.search("後で|あとで", c["ja"]), "deshou": lambda c: re.search("でしょ|だろ", c["ja"]),
         "nakute_ii": lambda c: "なくても" in c["ja"]}
for c in cands:
    for p in c["p"]:
        room = 10 if c["tier"] == 0 else 4  # N3 words only while a point has fewer than four examples
        if STOP_OF[p] == c["s"] and len(per_point[p]) < room and SHOWS.get(p, lambda c: True)(c): per_point[p].append(c["id"]); keep[c["id"]] = c
for c in cands:
    if c["tier"] == 0 and len(per_stop[c["s"]]) < 12 and c["id"] not in per_stop[c["s"]]: per_stop[c["s"]].append(c["id"]); keep[c["id"]] = c

# ---- verbs for the form drills: Waller N5 verbs, forms by rule, each checked by parsing it back
GODAN_I = dict(zip("うくぐすつぬぶむる", "いきぎしちにびみり"))
GODAN_TE = {"う": "って", "つ": "って", "る": "って", "む": "んで", "ぶ": "んで", "ぬ": "んで", "く": "いて", "ぐ": "いで", "す": "して"}
def forms(word, kana, cls):
    """{form: (written, reading)} for the polite forms and the て-form, or None for classes we don't drill."""
    def mk(stem_w, stem_r, end): return (stem_w + end, stem_r + end)
    if cls == "v1": sw, sr, tw, tr = word[:-1], kana[:-1], word[:-1] + "て", kana[:-1] + "て"
    elif cls.startswith("v5") and cls not in ("v5aru",):
        last = word[-1]
        if last not in GODAN_I: return None
        sw, sr = word[:-1] + GODAN_I[last], kana[:-1] + GODAN_I[last]
        te = "って" if cls == "v5k-s" else GODAN_TE[last]
        tw, tr = word[:-1] + te, kana[:-1] + te
    elif cls == "vs-i" and word.endswith("する"): sw, sr, tw, tr = word[:-2] + "し", kana[:-2] + "し", word[:-2] + "して", kana[:-2] + "して"
    elif cls == "vk": sw, sr, tw, tr = word[:-1], "き", word[:-1] + "て", "きて"
    else: return None
    f = {e: mk(sw, sr, e) for e in ("ます", "ません", "ました", "ませんでした", "ましょう", "たい")}
    f["て"] = (tw, tr)
    f["ている"] = (tw + "いる", tr + "いる")
    f["た"] = (tw[:-1] + ("だ" if tw.endswith("で") else "た"), tr[:-1] + ("だ" if tr.endswith("で") else "た"))
    # ない: る-verbs drop る; う-verbs move to the あ row (う → わ); する → しない; 来る → 来ない (こない)
    if cls == "v1": f["ない"] = (word[:-1] + "ない", kana[:-1] + "ない")
    elif cls.startswith("v5"):
        a = dict(zip("うくぐすつぬぶむる", "わかがさたなばまら"))[word[-1]]
        f["ない"] = (word[:-1] + a + "ない", kana[:-1] + a + "ない")
    elif cls == "vs-i": f["ない"] = (word[:-2] + "しない", kana[:-2] + "しない")
    elif cls == "vk": f["ない"] = (word[:-1] + "ない", "こない")
    return f
POS = {}
for e in JM:
    for k in e["kanji"] or e["kana"]:
        for r in e["kana"]:
            POS.setdefault((k["text"], r["text"]), e["sense"][0].get("partOfSpeech", []) if e["sense"] else [])
verbs, vstats = [], collections.Counter()
for line in open(os.path.join(ROOT, "tools", "waller_vocab.tsv"), encoding="utf-8"):
    if line.startswith("#"): continue
    lv, words, kana, en = line.rstrip("\n").split("\t")
    if lv != "N5": continue
    word, kana = re.split(r"[\s/、・]+", words or kana)[0], hira(re.split(r"[\s/、・]+", kana)[0])
    cls = next((c for c in POS.get((word, kana), []) if c.startswith(("v1", "v5", "vs-i", "vk"))), None)
    if not cls or cls == "v5r-i": continue  # ある: its ない form is just ない, so it doesn't fit the drill
    vstats["N5 verbs"] += 1
    fs = forms(word, kana, cls)
    if not fs: continue
    ok = True
    for name, (w, r) in fs.items():
        ts = toks(w + ("ください" if name == "て" else ""))
        if not ts or ts[0]["base"] != word and ts[0]["lemma"] != word and hira(ts[0]["lkana"]) != kana: ok = False; break
        if "".join(t["kana"] for t in ts) != r + ("ください" if name == "て" else ""): ok = False; break
    if not ok: vstats["dropped: parser disagrees"] += 1; continue
    al = furi.get(word, {}).get(kana, "")
    segs = [(int(p.split(":")[0].split("-")[0]), int(p.split(":")[0].split("-")[-1]), p.split(":")[1]) for p in al.split(";")] if al else []
    if any(isk(c) for c in word) and not segs: vstats["dropped: no furigana"] += 1; continue
    gl = tidy(re.split(r"[,;]", en)[0].strip())
    verbs.append(dict(v=word, r=kana, m=gl, g=segs, f={k: list(v) for k, v in fs.items()}, kuru=cls == "vk"))
    vstats["kept"] += 1

# ---- write
data = {"stops": STOPS, "chapters": P["chapters"], "points": {k: {kk: vv for kk, vv in v.items() if kk != "check"} for k, v in P["points"].items()},
        "ex": per_point, "read": per_stop, "sents": list(keep.values()), "verbs": verbs}
js = ("// ===== Grammar road: post towns of the old Tōkaidō, grammar points, native example sentences, verb drills =====\n"
      "// Built by tools/grammar_build.py. Sentences: Tatoeba (tatoeba.org, CC BY 2.0 FR), by native speakers, with sentence\n"
      "// ids so each can be traced; word meanings: JMdict (EDRDG, CC BY-SA 4.0); word lists: Jonathan Waller (CC BY).\n"
      "// Do not edit by hand.\n"
      "const GRAMMAR = " + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";\n")
open(os.path.join(ROOT, "src", "grammar-data.js"), "w", encoding="utf-8", newline="\n").write(js)
rep = [f"{k}: {v}" for k, v in stats.items()] + [f"verbs {k}: {v}" for k, v in vstats.items()]
for i, st in enumerate(STOPS):
    rep.append(f"\n== {i} {st['ro']} ({len(per_stop[i])} reading sentences)")
    for p in st["points"]:
        rep.append(f"  {p}: {len(per_point[p])}")
        for sid in per_point[p][:10]:
            c = keep[sid]; rep.append(f"    {sid}  {c['ja']}  |  {c['en']}  |  {' '.join(c['p'])}")
open(os.path.join(ROOT, "tools", "grammar_report.txt"), "w", encoding="utf-8", newline="\n").write("\n".join(rep) + "\n")
print("\n".join(rep[:12]), f"\n{len(keep)} sentences, {len(verbs)} verbs, {len(js.encode('utf-8')) // 1024} KB")
