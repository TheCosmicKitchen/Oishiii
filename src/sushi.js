// ===== Sushi Belt =====
const BUD_THEMES = { mame: ["nature", "colors"], piyo: ["animals", "people"], kinoko: ["food", "things"] };
const TIERS = [{ yen: 100, c: "#8FC3E6", p: .5 }, { yen: 150, c: "#F09AB4", p: .25 }, { yen: 200, c: "#93CB88", p: .17 }, { yen: 500, c: "#E8B53A", p: .08, gold: true }];
const budSprite = b => b.sprites[Math.min(2, Math.floor((bud(b.id).lvl - 1) / 3))];
const faceOf = w => S.role === "kanji" ? w.k : w.r;

function viewSushi(v) {
  const rec = dailyRec("sushi");
  v.innerHTML = `
  <section class="card stack" style="background:linear-gradient(180deg,var(--sakura-soft),var(--surface))">
    <div class="row">${IMGW("sushi", 64)}<div style="flex:1;min-width:0"><h2>Sushi Belt</h2><p class="muted" style="font-size:.85rem">いらっしゃいませ！ (irasshaimase, "welcome!") Your buds are hungry. Feed each one the plate it's thinking of before it gets grumpy.</p></div></div>
    <div class="counter" style="pointer-events:none">${BUDS.map(b => `<div class="seat"><span class="lv">Lv ${bud(b.id).lvl}</span>${IMG(budSprite(b)).replace('class="em"', 'class="em budimg"')}<span class="name">${b.name}</span><span class="ro">loves ${b.likes}</span></div>`).join("")}</div>
    <div class="row"><button class="btn pink" id="endless">${IMG("chopsticks")}Open the counter</button><button class="btn ghost" id="sushilv">${IMG("star")}Levels ${lvTotal("sushi")}/${LEVELS_N * 3}</button><span class="muted" style="font-size:.8rem">Best: ¥${(S.best.sushi || 0).toLocaleString()}</span></div>
  </section>
  <section class="card stack"><div class="row">${IMGW("calendar", 40)}<div style="flex:1;min-width:0"><h3>Chef's Special</h3><p class="muted" style="font-size:.82rem">Today's 90-second run. Same plates for both of you, so compare your yen.</p></div>${rec ? `<span class="pill done">¥${rec.score.toLocaleString()}</span>` : ""}</div>
    <div class="row"><button class="btn" id="daily">${rec ? "Play again (practice)" : "Play today's special"}</button></div></section>
  <section class="card stack"><h3>How it works</h3>
    <p style="font-size:.88rem">${S.role === "kanji" ? "You're the <b>Kanji reader</b>: buds think in pictures and English, plates show bare kanji. Look-alike decoys will try to trick you (牛 vs 午!)." : "You're the <b>Kana speller</b>: buds think in pictures and romaji, plates show kana. Watch for look-alikes like ぬ and め."} Switch roles in the Book tab.</p>
    <p style="font-size:.88rem">Plate colors set the price: blue ¥100, pink ¥150, green ¥200, and rare gold ¥500. Serving several right in a row builds a combo that multiplies your yen. Buds level up as they eat, and at level 3 they start ordering two-kanji words.</p></section>`;
  $("#endless").onclick = () => startSushi("endless");
  $("#sushilv").onclick = () => openLevels("sushi");
  $("#daily").onclick = () => startSushi(rec ? "practice" : "daily");
}

function startSushi(mode) {
  const level = /^L\d+$/.test(mode) ? +mode.slice(1) : null;
  const dateMode = mode === "daily" ? todayKey() : /^D\d{4}-/.test(mode) ? mode.slice(1) : null; PLAY_DATE = dateMode;
  openPlay(mode === "endless" ? "Sushi Belt" : level ? `Sushi Lv ${level}` : "Chef's Special", (st, hud) => {
    const rng = mode === "endless" ? RND : level ? makeRng("level:sushi:" + level) : makeRng((dateMode || todayKey()) + ":sushi");
    const timed = mode !== "endless"; const LIMIT = 90000;
    st.innerHTML = `<div class="sushi-wrap"><div class="belt moving" id="belt"></div><div class="counter" id="counter">${BUDS.map((b, i) => `<div class="seat" data-drop="${i}" id="seat${i}"></div>`).join("")}</div><p class="sushitip">Drag a plate to the bud who wants it, or tap the plate, then tap the bud.</p></div>`;
    const belt = $("#belt", st);
    let yen = 0, combo = 0, bestCombo = 0, hearts = 3, served = 0, elapsed = 0, last = 0, raf = 0, over = false, plateId = 0, paused = false;
    const missed = new Map(); const newStamps = []; const plates = []; const seats = BUDS.map(() => ({ order: null, wait: 0, msg: "", msgT: 0 }));
    const poolFor = b => UNIQUE_WORDS.filter(w => BUD_THEMES[b.id].includes(w.t) && ([...w.k].length === 1 || bud(b.id).lvl >= 3) && (S.role === "kanji" || w.r.length <= 5));
    function newOrder(i) {
      const b = BUDS[i]; const active = new Set(seats.map(s => s.order && faceOf(s.order.w)));
      const pool = poolFor(b).filter(w => !active.has(faceOf(w)));
      const wt = w => { const s = wordState(w); return 1 + Math.max(0, 6 - (s ? s.pts : 0)) + (s ? s.miss * 2 : 0); };
      let tot = pool.reduce((a, w) => a + wt(w), 0), r = rng.f() * tot, pick = pool[0];
      for (const w of pool) { r -= wt(w); if (r <= 0) { pick = w; break; } }
      const max = Math.max(7000, 17000 - elapsed / 10 - (level ? (level - 1) * 600 : 0));
      seats[i].order = { w: pick, t: max, max }; drawSeat(i);
    }
    function drawSeat(i, anim) {
      const b = BUDS[i], s = seats[i], el = $("#seat" + i, st), o = s.order; const bs = bud(b.id);
      let bubble;
      if (s.msg) bubble = `<div class="glyph" style="font-size:1.3rem">${s.msg}</div><div class="ro">${s.msgRo || ""}</div>`;
      else if (o) bubble = `${IMG(o.w.e)}${S.role === "kana" && showRo() ? `<div class="wro">${esc(o.w.ro)}</div>` : ""}<div class="want">${esc(o.w.en)}</div>`;
      else bubble = `<div class="muted">…</div>`;
      el.innerHTML = `<span class="lv">Lv ${bs.lvl}</span><div class="bubble">${bubble}</div><div class="patience"><i></i></div>${IMG(budSprite(b)).replace('class="em"', 'class="em budimg"')}<span class="name">${b.name}</span>`;
      if (anim) { el.classList.remove("bounce", "shake"); void el.offsetWidth; el.classList.add(anim); }
    }
    function spawnPlate() {
      const W = belt.clientWidth; const open = seats.filter(s => s.order).map(s => s.order.w);
      let w = null, face;
      const onBelt = f => plates.filter(p => p.face === f).length;
      if (open.length && rng.f() < .6) { const sorted = [...open].sort((a, b) => onBelt(faceOf(a)) - onBelt(faceOf(b))); w = sorted[0]; face = faceOf(w); }
      else if (open.length && rng.f() < .65) { // decoy based on an open order
        const base = rng.pick(open);
        if (S.role === "kanji") { const la = LOOKALIKE_KANJI[base.k]; face = la ? rng.pick(la) : rng.pick(UNIQUE_WORDS).k; }
        else { const ch = [...base.r]; const idx = ch.map((c, j) => LOOKALIKE_KANA[c] ? j : -1).filter(j => j >= 0); if (idx.length) { const j = rng.pick(idx); ch[j] = LOOKALIKE_KANA[ch[j]]; face = ch.join(""); } else face = rng.pick(UNIQUE_WORDS).r; }
      } else { w = rng.pick(UNIQUE_WORDS.filter(x => [...x.k].length === 1)); face = faceOf(w); }
      let r = rng.f(), tier = TIERS[0]; for (const t of TIERS) { r -= t.p; if (r <= 0) { tier = t; break; } }
      const el = document.createElement("button"); const id = "p" + (plateId++);
      const len = [...face].length;
      el.className = "plate" + (tier.gold ? " gold" : "") + (len >= 4 ? " tiny" : len >= 3 || (S.role === "kanji" && len >= 2) ? " small" : "");
      el.style.setProperty("--pc", tier.c); el.dataset.pick = id; el.setAttribute("aria-label", "plate " + face);
      el.innerHTML = `<span class="glyph">${esc(face)}</span>`;
      belt.appendChild(el);
      plates.push({ id, face, tier, x: W + 10, el });
    }
    function serve(pid, seatIdx) {
      const p = plates.find(x => x.id === pid); const s = seats[seatIdx]; if (!p || !s || !s.order || over) return;
      const want = s.order.w; const b = BUDS[seatIdx];
      if (p.face === faceOf(want)) {
        combo++; bestCombo = Math.max(bestCombo, combo); statMax("maxCombo", combo); if (p.tier.gold) addStat("golds"); served++; S.served = (S.served || 0) + 1;
        const mult = 1 + Math.min(4, Math.floor(combo / 4)) * .25; const gain = Math.round(p.tier.yen * mult); yen += gain;
        p.el.remove(); plates.splice(plates.indexOf(p), 1);
        if (touchWord(want, true, true)) { newStamps.push(want); toast(`New stamp: ${want.k}!`); }
        const bs = bud(b.id); bs.xp++; const need = 4 + bs.lvl * 2; if (bs.xp >= need) { bs.xp = 0; bs.lvl++; toast(`${b.name} grew to level ${bs.lvl}!`); SFX.win(); confetti(16); }
        s.msg = rng.f() < .5 ? "おいしい！" : "うまい！"; s.msgRo = (s.msg === "おいしい！" ? "oishii! " : "umai! ") + `· ${want.k} ${want.r}`; s.msgT = 1100; s.order = null; drawSeat(seatIdx, "bounce");
        const f = document.createElement("div"); f.className = "floaty"; f.textContent = "+¥" + gain + (mult > 1 ? ` ×${mult}` : ""); $("#seat" + seatIdx, st).appendChild(f); setTimeout(() => f.remove(), 1000);
        SFX.good(); say(want.r); drawHud();
      } else {
        combo = 0; s.order.t -= s.order.max * .25; touchWord(want, false, false); missed.set(wkey(want), want);
        s.msg = "ちがう…"; s.msgRo = "chigau… not this one"; s.msgT = 900; drawSeat(seatIdx, "shake"); SFX.bad(); drawHud();
      }
      save();
    }
    function drawHud() {
      hud.innerHTML = `<span class="chip">${IMG("coin")}¥${yen.toLocaleString()}</span>${combo >= 3 ? `<span class="chip">${IMG("fireflame")}${combo}</span>` : ""}${timed ? `<span class="chip">${IMG("hourglass")}${Math.max(0, Math.ceil((LIMIT - elapsed) / 1000))}</span>` : ""}<span class="hearts">${[0, 1, 2].map(i => IMG("heart").replace('class="em"', `class="em ${i < hearts ? "" : "gone"}"`)).join("")}</span>`;
    }
    function end() {
      over = true; cancelAnimationFrame(raf); belt.classList.remove("moving");
      if (dateMode) setDaily("sushi", { score: yen, line: `🍣 Chef's Special ¥${yen.toLocaleString()} · ${served} plates` });
      if (yen > (S.best.sushi || 0)) S.best.sushi = yen; save();
      SFX.win(); if (served >= 10) confetti();
      const miss = [...missed.values()].slice(0, 8);
      if (level) { const tg = 900 + 250 * (level - 1); levelResult(st, "sushi", level, yen >= tg * 2 ? 3 : yen >= tg * 1.5 ? 2 : yen >= tg ? 1 : 0, "¥" + yen.toLocaleString()); } else resultScreen(st, { icon: served >= 15 ? "crown" : "sushi", title: served >= 15 ? "Five-star counter!" : "Counter closed", score: `¥${yen.toLocaleString()}`,
        lines: [`${served} plates served · best combo ${bestCombo}`, miss.length ? `<span class="muted">Review these:</span><br>${miss.map(w => `<span class="glyph">${esc(w.k)}</span> ${esc(w.r)} <span class="ro">${esc(w.ro)} · ${esc(w.en)}</span>`).join("<br>")}` : "No mix-ups. Your buds are very full."],
        share: timed ? `${APP_NAME} 🍣 Chef's Special ${playDate()}\n¥${yen.toLocaleString()} · ${served} plates · combo ${bestCombo}\n${"🍣".repeat(Math.min(10, Math.ceil(served / 3)))}` : "",
        again: () => startSushi(dateMode ? "practice" : mode) });
      setTimeout(() => newStamps.forEach(stampNow), 600);
    }
    function frame(t) {
      if (over) return; if (!last) last = t; let dt = Math.min(60, t - last); last = t; if (paused) dt = 0;
      elapsed += dt;
      const speed = Math.min(150, 48 + (level ? (level - 1) * 7 : 0) + elapsed / 1000 * 0.9);
      const W = belt.clientWidth;
      plates.forEach(p => { p.x -= speed * dt / 1000; p.el.style.transform = `translateX(${p.x}px)`; });
      for (let i = plates.length - 1; i >= 0; i--) if (plates[i].x < -100) { if (DND.sel === plates[i].id) DND.sel = null; plates[i].el.remove(); plates.splice(i, 1); }
      const lastP = plates[plates.length - 1]; if (!lastP || lastP.x < W - 108) spawnPlate();
      seats.forEach((s, i) => {
        if (s.msg) { s.msgT -= dt; if (s.msgT <= 0) { s.msg = ""; if (!s.order) newOrder(i); else drawSeat(i); } return; }
        if (!s.order) return newOrder(i);
        s.order.t -= dt; const bar = $("#seat" + i + " .patience i", st); if (bar) { const f = Math.max(0, s.order.t / s.order.max); bar.style.width = f * 100 + "%"; bar.classList.toggle("low", f < .3); }
        if (s.order.t <= 0) { hearts--; combo = 0; missed.set(wkey(s.order.w), s.order.w); touchWord(s.order.w, false, false); s.msg = "もう…"; s.msgRo = `mou… wanted ${s.order.w.k} ${s.order.w.r}`; s.msgT = 1500; s.order = null; drawSeat(i, "shake"); SFX.bad(); drawHud(); if (hearts <= 0) return end(); }
      });
      if (over) return;
      if (timed) { if (elapsed >= LIMIT) return end(); if (Math.floor(elapsed / 1000) !== Math.floor((elapsed - dt) / 1000)) drawHud(); }
      raf = requestAnimationFrame(frame);
    }
    DND.onDrop = (pid, seat) => serve(pid, +seat);
    const vis = () => { paused = document.hidden; };
    document.addEventListener("visibilitychange", vis);
    seats.forEach((_, i) => newOrder(i)); drawHud(); raf = requestAnimationFrame(frame);
    return () => { over = true; cancelAnimationFrame(raf); document.removeEventListener("visibilitychange", vis); save(); };
  });
}
