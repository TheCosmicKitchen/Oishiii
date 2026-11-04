// ===== Grammar road: the old Tōkaidō on foot, one post town per stop (JLPT N5 grammar) =====
// Cards explain each point; drills follow the JLPT's grammar questions (choose the grammar form) and reading; every
// sentence is a native Tatoeba sentence from tools/grammar_build.py. Kanji the player hasn't stamped show in kana.
const G_STOPS = GRAMMAR.stops, G_PTS = GRAMMAR.points;
const G_SENT = Object.fromEntries(GRAMMAR.sents.map(s => [s.id, s]));
const GS = () => S.gram || (S.gram = { stops: {}, pts: {}, read: {} });
const gStars = i => (GS().stops[G_STOPS[i].id] || {}).stars || 0;
const gOpen = i => i === 0 || gStars(i - 1) > 0;
const gCleared = () => G_STOPS.filter((_, i) => gStars(i)).length;
const gPointsDone = () => G_STOPS.reduce((a, s, i) => a + (gStars(i) ? s.points.length : 0), 0);
const gPointsAll = () => G_STOPS.reduce((a, s) => a + s.points.length, 0);
const gReadDone = () => G_STOPS.filter(s => GS().read[s.id]).length;
const gNext = () => { const i = G_STOPS.findIndex((_, j) => !gStars(j)); return i < 0 ? G_STOPS.length - 1 : i; };
const gPlace = st => canRead(st.place) ? esc(st.place) : `<span class="latin">${esc(st.ro)}</span>`;
// {漢字|かな} in card text: the kanji once stamped, else the kana
const furiText = s => esc(s).replace(/\{([^|}]+)\|([^}]+)\}/g, (m, k, r) => canRead(k) ? `<b class="kj">${k}</b>` : `<span class="kn">${r}</span>`);
const sentRo = s => romajiSentence(s.w.filter(c => c.k !== "x").flatMap(c => c.k === "p" ? [c.t] : c.r.split(/(?=です$|でした$)/))); // ねこです → neko desu

// ---- a sentence you can tap: each word shows its reading and meaning; the line below shows the English
function sentHTML(s, { en = true, blank = -1, blankText = "（　）" } = {}) {
  const words = s.w.map((c, i) => i === blank ? `<span class="gblank">${blankText}</span>` : c.k === "x" ? `<span class="gx">${esc(c.t)}</span>` : `<button class="gw ${c.k}" data-w="${i}">${mixedHTML(c.t, c.g)}</button>`).join("");
  return `<div class="gsent" data-sid="${s.id}"><p class="gja glyph">${words}</p>${showRo() && blank < 0 ? `<p class="gro">${esc(sentRo(s))}</p>` : ""}
    ${en ? `<button class="gen" data-en>Tap for English</button>` : ""}<div class="gtip" hidden></div></div>`;
}
function bindSents(root) {
  $$(".gsent", root).forEach(el => {
    const s = G_SENT[el.dataset.sid]; const tip = $(".gtip", el);
    $$("[data-w]", el).forEach(b => b.onclick = () => {
      const c = s.w[+b.dataset.w]; $$(".gw.on", el).forEach(x => x.classList.remove("on")); b.classList.add("on");
      const base = c.b && canRead(c.b) ? ` <span class="muted">· from ${esc(c.b)}</span>` : "";
      tip.hidden = false; tip.innerHTML = `<b class="glyph">${esc(c.r)}</b> <span class="ro">${esc(c.k === "p" ? sentRo({ w: [c] }) : romaji(c.r))}</span>${base}<div>${esc(c.m || (c.k === "p" ? "particle" : ""))}</div>`;
      say(c.r);
    });
    const e = $("[data-en]", el); if (e) e.onclick = () => { e.textContent = s.en; e.classList.add("shown"); };
  });
}

// ---- grammar cards
function gCardHTML(pid) {
  const p = G_PTS[pid]; const ex = (GRAMMAR.ex[pid] || []).slice(0, 3).map(id => G_SENT[id]).filter(Boolean);
  return `<div class="card gcard"><span class="eyebrow">JLPT N5 grammar</span><h2 class="gpat glyph">${furiText(p.pattern)}</h2><p class="gmean">${esc(p.en)}</p>
    <div class="grecipe"><span class="eyebrow">How to make it</span><p class="glyph">${furiText(p.make)}</p></div>
    ${p.notes.map(n => `<p class="gnote">${furiText(n)}</p>`).join("")}
    ${ex.length ? `<div class="gex"><span class="eyebrow">In real Japanese</span><span class="help">Native sentences. Tap a word for its reading and meaning.</span>${ex.map(s => sentHTML(s)).join("")}</div>` : ""}</div>`;
}

// ---- questions in the JLPT's grammar styles
const G_PART = { wa_desu: ["は"], no_pos: ["の"], wo_obj: ["を"], ni_dest: ["に", "へ"], mo_also: ["も"], de_place: ["で"], to_with: ["と"], aru_iru: ["が"], ni_exist: ["に"], ga_suki: ["が"],
  hoshii: ["が"], ga_subj: ["が"], ni_time: ["に"] };
const G_FORM = { masu: "ます", masen: "ません", mashita: "ました", masendeshita: "ませんでした", mashou: "ましょう", masenka: "ません" };
const FORM_SET = ["ませんでした", "ましょう", "ません", "ました", "ます"]; // longest first, for matching endings
const FORM_EN = { ます: "polite (do, will do)", ません: "polite negative (don't)", ました: "polite past (did)", ませんでした: "polite past negative (didn't)", ましょう: "let's", て: "て-form",
  ない: "plain negative (don't)", た: "plain past (did)", たい: "want to", ている: "is doing (ている)" };
// verb-form drills: which form each point asks for, and which other forms make the wrong answers
const CONJ = { masu: "ます", masen: "ません", mashita: "ました", masendeshita: "ませんでした", mashou: "ましょう", plain_nai: "ない", plain_ta: "た", tai: "たい", te_iru: "ている" };
const POLITE_F = ["ます", "ません", "ました", "ませんでした", "ましょう"], PLAIN_F = ["ない", "た", "たい", "ている"];
const exOf = pid => (GRAMMAR.ex[pid] || []).map(id => G_SENT[id]).filter(Boolean);
function qParticle(pid, rng) {
  const p = G_PTS[pid], parts = G_PART[pid]; if (!p.wrong || !parts) return null;
  const s = rng.pick(exOf(pid).filter(s => s.w.some(c => c.k === "p" && parts.includes(c.t)))); if (!s) return null;
  const at = s.w.findIndex(c => c.k === "p" && parts.includes(c.t)); const ans = s.w[at].t;
  return { pid, kind: "Choose the right particle", s, blank: at, ans, ok: [ans, ...(p.also || [])], opts: rng.shuffle([ans, ...p.wrong.filter(x => x !== ans && !(p.also || []).includes(x))]) };
}
function qForm(pid, rng) {
  const want = G_FORM[pid]; if (!want) return null;
  const cands = exOf(pid).map(s => ({ s, at: s.w.findIndex(c => c.k === "w" && FORM_SET.find(f => c.t.endsWith(f)) === want) })).filter(x => x.at >= 0);
  const pick = rng.pick(cands); if (!pick) return null;
  const c = pick.s.w[pick.at], stem = c.t.slice(0, -want.length);
  const opts = rng.shuffle([want, ...rng.shuffle(["ます", "ません", "ました", "ませんでした", "ましょう"].filter(f => f !== want)).slice(0, 3)]);
  return { pid, kind: "Choose the right form", s: pick.s, blank: pick.at, blankText: `${mixedHTML(stem, c.g.filter(g => g[1] < stem.length))}（　）`, ans: want, ok: [want], opts, en: true };
}
function qMeaning(pid, rng, pool) {
  const s = rng.pick(exOf(pid)); if (!s) return null;
  const others = rng.shuffle(pool.filter(x => x.en !== s.en)).slice(0, 2).map(x => x.en);
  if (others.length < 2) return null;
  return { pid, kind: "What does it mean?", s, ans: s.en, ok: [s.en], opts: rng.shuffle([s.en, ...others]), plain: true };
}
function wrongTe(v) {
  const stem = v.f["ます"][0].slice(0, -2), d = v.v, out = new Set([stem + "て", d.slice(0, -1) + "て", d.slice(0, -1) + "って", d.slice(0, -1) + "いて", d.slice(0, -1) + "んで"]);
  out.delete(v.f["て"][0]); return [...out].filter(x => x !== d);
}
function qConj(pid, rng) {
  const te = ["te_kudasai", "te_mo_ii", "te_wa_ikenai", "tekara"].includes(pid); const form = te ? "て" : CONJ[pid]; if (!form) return null;
  const v = rng.pick(GRAMMAR.verbs.filter(x => x.f[form])); if (!v) return null; const show = x => canRead(v.v) ? x[0] : x[1];
  const others = (POLITE_F.includes(form) ? POLITE_F : PLAIN_F).filter(f => f !== form && v.f[f]).map(f => show(v.f[f]));
  if (!POLITE_F.includes(form)) others.push(canRead(v.v) ? v.v : v.r); // the dictionary form is a wrong answer too
  const wrong = te ? rng.shuffle(wrongTe(v)).slice(0, 3) : rng.shuffle(others).slice(0, 3);
  if (wrong.length < 2) return null;
  const ans = show(v.f[form]);
  const opts = [...new Set([ans, ...wrong.map(w => te && !canRead(v.v) ? toReading(v, w) : w)])];
  return opts.length >= 3 ? { pid, kind: te ? "Make the て-form" : "Make the form", verb: v, form, ans, ok: [ans], opts: rng.shuffle(opts) } : null;
}
// wrong て-forms are built on the written verb; show them in kana when the verb's kanji aren't stamped
function toReading(v, w) { const k = v.v.replace(/[^一-鿿々]/g, ""); const kr = v.g.map(g => g[2]).join(""); return k && w.startsWith(k) ? kr + w.slice(k.length) : w; }

function gQuestions(pids, n, rng, weights = {}) {
  const pool = pids.flatMap(exOf), qs = [], makers = [qParticle, qForm, qConj, qMeaning];
  const order = []; for (let k = 0; k < n * 3; k++) order.push(pids[k % pids.length]);
  const weighted = rng.shuffle(order).sort((a, b) => (weights[b] || 0) - (weights[a] || 0));
  for (const pid of weighted) {
    if (qs.length >= n) break;
    for (const mk of rng.shuffle(makers)) { const q = mk(pid, rng, pool); if (q && !qs.some(x => x.s && q.s && x.s.id === q.s.id && x.kind === q.kind)) { qs.push(q); break; } }
  }
  return qs;
}
function gQuestionHTML(q) {
  const head = `<span class="eyebrow">${esc(q.kind)}</span>`;
  if (q.verb) {
    const v = q.verb, word = canRead(v.v) ? esc(v.v) : esc(v.r);
    return `${head}<div class="gverb"><div class="glyph big">${word}</div><div><b>${esc(v.m)}</b></div><div class="pill pink">${esc(FORM_EN[q.form] || q.form)}</div></div>`;
  }
  return `${head}${sentHTML(q.s, { en: false, blank: q.plain ? -1 : q.blank, blankText: q.blankText || "（　）" })}${q.en ? `<p class="gctx">“${esc(q.s.en)}”</p>` : ""}`;
}
function runGDrill(st, hud, qs, onFinish) {
  const queue = [...qs]; let i = 0, mistakes = 0, total = qs.length; const missed = new Set();
  const draw = () => {
    const q = queue[i]; if (!q) return onFinish({ mistakes, missed: [...missed] });
    hud.innerHTML = `<span class="pill">${Math.min(i + 1, queue.length)}/${queue.length}</span>`;
    st.innerHTML = `<div class="card stack gq">${gQuestionHTML(q)}<div class="gopts ${q.plain ? "wide" : ""}">${q.opts.map((o, k) => `<button class="gopt ${q.plain ? "" : "glyph"}" data-o="${k}">${esc(o)}</button>`).join("")}</div><div id="gfb"></div></div>`;
    bindSents(st);
    $$("[data-o]", st).forEach(b => b.onclick = () => {
      const pick = q.opts[+b.dataset.o], right = q.ok.includes(pick); const rec = (GS().pts[q.pid] = GS().pts[q.pid] || { ok: 0, miss: 0 });
      $$("[data-o]", st).forEach(x => { x.disabled = true; if (q.ok.includes(q.opts[+x.dataset.o])) x.classList.add("right"); });
      if (right) { SFX.good(); rec.ok++; } else { SFX.bad(); b.classList.add("wrong"); mistakes++; rec.miss++; missed.add(q.pid); if (!q.requeued) queue.push({ ...q, requeued: true, opts: RND.shuffle(q.opts) }); }
      const full = q.s ? `<div class="gfull">${sentHTML(q.s, { en: false })}<p class="gctx">“${esc(q.s.en)}”</p></div>` : "";
      $("#gfb", st).innerHTML = `<div class="gfeed ${right ? "ok" : "no"}"><b>${right ? "おいしい！ Right." : `Not quite: it's ${esc(q.ans)}`}</b>${full}<button class="btn" id="gnext">Next →</button></div>`;
      bindSents($("#gfb", st)); save();
      $("#gnext", st).onclick = () => { i++; draw(); };
    });
  };
  draw();
}

// ---------- GRAMMAR TAB ----------
function viewGrammar(v) {
  const nx = gNext();
  v.innerHTML = `
  ${pageHead("lantern", "Grammar", "ぶんぽう", "Walk the old Tōkaidō road from Edo, one post town at a time. Each stop teaches JLPT N5 grammar with real sentences by native speakers.")}
  <section class="card stack">
    <div class="row"><span class="eyebrow">JLPT N5 grammar · ${GRAMMAR.chapters.length} chapters</span><span class="spacer"></span><span class="pill pink">${gPointsDone()}/${gPointsAll()} points</span></div>
    <div class="bar"><i style="width:${gPointsDone() / gPointsAll() * 100}%"></i></div>
    <div class="row"><button class="btn pink" id="gcont">${IMG("sparkles")}${gStars(nx) ? "Revisit" : gCleared() ? "Continue" : "Start"} at ${gPlace(G_STOPS[nx])}</button>
      <button class="btn ghost" id="grev" ${gCleared() ? "" : "disabled"}>${IMG("droplet")}Grammar review</button></div>
  </section>
  <section class="road">${G_STOPS.map((st, i) => { const open = gOpen(i), stars = gStars(i), ch = GRAMMAR.chapters.find(c => c.n === st.ch);
    const head = (!i || G_STOPS[i - 1].ch !== st.ch) && ch ? `<div class="rchap"><span class="eyebrow">Chapter ${ch.n}</span><b>${esc(ch.name)}</b><small class="muted">${esc(ch.note)}</small></div>` : "";
    return `${head}<button class="rstop ${stars ? "cleared" : open ? "open" : "locked"} ${i === nx ? "next" : ""}" ${open ? `data-gs="${i}"` : "disabled"}>
      <span class="rnum">${i === 0 ? "起" : i}</span>
      <span class="rbody"><b>${open ? gPlace(st) : `<span class="latin">${esc(st.ro)}</span>`}</b>${open && canRead(st.place) ? ` <small class="ro">${esc(st.ro)}</small>` : ""}
        <span class="rpts glyph">${st.points.map(p => `<span>${furiText(G_PTS[p].pattern)}</span>`).join("")}</span></span>
      <span class="rside">${open ? starRow(stars, 13) : IMGW("lock", 22)}${GS().read[st.id] ? `<small class="pill">read</small>` : ""}</span></button>`; }).join("")}
    <div class="rend">${IMGW("mountain", 36)}<p class="muted">The road goes on to Kyoto: more N5 grammar is on the way.</p></div>
  </section>`;
  $("#gcont", v).onclick = () => openGStop(nx);
  $("#grev", v).onclick = startGReview;
  $$("[data-gs]", v).forEach(b => b.onclick = () => openGStop(+b.dataset.gs));
}

function openGStop(i) {
  const st = G_STOPS[i];
  openPlay(st.ro, (stage) => {
    stage.innerHTML = `<section class="card stack ghero"><div class="row">${IMGW("lantern", 46)}<div style="flex:1;min-width:0"><span class="eyebrow">Post town ${i || "· start"}</span><h2>${gPlace(st)}</h2><p class="muted" style="font-size:.85rem">${esc(st.note)}</p></div>${starRow(gStars(i), 14)}</div>
      <div class="gsteps"><button class="gstep" id="gs1">${IMGW("book", 30)}<b>1 · Learn</b><small>${st.points.length} grammar cards</small></button>
        <button class="gstep" id="gs2">${IMGW("pencil", 30)}<b>2 · Drill</b><small>JLPT-style questions</small></button>
        <button class="gstep" id="gs3">${IMGW("paper", 30)}<b>3 · Read</b><small>${(GRAMMAR.read[i] || []).length} native sentences</small></button></div></section>
      ${st.points.map(gCardHTML).join("")}`;
    bindSents(stage);
    $("#gs1", stage).onclick = () => stage.querySelector(".gcard").scrollIntoView({ behavior: "smooth", block: "start" });
    $("#gs2", stage).onclick = () => startGClear(i);
    $("#gs3", stage).onclick = () => openGRead(i);
  });
}

function startGClear(i) {
  const st = G_STOPS[i], rng = RND; const qs = gQuestions(st.points, Math.max(8, st.points.length * 3), rng);
  openPlay(`${st.ro} · drill`, (stage, hud) => runGDrill(stage, hud, qs, ({ mistakes }) => {
    const stars = mistakes <= 1 ? 3 : mistakes <= 3 ? 2 : 1; const rec = GS().stops[st.id] = GS().stops[st.id] || {}; const first = !rec.stars;
    rec.stars = Math.max(rec.stars || 0, stars); rec.date = rec.date || todayKey(); save();
    stage.innerHTML = `<div class="card result pop">${IMGW(stars === 3 ? "party" : "sparkles", 80)}<h2>${first ? `On to the next town!` : "Drill done"}</h2><div class="score">${starRow(stars, 26)}</div>
      <p>${mistakes ? `${mistakes} slip${mistakes > 1 ? "s" : ""}; each came back once.` : "No slips at all."}${first ? ` +${G_SEEDS} seeds for your garden.` : ""}</p>
      <div class="row" style="justify-content:center"><button class="btn ghost" id="gagain">Drill again</button><button class="btn pink" id="gread">${IMG("paper")}Reading practice</button><button class="btn" id="gdone">Back</button></div></div>`;
    if (stars === 3) confetti(); SFX.win(); setTimeout(() => holdCelebrations(false), 400);
    $("#gagain", stage).onclick = () => startGClear(i); $("#gread", stage).onclick = () => openGRead(i); $("#gdone", stage).onclick = () => closePlay();
  }), { onBack: () => openGStop(i) });
}

function openGRead(i) {
  const st = G_STOPS[i], ids = GRAMMAR.read[i] || []; const ss = ids.map(id => G_SENT[id]).filter(Boolean);
  openPlay(`${st.ro} · reading`, (stage) => {
    stage.innerHTML = `<section class="card stack"><span class="eyebrow">Reading practice</span><p class="muted" style="font-size:.85rem">Real sentences by native speakers, using only grammar you've met so far. Read each one, tap any word for its reading and meaning, then check the English.</p></section>
      <section class="card stack greadlist">${ss.map(s => sentHTML(s)).join("")}</section>
      <section class="card stack"><h3>Check yourself</h3><p class="muted" style="font-size:.85rem">Three quick questions, like the reading part of the JLPT.</p><button class="btn pink" id="gcheck">${IMG("check")}Check my reading</button></section>`;
    bindSents(stage);
    $("#gcheck", stage).onclick = () => {
      const qs = RND.shuffle(ss).slice(0, 3).map(s => ({ pid: s.p[0], kind: "What does it mean?", s, ans: s.en, ok: [s.en], plain: true, opts: RND.shuffle([s.en, ...RND.shuffle(ss.filter(x => x.en !== s.en)).slice(0, 2).map(x => x.en)]) }));
      openPlay(`${st.ro} · check`, (st2, hud) => runGDrill(st2, hud, qs, ({ mistakes }) => {
        const first = !GS().read[st.id]; GS().read[st.id] = todayKey(); save();
        st2.innerHTML = `<div class="card result pop">${IMGW("book", 80)}<h2>Reading done</h2><p>${3 - Math.min(3, mistakes)} of 3 on the first try.${first ? ` +${G_READ_SEEDS} seed for your garden.` : ""}</p><div class="row" style="justify-content:center"><button class="btn" id="rdone">Back</button></div></div>`;
        SFX.win(); setTimeout(() => holdCelebrations(false), 400); $("#rdone", st2).onclick = () => closePlay();
      }), { onBack: () => openGRead(i) });
    };
  }, { onBack: () => openGStop(i) });
}

function startGReview() {
  const pids = G_STOPS.filter((_, i) => gStars(i)).flatMap(s => s.points); if (!pids.length) return;
  const w = Object.fromEntries(pids.map(p => { const r = GS().pts[p] || {}; return [p, (r.miss || 0) - (r.ok || 0) / 3]; }));
  const qs = gQuestions(pids, 10, RND, w);
  openPlay("Grammar review", (stage, hud) => runGDrill(stage, hud, qs, ({ mistakes }) => {
    stage.innerHTML = `<div class="card result pop">${IMGW("droplet", 80)}<h2>Review done</h2><p>${qs.length - Math.min(qs.length, mistakes)} of ${qs.length} right first time. The ones you missed will come up more often.</p><div class="row" style="justify-content:center"><button class="btn ghost" id="ragain">Another round</button><button class="btn" id="rdone">Back</button></div></div>`;
    SFX.win(); setTimeout(() => holdCelebrations(false), 400); $("#ragain", stage).onclick = startGReview; $("#rdone", stage).onclick = () => closePlay();
  }));
}

const G_SEEDS = 3, G_READ_SEEDS = 1; // garden seeds for each cleared post town and each reading set
TROPHIES.push(
  { id: "gr_first", group: "Grammar", name: "Off We Go", icon: "lantern", desc: "Clear Nihonbashi, the start of the Tōkaidō.", test: () => gStars(0) > 0 },
  { id: "gr_hakone", group: "Grammar", name: "Through the Checkpoint", icon: "mountain", desc: "Clear Hakone.", test: () => gStars(G_STOPS.length - 1) > 0 },
  { id: "gr_reader", group: "Grammar", name: "Bookworm", icon: "books", desc: "Finish the reading at every post town.", test: () => gReadDone() >= G_STOPS.length },
  { id: "gr_gold", group: "Grammar", name: "Golden Road", icon: "crown", gold: true, desc: "★★★ at every post town.", test: () => G_STOPS.every((_, i) => gStars(i) === 3) },
);
