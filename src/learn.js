// ===== shell, Learn path (kana → N5 → N1), quiz engine, stamp book =====
let TAB = "learn";
try { TAB = sessionStorage.getItem("kg.tab") || "learn"; } catch (e) { }
if (TAB === "garden") TAB = "learn";
const TABS = [
  { id: "learn", label: "Learn", icon: "pencil" },
  { id: "sushi", label: "Sushi", icon: "sushi" },
  { id: "puzzles", label: "Puzzles", icon: "puzzle" },
  { id: "book", label: "Stamps", icon: "book" },
];
function render() {
  const app = $("#app");
  app.innerHTML = `<header class="top"><div class="logo">${IMGW("blossom", 34)}<div><h1>${APP_NAME}</h1><small>おいしい</small></div></div>
    <span class="chip" title="Stamps collected">${IMG("lantern")}${foundCount()}</span><span class="chip" title="Trophies">${IMG("trophy")}${trophyCount()}</span>
    <span class="chip" title="Your role">${IMG(S.role === "kanji" ? "japan" : "seedling")}${S.role === "kanji" ? "漢字" : "かな"}</span></header>
    <main id="view" class="stack"></main>`;
  const tb = $("#tabs"); tb.innerHTML = `<nav>${TABS.map(t => `<button class="tab" data-tab="${t.id}" aria-current="${TAB === t.id}">${IMG(t.icon)}<span>${t.label}</span></button>`).join("")}</nav>`;
  $$("[data-tab]", tb).forEach(b => b.onclick = () => { TAB = b.dataset.tab; try { sessionStorage.setItem("kg.tab", TAB); } catch (e) { } render(); window.scrollTo(0, 0); });
  dndReset(document);
  ({ learn: viewLearn, sushi: viewSushi, puzzles: viewPuzzles, book: viewBook })[TAB]($("#view"));
}

// ---------- progress helpers ----------
const subUnlocked = s => s.idx === 0 || s.idx <= (S.unlockTo || 0) || subStars(ALL_SUBS[s.idx - 1]) > 0;
const subItems = s => s.items;
const isKanaSub = s => !!s.track.kana;
const itemDone = (s, it) => isKanaSub(s) ? !!S.kana[it] : isStamped(it);
const subDoneCount = s => s.items.filter(it => itemDone(s, it)).length;
function nextSub() { return ALL_SUBS.find(s => subUnlocked(s) && !subStars(s)) || ALL_SUBS.filter(subUnlocked).pop(); }
const trackStars = t => t.subs.reduce((a, s) => a + subStars(s), 0);
const kanaRo = k => { const x = EXTRAS.find(e => e.k === k); return x ? x.name : k === "を" ? "o (wo)" : KANA_RO[k]; };
function kunHTML(x) { const [a, b] = x.split("."); return esc(a) + (b ? `<span class="oku">${esc(b)}</span>` : ""); }

// ---------- LEARN TAB ----------
let unlockTaps = 0, unlockTimer = 0;
function viewLearn(v) {
  const cur = TRACKS.find(t => t.id === S.track) || TRACKS[0];
  const nx = nextSub();
  const greet = S.name ? `おかえり、${esc(S.name)}！` : "ようこそ！";
  const stamped = foundCount();
  v.innerHTML = `
  <section class="hello">${IMG(stamped ? "sakura" : "seedling")}<div class="stack" style="gap:6px;flex:1;min-width:0">
    <h2>${greet}</h2><p class="muted" style="font-size:.85rem">${plantedKana().length < 46 && S.role !== "kanji" ? "Start with kana, then climb from N5 to N1. Every kanji you clear gets stamped." : "Clear sub-levels to stamp kanji. Games only quiz what you've stamped."}</p>
    <div class="stats"><div class="stat"><b>${plantedKana().length}</b><span>kana / 46</span></div><div class="stat"><b>${stamped}</b><span>kanji / ${KJ.length.toLocaleString()}</span></div><div class="stat"><b>${ALL_SUBS.filter(s => subStars(s)).length}</b><span>levels / ${ALL_SUBS.length}</span></div></div>
    <div class="row">${nx ? `<button class="btn pink" id="continue">${IMG("sparkles")}${subStars(nx) ? "Replay" : "Continue"} ${esc(nx.title)}</button>` : ""}<button class="btn ghost" id="review" ${stamped || plantedKana().length ? "" : "disabled"}>${IMG("droplet")}Review</button></div></div></section>
  <section class="card stack path">
    <header class="row"><button class="trainbtn" id="train" aria-label="Your line">${IMGW("train", 40)}</button><div style="flex:1;min-width:0"><h2>The line</h2><p class="muted" style="font-size:.8rem">Every stop is a real station. Clear its 10 kanji to lay track and ride there, from Tokyo to Wakkanai.</p></div></header>
    ${railMapHTML(cur)}
    ${nx ? stationCardHTML(nx, subStars(nx) ? "Revisit" : "Next stop") : ""}
    <div class="tracks" role="tablist">${TRACKS.map(t => { const done = t.subs.filter(s => subStars(s)).length; return `<button class="trk ${t === cur ? "on" : ""}" data-track="${t.id}" role="tab" aria-selected="${t === cur}">${IMGW(t.icon, 26)}<b>${t.jp}</b><small>${done}/${t.subs.length}</small></button>`; }).join("")}</div>
    <div class="row"><span class="eyebrow">${cur.kana ? "Hiragana" : `JLPT ${cur.name} · ${cur.subs.reduce((a, s) => a + s.items.length, 0)} kanji`}</span><span class="spacer"></span><span class="pill pink">${trackStars(cur)}/${cur.subs.length * 3} ★</span></div>
    <div class="subgrid">${cur.subs.map(s => { const open = subUnlocked(s), st = subStars(s), dn = subDoneCount(s); const prev = s.items.slice(0, 4).map(it => isKanaSub(s) ? it : it.k).join("");
      return `<button class="subnode ${st ? "cleared" : open ? "open" : "locked"} ${s === nx ? "next" : ""} ${isCity(s) ? "city" : ""}" ${open ? `data-sub="${s.id}"` : "disabled"} style="--lv:${STAMP_INK[cur.id] || "var(--leaf-deep)"}" aria-label="${esc(s.title)}${open ? "" : " locked"}">
        <span class="subnum">${s.num}</span><span class="subplace glyph">${open ? esc(s.stop.p) : IMGW("lock", 22)}</span><span class="subprev glyph">${open ? esc(prev) : ""}</span><span class="lvstars">${starRow(st, 12)}</span><small>${open ? esc(s.stop.ro) : `${dn}/${s.items.length}`}</small></button>`; }).join("")}</div>
  </section>
  ${Object.keys(GATES).some(id => !gateOpen(id)) ? `<section class="card stack" style="gap:8px"><header class="row">${IMGW("station", 34)}<div style="flex:1;min-width:0"><h3>Next unlocks</h3><p class="muted" style="font-size:.8rem">Games only use kana you've learned and kanji you've stamped.</p></div></header>
    ${Object.keys(GATES).filter(id => !gateOpen(id)).slice(0, 3).map(id => `<div class="row" style="gap:8px;flex-wrap:nowrap">${IMGW(GATES[id].icon, 30)}<div style="flex:1;min-width:0"><b style="font-size:.88rem">${GATES[id].name}</b>${lockCard(id)}</div></div>`).join("")}</section>` : ""}`;
  $$("[data-track]", v).forEach(b => b.onclick = () => { S.track = b.dataset.track; save(); render(); });
  $$(".subnode[data-sub]", v).forEach(b => b.onclick = () => openSub(SUB_BY[b.dataset.sub]));
  bindRailMap(v);
  const c = $("#continue", v); if (c) c.onclick = () => openSub(nx);
  $("#review", v).onclick = startReview;
  // hidden: tap the little station five times to unlock up to any stop
  $("#train", v).onclick = () => { unlockTaps++; clearTimeout(unlockTimer); unlockTimer = setTimeout(() => unlockTaps = 0, 1500); SFX.tap(); if (unlockTaps >= 5) { unlockTaps = 0; openUnlockPicker(); } };
}

function openUnlockPicker() {
  openPlay("Secret ticket", (st) => {
    let tr = TRACKS.find(t => t.id === S.track) || TRACKS[1];
    const draw = () => {
      st.innerHTML = `<div class="card stack"><div class="row">${IMGW("station", 44)}<div style="flex:1;min-width:0"><h3>Unlock up to a stop</h3><p class="muted" style="font-size:.82rem">Every stop up to the one you pick opens. You still earn stamps and stars by clearing each one.</p></div></div>
        <div class="tracks">${TRACKS.map(t => `<button class="trk ${t === tr ? "on" : ""}" data-t="${t.id}">${IMGW(t.icon, 22)}<b>${t.jp}</b></button>`).join("")}</div>
        <div class="subgrid">${tr.subs.map(s => `<button class="subnode ${s.idx <= (S.unlockTo || 0) ? "open" : "locked"}" data-pick-sub="${s.idx}" style="--lv:${STAMP_INK[tr.id] || "var(--leaf-deep)"}"><span class="subnum">${s.num}</span><span class="subprev glyph">${esc(s.items.slice(0, 3).map(it => it.k || it).join(""))}</span></button>`).join("")}</div>
        <p class="muted" style="font-size:.78rem">Currently open up to: <b>${esc(ALL_SUBS[S.unlockTo || 0].title)}</b></p></div>`;
      $$("[data-t]", st).forEach(b => b.onclick = () => { tr = TRACKS.find(t => t.id === b.dataset.t); draw(); });
      $$("[data-pick-sub]", st).forEach(b => b.onclick = () => { S.unlockTo = +b.dataset.pickSub; S.track = ALL_SUBS[S.unlockTo].track.id; save(); toast(`Open up to ${ALL_SUBS[S.unlockTo].title}`); draw(); });
    };
    draw();
  });
}

// ---------- SUB-LEVEL ----------
function openSub(s) {
  openPlay(s.title, (st, hud) => {
    const stars = subStars(s);
    hud.innerHTML = `<span class="chip">${IMG("star")}${stars}/3</span>`;
    st.innerHTML = `${stationCardHTML(s, subStars(s) ? "Station reached" : "Next stop")}<div class="card stack" style="gap:8px"><div class="row">${IMGW(s.track.icon, 40)}<div style="flex:1;min-width:0"><h3>${esc(s.track.kana ? "Kana · " + s.title : s.title)}</h3><p class="muted" style="font-size:.82rem">${isKanaSub(s) ? `Study the cards, then pass the clear test to ride to ${esc(s.stop.p)}.` : `Study the cards, then pass the clear test to lay track to ${esc(s.stop.p)} and stamp all of these kanji. Mistakes come back until you get them.`}</p>${!isKanaSub(s) && tiedHere(s).length ? `<p class="localnote">${IMGW("station", 20)}<span>${tiedHere(s).length} of these ${s.items.length} kanji are on station signs or local landmarks around ${esc(s.stop.ro)}${s.items.some(w => TIES[w.k] && TIES[w.k][0] === "mei") ? `, plus its local special` : ""}.</span></p>` : ""}</div></div>
      <div class="bigstars">${starRow(stars, 30)}</div>
      <div class="row" style="justify-content:center"><button class="btn ghost" id="study">${IMG("book")}Study cards</button><button class="btn pink" id="clear">${IMG("check")}${stars ? "Retest for stars" : "Clear test"}</button></div></div>
      <div class="itemgrid">${s.items.map((it, i) => isKanaSub(s)
        ? `<button class="itemcard ${S.kana[it] ? "got" : ""}" data-i="${i}"><span class="glyph">${esc(it)}</span><small>${esc(kanaRo(it))}</small></button>`
        : `<button class="itemcard ${isStamped(it) ? "got" : ""} ${TIES[it.k] ? (TIES[it.k][0] === "mei" ? "mei" : "local") : ""}" data-i="${i}" style="--lv:${STAMP_INK[it.t]}"><span class="glyph">${esc(it.k)}</span><small>${esc(it.en)}</small>${isStamped(it) ? `<i class="gotdot"></i>` : ""}</button>`).join("")}</div>
      <p class="muted" style="font-size:.78rem;text-align:center">★★★ for 0–1 mistakes · ★★ for up to 4 · ★ for finishing.</p>
      ${scenesHTML(s)}${townWordsHTML(s)}`;
    bindScenes(st, s);
    $("#study", st).onclick = () => openStudy(s, 0);
    $("#clear", st).onclick = () => startClear(s);
    $$("[data-i]", st).forEach(b => b.onclick = () => openStudy(s, +b.dataset.i));
  });
}

function studyCardHTML(s, it) {
  if (isKanaSub(s)) {
    const x = EXTRAS.find(e => e.k === it);
    if (x) return `<div class="card lesson"><span class="eyebrow">Extras</span><div class="glyph big pop">${it}</div><div class="romaji">${esc(x.name)}</div>
      <div class="hintword">${IMG(x.e)}<div><div class="glyph">${x.ex[0]}</div><div class="ro" style="font-size:.9rem">${x.ex[1]}</div></div><button class="iconbtn" data-say="${x.ex[0]}" aria-label="Hear it">${IMGW("speaker", 22)}</button></div><p style="font-size:.9rem">${esc(x.tip)}</p></div>`;
    const [word, wro, wen, we] = HINTS[it];
    return `<div class="card lesson"><span class="eyebrow">Hiragana</span><div class="glyph big pop">${it}</div><div class="romaji">${esc(kanaRo(it))}</div>
      <button class="btn ghost small" data-say="${it}">${IMG("speaker")}Hear it</button>
      <div class="hintword">${IMG(we)}<div><div class="glyph">${word}</div><div class="ro" style="font-size:.9rem">${wro} · ${esc(wen)}</div></div><button class="iconbtn" data-say="${word}" aria-label="Hear ${wro}">${IMGW("speaker", 22)}</button></div></div>`;
  }
  const w = it;
  return `<div class="card lesson kcard-big" style="--lv:${STAMP_INK[w.t]}"><span class="eyebrow">JLPT ${w.t.toUpperCase()} · ${w.s} strokes</span>
    <div class="row" style="justify-content:center;gap:14px">${IMGW(w.e, 54)}<div class="glyph big pop">${esc(w.k)}</div></div>
    <div class="meanings"><b>${esc(w.ens[0])}</b>${w.ens.slice(1).map(m => `<span>${esc(m)}</span>`).join("")}</div>
    ${tieHTML(w)}
    <div class="radrow"><span class="eyebrow">Radicals</span><div class="radchips">${radsOf(w).map((r, i) => `<span class="radpair">${i ? `<span class="plus">+</span>` : ""}<span class="radchip"><span class="glyph">${esc(radGlyph(r))}</span><small>${esc(radMean(r))}</small></span></span>`).join("")}</div></div>
    <div class="readings">${w.on.length ? `<div><span class="eyebrow">On'yomi</span><div class="rlist">${w.on.map(x => `<button class="rd" data-say="${esc(x)}"><span class="glyph">${esc(x)}</span>${showRo() ? `<small>${esc(romaji(x))}</small>` : ""}</button>`).join("")}</div></div>` : ""}
      ${w.kun.length ? `<div><span class="eyebrow">Kun'yomi</span><div class="rlist">${w.kun.map(x => `<button class="rd" data-say="${esc(x.replace(".", ""))}"><span class="glyph">${kunHTML(x)}</span>${showRo() ? `<small>${esc(romaji(x.replace(".", "")))}</small>` : ""}</button>`).join("")}</div></div>` : ""}</div></div>`;
}
function openStudy(s, i0) {
  openPlay(`${s.title} · cards`, (st, hud) => {
    let i = i0;
    const draw = () => {
      const it = s.items[i];
      hud.innerHTML = `<span class="chip">${i + 1}/${s.items.length}</span>`;
      st.innerHTML = `${studyCardHTML(s, it)}
        <div class="row" style="justify-content:center"><button class="btn ghost" id="prev" ${i ? "" : "disabled"}>← Back</button>${i < s.items.length - 1 ? `<button class="btn" id="next">Next →</button>` : `<button class="btn pink" id="go">${IMG("check")}Take the clear test</button>`}</div>`;
      if (isKanaSub(s)) say(it === "゛" ? "が" : it); else say(it.r);
      $("#prev", st).onclick = () => { i--; draw(); };
      const n = $("#next", st); if (n) n.onclick = () => { i++; draw(); };
      const g = $("#go", st); if (g) g.onclick = () => startClear(s);
    };
    draw();
  });
}

// ---------- QUIZ ENGINE ----------
// q types: mean (kanji → meaning), read (kanji → reading, choices), type (kanji → typed reading), rad (pick the radicals),
//          which (radicals → kanji), k2r (kana → romaji), r2k (romaji → kana)
function pickDistinct(pool, n, avoid, keyFn = x => x) { const out = [], seen = new Set(avoid.map(keyFn)); for (const x of RND.shuffle(pool)) { const k = keyFn(x); if (seen.has(k)) continue; seen.add(k); out.push(x); if (out.length >= n) break; } return out; }
function kanjiPool(w) { const t = KJ.filter(x => x.n === w.n); return t.length > 8 ? t : KJ; }
function buildQ(q) {
  if (q.t === "mean") { const w = q.w; const d = pickDistinct(kanjiPool(w).filter(x => x !== w && !x.ens.some(m => w.ens.includes(m))), 3, [w.en], x => x.en); return { ...q, opts: RND.shuffle([w.en, ...d.map(x => x.en)]), ans: w.en }; }
  if (q.t === "read") { const w = q.w; const rs = readingsOf(w); const d = pickDistinct(kanjiPool(w).filter(x => x !== w && !rs.includes(x.r)), 3, [w.r], x => x.r); return { ...q, opts: RND.shuffle([w.r, ...d.map(x => x.r)]), ans: w.r }; }
  if (q.t === "rad") { const w = q.w; const C = radsOf(w); const pool = [...new Set(kanjiPool(w).flatMap(x => x.rad))].filter(r => !C.includes(r) && !C.some(c => radGlyph(c) === radGlyph(r))); const total = Math.min(9, Math.max(6, C.length + 4)); return { ...q, C, tray: RND.shuffle([...C, ...RND.shuffle(pool).slice(0, total - C.length)]) }; }
  if (q.t === "which") { const w = q.w; const C = radsOf(w); const pool = q.pool || kanjiPool(w); const near = pool.filter(x => x !== w && x.rad.some(r => C.includes(r)) && x.rad.join() !== w.rad.join()); const d = pickDistinct(near.length >= 3 ? near : pool.filter(x => x !== w), 3, [w.k], x => x.k); return { ...q, C, opts: RND.shuffle([w.k, ...d.map(x => x.k)]), ans: w.k }; }
  if (q.t === "k2r" || q.t === "r2k") { const k = q.k; const pool = q.pool.filter(x => x !== k); const la = LOOKALIKE_KANA[k]; const d = []; if (la && pool.includes(la) && RND.f() < .7) d.push(la); for (const x of RND.shuffle(pool)) { if (d.length >= 3) break; if (!d.includes(x)) d.push(x); } return { ...q, opts: RND.shuffle([k, ...d]), ans: k }; }
  return q;
}
function kInfoLine(w) { return `<span class="glyph">${esc(w.k)}</span> <b>${esc(w.en)}</b> · <span class="glyph">${esc(w.r)}</span> <span class="ro">${esc(w.ro)}</span>`; }
// runQuiz(st, hud, questions, {requeue, title, onAnswer(q, ok), onFinish({mistakes, total, missed})})
function runQuiz(st, hud, qs, opts = {}) {
  const queue = qs.map(q => ({ ...q })); const total = queue.length; let done = 0, mistakes = 0; const missedSet = new Set(); const missed = [];
  const drawHud = () => { hud.innerHTML = `<span class="chip">${done}/${total}</span>${mistakes ? `<span class="chip">${IMG("wilted")}${mistakes}</span>` : ""}`; };
  function next() {
    drawHud();
    if (!queue.length) return opts.onFinish({ mistakes, total, missed });
    const q = buildQ(queue.shift());
    const finish = (ok, wait) => {
      if (!ok) { const key = q.t + ":" + (q.w ? q.w.k : q.k); if (!missedSet.has(key)) { missedSet.add(key); mistakes++; missed.push(q); } if (opts.requeue !== false) queue.splice(Math.min(queue.length, 2 + RND.int(3)), 0, { t: q.t, w: q.w, k: q.k, pool: q.pool }); else done++; }
      else done++;
      opts.onAnswer && opts.onAnswer(q, ok);
      drawHud();
      if (wait) { const b = $("#qnext", st); b.hidden = false; b.focus({ preventScroll: true }); b.onclick = next; } else setTimeout(next, 650);
    };
    const pct = Math.round(done / total * 100);
    const head = `<div class="bar" style="height:8px"><i style="width:${pct}%"></i></div>`;
    const foot = `<div id="qfb" class="qfb"></div><div class="row" style="justify-content:center"><button class="btn" id="qnext" hidden>Continue →</button></div>`;
    const choiceBtns = (labels, render) => `<div class="choices">${labels.map(o => `<button class="choice" data-o="${esc(o)}">${render(o)}</button>`).join("")}</div>`;
    const onChoice = (correct, after) => $$(".choice", st).forEach(b => b.onclick = () => {
      if (st.dataset.lock) return; st.dataset.lock = 1; const ok = b.dataset.o === correct;
      b.classList.add(ok ? "right" : "wrong"); if (!ok) { const r = $$(".choice", st).find(x => x.dataset.o === correct); r && r.classList.add("right"); }
      ok ? SFX.good() : SFX.bad(); after && after(ok); delete st.dataset.lock; $$(".choice", st).forEach(x => x.disabled = true); finish(ok, !ok);
    });
    if (q.t === "mean" || q.t === "read") {
      const w = q.w;
      st.innerHTML = `${head}<div class="card quizq"><span class="eyebrow">${q.t === "mean" ? "What does this kanji mean?" : "How do you read it?"}</span><div class="glyph big pop">${esc(w.k)}</div>${q.t === "read" ? `<div class="muted">${esc(w.en)}</div>` : ""}</div>
        ${choiceBtns(q.opts, o => q.t === "mean" ? `<span style="font-size:1rem">${esc(o)}</span>` : `<span class="glyph" style="font-size:1.45rem">${esc(o)}</span>${showRo() ? `<div class="ro">${esc(romaji(o))}</div>` : ""}`)}${foot}`;
      onChoice(q.ans, ok => { say(w.r); $("#qfb", st).innerHTML = kInfoLine(w); });
    } else if (q.t === "type") {
      const w = q.w; const ok = readingsOf(w);
      st.innerHTML = `${head}<div class="card quizq"><span class="eyebrow">Type a reading</span><div class="glyph big pop">${esc(w.k)}</div><div class="muted">${esc(w.en)}</div></div>
        <div class="kinput"><input id="qin" type="text" placeholder="romaji → かな" aria-label="Type a reading"><button class="btn pink" id="qgo">Enter</button></div>
        <p class="typehint">Any on'yomi or kun'yomi counts, like WaniKani.</p>${foot}`;
      const inp = $("#qin", st); bindKana(inp); setTimeout(() => inp.focus({ preventScroll: true }), 40);
      const go = () => { const v = readInput(inp).replace(/[^ぁ-ゖー]/g, ""); if (!v || inp.disabled) return; const good = ok.includes(v); inp.disabled = true; $("#qgo", st).disabled = true; inp.classList.add(good ? "ok" : "no"); good ? SFX.good() : SFX.bad(); say(v);
        $("#qfb", st).innerHTML = good ? kInfoLine(w) : `Readings: ${[...w.on, ...w.kun.map(x => x.replace(".", ""))].map(x => `<span class="glyph">${esc(x)}</span> <span class="ro">${esc(romaji(x))}</span>`).join(" · ")}`; finish(good, !good); };
      $("#qgo", st).onclick = go; inp.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); go(); } });
    } else if (q.t === "rad") {
      const w = q.w; const sel = new Set();
      st.innerHTML = `${head}<div class="card quizq"><span class="eyebrow">Which radicals make up this kanji? (${q.C.length})</span><div class="glyph big pop">${esc(w.k)}</div><div class="muted">${esc(w.en)}</div></div>
        <div class="radtray">${q.tray.map((r, i) => `<button class="radtile" data-r="${i}"><span class="glyph">${esc(radGlyph(r))}</span><small>${esc(radMean(r))}</small></button>`).join("")}</div>
        <div class="row" style="justify-content:center"><button class="btn pink" id="qcheck" disabled>${IMG("check")}Check</button></div>${foot}`;
      $$(".radtile", st).forEach(b => b.onclick = () => { if (b.disabled) return; const i = +b.dataset.r; sel.has(i) ? sel.delete(i) : sel.add(i); b.classList.toggle("sel", sel.has(i)); SFX.tap(); $("#qcheck", st).disabled = !sel.size; });
      $("#qcheck", st).onclick = () => {
        const picked = [...sel].map(i => q.tray[i]); const good = picked.length === q.C.length && picked.every(r => q.C.includes(r));
        $$(".radtile", st).forEach(b => { const r = q.tray[+b.dataset.r]; b.disabled = true; b.classList.remove("sel"); if (q.C.includes(r)) b.classList.add(sel.has(+b.dataset.r) ? "right" : "missed"); else if (sel.has(+b.dataset.r)) b.classList.add("wrong"); });
        $("#qcheck", st).hidden = true; good ? SFX.good() : SFX.bad();
        $("#qfb", st).innerHTML = `<span class="glyph">${esc(w.k)}</span> = ${q.C.map(r => `<span class="glyph">${esc(radGlyph(r))}</span> ${esc(radMean(r))}`).join(" + ")}`;
        finish(good, !good);
      };
    } else if (q.t === "which") {
      const w = q.w;
      st.innerHTML = `${head}<div class="card quizq"><span class="eyebrow">Which kanji is built from these?</span><div class="radchips" style="justify-content:center">${q.C.map((r, i) => `<span class="radpair">${i ? `<span class="plus">+</span>` : ""}<span class="radchip"><span class="glyph">${esc(radGlyph(r))}</span><small>${esc(radMean(r))}</small></span></span>`).join("")}</div></div>
        ${choiceBtns(q.opts, o => `<span class="glyph" style="font-size:2.1rem">${esc(o)}</span>`)}${foot}`;
      onChoice(q.ans, () => { $("#qfb", st).innerHTML = kInfoLine(w); });
    } else {
      const k = q.k;
      st.innerHTML = `${head}<div class="card quizq">${q.t === "k2r" ? `<span class="eyebrow">How do you read this?</span><div class="glyph big pop">${esc(k)}</div>` : `<span class="eyebrow">Which kana is this sound?</span><div class="romaji pop">${esc(kanaRo(k))}</div><button class="btn ghost small" data-say="${esc(k)}">${IMG("speaker")}Hear it</button>`}</div>
        ${choiceBtns(q.opts, o => q.t === "k2r" ? esc(kanaRo(o)) : `<span class="glyph">${esc(o)}</span>`)}${foot}`;
      onChoice(q.ans, () => { if (!EXTRAS.some(e => e.k === k)) say(k); });
    }
  }
  next();
}
function starsFor(m) { return m <= 1 ? 3 : m <= 4 ? 2 : 1; }

// ---------- CLEAR TEST ----------
function startClear(s) {
  openPlay(`${s.title} · test`, (st, hud) => {
    let qs;
    if (isKanaSub(s)) { const pool = [...new Set([...s.items, ...KANA_SUBS.flatMap(x => x.items).filter(k => S.kana[k])])]; qs = RND.shuffle(s.items.flatMap(k => [{ t: "k2r", k, pool }, { t: "r2k", k, pool }])); }
    else { const readQ = S.role === "kanji" ? "type" : "read"; qs = RND.shuffle(s.items.flatMap((w, i) => [{ t: "mean", w }, { t: "rad", w }, ...(i % 2 === 0 || S.role === "kanji" ? [{ t: readQ, w }] : [])])); }
    runQuiz(st, hud, qs, {
      requeue: true,
      onAnswer: (q, ok) => { if (q.w && isStamped(q.w)) touchWord(q.w, ok, false); },
      onFinish: ({ mistakes, total, missed }) => {
        const stars = starsFor(mistakes); const prev = subStars(s); const fresh = [];
        const firstVisit = !prev;
        if (stars > prev) S.subs[s.id] = { stars, date: todayKey(), first: (S.subs[s.id] && S.subs[s.id].first) || todayKey() };
        if (isKanaSub(s)) s.items.forEach(k => { S.kana[k] = S.kana[k] || { pts: 7, last: now() }; S.kana[k].pts = Math.max(7, S.kana[k].pts); });
        else s.items.forEach(w => { if (touchWord(w, true, true)) fresh.push(w); });
        addStat("clears"); save();
        const nx = ALL_SUBS[s.idx + 1];
        const arrived = firstVisit && isCity(s);
        SFX.win(); if (stars === 3 || arrived) confetti(arrived ? 70 : 40);
        st.innerHTML = `<div class="card result pop ${arrived ? "arrival" : ""}"><span class="eyebrow">${esc(s.title)} cleared!</span>${arrived ? `${IMGW("houses", 72)}<h2>Welcome to ${esc(s.stop.p)}!</h2><p class="muted" style="font-size:.85rem">City ${CITY_SUBS.indexOf(s) + 1} of ${CITY_SUBS.length} · ${esc(s.stop.ro)}, ${esc(prefName(s))} · ${esc(s.stop.f)}</p>` : firstVisit ? `<h2>Track laid to ${esc(s.stop.p)}!</h2><p class="muted" style="font-size:.85rem">${esc(s.stop.ro)}, ${esc(prefName(s))} · ${esc(s.stop.f)}</p>` : IMGW(stars === 3 ? "crown" : "sakura", 90)}
          <div class="bigstars">${starRow(stars, 40)}</div><div class="score">${mistakes} mistake${mistakes === 1 ? "" : "s"}</div>
          <p>${stars > prev ? (prev ? `New best! Up from ${"★".repeat(prev)}.` : isKanaSub(s) ? "These kana are learned!" : `${fresh.length} kanji stamped into your book!`) : `Your best here is still ${"★".repeat(prev)}.`}</p>
          ${missed.length ? `<p class="muted" style="font-size:.85rem">Tricky ones: ${[...new Set(missed.map(q => q.w ? q.w.k : q.k))].map(x => `<span class="glyph">${esc(x)}</span>`).join(" ")}</p>` : ""}
          <div class="row" style="justify-content:center"><button class="btn ghost" id="retry">Retest</button>${nx ? `<button class="btn" id="nextsub">Next: ${esc(nx.title)}</button>` : ""}<button class="btn ghost" id="done">Route</button></div></div>`;
        $("#retry", st).onclick = () => startClear(s);
        if (nx) $("#nextsub", st).onclick = () => openSub(nx);
        $("#done", st).onclick = () => closePlay();
        setTimeout(() => { if (firstVisit) stationNow(s); stampMany(fresh); holdCelebrations(false); }, 500);
      }
    });
  });
}

// ---------- REVIEW ----------
function startReview() {
  const ws = stampedWords(), ks = plantedKana().map(x => x.k);
  if (!ws.length && !ks.length) return;
  const weight = w => { const s = S.words[w.k] || {}; return 1 + Math.max(0, 10 - (s.pts || 0)) + (s.miss || 0) * 3; };
  const pickW = () => { let r = RND.f() * ws.reduce((a, w) => a + weight(w), 0); for (const w of ws) { r -= weight(w); if (r <= 0) return w; } return ws[0]; };
  const qs = []; const N = Math.min(15, Math.max(8, ws.length + ks.length));
  for (let i = 0; i < N; i++) {
    if (ws.length && (RND.f() < .8 || !ks.length)) { const w = pickW(); if (qs.some(q => q.w === w) && ws.length > N) { i--; continue; } const t = RND.pick(["mean", "mean", S.role === "kanji" ? "type" : "read", "rad"]); qs.push({ t, w }); }
    else { const k = RND.pick(ks); qs.push({ t: RND.f() < .5 ? "k2r" : "r2k", k, pool: ks }); }
  }
  openPlay("Review", (st, hud) => runQuiz(st, hud, qs, {
    requeue: false,
    onAnswer: (q, ok) => { if (q.w) touchWord(q.w, ok, false); else if (ok) waterKana(q.k); },
    onFinish: ({ mistakes, total, missed }) => { save(); SFX.win(); if (!mistakes) confetti();
      resultScreen(st, { icon: mistakes ? "droplet" : "sunflower", title: mistakes ? "Review done!" : "Perfect review!", score: `${total - mistakes} / ${total}`,
        lines: [missed.length ? `<span class="muted">Worth another look:</span><br>${[...new Set(missed.filter(q => q.w).map(q => q.w))].map(kInfoLine).join("<br>")}` : "Everything you've stamped is feeling strong."], again: startReview, againLabel: "Review again" }); }
  }));
}

// ---------- BOOK (collection, trophies, rally cards, stamp book, settings) ----------
function completionPct() {
  const parts = [foundCount() / UNIQUE_WORDS.length, plantedKana().length / 46, trophyCount() / TROPHIES.length, allStars() / (RALLY_GAMES.length * LEVELS_N * 3), ALL_SUBS.reduce((a, s) => a + subStars(s), 0) / (ALL_SUBS.length * 3)];
  return Math.floor(parts.reduce((a, b) => a + b, 0) / parts.length * 1000) / 10;
}
let BOOK_OPEN = { n5: true };
function stampGridHTML(pg) {
  const ws = pageWords(pg);
  return `<div class="stampgrid">${ws.map(w => isStamped(w) ? `<button class="stampslot" data-word="${w.id}" aria-label="${esc(w.en)}">${stampHTML(w, 76)}<small>${esc(w.en)}</small></button>` : `<div class="stampslot"><div class="empty sm">?</div><small>${w.s} strokes</small></div>`).join("")}</div>`;
}
function viewBook(v) {
  const found = foundCount();
  v.innerHTML = `
  <section class="card stack"><header class="row">${IMGW("crown", 40)}<div style="flex:1;min-width:0"><h2>Collection</h2><p class="muted" style="font-size:.82rem">Everything you've learned, stamped and won.</p></div><span class="pill pink" style="font-size:.9rem">${completionPct()}%</span></header>
    <div class="bar" style="height:12px"><i style="width:${completionPct()}%"></i></div>
    <div class="stats"><div class="stat"><b>${found}/${UNIQUE_WORDS.length}</b><span>kanji stamps</span></div><div class="stat"><b>${plantedKana().length}/46</b><span>kana learned</span></div><div class="stat"><b>${trophyCount()}/${TROPHIES.length}</b><span>trophies</span></div></div>
    <div class="stats"><div class="stat"><b>${ALL_SUBS.filter(s => subStars(s)).length}/${ALL_SUBS.length}</b><span>stations</span></div><div class="stat"><b>${ALL_SUBS.reduce((a, s) => a + subStars(s), 0)}/${ALL_SUBS.length * 3}</b><span>route stars</span></div><div class="stat"><b>${allStars()}/${RALLY_GAMES.length * LEVELS_N * 3}</b><span>rally stars</span></div></div></section>
  <section class="card stack"><header class="row"><h2>Trophy cabinet</h2><span class="spacer"></span><span class="pill pink">${trophyCount()}/${TROPHIES.length}</span></header>
    ${["Learn", "Stamps", "Sushi", "Puzzles", "Rally cards"].map(gp => `<span class="eyebrow">${gp}</span><div class="cabinet">${TROPHIES.filter(t => t.group === gp).map(t => { const got = S.trophies && S.trophies[t.id]; return `<button class="trophy ${got ? "got" : ""} ${t.gold ? "goldt" : ""}" data-trophy="${t.id}" aria-label="${esc(t.name)}${got ? "" : " (locked)"}"><div class="medal">${IMG(t.icon)}</div><small>${got ? esc(t.name) : "???"}</small></button>`; }).join("")}</div>`).join("")}
  </section>
  ${stationStampsHTML()}
  <section class="stampbook"><header class="row"><h2>Kanji stamps</h2><span class="spacer"></span><span class="pill pink">${found}/${UNIQUE_WORDS.length} stamps</span></header>
    <p class="muted" style="font-size:.85rem">Like the 駅スタンプ (eki sutanpu, station stamps) at Japanese train stations: every kanji you clear gets stamped here, one page per JLPT level.</p>
    ${STAMP_PAGES.map(pg => { const ws = pageWords(pg); const got = ws.filter(isStamped).length; return `<details class="stamppage" data-page="${pg.id}" ${BOOK_OPEN[pg.id] ? "open" : ""}><summary class="stamppage-h">${IMGW(pg.icon, 24)}<h3>${pg.name}</h3><span class="spacer"></span>${got === ws.length ? `<span class="kanseal" title="Page complete">完</span>` : `<small>${got}/${ws.length}</small>`}</summary><div class="pagebody">${BOOK_OPEN[pg.id] ? stampGridHTML(pg) : ""}</div></details>`; }).join("")}
  </section>
  <section class="stampbook"><header class="row"><h2>Rally cards</h2><span class="spacer"></span><span class="pill pink">${allStars()}/${RALLY_GAMES.length * LEVELS_N * 3} ★</span></header>
    <p class="muted" style="font-size:.85rem">One card per game. Clear a level to stamp it: bronze ★, silver ★★, gold ★★★.</p>
    ${RALLY_GAMES.map(rg => { const tot = lvTotal(rg.id); return `<div class="stamppage-h">${IMGW(rg.icon, 26)}<h3>${rg.name}</h3><span class="spacer"></span>${tot >= LEVELS_N * 3 ? `<span class="kanseal" title="All gold">金</span>` : lvCleared(rg.id) >= LEVELS_N ? `<span class="kanseal" title="Card complete">完</span>` : `<small>${tot}/${LEVELS_N * 3} ★</small>`}</div>
    <div class="rallyrow">${Array.from({ length: LEVELS_N }, (_, i) => { const n = i + 1, s = lvStars(rg.id, n); return s ? `<button class="stampslot" data-rally="${rg.id}" aria-label="Level ${n}, ${s} stars">${rallyStampHTML(rg.id, n, s, 58)}</button>` : `<button class="stampslot" data-rally="${rg.id}" aria-label="Level ${n}"><div class="empty small">${n}</div></button>`; }).join("")}</div>`; }).join("")}
  </section>
  <section class="card stack"><h2>Kana chart</h2><div class="chart">${ROWS.flatMap(r => { const cells = r.kana.map(([k, ro]) => `<div class="${S.kana[k] ? "s3" : "none"}"><div class="glyph">${k}</div><span class="ro">${ro}</span></div>`); while (cells.length < 5) cells.push(`<div class="none" aria-hidden="true"></div>`); return cells; }).join("")}</div>
    <p class="muted" style="font-size:.78rem">Pink outline = learned.</p></section>
  <section class="card stack"><h2>Your buds</h2><div class="budrow">${BUDS.map(b => { const s = bud(b.id); return `<div class="budcard">${IMG(b.sprites[Math.min(2, Math.floor((s.lvl - 1) / 3))])}<div style="font-weight:800">${b.name} <span class="glyph" style="font-size:.85rem">${b.jp}</span></div><div class="ro">Lv ${s.lvl} · loves ${esc(b.likes)}</div></div>`; }).join("")}</div></section>
  <section class="card stack"><h2>Settings</h2>
    <label class="lab" for="nm">Your name</label><input id="nm" type="text" value="${esc(S.name)}" placeholder="e.g. Ken">
    <div class="stack" style="gap:6px"><span class="lab">Your role</span><div class="seg" role="group"><button data-role="kana" aria-pressed="${S.role === "kana"}">かな Kana speller</button><button data-role="kanji" aria-pressed="${S.role === "kanji"}">漢字 Kanji reader</button></div>
    <p class="muted" style="font-size:.8rem">Kana spellers pick readings from choices. Kanji readers type readings, WaniKani style, and see bare kanji on plates and puzzles.</p></div>
    <div class="row"><span class="lab">Romaji helper</span><span class="spacer"></span><div class="seg"><button data-ro="1" aria-pressed="${S.romaji}">On</button><button data-ro="0" aria-pressed="${!S.romaji}">Off</button></div></div>
    <div class="row"><span class="lab">Sound effects</span><span class="spacer"></span><div class="seg"><button data-snd="1" aria-pressed="${S.sound}">On</button><button data-snd="0" aria-pressed="${!S.sound}">Off</button></div></div>
    <div class="row"><button class="btn ghost small" id="knowall">I already know hiragana: skip to N5</button></div>
    <div class="row"><button class="btn ghost small" id="reset">Start over</button><span id="resetconfirm"></span></div>
    <p class="muted" style="font-size:.75rem">Progress is saved in this browser on this device. Fluent Emoji art by Microsoft (MIT). Kanji, readings and meanings from KANJIDIC2; radicals from RADKFILE, the property of the Electronic Dictionary Research and Development Group, used under the Group's licence (CC BY-SA 4.0). Radical names from Kanji alive (CC BY 4.0). JLPT levels from Jonathan Waller's lists (CC BY).</p>
  </section>`;
  $$("details.stamppage[data-page]", v).forEach(d => d.addEventListener("toggle", () => { const pg = STAMP_PAGES.find(p => p.id === d.dataset.page); BOOK_OPEN[pg.id] = d.open; const body = $(".pagebody", d); if (d.open && !body.innerHTML) { body.innerHTML = stampGridHTML(pg); bindStampClicks(body); } }));
  bindStampClicks(v); bindStationStamps(v);
  $$("[data-rally]", v).forEach(b => b.onclick = () => openLevels(b.dataset.rally));
  $$("[data-trophy]", v).forEach(b => b.onclick = () => { const t = TROPHIES.find(x => x.id === b.dataset.trophy); const got = S.trophies && S.trophies[t.id]; toast(got ? `${t.name}: ${t.desc} (won ${got})` : `Locked: ${t.desc}`); });
  $("#nm").onchange = e => { S.name = e.target.value.trim().slice(0, 20); save(); render(); };
  $$("[data-role]").forEach(b => b.onclick = () => { S.role = b.dataset.role; save(); render(); });
  $$("[data-ro]").forEach(b => b.onclick = () => { S.romaji = b.dataset.ro === "1"; save(); render(); });
  $$("[data-snd]").forEach(b => b.onclick = () => { S.sound = b.dataset.snd === "1"; save(); render(); });
  $("#knowall").onclick = () => { KANA_SUBS.flatMap(s => s.items).forEach(k => { S.kana[k] = S.kana[k] || { pts: 7, last: now() }; }); S.unlockTo = Math.max(S.unlockTo || 0, TRACKS[1].subs[0].idx); S.track = "n5"; save(); toast("All kana learned. N5 is open!"); render(); };
  $("#reset").onclick = () => { $("#resetconfirm").innerHTML = `<button class="btn small" style="background:var(--bad);box-shadow:none" id="reset2">Yes, erase everything</button>`; $("#reset2").onclick = () => { S = DEFAULT(); save(); TAB = "learn"; render(); toast("A fresh start!"); }; };
}
function bindStampClicks(root) {
  $$("[data-word]", root).forEach(b => b.onclick = () => { const w = KJ[+b.dataset.word]; openPlay(w.k, st => { st.innerHTML = `<div class="stampbook" style="display:flex;justify-content:center;padding:24px">${stampHTML(w, 180, "thunk")}</div>${studyCardHTML({ track: {} }, w)}<p class="muted" style="text-align:center;font-size:.8rem">Stamped ${esc(S.words[w.k].stamped || "")}</p>`; say(w.r); }); });
}
