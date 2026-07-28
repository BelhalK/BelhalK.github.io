const svg = (path) => `<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;

const ICONS = {
 globe: svg(`<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>`),
 // github (lucide: github)
 github: svg(`<path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/>`),
 // linkedin (lucide: linkedin)
 linkedin: svg(`<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/>`),
 // google scholar -> graduation cap (lucide: graduation-cap)
 scholar: svg(`<path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>`),
 // map pin (lucide: map-pin)
 map: svg(`<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>`),
 // phone (lucide: phone)
 phone: svg(`<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>`),
 // mail (lucide: mail)
 mail: svg(`<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>`)
};

const state = {
 header: null,
 manifest: null,
 sections: {}, // key -> data object
 editing: false,
};

async function loadJSON(path) {
 const res = await fetch(path, { cache: "no-store" });
 if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
 return res.json();
}

async function boot() {
 try {
 state.header = await loadJSON("data/header.json");
 state.manifest = await loadJSON("data/manifest.json");
 const keys = state.manifest.sections;
 const datas = await Promise.all(keys.map(k => loadJSON(`data/${k}.json`)));
 keys.forEach((k, i) => (state.sections[k] = datas[i]));
 render();
 } catch (err) {
 document.getElementById("resume").innerHTML =
 `<p style="color:#dc2626">Error loading data. If you opened this file directly (file://),
										 your browser may block fetch. Run a local server, e.g.<br>
										 <code>python3 -m http.server</code> in this folder, then open
										 <code>http://localhost:8000</code>.<br><br>${err.message}</p>`;
										 console.error(err);
										}
}

/* ---------- helpers ---------- */
function el(tag, cls, html) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
}

function contactSep() {
    const s = el("span", "sep", "|");
    return s;
}

/* ---------- render ---------- */
function render() {
    const root = document.getElementById("resume");
    root.innerHTML = "";
    root.appendChild(renderHeader(state.header));
    state.manifest.sections.forEach(key => {
	root.appendChild(renderSection(key, state.sections[key]));
    });
    applyEditingClass();
}

function renderHeader(h) {
    const head = el("div", "rz-header");
    head.appendChild(el("div", "rz-name", h.name));

    const contact = el("div", "rz-contact");
    contact.innerHTML =
	`${ICONS.map}${h.location}` +
	`<span class="sep">|</span>${ICONS.phone}${h.phone}` +
	`<span class="sep">|</span>${ICONS.mail}` +
	`<a href="mailto:${h.email}">${h.email}</a>`;
    head.appendChild(contact);

    const links = el("div", "rz-links");
    links.innerHTML = h.links.map(l =>
	`${ICONS[l.icon] || ""}<a href="${l.url}" target="_blank" rel="noopener">${l.label}</a>`
    ).join('<span class="sep">|</span>');
    head.appendChild(links);
    return head;
}

function renderSection(key, data) {
    const sec = el("section", "rz-section");
    sec.dataset.key = key;

    const titleRow = el("div", "rz-section-titlerow");
    const title = el("h2", "rz-section-title", data.title);
    titleRow.appendChild(title);
    titleRow.appendChild(sectionOrderControls(key));
    sec.appendChild(titleRow);
    sec.appendChild(el("hr", "rz-rule"));

    const body = el("div");
    body.className = "rz-section-body";
    sec.appendChild(body);

    renderBody(key, data, body);

    // Add-entry button (edit mode)
    const adder = addButtonFor(key, data);
    if (adder) sec.appendChild(adder);

    return sec;
}

function sectionOrderControls(key) {
    const wrap = el("span", "section-order edit-only");
    const secs = state.manifest.sections;
    const idx = secs.indexOf(key);
    const up = el("button", "sord", "\u2191");
    up.title = "Move section up";
    up.disabled = idx <= 0;
    up.onclick = () => moveSection(key, -1);
    const down = el("button", "sord", "\u2193");
    down.title = "Move section down";
    down.disabled = idx >= secs.length - 1;
    down.onclick = () => moveSection(key, +1);
    const pos = el("span", "sord-pos", `${idx + 1} / ${secs.length}`);
    wrap.appendChild(up);
    wrap.appendChild(pos);
    wrap.appendChild(down);
    return wrap;
}

function moveSection(key, delta) {
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    const secs = state.manifest.sections;
    const i = secs.indexOf(key);
    const j = i + delta;
    if (j < 0 || j >= secs.length) return;
    [secs[i], secs[j]] = [secs[j], secs[i]];
    render();
}

function renderBody(key, data, body) {
    body.innerHTML = "";
    switch (data.type) {
    case "text": body.appendChild(renderText(key, data)); break;
    case "skills": data.entries.forEach((e,i)=>body.appendChild(renderSkill(key,e,i))); wrapSkills(body); break;
    case "entries": data.entries.forEach((e,i)=>body.appendChild(renderEntry(key,e,i,data.compact))); break;
    case "publications": data.entries.forEach((e,i)=>body.appendChild(renderPub(key,e,i))); break;
    case "software": data.entries.forEach((e,i)=>body.appendChild(renderSoft(key,e,i))); break;
    case "honors": data.groups.forEach((g,gi)=>body.appendChild(renderGroup(key,g,gi))); break;
    case "keyvalue": data.entries.forEach((e,i)=>body.appendChild(renderKV(key,e,i))); break;
    case "references": body.appendChild(renderRefs(key,data)); break;
    }
}

/* skills need a table wrapper */
function wrapSkills(body) {
    const rows = Array.from(body.querySelectorAll("tr"));
    const table = el("table", "rz-skills");
    rows.forEach(r => table.appendChild(r));
    body.innerHTML = "";
    body.appendChild(table);
}

/* ---------- editable helpers ---------- */
function editable(node, obj, field) {
    node.dataset.field = field;
    node.classList.add("ed");
    node.setAttribute("data-editable", "true");
    if (state.editing) node.setAttribute("contenteditable", "true");
    node.addEventListener("blur", () => { obj[field] = node.innerHTML.trim(); });
    return node;
}

function ctrls(key, arrayPath, index, opts = {}) {
    const wrap = el("span", "entry-controls edit-only");
    const del = el("button", "del", "✕ remove");
    del.title = "Remove this entry";
    del.onclick = () => { getArray(key, arrayPath).splice(index, 1); render(); };
    wrap.appendChild(del);
    if (opts.canAddItem) {
	const addIt = el("button", "add", "+ bullet");
	addIt.onclick = opts.onAddItem;
	wrap.appendChild(addIt);
    }
    return wrap;
}

function getArray(key, path) {
    // path like "entries" or "groups.0.entries"
    let obj = state.sections[key];
    const parts = path.split(".");
    for (let i = 0; i < parts.length; i++) {
	const p = parts[i];
	obj = isNaN(p) ? obj[p] : obj[parseInt(p, 10)];
    }
    return obj;
}

/* ---------- renderers per type ---------- */
function renderText(key, data) {
    const p = el("p", "rz-text editable-block", data.body);
    return editable(p, data, "body");
}

function renderSkill(key, e, i) {
    const tr = el("tr", "editable-block");
    const td1 = el("td", "cat");
    td1.innerHTML = e.category;
    editable(td1, e, "category");
    const td2 = el("td");
    const detail = el("span");
    detail.innerHTML = e.detail;
    detail.setAttribute("data-editable", "true");
    if (state.editing) detail.setAttribute("contenteditable", "true");
    detail.addEventListener("blur", () => { e.detail = detail.innerHTML.trim(); });
    td2.appendChild(detail);
    td2.appendChild(ctrls(key, "entries", i));
    tr.appendChild(td1); tr.appendChild(td2);
    return tr;
}

function renderEntry(key, e, i, compact) {
    const wrap = el("div", "rz-entry editable-block" + (compact ? " compact" : ""));

    const head = el("div", "rz-entry-head");
    const t = el("span", "rz-entry-title"); t.innerHTML = e.title || "";
    editable(t, e, "title");
    const r = el("span", "rz-entry-right"); r.innerHTML = e.right || "";
    editable(r, e, "right");
    const titleWrap = el("span"); titleWrap.appendChild(t);
    titleWrap.appendChild(ctrls(key, "entries", i, {
	canAddItem: true,
	onAddItem: () => { (e.items = e.items || []).push({ text: "New bullet point." }); render(); }
    }));
    head.appendChild(titleWrap);
    head.appendChild(r);
    wrap.appendChild(head);

    const sub = el("div", "rz-entry-subhead");
    const s = el("span", "rz-entry-sub"); s.innerHTML = e.subtitle || "";
    editable(s, e, "subtitle");
    sub.appendChild(s);
    if (e.date != null) {
	const d = el("span", "rz-entry-date"); d.innerHTML = e.date;
	editable(d, e, "date");
	sub.appendChild(d);
    }
    wrap.appendChild(sub);

    if (e.items && e.items.length) {
	const ul = el("ul", "rz-items");
	e.items.forEach((it, j) => ul.appendChild(renderItem(key, e, it, i, j)));
	wrap.appendChild(ul);
    }
    return wrap;
}

function renderItem(key, entry, it, ei, j) {
    const li = el("li");
    if (it.lead) {
	const lead = el("span", "lead"); lead.innerHTML = it.lead + ": ";
	lead.setAttribute("data-editable", "true");
	if (state.editing) lead.setAttribute("contenteditable", "true");
	lead.addEventListener("blur", () => { it.lead = lead.innerText.replace(/:\s*$/, "").trim(); });
	li.appendChild(lead);
    }
    const txt = el("span"); txt.innerHTML = it.text || "";
    txt.setAttribute("data-editable", "true");
    if (state.editing) txt.setAttribute("contenteditable", "true");
    txt.addEventListener("blur", () => { it.text = txt.innerHTML.trim(); });
    li.appendChild(txt);

    const del = el("button", "del edit-only", "✕");
    del.style.cssText = "margin-left:6px;font-size:10px;padding:1px 5px;border:1px solid #fecaca;color:#dc2626;background:#fff;border-radius:4px;cursor:pointer;";
    del.title = "Remove bullet";
    del.onclick = () => { entry.items.splice(j, 1); render(); };
    li.appendChild(del);
    return li;
}

function renderPub(key, e, i) {
    const w = el("div", "rz-pub editable-block");
    const t = el("div", "p-title"); t.innerHTML = e.titleText; editable(t, e, "titleText");
    t.appendChild(ctrls(key, "entries", i));
    const a = el("div", "p-authors"); a.innerHTML = e.authors; editable(a, e, "authors");
    const v = el("div", "p-venue"); v.innerHTML = e.venue; editable(v, e, "venue");
    w.appendChild(t); w.appendChild(a); w.appendChild(v);
    return w;
}

function renderSoft(key, e, i) {
    const w = el("div", "rz-soft editable-block");
    const head = el("div", "s-head");
    const t = el("span", "s-title"); t.innerHTML = e.titleText; editable(t, e, "titleText");
    const tWrap = el("span"); tWrap.appendChild(t); tWrap.appendChild(ctrls(key, "entries", i));
    const role = el("span", "s-role"); role.innerHTML = e.role; editable(role, e, "role");
    head.appendChild(tWrap); head.appendChild(role);
    const d = el("div", "s-detail"); d.innerHTML = e.detail; editable(d, e, "detail");
    w.appendChild(head); w.appendChild(d);
    return w;
}

function renderGroup(key, g, gi) {
    const w = el("div", "rz-group");
    const h = el("div", "rz-group-head"); h.innerHTML = g.heading; editable(h, g, "heading");
    w.appendChild(h);
    const ul = el("ul", "rz-honor-list icon-" + (g.icon || "star"));
    g.entries.forEach((e, i) => {
	const li = el("li", "editable-block");
	const txt = el("span", "h-text"); txt.innerHTML = e.text;
	txt.setAttribute("data-editable", "true");
	if (state.editing) txt.setAttribute("contenteditable", "true");
	txt.addEventListener("blur", () => { e.text = txt.innerHTML.trim(); });
	const right = el("span", "h-right"); right.innerHTML = e.right || "";
	right.setAttribute("data-editable", "true");
	if (state.editing) right.setAttribute("contenteditable", "true");
	right.addEventListener("blur", () => { e.right = right.innerText.trim(); });
	const del = el("button", "del edit-only", "✕");
	del.style.cssText = "margin-left:6px;font-size:10px;padding:1px 5px;border:1px solid #fecaca;color:#dc2626;background:#fff;border-radius:4px;cursor:pointer;";
	del.onclick = () => { g.entries.splice(i, 1); render(); };
	li.appendChild(txt); li.appendChild(right); li.appendChild(del);
	ul.appendChild(li);
    });
    w.appendChild(ul);
    const add = el("button", "add-entry-btn", "+ Add to " + g.heading.replace(":", ""));
    add.onclick = () => { g.entries.push({ text: "New item.", right: "" }); render(); };
    w.appendChild(add);
    return w;
}

function renderKV(key, e, i) {
    const p = el("p", "rz-kv editable-block");
    const k = el("span", "k"); k.innerHTML = e.key + ": ";
    const v = el("span"); v.innerHTML = e.value;
    v.setAttribute("data-editable", "true");
    if (state.editing) v.setAttribute("contenteditable", "true");
    v.addEventListener("blur", () => { e.value = v.innerHTML.trim(); });
    p.appendChild(k); p.appendChild(v);
    p.appendChild(ctrls(key, "entries", i));
    return p;
}

function renderRefs(key, data) {
    const wrap = el("div", "rz-refs");
    data.entries.forEach((e, i) => {
	const r = el("div", "rz-ref editable-block");
	const n = el("div", "r-name"); n.innerHTML = e.name; editable(n, e, "name");
	n.appendChild(ctrls(key, "entries", i));
	const role = el("div", "r-role"); role.innerHTML = e.role; editable(role, e, "role");
	const em = el("div", "r-email"); em.innerHTML = `Email: <a href="mailto:${e.email}">${e.email}</a>`;
	const emEdit = el("span"); emEdit.innerHTML = e.email;
	emEdit.setAttribute("data-editable", "true");
	if (state.editing) { emEdit.setAttribute("contenteditable", "true"); em.innerHTML = "Email: "; em.appendChild(emEdit); }
	emEdit.addEventListener("blur", () => { e.email = emEdit.innerText.trim(); });
	r.appendChild(n); r.appendChild(role); r.appendChild(em);
	wrap.appendChild(r);
    });
    return wrap;
}

/* ---------- add-entry buttons per section ---------- */
function addButtonFor(key, data) {
    if (data.type === "text" || data.type === "honors") return null;
    const btn = el("button", "add-entry-btn", "+ Add entry");
    btn.onclick = () => {
	const arr = data.entries;
	switch (data.type) {
	case "skills": arr.push({ category: "New Category", detail: "..." }); break;
	case "entries": arr.push({ title: "New Title", right: "Location", subtitle: "Role", date: "Year", items: [{ text: "..." }] }); break;
	case "publications": arr.push({ titleText: "New paper title", authors: "Authors", venue: "Venue, Year" }); break;
	case "software": arr.push({ titleText: "New software", role: "Role", detail: "..." }); break;
	case "keyvalue": arr.push({ key: "Key", value: "Value" }); break;
	case "references": arr.push({ name: "New Name", role: "Role", email: "email@example.com" }); break;
	}
	render();
    };
    return btn;
}

/* ---------- edit mode & export ---------- */
function applyEditingClass() {
    document.body.classList.toggle("editing", state.editing);
}

function toggleEdit() {
    state.editing = !state.editing;
    const btn = document.getElementById("editBtn");
    btn.textContent = state.editing ? "✓ Done Editing" : "✎ Edit";
    btn.classList.toggle("active", state.editing);
    document.getElementById("saveBtn").style.display = state.editing ? "inline-block" : "none";
    render();
}

function exportPDF() {
    const wasEditing = state.editing;
    if (wasEditing) { state.editing = false; applyEditingClass(); render(); }
    setTimeout(() => window.print(), 50);
}

function download(filename, obj) {
    const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
}

function saveAll() {
    // blur any active field to flush edits
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    setTimeout(() => {
	download("header.json", state.header);
	state.manifest.sections.forEach(k => download(`${k}.json`, state.sections[k]));
	alert("Downloaded updated JSON files.\nMove them into the data/ folder to persist changes.");
    }, 60);
}

document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const canEdit = urlParams.get('edit') === 'true';
    if (!canEdit) {
        document.getElementById("editBtn").style.display = "none";
        document.getElementById("saveBtn").style.display = "none";
    }
    document.getElementById("editBtn").onclick = toggleEdit;
    document.getElementById("pdfBtn").onclick = exportPDF;
    document.getElementById("saveBtn").onclick = saveAll;
    boot();
});
