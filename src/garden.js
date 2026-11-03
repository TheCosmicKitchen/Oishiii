// ===== Garden: trade stamps in for seeds, buy plants and decor, grow them, and meet the friends who move in =====
// Stamps are never spent. Each stamp pays out seeds once, when you trade it in, and stays in the book.
const SEED_PAY = { kanji: 1, station: 3, city: 5 }; // a city stamp pays its station seeds plus the city bonus
const GARDEN_COLS = 6, GARDEN_ROWS0 = 4;
const LAND_COST = [10, 20, 35, 50]; // each buys one more row of plots
const GARDEN_ROWS_MAX = GARDEN_ROWS0 + LAND_COST.length;
const SHOP_CATS = [{ id: "flower", name: "Flowers", icon: "tulip" }, { id: "veg", name: "Veggies", icon: "carrot" }, { id: "tree", name: "Trees", icon: "tree" }, { id: "decor", name: "Decor", icon: "lantern" }];
// id, emoji, English, Japanese, romaji, kanji word (shown only once every kanji in it is stamped), shop, price, seeds traded in to unlock, stages to grow (0 = decor)
const SHOP = [
  ["clover", "clover", "Clover", "クローバー", "kurōbā", "", "flower", 2, 0, 1],
  ["tulip", "tulip", "Tulip", "チューリップ", "chūrippu", "", "flower", 3, 0, 2],
  ["blossom", "blossom", "Flower", "はな", "hana", "花", "flower", 4, 0, 2],
  ["sunflower", "sunflower", "Sunflower", "ひまわり", "himawari", "", "flower", 5, 10, 3],
  ["rose", "rose", "Rose", "ばら", "bara", "", "flower", 6, 25, 3],
  ["hibiscus", "hibiscus", "Hibiscus", "ハイビスカス", "haibisukasu", "", "flower", 8, 45, 3],
  ["lotus", "lotus", "Lotus", "はす", "hasu", "", "flower", 10, 80, 3],
  ["herb", "herb", "Herbs", "ハーブ", "hābu", "", "veg", 2, 0, 1],
  ["carrot", "carrot", "Carrot", "にんじん", "ninjin", "", "veg", 3, 0, 2],
  ["mushroom", "mushroom", "Mushroom", "きのこ", "kinoko", "", "veg", 3, 10, 1],
  ["eggplant", "eggplant", "Eggplant", "なす", "nasu", "", "veg", 4, 15, 2],
  ["strawberry", "strawberry", "Strawberry", "いちご", "ichigo", "", "veg", 4, 20, 2],
  ["corn", "corn", "Corn", "とうもろこし", "tōmorokoshi", "", "veg", 5, 30, 3],
  ["pepper", "pepper", "Green pepper", "ピーマン", "pīman", "", "veg", 5, 45, 2],
  ["melon", "melon", "Watermelon", "すいか", "suika", "", "veg", 8, 70, 3],
  ["tree", "tree", "Tree", "き", "ki", "木", "tree", 10, 20, 4],
  ["cactus", "cactus", "Cactus", "サボテン", "saboten", "", "tree", 6, 35, 2],
  ["evergreen", "evergreen", "Pine", "まつ", "matsu", "松", "tree", 12, 50, 4],
  ["sakura", "sakura", "Cherry tree", "さくら", "sakura", "桜", "tree", 15, 60, 4],
  ["maple", "maple", "Maple", "もみじ", "momiji", "紅葉", "tree", 12, 90, 4],
  ["bamboo", "bamboo", "Bamboo", "たけ", "take", "竹", "tree", 14, 120, 4],
  ["palm", "palm", "Palm tree", "やしのき", "yashi no ki", "", "tree", 15, 150, 4],
  ["rock", "rock", "Rock", "いし", "ishi", "石", "decor", 2, 0, 0],
  ["wood", "wood", "Log", "まき", "maki", "", "decor", 3, 5, 0],
  ["lantern", "lantern", "Lantern", "ちょうちん", "chōchin", "", "decor", 6, 15, 0],
  ["umbrella", "umbrella", "Parasol", "かさ", "kasa", "傘", "decor", 5, 25, 0],
  ["teapot", "teapot", "Teapot", "きゅうす", "kyūsu", "", "decor", 6, 40, 0],
  ["fountain", "fountain", "Fountain", "ふんすい", "funsui", "噴水", "decor", 20, 60, 0],
  ["hut", "hut", "Hut", "こや", "koya", "小屋", "decor", 30, 100, 0],
  ["house", "house", "House", "いえ", "ie", "家", "decor", 50, 200, 0],
  ["rainbow", "rainbow", "Rainbow", "にじ", "niji", "虹", "decor", 40, 250, 0],
  ["onsen", "onsen", "Hot spring", "おんせん", "onsen", "温泉", "decor", 60, 300, 0],
  ["shrine", "japan", "Shrine", "じんじゃ", "jinja", "神社", "decor", 80, 400, 0],
].map(([id, e, en, jp, ro, k, cat, cost, at, grow]) => ({ id, e, en, jp, ro, k, cat, cost, at, grow }));
const SHOP_BY = Object.fromEntries(SHOP.map(x => [x.id, x]));

// ---- state: S.garden = { cashed, spent, shed: [{id, g}], plots: {cell: {id, g}}, rows, friends: {id: date} }
const G = () => S.garden || (S.garden = { cashed: 0, spent: 0, shed: [], plots: {}, rows: GARDEN_ROWS0, friends: {} });
const seedsEarned = () => foundCount() * SEED_PAY.kanji + ALL_SUBS.filter(visited).length * SEED_PAY.station + CITY_SUBS.filter(visited).length * SEED_PAY.city;
const seedsPending = () => Math.max(0, seedsEarned() - G().cashed);
const seeds = () => G().cashed - G().spent;
const isGrown = p => { const it = SHOP_BY[p.id]; return !!it.grow && p.g >= it.grow; };
const plotList = () => Object.values(G().plots);
const grown = id => plotList().filter(p => p.id === id && isGrown(p)).length;
const grownIn = cat => plotList().filter(p => SHOP_BY[p.id].cat === cat && isGrown(p)).length;
const grownAll = () => plotList().filter(isGrown).length;
const placed = id => plotList().filter(p => p.id === id).length;
const growing = () => Object.entries(G().plots).filter(([, p]) => SHOP_BY[p.id].grow && !isGrown(p));
const sunnyCost = () => Math.max(2, Math.ceil(growing().length * .6));
const landCost = () => LAND_COST[G().rows - GARDEN_ROWS0];

// ---- friends move in by themselves once the garden suits them, and stay
const FRIENDS = [
  { id: "bird", e: "bird", jp: "ことり", ro: "kotori", hint: "Grow a tree", test: () => grownIn("tree") >= 1 },
  { id: "butterfly", e: "butterfly", jp: "ちょうちょ", ro: "chōcho", hint: "Grow 3 flowers", test: () => grownIn("flower") >= 3 },
  { id: "bee", e: "bee", jp: "みつばち", ro: "mitsubachi", hint: "Grow a sunflower", test: () => grown("sunflower") >= 1 },
  { id: "rabbit", e: "rabbit", jp: "うさぎ", ro: "usagi", hint: "Grow 2 carrots", test: () => grown("carrot") >= 2 },
  { id: "ladybug", e: "ladybug", jp: "てんとうむし", ro: "tentōmushi", hint: "Grow 6 plants", test: () => grownAll() >= 6 },
  { id: "snail", e: "snail", jp: "かたつむり", ro: "katatsumuri", hint: "Grow 4 veggies", test: () => grownIn("veg") >= 4 },
  { id: "hedgehog", e: "hedgehog", jp: "はりねずみ", ro: "harinezumi", hint: "Grow 3 mushrooms", test: () => grown("mushroom") >= 3 },
  { id: "duck", e: "duck", jp: "あひる", ro: "ahiru", hint: "Put in a fountain", test: () => placed("fountain") >= 1 },
  { id: "frog", e: "frog", jp: "かえる", ro: "kaeru", hint: "Grow a lotus", test: () => grown("lotus") >= 1 },
  { id: "cat", e: "cat", jp: "ねこ", ro: "neko", hint: "Build a hut", test: () => placed("hut") >= 1 },
  { id: "owl", e: "owl", jp: "ふくろう", ro: "fukurō", hint: "Grow 3 trees", test: () => grownIn("tree") >= 3 },
  { id: "turtle", e: "turtle", jp: "かめ", ro: "kame", hint: "Fill every plot of a fully cleared garden", test: () => G().rows >= GARDEN_ROWS_MAX && plotList().length >= GARDEN_ROWS_MAX * GARDEN_COLS },
];
const friendCount = () => FRIENDS.filter(f => G().friends[f.id]).length;
function checkFriends() {
  let any = false;
  for (const f of FRIENDS) if (!G().friends[f.id] && f.test()) { G().friends[f.id] = todayKey(); CELEB_Q.push({ kind: "friend", f }); any = true; }
  if (any) { save(); nextCeleb(); }
}

TROPHIES.push(
  { id: "g_plant", group: "Garden", name: "First Planting", icon: "seedling", desc: "Plant something in your garden.", test: () => plotList().length >= 1 },
  { id: "g_bloom", group: "Garden", name: "In Full Bloom", icon: "tulip", desc: "Grow a plant all the way.", test: () => grownAll() >= 1 },
  { id: "g_green", group: "Garden", name: "Green Thumb", icon: "herb", desc: "Have 20 fully grown plants.", test: () => grownAll() >= 20 },
  { id: "g_land", group: "Garden", name: "Wide Open Fields", icon: "sunrise", desc: "Clear all the land.", test: () => G().rows >= GARDEN_ROWS_MAX },
  { id: "g_friends", group: "Garden", name: "Good Neighbours", icon: "rabbit", desc: "Six garden friends move in.", test: () => friendCount() >= 6 },
  { id: "g_all", group: "Garden", name: "Everyone's Home", icon: "hut", gold: true, desc: "Every garden friend moves in.", test: () => friendCount() >= FRIENDS.length },
);

// ---- labels: kanji only once stamped, otherwise English; Japanese with romaji
const itemName = it => it.k && canRead(it.k) ? `<span class="glyph">${esc(it.k)}</span> <small>${esc(it.en)}</small>` : esc(it.en);
const jpLine = x => `<span class="gjp">${esc(x.jp)}</span>${showRo() ? ` <span class="ro">${esc(x.ro)}</span>` : ""}`;
const stageEmoji = p => { const it = SHOP_BY[p.id]; return it.grow && p.g === 0 ? "seedling" : it.e; };
const stageScale = p => { const it = SHOP_BY[p.id]; return !it.grow || isGrown(p) ? 1 : .5 + .4 * p.g / it.grow; };

// ---------- GARDEN TAB ----------
let GARDEN_CAT = "flower", GARDEN_ACT = null;
function viewGarden(v) {
  const g = G(); checkFriends();
  const pend = seedsPending(), cells = g.rows * GARDEN_COLS;
  const used = new Set(); const spots = FRIENDS.filter(f => g.friends[f.id]).map(f => { let c = hashStr(f.id + todayKey()) % cells; while (used.has(c) && used.size < cells) c = (c + 1) % cells; used.add(c); return { f, c }; });
  const nextLock = SHOP.filter(it => it.at > g.cashed).sort((a, b) => a.at - b.at)[0];
  v.innerHTML = `
  <section class="hello gardenhello">${IMGW("watering", 54)}<div class="stack" style="gap:6px;flex:1;min-width:0">
    <h2>Your garden</h2><p class="muted" style="font-size:.85rem">Trade in your stamps for seeds, then spend them on plants and decor. Your stamps stay in your book.</p>
    <div class="row seedbank"><span class="chip big" title="Seeds to spend">${IMG("seedling")}<b id="seedn">${seeds()}</b> seeds</span>
      ${pend ? `<button class="btn pink" id="tradein">${IMG("lantern")}Trade in for +${pend}</button>` : `<span class="muted" style="font-size:.8rem">Clear stops to earn more stamps.</span>`}</div>
    <p class="help">Each kanji stamp is worth ${SEED_PAY.kanji} seed, each station stamp ${SEED_PAY.station}, and each city stamp ${SEED_PAY.station + SEED_PAY.city}.</p></div></section>
  <section class="card stack">
    <header class="row"><h2>The garden</h2><span class="spacer"></span><span class="pill pink">${grownAll()} grown</span></header>
    <div class="gwrap" style="--rows:${g.rows}"><div class="ggrid">${Array.from({ length: cells }, (_, i) => plotHTML(i)).join("")}</div>
      ${spots.map(({ f, c }, n) => `<span class="gfriend" style="--col:${c % GARDEN_COLS};--row:${Math.floor(c / GARDEN_COLS)};animation-delay:${n * .37}s" aria-hidden="true">${IMG(f.e)}</span>`).join("")}</div>
    <div id="gact" class="gact" aria-live="polite">${GARDEN_ACT != null && g.plots[GARDEN_ACT] ? actHTML(GARDEN_ACT) : `<p class="muted" style="font-size:.82rem">${g.shed.length ? "Tap something in your shed, then tap an empty plot. Drag plants around to rearrange." : plotList().length ? "Tap a plant to water it or move it." : "Buy something in the shop below to get started."}</p>`}</div>
    ${growing().length > 1 ? `<button class="btn ghost" id="sunny">${IMG("sun")}Sunny day: everything grows a stage · ${sunnyCost()} seeds</button>` : ""}
    ${g.rows < GARDEN_ROWS_MAX ? `<button class="btn ghost small" id="land">${IMG("sunrise")}Clear more land: ${GARDEN_COLS} more plots · ${landCost()} seeds</button>` : ""}
  </section>
  <section class="card stack"><header class="row">${IMGW("basket", 30)}<h3>Your shed</h3><span class="spacer"></span><span class="pill">${g.shed.length}</span></header>
    ${g.shed.length ? `<div class="shed">${g.shed.map((p, i) => `<button class="shedi" data-pick="shed:${i}" aria-label="${esc(SHOP_BY[p.id].en)}">${IMG(SHOP_BY[p.id].e)}${SHOP_BY[p.id].grow && !isGrown(p) ? `<i class="shedseed">${IMG("seedling")}</i>` : ""}</button>`).join("")}</div>` : `<p class="muted" style="font-size:.82rem">Things you buy wait here until you plant them.</p>`}</section>
  <section class="card stack"><header class="row">${IMGW("store", 34)}<div style="flex:1;min-width:0"><h2>Garden shop</h2><p class="muted" style="font-size:.8rem">${nextLock ? `Trade in ${nextLock.at - g.cashed} more seeds to stock the next thing.` : "Everything is in stock."}</p></div></header>
    <div class="seg" role="tablist">${SHOP_CATS.map(c => `<button data-gcat="${c.id}" aria-pressed="${GARDEN_CAT === c.id}" role="tab">${c.name}</button>`).join("")}</div>
    <div class="shopgrid">${SHOP.filter(it => it.cat === GARDEN_CAT).map(shopItemHTML).join("")}</div></section>
  <section class="card stack"><header class="row"><h2>Garden friends</h2><span class="spacer"></span><span class="pill pink">${friendCount()}/${FRIENDS.length}</span></header>
    <p class="muted" style="font-size:.82rem">Friends move in by themselves when the garden suits them, and they stay.</p>
    <div class="friendgrid">${FRIENDS.map(f => g.friends[f.id] ? `<div class="friendc got">${IMG(f.e)}<small>${jpLine(f)}</small></div>` : `<div class="friendc">${IMG(f.e)}<small>${esc(f.hint)}</small></div>`).join("")}</div></section>`;
  bindGarden(v);
}
function plotHTML(i) {
  const p = G().plots[i];
  if (!p) return `<button class="plot" data-drop="${i}" aria-label="Empty plot"></button>`;
  const it = SHOP_BY[p.id], grownNow = isGrown(p);
  return `<button class="plot has ${it.cat} ${it.grow ? grownNow ? "full" : "growing" : ""} ${GARDEN_ACT === i ? "sel" : ""}" data-drop="${i}" data-pick="cell:${i}" aria-label="${esc(it.en)}${it.grow && !grownNow ? `, growing ${p.g} of ${it.grow}` : ""}">
    <span class="pl" style="--s:${stageScale(p)}">${IMG(stageEmoji(p))}</span>${it.grow && !grownNow ? `<i class="gbar"><b style="width:${p.g / it.grow * 100}%"></b></i>` : ""}</button>`;
}
function actHTML(i) {
  const p = G().plots[i], it = SHOP_BY[p.id];
  return `<div class="row" style="flex-wrap:nowrap">${IMGW(stageEmoji(p), 44)}<div style="flex:1;min-width:0"><b>${itemName(it)}</b><div style="font-size:.85rem">${jpLine(it)}</div>
    <small class="muted">${it.grow ? isGrown(p) ? "Fully grown" : `Growing: stage ${p.g} of ${it.grow}` : "Decor"} · tap an empty plot to move it</small></div></div>
    <div class="row">${it.grow && !isGrown(p) ? `<button class="btn" id="water">${IMG("droplet")}Water · 1 seed</button>` : ""}<button class="btn ghost small" id="shelve">Back to the shed</button></div>`;
}
function shopItemHTML(it) {
  const open = it.at <= G().cashed;
  return `<button class="shopi ${open ? "" : "locked"}" data-buy="${it.id}" ${open ? "" : "disabled"}>${IMGW(it.e, 44)}<b>${open ? itemName(it) : "???"}</b>
    ${open ? `<small>${jpLine(it)}</small><span class="pill ${seeds() >= it.cost ? "done" : ""}">${it.cost} seeds</span>` : `<small>Trade in ${it.at} seeds in all</small>`}</button>`;
}
function bindGarden(v) {
  const g = G(), redraw = () => viewGarden(v);
  const spend = n => { if (seeds() < n) { toast(`You need ${n - seeds()} more seeds. Trade in stamps to get more.`); SFX.bad(); return false; } g.spent += n; return true; };
  const tr = $("#tradein", v); if (tr) tr.onclick = () => {
    const n = seedsPending(); g.cashed += n; save(); SFX.win(); confetti(20);
    const fresh = SHOP.filter(it => it.at > g.cashed - n && it.at <= g.cashed);
    toast(fresh.length ? `+${n} seeds! New in the shop: ${fresh.map(it => it.en).join(", ")}` : `+${n} seeds! Your stamps stay in your book.`);
    render();
  };
  $$("[data-gcat]", v).forEach(b => b.onclick = () => { GARDEN_CAT = b.dataset.gcat; redraw(); });
  $$("[data-buy]", v).forEach(b => b.onclick = () => {
    const it = SHOP_BY[b.dataset.buy]; if (!spend(it.cost)) return;
    g.shed.push({ id: it.id, g: 0 }); save(); SFX.pop(); toast(`${it.en} is in your shed. Tap it, then tap a plot.`); redraw();
  });
  const sun = $("#sunny", v); if (sun) sun.onclick = () => { if (!spend(sunnyCost())) return; growing().forEach(([, p]) => p.g++); save(); SFX.win(); confetti(16); checkFriends(); redraw(); };
  const land = $("#land", v); if (land) land.onclick = () => { if (!spend(landCost())) return; g.rows++; save(); SFX.pop(); toast(`${GARDEN_COLS} new plots!`); redraw(); };
  const water = $("#water", v); if (water) water.onclick = () => {
    const p = g.plots[GARDEN_ACT]; if (!p || !spend(1)) return; p.g++; save();
    if (isGrown(p)) { SFX.win(); confetti(14); toast(`Your ${SHOP_BY[p.id].en.toLowerCase()} is fully grown!`); } else SFX.good();
    checkFriends(); redraw();
  };
  const shelve = $("#shelve", v); if (shelve) shelve.onclick = () => { const p = g.plots[GARDEN_ACT]; if (!p) return; g.shed.push(p); delete g.plots[GARDEN_ACT]; GARDEN_ACT = null; save(); SFX.tap(); redraw(); };
  $$(".plot:not(.has)", v).forEach(b => b.addEventListener("click", () => { if (!DND.sel) { GARDEN_ACT = null; toast(g.shed.length ? "Tap something in your shed first." : "Buy something in the shop first."); } }));
  DND.onTap = id => {
    if (!id.startsWith("cell:")) return; const i = +id.slice(5);
    GARDEN_ACT = GARDEN_ACT === i ? null : i; DND.sel = null; redraw(); if (GARDEN_ACT != null) setSel(id, $(`[data-pick="${id}"]`, v)); return false;
  };
  DND.onDrop = (id, drop) => {
    const j = +drop, [kind, n] = id.split(":");
    if (kind === "shed") {
      const p = g.shed[+n]; if (!p) return; if (g.plots[j]) { toast("That plot's taken. Pick an empty one."); return; }
      g.shed.splice(+n, 1); g.plots[j] = p; GARDEN_ACT = null; SFX.pop();
    } else {
      const i = +n; if (i === j) return; const a = g.plots[i], b = g.plots[j];
      g.plots[j] = a; if (b) g.plots[i] = b; else delete g.plots[i]; GARDEN_ACT = j; SFX.tap();
    }
    DND.sel = null; save(); checkFriends(); redraw(); if (GARDEN_ACT != null) setSel("cell:" + GARDEN_ACT, $(`[data-pick="cell:${GARDEN_ACT}"]`, v));
  };
}
