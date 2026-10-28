// ===== The rail map: every sub-level is a real station, and clearing it lays track there =====
ALL_SUBS.forEach((s, i) => { s.stop = ROUTE[i]; });
const LINE_INK = Object.assign({ kana: "#2E6FA8" }, STAMP_INK);
const LINE_NAME = { kana: "Tokyo loop", n5: "Tōkaidō line", n4: "Kansai & Sanyō", n3: "Kyushu & Shikoku", n2: "San'in, Hokuriku & the Alps", n1: "Kantō, Tōhoku & Hokkaido" };
const visited = s => subStars(s) > 0;
const lastVisited = () => { let v = null; for (const s of ALL_SUBS) if (visited(s)) v = s; return v; };
const prefName = s => PREF_NAMES[s.stop.pref] || "";
let MAP_ALL = false;

function railMapHTML(track) {
  const all = MAP_ALL || !track;
  const focus = all ? ALL_SUBS : [...(track.subs[0].idx ? [ALL_SUBS[track.subs[0].idx - 1]] : []), ...track.subs];
  const xs = focus.map(s => s.stop.x), ys = focus.map(s => s.stop.y);
  let x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const minSpan = all ? 0 : track.kana ? 14 : 70; const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  let w = Math.max(x1 - x0, minSpan), h = Math.max(y1 - y0, minSpan);
  w *= 1.25; h *= 1.25;
  const aspect = .82; if (h / w < aspect) h = w * aspect; else w = h / aspect;
  if (all) { w = Math.max(w, 1320); h = w * (1520 / 1320); }
  const vb = [cx - w / 2, cy - h / 2, w, h]; const k = w / 340;
  const cur = lastVisited(); const nx = nextSub();
  const seg = (a, b) => `M${a.stop.x},${a.stop.y}L${b.stop.x},${b.stop.y}`;
  let built = "", planned = "", ahead = "";
  for (let i = 1; i < ALL_SUBS.length; i++) { const a = ALL_SUBS[i - 1], b = ALL_SUBS[i]; if (visited(b) && visited(a)) built += seg(a, b); else if (b === nx && visited(a)) planned += seg(a, b); else if (!all && focus.includes(b) && focus.includes(a)) ahead += seg(a, b); }
  const labeled = []; const near = (s) => labeled.some(p => Math.hypot(p.x - s.stop.x, p.y - s.stop.y) < 26 * k);
  const dots = focus.map(s => {
    const v = visited(s), open = subUnlocked(s), isNext = s === nx; const r = (isNext ? 7 : v ? 5.5 : 3.6) * k * (all ? .6 : 1);
    const fill = v ? LINE_INK[s.track.id] : isNext ? "var(--sakura)" : "var(--surface)";
    const label = !all && (v || isNext || open) && !near(s) ? (labeled.push(s.stop), `<text x="${s.stop.x + 8 * k}" y="${s.stop.y + 4 * k}" font-size="${(isNext ? 13 : 11) * k}" class="ml ${isNext ? "mlnext" : ""}">${esc(s.stop.p)}</text>`) : "";
    return `<g class="mstop ${open ? "tap" : ""}" ${open ? `data-sub="${s.id}"` : ""}><circle cx="${s.stop.x}" cy="${s.stop.y}" r="${r * 2.2}" fill="transparent"/>${isNext ? `<circle cx="${s.stop.x}" cy="${s.stop.y}" r="${r * 1.9}" class="mpulse"/>` : ""}<circle cx="${s.stop.x}" cy="${s.stop.y}" r="${r}" fill="${fill}" stroke="${v ? "var(--surface)" : open ? "var(--sakura)" : "var(--coast)"}" stroke-width="${1.6 * k * (all ? .6 : 1)}"/>${label}</g>`;
  }).join("");
  const here = cur || ALL_SUBS[0]; const tk = 30 * k * (all ? .8 : 1);
  const train = EMO.train ? `<image href="${EMO.train}" x="${here.stop.x - tk / 2}" y="${here.stop.y - tk - 4 * k}" width="${tk}" height="${tk}" class="mtrain"/>` : "";
  return `<div class="railmap-wrap"><svg class="railmap" viewBox="${vb.map(n => n.toFixed(1)).join(" ")}" role="img" aria-label="Rail map of Japan showing ${ALL_SUBS.filter(visited).length} stations reached">
    <rect x="${vb[0]}" y="${vb[1]}" width="${vb[2]}" height="${vb[3]}" fill="var(--sea)"/>
    <path d="${JAPAN_PATH}" fill="var(--land)" stroke="var(--coast)" stroke-width="${1.2 * k}" stroke-linejoin="round"/>
    ${ahead ? `<path d="${ahead}" fill="none" stroke="var(--coast)" stroke-width="${1.6 * k}" stroke-dasharray="${2 * k} ${4 * k}" stroke-linecap="round" opacity=".8"/>` : ""}
    ${built ? `<path d="${built}" fill="none" stroke="var(--rail)" stroke-width="${5 * k * (all ? .6 : 1)}" stroke-linecap="round" stroke-linejoin="round"/><path d="${built}" fill="none" stroke="var(--tie)" stroke-width="${2.2 * k * (all ? .6 : 1)}" stroke-dasharray="${1.4 * k} ${2.6 * k}" stroke-linejoin="round"/>` : ""}
    ${planned ? `<path d="${planned}" fill="none" stroke="var(--sakura)" stroke-width="${2.6 * k}" stroke-dasharray="${5 * k} ${4 * k}" stroke-linecap="round" class="mplanned"/>` : ""}
    ${dots}${train}</svg>
    <div class="maptoggle"><button class="chip ${MAP_ALL ? "" : "on"}" data-map="line">${IMGW("tracks", 18)}This line</button><button class="chip ${MAP_ALL ? "on" : ""}" data-map="all">${IMGW("train", 18)}All Japan</button></div></div>`;
}
function bindRailMap(root) {
  $$(".mstop.tap", root).forEach(g => g.addEventListener("click", () => openSub(SUB_BY[g.dataset.sub])));
  $$("[data-map]", root).forEach(b => b.onclick = () => { MAP_ALL = b.dataset.map === "all"; render(); });
}
function stationCardHTML(s, label = "Next stop") {
  if (!s) return "";
  return `<div class="stationcard" style="--lv:${LINE_INK[s.track.id]}"><div class="stbar"><span>${esc(label)}</span><span>${esc(LINE_NAME[s.track.id])} · ${esc(s.title)}</span></div>
    <div class="stbody"><div class="stname"><span class="glyph">${esc(s.stop.p)}</span><small>${esc(s.stop.r)} · ${esc(s.stop.ro)}</small></div>
    <p>${esc(s.stop.f)}</p><span class="pill">${esc(prefName(s))}</span></div></div>`;
}

// Station stamps: the real 駅スタンプ you collect at each stop, inked in the line's color
function stationStampHTML(s, size = 96, extra = "") {
  const ink = LINE_INK[s.track.id]; const rot = (hashStr(s.id) % 13) - 6; const uid = "ss" + s.idx + "_" + size;
  const shape = ["circle", "square", "oct"][s.idx % 3]; const name = s.stop.p; const n = [...name].length;
  const fs = n <= 2 ? 32 : n === 3 ? 26 : n === 4 ? 21 : 17;
  const rec = S.subs[s.id] || {}; const date = (rec.first || rec.date || "").replace(/-/g, ".");
  const outline = shape === "circle" ? `<circle cx="50" cy="50" r="46" fill="none" stroke="${ink}" stroke-width="3.5"/><circle cx="50" cy="50" r="40.5" fill="none" stroke="${ink}" stroke-width="1"/>`
    : shape === "square" ? `<rect x="5" y="5" width="90" height="90" rx="14" fill="none" stroke="${ink}" stroke-width="3.5"/><rect x="10.5" y="10.5" width="79" height="79" rx="10" fill="none" stroke="${ink}" stroke-width="1"/>`
    : `<polygon points="31,4 69,4 96,31 96,69 69,96 31,96 4,69 4,31" fill="none" stroke="${ink}" stroke-width="3.5"/><polygon points="33.5,10 66.5,10 90,33.5 90,66.5 66.5,90 33.5,90 10,66.5 10,33.5" fill="none" stroke="${ink}" stroke-width="1"/>`;
  return `<div class="stamp station ${extra}" style="--ink:${ink};--rot:${rot}deg;width:${size}px;height:${size}px"><svg viewBox="0 0 100 100" aria-hidden="true">${outline}
    <text x="50" y="26" font-size="7.5" font-weight="800" fill="${ink}" text-anchor="middle" letter-spacing="1.2">${esc(s.stop.ro.toUpperCase().slice(0, 16))}</text>
    <line x1="24" y1="31" x2="76" y2="31" stroke="${ink}" stroke-width=".8"/>
    <text x="50" y="${57 + (32 - fs) * .25}" font-size="${fs}" fill="${ink}" text-anchor="middle" font-family="Klee One, serif" font-weight="600">${esc(name)}</text>
    <line x1="24" y1="67" x2="76" y2="67" stroke="${ink}" stroke-width=".8"/>
    <text x="50" y="76" font-size="7" font-weight="800" fill="${ink}" text-anchor="middle" letter-spacing=".6">${esc(prefName(s).toUpperCase())} · ${esc(s.track.jp)}</text>
    ${date ? `<text x="50" y="85" font-size="6.5" fill="${ink}" text-anchor="middle" letter-spacing=".8" font-family="ui-monospace, monospace">${esc(date)}</text>` : ""}</svg></div>`;
}
function stationStampsHTML() {
  const got = ALL_SUBS.filter(visited).length;
  return `<section class="stampbook"><header class="row"><h2>Station stamps</h2><span class="spacer"></span><span class="pill pink">${got}/${ALL_SUBS.length} stations</span></header>
    <p class="muted" style="font-size:.85rem">One 駅スタンプ for every stop on the line. Clear a stop's sub-level to ride there and stamp it.</p>
    ${TRACKS.map(t => { const g = t.subs.filter(visited).length; return `<details class="stamppage" data-spage="${t.id}" ${BOOK_OPEN["st_" + t.id] ? "open" : ""}><summary class="stamppage-h">${IMGW(t.icon, 24)}<h3>${esc(LINE_NAME[t.id])}</h3><span class="spacer"></span>${g === t.subs.length ? `<span class="kanseal">完</span>` : `<small>${g}/${t.subs.length}</small>`}</summary><div class="pagebody">${BOOK_OPEN["st_" + t.id] ? stationGridHTML(t) : ""}</div></details>`; }).join("")}
  </section>`;
}
function stationGridHTML(t) {
  return `<div class="stampgrid">${t.subs.map(s => visited(s) ? `<button class="stampslot" data-station="${s.id}" aria-label="${esc(s.stop.ro)}">${stationStampHTML(s, 80)}<small>${esc(s.stop.ro)}</small></button>` : `<div class="stampslot"><div class="empty sm">${esc(s.num)}</div><small>${subUnlocked(s) ? esc(s.stop.p) : "???"}</small></div>`).join("")}</div>`;
}
function bindStationStamps(root) {
  $$("details.stamppage[data-spage]", root).forEach(d => d.addEventListener("toggle", () => { const t = TRACKS.find(x => x.id === d.dataset.spage); BOOK_OPEN["st_" + t.id] = d.open; const body = $(".pagebody", d); if (d.open && !body.innerHTML) { body.innerHTML = stationGridHTML(t); bindStationClicks(body); } }));
  bindStationClicks(root);
}
function bindStationClicks(root) {
  $$("[data-station]", root).forEach(b => b.onclick = () => { const s = SUB_BY[b.dataset.station]; openPlay(s.stop.p, st => { st.innerHTML = `<div class="stampbook" style="display:flex;justify-content:center;padding:24px">${stationStampHTML(s, 190, "thunk")}</div>${stationCardHTML(s, "Station")}<div class="row" style="justify-content:center"><button class="btn" id="gosub">Open ${esc(s.title)}</button></div>`; $("#gosub", st).onclick = () => openSub(s); }); });
}
