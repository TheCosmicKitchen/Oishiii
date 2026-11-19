// ===== Hajimete: Mochi's Great Journey, a first-trip-to-Japan page =====
// All Japanese comes from hajimete/data.js (tools/hajimete_build.py): native Tatoeba phrases, JMdict sign words and
// katakana words. Travel facts below carry their source and the date they were checked.
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const IMG = (k, w = 28) => EMO[k] ? `<img class="em" src="${EMO[k]}" alt="" style="width:${w}px;height:${w}px">` : "";
const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const KEY = "hajimete.v1";
let ST = { at: 0, best: {}, furi: true, ro: true };
try { Object.assign(ST, JSON.parse(localStorage.getItem(KEY)) || {}); } catch (e) { }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(ST)); } catch (e) { } };
function say(t) { try { const u = new SpeechSynthesisUtterance(t); u.lang = "ja-JP"; u.rate = .85; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch (e) { } }
document.addEventListener("click", e => { const b = e.target.closest("[data-say]"); if (b) say(b.dataset.say); });

// ---- kana → Hepburn romaji (long vowels from ー as macrons; small っ doubles; は/へ/を as particles read wa/e/o)
const K2R = {};
"あa いi うu えe おo かka きki くku けke こko さsa しshi すsu せse そso たta ちchi つtsu てte とto なna にni ぬnu ねne のno はha ひhi ふfu へhe ほho まma みmi むmu めme もmo やya ゆyu よyo らra りri るru れre ろro わwa をo んn がga ぎgi ぐgu げge ごgo ざza じji ずzu ぜze ぞzo だda ぢji づzu でde どdo ばba びbi ぶbu べbe ぼbo ぱpa ぴpi ぷpu ぺpe ぽpo ゔvu ぁa ぃi ぅu ぇe ぉo".split(" ").forEach(x => { K2R[x[0]] = x.slice(1); });
const YO = { "ゃ": "ya", "ゅ": "yu", "ょ": "yo" };
const MAC = { a: "ā", i: "ī", u: "ū", e: "ē", o: "ō" };
const toHira = s => [...s].map(c => c >= "ァ" && c <= "ヶ" ? String.fromCharCode(c.charCodeAt(0) - 0x60) : c).join("");
function romaji(kana) {
  const a = [...toHira(kana)]; let out = "";
  for (let i = 0; i < a.length; i++) {
    const c = a[i], n = a[i + 1];
    if (c === "っ") { const nx = romaji(a.slice(i + 1).join("")); out += nx[0] === "c" ? "t" : nx[0] || ""; continue; }
    if (c === "ー") { const v = out.slice(-1); out = MAC[v] ? out.slice(0, -1) + MAC[v] : out; continue; }
    let r = K2R[c] ?? c;
    if (c === "ん" && n && /^[aiueoy]/.test(K2R[n] || "")) r = "n'"; // only after ん: kon'ya, not on'egai
    else if (n && YO[n] && r.endsWith("i")) { const base = r.slice(0, -1); r = (/^(sh|ch|j)$/.test(base) ? base + YO[n].slice(1) : base + YO[n]); i++; }
    else if (n && "ぁぃぅぇぉ".includes(n) && r.length > 1) { r = r.slice(0, -1) + K2R[n]; i++; } // ファ fa, ティ ti
    out += r;
  }
  return out;
}
// long vowels as macrons inside a word (arigatō, daijōbu, okāsan); not a verb's own final う (omou stays omou)
const macron = (r, verbEnd) => (verbEnd ? r.slice(0, -2) : r).replace(/ou|oo/g, "ō").replace(/uu/g, "ū").replace(/aa/g, "ā").replace(/ee/g, "ē") + (verbEnd ? r.slice(-2) : "");
const PARTICLE = { "は": "wa", "へ": "e", "を": "o" };
// romaji for a phrase: endings join their word (shimasu, tasukete, deshita), prefixes and suffixes too (gochisōsama,
// kyūkyūsha); particles stand alone and は/へ/を read wa/e/o
function phraseRo(p) {
  const groups = [];
  for (const [surf, kana, , tag = ""] of p.w) {
    if (tag === "補助記号" || /^[。、！？!?]$/.test(surf)) continue;
    const prev = groups[groups.length - 1], pt = prev ? prev.last : "";
    const attach = prev && !prev.particle && (tag === "接尾辞" || pt === "接頭辞" || (tag === "助動詞" && !/^(です|でし|でしょ)/.test(kana) && /^(動詞|形容詞|助動詞)/.test(pt)) || (tag === "助詞/接続助詞" && /^(動詞|形容詞|助動詞)/.test(pt)));
    if (tag.startsWith("助詞") && tag !== "助詞/接続助詞") { groups.push({ ro: PARTICLE[surf] || romaji(kana), particle: true, last: tag }); continue; }
    if (attach) { prev.kana += kana; prev.last = tag; } else groups.push({ kana, head: tag, last: tag });
  }
  return groups.map(g => g.particle ? g.ro : macron(romaji(g.kana), g.head === "動詞" && g.last === "動詞" && g.kana.endsWith("う"))).join(" ");
}

// ---- furigana: kanji runs get their reading above
function rubyHTML(text, segs) {
  let out = "", i = 0;
  for (const [a, b, kana] of segs) { out += esc(text.slice(i, a)); out += `<ruby>${esc(text.slice(a, b + 1))}<rt>${esc(kana)}</rt></ruby>`; i = b + 1; }
  return out + esc(text.slice(i));
}
const phraseJa = p => p.w.map(w => rubyHTML(w[0], w[2])).join("");
const plainReading = p => p.w.map(w => w[1]).join("");

// ---- the journey
const SIGN_STOP = { 2: "駅 改札 切符 乗り換え 番線 各駅停車 快速 急行 特急 優先席 女性専用車 地下鉄 空港 北口 東口 南口 西口".split(" "),
  3: "本日 売り切れ 無料 税込 現金 円 大人 子供".split(" "), 4: "営業中 準備中 定休日 食券".split(" "), 5: "温泉 交番 病院 薬局".split(" ") };
const signsAt = i => i === 1 ? [...HAJIMETE.signs.filter(s => !Object.values(SIGN_STOP).flat().includes(s.k)), ...HAJIMETE.door]
  : HAJIMETE.signs.filter(s => (SIGN_STOP[i] || []).includes(s.k));
const SCENE_STOP = { basics: 0, "getting around": 2, shopping: 3, food: 4, help: 5 };
const phrasesAt = i => HAJIMETE.phrases.filter(p => SCENE_STOP[p.scene] === i);
const CHECKED = "checked 18 November 2026";
const STOPS = [
  { m: 0, e: "plane", title: "The Arrivals Gate", story: "Mochi steps off the plane, small backpack on, whiskers trembling. Ahead lies a vast and unknown land. Somewhere out there, 140 whole metres away, is a hotel bed. But first: the ancient scripts.",
    facts: [{ t: "Three scripts, one sentence", b: "Japanese mixes three scripts. Hiragana (あいう) is for grammar and native words. Katakana (アイウ) is for foreign words, so menus are full of it: コーヒー is \"coffee\". Kanji (日本) carry meaning, and signs use them a lot. You don't need all three: katakana alone unlocks half a menu." }] },
  { m: 12, e: "warning", title: "The Corridor of a Thousand Signs", story: "Twelve metres in, Mochi faces a wall of signs. Some point to exits, some to toilets, some to certain doom (a closed staff door). Mochi studies them bravely.",
    facts: [] },
  { m: 35, e: "train", title: "The Ticket Gate of Destiny", story: "A row of gates beeps at everyone who passes. Mochi has heard tales of a magic card that makes them open. Thirty-five metres from home… home? This is the adventure now.",
    facts: [
      { t: "The tap card", b: "Rechargeable IC cards (Suica, PASMO, ICOCA and others) work on trains and buses all over Japan, and in many shops. Tap in at the gate, tap out where you get off. Regular Suica and PASMO cards went back on sale at station machines in March 2025; visitors can also get a Welcome Suica at Haneda or Narita airport (no deposit, valid for 28 days) or add Suica to an iPhone.",
        src: [["Tokyo Cheapo: The return of Suica cards", "https://tokyocheapo.com/travel/the-return-of-suica-cards/"], ["Time Out Tokyo: Unregistered Suica and PASMO back on sale", "https://www.timeout.com/tokyo/news/unregistered-suica-and-pasmo-transport-cards-to-resume-sales-from-march-022125"]] },
      { t: "Quiet carriages", b: "Talking softly on trains is fine, but phone calls are frowned upon. Queue to the side of the doors and let people off first.",
        src: [["JNTO: Japanese manners and etiquette", "https://www.japan.travel/en/guide/understanding-and-mastering-japanese-manners-and-etiquette/"]] },
    ] },
  { m: 58, e: "store", title: "The Glowing Konbini", story: "A light in the distance! The konbini, open all night, stocked with every snack known to hamster-kind. Fifty-eight metres. Mochi's legs ache. Mochi presses on.",
    facts: [
      { t: "Carry some cash", b: "Cards work in hotels, chains and konbini, but small restaurants and shops are often cash only. ATMs in 7-Eleven stores take most foreign cards, with an English menu.",
        src: [["Japan Experience: Paying and withdrawing money in Japan", "https://www.japan-experience.com/plan-your-trip/to-know/traveling-japan/withdrawing-money"], ["JW Web Magazine: Guide to ATMs in Japan", "https://jw-webmagazine.com/tips/guide-to-atms-in-japan/"]] },
      { t: "Tax-free shopping changed on 1 November 2026", b: "Shops now charge the full price, tax included. You claim the tax back when you leave: at a kiosk in the departure airport, before check-in, with your passport, your receipts and the items (keep them in your carry-on). It applies to at least ¥5,000 per shop per day, within 90 days of buying. Anything you've already used or eaten doesn't count.",
        src: [["JNTO: Everything you need to know about Japan's new tax-free system (July 2026)", "https://www.japan.travel/en/us/blog/everything-you-need-to-know-japans-new-tax-free-shopping-system/"]] },
      { t: "Where are all the bins?", b: "Public bins are rare: visitors call it their biggest inconvenience. Carry a small bag for rubbish and use the bins at your hotel, or at a konbini for things you bought there.",
        src: [["Japan Today: visitors most frustrated with lack of bins (government survey)", "https://japantoday.com/category/national/visitors-to-japan-most-frustrated-with-lack-of-trash-bins-survey"], ["CTV News: where are all the trash cans?", "https://www.ctvnews.ca/world/article/japan-is-a-model-of-cleanliness-so-where-are-all-the-trash-cans/"]] },
    ] },
  { m: 96, e: "ramen", title: "The Ramen Shop at the Edge of the World", story: "Ninety-six metres. A steaming shop with a machine at the door that sells… tickets? Mochi learns that here, you buy your noodles from a machine and hand the ticket over the counter.",
    facts: [
      { t: "The ticket machine", b: "Many ramen and set-meal shops have a 食券 (shokken, meal ticket) machine by the door. Pay at the machine, press the button for your dish, and give the ticket to the staff. 準備中 on the door means they're closed until the next service; 営業中 means open." },
      { t: "No tips", b: "Tipping isn't customary in Japan and is often met with confusion. A thank-you (and ごちそうさまでした on the way out) is the way to show appreciation.",
        src: [["JNTO: Japanese customs and etiquette", "https://www.japan.travel/en/responsible-travel-guide/japanese-customs-and-etiquette/"]] },
    ] },
  { m: 140, e: "hotel", title: "The Hotel, Home at Last", story: "One hundred and forty metres. The doors slide open by themselves. Mochi has crossed signs, gates and a konbini, and eaten a bowl of ramen bigger than Mochi. Truly, a legend. Now: shoes off, and to bed.",
    facts: [
      { t: "Emergencies", b: "Police: 110. Fire or ambulance: 119. For help in English any time, the Japan Visitor Hotline is 050-3816-2787 (from abroad +81-50-3816-2787), 24 hours a day, every day.",
        src: [["JNTO: Japan Visitor Hotline", "https://www.japan.travel/en/plan/hotline/"]] },
      { t: "Shoes and slippers", b: "Take your shoes off at the entrance of homes, ryokan and some restaurants. Slippers come off too before you step onto tatami mats.",
        src: [["JNTO: Japanese manners and etiquette", "https://www.japan.travel/en/guide/understanding-and-mastering-japanese-manners-and-etiquette/"]] },
      { t: "Hot spring baths", b: "Wash your whole body before you get in, and keep your towel out of the water. Tattoos are often not allowed, though some baths welcome them, so check first.",
        src: [["JNTO: Japanese manners and etiquette", "https://www.japan.travel/en/guide/understanding-and-mastering-japanese-manners-and-etiquette/"]] },
      { t: "Leaving Japan", b: "The departure tax went up to ¥3,000 a person on 1 July 2026 (children under 2 are exempt). It's normally collected with your plane ticket.",
        src: [["Japan Tourism Agency: International Tourist Tax", "https://www.mlit.go.jp/kankocho/seisaku_seido/kihonkeikaku/inbound_kaifuku/ryokakuzei.html"]] },
    ] },
];

// ---- kana chart
const GOJUON = ["あいうえお", "かきくけこ", "さしすせそ", "たちつてと", "なにぬねの", "はひふへほ", "まみむめも", "や ゆ よ", "らりるれろ", "わ   を", "ん    "];
const toKata = s => [...s].map(c => c >= "ぁ" && c <= "ゖ" ? String.fromCharCode(c.charCodeAt(0) + 0x60) : c).join("");
let SCRIPT = "kata";
function chartHTML() {
  return `<div class="seg"><button data-script="hira" aria-pressed="${SCRIPT === "hira"}">ひらがな hiragana</button><button data-script="kata" aria-pressed="${SCRIPT === "kata"}">カタカナ katakana</button></div>
    <div class="chart">${GOJUON.map(row => [...row].map(c => c === " " ? `<span></span>` : `<button class="kc" data-say="${c}"><b>${SCRIPT === "kata" ? toKata(c) : c}</b><small>${romaji(c)}</small></button>`).join("")).join("")}</div>
    <p class="help">Tap any character to hear it. Add ゛ for a voiced sound (か ka → が ga) and ゜ for p (は ha → ぱ pa). In katakana, ー makes a vowel long: コーヒー kōhī.</p>`;
}

// ---- quizzes
function quizHTML(id, label) { return `<button class="btn pink" data-quiz="${id}">${IMG("star", 22)}${label}${ST.best[id] != null ? ` <small>· best ${ST.best[id]}/8</small>` : ""}</button>`; }
function makeQuiz(id, stop) {
  if (id === "kana") {
    const all = GOJUON.join("").replace(/\s/g, "").split("");
    return shuffle(all).slice(0, 8).map(c => { const k = SCRIPT === "kata" ? toKata(c) : c; const ans = romaji(c); return { q: `<div class="qbig">${k}</div>`, say: c, ans, opts: shuffle([ans, ...shuffle([...new Set(all.map(romaji))].filter(r => r !== ans)).slice(0, 3)]) }; });
  }
  if (id === "kata") {
    const pool = HAJIMETE.kata;
    return shuffle(pool).slice(0, 8).map(w => ({ q: `<div class="qbig kata">${w.k}</div><p class="muted">${ST.ro ? romaji(w.k) : "&nbsp;"}</p>`, say: w.k, ans: w.m, opts: shuffle([w.m, ...shuffle(pool.filter(x => x.m !== w.m)).slice(0, 3).map(x => x.m)]) }));
  }
  const pool = signsAt(stop);
  return shuffle(pool).slice(0, Math.min(8, pool.length)).map(s => ({ q: `<div class="sign big">${s.k}</div><p class="muted">${esc(s.r)}${ST.ro ? ` · ${macron(romaji(s.r))}` : ""}</p>`, say: s.r, ans: s.m,
    opts: shuffle([s.m, ...shuffle([...HAJIMETE.signs, ...HAJIMETE.door].filter(x => x.m !== s.m)).slice(0, 3).map(x => x.m)]) }));
}
function runQuiz(id, stop) {
  const qs = makeQuiz(id, stop); let i = 0, right = 0;
  const box = $("#overlay"); box.hidden = false; document.body.style.overflow = "hidden";
  const close = () => { box.hidden = true; document.body.style.overflow = ""; render(); };
  const draw = () => {
    const q = qs[i];
    if (!q) {
      ST.best[id] = Math.max(ST.best[id] || 0, right); save();
      box.innerHTML = `<div class="sheet"><div class="done">${IMG(right >= qs.length - 1 ? "party" : "hamster", 90)}<h2>${right} of ${qs.length}</h2><p>${right >= qs.length - 1 ? "Mochi does a tiny victory dance." : "Mochi believes in you. Again?"}</p>
        <div class="row"><button class="btn ghost" id="qagain">Again</button><button class="btn" id="qclose">Back to the journey</button></div></div></div>`;
      $("#qagain").onclick = () => runQuiz(id, stop); $("#qclose").onclick = close; return;
    }
    box.innerHTML = `<div class="sheet"><div class="row top"><button class="iconbtn" id="qx" aria-label="Close">←</button><span class="pill">${i + 1}/${qs.length}</span></div>
      <div class="qcard">${q.q}<button class="iconbtn" data-say="${esc(q.say)}" aria-label="Hear it">${IMG("speaker", 22)}</button></div>
      <div class="opts">${q.opts.map((o, k) => `<button class="opt" data-o="${k}">${esc(o)}</button>`).join("")}</div><div id="qfb"></div></div>`;
    $("#qx").onclick = close; say(q.say);
    $$("[data-o]", box).forEach(b => b.onclick = () => {
      const ok = q.opts[+b.dataset.o] === q.ans; if (ok) right++;
      $$("[data-o]", box).forEach(x => { x.disabled = true; if (q.opts[+x.dataset.o] === q.ans) x.classList.add("right"); });
      if (!ok) b.classList.add("wrong");
      $("#qfb").innerHTML = `<p class="fb ${ok ? "ok" : "no"}">${ok ? "Yes!" : `It's “${esc(q.ans)}”.`}</p><button class="btn" id="qn">Next →</button>`;
      $("#qn").onclick = () => { i++; draw(); };
    });
  };
  draw();
}

// ---- page
let VIEW = Math.min(ST.at, STOPS.length - 1);
function trailHTML() {
  const max = STOPS[STOPS.length - 1].m;
  return `<div class="trail"><div class="path"></div>${STOPS.map((s, i) => `<button class="tstop ${i <= ST.at ? "reached" : ""} ${i === VIEW ? "here" : ""}" data-view="${i}" style="--x:${8 + i / (STOPS.length - 1) * 84}%" aria-label="${esc(s.title)}">${IMG(s.e, 26)}<small>${s.m} m</small></button>`).join("")}
    <span class="mochi" style="--x:${8 + ST.at / (STOPS.length - 1) * 84}%">${IMG("hamster", 40)}</span></div>`;
}
function phraseHTML(p) {
  return `<div class="phrase"><button class="iconbtn" data-say="${esc(plainReading(p))}" aria-label="Hear it">${IMG("speaker", 22)}</button><div class="ptext">
    <p class="ja ${ST.furi ? "" : "nofuri"}">${phraseJa(p)}</p>${ST.ro ? `<p class="ro">${esc(phraseRo(p))}</p>` : ""}<p class="en">${esc(p.en)}</p>
    <small class="src">${p.src === "JMdict" ? "JMdict set expression" : `<a href="https://tatoeba.org/en/sentences/show/${p.id}" target="_blank" rel="noopener">Tatoeba #${p.id}</a>, by native speakers`}</small></div></div>`;
}
function signHTML(s) { return `<button class="signcard" data-say="${esc(s.r)}"><span class="sign">${esc(s.k)}</span><span><b>${esc(s.m)}</b><small>${esc(s.r)}${ST.ro ? ` · ${macron(romaji(s.r))}` : ""}</small><small class="where">${esc(s.where)}</small></span></button>`; }
function factHTML(f) {
  return `<div class="fact"><h4>${esc(f.t)}</h4><p>${esc(f.b)}</p>${f.src ? `<small class="src">${f.src.map(([t, u]) => `<a href="${u}" target="_blank" rel="noopener">${esc(t)}</a>`).join(" · ")} · ${CHECKED}</small>` : ""}</div>`;
}
function render() {
  const i = VIEW, s = STOPS[i], ph = phrasesAt(i), sg = signsAt(i);
  $("#app").innerHTML = `
  <header class="hero">${IMG("hamster", 64)}<div><h1>Mochi's Great Journey</h1><p class="jp">はじめての日本 <small>hajimete no Nihon · Japan, for the first time</small></p>
    <p>A tiny hamster's epic 140-metre quest, from the airport to a hotel bed. Learn just enough Japanese to feel at home on a first trip.</p></div></header>
  ${trailHTML()}
  <div class="toggles"><label><input type="checkbox" id="tfuri" ${ST.furi ? "checked" : ""}> readings over kanji</label><label><input type="checkbox" id="tro" ${ST.ro ? "checked" : ""}> romaji</label></div>
  <section class="card stop">
    <div class="row">${IMG(s.e, 54)}<div style="flex:1;min-width:0"><span class="eyebrow">Stop ${i + 1} of ${STOPS.length} · ${s.m} metres from the plane</span><h2>${esc(s.title)}</h2></div></div>
    <p class="story">${esc(s.story)}</p>
  </section>
  ${i === 0 ? `<section class="card"><h3>${IMG("book", 26)}The scripts</h3>${chartHTML()}<div class="row">${quizHTML("kana", `Quiz me on ${SCRIPT === "kata" ? "katakana" : "hiragana"}`)}</div></section>` : ""}
  ${sg.length ? `<section class="card"><h3>${IMG("warning", 26)}Signs you'll see here</h3><p class="help">Tap a sign to hear it.</p><div class="signs">${sg.map(signHTML).join("")}</div><div class="row">${quizHTML("signs" + i, "Read the signs")}</div></section>` : ""}
  ${i === 3 ? `<section class="card"><h3>${IMG("store", 26)}Katakana on shelves and menus</h3><p class="help">Foreign words are written in katakana, so you can often sound them out: タクシー is takushī, "taxi".</p>
    <div class="katas">${HAJIMETE.kata.slice(0, 18).map(w => `<button class="kw" data-say="${esc(w.k)}"><b>${esc(w.k)}</b><small>${ST.ro ? esc(romaji(w.k)) + " · " : ""}${esc(w.m)}</small></button>`).join("")}</div><div class="row">${quizHTML("kata", "Read the menu")}</div></section>` : ""}
  ${ph.length ? `<section class="card"><h3>${IMG("speaker", 26)}Phrases for here</h3><p class="help">Real sentences written by native Japanese speakers. Tap the speaker to hear them.</p>${ph.map(phraseHTML).join("")}</section>` : ""}
  ${s.facts.length ? `<section class="card"><h3>${IMG("map", 26)}Know before you go</h3>${s.facts.map(factHTML).join("")}</section>` : ""}
  <div class="nav">${i ? `<button class="btn ghost" data-view="${i - 1}">← ${esc(STOPS[i - 1].title)}</button>` : "<span></span>"}
    ${i < STOPS.length - 1 ? `<button class="btn" id="onward">${IMG("paws", 22)}Onward, ${STOPS[i + 1].m - s.m} more metres!</button>` : `<div class="theend">${IMG("party", 40)}<b>140 metres. A legend is born.</b></div>`}</div>
  <footer><p>Japanese from <a href="https://tatoeba.org" target="_blank" rel="noopener">Tatoeba</a> (CC BY 2.0 FR), native speakers only, and <a href="https://www.edrdg.org/jmdict/j_jmdict.html" target="_blank" rel="noopener">JMdict</a> (EDRDG, CC BY-SA 4.0). Pictures: Microsoft Fluent Emoji (MIT). Part of <a href="../">Oishii</a>. Travel facts change: each card says where it's from and when it was checked.</p></footer>`;
  $$("[data-view]").forEach(b => b.onclick = () => { VIEW = +b.dataset.view; render(); window.scrollTo({ top: 0, behavior: "smooth" }); });
  $$("[data-script]").forEach(b => b.onclick = () => { SCRIPT = b.dataset.script; render(); });
  $$("[data-quiz]").forEach(b => b.onclick = () => runQuiz(b.dataset.quiz, i));
  $("#tfuri").onchange = e => { ST.furi = e.target.checked; save(); render(); };
  $("#tro").onchange = e => { ST.ro = e.target.checked; save(); render(); };
  const on = $("#onward"); if (on) on.onclick = () => { ST.at = Math.max(ST.at, i + 1); VIEW = i + 1; save(); render(); window.scrollTo({ top: 0, behavior: "smooth" }); };
}
render();
