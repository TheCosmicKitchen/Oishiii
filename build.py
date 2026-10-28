"""Build Oishii into single-file pages.

  python3 build.py

Writes:
  dist/oishii.html  - page body for publishing as a Claude artifact
  index.html        - full standalone page (open locally or serve with GitHub Pages)
"""
import os
ROOT = os.path.dirname(os.path.abspath(__file__))
rd = lambda *p: open(os.path.join(ROOT, *p), encoding="utf-8").read()
JS_ORDER = ["data.js", "kanji-data.js", "kanji.js", "route-data.js", "core.js", "learn.js", "rail.js", "sushi.js", "puzzles.js"]

body = (rd("src", "shell.html")
        .replace("/*CSS*/", rd("src", "style.css"))
        .replace("/*EMO*/", rd("assets", "emoji.json"))
        .replace("/*JS*/", "\n".join(rd("src", f) for f in JS_ORDER)))

os.makedirs(os.path.join(ROOT, "dist"), exist_ok=True)
open(os.path.join(ROOT, "dist", "oishii.html"), "w", encoding="utf-8").write(body)

full = ('<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
        '<meta name="theme-color" content="#F1F6EA">\n<meta name="apple-mobile-web-app-capable" content="yes">\n'
        '<meta name="apple-mobile-web-app-title" content="Oishii">\n<link rel="manifest" href="manifest.webmanifest">\n'
        '<link rel="icon" type="image/png" href="assets/icon-192.png">\n<link rel="apple-touch-icon" href="assets/icon-180.png">\n'
        '<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}'
        'body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style>\n</head>\n<body>\n'
        + body + '\n</body>\n</html>\n')
open(os.path.join(ROOT, "index.html"), "w", encoding="utf-8").write(full)
print(f"built dist/oishii.html and index.html ({len(full) // 1024} KB)")
