// ===== Town scenes: little moments in each curated town (tools/towns.tsv), told in English =====
// The only Japanese in a scene is the kanji that stop teaches, so a beginner never meets a kanji above them.
// Text is English with those kanji inline (they're picked out in color). Signs are [text, caption, reading to say];
// answer options are [shown, reading to say]. Facts must be real and verifiable.
const SCENES = {
  "横浜": [
    { id: "yk-chinatown", title: "Chinatown gate", emoji: "lantern", kanji: "中一二円",
      narr: "You reach the red gate of Chinatown. In Japanese it's Chūkagai, and its name starts with 中 (chū): middle.",
      signs: [["中", "chū · middle", "ちゅう"], ["一 = 500 円", "one (ichi) = 500 yen (en)", "いち、ごひゃくえん"]],
      q: "A stall sells steamed pork buns at that price. You and your partner want one each. Which kanji means two?",
      opts: [["一", "いち"], ["二", "に"], ["中", "ちゅう"]], a: 1,
      after: "二 (ni) is two. Two buns: 1000 円.",
      note: "一 one, 二 two, 円 yen, 中 middle. You'll see them on prices and platform signs all over Japan.",
      fact: "Yokohama Chinatown is the largest Chinatown in Japan." },
    { id: "yk-park", title: "To Yamashita Park", emoji: "ship", kanji: "山下大",
      narr: "You walk down to the harbor. A signpost points two ways.",
      signs: [["← 山下　　大 →", "Yamashita Park · Ōsanbashi Pier", "やました、おおさんばし"]],
      q: "Your partner wants the park whose name means \"below the mountain\". 山 is mountain and 下 is below. Which way?",
      opts: [["←", "ひだり"], ["→", "みぎ"]], a: 0,
      after: "Yamashita (山下) means below the mountain. The other way, Ōsanbashi starts with 大 (ō): big. It's the Big Pier.",
      note: "山 (yama) mountain, 下 (shita) below, 大 (ō or dai) big.",
      fact: "The 1930 ocean liner Hikawa Maru is moored at Yamashita Park as a museum ship." },
    { id: "yk-avenue", title: "The big avenue", emoji: "road", kanji: "日本大",
      narr: "A wide street runs toward the harbor: Nihon Ōdōri. Its first two kanji spell the name of the country.",
      signs: [["日本 大", "Nihon Ōdōri", "にほんおおどおり"]],
      q: "日 is sun and 本 is origin. Together, 日本 (Nihon) is…",
      opts: [["Japan", "にほん"], ["a big street", "おおどおり"], ["a book", "ほん"]], a: 0,
      after: "日本 is the land where the sun begins: Japan. With 大 (ō), big, the name means Japan's big street.",
      note: "日 (nichi or hi) sun and day, 本 (hon) origin and book, 日本 (Nihon) Japan.",
      fact: "Nihon Ōdōri was laid out after Yokohama's great fire of 1866 as one of Japan's first Western-style avenues." },
    { id: "yk-station", title: "Lost in Yokohama Station", emoji: "station", kanji: "出",
      narr: "Yokohama Station's corridors go on forever. You need the way out.",
      signs: [],
      q: "Exit signs start with 出 (de): go out. Which sign leads out?",
      opts: [["出", "で"], ["中", "ちゅう"], ["下", "した"]], a: 0,
      after: "The full word is deguchi: exit. 出 hangs above every station exit in Japan.",
      note: "出 (de or shutsu) go out.",
      fact: "Yokohama Station has been under construction for so long that it is nicknamed Japan's Sagrada Família." },
  ],
};
// English text with the stop's kanji picked out in color
const sceneInline = (s, t) => [...t].map(c => isKanjiChar(c) ? `<b class="kj">${esc(c)}</b>` : esc(c)).join("");
const townScenes = s => (!s.track.kana && SCENES[s.stop.p]) || [];
const sceneDone = sc => !!(S.scenes || {})[sc.id];
function scenesHTML(s) {
  const list = townScenes(s); if (!list.length) return "";
  const done = list.filter(sceneDone).length;
  return `<div class="card scenecard" style="--lv:${LINE_INK[s.track.id]}"><div class="row" style="gap:8px">${IMGW("book", 28)}<div style="flex:1;min-width:0"><h3>Little scenes in ${esc(s.stop.ro)}</h3><p class="muted" style="font-size:.78rem">Short moments around town, in English, that use this stop's kanji. Play them before or after the test.</p></div><span class="pill">${done}/${list.length}</span></div>
    <div class="scenelist">${list.map((sc, i) => `<button class="scenebtn ${sceneDone(sc) ? "done" : ""}" data-scene="${i}">${IMGW(sc.emoji, 34)}<span><b>${esc(sc.title)}</b><small class="glyph">${esc(sc.kanji)}</small></span>${sceneDone(sc) ? IMGW("check", 20) : ""}</button>`).join("")}</div></div>`;
}
function bindScenes(root, s) { $$("[data-scene]", root).forEach(b => b.onclick = () => openScene(s, +b.dataset.scene)); }
function openScene(s, i) {
  const list = townScenes(s), sc = list[i]; if (!sc) return;
  openPlay(`${s.stop.ro} · ${sc.title}`, (st, hud) => {
    hud.innerHTML = `<span class="chip">${i + 1}/${list.length}</span>`;
    let solved = false;
    function draw() {
      st.innerHTML = `<div class="scene" style="--lv:${LINE_INK[s.track.id]}"><div class="scene-head">${IMGW(sc.emoji, 56)}<div><span class="eyebrow">${esc(s.stop.ro)} · scene ${i + 1}</span><h3>${esc(sc.title)}</h3></div></div>
        <p class="scnarr">${sceneInline(s, sc.narr)}</p>
        ${sc.signs.map(([t, cap, r]) => `<button class="scsign" data-say="${esc(r)}"><span class="glyph">${sceneInline(s, t)}</span><small class="en">${esc(cap)}</small></button>`).join("")}
        ${solved ? `<p class="scnarr scafter">${sceneInline(s, sc.after)}</p><div class="scnote">${sceneInline(s, sc.note)}</div><p class="muted scfact">${IMGW("sparkles", 18)}<span>${esc(sc.fact)}</span></p>
          <div class="row" style="justify-content:center">${list[i + 1] ? `<button class="btn" id="nextsc">Next scene</button>` : ""}<button class="btn ghost" id="backstop">Back to ${esc(s.stop.ro)}</button></div>`
        : `<div class="sctask"><b>${sceneInline(s, sc.q)}</b><div class="scopts">${sc.opts.map(([o], j) => `<button class="scopt ${[...o].some(isKanjiChar) ? "kanji" : ""}" data-opt="${j}">${sceneInline(s, o)}</button>`).join("")}</div></div>`}</div>`;
      $$("[data-opt]", st).forEach(b => b.onclick = () => {
        if (+b.dataset.opt !== sc.a) { SFX.bad(); b.classList.add("shake", "no"); setTimeout(() => b.classList.remove("shake"), 400); return; }
        SFX.good(); say(sc.opts[sc.a][1]); solved = true;
        const first = !sceneDone(sc); (S.scenes || (S.scenes = {}))[sc.id] = todayKey(); save();
        if (first && list.every(sceneDone)) { confetti(30); toast(`Every scene in ${s.stop.ro} done!`); }
        draw();
      });
      const nx = $("#nextsc", st); if (nx) nx.onclick = () => openScene(s, i + 1);
      const bk = $("#backstop", st); if (bk) bk.onclick = () => openSub(s);
    }
    draw();
  });
}
