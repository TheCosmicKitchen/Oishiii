// ===== Town scenes: little moments in each curated town (tools/towns.tsv), using the kanji you learn there =====
// Text markup: {漢字|かな} is a word with its reading. The Kanji reader sees it as kanji when every kanji in it is from
// this stop or already stamped, otherwise with furigana; the Kana speller always sees the reading plus romaji.
// Lines are [who, text, English]: who is "sign", "clerk", "friend" or "you". Facts must be real and verifiable.
const SCENES = {
  "横浜": [
    { id: "yk-chinatown", title: "Chinatown gate", emoji: "lantern", kanji: "中一二円",
      lines: [["sign", "{中華街|ちゅうかがい}", "Chinatown"], ["clerk", "いらっしゃいませ！", "Welcome!"],
        ["sign", "{肉|にく}まん　{一|ひと}つ　500{円|えん}", "Steamed pork buns: 500 yen each"], ["clerk", "いくつ ですか？", "How many?"]],
      task: { q: "You and your partner want one each. What do you say?", opts: ["{一|ひと}つ ください", "{二|ふた}つ ください", "{三|みっ}つ ください"], a: 1 },
      after: [["clerk", "{二|ふた}つで 1000{円|えん}です。", "That's 1000 yen for two."], ["friend", "おいしい！", "Delicious!"]],
      note: "一つ (hitotsu) is one thing, 二つ (futatsu) two. 円 (en) is yen, on every price tag.",
      fact: "Yokohama Chinatown is the largest Chinatown in Japan." },
    { id: "yk-park", title: "To Yamashita Park", emoji: "ship", kanji: "山下大",
      lines: [["friend", "{山下公園|やましたこうえん}は どっち？", "Which way is Yamashita Park?"],
        ["sign", "← {山下公園|やましたこうえん}　　{大|おお}さん{橋|ばし} →", "← Yamashita Park · Ōsanbashi Pier →"]],
      task: { q: "Which way to Yamashita Park?", opts: ["←", "→"], a: 0 },
      after: [["you", "こっち！", "This way!"]],
      note: "山下 (yamashita) is 山 mountain + 下 below: \"below the mountain\". 大 (ō) means big.",
      fact: "The 1930 ocean liner Hikawa Maru is moored at Yamashita Park as a museum ship." },
    { id: "yk-avenue", title: "The big avenue", emoji: "road", kanji: "日本大",
      lines: [["sign", "{日本大通|にほんおおどお}り", "Nihon Ōdōri"], ["friend", "{日本|にほん}って なに？", "What's 日本?"]],
      task: { q: "What does 日本 (nihon) mean?", opts: ["Japan", "big street", "book"], a: 0 },
      after: [["you", "{日本|にほん}の {大|おお}きい みち！", "Japan's big road!"]],
      note: "日本 is 日 sun + 本 origin: \"origin of the sun\", Japan. 大通り is a big street.",
      fact: "Nihon Ōdōri was laid out after Yokohama's great fire of 1866 as one of Japan's first Western-style avenues." },
    { id: "yk-station", title: "Lost in Yokohama Station", emoji: "station", kanji: "出",
      lines: [["sign", "{横浜駅|よこはまえき}", "Yokohama Station"], ["friend", "{出口|でぐち}は どこ？", "Where's the exit?"]],
      task: { q: "Find the exit sign.", opts: ["{入口|いりぐち}", "{出口|でぐち}", "{中央|ちゅうおう}"], a: 1 },
      after: [["you", "あった！", "Found it!"]],
      note: "出口 (deguchi) is 出 go out + 口 mouth: the way out. 入口 (iriguchi) is the way in.",
      fact: "Yokohama Station has been under construction for so long that it is nicknamed Japan's Sagrada Família." },
  ],
};
const SCENE_WHO = { clerk: "person", friend: "smile", you: "speaking" };
const sceneRead = t => t.replace(/\{([^|}]+)\|([^}]+)\}/g, "$2");
const sceneKnown = (s, c) => !/[一-鿿]/.test(c) || s.items.some(w => w.k === c) || (KJ_BY[c] && isStamped(KJ_BY[c]));
function sceneKanjiHTML(s, t) {
  return t.split(/(\{[^}]+\})/).map(p => {
    const m = p.match(/^\{([^|]+)\|([^}]+)\}$/); if (!m) return esc(p);
    const [, w, r] = m; const here = c => s.items.some(x => x.k === c);
    return [...w].every(c => sceneKnown(s, c)) ? [...w].map(c => here(c) ? `<b>${esc(c)}</b>` : esc(c)).join("") : `<ruby>${esc(w)}<rt>${esc(r)}</rt></ruby>`;
  }).join("");
}
function sceneTextHTML(s, t, en) {
  const read = sceneRead(t);
  const body = S.role === "kanji" ? `<span class="glyph">${sceneKanjiHTML(s, t)}</span>` : `<span class="glyph">${esc(read)}</span><small class="ro">${esc(romaji(kataToHira(read)))}</small>`;
  return `${body}${en ? `<small class="en">${esc(en)}</small>` : ""}`;
}
function sceneLineHTML(s, [who, t, en]) {
  const say = esc(sceneRead(t));
  return who === "sign" ? `<button class="scsign" data-say="${say}">${sceneTextHTML(s, t, en)}</button>`
    : `<div class="scline ${who}">${IMGW(SCENE_WHO[who], 34)}<button class="scbubble" data-say="${say}">${sceneTextHTML(s, t, en)}</button></div>`;
}
const townScenes = s => (!s.track.kana && SCENES[s.stop.p]) || [];
const sceneDone = sc => !!(S.scenes || {})[sc.id];
function scenesHTML(s) {
  const list = townScenes(s); if (!list.length) return "";
  const done = list.filter(sceneDone).length;
  return `<div class="card scenecard" style="--lv:${LINE_INK[s.track.id]}"><div class="row" style="gap:8px">${IMGW("book", 28)}<div style="flex:1;min-width:0"><h3>Little scenes in ${esc(s.stop.ro)}</h3><p class="muted" style="font-size:.78rem">Short moments around town that use this stop's kanji. Play them before or after the test.</p></div><span class="pill">${done}/${list.length}</span></div>
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
        ${sc.lines.map(l => sceneLineHTML(s, l)).join("")}
        ${solved ? `${sc.after.map(l => sceneLineHTML(s, l)).join("")}<div class="scnote">${esc(sc.note)}</div><p class="muted scfact">${IMGW("sparkles", 18)}<span>${esc(sc.fact)}</span></p>
          <div class="row" style="justify-content:center">${list[i + 1] ? `<button class="btn" id="nextsc">Next scene</button>` : ""}<button class="btn ghost" id="backstop">Back to ${esc(s.stop.ro)}</button></div>`
        : `<div class="sctask"><b>${esc(sc.task.q)}</b><div class="scopts">${sc.task.opts.map((o, j) => `<button class="scopt" data-opt="${j}">${sceneTextHTML(s, o)}</button>`).join("")}</div></div>`}</div>`;
      $$("[data-opt]", st).forEach(b => b.onclick = () => {
        if (+b.dataset.opt !== sc.task.a) { SFX.bad(); b.classList.add("shake", "no"); setTimeout(() => b.classList.remove("shake"), 400); return; }
        SFX.good(); say(sceneRead(sc.task.opts[sc.task.a])); solved = true;
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
