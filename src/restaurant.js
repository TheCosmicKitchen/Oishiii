// ===== Your restaurant: cook what the garden grows, serve customers who order in Japanese, earn yen =====
// Grow → harvest → cook (dishes go into stock) → serve → yen → upgrades, or seeds back into the garden. Customers wait as
// long as you like and nothing spoils. Orders use one fixed, correct N5 pattern: dish + を + ひとつ/ふたつ + ください.
const RS = () => S.rest || (S.rest = { yen: 0, served: 0, ups: {}, fav: {}, stock: {}, name: "" });
const PRICE = { curry: 600, salad: 400, kinoko: 500, nabe: 800, corn: 300, yakiimo: 300, shortcake: 500, kakigori: 400, dango: 300 };
const SEED_PRICE = 100; // yen for one garden seed
const UPGRADES = [
  { id: "bell", e: "bellhop", en: "Counter bell", jp: "ベル", ro: "beru", cost: 300, does: "A ding for every dish served." },
  { id: "tea", e: "teahot", en: "Tea set", jp: "お{茶|ちゃ}", ro: "ocha", cost: 500, does: "Every customer also has tea: +¥50 each." },
  { id: "scroll", e: "scroll", en: "Menu scroll", jp: "メニュー", ro: "menyū", cost: 600, does: "Your menu, hung by the door." },
  { id: "lantern", e: "lantern", en: "Red lantern", jp: "ちょうちん", ro: "chōchin", cost: 800, does: "Hung outside: one more customer each service." },
  { id: "chime", e: "windchime", en: "Wind chime", jp: "ふうりん", ro: "fūrin", cost: 900, does: "A cool sound in the window." },
  { id: "pine", e: "pinedeco", en: "Pine decoration", jp: "かどまつ", ro: "kadomatsu", cost: 1200, does: "The New Year's pine and bamboo, by the entrance." },
  { id: "carp", e: "carp", en: "Carp streamers", jp: "こいのぼり", ro: "koinobori", cost: 1200, does: "Flying over the roof." },
  { id: "chair", e: "chair", en: "Extra seats", jp: "いす", ro: "isu", cost: 1500, does: "One more customer each service." },
  { id: "cat", e: "catface", en: "Lucky cat", jp: "まねきねこ", ro: "maneki neko", cost: 2000, does: "A beckoning cat for luck: tips are bigger." },
  { id: "chef", e: "cook", en: "Helper chef", jp: "コック", ro: "kokku", cost: 3000, does: "Every time you cook, you make two." },
];
const R_RANKS = [[0, "{屋台|やたい}", "yatai", "Food stall"], [20, "{食堂|しょくどう}", "shokudō", "Diner"], [60, "レストラン", "resutoran", "Restaurant"], [150, "{料亭|りょうてい}", "ryōtei", "Fine restaurant"]];
const rRank = () => { let r = 0; R_RANKS.forEach((x, i) => { if (RS().served >= x[0]) r = i; }); return r; };
const has = id => !!RS().ups[id];
const stockList = () => RECIPES.filter(r => (RS().stock[r.id] || 0) > 0);
const stockCount = () => Object.values(RS().stock).reduce((a, n) => a + n, 0);
// customers: friends who live in your garden, the sushi buds, and travellers on the road
function guests() {
  return [...FRIENDS.filter(f => G().friends[f.id]).map(f => ({ id: "f_" + f.id, e: f.e, jp: f.jp, ro: f.ro })),
    ...BUDS.map(b => ({ id: "b_" + b.id, e: b.sprites[2], jp: b.jp, ro: b.name.toLowerCase() })),
    { id: "t_boy", e: "boy", jp: "たびびと", ro: "tabibito" }, { id: "t_girl", e: "girl", jp: "たびびと", ro: "tabibito" }];
}
const favOf = gu => RECIPES[hashStr("fav" + gu.id) % RECIPES.length].id;
const QTY = [null, ["{一|ひと}つ", "hitotsu", "One"], ["{二|ふた}つ", "futatsu", "Two"]];

function viewRestaurant(v) {
  const r = RS(), rk = rRank(), nx = R_RANKS[rk + 1];
  const regs = guests();
  v.innerHTML = `
  <section class="shopfront">
    <div class="noren">${["", "", ""].map(() => `<span></span>`).join("")}</div>
    <div class="sign"><input id="rname" class="rname" value="${esc(r.name)}" placeholder="Name your restaurant" maxlength="24" aria-label="Restaurant name"><small><span class="glyph">${furiText(R_RANKS[rk][1])}</span> · ${R_RANKS[rk][3]}</small></div>
    <div class="decor">${UPGRADES.filter(u => has(u.id)).map(u => IMG(u.e)).join("") || `<span class="muted" style="font-size:.8rem">Buy upgrades below to decorate.</span>`}</div>
    <div class="row money"><span class="chip big">${IMG("yen")}<b>¥${r.yen.toLocaleString()}</b></span><span class="chip">${IMG("plate")}${r.served} served</span></div>
    ${nx ? `<div class="bar"><i style="width:${Math.min(100, (r.served - R_RANKS[rk][0]) / (nx[0] - R_RANKS[rk][0]) * 100)}%"></i></div><small class="muted">${nx[0] - r.served} more customers to become a <span class="glyph">${furiText(nx[1])}</span> (${nx[3].toLowerCase()})</small>` : `<small class="muted">The finest restaurant on the road.</small>`}
  </section>
  <section class="card stack"><header class="row">${IMGW("plate", 34)}<div style="flex:1;min-width:0"><h2>Open for business</h2><p class="muted" style="font-size:.8rem">Customers order in Japanese. Read the order, then serve the right dish. They'll wait as long as you need.</p></div></header>
    <div class="stockrow">${stockList().map(d => `<span class="pchip">${IMG(d.e)}<b>×${r.stock[d.id]}</b></span>`).join("") || `<span class="muted" style="font-size:.82rem">No dishes ready. Cook something in the kitchen below.</span>`}</div>
    <button class="btn pink" id="ropen" ${stockCount() ? "" : "disabled"}>${IMG("bellhop")}いらっしゃいませ！ Open the doors</button></section>
  ${kitchenHTML()}
  <section class="card stack"><header class="row">${IMGW("store", 34)}<div style="flex:1;min-width:0"><h2>Upgrades</h2><p class="muted" style="font-size:.8rem">Spend your yen on the restaurant. Everything you buy stays.</p></div></header>
    <div class="upgrades">${UPGRADES.map(u => `<button class="upg ${has(u.id) ? "got" : ""}" data-up="${u.id}" ${has(u.id) ? "disabled" : ""}>${IMGW(u.e, 40)}<div><b>${esc(u.en)}</b> <span class="glyph" style="font-size:.85rem">${furiText(u.jp)}</span>${showRo() ? ` <span class="ro">${esc(u.ro)}</span>` : ""}<small>${esc(u.does)}</small></div><span class="pill ${has(u.id) ? "done" : r.yen >= u.cost ? "pink" : ""}">${has(u.id) ? "yours" : "¥" + u.cost.toLocaleString()}</span></button>`).join("")}</div></section>
  <section class="card stack"><header class="row">${IMGW("seedling", 34)}<div style="flex:1;min-width:0"><h2>Back to the garden</h2><p class="muted" style="font-size:.8rem">Buy seeds for your garden with your takings: ¥${SEED_PRICE} each.</p></div></header>
    <div class="row"><button class="btn ghost small" data-seeds="1" ${r.yen >= SEED_PRICE ? "" : "disabled"}>+1 seed</button><button class="btn ghost small" data-seeds="5" ${r.yen >= SEED_PRICE * 5 ? "" : "disabled"}>+5 seeds</button><button class="btn ghost small" data-seeds="20" ${r.yen >= SEED_PRICE * 20 ? "" : "disabled"}>+20 seeds</button></div></section>
  <section class="card stack"><header class="row"><h2>Regulars</h2><span class="spacer"></span><span class="pill pink">${regs.filter(g => r.fav[g.id]).length}/${regs.length}</span></header>
    <p class="muted" style="font-size:.82rem">Everyone has a favourite dish. Serve it to them to find out what it is. Garden friends start coming once they move in.</p>
    <div class="friendgrid">${regs.map(g => { const f = r.fav[g.id] && RECIPES.find(x => x.id === favOf(g));
      return `<div class="friendc ${f ? "got" : ""}">${IMG(g.e)}<small><span class="gjp">${esc(g.jp)}</span>${showRo() ? ` <span class="ro">${esc(g.ro)}</span>` : ""}</small><small>${f ? `${IMG(f.e)} loves it` : "favourite: ?"}</small></div>`; }).join("")}</div></section>`;
  bindKitchen(v, () => viewGarden($("#view")));
  $("#rname", v).onchange = e => { r.name = e.target.value.trim().slice(0, 24); save(); };
  $("#ropen", v).onclick = openService;
  $$("[data-up]", v).forEach(b => b.onclick = () => {
    const u = UPGRADES.find(x => x.id === b.dataset.up); if (r.yen < u.cost) { toast(`You need ¥${(u.cost - r.yen).toLocaleString()} more.`); SFX.bad(); return; }
    r.yen -= u.cost; r.ups[u.id] = todayKey(); save(); SFX.win(); confetti(18); toast(`${u.en} is yours!`); viewGarden($("#view"));
  });
  $$("[data-seeds]", v).forEach(b => b.onclick = () => {
    const n = +b.dataset.seeds; if (r.yen < n * SEED_PRICE) return; r.yen -= n * SEED_PRICE; G().bonus += n; save(); SFX.pop(); toast(`+${n} seed${n > 1 ? "s" : ""} for the garden`); viewGarden($("#view"));
  });
}

function openService() {
  const r = RS(); const pool = guests(); const n = 3 + (has("lantern") ? 1 : 0) + (has("chair") ? 1 : 0);
  const line = RND.shuffle(pool).slice(0, n);
  let k = 0, earned = 0, served = 0;
  openPlay("Open for business", (st, hud) => {
    const next = () => {
      const gu = line[k], menu = stockList();
      if (!gu || !menu.length) return finish(!menu.length && gu);
      const fav = favOf(gu); const dish = menu.find(d => d.id === fav && RND.f() < .4) || RND.pick(menu);
      const qty = (r.stock[dish.id] || 0) >= 2 && RND.f() < .35 ? 2 : 1;
      let firstTry = true;
      hud.innerHTML = `<span class="pill">${k + 1}/${line.length}</span><span class="pill">¥${earned.toLocaleString()}</span>`;
      st.innerHTML = `<div class="card stack service"><div class="guest">${IMGW(gu.e, 84)}<div><span class="gjp">${esc(gu.jp)}</span>${showRo() ? ` <span class="ro">${esc(gu.ro)}</span>` : ""}</div></div>
        <div class="order"><p class="glyph">${furiText(RECIPES.find(x => x.id === dish.id).jp)}を${furiText(QTY[qty][0])}ください。</p>${showRo() ? `<p class="ro">${esc(dish.ro)} o ${QTY[qty][1]} kudasai</p>` : ""}<button class="gen" id="oen">Tap for English</button></div>
        <span class="eyebrow">Serve</span><div class="serve">${menu.map(d => `<button class="sdish" data-d="${d.id}">${IMGW(d.e, 40)}<small class="glyph">${furiText(d.jp)}</small><b>×${r.stock[d.id]}</b></button>`).join("")}</div><div id="sfb"></div></div>`;
      $("#oen", st).onclick = e => { e.target.textContent = `"${QTY[qty][2]} ${dish.en.toLowerCase()}, please."`; e.target.classList.add("shown"); };
      say(`${dish.jp.replace(/\{([^|}]+)\|([^}]+)\}/g, "$2")}を${qty === 1 ? "ひとつ" : "ふたつ"}ください`);
      $$("[data-d]", st).forEach(b => b.onclick = () => {
        if (b.dataset.d !== dish.id) { firstTry = false; SFX.bad(); b.classList.add("wrong"); setTimeout(() => b.classList.remove("wrong"), 500); $("#sfb", st).innerHTML = `<p class="gfeed no">「ちがいます…」 <small class="muted">That's not it. Read the order again.</small></p>`; return; }
        if ((r.stock[dish.id] || 0) < qty) return;
        r.stock[dish.id] -= qty; const isFav = dish.id === fav;
        const base = PRICE[dish.id] * qty, tea = has("tea") ? 50 : 0, tip = firstTry ? Math.round(base * (has("cat") ? .2 : .1)) * (isFav ? 2 : 1) : 0;
        const pay = base + tea + tip; r.yen += pay; earned += pay; served++; r.served++;
        const found = isFav && !r.fav[gu.id]; if (isFav) r.fav[gu.id] = r.fav[gu.id] || todayKey();
        save(); has("bell") ? tone([1568, 2093], .25, "sine", .05) : SFX.good();
        $$("[data-d]", st).forEach(x => x.disabled = true);
        $("#sfb", st).innerHTML = `<div class="gfeed ok"><b>「${isFav ? "{大好|だいす}き！".replace(/\{([^|}]+)\|([^}]+)\}/g, (m, kk, rr) => canRead(kk) ? kk : rr) : "ありがとう！"} おいしい！」</b><span>+¥${pay.toLocaleString()}${tip ? ` (tip ¥${tip})` : ""}${tea ? `, tea ¥${tea}` : ""}</span>${found ? `<span>${IMG(dish.e)} You found out ${esc(gu.jp)}'s favourite!</span>` : ""}<button class="btn" id="snext">${k + 1 < line.length ? "Next customer →" : "Close up"}</button></div>`;
        if (isFav) confetti(16);
        $("#snext", st).onclick = () => { k++; next(); };
      });
    };
    const finish = soldOut => {
      save(); SFX.win(); setTimeout(() => holdCelebrations(false), 400);
      st.innerHTML = `<div class="card result pop">${IMGW("yen", 80)}<h2>${soldOut ? "Sold out!" : "That's a wrap"}</h2><div class="score">¥${earned.toLocaleString()}</div><p>${served} customer${served === 1 ? "" : "s"} served${soldOut ? ". Cook more to keep going." : "."}</p><div class="row" style="justify-content:center"><button class="btn" id="sdone">Back</button></div></div>`;
      $("#sdone", st).onclick = () => closePlay();
    };
    next();
  });
}

TROPHIES.push(
  { id: "r_first", group: "Garden", name: "Open for Business", icon: "bellhop", desc: "Serve your first customer.", test: () => RS().served >= 1 },
  { id: "r_50", group: "Garden", name: "Popular Spot", icon: "plate", desc: "Serve 50 customers.", test: () => RS().served >= 50 },
  { id: "r_ryotei", group: "Garden", name: "Fine Dining", icon: "crown", gold: true, desc: "Grow your restaurant into a ryōtei.", test: () => RS().served >= R_RANKS[3][0] },
  { id: "r_ups", group: "Garden", name: "Fully Furnished", icon: "catface", desc: "Buy every restaurant upgrade.", test: () => UPGRADES.every(u => has(u.id)) },
  { id: "r_favs", group: "Garden", name: "I Know Your Order", icon: "heartribbon", desc: "Find six regulars' favourite dishes.", test: () => Object.keys(RS().fav).length >= 6 },
);
