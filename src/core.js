// ===== core: state, helpers, drag & drop, sound, shell =====
const APP_NAME = "Oishii";
const SAVE_KEY = "kanaGarden.v1";
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const IMG = k => `<img class="em" src="${EMO[k] || ""}" alt="" draggable="false">`;
const IMGW = (k, w) => `<img class="em" src="${EMO[k] || ""}" alt="" draggable="false" style="width:${w}px;height:${w}px">`;
const ALL_KANA = ROWS.flatMap(r => r.kana.map(([k, ro]) => ({ k, ro, row: r.id })));
const KANA_RO = Object.fromEntries(ALL_KANA.map(x => [x.k, x.ro]));
const KANA_ROW = Object.fromEntries(ALL_KANA.map(x => [x.k, x.row]));
const KANA_VOWEL = Object.fromEntries(ALL_KANA.map(x => [x.k, x.ro.slice(-1)]));
const BASIC = new Set(ALL_KANA.map(x => x.k));
const isBasic = s => [...s].every(c => BASIC.has(c));
const wkey = w => w.k + "|" + w.r;

// ---- kana -> romaji (handles dakuten, small ya/yu/yo, small tsu, long vowels as written)
const RO_EXTRA = {"が":"ga","ぎ":"gi","ぐ":"gu","げ":"ge","ご":"go","ざ":"za","じ":"ji","ず":"zu","ぜ":"ze","ぞ":"zo","だ":"da","ぢ":"ji","づ":"zu","で":"de","ど":"do",
"ば":"ba","び":"bi","ぶ":"bu","べ":"be","ぼ":"bo","ぱ":"pa","ぴ":"pi","ぷ":"pu","ぺ":"pe","ぽ":"po","ゃ":"ya","ゅ":"yu","ょ":"yo","ー":"-"};
function romaji(s) {
  let out = "", i = 0; const a = [...s];
  while (i < a.length) {
    const c = a[i], n = a[i + 1];
    if (c === "っ") { const nx = romaji(a.slice(i + 1).join("")); out += nx ? nx[0] : ""; i++; continue; }
    let r = c === "を" ? "o" : (KANA_RO[c] || RO_EXTRA[c] || c);
    if (n && "ゃゅょ".includes(n)) { const y = RO_EXTRA[n]; r = (r.endsWith("i") ? r.slice(0, -1) : r); if (/^(sh|ch|j)$/.test(r)) r += y.slice(1); else r += y; i += 2; out += r; continue; }
    out += r; i++;
  }
  return out;
}
// romaji for sentences: particle は written "wa", へ "e"
function romajiSentence(kanaWords) { return kanaWords.map(w => w === "は" ? "wa" : w === "へ" ? "e" : w === "を" ? "o" : romaji(w)).join(" "); }

// ---- numbers
const DIG = ["", "一", "二", "三", "四", "五", "六", "七", "八", "九"];
function toKanji(n) {
  if (n === 0) return "零"; let s = "";
  const man = Math.floor(n / 10000); if (man) { s += toKanji(man) + "万"; n %= 10000; }
  const units = [[1000, "千"], [100, "百"], [10, "十"]];
  for (const [u, ch] of units) { const d = Math.floor(n / u); if (d) { s += (d === 1 ? "" : DIG[d]) + ch; } n %= u; }
  if (n) s += DIG[n]; return s;
}
const RD = ["", "いち", "に", "さん", "よん", "ご", "ろく", "なな", "はち", "きゅう"];
function toYomi(n) {
  let s = "";
  const man = Math.floor(n / 10000); if (man) { s += toYomi(man) + "まん"; n %= 10000; }
  const th = Math.floor(n / 1000); if (th) { s += th === 1 ? "せん" : th === 3 ? "さんぜん" : th === 8 ? "はっせん" : RD[th] + "せん"; } n %= 1000;
  const hu = Math.floor(n / 100); if (hu) { s += hu === 1 ? "ひゃく" : hu === 3 ? "さんびゃく" : hu === 6 ? "ろっぴゃく" : hu === 8 ? "はっぴゃく" : RD[hu] + "ひゃく"; } n %= 100;
  const te = Math.floor(n / 10); if (te) { s += te === 1 ? "じゅう" : RD[te] + "じゅう"; } n %= 10;
  if (n) s += RD[n]; return s;
}

// ---- seeded random
function hashStr(s) { let h = 1779033703 ^ s.length; for (let i = 0; i < s.length; i++) { h = Math.imul(h ^ s.charCodeAt(i), 3432918353); h = h << 13 | h >>> 19; } return (h >>> 0); }
function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function makeRng(seed) { const r = mulberry(hashStr(String(seed))); return { f: r, int: n => Math.floor(r() * n), pick: a => a[Math.floor(r() * a.length)], shuffle: a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; } }; }
const RND = makeRng(Date.now() + ":" + Math.random());
function todayKey(d = new Date()) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
function dayDifficulty(d = new Date()) { return [1, .15, .3, .45, .6, .75, .9][d.getDay()]; }
const DAYNAME = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// ---- state
const DEFAULT = () => ({ v: 1, name: "", role: "kana", romaji: true, sound: true, kana: {}, words: {}, buds: {}, daily: {}, best: {}, streak: { count: 0, last: "" }, served: 0 });
let S = DEFAULT();
try { const raw = localStorage.getItem(SAVE_KEY); if (raw) S = Object.assign(DEFAULT(), JSON.parse(raw)); } catch (e) { }
function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { } }
const now = () => Date.now();
const DAY = 864e5;
function kanaStage(k) { const s = S.kana[k]; if (!s) return -1; return s.pts >= 7 ? 2 : s.pts >= 3 ? 1 : 0; }
function isWilting(k) { const s = S.kana[k]; return s && now() - (s.last || 0) > 2 * DAY; }
function waterKana(k, ok = true) { const s = S.kana[k]; if (!s) return; if (ok) s.pts = Math.min(20, s.pts + 1); s.last = now(); }
function wordState(w) { return S.words[wkey(w)] || null; }
function touchWord(w, ok = true, found = true) {
  const key = wkey(w); const s = S.words[key] || (S.words[key] = { pts: 0, last: 0, found: false, miss: 0 });
  const isNew = found && !s.found;
  if (found) s.found = true; if (isNew) s.stamped = todayKey(); if (ok) s.pts = Math.min(30, s.pts + 1); else s.miss++; s.last = now();
  if (ok) [...w.r].forEach(c => waterKana(c, true));
  return isNew;
}
// ---- station-stamp (駅スタンプ) style kanji stamps
const STAMP_INK = { nature: "#C8402E", people: "#3B5BA9", animals: "#2E8A6E", food: "#B4511E", things: "#6A4AA0", colors: "#B8336A" };
function stampHTML(w, size = 96, extra = "") {
  const rot = (hashStr(w.k + w.r) % 17) - 8; const ink = STAMP_INK[w.t] || "#C8402E";
  return `<div class="stamp ${extra}" style="--ink:${ink};--rot:${rot}deg;--sz:${size}px;width:${size}px;height:${size}px"><svg viewBox="0 0 100 100" aria-hidden="true"><defs><path id="arc${w.id}" d="M 16 50 A 34 34 0 0 1 84 50"/><path id="arcb${w.id}" d="M 14 56 A 36 36 0 0 0 86 56"/></defs>
  <circle cx="50" cy="50" r="46" fill="none" stroke="var(--ink)" stroke-width="3.5"/><circle cx="50" cy="50" r="40" fill="none" stroke="var(--ink)" stroke-width="1.2" stroke-dasharray="2 2.5"/>
  <text font-size="8.5" font-weight="800" fill="var(--ink)" letter-spacing="1.5"><textPath href="#arc${w.id}" startOffset="50%" text-anchor="middle">${esc(w.r)} · ${esc(w.ro.toUpperCase())}</textPath></text>
  <text font-size="7" font-weight="800" fill="var(--ink)" letter-spacing="1"><textPath href="#arcb${w.id}" startOffset="50%" text-anchor="middle">${esc(w.en.toUpperCase().slice(0, 18))}</textPath></text></svg>
  <span class="stamp-k">${esc(w.k)}</span><img class="em stamp-e" src="${EMO[w.e] || ""}" alt=""></div>`;
}
const STAMP_Q = []; let stampBusy = false;
function stampNow(w) { STAMP_Q.push(w); if (!stampBusy) nextStamp(); }
function nextStamp() {
  const w = STAMP_Q.shift(); if (!w) { stampBusy = false; return; } stampBusy = true;
  const o = document.createElement("div"); o.className = "stampover"; o.setAttribute("role", "status");
  o.innerHTML = `<div class="stampcard"><span class="eyebrow">New stamp!</span>${stampHTML(w, 170, "thunk")}<div class="glyph" style="font-size:1.2rem">${esc(w.r)} <span class="ro">${esc(w.ro)}</span></div><b>${esc(w.en)}</b><span class="muted" style="font-size:.75rem">Tap to keep collecting</span></div>`;
  document.body.appendChild(o); tone([196, 147], .09, "square", .06); setTimeout(() => SFX.pop(), 250);
  let gone = false; const close = () => { if (gone) return; gone = true; o.remove(); setTimeout(nextStamp, 120); };
  o.onclick = close; setTimeout(close, 2600);
}
function bud(id) { return S.buds[id] || (S.buds[id] = { lvl: 1, xp: 0 }); }
const plantedKana = () => ALL_KANA.filter(x => S.kana[x.k]);
function rowUnlocked(i) { if (i === 0) return true; const prev = ROWS[i - 1]; return prev.kana.every(([k]) => kanaStage(k) >= 1); }
function dailyRec(game) { const d = S.daily[todayKey()]; return d && d[game]; }
function setDaily(game, rec) {
  const t = todayKey(); (S.daily[t] || (S.daily[t] = {}))[game] = rec;
  if (S.streak.last !== t) { const y = todayKey(new Date(now() - DAY)); S.streak.count = S.streak.last === y ? S.streak.count + 1 : 1; S.streak.last = t; }
  // keep only last 40 days of dailies
  const keys = Object.keys(S.daily).sort(); while (keys.length > 40) delete S.daily[keys.shift()];
  save();
}
function streakNow() { const t = todayKey(), y = todayKey(new Date(now() - DAY)); return (S.streak.last === t || S.streak.last === y) ? S.streak.count : 0; }

// ---- sound (tiny synth blips, start after first tap)
let AC = null;
function tone(freqs, dur = .12, type = "sine", gain = .08) {
  if (!S.sound) return;
  try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); const t0 = AC.currentTime;
    freqs.forEach((f, i) => { const o = AC.createOscillator(), g = AC.createGain(); o.type = type; o.frequency.value = f; g.gain.setValueAtTime(0, t0 + i * dur * .7); g.gain.linearRampToValueAtTime(gain, t0 + i * dur * .7 + .01); g.gain.exponentialRampToValueAtTime(.0001, t0 + i * dur * .7 + dur); o.connect(g).connect(AC.destination); o.start(t0 + i * dur * .7); o.stop(t0 + i * dur * .7 + dur + .02); });
  } catch (e) { }
}
const SFX = { good: () => tone([660, 880], .12, "triangle"), bad: () => tone([220, 180], .14, "square", .04), pop: () => tone([523, 659, 784, 1046], .1, "triangle"), tap: () => tone([440], .05, "sine", .04), win: () => tone([523, 659, 784, 1046, 1318], .14, "triangle", .07) };
function say(text) { try { if (!("speechSynthesis" in window)) return; const u = new SpeechSynthesisUtterance(text); u.lang = "ja-JP"; u.rate = .8; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch (e) { } }

// ---- toast + confetti
function toast(msg) { $$(".toast").forEach(t => t.remove()); const t = document.createElement("div"); t.className = "toast"; t.textContent = msg; document.body.appendChild(t); setTimeout(() => t.remove(), 2200); }
function confetti(n = 28) {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const c = document.createElement("div"); c.className = "confetti";
  for (let i = 0; i < n; i++) { const s = document.createElement("span"); s.style.left = Math.random() * 100 + "%"; s.style.setProperty("--dx", (Math.random() * 120 - 60) + "px"); s.style.animationDelay = Math.random() * .5 + "s"; s.style.background = ["var(--sakura)", "var(--sun)", "var(--leaf)", "var(--kin)"][i % 4]; c.appendChild(s); }
  document.body.appendChild(c); setTimeout(() => c.remove(), 2600);
}
async function copyText(text) { try { await navigator.clipboard.writeText(text); toast("Copied! Paste it to your partner."); return true; } catch (e) { toast("Select the text box and copy it."); return false; } }

// ---- drag & drop / tap-to-place
// Elements with data-pick are pickable; elements with data-drop are targets.
// A screen sets DND.onDrop(pickId, dropId, pickEl, dropEl) and optional DND.onTap(pickId, el).
const DND = { sel: null, onDrop: null, onTap: null, root: null };
let drag = null;
function clearSel() { if (DND.sel) { const el = DND.root && DND.root.querySelector(`[data-pick="${CSS.escape(DND.sel)}"]`); el && el.classList.remove("sel"); } DND.sel = null; }
function setSel(id, el) { clearSel(); DND.sel = id; el.classList.add("sel"); }
document.addEventListener("pointerdown", e => {
  const p = e.target.closest("[data-pick]"); if (!p || !DND.onDrop) return;
  drag = { id: p.dataset.pick, el: p, x: e.clientX, y: e.clientY, moved: false, ghost: null, pid: e.pointerId };
});
document.addEventListener("pointermove", e => {
  if (!drag || e.pointerId !== drag.pid) return;
  if (!drag.moved && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 8) {
    drag.moved = true; const r = drag.el.getBoundingClientRect(); const g = drag.el.cloneNode(true); g.classList.add("dragghost"); g.classList.remove("sel"); g.style.width = r.width + "px"; g.style.height = r.height + "px"; g.style.left = 0; g.style.top = 0; g.style.position = "fixed"; document.body.appendChild(g); drag.ghost = g; drag.el.style.opacity = ".35";
  }
  if (drag.moved) { drag.ghost.style.left = e.clientX + "px"; drag.ghost.style.top = e.clientY + "px"; $$("[data-drop].target").forEach(x => x.classList.remove("target")); const z = dropAt(e.clientX, e.clientY); z && z.classList.add("target"); e.preventDefault(); }
}, { passive: false });
function dropAt(x, y) { const els = document.elementsFromPoint(x, y); for (const el of els) { const z = el.closest && el.closest("[data-drop]"); if (z && !z.classList.contains("dragghost")) return z; } return null; }
function endDrag(e) {
  if (!drag || (e && e.pointerId !== drag.pid)) return; const d = drag; drag = null;
  $$("[data-drop].target").forEach(x => x.classList.remove("target"));
  if (d.moved) { d.ghost.remove(); d.el.style.opacity = ""; const z = e ? dropAt(e.clientX, e.clientY) : null; if (z && DND.onDrop) { clearSel(); DND.onDrop(d.id, z.dataset.drop, d.el, z); } return; }
  // tap
  if (DND.onTap && DND.onTap(d.id, d.el) === false) return;
  if (DND.sel === d.id) clearSel(); else { setSel(d.id, d.el); SFX.tap(); }
}
document.addEventListener("pointerup", endDrag);
document.addEventListener("pointercancel", e => { if (drag) { drag.ghost && drag.ghost.remove(); drag.el.style.opacity = ""; drag = null; } });
document.addEventListener("click", e => {
  if (!DND.onDrop || !DND.sel) return; const z = e.target.closest("[data-drop]"); if (!z || e.target.closest("[data-pick]")) return;
  const id = DND.sel; const el = DND.root && DND.root.querySelector(`[data-pick="${CSS.escape(id)}"]`); clearSel(); DND.onDrop(id, z.dataset.drop, el, z);
});
function dndReset(root) { DND.sel = null; DND.onDrop = null; DND.onTap = null; DND.root = root || document; }

// ---- display helpers respecting role + romaji setting
const showRo = () => S.romaji;
function kanaHTML(k, ro = true) { return `<span class="glyph">${esc(k)}</span>${ro && showRo() ? `<span class="ro">${esc(romaji(k))}</span>` : ""}`; }
function readingLine(w) { return `<span class="rd">${esc(w.r)}</span> <span class="ro">${esc(w.ro)}</span>`; }
function wordReveal(w, extra = "") { return `<div class="reveal pop">${IMG(w.e)}<div class="glyph big">${esc(w.k)}</div><div>${readingLine(w)} <button class="iconbtn" data-say="${esc(w.r)}" aria-label="Hear it">${IMGW("speaker", 22)}</button></div><div><b>${esc(w.en)}</b></div>${extra}</div>`; }
document.addEventListener("click", e => { const b = e.target.closest("[data-say]"); if (b) say(b.dataset.say); });

// ---- play overlay
let PLAY = null; // {destroy}
function openPlay(title, mount, opts = {}) {
  closePlay(true);
  const wrap = document.createElement("div"); wrap.className = "play"; wrap.setAttribute("role", "dialog"); wrap.setAttribute("aria-label", title);
  wrap.innerHTML = `<div class="inner"><div class="playhead"><button class="iconbtn" data-close aria-label="Back">←</button><h2>${title}</h2><div class="hud" id="hud"></div></div><div id="stage" class="stack"></div></div>`;
  document.body.appendChild(wrap); document.body.style.overflow = "hidden";
  wrap.querySelector("[data-close]").onclick = () => closePlay();
  dndReset(wrap);
  PLAY = { wrap, destroy: null, onClose: opts.onClose };
  PLAY.destroy = mount($("#stage", wrap), $("#hud", wrap)) || null;
}
function closePlay(silent) {
  if (!PLAY) return; try { PLAY.destroy && PLAY.destroy(); } catch (e) { }
  PLAY.wrap.remove(); const oc = PLAY.onClose; PLAY = null; document.body.style.overflow = ""; dndReset(document); if (!silent) { oc && oc(); render(); }
}
function resultScreen(stage, { icon = "trophy", title, score, lines = [], share = "", again, againLabel = "Play again" }) {
  stage.innerHTML = `<div class="card result pop">${IMG(icon).replace('class="em"', 'class="em big"')}<h2>${esc(title)}</h2>${score ? `<div class="score">${esc(score)}</div>` : ""}${lines.map(l => `<p>${l}</p>`).join("")}
  ${share ? `<div class="sharebox" id="sharebox">${esc(share)}</div><button class="btn pink" id="sharebtn">Copy result</button>` : ""}
  <div class="row" style="justify-content:center">${again ? `<button class="btn ghost" id="again">${esc(againLabel)}</button>` : ""}<button class="btn" id="done">Back</button></div></div>`;
  share && ($("#sharebtn", stage).onclick = () => copyText(share));
  again && ($("#again", stage).onclick = again);
  $("#done", stage).onclick = () => closePlay();
}
const fmtTime = ms => { const s = Math.round(ms / 1000); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); };

// ---- WaniKani-style typing: romaji turns into kana as you type (WanaKana, by the WaniKani team)
const FALLBACK_KANA = (() => { const m = {}; ALL_KANA.forEach(x => { if (x.k !== "を") m[x.ro] = x.k; }); Object.assign(m, { wo: "を", nn: "ん", si: "し", ti: "ち", tu: "つ", hu: "ふ", zi: "じ", ga: "が", gi: "ぎ", gu: "ぐ", ge: "げ", go: "ご", za: "ざ", ji: "じ", zu: "ず", ze: "ぜ", zo: "ぞ", da: "だ", de: "で", do: "ど", ba: "ば", bi: "び", bu: "ぶ", be: "べ", bo: "ぼ", pa: "ぱ", pi: "ぴ", pu: "ぷ", pe: "ぺ", po: "ぽ" }); return m; })();
function toHira(s) {
  if (window.wanakana) return wanakana.toHiragana(s);
  let out = "", i = 0; s = s.toLowerCase();
  while (i < s.length) { let hit = false; for (const L of [3, 2, 1]) { const ch = s.slice(i, i + L); if (FALLBACK_KANA[ch]) { out += FALLBACK_KANA[ch]; i += L; hit = true; break; } } if (!hit) { if (s[i] === "n") out += "ん"; else out += s[i]; i++; } }
  return out;
}
function bindKana(input) { input.setAttribute("autocapitalize", "none"); input.setAttribute("autocomplete", "off"); input.setAttribute("autocorrect", "off"); input.setAttribute("spellcheck", "false"); input.setAttribute("lang", "ja"); try { if (window.wanakana) wanakana.bind(input, { IMEMode: "toHiragana" }); } catch (e) { } }
const readInput = input => toHira(input.value.trim());
