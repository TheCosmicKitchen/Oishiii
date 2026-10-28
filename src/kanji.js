// ===== Kanji entries, tracks and sub-levels =====
const NUM_ON = new Set([..."一二三四五六七八九十百千万"]);
const SUB_SIZE = 10;
const KJ = KANJI_TSV.split("\n").map((line, id) => {
  const [k, n, s, m, on, kun, r, e] = line.split("\t");
  const ons = on ? on.split(",") : [], kuns = kun ? kun.split(",") : [];
  const ms = m.split(";");
  const primary = (!NUM_ON.has(k) && kuns.length ? kuns[0] : ons[0] || kuns[0] || "").replace(/[.\-]/g, "");
  return { id, k, n: +n, s: +s, ens: ms, en: ms[0], on: ons, kun: kuns, rad: [...r], e: e || "", t: "n" + n, r: primary, get ro() { return romaji(this.r); } };
});
const UNIQUE_WORDS = KJ;
const KJ_BY = Object.fromEntries(KJ.map(w => [w.k, w]));
// every reading a learner might type (on, kun with and without okurigana)
function readingsOf(w) { const out = new Set(); w.on.forEach(x => out.add(x)); w.kun.forEach(x => { out.add(x.replace(/[.\-]/g, "")); out.add(x.split(".")[0].replace(/-/g, "")); }); out.delete(""); return [...out]; }
const radsOf = w => w.rad;
const radGlyph = r => (RADS[r] || [r])[0];
const radMean = r => (RADS[r] || [r, r])[1];

// Stamp book pages: one per JLPT level
const STAMP_PAGES = [
  { id: "n5", name: "JLPT N5", jp: "N5", themes: ["n5"], trophy: "N5 Graduate", icon: "sakura" },
  { id: "n4", name: "JLPT N4", jp: "N4", themes: ["n4"], trophy: "N4 Graduate", icon: "tulip" },
  { id: "n3", name: "JLPT N3", jp: "N3", themes: ["n3"], trophy: "N3 Graduate", icon: "sunflower" },
  { id: "n2", name: "JLPT N2", jp: "N2", themes: ["n2"], trophy: "N2 Graduate", icon: "maple" },
  { id: "n1", name: "JLPT N1", jp: "N1", themes: ["n1"], trophy: "N1 Master", icon: "crown" },
];

// Learning tracks: kana first, then N5 → N1, each split into sub-levels of 10
const KANA_SUBS = [
  { title: "あ・か rows", items: ["あ", "い", "う", "え", "お", "か", "き", "く", "け", "こ"] },
  { title: "さ・た rows", items: ["さ", "し", "す", "せ", "そ", "た", "ち", "つ", "て", "と"] },
  { title: "な・は rows", items: ["な", "に", "ぬ", "ね", "の", "は", "ひ", "ふ", "へ", "ほ"] },
  { title: "ま・や rows", items: ["ま", "み", "む", "め", "も", "や", "ゆ", "よ"] },
  { title: "ら・わ rows", items: ["ら", "り", "る", "れ", "ろ", "わ", "を", "ん"] },
  { title: "Extras", items: ["゛", "ゃ", "ゅ", "ょ", "っ"] },
];
// Grounded levels (GROUND, from tools/ground_kanji.py) teach each stop the kanji found around it; the rest keep
// frequency order in sub-levels of 10, split so there is exactly one sub-level per stop on the route
const BORROWED = new Set(Object.entries(GROUND).flatMap(([t, subs]) => [...subs.join("")].filter(k => KJ_BY[k] && "n" + KJ_BY[k].n !== t)));
const stopsOn = t => ROUTE.filter(r => r.t === t).length;
function chunkTo(list, size, want) { const out = []; for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size)); while (out.length > want) { const last = out.pop(); out[out.length - 1].push(...last); } return out; }
const levelSubs = n => GROUND["n" + n] ? GROUND["n" + n].map(ks => [...ks].map(k => KJ_BY[k])) : chunkTo(KJ.filter(w => w.n === n && !BORROWED.has(w.k)), SUB_SIZE, stopsOn("n" + n));
const TRACKS = [
  { id: "kana", name: "Kana", jp: "かな", icon: "seedling", kana: true, subs: KANA_SUBS.map(s => ({ title: s.title, items: s.items })) },
  ...[5, 4, 3, 2, 1].map(n => ({ id: "n" + n, name: "N" + n, jp: "N" + n, n, icon: STAMP_PAGES[5 - n].icon, subs: levelSubs(n).map((items, i) => ({ title: `N${n} · ${i + 1}`, items })) })),
];
const ALL_SUBS = [];
TRACKS.forEach(t => t.subs.forEach((s, i) => { s.id = t.id + "-" + (i + 1); s.track = t; s.num = i + 1; s.idx = ALL_SUBS.length; ALL_SUBS.push(s); }));
const SUB_BY = Object.fromEntries(ALL_SUBS.map(s => [s.id, s]));
