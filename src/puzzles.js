// ===== Daily puzzles =====
const ENDLESS_D = {};
function pzSetup(id, mode) {
  const date = mode === "daily" ? todayKey() : /^D\d{4}-/.test(mode || "") ? mode.slice(1) : null; const daily = !!date;
  const level = /^L\d+$/.test(mode || "") ? +mode.slice(1) : null; PLAY_DATE = date;
  const rng = daily ? makeRng(date + ":" + id) : level ? makeRng("level:" + id + ":" + level) : RND;
  const d = daily ? dayDifficulty(dateFromKey(date)) : level ? (level - 1) / (LEVELS_N - 1) : (ENDLESS_D[id] ?? (ENDLESS_D[id] = .3));
  return { daily, level, rng, d, bump: () => { if (!daily && !level) ENDLESS_D[id] = Math.min(1, (ENDLESS_D[id] || .3) + .1); } };
}
function startTimer(hud, extra = () => "") { const t0 = now(); const draw = () => { hud.innerHTML = `${extra()}<span class="chip">${IMG("hourglass")}${fmtTime(now() - t0)}</span>`; }; draw(); const iv = setInterval(draw, 1000); return { stop: () => clearInterval(iv), ms: () => now() - t0, redraw: draw }; }

const PUZZLES = [
  { id: "chain", name: "Transfer Chain", jp: "のりかえ", icon: "tracks", desc: "Ride from one kanji to another by linking real two-kanji words. Fewest rides wins.", play: m => transferChain(m) },
  { id: "radical", name: "Radical Builder", jp: "ぶしゅ", icon: "bricks", desc: "Pick the radicals that build each kanji, then spot kanji from their parts.", play: m => radicalBuilder(m) },
  { id: "match", name: "Meaning Match", jp: "いみ", icon: "heartribbon", desc: "Pair every kanji with its meaning as fast as you can.", play: m => meaningMatch(m) },
  { id: "petal", name: "Petal Guess", jp: "はなびら", icon: "tulip", desc: "Guess the hidden word in 6 tries. Blue petals mean same kana row or vowel.", play: m => petalGuess(m) },
  { id: "plot", name: "Garden Plot", jp: "はたけ", icon: "carrot", desc: "Kana sudoku: every row, column and bed gets each kana once.", play: m => gardenPlot(m) },
  { id: "logic", name: "Garden Logic", jp: "にわ", icon: "rabbit", desc: "Read the kanji clues and place everyone in the garden.", play: m => gardenLogic(m) },
  { id: "half", name: "Missing Half", jp: "はんぶん", icon: "puzzle", desc: "Drag in the missing piece to build the kanji. Trust your gut!", play: m => missingHalf(m) },
  { id: "line", name: "Number Line", jp: "かず", icon: "abacus", desc: "Line up kanji numbers and konbini prices, smallest to biggest.", play: m => numberLine(m) },
  { id: "sushi", name: "Chef's Special", jp: "すし", icon: "sushi", desc: "Today's 90-second sushi rush. Compare yen with your partner.", play: m => startSushi(m === "daily" || /^[LD]\d/.test(m) ? m : "practice") },
];

function playPz(id, mode) { if (!gateOpen(id)) { toast(GATES[id].need + " to unlock " + GATES[id].name); return; } if (id === "sushi") return startSushi(mode === "daily" || /^[LD]\d/.test(mode) ? mode : "practice"); PUZZLES.find(p => p.id === id).play(mode); }
function viewPuzzles(v) {
  const today = S.daily[todayKey()] || {}; const doneN = PUZZLES.filter(p => today[p.id]).length;
  const d = dayDifficulty(); const diffName = d < .35 ? "gentle" : d < .7 ? "medium" : d < .95 ? "tricky" : "brutal";
  v.innerHTML = `
  <section class="card bouquet-card">${IMG("basket")}<div style="flex:1;min-width:0"><h2>Today's bouquet</h2><p class="muted" style="font-size:.85rem">${DAYNAME[new Date().getDay()]} puzzles are <b>${diffName}</b>. Collect a flower for each one.</p>
    <div class="flowers" style="margin-top:4px">${PUZZLES.map(p => IMG(["maple", "cherries", "butterfly", "blossom", "tulip", "sunflower", "hibiscus", "sakura", "clover"][PUZZLES.indexOf(p)]).replace('class="em"', `class="em ${today[p.id] ? "" : "off"}"`)).join("")}</div></div></section>
  ${doneN ? `<button class="btn pink" id="shareall">${IMG("gift")}Share today's bouquet (${doneN}/${PUZZLES.length})</button>` : ""}
  <div class="bouquet">${PUZZLES.map(p => { const r = today[p.id]; return `<div class="pz ${r ? "done" : ""}">
    <div class="row">${IMG(p.icon).replace('class="em"', 'class="em icon"')}<span class="spacer"></span>${r ? `<span class="pill done">done</span>` : `<span class="pill">today</span>`}</div>
    <h3>${p.name}</h3><p>${p.desc}</p>${r ? `<div style="font-size:.78rem;font-weight:800">${esc(r.line.replace(/^\S+\s/, ""))}</div>` : ""}
    ${gateOpen(p.id) ? "" : lockCard(p.id)}
    <div class="row" ${gateOpen(p.id) ? "" : 'style="opacity:.45;pointer-events:none"'}><button class="btn small ${r ? "ghost" : ""}" data-pz="${p.id}" data-mode="${r ? "practice" : "daily"}">${r ? "Replay" : "Play"}</button><button class="btn pink small" data-levels="${p.id}">${IMGW("star", 16)}${lvTotal(p.id)}/${LEVELS_N * 3}</button>${p.id !== "sushi" ? `<button class="btn ghost small" data-pz="${p.id}" data-mode="endless">Endless</button>` : ""}</div></div>`; }).join("")}</div>
  <section class="card stack"><header class="row">${IMGW("calendar", 40)}<div style="flex:1;min-width:0"><h2>Puzzle archive</h2><p class="muted" style="font-size:.82rem">Every past day's puzzles stay playable forever. No catching up required: fill them in whenever you like.</p></div><span class="pill pink">${archiveDone()}/${archiveDates().length * PUZZLES.length}</span></header>
    <div class="archive">${archiveDates().map(k => { const n = Object.keys(S.daily[k] || {}).length; const dt = dateFromKey(k); return `<button class="aday ${n >= PUZZLES.length ? "full" : ""}" data-day="${k}"><span class="ro">${DAYNAME[dt.getDay()].slice(0, 3)}</span><b>${dt.getMonth() + 1}/${dt.getDate()}</b><span class="adots">${n >= PUZZLES.length ? IMGW("basket", 18) : `${n}/${PUZZLES.length}`}</span></button>`; }).join("")}</div></section>
  <p class="muted" style="font-size:.78rem;text-align:center">Daily puzzles and every level are the same for both of you, so you can compare stars. Endless mode gets harder each time you clear one.</p>`;
  $$("[data-pz]", v).forEach(b => b.onclick = () => playPz(b.dataset.pz, b.dataset.mode));
  $$("[data-levels]", v).forEach(b => b.onclick = () => openLevels(b.dataset.levels));
  $$("[data-day]", v).forEach(b => b.onclick = () => openArchiveDay(b.dataset.day));
  const sa = $("#shareall", v); if (sa) sa.onclick = () => copyText(`${APP_NAME} 🌸 ${playDate()}\n` + PUZZLES.filter(p => today[p.id]).map(p => today[p.id].line).join("\n"));
}

// ---------- 1. PETAL GUESS ----------
function petalGuess(mode) {
  const { daily, rng, bump, level } = pzSetup("petal", mode);
  const pool = petalPool().sort((a, b) => a.id - b.id); if (!pool.length) { toast(GATES.petal.need); return; }
  const ans = rng.pick(pool); const A = [...ans.r]; const L = A.length; const MAXG = 6;
  openPlay("Petal Guess", (st, hud) => {
    const guesses = []; let hint = S.role === "kanji", over = false; const keyState = {};
    const timer = startTimer(hud);
    function score(g) {
      const res = Array(L).fill("miss"); const left = {};
      A.forEach((c, i) => { if (g[i] === c) res[i] = "hit"; else left[c] = (left[c] || 0) + 1; });
      g.forEach((c, i) => { if (res[i] === "hit") return; if (left[c]) { res[i] = "near"; left[c]--; } else if (KANA_ROW[c] === KANA_ROW[A[i]] || KANA_VOWEL[c] === KANA_VOWEL[A[i]]) res[i] = "kin"; });
      return res;
    }
    const rank = { hit: 3, near: 2, kin: 1, miss: 0 };
    function draw() {
      const cur = over ? [] : [...readInput($("#pgin", st) || { value: "" })].filter(c => BASIC.has(c));
      const rows = []; for (let r = 0; r < MAXG; r++) { const g = guesses[r]; rows.push(`<div class="pg-row">${Array.from({ length: L }, (_, i) => { if (g) return `<div class="pg-cell ${g.res[i]} flip" style="animation-delay:${i * .08}s">${g.k[i]}${showRo() ? `<small>${KANA_RO[g.k[i]]}</small>` : ""}</div>`; if (r === guesses.length && !over) return `<div class="pg-cell ${i === cur.length ? "cur" : ""}">${cur[i] || ""}</div>`; return `<div class="pg-cell"></div>`; }).join("")}</div>`); }
      $("#pggrid", st).innerHTML = rows.join("");
    }
    st.innerHTML = `<div class="clue" id="pgclue"></div>
      <div class="legend"><span><i style="background:var(--good)"></i>right spot</span><span><i style="background:var(--near)"></i>in the word</span><span><i style="background:var(--kin)"></i>same row or vowel</span></div>
      <div class="pg-grid" id="pggrid"></div>
      <div class="kinput"><input id="pgin" type="text" placeholder="type romaji: ya ma" aria-label="Type your guess in romaji"><button class="btn pink" id="pggo">Guess</button></div>
      <p class="typehint">Type like WaniKani: romaji turns into kana. Or tap the keys below.</p>
      <div class="kb" id="kb"></div><div class="row" style="justify-content:center"><button class="btn ghost small" id="pgdel">⌫ Delete</button><button class="btn ghost small" id="pghint">${IMG("question")}Hint</button></div>`;
    const inp = $("#pgin", st); bindKana(inp);
    function drawClue() { $("#pgclue", st).innerHTML = S.role === "kanji" ? `<span class="glyph">${esc(ans.k)}</span>${hint === 2 ? IMG(ans.e) + `<b>${esc(ans.en)}</b>` : `<span class="muted" style="font-size:.85rem">Spell its reading · ${L} kana</span>`}` : hint ? `${IMG(ans.e)}<b>${esc(ans.en)}</b><span class="muted">· ${L} kana</span>` : `<span class="muted">A secret ${L}-kana word. Need a clue? Tap Hint.</span>`; }
    function drawKb() {
      const cells = []; for (let v = 0; v < 5; v++) ROWS.forEach(r => { const map = { ya: [0, null, 1, null, 2], wa: [0, null, null, null, 1] }[r.id]; const k = map ? (map[v] === null ? null : r.kana[map[v]]) : r.kana[v]; cells.push(k ? `<button data-k="${k[0]}" class="${keyState[k[0]] || ""}"><span class="glyph">${k[0]}</span>${showRo() ? `<span class="ro">${k[0] === "を" ? "wo" : k[1]}</span>` : ""}</button>` : `<span class="blank"></span>`); });
      cells.push(`<button data-k="ん" class="${keyState["ん"] || ""}"><span class="glyph">ん</span>${showRo() ? `<span class="ro">n</span>` : ""}</button>`);
      $("#kb", st).innerHTML = cells.join("");
      $$("#kb [data-k]", st).forEach(b => b.onclick = () => { if (over) return; const cur = [...readInput(inp)]; if (cur.length >= L) return; inp.value = cur.join("") + b.dataset.k; SFX.tap(); draw(); });
    }
    inp.addEventListener("input", draw);
    inp.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); submit(); } });
    $("#pgdel", st).onclick = () => { const c = [...readInput(inp)]; c.pop(); inp.value = c.join(""); draw(); };
    $("#pghint", st).onclick = () => { if (S.role === "kanji") hint = 2; else hint = true; drawClue(); $("#pghint", st).disabled = true; };
    function submit() {
      if (over) return; const g = [...readInput(inp)];
      if (g.length !== L || !g.every(c => BASIC.has(c))) { $("#pggrid", st).classList.add("shake"); setTimeout(() => $("#pggrid", st).classList.remove("shake"), 400); toast(`Use ${L} basic hiragana`); return; }
      const res = score(g); guesses.push({ k: g, res }); inp.value = "";
      g.forEach((c, i) => { if (rank[res[i]] >= rank[keyState[c] || "miss"] || !keyState[c]) keyState[c] = res[i]; });
      const win = res.every(r => r === "hit");
      if (win || guesses.length >= MAXG) finish(win); else { SFX.tap(); draw(); drawKb(); }
    }
    function finish(win) {
      over = true; timer.stop(); draw(); drawKb(); const isNew = touchWord(ans, win, true); save();
      const grid = guesses.map(g => g.res.map(r => ({ hit: "🟩", near: "🟨", kin: "🟦", miss: "⬜" }[r])).join("")).join("\n");
      const scoreTxt = win ? `${guesses.length}/${MAXG}` : `X/${MAXG}`;
      if (daily) setDaily("petal", { score: scoreTxt, line: `🌷 Petal Guess ${scoreTxt}${hint && S.role !== "kanji" ? " (hint)" : ""}` });
      if (win) { SFX.win(); confetti(); bump(); statMin("petalBest", guesses.length); save(); } else SFX.bad();
      setTimeout(() => {
        if (level) levelResult(st, "petal", level, win ? (guesses.length <= 3 && !(S.role === "kanji" ? hint === 2 : hint) ? 3 : guesses.length <= 4 ? 2 : 1) : 0, win ? `${guesses.length}/6` : "X/6"); else resultScreen(st, { icon: win ? "tulip" : "wilted", title: win ? ["Genius!", "Amazing!", "Lovely!", "Nice!", "Phew!", "Just made it!"][guesses.length - 1] : "The petals fell…", score: scoreTxt, lines: [wordReveal(ans)], share: daily ? `${APP_NAME} 🌷 Petal Guess ${playDate()} ${scoreTxt}\n${grid}` : "", again: () => petalGuess("endless"), againLabel: "Endless round" });
        if (isNew) setTimeout(() => stampNow(ans), 500);
        say(ans.r);
      }, 900);
    }
    drawClue(); draw(); drawKb(); setTimeout(() => inp.focus({ preventScroll: true }), 50);
    return () => timer.stop();
  });
}

// ---------- 2. GARDEN PLOT (6x6 sudoku) ----------
function sudokuSolve(g, limit = 2) {
  let count = 0; const a = g.slice();
  const ok = (i, v) => { const r = Math.floor(i / 6), c = i % 6, br = Math.floor(r / 2) * 2, bc = Math.floor(c / 3) * 3; for (let k = 0; k < 6; k++) { if (a[r * 6 + k] === v || a[k * 6 + c] === v) return false; } for (let rr = br; rr < br + 2; rr++) for (let cc = bc; cc < bc + 3; cc++) if (a[rr * 6 + cc] === v) return false; return true; };
  (function rec() { if (count >= limit) return; let best = -1, bestOpts = null; for (let i = 0; i < 36; i++) if (a[i] < 0) { const o = []; for (let v = 0; v < 6; v++) if (ok(i, v)) o.push(v); if (!bestOpts || o.length < bestOpts.length) { best = i; bestOpts = o; if (!o.length) return; } } if (best < 0) { count++; return; } for (const v of bestOpts) { a[best] = v; rec(); a[best] = -1; if (count >= limit) return; } })();
  return count;
}
function makeSudoku(rng, d) {
  const perm = rng.shuffle([0, 1, 2, 3, 4, 5]);
  const bands = rng.shuffle([0, 1, 2]).flatMap(b => rng.shuffle([0, 1]).map(x => b * 2 + x));
  const stacks = rng.shuffle([0, 1]).flatMap(s => rng.shuffle([0, 1, 2]).map(x => s * 3 + x));
  const sol = []; for (let r = 0; r < 6; r++) for (let c = 0; c < 6; c++) { const R = bands[r], C = stacks[c]; sol.push(perm[(3 * (R % 2) + Math.floor(R / 2) + C) % 6]); }
  const g = sol.slice(); const target = Math.round(21 - d * 10);
  let givens = 36; for (const i of rng.shuffle([...Array(36).keys()])) { if (givens <= target) break; const v = g[i]; g[i] = -1; if (sudokuSolve(g) !== 1) g[i] = v; else givens--; }
  return { sol, g };
}
function gardenPlot(mode) {
  const { daily, rng, d, bump, level } = pzSetup("plot", mode);
  const { sol, g } = makeSudoku(rng, d);
  const kanjiMode = S.role === "kanji" && [1, 2, 3, 4, 5, 6].every(n => stampedK(toKanji(n)));
  let SYM;
  if (kanjiMode) SYM = [1, 2, 3, 4, 5, 6].map(n => ({ s: toKanji(n), alt: toYomi(n), ro: romaji(toYomi(n)) }));
  else { const src = plantedKana().filter(x => x.k !== "を").sort((a, b) => ALL_KANA.indexOf(a) - ALL_KANA.indexOf(b)); SYM = rng.shuffle(src).slice(0, 6).map(x => ({ s: x.k, alt: x.ro, ro: x.ro })); }
  const asAlt = g.map(v => v >= 0 && rng.f() < .35);
  openPlay("Garden Plot", (st, hud) => {
    const cur = g.slice(); let sel = cur.findIndex(v => v < 0); let over = false;
    const timer = startTimer(hud);
    const conflicts = i => { const v = cur[i]; if (v < 0) return false; const r = Math.floor(i / 6), c = i % 6; for (let k = 0; k < 36; k++) { if (k === i || cur[k] !== v) continue; const rr = Math.floor(k / 6), cc = k % 6; if (rr === r || cc === c || (Math.floor(rr / 2) === Math.floor(r / 2) && Math.floor(cc / 3) === Math.floor(c / 3))) return true; } return false; };
    const peer = (i, j) => { const r = Math.floor(i / 6), c = i % 6, rr = Math.floor(j / 6), cc = j % 6; return rr === r || cc === c || (Math.floor(rr / 2) === Math.floor(r / 2) && Math.floor(cc / 3) === Math.floor(c / 3)); };
    function draw() {
      $("#sd", st).innerHTML = cur.map((v, i) => { const r = Math.floor(i / 6), c = i % 6; const given = g[i] >= 0; const cls = [given ? "given" : v >= 0 ? "user" : "", given && asAlt[i] ? "asro" : "", i === sel ? "selcell" : sel >= 0 && peer(i, sel) ? "peer" : "", c === 2 ? "c2" : "", r === 1 || r === 3 ? "r1" : "", !given && conflicts(i) ? "bad" : ""].join(" "); return `<button class="${cls}" data-i="${i}" aria-label="row ${r + 1} column ${c + 1}">${v >= 0 ? (given && asAlt[i] ? esc(SYM[v].alt) : esc(SYM[v].s)) : ""}</button>`; }).join("");
      $$("#sd [data-i]", st).forEach(b => b.onclick = () => { const i = +b.dataset.i; if (g[i] >= 0) return; sel = i; draw(); });
    }
    st.innerHTML = `<p class="muted" style="font-size:.85rem;text-align:center">Fill every row, column and bed (the 2×3 boxes) with each of these once. ${kanjiMode ? "Some clues are written as readings, like さん (san) for 三." : "Some clues are written in romaji. Read them as kana!"}</p>
      <div class="sd" id="sd"></div>
      <div class="palette">${SYM.map((x, v) => `<button data-v="${v}"><span class="glyph">${esc(x.s)}</span>${showRo() ? `<span class="ro">${esc(x.ro)}</span>` : ""}</button>`).join("")}<button data-v="-1" aria-label="Erase"><span class="glyph">⌫</span></button></div>`;
    $$(".palette [data-v]", st).forEach(b => b.onclick = () => { if (over || sel < 0 || g[sel] >= 0) return; cur[sel] = +b.dataset.v; SFX.tap(); if (cur[sel] >= 0) { const nx = cur.findIndex((v, i) => v < 0 && i > sel); if (nx >= 0 && !conflicts(sel)) sel = nx; } draw(); check(); });
    function check() {
      if (cur.some(v => v < 0) || cur.some((v, i) => v !== sol[i])) return;
      over = true; timer.stop(); const t = fmtTime(timer.ms()); SFX.win(); confetti(); bump();
      SYM.forEach(x => [...x.s].forEach(c => waterKana(c))); addStat("plots"); statMin("plotBest", timer.ms()); save();
      if (daily) setDaily("plot", { score: t, line: `🥕 Garden Plot ${t}` });
      setTimeout(() => level ? levelResult(st, "plot", level, timer.ms() < 180000 ? 3 : timer.ms() < 360000 ? 2 : 1, t) : resultScreen(st, { icon: "carrot", title: "Every bed is planted!", score: t, lines: [`<span class="glyph" style="font-size:1.3rem">${SYM.map(x => esc(x.s)).join(" ")}</span>`], share: daily ? `${APP_NAME} 🥕 Garden Plot ${playDate()}\n${t} ${"🥕".repeat(3)}` : "", again: () => gardenPlot("endless"), againLabel: "Endless puzzle" }), 600);
    }
    draw();
    return () => timer.stop();
  });
}

// ---------- 3. GARDEN LOGIC ----------
const PERMS6 = (() => { const out = []; const rec = (a, rest) => { if (!rest.length) return out.push(a); rest.forEach((x, i) => rec([...a, x], rest.filter((_, j) => j !== i))); }; rec([], [0, 1, 2, 3, 4, 5]); return out; })();
const ANIMATE = new Set(["犬", "猫", "鳥", "虫", "亀", "兎"]);
function logicClues(items, pos) {
  const C = []; const rc = i => [Math.floor(i / 3), i % 3];
  const verb = (it, neg) => ANIMATE.has(it.k) ? (neg ? ["いません", "imasen"] : ["います", "imasu"]) : (neg ? ["ありません", "arimasen"] : ["あります", "arimasu"]);
  const mk = (kind, a, b, test, jpW, kaW, roW, enW, neg = false) => { const A = items[a], B = b != null ? items[b] : null; const [vk, vr] = verb(A, neg);
    C.push({ kind, test, jp: `${A.k}は${B ? B.k + "の" : ""}${jpW}に${vk}。`, kana: `${A.r}は ${B ? B.r + "の " : ""}${kaW}に ${vk}`, ro: `${A.ro} wa ${B ? B.ro + " no " : ""}${roW} ni ${vr}`, en: `The ${A.en} is ${neg ? "not " : ""}${enW}${B ? " the " + B.en : ""}.`,
      // the clue as shown: English, with the item written as a kanji (Kanji reader) or in romaji (Kana speller)
      enK: `${A.k} is ${neg ? "not " : ""}${enW}${B ? " " + B.k : ""}.`, enR: `${A.ro} is ${neg ? "not " : ""}${enW}${B ? " " + B.ro : ""}.` }); };
  for (let a = 0; a < 6; a++) {
    const [ra, ca] = rc(pos[a]);
    mk("col", a, null, p => p[a] % 3 === ca, ["左はし", "真ん中", "右はし"][ca], ["ひだりはし", "まんなか", "みぎはし"][ca], ["hidari-hashi", "mannaka", "migi-hashi"][ca], ["in the left column", "in the middle column", "in the right column"][ca]);
    mk("row", a, null, p => Math.floor(p[a] / 3) === ra, ["上の段", "下の段"][ra], ["うえの だん", "したの だん"][ra], ["ue no dan", "shita no dan"][ra], ["in the top row", "in the bottom row"][ra]);
    for (let b = 0; b < 6; b++) {
      if (a === b) continue; const [rb, cb] = rc(pos[b]);
      if (ca === cb && ra === 0 && rb === 1) mk("above", a, b, p => p[a] % 3 === p[b] % 3 && p[a] < 3 && p[b] >= 3, "上", "うえ", "ue", "above");
      if (ca === cb && ra === 1 && rb === 0) mk("below", a, b, p => p[a] % 3 === p[b] % 3 && p[a] >= 3 && p[b] < 3, "下", "した", "shita", "below");
      if (ra === rb && ca === cb - 1) mk("left", a, b, p => Math.floor(p[a] / 3) === Math.floor(p[b] / 3) && p[a] % 3 === p[b] % 3 - 1, "左", "ひだり", "hidari", "just left of");
      if (ra === rb && ca === cb + 1) mk("right", a, b, p => Math.floor(p[a] / 3) === Math.floor(p[b] / 3) && p[a] % 3 === p[b] % 3 + 1, "右", "みぎ", "migi", "just right of");
      const adj = (x, y) => { const [r1, c1] = rc(x), [r2, c2] = rc(y); return Math.abs(r1 - r2) + Math.abs(c1 - c2) === 1; };
      if (a < b && adj(pos[a], pos[b])) mk("next", a, b, p => adj(p[a], p[b]), "となり", "となり", "tonari", "next to");
      if (a < b && !adj(pos[a], pos[b])) mk("notnext", a, b, p => !adj(p[a], p[b]), "となり", "となり", "tonari", "next to", true);
    }
  }
  return C;
}
function makeLogic(rng, d) {
  const lp = logicPool(); const anim = rng.shuffle(lp.filter(x => ANIMATE.has(x.k))), inan = rng.shuffle(lp.filter(x => !ANIMATE.has(x.k)));
  let items = [...anim.slice(0, 3), ...inan.slice(0, 3)]; if (items.length < 6) items = [...items, ...rng.shuffle(lp.filter(x => !items.includes(x)))].slice(0, 6);
  items = rng.shuffle(items);
  const pos = rng.shuffle([0, 1, 2, 3, 4, 5]);
  const pool = logicClues(items, pos);
  const pref = { col: 1 - d, row: 1 - d, above: .6, below: .6, left: .5 + d / 2, right: .5 + d / 2, next: .3 + d, notnext: d * 1.2 };
  const ordered = pool.map(c => ({ c, k: rng.f() * (pref[c.kind] + .2) })).sort((a, b) => b.k - a.k).map(x => x.c);
  const count = cl => { let n = 0; for (const p of PERMS6) { if (cl.every(c => c.test(p))) { n++; if (n > 1) return n; } } return n; };
  const chosen = [];
  for (const c of ordered) { chosen.push(c); if (count(chosen) === 1) break; }
  if (d >= .4) for (const c of rng.shuffle([...chosen])) { const t = chosen.filter(x => x !== c); if (count(t) === 1) chosen.splice(chosen.indexOf(c), 1); }
  return { items, pos, clues: rng.shuffle(chosen) };
}
function gardenLogic(mode) {
  const { daily, rng, d, bump, level } = pzSetup("logic", mode);
  const { items, pos, clues } = makeLogic(rng, d);
  openPlay("Garden Logic", (st, hud) => {
    const at = Array(6).fill(-1); // cell -> item
    let mistakes = 0, peeks = 0, labels = false, over = false; const shown = new Set(); const struck = new Set();
    const timer = startTimer(hud, () => mistakes ? `<span class="chip">${IMG("wilted")}${mistakes}</span>` : "");
    function draw() {
      const tray = items.map((_, i) => i).filter(i => !at.includes(i));
      const itemBtn = i => `<button class="lg-item" data-pick="i${i}" aria-label="item ${i + 1}">${IMG(items[i].e)}${labels ? `<span class="lbl">${esc(S.role === "kanji" ? items[i].k : items[i].r)}</span>` : ""}</button>`;
      st.innerHTML = `<p class="muted" style="font-size:.85rem;text-align:center">Read the clues and drag everyone into the right spot. Tap a clue to see it in plain English.</p>
      <div class="clues">${clues.map((c, j) => `<button class="cluerow ${struck.has(j) ? "struck" : ""}" data-clue="${j}">${S.role === "kanji" ? `<span class="jp">${[...c.enK].map(ch => /[一-鿿]/.test(ch) ? `<b>${esc(ch)}</b>` : esc(ch)).join("")}</span>` : `<span class="kn" style="color:var(--ink);font-size:1.05rem">${esc(c.enR)}</span>`}${shown.has(j) ? `<span class="en">${esc(c.en)}</span>` : ""}</button>`).join("")}</div>
      <div class="lg-axis"><span>左 left</span><span>middle</span><span>右 right</span></div>
      <div class="lg-grid">${at.map((it, c) => `<div class="lg-cell" data-drop="c${c}" aria-label="${["top", "bottom"][Math.floor(c / 3)]} ${["left", "middle", "right"][c % 3]}">${it >= 0 ? itemBtn(it) : ""}</div>`).join("")}</div>
      <div class="lg-axis"><span>上 top row · 下 bottom row</span></div>
      <div class="lg-tray">${tray.map(itemBtn).join("") || `<button class="btn pink" id="lgcheck">${IMG("check")}Check my garden</button>`}</div>
      <div class="row" style="justify-content:center"><button class="btn ghost small" id="lglabels">${labels ? "Hide name tags" : "Show name tags (hint)"}</button></div>`;
      $$("[data-clue]", st).forEach(b => b.onclick = () => { const j = +b.dataset.clue; if (shown.has(j)) { struck.has(j) ? struck.delete(j) : struck.add(j); } else { shown.add(j); peeks++; } draw(); });
      $("#lglabels", st).onclick = () => { labels = !labels; if (labels) peeks++; draw(); };
      const ck = $("#lgcheck", st); if (ck) ck.onclick = check;
    }
    DND.onDrop = (pick, drop) => {
      if (over) return; const i = +pick.slice(1); const from = at.indexOf(i);
      if (drop.startsWith("c")) { const c = +drop.slice(1); const prev = at[c]; if (from >= 0) at[from] = prev; else if (prev >= 0) {/* prev back to tray */ } at[c] = i; SFX.tap(); draw(); }
    };
    DND.onTap = (pick) => {
      const i = +pick.slice(1); const from = at.indexOf(i);
      if (from >= 0 && DND.sel && DND.sel !== pick) { const s = DND.sel; DND.sel = null; DND.onDrop(s, "c" + from); return false; }
      if (from >= 0 && !DND.sel) { at[from] = -1; SFX.tap(); draw(); return false; }
    };
    function check() {
      const wrong = at.filter((it, c) => pos[it] !== c).length;
      if (wrong) { mistakes++; SFX.bad(); timer.redraw(); toast(`${wrong} ${wrong === 1 ? "friend is" : "friends are"} in the wrong spot`); $(".lg-grid", st).classList.add("shake"); setTimeout(() => $(".lg-grid", st)?.classList.remove("shake"), 400); return; }
      over = true; timer.stop(); SFX.win(); confetti(); bump();
      items.forEach(it => { const w = UNIQUE_WORDS.find(x => x.k === it.k); w && touchWord(w, true, false); }); if (!mistakes && !peeks) addStat("logicClean"); save();
      const t = fmtTime(timer.ms()); const sc = `${t}${mistakes ? ` · ${mistakes} slip${mistakes > 1 ? "s" : ""}` : ""}`;
      if (daily) setDaily("logic", { score: t, line: `🐰 Garden Logic ${sc}${peeks ? ` · ${peeks} peek${peeks > 1 ? "s" : ""}` : ""}` });
      $$(".lg-cell", st).forEach(c => c.classList.add("right"));
      setTimeout(() => level ? levelResult(st, "logic", level, !mistakes && !peeks ? 3 : mistakes <= 1 ? 2 : 1, sc) : resultScreen(st, { icon: "rabbit", title: "Everyone's home!", score: sc, lines: [`${clues.length} clues · ${peeks} peeks`, `<span class="muted" style="font-size:.85rem">Grammar note: います (imasu) is for living things, あります (arimasu) for objects.</span>`], share: daily ? `${APP_NAME} 🐰 Garden Logic ${playDate()}\n${sc}${peeks ? ` · ${peeks} peeks` : " · no peeks!"}` : "", again: () => gardenLogic("endless"), againLabel: "Endless garden" }), 700);
    }
    draw();
    return () => timer.stop();
  });
}

// ---------- 4. MISSING HALF ----------
function missingHalf(mode) {
  const { daily, rng, d, bump, level } = pzSetup("half", mode);
  const N = 8; const rounds = rng.shuffle(PARTS).slice(0, N).map((p, i) => ({ p, miss: d >= .85 && i >= 4 ? ["a", "b"] : [rng.f() < .5 ? "a" : "b"] }));
  openPlay("Missing Half", (st, hud) => {
    let r = 0, slips = 0, reads = 0; const t0 = now(); const newStamps = [];
    const drawHud = () => { hud.innerHTML = `<span class="chip">${r + 1 > N ? N : r + 1}/${N}</span>${slips ? `<span class="chip">${IMG("wilted")}${slips}</span>` : ""}`; };
    function round() {
      if (r >= N) return finish(); drawHud();
      const { p, miss } = rounds[r]; const filled = { a: !miss.includes("a"), b: !miss.includes("b") };
      const need = miss.map(m => p[m]);
      const decoys = rng.shuffle(PART_DECOYS.filter(x => !need.includes(x))).slice(0, 6 - need.length);
      const tray = rng.shuffle([...need, ...decoys]);
      const cap = { lr: ["left", "right"], tb: ["top", "bottom"], out: ["outside", "inside"] }[p.l];
      function draw(solved) {
        st.innerHTML = `<div class="clue">${IMG(p.e)}<b>${esc(p.en)}</b></div>
        ${solved ? `<div class="reveal pop"><div class="glyph mh-done">${p.k}</div><div class="muted">${esc(p.a)} + ${esc(p.b)} = ${esc(p.k)}</div></div>` : `<div class="mh-box ${p.l === "out" ? "tb" : p.l}">${["a", "b"].map((m, j) => `<div class="mh-part ${filled[m] ? "filled" : ""}" data-drop="${m}" aria-label="${cap[j]} piece">${filled[m] ? esc(p[m]) : `<span class="ro">${cap[j]}</span>`}</div>`).join("")}</div>
        <div class="tiles kanji-tiles">${tray.map((x, j) => `<button class="tile" data-pick="t${j}"><span class="glyph">${esc(x)}</span></button>`).join("")}</div>`}
        ${solved ? `<div class="card stack" style="gap:8px"><span class="eyebrow" style="text-align:center">Bonus: type the reading, WaniKani style</span>
          ${S.role === "kanji" ? "" : `<p style="text-align:center"><span class="glyph" style="font-size:1.2rem">${p.r}</span> <span class="ro">${p.ro}</span></p>`}
          <div class="kinput"><input id="mhin" type="text" placeholder="romaji → かな" aria-label="Type the reading"><button class="btn pink" id="mhgo">Enter</button></div>
          <div class="row" style="justify-content:center"><button class="btn ghost small" id="mhskip">Skip</button></div></div>` : ""}`;
        if (!solved) return;
        const inp = $("#mhin", st); bindKana(inp); setTimeout(() => inp.focus({ preventScroll: true }), 50);
        const next = () => { r++; round(); };
        const go = () => { const v = readInput(inp); if (!v) return; if (v === p.r) { inp.classList.add("ok"); reads++; SFX.good(); say(p.r); setTimeout(next, 700); } else { inp.classList.add("no"); SFX.bad(); setTimeout(() => { inp.classList.remove("no"); inp.value = ""; toast(`It's ${p.r} (${p.ro})`); }, 500); $("#mhgo", st).textContent = "Try again"; } };
        $("#mhgo", st).onclick = go; inp.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); go(); } });
        $("#mhskip", st).onclick = () => { say(p.r); next(); };
      }
      DND.onDrop = (pick, drop) => {
        const x = tray[+pick.slice(1)]; if (filled[drop] === true) return;
        if (x === p[drop] || (p.a === p.b && miss.includes(drop) && x === p.a)) { filled[drop] = true; tray.splice(+pick.slice(1), 1); SFX.good(); if (filled.a && filled.b) { SFX.pop(); const w = KJ_BY[p.k]; if (w && isStamped(w)) touchWord(w, true, false); save(); draw(true); } else draw(); }
        else { slips++; SFX.bad(); drawHud(); const z = $(`[data-drop="${drop}"]`, st); z && (z.classList.add("shake"), setTimeout(() => z.classList.remove("shake"), 400)); }
      };
      DND.onTap = null;
      draw();
    }
    function finish() {
      const t = fmtTime(now() - t0); SFX.win(); confetti(); bump(); addStat("reads", reads); if (!slips) addStat("halfFlawless"); save();
      const sc = `${N - Math.min(N, slips)}/${N}`; const line = `🧩 Missing Half ${slips ? slips + " slip" + (slips > 1 ? "s" : "") : "flawless"} · ${reads} reading${reads === 1 ? "" : "s"} typed`;
      if (daily) setDaily("half", { score: sc, line });
      if (level) levelResult(st, "half", level, slips === 0 ? 3 : slips <= 2 ? 2 : 1, `${slips} slip${slips === 1 ? "" : "s"}`); else resultScreen(st, { icon: "puzzle", title: slips ? "Kanji built!" : "Flawless intuition!", score: `${slips} slip${slips === 1 ? "" : "s"}`, lines: [`<span class="glyph" style="font-size:1.6rem">${rounds.map(x => x.p.k).join(" ")}</span>`, `${reads}/${N} readings typed · ${t}`], share: daily ? `${APP_NAME} 🧩 Missing Half ${playDate()}\n${rounds.map(() => "🧩").join("")}\n${line.slice(3)}` : "", again: () => missingHalf("endless"), againLabel: "Endless set" });
      setTimeout(() => newStamps.forEach(stampNow), 600);
    }
    round();
  });
}

// ---------- 5. NUMBER LINE ----------
function numberLine(mode) {
  const { daily, rng, d, bump, level } = pzSetup("line", mode);
  const kanjiMode = S.role === "kanji";
  const face = (n, yen) => kanjiMode ? toKanji(n) + (yen ? "円" : "") : toYomi(n) + (yen ? "えん" : "");
  const roOf = (n, yen) => romaji(toYomi(n) + (yen ? "えん" : ""));
  const range = d < .3 ? [1, 10] : d < .6 ? [1, 99] : d < .85 ? [10, 999] : [100, 9999];
  const okN = n => [...toKanji(n)].every(ch => stampedK(ch));
  const cap = stampedK("千") ? 9999 : stampedK("百") ? 999 : stampedK("十") ? 99 : 9;
  const span = (lo, hi) => { const o = []; for (let n = Math.max(1, lo); n <= Math.min(hi, cap); n++) if (okN(n)) o.push(n); return o; };
  let allowed = span(range[0], range[1]); if (allowed.length < 6) allowed = span(1, cap);
  const pickNums = k => rng.shuffle(allowed).slice(0, Math.min(k, allowed.length));
  const priceOK = stampedK("円") && stampedK("十") && stampedK("百");
  const prices = span(10, 9999).filter(n => n % 10 === 0 && n >= 50);
  const types = ["order", "gap", "price", "order", "price", "gap"].map(t => t === "price" && (!priceOK || prices.length < 4) ? "order" : t === "gap" && allowed.length < 5 ? "order" : t);
  const rounds = types.map(t => {
    if (t === "order") { const nums = pickNums(d > .5 ? 5 : 4); return { t, items: nums.map(n => ({ n, f: face(n), ro: roOf(n) })) }; }
    if (t === "gap") { const L = [...allowed].sort((a, b) => a - b); const j = 1 + rng.int(L.length - 2); let i = rng.int(j), k = j + 1 + rng.int(L.length - j - 1); let outs = L.filter(x => x < L[i] || x > L[k]); if (outs.length < 2) { i = j - 1; k = j + 1; outs = L.filter(x => x < L[i] || x > L[k]); } const cand = rng.shuffle([L[j], ...rng.shuffle(outs).slice(0, 2)]); return { t, a: L[i], b: L[k], mid: L[j], items: cand.map(n => ({ n, f: face(n), ro: roOf(n) })) }; }
    const goods = rng.shuffle(KONBINI).slice(0, 4); const ps = rng.shuffle(prices).slice(0, 4);
    return { t, items: goods.map((g, i) => ({ n: ps[i], f: face(ps[i], true), ro: roOf(ps[i], true), g })) };
  });
  openPlay("Number Line", (st, hud) => {
    let r = 0, slips = 0; const t0 = now();
    const drawHud = () => { hud.innerHTML = `<span class="chip">${Math.min(r + 1, rounds.length)}/${rounds.length}</span>${slips ? `<span class="chip">${IMG("wilted")}${slips}</span>` : ""}`; };
    function round() {
      if (r >= rounds.length) return finish(); drawHud();
      const R = rounds[r]; const slotsN = R.t === "gap" ? 1 : R.items.length; const placed = Array(slotsN).fill(-1);
      const tileHTML = (it, j) => `<button class="tile nl-tile" data-pick="n${j}">${it.g ? IMG(it.g.e) + `<span class="ro" style="font-size:.65rem">${esc(it.g.k)}</span>` : ""}<span class="glyph">${esc(it.f)}</span>${showRo() && !kanjiMode ? `<span class="ro">${esc(it.ro)}</span>` : ""}</button>`;
      const title = R.t === "order" ? "Line them up, smallest to biggest" : R.t === "gap" ? "Which number fits in the gap?" : "Konbini shelf: cheapest to most expensive";
      const caps = R.t === "price" ? ["安い yasui (cheap)", "高い takai (pricey)"] : ["小さい chiisai (small)", "大きい ookii (big)"];
      function draw(marks) {
        const slot = (i) => { const it = placed[i] >= 0 ? R.items[placed[i]] : null; return `<div class="nl-slot ${marks ? (marks[i] ? "right" : "wrong") : ""}" data-drop="s${i}">${it ? `${it.g ? IMG(it.g.e) : ""}<span class="glyph">${esc(it.f)}</span>` : `<span class="ro">${i + 1}</span>`}</div>`; };
        st.innerHTML = `<h3 style="text-align:center">${title}</h3>
          <div class="nl">${R.t === "gap" ? `<div class="nl-slot fixed"><span class="glyph">${esc(face(R.a))}</span></div>${slot(0)}<div class="nl-slot fixed"><span class="glyph">${esc(face(R.b))}</span></div>` : placed.map((_, i) => slot(i)).join("")}</div>
          <div class="nl-axis"></div><div class="nl-cap"><span>${caps[0]}</span><span>${caps[1]}</span></div>
          <div class="tiles" style="margin-top:8px">${R.items.map((it, j) => placed.includes(j) ? "" : tileHTML(it, j)).join("")}</div>
          ${placed.some(x => x >= 0) && !marks ? `<div class="row" style="justify-content:center"><button class="btn ghost small" id="nlclear">Clear</button></div>` : ""}
          <div id="nlexp"></div>`;
        const c = $("#nlclear", st); if (c) c.onclick = () => { placed.fill(-1); draw(); };
      }
      DND.onDrop = (pick, drop) => {
        const j = +pick.slice(1), i = +drop.slice(1); if (placed.includes(j)) placed[placed.indexOf(j)] = -1; placed[i] = j; SFX.tap();
        if (placed.every(x => x >= 0)) evaluate(); else draw();
      };
      DND.onTap = null;
      function evaluate() {
        let marks;
        if (R.t === "gap") marks = [R.items[placed[0]].n === R.mid];
        else { const sorted = [...R.items].map(x => x.n).sort((a, b) => a - b); marks = placed.map((j, i) => R.items[j].n === sorted[i]); }
        draw(marks);
        const exp = (R.t === "gap" ? [R.a, R.mid, R.b] : [...R.items].map(x => x.n).sort((a, b) => a - b)).map(n => `<div><span class="glyph">${esc(face(n, R.t === "price"))}</span> = <b>${n.toLocaleString()}${R.t === "price" ? "円" : ""}</b> <span class="ro">${esc(roOf(n, R.t === "price"))}</span></div>`).join("");
        if (marks.every(Boolean)) { SFX.good(); $("#nlexp", st).innerHTML = `<div class="card stack pop" style="gap:4px">${exp}<button class="btn" id="nlnext">Next</button></div>`; $("#nlnext", st).onclick = () => { r++; round(); }; }
        else { slips++; SFX.bad(); drawHud(); setTimeout(() => { placed.forEach((j, i) => { if (!marks[i]) placed[i] = -1; }); draw(); }, 900); }
      }
      draw();
    }
    function finish() {
      const t = fmtTime(now() - t0); SFX.win(); confetti(); bump(); if (!slips) addStat("lineFlawless"); save();
      const line = `🧮 Number Line ${slips ? slips + " slip" + (slips > 1 ? "s" : "") : "flawless"} · ${t}`;
      if (daily) setDaily("line", { score: slips, line });
      if (level) levelResult(st, "line", level, slips === 0 ? 3 : slips <= 2 ? 2 : 1, `${slips} slip${slips === 1 ? "" : "s"}`); else resultScreen(st, { icon: "abacus", title: slips ? "All lined up!" : "Perfect counting!", score: `${slips} slip${slips === 1 ? "" : "s"}`, lines: [t, `<span class="muted" style="font-size:.85rem">Watch the sound changes: 300 is さんびゃく (sanbyaku) and 3,000 is さんぜん (sanzen).</span>`], share: daily ? `${APP_NAME} 🧮 Number Line ${playDate()}\n${line.slice(3)}` : "", again: () => numberLine("endless"), againLabel: "Endless set" });
    }
    round();
  });
}

// ---------- 6. TRANSFER CHAIN (乗り換え) ----------
// Ride from one kanji to another: every train is a real two-kanji word, and its second kanji is where you change.
// Only words made of stamped kanji count; number-only words (二十, 三百) are left out so chains stay interesting.
const CHAIN_BLOCK = new Set(["土人", "外人", "国人"]);
const COMPOUNDS = COMPOUND_TSV.split("\n").map(l => { const [w, r, en] = l.split("\t"); return { w, a: w[0], b: w[1], r, en, get ro() { return romaji(this.r); } }; })
  .filter(c => !CHAIN_BLOCK.has(c.w) && !(NUM_ON.has(c.a) && NUM_ON.has(c.b)));
function chainGraph() {
  const out = {};
  for (const c of COMPOUNDS) if (stampedK(c.a) && stampedK(c.b)) (out[c.a] || (out[c.a] = [])).push(c);
  return out;
}
function chainDist(out, from) { const dist = { [from]: 0 }, q = [from]; while (q.length) { const x = q.shift(); for (const c of out[x] || []) if (!(c.b in dist)) { dist[c.b] = dist[x] + 1; q.push(c.b); } } return dist; }
const chainPoolSize = () => { const out = chainGraph(); return Object.values(out).reduce((a, l) => a + l.length, 0); };
function chainPuzzle(rng, want) {
  const out = chainGraph(); const starts = Object.keys(out).filter(k => out[k].length >= 2).sort();
  const here = (typeof lastVisited === "function" && lastVisited()) || null; const local = new Set(here && !here.track.kana ? here.items.map(w => w.k) : []);
  for (let tries = 0; tries < 80; tries++) {
    const a = rng.pick(starts); if (!a) break; const dist = chainDist(out, a);
    for (const L of [want, want - 1, want + 1, want - 2].filter(n => n >= 2)) {
      const at = Object.keys(dist).filter(k => dist[k] === L).sort(); if (!at.length) continue;
      const goals = at.filter(k => local.has(k)); const g = rng.pick(goals.length && rng.f() < .7 ? goals : at);
      return { out, a, g, best: L, town: local.has(g) ? here : null };
    }
  }
  return null;
}
function transferChain(mode) {
  const { daily, rng, d, bump, level } = pzSetup("chain", mode);
  const want = level ? [2, 2, 2, 3, 3, 3, 4, 4, 4, 5][level - 1] : d < .35 ? 2 : d < .7 ? 3 : d < .95 ? 4 : 5;
  const P = chainPuzzle(rng, want); if (!P) { toast("Stamp a few more kanji to open more lines!"); return; }
  const { out, a, g, best, town } = P; const kanaRole = S.role !== "kanji"; const MAXR = best + 6;
  openPlay("Transfer Chain", (st, hud) => {
    const rides = []; let undos = 0; const t0 = now();
    const at = () => rides.length ? rides[rides.length - 1].b : a;
    const drawHud = () => { hud.innerHTML = `<span class="chip">${IMG("ticket")}${rides.length}/${MAXR}</span><span class="chip">best ${best}</span>`; };
    const kj = k => `<span class="glyph">${esc(k)}</span>`;
    function draw() {
      drawHud(); const cur = at(); const opts = rng.shuffle(out[cur] || []);
      const dist = chainDist(out, cur); const good = opts.filter(c => (chainDist(out, c.b)[g] ?? 99) < (dist[g] ?? 99));
      const shown = [...new Set([...good.slice(0, 2), ...opts])].slice(0, 8).sort((x, y) => x.w.localeCompare(y.w));
      st.innerHTML = `<div class="chain-head"><div class="chain-end"><small>From</small>${kj(a)}</div><div class="chain-rail" aria-hidden="true">${"<i></i>".repeat(Math.max(best, rides.length) + 1)}</div><div class="chain-end goal"><small>To</small>${kj(g)}</div></div>
        ${town ? `<p class="muted chain-town">${IMGW("station", 18)}<span>Destination kanji from ${esc(town.stop.ro)}, your latest stop</span></p>` : ""}
        <div class="chain-log">${rides.length ? rides.map(c => `<span class="chain-ride">${kj(c.w)}<small>${esc(c.r)} · ${esc(c.en)}</small></span>`).join(`<span class="chain-arrow">→</span>`) : `<p class="muted" style="font-size:.85rem">Pick a word that starts with ${esc(a)}. Its second kanji is where you change trains. Reach ${esc(g)} in as few rides as you can.</p>`}</div>
        <div class="eyebrow" style="text-align:center">Trains leaving ${esc(cur)}</div>
        ${shown.length ? `<div class="chain-opts">${shown.map((c, i) => `<button class="chainopt" data-opt="${i}"><span class="glyph">${esc(c.a)}<b>${esc(c.b)}</b></span>${kanaRole ? `<small>${esc(c.r)} · ${esc(c.ro)}</small><small class="en">${esc(c.en)}</small>` : ""}</button>`).join("")}</div>`
          : `<div class="card" style="text-align:center"><b>End of the line!</b><p class="muted" style="font-size:.85rem">No stamped words start with ${esc(cur)}. Go back one stop.</p></div>`}
        <div class="row" style="justify-content:center">${rides.length ? `<button class="btn ghost small" id="undo">← Back one stop</button>` : ""}</div>`;
      $$("[data-opt]", st).forEach(b => b.onclick = () => ride(shown[+b.dataset.opt]));
      const u = $("#undo", st); if (u) u.onclick = () => { rides.pop(); undos++; SFX.bad(); draw(); };
    }
    function ride(c) {
      rides.push(c); say(c.r); SFX.good();
      if (c.b === g) return finish(true);
      if (rides.length >= MAXR) return finish(false);
      draw();
    }
    function finish(arrived) {
      const n = rides.length, extra = n - best; const stars = !arrived ? 0 : extra <= 0 && !undos ? 3 : extra <= 2 ? 2 : 1;
      if (arrived) { SFX.win(); confetti(stars === 3 ? 40 : 20); bump(); addStat("chains"); }
      rides.forEach(c => [c.a, c.b].forEach(k => { const w = KJ_BY[k]; if (w && isStamped(w)) touchWord(w, true, false); })); save();
      const label = arrived ? `${n} ride${n === 1 ? "" : "s"} (best ${best})` : "Out of tickets";
      const line = `🚃 Transfer Chain ${a}→${g} ${label}`;
      if (daily && arrived) setDaily("chain", { score: `${n}/${best}`, line });
      const route = `<div class="chain-log done">${rides.map(c => `<span class="chain-ride">${kj(c.w)}<small>${esc(c.r)} · ${esc(c.ro)} · ${esc(c.en)}</small></span>`).join(`<span class="chain-arrow">→</span>`)}</div>`;
      if (level) { levelResult(st, "chain", level, stars, label); st.insertAdjacentHTML("afterbegin", route); return; }
      resultScreen(st, { icon: "train", title: !arrived ? "Out of tickets!" : stars === 3 ? "Perfect connection!" : `Arrived at ${g}!`, score: label, lines: [route, `${undos} back-up${undos === 1 ? "" : "s"} · ${fmtTime(now() - t0)}`],
        share: daily && arrived ? `${APP_NAME} 🚃 Transfer Chain ${playDate()}\n${a} ${"🚃".repeat(n)} ${g}\n${n} rides · best ${best}${undos ? ` · ${undos} back-up${undos === 1 ? "" : "s"}` : ""}` : "", again: () => transferChain("endless"), againLabel: "New route" });
    }
    draw();
  });
}

// ---------- LEVEL LADDERS + RALLY STAMP CARDS ----------
const RALLY_INK = { 1: "#A0642D", 2: "#6F7F92", 3: "#C38E12" };
const rallyGame = id => RALLY_GAMES.find(g => g.id === id);
function lvRec(id) { const L = S.levels || (S.levels = {}); return L[id] || (L[id] = {}); }
function lvStars(id, n) { return (lvRec(id)[n] || {}).stars || 0; }
function lvUnlocked(id, n) { return n === 1 || lvStars(id, n - 1) > 0; }
function lvTotal(id) { let t = 0; for (let n = 1; n <= LEVELS_N; n++) t += lvStars(id, n); return t; }
function lvCleared(id) { let c = 0; for (let n = 1; n <= LEVELS_N; n++) if (lvStars(id, n)) c++; return c; }
const allStars = () => RALLY_GAMES.reduce((a, g) => a + lvTotal(g.id), 0);
const starRow = (n, size = 18) => [1, 2, 3].map(i => `<img class="em ${i <= n ? "" : "staroff"}" src="${EMO.star}" alt="" style="width:${size}px;height:${size}px">`).join("");
function openLevels(id) {
  if (!gateOpen(id)) { toast(GATES[id].need + " to unlock " + GATES[id].name); return; }
  const g = rallyGame(id); const P = PUZZLES.find(p => p.id === id);
  openPlay(`${g.name} levels`, (st, hud) => {
    hud.innerHTML = `<span class="chip">${IMG("star")}${lvTotal(id)}/${LEVELS_N * 3}</span>`;
    st.innerHTML = `<div class="card stack" style="gap:6px"><div class="row">${IMGW(g.icon, 44)}<div style="flex:1;min-width:0"><h3>${g.name} levels</h3><p class="muted" style="font-size:.82rem">Clear a level to earn up to three stars. Each level is the same for both of you.</p></div></div>
      <div class="bar"><i style="width:${lvTotal(id) / (LEVELS_N * 3) * 100}%"></i></div></div>
      <div class="ladder">${Array.from({ length: LEVELS_N }, (_, i) => { const n = i + 1, s = lvStars(id, n), open = lvUnlocked(id, n), rec = lvRec(id)[n];
        return `<button class="lvnode ${s ? "cleared" : open ? "open" : "locked"}" ${open ? `data-lv="${n}"` : "disabled"} aria-label="Level ${n}${open ? "" : " locked"}"><span class="lvnum">${open ? n : IMGW("lock", 26)}</span><span class="lvstars">${open ? starRow(s, 14) : ""}</span>${rec && rec.best ? `<small>${esc(rec.best)}</small>` : ""}</button>`; }).join("")}</div>
      <p class="muted" style="font-size:.78rem;text-align:center">${id === "sushi" ? "Earn the target yen in 90 seconds: ★ at the target, ★★ at 1.5×, ★★★ at 2×. The target and belt speed rise each level." : "Levels get harder as you go. Replay any level to raise your stars."}</p>`;
    $$("[data-lv]", st).forEach(b => b.onclick = () => playPz(id, "L" + b.dataset.lv));
  });
}
function levelResult(st, id, n, stars, label) {
  const g = rallyGame(id); const prev = lvStars(id, n); const rec = lvRec(id);
  const improved = stars > prev;
  if (improved) rec[n] = { stars, best: label, date: todayKey() };
  save();
  const next = n < LEVELS_N && (stars > 0 || prev > 0);
  const share = `${APP_NAME} ${g.name} Lv ${n} ${"★".repeat(stars)}${"☆".repeat(3 - stars)} · ${label}`;
  st.innerHTML = `<div class="card result pop"><span class="eyebrow">${esc(g.name)} · Level ${n}</span>
    ${IMGW(stars === 3 ? "crown" : stars ? "star" : "wilted", 96)}
    <div class="bigstars">${starRow(stars, 40)}</div><div class="score">${esc(label)}</div>
    <p>${stars === 0 ? "Not quite! Give it another go." : improved ? (prev ? `New best! Up from ${"★".repeat(prev)}.` : "Level cleared!") : `Your best here is still ${"★".repeat(prev)}.`}</p>
    ${stars < 3 ? `<p class="muted" style="font-size:.8rem">${starHint(id, n)}</p>` : `<p class="muted" style="font-size:.8rem">Perfect! Dare your partner to match it.</p>`}
    <div class="sharebox">${esc(share)}</div><button class="btn pink" id="sharebtn">Copy result</button>
    <div class="row" style="justify-content:center"><button class="btn ghost" id="retry">Retry</button>${next ? `<button class="btn" id="nextlv">Level ${n + 1}</button>` : ""}<button class="btn ghost" id="map">Level map</button></div></div>`;
  const play = m => playPz(id, m);
  $("#sharebtn", st).onclick = () => copyText(share);
  $("#retry", st).onclick = () => play("L" + n);
  if (next) $("#nextlv", st).onclick = () => play("L" + (n + 1));
  $("#map", st).onclick = () => openLevels(id);
  if (stars) { SFX.win(); if (stars === 3) confetti(40); }
  setTimeout(() => holdCelebrations(false), 400);
}
function starHint(id, n) {
  return ({ chain: "★★★: the shortest route with no back-ups. ★★: within 2 rides of it.", petal: "★★★: solve in 3 guesses or fewer without a hint. ★★: 4 or fewer.", plot: "★★★: under 3 minutes. ★★: under 6 minutes.", logic: "★★★: no slips and no peeks. ★★: at most one slip.",
    half: "★★★: no slips. ★★: two slips or fewer.", radical: "★★★: no slips. ★★: two slips or fewer.", match: "★★★: no mismatches. ★★: two or fewer.", line: "★★★: no slips. ★★: two slips or fewer.", sushi: `Target ¥${(900 + 250 * (n - 1)).toLocaleString()}: ★★ at 1.5×, ★★★ at 2×.` })[id];
}

// ---------- ARCHIVE ----------
const ARCHIVE_START = "2026-09-26"; // the archive only ever grows from here
function archiveDates() { const out = []; for (let i = 1; ; i++) { const k = todayKey(new Date(now() - i * DAY)); if (k < ARCHIVE_START) break; out.push(k); } return out; }
function archiveDone() { return archiveDates().reduce((a, k) => a + Object.keys(S.daily[k] || {}).length, 0); }
function openArchiveDay(k) {
  const dt = dateFromKey(k); const d = dayDifficulty(dt); const diffName = d < .35 ? "gentle" : d < .7 ? "medium" : d < .95 ? "tricky" : "brutal";
  openPlay(`${DAYNAME[dt.getDay()]} ${dt.getMonth() + 1}/${dt.getDate()}`, (st, hud) => {
    const recs = S.daily[k] || {};
    hud.innerHTML = `<span class="chip">${IMG("basket")}${Object.keys(recs).length}/${PUZZLES.length}</span>`;
    st.innerHTML = `<p class="muted" style="text-align:center;font-size:.85rem">The exact puzzles from ${k}. ${DAYNAME[dt.getDay()]}s are <b>${diffName}</b>.</p>
      <div class="bouquet">${PUZZLES.map(p => { const r = recs[p.id]; return `<div class="pz ${r ? "done" : ""}"><div class="row">${IMG(p.icon).replace('class="em"', 'class="em icon"')}<span class="spacer"></span>${r ? `<span class="pill done">done</span>` : ""}</div><h3>${p.name}</h3>${r ? `<div style="font-size:.78rem;font-weight:800">${esc(r.line.replace(/^\S+\s/, ""))}</div>` : `<p></p>`}${gateOpen(p.id) ? "" : lockCard(p.id)}<div class="row" ${gateOpen(p.id) ? "" : 'style="opacity:.45;pointer-events:none"'}><button class="btn small ${r ? "ghost" : ""}" data-arc="${p.id}">${r ? "Replay" : "Play"}</button></div></div>`; }).join("")}</div>`;
    $$("[data-arc]", st).forEach(b => b.onclick = () => { const id = b.dataset.arc; playPz(id, recs[id] ? "practice" : "D" + k); });
  });
}

// ---------- RADICAL BUILDER ----------
function radicalBuilder(mode) {
  const { daily, rng, d, bump, level } = pzSetup("radical", mode);
  const pool = stampedWords().filter(w => radsOf(w).length >= 2 || (radsOf(w).length === 1 && radGlyph(radsOf(w)[0]) !== w.k));
  const src = (pool.length >= 6 ? pool : stampedWords()).sort((a, b) => a.id - b.id);
  const N = d > .6 ? 10 : 8;
  const picks = rng.shuffle(src).slice(0, Math.min(N, src.length));
  while (picks.length < N) picks.push(rng.pick(src));
  const qs = picks.map((w, i) => ({ t: i % 2 && d >= .2 ? "which" : "rad", w, pool: src.length >= 4 ? src : KJ }));
  openPlay("Radical Builder", (st, hud) => {
    const t0 = now();
    runQuiz(st, hud, qs, { requeue: false,
      onAnswer: (q, ok) => touchWord(q.w, ok, false),
      onFinish: ({ mistakes, total, missed }) => {
        const t = fmtTime(now() - t0); bump(); if (!mistakes) addStat("radFlawless"); save(); SFX.win(); if (!mistakes) confetti();
        const label = `${mistakes} slip${mistakes === 1 ? "" : "s"}`;
        if (daily) setDaily("radical", { score: mistakes, line: `🧱 Radical Builder ${mistakes ? label : "flawless"} · ${t}` });
        if (level) return levelResult(st, "radical", level, mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1, label);
        resultScreen(st, { icon: "bricks", title: mistakes ? "Kanji taken apart!" : "Radical detective!", score: label, lines: [`${total} kanji · ${t}`, missed.length ? missed.map(q => `<span class="glyph">${esc(q.w.k)}</span> = ${radsOf(q.w).map(r => `<span class="glyph">${esc(radGlyph(r))}</span> ${esc(radMean(r))}`).join(" + ")}`).join("<br>") : ""],
          share: daily ? `${APP_NAME} 🧱 Radical Builder ${playDate()}\n${mistakes ? label : "flawless"} · ${t}` : "", again: () => radicalBuilder("endless"), againLabel: "Endless set" });
      } });
  });
}

// ---------- MEANING MATCH ----------
function meaningMatch(mode) {
  const { daily, rng, d, bump, level } = pzSetup("match", mode);
  const src = stampedWords().sort((a, b) => a.id - b.id);
  const per = d > .6 ? 6 : d > .3 ? 5 : 4; const boards = 3;
  const order = rng.shuffle(src); const rounds = [];
  for (let b = 0; b < boards; b++) { const set = []; const used = new Set(); for (const w of [...order.slice(b * per), ...rng.shuffle(src)]) { if (set.length >= per) break; if (used.has(w.k) || set.some(x => x.en === w.en)) continue; used.add(w.k); set.push(w); } rounds.push(set); }
  openPlay("Meaning Match", (st, hud) => {
    let b = 0, slips = 0, sel = null; const t0 = now(); let iv = 0;
    const drawHud = () => { hud.innerHTML = `<span class="chip">${Math.min(b + 1, boards)}/${boards}</span>${slips ? `<span class="chip">${IMG("wilted")}${slips}</span>` : ""}<span class="chip">${IMG("hourglass")}${fmtTime(now() - t0)}</span>`; };
    iv = setInterval(drawHud, 1000);
    function board() {
      if (b >= boards) return finish(); drawHud();
      const set = rounds[b]; let left = set.length;
      const tiles = rng.shuffle([...set.map(w => ({ kind: "k", w })), ...set.map(w => ({ kind: "m", w }))]);
      st.innerHTML = `<p class="muted" style="text-align:center;font-size:.85rem">Tap a kanji, then its meaning.</p><div class="mm-grid">${tiles.map((t, i) => t.kind === "k" ? `<button class="mm k" data-i="${i}"><span class="glyph">${esc(t.w.k)}</span>${S.role === "kana" && showRo() && d < .7 ? `<small>${esc(t.w.r)}</small>` : ""}</button>` : `<button class="mm" data-i="${i}"><span class="mt">${esc(t.w.en)}</span></button>`).join("")}</div>`;
      $$(".mm", st).forEach(el => el.onclick = () => {
        const t = tiles[+el.dataset.i]; if (el.classList.contains("gone")) return;
        if (!sel) { sel = { t, el }; el.classList.add("sel"); SFX.tap(); return; }
        if (sel.el === el) { el.classList.remove("sel"); sel = null; return; }
        if (sel.t.kind === t.kind) { sel.el.classList.remove("sel"); sel = { t, el }; el.classList.add("sel"); SFX.tap(); return; }
        const a = sel; sel = null; a.el.classList.remove("sel");
        if (a.t.w === t.w) { a.el.classList.add("gone"); el.classList.add("gone"); SFX.good(); touchWord(t.w, true, false); say(t.w.r); left--; if (!left) { b++; setTimeout(board, 350); } }
        else { slips++; SFX.bad(); touchWord(a.t.kind === "k" ? a.t.w : t.w, false, false); [a.el, el].forEach(x => { x.classList.add("shake"); setTimeout(() => x.classList.remove("shake"), 400); }); toast(`${a.t.kind === "k" ? a.t.w.k : t.w.k} means "${(a.t.kind === "k" ? a.t.w : t.w).en}"`); drawHud(); }
      });
    }
    function finish() {
      clearInterval(iv); const ms = now() - t0; const t = fmtTime(ms); bump(); if (!slips) addStat("matchFlawless"); save(); SFX.win(); if (!slips) confetti();
      const label = `${slips ? slips + " mismatch" + (slips > 1 ? "es" : "") : "flawless"} · ${t}`;
      if (daily) setDaily("match", { score: ms, line: `💞 Meaning Match ${label}` });
      if (level) return levelResult(st, "match", level, slips === 0 ? 3 : slips <= 2 ? 2 : 1, label);
      resultScreen(st, { icon: "heartribbon", title: slips ? "All matched!" : "Perfect pairs!", score: t, lines: [`${boards * per} pairs · ${slips} mismatches`], share: daily ? `${APP_NAME} 💞 Meaning Match ${playDate()}\n${label}` : "", again: () => meaningMatch("endless"), againLabel: "Endless set" });
    }
    board();
    return () => clearInterval(iv);
  });
}
