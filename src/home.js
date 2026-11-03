// ===== Today: what to do next, both reviews, and how close you are to the JLPT N5 =====
// Exam facts are from jlpt.jp (test sections and pass marks for N5).
function pageHead(icon, title, jp, sub) {
  return `<header class="phead">${IMGW(icon, 52)}<div class="stack" style="gap:2px;flex:1;min-width:0"><h1>${esc(title)} <small class="glyph">${esc(jp)}</small></h1>${sub ? `<p>${esc(sub)}</p>` : ""}</div></header>`;
}
const levelKanji = n => KJ.filter(w => w.n === n);
function readyRow(icon, label, have, total, note) {
  const pct = total ? Math.round(have / total * 100) : 0;
  return `<div class="ready"><div class="row" style="gap:8px;flex-wrap:nowrap">${IMGW(icon, 26)}<b style="flex:1">${label}</b><span class="ready-n">${have}<small>/${total}</small></span></div>
    <div class="bar"><i style="width:${pct}%"></i></div>${note ? `<small class="muted">${note}</small>` : ""}</div>`;
}
function viewHome(v) {
  const nx = nextSub(), gi = gNext(), greet = S.name ? `Hi, ${S.name}!` : "Welcome!";
  const n5 = levelKanji(5), n4 = levelKanji(4); const n5have = n5.filter(isStamped).length, n4have = n4.filter(isStamped).length;
  const kanaDone = plantedKana().length;
  const today = S.daily[todayKey()] || {}; const pzDone = PUZZLES.filter(p => today[p.id]).length;
  const pend = seedsPending();
  v.innerHTML = `
  <section class="hero">
    <div class="hero-art">${IMGW("blossom", 64)}</div>
    <div class="stack" style="gap:4px;flex:1;min-width:0"><span class="eyebrow">${DAYNAME[new Date().getDay()]}</span><h1>${esc(greet)}</h1>
      <p>Your goal: the <b>JLPT N5</b>. Here's what's next.</p></div>
  </section>
  <section class="next2">
    <button class="nextcard kanji" id="hk"><span class="eyebrow">Kanji · the line</span>${IMGW("train", 40)}<b>${nx ? (subStars(nx) ? "Revisit " : "") + esc(nx.title) : "All clear"}</b><small>${nx ? `${esc(nx.stop.ro)} · ${nx.items.length} ${isKanaSub(nx) ? "kana" : "kanji"}` : ""}</small><span class="go">${subStars(nx) ? "Revisit" : "Continue"} →</span></button>
    <button class="nextcard grammar" id="hg"><span class="eyebrow">Grammar · the road</span>${IMGW("lantern", 40)}<b>${gPlace(G_STOPS[gi])}</b><small>${G_STOPS[gi].points.length} N5 points</small><span class="go">${gStars(gi) ? "Revisit" : gCleared() ? "Continue" : "Start"} →</span></button>
  </section>
  <section class="card stack">
    <div class="row">${IMGW("droplet", 32)}<h3 style="flex:1">Review</h3><span class="help" style="margin:0">Mixed questions, weighted to what you miss</span></div>
    <div class="row"><button class="btn ghost" id="hrk" ${foundCount() || kanaDone ? "" : "disabled"}>${IMG("pencil")}Kanji & kana</button><button class="btn ghost" id="hrg" ${gCleared() ? "" : "disabled"}>${IMG("lantern")}Grammar</button></div>
  </section>
  <section class="card stack jlpt">
    <header class="row">${IMGW("target", 40)}<div style="flex:1;min-width:0"><h2>JLPT N5 readiness</h2><p class="muted" style="font-size:.82rem">What you've learned in Oishii, against the N5.</p></div></header>
    ${readyRow("seedling", "Hiragana", kanaDone, 46, "")}
    ${readyRow("sakura", "N5 kanji stamped", n5have, n5.length, "From Jonathan Waller's N5 list, the usual community guide: there's no official one.")}
    ${readyRow("lantern", "N5 grammar points cleared", gPointsDone(), gPointsAll(), `Chapter 1 of the grammar road. More N5 points are on the way.`)}
    ${readyRow("paper", "Reading sets done", gReadDone(), G_STOPS.length, "")}
    ${n5have >= n5.length ? readyRow("tulip", "N4 kanji stamped", n4have, n4.length, "") : ""}
    <details class="examfacts"><summary>${IMG("question")}About the N5 exam</summary>
      <ul><li><b>Vocabulary</b>: 20 minutes. Kanji readings, spellings, words in context.</li>
      <li><b>Grammar and reading</b>: 40 minutes. Choosing the right grammar form, putting a sentence in order, grammar in a passage, and short readings.</li>
      <li><b>Listening</b>: 30 minutes.</li>
      <li>To pass: 80 of 180 points overall, with at least 38 of 120 in vocabulary, grammar and reading, and 19 of 60 in listening.</li></ul>
      <p class="muted" style="font-size:.75rem">From the official JLPT site, jlpt.jp.</p></details>
  </section>
  <section class="mini2">
    <button class="minicard" id="hgd">${IMGW("watering", 36)}<b>Garden</b><small>${pend ? `+${pend} seeds to trade in` : `${seeds()} seeds to spend`}</small></button>
    <button class="minicard" id="hpz">${IMGW("puzzle", 36)}<b>Today's puzzles</b><small>${pzDone}/${PUZZLES.length} done</small></button>
  </section>`;
  const go = tab => { TAB = tab; try { sessionStorage.setItem("kg.tab", TAB); } catch (e) { } render(); window.scrollTo(0, 0); };
  $("#hk", v).onclick = () => nx && openSub(nx);
  $("#hg", v).onclick = () => openGStop(gi);
  $("#hrk", v).onclick = startReview;
  $("#hrg", v).onclick = startGReview;
  $("#hgd", v).onclick = () => go("garden");
  $("#hpz", v).onclick = () => go("play");
}
function viewPlay(v) {
  v.innerHTML = `${pageHead("sushi", "Play", "あそぶ", "Games that use only the kana and kanji you've learned. Daily puzzles are the same for both of you.")}<div id="playSushi" class="stack"></div><div id="playPz" class="stack"></div>`;
  viewSushi($("#playSushi", v)); viewPuzzles($("#playPz", v));
}
