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
  ["satsumaimo", "yakiimo", "Sweet potato", "さつまいも", "satsumaimo", "", "veg", 5, 55, 3],
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

// ---- state: S.garden = { cashed, spent, bonus, shed: [{id, g}], plots: {cell: {id, g}}, rows, friends: {id: date}, pantry: {id: n},
// cooked: {recipe: date}, words: {id: date}, name }
const GARDEN_NEW = () => ({ cashed: 0, spent: 0, bonus: 0, shed: [], plots: {}, rows: GARDEN_ROWS0, friends: {}, pantry: {}, cooked: {}, words: {}, name: "" });
// fill in any fields an older save doesn't have yet, without touching the ones it does
const G = () => { const g = S.garden || (S.garden = GARDEN_NEW()); if (!g.pantry) for (const [k, v] of Object.entries(GARDEN_NEW())) if (!(k in g)) g[k] = v; return g; };
const seedsEarned = () => foundCount() * SEED_PAY.kanji + ALL_SUBS.filter(visited).length * SEED_PAY.station + CITY_SUBS.filter(visited).length * SEED_PAY.city
  + gCleared() * G_SEEDS + gReadDone() * G_READ_SEEDS;
const seedsPending = () => Math.max(0, seedsEarned() - G().cashed);
const seeds = () => G().cashed + G().bonus - G().spent; // bonus: seeds the garden gives back (first dishes, garden words)
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
  { id: "g_dish", group: "Garden", name: "Itadakimasu!", icon: "cooking", desc: "Cook your first dish from the garden.", test: () => cookedCount() >= 1 },
  { id: "g_chef", group: "Garden", name: "Garden Chef", icon: "curry", gold: true, desc: "Cook every dish in the recipe book.", test: () => cookedCount() >= RECIPES.length },
  { id: "g_words", group: "Garden", name: "Green Words", icon: "book", desc: "Learn 20 garden words.", test: () => wordsKnown() >= 20 },
  { id: "g_grand", group: "Garden", name: "Grand Garden", icon: "sakura", desc: "Grow your garden to a Grand garden.", test: () => bloom() >= RANKS[4][0] },
);

// ---- harvest and the Oishii kitchen: grown veggies (and the cherry tree's blossoms) go to the pantry; dishes go in the
// recipe book, each giving seeds the first time. Harvesting takes a plant back one stage, so it needs a watering to regrow.
const HARVEST = new Set(SHOP.filter(it => it.cat === "veg").map(it => it.id).concat(["sakura"]));
const DISH_SEEDS = 5, WORD_SEEDS = 1;
// name: Japanese with {kanji|reading}, shown as kanji only once stamped
const RECIPES = [
  { id: "curry", e: "curry", jp: "カレーライス", ro: "karē raisu", en: "Curry rice", need: { carrot: 1, eggplant: 1 } },
  { id: "salad", e: "salad", jp: "サラダ", ro: "sarada", en: "Salad", need: { herb: 1, pepper: 1, carrot: 1 } },
  { id: "kinoko", e: "cookedrice", jp: "きのこご{飯|はん}", ro: "kinoko gohan", en: "Mushroom rice", need: { mushroom: 2 } },
  { id: "nabe", e: "nabe", jp: "なべ", ro: "nabe", en: "Hot pot", need: { mushroom: 2, carrot: 1 } },
  { id: "corn", e: "corn", jp: "{焼|や}きとうもろこし", ro: "yaki tōmorokoshi", en: "Grilled corn", need: { corn: 2 } },
  { id: "yakiimo", e: "yakiimo", jp: "{焼|や}きいも", ro: "yaki imo", en: "Roasted sweet potato", need: { satsumaimo: 2 } },
  { id: "shortcake", e: "shortcake", jp: "ショートケーキ", ro: "shōtokēki", en: "Strawberry shortcake", need: { strawberry: 2 } },
  { id: "kakigori", e: "shavedice", jp: "かき{氷|ごおり}", ro: "kakigōri", en: "Shaved ice", need: { melon: 1, strawberry: 1 } },
  { id: "dango", e: "dango", jp: "{花見|はなみ}だんご", ro: "hanami dango", en: "Hanami dango", need: { sakura: 1, herb: 1 } },
];
const canCook = r => Object.entries(r.need).every(([id, n]) => (G().pantry[id] || 0) >= n);
const cookedCount = () => RECIPES.filter(r => G().cooked[r.id]).length;
const nameHTML = x => furiText(x.jp) + (showRo() ? ` <span class="ro">${esc(x.ro)}</span>` : "");
// garden words: the Japanese names of things you have and friends who live here
const wordPool = () => {
  const g = G(), have = new Set([...plotList(), ...g.shed].map(p => p.id));
  return [...SHOP.filter(it => have.has(it.id)).map(it => ({ id: it.id, e: it.e, jp: it.jp, ro: it.ro, en: it.en })),
          ...FRIENDS.filter(f => g.friends[f.id]).map(f => ({ id: "f_" + f.id, e: f.e, jp: f.jp, ro: f.ro, en: f.id }))];
};
const wordsKnown = () => Object.keys(G().words).length;
// rank: how lush the garden is, from grown plants, growing ones, decor, friends and dishes
const RANKS = [[0, "Sprout patch", "seedling"], [15, "Little garden", "herb"], [40, "Cottage garden", "tulip"], [80, "Flower garden", "sunflower"], [140, "Grand garden", "sakura"], [220, "Imperial garden", "japan"]];
function bloom() {
  const ps = plotList();
  return ps.reduce((a, p) => a + (SHOP_BY[p.id].grow ? (isGrown(p) ? 3 : p.g) : 1), 0) + friendCount() * 5 + cookedCount() * 4;
}
const rankOf = b => { let r = 0; RANKS.forEach((x, i) => { if (b >= x[0]) r = i; }); return r; };
// the sky follows the real clock and season; it is only scenery
function skyNow(d = new Date()) {
  const h = d.getHours(), m = d.getMonth() + 1;
  const tod = h < 5 || h >= 19 ? "night" : h < 10 ? "morning" : h < 17 ? "day" : "evening";
  const season = m >= 3 && m <= 5 ? "spring" : m >= 6 && m <= 8 ? "summer" : m >= 9 && m <= 11 ? "autumn" : "winter";
  return { tod, season };
}
const FALL = { spring: "sakura", summer: "sparkles", autumn: "maple", winter: "snowflake" };
function skyHTML() {
  const { tod, season } = skyNow();
  const orb = tod === "night" ? "moon" : tod === "evening" ? "sunrise" : "sun";
  const bits = Array.from({ length: 7 }, (_, i) => `<span class="gfall" style="--x:${(hashStr(season + i) % 92) + 2}%;--d:${6 + (hashStr("d" + i) % 6)}s;--w:${i * 1.3}s">${IMG(tod === "night" && season === "summer" ? "sparkles" : FALL[season])}</span>`).join("");
  return `<div class="gsky ${tod} ${season}" aria-hidden="true"><span class="gorb">${IMG(orb)}</span><span class="gcloud c1">${IMG("cloud")}</span><span class="gcloud c2">${IMG("cloud")}</span>${tod === "night" ? `<span class="gstars">${IMG("stars")}</span>` : ""}</div>${bits}`;
}

// ---- labels: kanji only once stamped, otherwise English; Japanese with romaji
const itemName = it => it.k && canRead(it.k) ? `<span class="glyph">${esc(it.k)}</span> <small>${esc(it.en)}</small>` : esc(it.en);
const jpLine = x => `<span class="gjp">${esc(x.jp)}</span>${showRo() ? ` <span class="ro">${esc(x.ro)}</span>` : ""}`;
const stageEmoji = p => { const it = SHOP_BY[p.id]; return it.grow && p.g === 0 ? "seedling" : it.e; };
const stageScale = p => { const it = SHOP_BY[p.id]; return !it.grow || isGrown(p) ? 1 : .5 + .4 * p.g / it.grow; };

// ---------- GARDEN TAB ----------
let GARDEN_CAT = "flower", GARDEN_ACT = null, GARDEN_VIEW = "garden";
try { GARDEN_VIEW = sessionStorage.getItem("kg.gview") || "garden"; } catch (e) { }
function viewGarden(v) {
  const sw = `<div class="seg gswitch" role="tablist"><button data-gv="garden" aria-pressed="${GARDEN_VIEW === "garden"}" role="tab">${IMG("watering")}Garden</button><button data-gv="rest" aria-pressed="${GARDEN_VIEW === "rest"}" role="tab">${IMG("plate")}Restaurant${stockCount() ? ` <span class="pill pink">${stockCount()}</span>` : ""}</button></div>`;
  const bindSw = () => $$("[data-gv]", v).forEach(b => b.onclick = () => { GARDEN_VIEW = b.dataset.gv; try { sessionStorage.setItem("kg.gview", GARDEN_VIEW); } catch (e) { } viewGarden(v); window.scrollTo(0, 0); });
  if (GARDEN_VIEW === "rest") {
    v.innerHTML = `${pageHead("plate", "Restaurant", "レストラン", "Your own little restaurant. Cook what the garden grows and serve customers who order in Japanese.")}${sw}<div id="restv" class="stack"></div>`;
    viewRestaurant($("#restv", v)); bindSw(); return;
  }
  const g = G(); checkFriends();
  const pend = seedsPending(), cells = g.rows * GARDEN_COLS;
  const used = new Set(); const spots = FRIENDS.filter(f => g.friends[f.id]).map(f => { let c = hashStr(f.id + todayKey()) % cells; while (used.has(c) && used.size < cells) c = (c + 1) % cells; used.add(c); return { f, c }; });
  const nextLock = SHOP.filter(it => it.at > g.cashed).sort((a, b) => a.at - b.at)[0];
  const b = bloom(), r = rankOf(b), nx = RANKS[r + 1], sky = skyNow();
  v.innerHTML = `${pageHead("watering", "Garden", "にわ", "Trade in stamps for seeds, grow plants, harvest for your restaurant, and meet the friends who move in.")}${sw}
  <section class="card stack grank">
    <div class="row" style="flex-wrap:nowrap">${IMGW(RANKS[r][2], 44)}<div style="flex:1;min-width:0"><input id="gname" class="gname" value="${esc(g.name)}" placeholder="Name your garden" maxlength="24" aria-label="Garden name"><small class="muted">${RANKS[r][1]}${nx ? ` · ${nx[0] - b} bloom to ${nx[1]}` : " · the finest garden of all"}</small></div></div>
    <div class="bar"><i style="width:${nx ? Math.min(100, (b - RANKS[r][0]) / (nx[0] - RANKS[r][0]) * 100) : 100}%"></i></div>
  </section>
  <section class="hello gardenhello"><div class="stack" style="gap:6px;flex:1;min-width:0">
    <div class="row seedbank"><span class="chip big" title="Seeds to spend">${IMG("seedling")}<b id="seedn">${seeds()}</b> seeds</span>
      ${pend ? `<button class="btn pink" id="tradein">${IMG("lantern")}Trade in for +${pend}</button>` : `<span class="muted" style="font-size:.8rem">Clear stops to earn more stamps.</span>`}</div>
    <p class="help">Each kanji stamp is worth ${SEED_PAY.kanji} seed, each station stamp ${SEED_PAY.station}, each city stamp ${SEED_PAY.station + SEED_PAY.city}, each grammar post town ${G_SEEDS} and each reading set ${G_READ_SEEDS}.</p></div></section>
  <section class="card stack">
    <header class="row"><h2>The garden</h2><span class="spacer"></span><span class="pill pink">${grownAll()} grown</span></header>
    <div class="gwrap ${sky.tod}" style="--rows:${g.rows}">${skyHTML()}<div class="ggrid">${Array.from({ length: cells }, (_, i) => plotHTML(i)).join("")}</div>
      ${spots.map(({ f, c }, n) => `<span class="gfriend" style="--col:${c % GARDEN_COLS};--row:${Math.floor(c / GARDEN_COLS)};animation-delay:${n * .37}s" aria-hidden="true">${IMG(f.e)}</span>`).join("")}</div>
    <div id="gact" class="gact" aria-live="polite">${GARDEN_ACT != null && g.plots[GARDEN_ACT] ? actHTML(GARDEN_ACT) : `<p class="muted" style="font-size:.82rem">${g.shed.length ? "Tap something in your shed, then tap an empty plot. Drag plants around to rearrange." : plotList().length ? "Tap a plant to water it or move it." : "Buy something in the shop below to get started."}</p>`}</div>
    ${growing().length > 1 ? `<button class="btn ghost" id="sunny">${IMG("sun")}Sunny day: everything grows a stage · ${sunnyCost()} seeds</button>` : ""}
    ${g.rows < GARDEN_ROWS_MAX ? `<button class="btn ghost small" id="land">${IMG("sunrise")}Clear more land: ${GARDEN_COLS} more plots · ${landCost()} seeds</button>` : ""}
  </section>
  <section class="card stack"><header class="row">${IMGW("basket", 30)}<h3>Your shed</h3><span class="spacer"></span><span class="pill">${g.shed.length}</span></header>
    ${g.shed.length ? `<div class="shed">${g.shed.map((p, i) => `<button class="shedi" data-pick="shed:${i}" aria-label="${esc(SHOP_BY[p.id].en)}">${IMG(SHOP_BY[p.id].e)}${SHOP_BY[p.id].grow && !isGrown(p) ? `<i class="shedseed">${IMG("seedling")}</i>` : ""}</button>`).join("")}</div>` : `<p class="muted" style="font-size:.82rem">Things you buy wait here until you plant them.</p>`}</section>
  <section class="card stack"><header class="row">${IMGW("basket", 32)}<div style="flex:1;min-width:0"><h3>Pantry</h3><p class="muted" style="font-size:.8rem">Harvested veggies wait here for the restaurant kitchen.</p></div></header>
    <div class="pantry">${Object.entries(g.pantry).filter(([, n]) => n > 0).map(([id, n]) => `<span class="pchip">${IMG(SHOP_BY[id].e)}<b>×${n}</b></span>`).join("") || `<span class="muted" style="font-size:.82rem">Empty. Tap a fully grown veggie to harvest it.</span>`}</div>
    <button class="btn ghost small" data-gv="rest">${IMG("cooking")}To the kitchen</button></section>
  ${wordsHTML()}
  <section class="card stack"><header class="row">${IMGW("store", 34)}<div style="flex:1;min-width:0"><h2>Garden shop</h2><p class="muted" style="font-size:.8rem">${nextLock ? `Trade in ${nextLock.at - g.cashed} more seeds to stock the next thing.` : "Everything is in stock."}</p></div></header>
    <div class="seg" role="tablist">${SHOP_CATS.map(c => `<button data-gcat="${c.id}" aria-pressed="${GARDEN_CAT === c.id}" role="tab">${c.name}</button>`).join("")}</div>
    <div class="shopgrid">${SHOP.filter(it => it.cat === GARDEN_CAT).map(shopItemHTML).join("")}</div></section>
  <section class="card stack"><header class="row"><h2>Garden friends</h2><span class="spacer"></span><span class="pill pink">${friendCount()}/${FRIENDS.length}</span></header>
    <p class="muted" style="font-size:.82rem">Friends move in by themselves when the garden suits them, and they stay.</p>
    <div class="friendgrid">${FRIENDS.map(f => g.friends[f.id] ? `<button class="friendc got" data-friend="${f.id}">${IMG(f.e)}<small>${jpLine(f)}</small></button>` : `<div class="friendc">${IMG(f.e)}<small>${esc(f.hint)}</small></div>`).join("")}</div>
    <p class="help">Tap a friend to hear their name.</p></section>`;
  bindGarden(v); bindSw();
}
function plotHTML(i) {
  const p = G().plots[i];
  if (!p) return `<button class="plot" data-drop="${i}" aria-label="Empty plot"></button>`;
  const it = SHOP_BY[p.id], grownNow = isGrown(p);
  return `<button class="plot has ${it.cat} ${it.id} ${it.grow ? grownNow ? "full" : "growing" : ""} ${GARDEN_ACT === i ? "sel" : ""}" data-drop="${i}" data-pick="cell:${i}" aria-label="${esc(it.en)}${it.grow && !grownNow ? `, growing ${p.g} of ${it.grow}` : ""}">
    <span class="pl" style="--s:${stageScale(p)}">${IMG(stageEmoji(p))}</span>${it.grow && !grownNow ? `<i class="gbar"><b style="width:${p.g / it.grow * 100}%"></b></i>` : ""}</button>`;
}
function actHTML(i) {
  const p = G().plots[i], it = SHOP_BY[p.id];
  return `<div class="row" style="flex-wrap:nowrap">${IMGW(stageEmoji(p), 44)}<div style="flex:1;min-width:0"><b>${itemName(it)}</b><div style="font-size:.85rem">${jpLine(it)}</div>
    <small class="muted">${it.grow ? isGrown(p) ? "Fully grown" : `Growing: stage ${p.g} of ${it.grow}` : "Decor"} · tap an empty plot to move it</small></div></div>
    <div class="row">${it.grow && !isGrown(p) ? `<button class="btn" id="water">${IMG("droplet")}Water · 1 seed</button>` : ""}${isGrown(p) && HARVEST.has(p.id) ? `<button class="btn pink" id="harvest">${IMG("basket")}Harvest</button>` : ""}<button class="btn ghost small" id="shelve">Back to the shed</button></div>
    ${isGrown(p) && HARVEST.has(p.id) ? `<p class="help">Harvesting puts one in your pantry and takes the plant back a stage; water it to regrow.</p>` : ""}`;
}
function shopItemHTML(it) {
  const open = it.at <= G().cashed;
  return `<button class="shopi ${open ? "" : "locked"}" data-buy="${it.id}" ${open ? "" : "disabled"}>${IMGW(it.e, 44)}<b>${open ? itemName(it) : "???"}</b>
    ${open ? `<small>${jpLine(it)}</small><span class="pill ${seeds() >= it.cost ? "done" : ""}">${it.cost} seeds</span>` : `<small>Trade in ${it.at} seeds in all</small>`}</button>`;
}
function kitchenHTML() {
  const g = G(), pantry = Object.entries(g.pantry).filter(([, n]) => n > 0);
  return `<section class="card stack kitchen"><header class="row">${IMGW("cooking", 36)}<div style="flex:1;min-width:0"><h2>Oishii kitchen</h2><p class="muted" style="font-size:.8rem">Cook what you harvest; dishes go to the counter for your customers. Each new dish also goes in your recipe book and gives ${DISH_SEEDS} seeds.</p></div><span class="pill pink">${cookedCount()}/${RECIPES.length}</span></header>
    <div class="pantry">${pantry.length ? pantry.map(([id, n]) => `<span class="pchip">${IMG(SHOP_BY[id].e)}<b>×${n}</b></span>`).join("") : `<span class="muted" style="font-size:.82rem">Your pantry is empty. Grow veggies, then tap one to harvest it.</span>`}</div>
    <div class="recipes">${RECIPES.map(r => { const done = g.cooked[r.id], ok = canCook(r);
      return `<div class="recipe ${done ? "done" : ""}"><span class="rdish">${IMG(r.e)}</span><div class="rinfo"><b class="glyph">${nameHTML(r)}</b><small>${esc(r.en)}</small>
        <span class="rneed">${Object.entries(r.need).map(([id, n]) => `<span class="${(g.pantry[id] || 0) >= n ? "have" : ""}">${IMG(SHOP_BY[id].e)}${n > 1 ? `×${n}` : ""}</span>`).join("")}</span></div>
        <button class="btn small ${ok ? "pink" : "ghost"}" data-cook="${r.id}" ${ok ? "" : "disabled"}>${done ? "Cook again" : "Cook"}</button></div>`; }).join("")}</div></section>`;
}
function wordsHTML() {
  const pool = wordPool(), known = pool.filter(w => G().words[w.id]).length;
  return `<section class="card stack"><header class="row">${IMGW("book", 34)}<div style="flex:1;min-width:0"><h2>Garden words</h2><p class="muted" style="font-size:.8rem">Learn the Japanese names of your plants, decor and friends. Each new word gives ${WORD_SEEDS} seed.</p></div><span class="pill pink">${known}/${pool.length}</span></header>
    <button class="btn ghost" id="gwords" ${pool.length >= 4 ? "" : "disabled"}>${IMG("speaker")}${pool.length >= 4 ? "Name them in Japanese" : "Have 4 things in your garden to start"}</button></section>`;
}
function gardenWords() {
  const pool = wordPool(); if (pool.length < 4) return;
  const order = RND.shuffle(pool).sort((a, b) => !!G().words[a.id] - !!G().words[b.id]).slice(0, Math.min(6, pool.length));
  openPlay("Garden words", (st, hud) => {
    let i = 0, right = 0, fresh = 0;
    const draw = () => {
      const w = order[i]; if (!w) {
        st.innerHTML = `<div class="card result pop">${IMGW("book", 80)}<h2>${right} of ${order.length}</h2><p>${fresh ? `${fresh} new word${fresh > 1 ? "s" : ""} learned: +${fresh * WORD_SEEDS} seed${fresh > 1 ? "s" : ""}.` : "Every word here is one you know."}</p><div class="row" style="justify-content:center"><button class="btn ghost" id="wagain">Again</button><button class="btn" id="wdone">Back</button></div></div>`;
        SFX.win(); setTimeout(() => holdCelebrations(false), 400); $("#wagain", st).onclick = gardenWords; $("#wdone", st).onclick = () => closePlay(); return;
      }
      hud.innerHTML = `<span class="pill">${i + 1}/${order.length}</span>`;
      const opts = RND.shuffle([w, ...RND.shuffle(pool.filter(x => x.id !== w.id && x.jp !== w.jp)).slice(0, 3)]);
      st.innerHTML = `<div class="card stack gq" style="align-items:center;text-align:center"><span class="eyebrow">What is it in Japanese?</span>${IMGW(w.e, 96)}<div class="gopts" style="width:100%">${opts.map((o, k) => `<button class="gopt" data-o="${k}"><span class="glyph">${esc(o.jp)}</span>${showRo() ? `<small class="ro" style="display:block">${esc(o.ro)}</small>` : ""}</button>`).join("")}</div><div id="wfb"></div></div>`;
      $$("[data-o]", st).forEach(b => b.onclick = () => {
        const o = opts[+b.dataset.o], ok = o.id === w.id;
        $$("[data-o]", st).forEach(x => { x.disabled = true; if (opts[+x.dataset.o].id === w.id) x.classList.add("right"); });
        say(w.jp);
        if (ok) { right++; SFX.good(); if (!G().words[w.id]) { G().words[w.id] = todayKey(); G().bonus += WORD_SEEDS; fresh++; } save(); } else { SFX.bad(); b.classList.add("wrong"); }
        $("#wfb", st).innerHTML = `<div class="gfeed ${ok ? "ok" : "no"}"><b>${ok ? "おいしい！ Right." : "Not quite."}</b><span class="glyph" style="font-size:1.3rem">${esc(w.jp)}</span>${showRo() ? `<span class="ro">${esc(w.ro)}</span>` : ""}<button class="btn" id="wnext">Next →</button></div>`;
        $("#wnext", st).onclick = () => { i++; draw(); };
      });
    };
    draw();
  });
}
// cooking uses the pantry and puts the dish in the restaurant's stock (two with the helper chef)
function bindKitchen(v, redraw) {
  const g = G();
  $$("[data-cook]", v).forEach(bt => bt.onclick = () => {
    const r = RECIPES.find(x => x.id === bt.dataset.cook); if (!canCook(r)) return;
    Object.entries(r.need).forEach(([id, n]) => g.pantry[id] -= n);
    const made = has("chef") ? 2 : 1; RS().stock[r.id] = (RS().stock[r.id] || 0) + made;
    const first = !g.cooked[r.id]; if (first) { g.cooked[r.id] = todayKey(); g.bonus += DISH_SEEDS; }
    save(); SFX.win(); confetti(first ? 30 : 12);
    toast(first ? `${r.en}! +${DISH_SEEDS} seeds, a new page in your recipe book, and ${made} ready to serve.` : `${made} ${r.en.toLowerCase()} ready to serve. おいしい!`); redraw();
  });
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
  $("#gname", v).onchange = e => { g.name = e.target.value.trim().slice(0, 24); save(); };
  const hv = $("#harvest", v); if (hv) hv.onclick = () => {
    const p = g.plots[GARDEN_ACT]; if (!p || !isGrown(p)) return; const it = SHOP_BY[p.id];
    g.pantry[p.id] = (g.pantry[p.id] || 0) + 1; p.g = it.grow - 1; save(); SFX.pop(); toast(`+1 ${it.en.toLowerCase()} for the kitchen`); redraw();
  };
  bindKitchen(v, redraw);
  const gw = $("#gwords", v); if (gw) gw.onclick = gardenWords;
  $$("[data-friend]", v).forEach(bt => bt.onclick = () => { const f = FRIENDS.find(x => x.id === bt.dataset.friend); say(f.jp); toast(`${f.jp} · ${f.ro}`); });
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
