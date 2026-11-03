"""Write tools/waller_vocab.tsv: Jonathan Waller's JLPT N5–N1 vocabulary lists, verbatim.

  python3 tools/fetch_waller.py [folder with n5.html … n1.html already saved from the URLs below]

tanos.co.uk is offline, so the pages come from the Internet Archive's copies of the original site. Waller's own
"Use my data!" page (http://www.tanos.co.uk/jlpt/sharing/, 2011) says: everything on the site that isn't for sale is
licensed Creative Commons BY; use it however you like, but credit the site.
Each row: level, kanji spelling (blank for kana-only words), kana reading, English, exactly as the list has them.
"""
import html, os, re, sys, time, urllib.error, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# the archived copies used, pinned so anyone can check them
SNAPSHOTS = {5: "20200728231522", 4: "20200629172633", 3: "20200629172607", 2: "20200629172602", 1: "20200218172500"}
def get(url):
    for wait in (0, 10, 30, 60):
        time.sleep(wait)
        try: return urllib.request.urlopen(url, timeout=120).read().decode("utf-8", "replace")
        except urllib.error.HTTPError as e:
            if e.code != 429: raise
    raise SystemExit("The Internet Archive keeps refusing (too many requests); try again later")
def page(n):
    local = len(sys.argv) > 1 and os.path.join(sys.argv[1], f"n{n}.html")
    if local and os.path.exists(local): return open(local, encoding="utf-8", errors="replace").read()
    return get(f"http://web.archive.org/web/{SNAPSHOTS[n]}id_/http://www.tanos.co.uk/jlpt/jlpt{n}/vocab/")

rows, srcs = [], []
for n in (5, 4, 3, 2, 1):
    ts, text = SNAPSHOTS[n], page(n)
    srcs.append(f"# N{n}: http://web.archive.org/web/{ts}/http://www.tanos.co.uk/jlpt/jlpt{n}/vocab/")
    count = 0
    for tr in re.findall(r"<tr>(.*?)</tr>", text, re.S | re.I):
        cells = [re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", "", c))).strip() for c in re.findall(r"<td[^>]*>(.*?)</td>", tr, re.S | re.I)]
        if len(cells) != 3 or not cells[1] or ".anki" in tr or ".mem" in tr: continue
        rows.append("\t".join([f"N{n}"] + cells)); count += 1
    print(f"N{n}: {count} words")
head = ["# Jonathan Waller's JLPT vocabulary lists (tanos.co.uk), licensed Creative Commons BY by the author:",
        "# \"Everything on this site (that I'm not selling), is licenced under Creative Commons 'BY'.\" (tanos.co.uk/jlpt/sharing/)",
        "# Fetched from the Internet Archive by tools/fetch_waller.py:"] + srcs + ["# level\tkanji\tkana\tenglish"]
open(os.path.join(ROOT, "tools", "waller_vocab.tsv"), "w", encoding="utf-8", newline="\n").write("\n".join(head + rows) + "\n")
