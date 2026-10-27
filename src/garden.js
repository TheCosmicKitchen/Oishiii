// ===== shell, garden, kanji pot, book =====
let TAB = "garden";
try { TAB = sessionStorage.getItem("kg.tab") || "garden"; } catch (e) { }
const TABS = [
  { id: "garden", label: "Garden", jp: "にわ", icon: "seedling" },
  { id: "sushi", label: "Sushi", jp: "すし", icon: "sushi" },
  { id: "puzzles", label: "Puzzles", jp: "パズル", icon: "puzzle" },
  { id: "book", label: "Stamps", jp: "スタンプ", icon: "book" },
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
  ({ garden: viewGarden, sushi: viewSushi, puzzles: viewPuzzles, book: viewBook })[TAB]($("#view"));
}

// ---------- GARDEN ----------
function plantSprite(k) { if (isWilting(k)) return "wilted"; return ["seedling", "herb", "blossom"][kanaStage(k)]; }
function viewGarden(v) {
  const planted = plantedKana().length, found = UNIQUE_WORDS.filter(w => wordState(w)?.found).length;
  const thirsty = 0;
  const greet = S.name ? `おかえり、${esc(S.name)}！` : "ようこそ！";
  v.innerHTML = `
  <section class="hello">${IMG(thirsty ? "wilted" : "sunflower")}<div class="stack" style="gap:4px;flex:1;min-width:0">
    <h2>${greet}</h2><p class="muted" style="font-size:.85rem">${thirsty ? `${thirsty} plant${thirsty > 1 ? "s are" : " is"} thirsty. Water the garden to perk them up!` : planted ? "Plant new seeds, water your kana, and pop kanji out of the pot." : "Tap an empty plot to plant your first kana seed."}</p>
    <div class="stats"><div class="stat"><b>${planted}</b><span>kana / 46</span></div><div class="stat"><b>${found}</b><span>kanji grown</span></div><div class="stat"><b>${S.served || 0}</b><span>plates served</span></div></div></div></section>
  <div class="row"><button class="btn" id="water" ${planted ? "" : "disabled"}>${IMG("droplet")}Water the garden</button>${thirsty ? `<span class="pill pink">${IMGW("wilted", 16)} ${thirsty} thirsty</span>` : ""}</div>
  ${Object.keys(GATES).some(id => !gateOpen(id)) ? `<section class="card stack" style="gap:8px"><header class="row">${IMGW("station", 34)}<div style="flex:1;min-width:0"><h3>Next unlocks</h3><p class="muted" style="font-size:.8rem">Games only quiz you on kana you've planted and kanji you've stamped.</p></div></header>
    ${Object.keys(GATES).filter(id => !gateOpen(id)).slice(0, 3).map(id => `<div class="row" style="gap:8px;flex-wrap:nowrap">${IMGW(GATES[id].icon, 30)}<div style="flex:1;min-width:0"><b style="font-size:.88rem">${GATES[id].name}</b>${lockCard(id)}</div></div>`).join("")}</section>` : ""}
  <section class="card pot stack" id="pot"></section>
  <div class="stack" id="beds"></div>`;
  $("#water").onclick = startWater;
  const beds = $("#beds");
  ROWS.forEach((row, i) => {
    const open = rowUnlocked(i);
    const sec = document.createElement("section"); sec.className = "bed" + (open ? "" : " locked");
    const grown = row.kana.filter(([k]) => kanaStage(k) >= 1).length;
    sec.innerHTML = `<header><span class="glyph">${row.name}</span><h3>${row.ro}-row bed</h3><span class="spacer"></span><span class="pill ${grown === row.kana.length ? "done" : ""}">${grown}/${row.kana.length} budding</span></header>
      <div class="soil">${row.kana.map(([k, ro]) => {
        if (!S.kana[k]) return open ? `<button class="plot empty" data-plant="${k}" aria-label="Plant ${ro}">${IMG("beans")}<span>plant</span></button>` : `<div class="plot empty" aria-hidden="true"></div>`;
        return `<button class="plot ${isWilting(k) ? "wilt" : ""}" data-info="${k}" aria-label="${ro}">${IMG(plantSprite(k))}<span class="stake">${k}${showRo() ? `<small>${ro}</small>` : ""}</span></button>`;
      }).join("")}${row.kana.length < 5 ? `<div></div>`.repeat(5 - row.kana.length) : ""}</div>
      ${open ? "" : `<p class="lockmsg" style="margin-top:8px">${IMG("lock")}Grow every ${ROWS[i - 1].name} plant to a bud ${IMGW("herb", 18)} to open this bed.</p>`}`;
    beds.appendChild(sec);
  });
  { const open = rowUnlocked(ROWS.length); const sec = document.createElement("section"); sec.className = "bed" + (open ? "" : " locked");
    sec.innerHTML = `<header><span class="glyph">゛</span><h3>Extras bed</h3><span class="spacer"></span><span class="pill ${plantedExtras().length === EXTRAS.length ? "done" : ""}">${plantedExtras().length}/${EXTRAS.length} planted</span></header>
      <div class="soil">${EXTRAS.map(x => S.kana[x.k] ? `<button class="plot" data-extra="${x.k}" aria-label="${x.name}">${IMG("blossom")}<span class="stake">${x.k}<small>${x.name}</small></span></button>` : open ? `<button class="plot empty" data-extra="${x.k}" aria-label="Plant ${x.name}">${IMG("beans")}<span>plant</span></button>` : `<div class="plot empty" aria-hidden="true"></div>`).join("")}</div>
      ${open ? `<p class="muted" style="font-size:.8rem;margin-top:8px">These marks unlock words with sounds like が (ga), じゅう (juu) and っ in the Kanji Pot.</p>` : `<p class="lockmsg" style="margin-top:8px">${IMG("lock")}Grow every わ plant to a bud ${IMGW("herb", 18)} to open this bed.</p>`}`;
    beds.appendChild(sec); }
  $$("[data-extra]", beds).forEach(b => b.onclick = () => openExtraLesson(b.dataset.extra));
  $$("[data-plant]", beds).forEach(b => b.onclick = () => openLesson(b.dataset.plant));
  $$("[data-info]", beds).forEach(b => b.onclick = () => openLesson(b.dataset.info, true));
  renderPot($("#pot"));
}

// lesson card for planting / reviewing a kana
function openLesson(k, review) {
  const [word, wro, wen, we] = HINTS[k]; const ro = KANA_RO[k];
  openPlay(review ? `${k} · ${ro}` : "Plant a seed", (st) => {
    const stage = kanaStage(k);
    st.innerHTML = `<div class="card lesson">
      <span class="eyebrow">${review ? ["Sprout", "Bud", "Bloom"][stage] + " · " + (S.kana[k].pts) + " drops" : "New kana"}</span>
      <div class="glyph big pop">${k}</div><div class="romaji">${ro}</div>
      <button class="btn ghost small" data-say="${k}">${IMG("speaker")}Hear it</button>
      <div class="hintword">${IMG(we)}<div><div class="glyph">${word}</div><div class="ro" style="font-size:.9rem">${wro} · ${esc(wen)}</div></div><button class="iconbtn" data-say="${word}" aria-label="Hear ${wro}">${IMGW("speaker", 22)}</button></div>
      ${review ? `<button class="btn" id="go">Back to the garden</button>` : `<p class="muted" style="font-size:.85rem">Say it out loud together, then plant it. Watering (quizzes) helps it grow from a sprout to a bloom.</p><button class="btn pink" id="go">${IMG("seedling")}Plant ${k}</button>`}
    </div>`;
    say(k);
    $("#go", st).onclick = () => { if (!review) { S.kana[k] = { pts: 0, last: now() }; save(); SFX.pop(); toast(`${k} planted! Water it to help it grow.`); } closePlay(); };
  });
}

function openExtraLesson(k) {
  const x = EXTRAS.find(e => e.k === k); const have = !!S.kana[k];
  openPlay(have ? x.name : "Plant a mark", (st) => {
    st.innerHTML = `<div class="card lesson"><span class="eyebrow">Extras bed</span><div class="glyph big pop">${k}</div><div class="romaji">${x.name}</div>
      <div class="hintword">${IMG(x.e)}<div><div class="glyph">${x.ex[0]}</div><div class="ro" style="font-size:.9rem">${x.ex[1]}</div></div><button class="iconbtn" data-say="${x.ex[0]}" aria-label="Hear it">${IMGW("speaker", 22)}</button></div>
      <p style="font-size:.9rem">${esc(x.tip)}</p>
      ${have ? `<button class="btn" id="go">Back to the garden</button>` : `<button class="btn pink" id="go">${IMG("seedling")}Plant ${k}</button>`}</div>`;
    $("#go", st).onclick = () => { if (!have) { S.kana[k] = { pts: 7, last: now() }; save(); SFX.pop(); toast(`${x.name} planted! Use it in the Kanji Pot.`); } closePlay(); };
  });
}

// watering quiz
function startWater() {
  const pool = plantedKana(); if (!pool.length) return;
  const n = Math.min(10, Math.max(5, pool.length * 2));
  const weight = x => (isWilting(x.k) ? 6 : 1) + Math.max(0, 8 - (S.kana[x.k].pts));
  const qs = [];
  for (let i = 0; i < n; i++) { let tot = pool.reduce((a, x) => a + weight(x), 0), r = RND.f() * tot; let pick = pool[0]; for (const x of pool) { r -= weight(x); if (r <= 0) { pick = x; break; } } if (qs.length && qs[qs.length - 1].k === pick.k && pool.length > 1) { i--; continue; } qs.push({ k: pick.k, ro: pick.ro, type: RND.f() < .5 ? "k2r" : "r2k" }); }
  const sw = stampedWords();
  if (sw.length >= 4) qs.forEach((q, j) => { if (RND.f() < .35) { const ws = sw.map(w => ({ w, wt: 1 + Math.max(0, 8 - wordState(w).pts) })); let r = RND.f() * ws.reduce((a, x) => a + x.wt, 0), pick = ws[0].w; for (const x of ws) { r -= x.wt; if (r <= 0) { pick = x.w; break; } } qs[j] = { type: "word", w: pick }; } });
  openPlay("Watering time", (st, hud) => {
    let i = 0, right = 0; const res = [];
    const next = () => {
      if (i >= qs.length) { save(); SFX.win(); if (right === qs.length) confetti(); return resultScreen(st, { icon: right >= qs.length * .8 ? "sunflower" : "droplet", title: right === qs.length ? "Perfect watering!" : "The garden says thanks!", score: `${right} / ${qs.length}`, lines: ["Every right answer adds a drop. Plants bud at 3 drops and bloom at 7."], again: startWater, againLabel: "Water again" }); }
      const q = qs[i];
      if (q.type === "word") {
        const w = q.w; const opts = RND.shuffle([w.r, ...RND.shuffle(sw.filter(x => x.r !== w.r)).map(x => x.r).filter((v, j, a) => a.indexOf(v) === j).slice(0, 3)]);
        st.innerHTML = `<div class="progress">${qs.map((_, j) => `<i class="${j < i ? (res[j] ? "ok" : "no") : j === i ? "now" : ""}"></i>`).join("")}</div>
          <div class="card quizq">${S.role === "kanji" ? `<span class="eyebrow">Read this stamp</span><div class="glyph big pop">${esc(w.k)}</div>` : `<span class="eyebrow">Which word is this?</span><div class="pop">${IMGW(w.e, 76)}</div><div><b>${esc(w.en)}</b></div>`}</div>
          <div class="choices">${opts.map(o => `<button class="choice" data-o="${o}"><span class="glyph" style="font-size:1.4rem">${o}</span>${showRo() && S.role === "kana" ? `<div class="ro">${romaji(o)}</div>` : ""}</button>`).join("")}</div>`;
        $$(".choice", st).forEach(b => b.onclick = () => {
          if (st.dataset.lock) return; st.dataset.lock = 1; const ok = b.dataset.o === w.r; res[i] = ok;
          b.classList.add(ok ? "right" : "wrong"); if (!ok) $(`.choice[data-o="${w.r}"]`, st).classList.add("right");
          touchWord(w, ok, false); if (ok) { right++; SFX.good(); } else SFX.bad(); say(w.r);
          if (!ok || S.role === "kanji") toast(`${w.k} = ${w.r} (${w.ro}) · ${w.en}`);
          setTimeout(() => { delete st.dataset.lock; i++; next(); }, ok ? 800 : 1700);
        });
        return;
      }
      const distract = () => { const opts = new Set([q.k]); const la = LOOKALIKE_KANA[q.k]; if (la && RND.f() < .7) opts.add(la); const others = RND.shuffle(ALL_KANA.filter(x => x.k !== q.k && x.k !== "を")); const pl = RND.shuffle(pool.filter(x => x.k !== q.k)); for (const x of [...pl, ...others]) { if (opts.size >= 4) break; opts.add(x.k); } return RND.shuffle([...opts]); };
      const opts = distract();
      st.innerHTML = `<div class="progress">${qs.map((_, j) => `<i class="${j < i ? (res[j] ? "ok" : "no") : j === i ? "now" : ""}"></i>`).join("")}</div>
       <div class="card quizq">${q.type === "k2r" ? `<span class="eyebrow">How do you read this?</span><div class="glyph big pop">${q.k}</div>` : `<span class="eyebrow">Which kana is this sound?</span><div class="romaji pop">${q.ro}</div><button class="btn ghost small" data-say="${q.k}">${IMG("speaker")}Hear it</button>`}</div>
       <div class="choices">${opts.map(o => `<button class="choice" data-o="${o}">${q.type === "k2r" ? (o === "を" ? "o (wo)" : KANA_RO[o]) : `<span class="glyph">${o}</span>`}</button>`).join("")}</div>`;
      $$(".choice", st).forEach(b => b.onclick = () => {
        if (st.dataset.lock) return; st.dataset.lock = 1;
        const ok = b.dataset.o === q.k; res[i] = ok;
        b.classList.add(ok ? "right" : "wrong"); if (!ok) $(`.choice[data-o="${q.k}"]`, st).classList.add("right");
        if (ok) { right++; waterKana(q.k); SFX.good(); } else { SFX.bad(); S.kana[q.k].last = now(); }
        say(q.k);
        setTimeout(() => { delete st.dataset.lock; i++; next(); }, ok ? 650 : 1400);
      });
    };
    next();
  });
}

// ---------- KANJI POT ----------
let POT = [];
function potRecipes() { const have = haveTiles(); return UNIQUE_WORDS.filter(w => spellable(w.r, have)); }
function renderPot(el) {
  const pk = plantedKana();
  const recipes = potRecipes(); const fresh = recipes.filter(w => !wordState(w)?.found);
  el.innerHTML = `<header class="row"><h2>The Kanji Pot</h2><span class="spacer"></span><span class="pill pink">${recipes.length - fresh.length}/${recipes.length} grown</span></header>
    <p class="muted" style="font-size:.85rem">Drop kana in to spell a word's reading. If it's a real word, a kanji grows out and gets stamped in your book!</p>
    <div class="potstage">${IMG("watering")}<div class="slots">${[0, 1, 2, 3, 4, 5].map(i => `<div class="slot ${POT[i] ? "filled" : ""}" data-drop="slot">${POT[i] || ""}</div>`).join("")}</div></div>
    <div class="tiles" id="pottiles">${pk.length ? pk.map(x => `<button class="tile" data-pick="${x.k}">${kanaHTML(x.k)}</button>`).join("") + plantedExtras().map(x => `<button class="tile extra" data-pick="${x.k}"><span class="glyph">${x.k}</span>${showRo() ? `<span class="ro">${esc(x.name)}</span>` : ""}</button>`).join("") : `<p class="muted">Plant kana below to fill your pot.</p>`}</div>
    <div class="row" style="justify-content:center"><button class="btn ghost small" id="potclear" ${POT.length ? "" : "disabled"}>Empty</button><button class="btn pink" id="potgo" ${POT.length ? "" : "disabled"}>${IMG("sparkles")}Pop!</button></div>
    ${fresh.length ? `<div class="stack" style="gap:6px"><span class="eyebrow">Things you could grow right now</span><div class="hints">${fresh.slice(0, 8).map(w => `<button class="hint" data-hint="${w.id}">${IMG(w.e)}<span>${esc(w.en)}</span><span class="dots">${"●".repeat(tilesOf(w.r).length)}</span></button>`).join("")}</div></div>` : pk.length ? `<p class="muted" style="font-size:.85rem">You've grown everything these kana can make. Plant more to discover new kanji!</p>` : ""}
    <div id="potout"></div>`;
  DND.onDrop = (id, zone) => { if (zone === "slot" && POT.length < 6) { POT.push(id); SFX.tap(); renderPot(el); } };
  DND.onTap = (id) => { if (POT.length < 6) { POT.push(id); SFX.tap(); renderPot(el); } return false; };
  $("#potclear", el).onclick = () => { POT = []; renderPot(el); };
  $$("[data-hint]", el).forEach(b => b.onclick = () => { const w = WORDS[+b.dataset.hint]; toast(`Hint: it starts with ${w.r[0]} (${KANA_RO[w.r[0]]}) · ${[...w.r].length} kana`); });
  $("#potgo", el).onclick = () => {
    const s = composeTiles(POT); const hits = UNIQUE_WORDS.filter(w => w.r === s); POT = [];
    const out = () => $("#potout", el);
    if (!hits.length) { SFX.bad(); renderPot(el); out().innerHTML = `<p class="muted shake" style="text-align:center">${esc(s)} (${romaji(s)})… nothing sprouted. Try another mix!</p>`; return; }
    const newOnes = hits.filter(w => !wordState(w)?.found);
    if (hits.length > 1) S.stats.homophone = 1; hits.forEach(w => touchWord(w, true, true)); save(); setTimeout(() => newOnes.forEach(stampNow), 700);
    SFX.pop(); if (newOnes.length) confetti(); say(s);
    renderPot(el);
    out().innerHTML = `<div class="stack" style="gap:4px">${hits.length > 1 ? `<p style="text-align:center;font-weight:800">${s} grows ${hits.length} kanji! Same sound, different meanings.</p>` : ""}<div class="row" style="justify-content:center;gap:18px">${hits.map(w => wordReveal(w, newOnes.includes(w) ? `<span class="pill pink">New kanji!</span>` : `<span class="pill">+1 drop</span>`)).join("")}</div></div>`;
  };
}

// ---------- BOOK (collection, trophies, stamp book, settings) ----------
function completionPct() {
  const parts = [foundCount() / UNIQUE_WORDS.length, ALL_KANA.filter(x => kanaStage(x.k) >= 2).length / 46, trophyCount() / TROPHIES.length, allStars() / (RALLY_GAMES.length * LEVELS_N * 3)];
  return Math.floor(parts.reduce((a, b) => a + b, 0) / parts.length * 100);
}
function viewBook(v) {
  const found = UNIQUE_WORDS.filter(w => wordState(w)?.found);
  v.innerHTML = `
  <section class="card stack"><header class="row">${IMGW("crown", 40)}<div style="flex:1;min-width:0"><h2>Collection</h2><p class="muted" style="font-size:.82rem">Everything you've grown, stamped and won.</p></div><span class="pill pink" style="font-size:.9rem">${completionPct()}%</span></header>
    <div class="bar" style="height:12px"><i style="width:${completionPct()}%"></i></div>
    <div class="stats"><div class="stat"><b>${found.length}/${UNIQUE_WORDS.length}</b><span>stamps</span></div><div class="stat"><b>${ALL_KANA.filter(x => kanaStage(x.k) >= 2).length}/46</b><span>kana in bloom</span></div><div class="stat"><b>${trophyCount()}/${TROPHIES.length}</b><span>trophies</span></div></div><div class="stats" style="grid-template-columns:1fr"><div class="stat"><b>${allStars()}/${RALLY_GAMES.length * LEVELS_N * 3}</b><span>rally stars</span></div></div></section>
  <section class="card stack"><header class="row"><h2>Trophy cabinet</h2><span class="spacer"></span><span class="pill pink">${trophyCount()}/${TROPHIES.length}</span></header>
    ${["Garden", "Stamps", "Sushi", "Puzzles", "Rally cards"].map(gp => `<span class="eyebrow">${gp}</span><div class="cabinet">${TROPHIES.filter(t => t.group === gp).map(t => { const got = S.trophies && S.trophies[t.id]; return `<button class="trophy ${got ? "got" : ""} ${t.gold ? "goldt" : ""}" data-trophy="${t.id}" aria-label="${esc(t.name)}${got ? "" : " (locked)"}"><div class="medal">${IMG(t.icon)}</div><small>${got ? esc(t.name) : "???"}</small></button>`; }).join("")}</div>`).join("")}
  </section>
  <section class="stampbook"><header class="row"><h2>Rally cards</h2><span class="spacer"></span><span class="pill pink">${allStars()}/${RALLY_GAMES.length * LEVELS_N * 3} ★</span></header>
    <p class="muted" style="font-size:.85rem">One card per game. Clear a level to stamp it: bronze ★, silver ★★, gold ★★★.</p>
    ${RALLY_GAMES.map(rg => { const tot = lvTotal(rg.id); return `<div class="stamppage-h">${IMGW(rg.icon, 26)}<h3>${rg.name}</h3><span class="spacer"></span>${tot >= LEVELS_N * 3 ? `<span class="kanseal" title="All gold">金</span>` : lvCleared(rg.id) >= LEVELS_N ? `<span class="kanseal" title="Card complete">完</span>` : `<small>${tot}/${LEVELS_N * 3} ★</small>`}</div>
    <div class="rallyrow">${Array.from({ length: LEVELS_N }, (_, i) => { const n = i + 1, s = lvStars(rg.id, n); return s ? `<button class="stampslot" data-rally="${rg.id}" aria-label="Level ${n}, ${s} stars">${rallyStampHTML(rg.id, n, s, 58)}</button>` : `<button class="stampslot" data-rally="${rg.id}" aria-label="Level ${n}"><div class="empty small">${n}</div></button>`; }).join("")}</div>`; }).join("")}
  </section>
  <section class="stampbook"><header class="row"><h2>Stamp book</h2><span class="spacer"></span><span class="pill pink">${found.length}/${UNIQUE_WORDS.length} stamps</span></header>
    <p class="muted" style="font-size:.85rem">Like the 駅スタンプ (eki sutanpu, station stamps) at Japanese train stations: every new kanji you discover gets stamped here.</p>
    ${STAMP_PAGES.map(pg => { const ws = UNIQUE_WORDS.filter(w => pg.themes.includes(w.t)); const got = ws.filter(w => wordState(w)?.found).length; return `<div class="stamppage-h"><span class="glyph">${pg.jp}</span><h3>${pg.name}</h3><span class="spacer"></span>${got === ws.length ? `<span class="kanseal" title="Page complete">完</span>` : `<small>${got}/${ws.length}</small>`}</div>
    <div class="stampgrid">${ws.map(w => { const f = wordState(w)?.found; return f ? `<button class="stampslot" data-word="${w.id}" aria-label="${esc(w.en)}">${stampHTML(w, 84)}<small>${esc(w.en)}</small></button>` : `<div class="stampslot"><div class="empty">?</div><small>${"●".repeat([...w.r].length)}</small></div>`; }).join("")}</div>`; }).join("")}
  </section>
  <section class="card stack"><h2>Kana chart</h2><div class="chart">${ROWS.flatMap(r => { const cells = r.kana.map(([k, ro]) => { const st = kanaStage(k); return `<div class="${st < 0 ? "none" : "s" + (st + 1)}"><div class="glyph">${k}</div><span class="ro">${ro}</span></div>`; }); while (cells.length < 5) cells.push(`<div class="none" aria-hidden="true"></div>`); return cells; }).join("")}</div>
    <p class="muted" style="font-size:.78rem">Pale = sprout, green = bud, pink outline = bloom.</p></section>
  <section class="card stack"><h2>Your buds</h2><div class="budrow">${BUDS.map(b => { const s = bud(b.id); return `<div class="budcard">${IMG(b.sprites[Math.min(2, Math.floor((s.lvl - 1) / 3))])}<div style="font-weight:800">${b.name} <span class="glyph" style="font-size:.85rem">${b.jp}</span></div><div class="ro">Lv ${s.lvl} · loves ${b.likes}</div></div>`; }).join("")}</div></section>
  <section class="card stack"><h2>Settings</h2>
    <label class="lab" for="nm">Your name</label><input id="nm" type="text" value="${esc(S.name)}" placeholder="e.g. Ken">
    <div class="stack" style="gap:6px"><span class="lab">Your role</span><div class="seg" role="group"><button data-role="kana" aria-pressed="${S.role === "kana"}">かな Kana speller</button><button data-role="kanji" aria-pressed="${S.role === "kanji"}">漢字 Kanji reader</button></div>
    <p class="muted" style="font-size:.8rem">Kana spellers see kana and romaji. Kanji readers get bare kanji on plates and puzzles, WaniKani style.</p></div>
    <div class="row"><span class="lab">Romaji helper</span><span class="spacer"></span><div class="seg"><button data-ro="1" aria-pressed="${S.romaji}">On</button><button data-ro="0" aria-pressed="${!S.romaji}">Off</button></div></div>
    <div class="row"><span class="lab">Sound effects</span><span class="spacer"></span><div class="seg"><button data-snd="1" aria-pressed="${S.sound}">On</button><button data-snd="0" aria-pressed="${!S.sound}">Off</button></div></div>
    <div class="row"><button class="btn ghost small" id="knowall">I already know hiragana: plant everything</button></div>
    <div class="row"><button class="btn ghost small" id="reset">Start a new garden</button><span id="resetconfirm"></span></div>
    <p class="muted" style="font-size:.75rem">Progress is saved in this browser on this device. Fluent Emoji art by Microsoft (MIT).</p>
  </section>`;
  $$("[data-rally]").forEach(b => b.onclick = () => openLevels(b.dataset.rally));
  $$("[data-trophy]").forEach(b => b.onclick = () => { const t = TROPHIES.find(x => x.id === b.dataset.trophy); const got = S.trophies && S.trophies[t.id]; toast(got ? `${t.name}: ${t.desc} (won ${got})` : `Locked: ${t.desc}`); });
  $("#nm").onchange = e => { S.name = e.target.value.trim().slice(0, 20); save(); render(); };
  $$("[data-role]").forEach(b => b.onclick = () => { S.role = b.dataset.role; save(); render(); });
  $$("[data-ro]").forEach(b => b.onclick = () => { S.romaji = b.dataset.ro === "1"; save(); render(); });
  $$("[data-snd]").forEach(b => b.onclick = () => { S.sound = b.dataset.snd === "1"; save(); render(); });
  $$("[data-word]").forEach(b => b.onclick = () => { const w = WORDS[+b.dataset.word]; openPlay(w.k, st => { st.innerHTML = `<div class="stampbook" style="display:flex;justify-content:center;padding:24px">${stampHTML(w, 180, "thunk")}</div><div class="card">${wordReveal(w, `<span class="pill">${wordState(w).pts} drops · stamped ${wordState(w).stamped || ""}</span>`)}</div>`; say(w.r); }); });
  $("#knowall").onclick = () => { ALL_KANA.forEach(x => { if (!S.kana[x.k]) S.kana[x.k] = { pts: 3, last: now() }; else S.kana[x.k].pts = Math.max(3, S.kana[x.k].pts); }); EXTRAS.forEach(x => { S.kana[x.k] = S.kana[x.k] || { pts: 7, last: now() }; }); save(); toast("Every bed is planted and budding!"); render(); };
  $("#reset").onclick = () => { $("#resetconfirm").innerHTML = `<button class="btn small" style="background:var(--bad);box-shadow:none" id="reset2">Yes, erase my garden</button>`; $("#reset2").onclick = () => { S = DEFAULT(); save(); TAB = "garden"; render(); toast("A fresh garden!"); }; };
}
