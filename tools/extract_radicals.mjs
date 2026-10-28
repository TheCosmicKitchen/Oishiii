import fs from "fs";
const base = process.argv[2], kj = process.argv[3], out = process.argv[4];
const { RADKFILE } = await import(base + "/dist/data/radkfile.data.js");
const names = await import(base + "/dist/names.js");
const forms = await import(base + "/dist/forms.js");
const K = JSON.parse(fs.readFileSync(kj, "utf8"));
const radOf = {};
for (const r of RADKFILE.radicals) for (const ch of r.kanji) (radOf[ch] ||= []).push(r.radical);
const usedRad = new Set(); const rows = [];
for (const [k, v] of Object.entries(K)) {
  if (!v.jlpt_new) continue;
  const rads = (radOf[k] || []);
  rads.forEach(r => usedRad.add(r));
  rows.push({ k, n: v.jlpt_new, g: v.grade || 9, f: v.freq || 9999, s: v.strokes, m: v.meanings, on: v.readings_on, kun: v.readings_kun, r: rads });
}
const radTable = {};
for (const r of RADKFILE.radicals) if (usedRad.has(r.radical)) { const e = names.radicalNameEntry(r.radical); radTable[r.radical] = { f: forms.radicalForm(r.radical), m: e ? e.meaning : null, j: e ? e.name : null, s: r.strokes }; }
fs.writeFileSync(out, JSON.stringify({ rows, radTable }));
const noR = rows.filter(r => !r.r.length).map(r => r.k);
const unnamed = Object.entries(radTable).filter(([k, v]) => !v.m).map(([k, v]) => k + v.f);
const avg = rows.reduce((a, r) => a + r.r.length, 0) / rows.length;
console.log("kanji", rows.length, "no radicals", noR.length, noR.join(""), "radicals used", Object.keys(radTable).length, "unnamed", unnamed.length, unnamed.join(" "), "avg parts", avg.toFixed(2));
for (const k of ["休","語","森","明","本","犬","曜","国","学"]) { const r = rows.find(x => x.k === k); console.log(k, r.r.map(x => radTable[x].f + ":" + radTable[x].m).join(" ")); }
