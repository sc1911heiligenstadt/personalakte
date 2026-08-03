let currentUsername = null;
let currentIsAdmin = false;
let currentCanEdit = false;
let currentVorname = null;
let currentNachname = null;

function canEdit() { return currentIsAdmin || currentCanEdit; }

let allTrainers = [];       // roher trainers[]-Array aus fetchOverview()
let ubersichtSuche = "";
let ubersichtLizenz = "";
let archivSuche = "";
let currentDetailUsername = null;
let detailReturnTab = "uebersicht";

const SOURCE_URLS = {
  trainerdaten: "https://sc1911heiligenstadt.github.io/Trainerdaten/",
  trainercheckliste: "https://sc1911heiligenstadt.github.io/TrainerCheckliste/",
  personalkosten: "https://sc1911heiligenstadt.github.io/Personalkosten/",
  kadermanager: "https://sc1911heiligenstadt.github.io/kadermanager/"
};

function escapeHtml(s) {
  return String(s || "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d)) return String(iso);
  return d.toLocaleDateString("de-DE") + ", " + d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }) + " Uhr";
}

function fmtDateOnly(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d)) return String(iso);
  return d.toLocaleDateString("de-DE");
}

// Für reine "YYYY-MM-DD"-Datumsfelder (z.B. Geburtsdatum) ohne Zeitanteil --
// new Date()+toLocaleDateString würde je nach Browser-Zeitzone einen Tag
// verschieben, siehe gleiches Muster in Trainerdatens eigenem _fmtDateOnly.
function fmtBirthdate(isoDate) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate || "");
  return m ? `${m[3]}.${m[2]}.${m[1]}` : "—";
}

function fullName(t) {
  return `${t.vorname || ""} ${t.nachname || ""}`.trim() || t.username;
}

function badge(kind, text) {
  return `<span class="status-badge status-${kind}">${escapeHtml(text)}</span>`;
}

// Bestätigungs-Status für Trainerkodex/Jugendschutzkonzept: beides sind Selbst-
// bestätigungen mit befristeter Gültigkeit (aus Trainerdaten) -- gleiche Darstellung
// wie dort: "Bestätigt am ... · Gültig bis .../Abgelaufen ...".
function bestaetigungWert(bestaetigtAm, gueltig, gueltigBis) {
  if (!bestaetigtAm) return badge("offen", "Noch nicht bestätigt");
  const teil = "Bestätigt am " + escapeHtml(fmtDateOnly(bestaetigtAm));
  if (!gueltigBis) return teil;
  return teil + " · " + (gueltig
    ? badge("ok", "Gültig bis " + fmtDateOnly(gueltigBis))
    : badge("fehlt", "Abgelaufen " + fmtDateOnly(gueltigBis)));
}

function renderChangelog() {
  const list = document.getElementById("changelog-list");
  list.innerHTML = APP_CHANGELOG.map((entry) => `
    <div class="changelog-entry">
      <span class="cv">Version ${escapeHtml(entry.version)}</span>
      ${entry.groups.map((g) => `
        <div class="changelog-group">
          <div class="cg-title">${escapeHtml(g.title)}</div>
          <ul class="cg-items">${g.items.map((i) => `<li>${escapeHtml(i)}</li>`).join("")}</ul>
        </div>
      `).join("")}
    </div>
  `).join("");
}

function renderHeaderUser() {
  const el = document.getElementById("header-user");
  if (!el) return;
  if (!currentUsername) { el.textContent = ""; return; }
  const name = (currentVorname || currentNachname) ? `${currentVorname || ""} ${currentNachname || ""}`.trim() : currentUsername;
  el.textContent = "👤 " + name + (currentIsAdmin ? " (Admin)" : "");
}

function activateTab(name) {
  document.querySelectorAll("nav button[data-tab]").forEach((b) => b.classList.remove("active"));
  document.querySelectorAll(".tab-section").forEach((s) => s.classList.remove("active"));
  const navBtn = document.querySelector(`nav button[data-tab="${name}"]`);
  if (navBtn) navBtn.classList.add("active");
  document.getElementById("tab-" + name).classList.add("active");
}

function setupTabs() {
  document.querySelectorAll("nav button[data-tab]").forEach((b) => {
    b.addEventListener("click", () => activateTab(b.dataset.tab));
  });

  const versionBadgeHeader = document.getElementById("version-badge");
  const openVersionHistory = () => activateTab("info");
  versionBadgeHeader.addEventListener("click", openVersionHistory);
  versionBadgeHeader.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openVersionHistory(); }
  });

  document.getElementById("btn-detail-back").addEventListener("click", () => activateTab(detailReturnTab));
}

// ---------- Übersicht (aktive Trainer) ----------

function populateLizenzFilter() {
  const sel = document.getElementById("filter-lizenz");
  const current = sel.value;
  const values = Array.from(new Set(allTrainers.filter((t) => !t.archiviert && t.lizenz).map((t) => t.lizenz))).sort();
  sel.innerHTML = '<option value="">Alle Lizenzen</option>' + values.map((v) => `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join("");
  if (values.includes(current)) sel.value = current;
}

function trainercheckisteBadges(t) {
  const zugang = t.trainercheckliste.zugang.abgeschlossen ? badge("ok", "Zugang ✓") : badge("offen", "Zugang offen");
  const abgang = t.trainercheckliste.abgang.abgeschlossen ? badge("ok", "Abgang ✓") : "";
  return zugang + abgang;
}

// Suche/Lizenzfilter + Sortierung — einzige Quelle für "was ist gerade sichtbar",
// genutzt von renderUebersicht() (Bildschirmliste) UND vom CSV-Export
// (exportTrainerCsv), damit beide garantiert dieselbe Menge zeigen/exportieren.
function filteredTrainers() {
  const suche = ubersichtSuche.trim().toLowerCase();
  return allTrainers
    .filter((t) => !t.archiviert)
    .filter((t) => !ubersichtLizenz || t.lizenz === ubersichtLizenz)
    .filter((t) => !suche || fullName(t).toLowerCase().includes(suche))
    .sort((a, b) => a.nachname.localeCompare(b.nachname, "de"));
}

function renderUebersicht() {
  const wrap = document.getElementById("uebersicht-rows");
  const rows = filteredTrainers();
  updateExportInfoLine();

  document.getElementById("uebersicht-empty").style.display = rows.length ? "none" : "block";
  wrap.innerHTML = rows.map((t) => `
    <div class="trainer-row" data-username="${escapeHtml(t.username)}" data-from-tab="uebersicht">
      <div class="trainer-row-main">
        <span class="trainer-row-name">${escapeHtml(fullName(t))}</span>
        <span class="trainer-row-meta">${escapeHtml(t.lizenz || "ohne Lizenz")}${t.mannschaften.length ? " · " + escapeHtml(t.mannschaften.join(", ")) : ""}</span>
      </div>
      <div class="trainer-row-badges">
        ${t.trainerkodex.bestaetigt ? badge("ok", "Kodex ✓") : badge("offen", "Kodex offen")}
        ${t.trainerdaten.jugendschutzBestaetigtAm ? badge("ok", "Jugendschutz ✓") : badge("offen", "Jugendschutz offen")}
        ${t.trainerdaten.fuehrungszeugnisEingereichtAm ? badge("ok", "Führungszeugnis ✓") : badge("offen", "Führungszeugnis offen")}
        ${t.trainerdaten.status === "generiert" ? badge("ok", "Vertrag ✓") : (t.trainerdaten.vorhanden ? badge("offen", "Vertrag ausstehend") : badge("fehlt", "Trainerdaten fehlen"))}
        ${trainercheckisteBadges(t)}
      </div>
    </div>
  `).join("");
}

// ---------- CSV-Export (konfigurierbar) ----------
// Jedes Feld einzeln per Checkbox wählbar (EXPORT_FIELD_GROUPS in config.js).
// Exportiert immer genau die aktuell gefilterte/gesuchte Übersicht (filteredTrainers()) —
// die Archiv-Liste hat einen eigenen Filter/eigene Ansicht und ist bewusst nicht Teil
// dieses Exports.
function getPath(obj, path) {
  return path.split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj);
}
function initExportPanel() {
  renderExportFieldCheckboxes();
  document.getElementById("btn-export-toggle").addEventListener("click", () => {
    const panel = document.getElementById("export-panel");
    const willOpen = panel.style.display === "none";
    panel.style.display = willOpen ? "" : "none";
    if (willOpen) updateExportInfoLine();
  });
  document.getElementById("btn-export-felder-alle").addEventListener("click", () => setAllExportCheckboxes(true));
  document.getElementById("btn-export-felder-keine").addEventListener("click", () => setAllExportCheckboxes(false));
  document.getElementById("btn-export-csv").addEventListener("click", exportTrainerCsv);
}
function renderExportFieldCheckboxes() {
  const wrap = document.getElementById("export-field-groups");
  wrap.innerHTML = EXPORT_FIELD_GROUPS.map((group) => `
    <div style="font-size:13px; font-weight:700; color:var(--blue); text-transform:uppercase; letter-spacing:0.3px; margin:14px 0 8px;">${escapeHtml(group.title)}</div>
    <div class="kv-grid">
      ${group.fields.map((f) => `
        <label style="display:flex; align-items:center; gap:6px; font-size:13px; cursor:pointer;">
          <input type="checkbox" class="export-field-cb" data-field="${escapeHtml(f.key)}" checked /> ${escapeHtml(f.label)}
        </label>
      `).join("")}
    </div>
  `).join("");
  wrap.querySelectorAll(".export-field-cb").forEach((cb) => cb.addEventListener("change", updateExportInfoLine));
}
function setAllExportCheckboxes(checked) {
  document.querySelectorAll(".export-field-cb").forEach((cb) => { cb.checked = checked; });
  updateExportInfoLine();
}
function updateExportInfoLine() {
  const el = document.getElementById("export-info-line");
  if (!el) return;
  const total = document.querySelectorAll(".export-field-cb").length;
  const checked = document.querySelectorAll(".export-field-cb:checked").length;
  const rowCount = filteredTrainers().length;
  el.textContent = `${checked} von ${total} Feldern ausgewählt · exportiert ${rowCount} Trainer (aktuelle Suche/Filter).`;
}
function csvCell(value) {
  const s = value == null ? "" : String(value);
  return /[;"\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}
function csvFmtDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d)) return String(iso);
  return d.toLocaleDateString("de-DE") + ", " + d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
}
function csvFmtDateOnly(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || "");
  return m ? `${m[3]}.${m[2]}.${m[1]}` : (iso || "");
}
function exportFieldValue(f, t) {
  if (f.type === "eingereicht") {
    const v = t.trainerdaten.unterschriftAm || t.trainerdaten.erstelltAm;
    return v ? csvFmtDate(v) : "";
  }
  if (f.type === "tdstatus") {
    if (!t.trainerdaten.vorhanden) return "Kein Datensatz";
    const labels = { unvollstaendig: "Unvollständig", ausstehend: "Ausstehend", generiert: "Vertrag generiert" };
    return labels[t.trainerdaten.status] || t.trainerdaten.status || "";
  }
  const v = getPath(t, f.key);
  switch (f.type) {
    case "date": return v ? csvFmtDate(v) : "";
    case "dateonly": return v ? csvFmtDateOnly(v) : "";
    case "bool": return v ? "Ja" : "Nein";
    case "join": return Array.isArray(v) ? v.join(", ") : "";
    case "archivstatus": return v ? "Archiviert" : "Aktiv";
    default: return v == null ? "" : v;
  }
}
function exportTrainerCsv() {
  const selectedKeys = Array.from(document.querySelectorAll(".export-field-cb:checked")).map((cb) => cb.dataset.field);
  if (!selectedKeys.length) { alert("Bitte mindestens ein Feld für den Export auswählen."); return; }
  const rows = filteredTrainers();
  if (!rows.length) { alert("Die aktuelle Suche/Filterung ergibt keine Treffer zum Exportieren."); return; }

  const fieldLookup = new Map(EXPORT_FIELD_GROUPS.flatMap((g) => g.fields).map((f) => [f.key, f]));
  const cols = selectedKeys.map((key) => fieldLookup.get(key)).filter(Boolean);
  const lines = [cols.map((f) => f.label), ...rows.map((t) => cols.map((c) => exportFieldValue(c, t)))];
  // Semikolon statt Komma + UTF-8-BOM: deutsches Excel erkennt das Trennzeichen
  // damit automatisch beim Doppelklick und zeigt Umlaute korrekt.
  const csv = String.fromCharCode(0xFEFF) + lines.map((line) => line.map(csvCell).join(";")).join("\r\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "personalakte_export_" + new Date().toISOString().slice(0, 10) + ".csv";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 8000);
}

// ---------- Archiv ----------

function renderArchiv() {
  const suche = archivSuche.trim().toLowerCase();
  const rows = allTrainers
    .filter((t) => t.archiviert)
    .filter((t) => !suche || fullName(t).toLowerCase().includes(suche))
    .sort((a, b) => String(b.archiviertAm || "").localeCompare(String(a.archiviertAm || "")));

  document.getElementById("archiv-empty").style.display = rows.length ? "none" : "block";
  document.getElementById("archiv-rows").innerHTML = rows.map((t) => `
    <div class="trainer-row" data-username="${escapeHtml(t.username)}" data-from-tab="archiv">
      <div class="trainer-row-main">
        <span class="trainer-row-name">${escapeHtml(fullName(t))}</span>
        <span class="trainer-row-meta">
          Archiviert am ${escapeHtml(fmtDate(t.archiviertAm))}${t.archiviertVon ? " von " + escapeHtml(t.archiviertVon) : ""}
          ${t.archiviertGrund ? "<br>Grund: " + escapeHtml(t.archiviertGrund) : ""}
        </span>
      </div>
      <div class="trainer-row-badges">${badge("archiviert", "Archiviert")}</div>
    </div>
  `).join("");
}

// ---------- Detailansicht ----------

function renderKvCard(elId, title, items) {
  document.getElementById(elId).innerHTML = `
    <h2>${escapeHtml(title)}</h2>
    <div class="kv-grid">
      ${items.map(([label, value]) => `
        <div class="kv-item">
          <span class="kv-label">${escapeHtml(label)}</span>
          <span class="kv-value">${value}</span>
        </div>
      `).join("")}
    </div>
  `;
}

function renderDetail(t) {
  renderKvCard("detail-stammdaten", "Stammdaten", [
    ["Name", escapeHtml(fullName(t))],
    ["Lizenz", escapeHtml(t.lizenz || "ohne Lizenz")],
    ["Mannschaften", escapeHtml(t.mannschaften.join(", ") || "—")],
    ["Status", t.archiviert ? badge("archiviert", "Archiviert") : badge("aktiv", "Aktiv")],
    ["Login eingerichtet", t.mustSetPassword ? "Nein (noch kein Passwort gesetzt)" : "Ja"],
    ["Zuletzt angemeldet", escapeHtml(fmtDate(t.lastLoginAt))]
  ]);

  renderKvCard("detail-trainerkodex", "Trainerkodex & Jugendschutz", [
    ["Trainerkodex", bestaetigungWert(t.trainerkodex.datum, t.trainerdaten.kodexGueltig, t.trainerdaten.kodexGueltigBis)],
    ["Jugendschutzkonzept", bestaetigungWert(t.trainerdaten.jugendschutzBestaetigtAm, t.trainerdaten.jugendschutzGueltig, t.trainerdaten.jugendschutzGueltigBis)]
  ]);
  // Trainerkodex ist seit Trainerdaten 1.6 kein eigenes Tool mehr, sondern Teil von
  // Trainerdaten (siehe [[project-trainerkodex]]) -- Link zeigt daher jetzt dorthin
  // statt auf die verwaiste eigenständige App.
  document.getElementById("detail-trainerkodex").innerHTML += `<div class="detail-source-link"><a class="btn secondary small" href="${SOURCE_URLS.trainerdaten}" target="_blank" rel="noopener">In Trainerdaten öffnen</a></div>`;

  const tdStatusLabel = { unvollstaendig: "Unvollständig", ausstehend: "Ausstehend", generiert: "Vertrag generiert" };
  const docTrainerId = escapeHtml(t.trainerdaten.trainerId || "");
  const docOpenBtn = (docType, label) => `<button type="button" class="btn secondary small doc-open-btn" data-trainer-id="${docTrainerId}" data-doc-type="${docType}">${escapeHtml(label)}</button>`;
  // Löschen ist unwiderruflich und serverseitig Admin-only (siehe
  // deleteTrainerdatenDocument in db.js). Anders als die Öffnen-Buttons, die bewusst
  // jeder sieht und die ein 403 quittieren, bleibt dieser für Nicht-Admins ganz weg:
  // currentIsAdmin ist hier lokal bekannt, Trainerdatens Sichtgruppe
  // „fuehrerschein-einsicht" dagegen nicht — ein sichtbarer Löschen-Button, der nur
  // scheitern kann, wäre schlechter als gar keiner.
  const docDeleteBtn = (docType, label) => currentIsAdmin
    ? `<button type="button" class="btn danger small doc-delete-btn" data-trainer-id="${docTrainerId}" data-doc-type="${docType}" data-doc-label="${escapeHtml(label)}">Löschen</button>`
    : "";
  const docActions = (docType, label, vorhanden) => vorhanden
    ? `<div class="doc-status-actions">${docOpenBtn(docType, label + " öffnen")}${docDeleteBtn(docType, label)}</div>`
    : "";
  const docStatusRow = (label, valueHtml, btnHtml) => `
    <div class="doc-status-row">
      <div class="doc-status-info">
        <span class="doc-status-label">${escapeHtml(label)}</span>
        <span class="doc-status-value">${valueHtml}</span>
      </div>
      ${btnHtml}
    </div>`;
  const tdAdresseParts = [
    t.trainerdaten.strasse || "",
    [t.trainerdaten.plz, t.trainerdaten.ort].filter(Boolean).join(" ")
  ].filter(Boolean);
  renderKvCard("detail-trainerdaten", "Trainerdaten (Vertrag)", [
    ["Status", t.trainerdaten.vorhanden ? escapeHtml(tdStatusLabel[t.trainerdaten.status] || t.trainerdaten.status) : "Kein Datensatz"],
    ["Eingereicht am", escapeHtml(fmtDate(t.trainerdaten.unterschriftAm || t.trainerdaten.erstelltAm))],
    ["Vertrag", t.trainerdaten.vertragUnterschriebenAm
      ? "Unterschrieben am " + escapeHtml(fmtDate(t.trainerdaten.vertragUnterschriebenAm))
      : (t.trainerdaten.vertragPdfBereitgestelltAm
          ? "Bereitgestellt am " + escapeHtml(fmtDate(t.trainerdaten.vertragPdfBereitgestelltAm)) + " (noch nicht unterschrieben)"
          : (t.trainerdaten.vertragsGeneriert ? "Word-Vertrag generiert" : "Nein"))],
    ["Geburtsdatum", fmtBirthdate(t.trainerdaten.geburtsdatum)],
    ["Adresse", escapeHtml(tdAdresseParts.join(", ") || "—")],
    ["Telefon", escapeHtml(t.trainerdaten.telefon || "—")],
    ["E-Mail", escapeHtml(t.trainerdaten.email || "—")]
  ]);
  const docStatusHtml =
    docStatusRow("Trainerlizenz",
      t.trainerdaten.trainerlizenzHochgeladenAm
        ? escapeHtml(`Hochgeladen am ${fmtDateOnly(t.trainerdaten.trainerlizenzHochgeladenAm)}`)
        : badge("fehlt", "Keine Trainerlizenz hinterlegt"),
      docActions("trainerlizenz", "Trainerlizenz", t.trainerdaten.trainerlizenzHochgeladenAm)) +
    docStatusRow("Führerschein",
      t.trainerdaten.fuehrerscheinHochgeladenAm
        ? `${escapeHtml(fmtDateOnly(t.trainerdaten.fuehrerscheinHochgeladenAm))} · ${t.trainerdaten.fuehrerscheinGueltig ? badge("ok", "Gültig bis " + fmtDateOnly(t.trainerdaten.fuehrerscheinGueltigBis)) : badge("fehlt", "Abgelaufen")}`
        : badge("fehlt", "Kein Führerschein hinterlegt"),
      docActions("fuehrerschein", "Führerschein", t.trainerdaten.fuehrerscheinHochgeladenAm)) +
    docStatusRow("Führungszeugnis",
      t.trainerdaten.fuehrungszeugnisEingereichtAm
        ? `Eingereicht am ${escapeHtml(fmtDateOnly(t.trainerdaten.fuehrungszeugnisEingereichtAm))}`
        : badge("fehlt", "Noch nicht eingereicht"),
      docActions("fuehrungszeugnis", "Führungszeugnis", t.trainerdaten.fuehrungszeugnisEingereichtAm));
  document.getElementById("detail-trainerdaten").innerHTML += `
    <div class="doc-status-section">${docStatusHtml}</div>
    <p class="muted">IBAN/Bankverbindung werden hier bewusst nicht angezeigt — Details nur in Trainerdaten selbst.</p>
    <div class="detail-source-link"><a class="btn secondary small" href="${SOURCE_URLS.trainerdaten}" target="_blank" rel="noopener">Trainerdaten öffnen</a></div>`;

  renderKvCard("detail-trainercheckliste", "TrainerCheckliste (Zugang/Abgang)", [
    ["Zugang", t.trainercheckliste.zugang.abgeschlossen ? badge("ok", "Abgeschlossen") : badge("offen", "Offen")],
    ["Zugang-Datum", escapeHtml(fmtDateOnly(t.trainercheckliste.zugang.datum))],
    ["Abgang", t.trainercheckliste.abgang.abgeschlossen ? badge("ok", "Abgeschlossen") : badge("offen", "Offen")],
    ["Abgang-Datum", escapeHtml(fmtDateOnly(t.trainercheckliste.abgang.datum))]
  ]);
  document.getElementById("detail-trainercheckliste").innerHTML += `<div class="detail-source-link"><a class="btn secondary small" href="${SOURCE_URLS.trainercheckliste}" target="_blank" rel="noopener">TrainerCheckliste öffnen</a></div>`;

  const pkCard = document.getElementById("detail-personalkosten");
  if (t.personalkosten) {
    renderKvCard("detail-personalkosten", "Personalkosten (aktuelle Saison)", [
      ["Mannschaft", escapeHtml(t.personalkosten.mannschaft || "—")],
      ["Position", escapeHtml(t.personalkosten.position || "—")],
      ["Besonderheit", escapeHtml(t.personalkosten.besonderheit || "—")]
    ]);
  } else {
    pkCard.innerHTML = `<h2>Personalkosten (aktuelle Saison)</h2><p class="detail-quelle-fehlt">Kein Eintrag in der aktuellen Saison gefunden.</p>`;
  }
  pkCard.innerHTML += `<div class="detail-source-link"><a class="btn secondary small" href="${SOURCE_URLS.personalkosten}" target="_blank" rel="noopener">Personalkosten öffnen</a></div>`;

  const kmCard = document.getElementById("detail-kadermanager");
  if (t.kadermanager.length) {
    kmCard.innerHTML = `<h2>Kadermanager</h2>` + t.kadermanager.map((k) => `
      <div class="kadermanager-team">
        <span>${escapeHtml(k.team)}${k.position ? " · " + escapeHtml(k.position) : ""}</span>
        <span>${(k.rollen || []).map((r) => escapeHtml(r)).join(", ") || "—"}</span>
      </div>
    `).join("");
  } else {
    kmCard.innerHTML = `<h2>Kadermanager</h2><p class="detail-quelle-fehlt">In keinem Team als Kader-Mitglied gefunden.</p>`;
  }
  kmCard.innerHTML += `<div class="detail-source-link"><a class="btn secondary small" href="${SOURCE_URLS.kadermanager}" target="_blank" rel="noopener">Kadermanager öffnen</a></div>`;

  const actions = document.getElementById("detail-actions");
  if (!canEdit()) {
    actions.innerHTML = t.archiviert
      ? `<h2>Archiv-Status</h2><p class="muted">Dieses Konto ist archiviert und kann sich nicht anmelden.</p>`
      : `<h2>Archivieren</h2><p class="muted">Nur mit Bearbeiten-Recht für Personalakte möglich.</p>`;
    return;
  }
  actions.innerHTML = t.archiviert
    ? `<h2>Archiv-Status</h2><p class="muted">Dieses Konto ist archiviert und kann sich nicht anmelden.</p>
       <div class="btn-row" style="justify-content:flex-start; margin-top:10px;"><button type="button" class="btn success" id="btn-reactivate">Reaktivieren</button></div>`
    : `<h2>Archivieren</h2><p class="muted">Sperrt den Login des zentralen Kontos sofort. Gruppenzugehörigkeiten bleiben erhalten.</p>
       <div class="btn-row" style="justify-content:flex-start; margin-top:10px;"><button type="button" class="btn danger" id="btn-archive">Archivieren</button></div>`;
}

// Safari (v.a. iOS) blockiert window.open() nach einem await als Popup, auch wenn der
// Aufruf aus einem Klick-Handler stammt — der "echte Nutzerklick"-Kontext gilt dort nur
// bis zum ersten await, danach silently blockiert (kein Fehler, kein Alert). Fix: leeres
// Fenster SYNCHRON im Klick-Callstack öffnen, danach nur noch die URL nachreichen
// (location.href auf einer bereits offenen Fenster-Referenz ist auch später erlaubt).
function _openBlobTab() {
  const win = window.open("", "_blank");
  return {
    show(blob) {
      const url = URL.createObjectURL(blob);
      if (win) win.location.href = url; else window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    },
    abort() { if (win) win.close(); }
  };
}

// Öffnet Führerschein/Führungszeugnis direkt als Blob in einem neuen Tab (gleiche
// Konvention wie Trainerdatens eigenes _ansehenDocumentAdmin: verzögertes revoke,
// da sofortiges Freigeben die Anzeige auf manchen Browsern abbricht).
async function openTrainerdatenDocument(btn) {
  const trainerId = btn.dataset.trainerId;
  const docType = btn.dataset.docType;
  if (!trainerId) { alert("Keine Trainerdaten-Zuordnung gefunden."); return; }
  const tab = _openBlobTab();
  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = "Lade…";
  try {
    const blob = await fetchTrainerdatenDocument(trainerId, docType);
    tab.show(blob);
  } catch (e) {
    tab.abort();
    alert("Datei nicht abrufbar: " + e.message);
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
  }
}

// Löscht ein in Trainerdaten hinterlegtes Dokument (serverseitig Admin-only, siehe
// deleteTrainerdatenDocument). Zweck ist nicht Aufräumen, sondern der Neuanfang: nach
// dem Löschen steht der Status wieder auf „nicht hinterlegt", die Person sieht in
// Trainerdaten wieder eine offene Aufgabe und lädt selbst ein neues Dokument hoch.
// Danach die komplette Übersicht neu laden statt nur diese Zeile umzuschreiben — die
// Badges in der Übersichtsliste hängen an denselben Feldern.
async function removeTrainerdatenDocument(btn) {
  const trainerId = btn.dataset.trainerId;
  const docType = btn.dataset.docType;
  const label = btn.dataset.docLabel || "Dokument";
  if (!trainerId) { alert("Keine Trainerdaten-Zuordnung gefunden."); return; }
  const t = allTrainers.find((x) => x.username === currentDetailUsername);
  if (!confirm(`${label} von ${t ? fullName(t) : "dieser Person"} wirklich löschen? Die Datei wird endgültig entfernt — ein neues Dokument muss die Person selbst in Trainerdaten hochladen.`)) return;
  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = "Lösche…";
  try {
    await deleteTrainerdatenDocument(trainerId, docType);
  } catch (e) {
    alert("Löschen fehlgeschlagen: " + e.message);
    btn.disabled = false;
    btn.textContent = originalText;
    return;
  }
  await loadOverviewAndRender();
  openDetail(currentDetailUsername, detailReturnTab);
}

function openDetail(username, fromTab) {
  const t = allTrainers.find((x) => x.username === username);
  if (!t) return;
  currentDetailUsername = username;
  detailReturnTab = fromTab || "uebersicht";
  renderDetail(t);
  activateTab("detail");
}

// ---------- Archivieren / Reaktivieren ----------

async function doArchive(username) {
  const t = allTrainers.find((x) => x.username === username);
  if (!t) return;
  if (!confirm(`${fullName(t)} wirklich archivieren? Der Login wird sofort gesperrt (Gruppenzugehörigkeit bleibt erhalten).`)) return;
  const grund = prompt("Grund fürs Archivieren (optional):", "") || "";
  try {
    await archiveTrainer(username, grund);
  } catch (e) {
    alert("Archivieren fehlgeschlagen: " + e.message);
    return;
  }
  await loadOverviewAndRender();
  openDetail(username, "uebersicht");
}

async function doReactivate(username) {
  const t = allTrainers.find((x) => x.username === username);
  if (!t) return;
  if (!confirm(`${fullName(t)} wieder reaktivieren? Der Login funktioniert danach sofort wieder.`)) return;
  try {
    await reactivateTrainer(username);
  } catch (e) {
    alert("Reaktivieren fehlgeschlagen: " + e.message);
    return;
  }
  await loadOverviewAndRender();
  openDetail(username, "archiv");
}

// ---------- Laden ----------

async function loadOverviewAndRender() {
  const overview = await fetchOverview();
  allTrainers = Array.isArray(overview.trainers) ? overview.trainers : [];
  populateLizenzFilter();
  renderUebersicht();
  renderArchiv();
}

function showApp() {
  document.getElementById("connect-screen").style.display = "none";
  document.getElementById("app-shell").style.display = "block";
}

function showConnectScreen(errorMsg) {
  document.getElementById("connect-screen").style.display = "block";
  document.getElementById("app-shell").style.display = "none";
  const err = document.getElementById("cloud-error");
  err.style.display = errorMsg ? "block" : "none";
  err.textContent = errorMsg || "";
}

async function init() {
  document.getElementById("version-badge").textContent = "v" + APP_VERSION;
  document.getElementById("version-badge-2").textContent = "v" + APP_VERSION;
  renderChangelog();
  setupTabs();

  document.getElementById("filter-suche").addEventListener("input", (e) => { ubersichtSuche = e.target.value; renderUebersicht(); });
  document.getElementById("filter-lizenz").addEventListener("change", (e) => { ubersichtLizenz = e.target.value; renderUebersicht(); });
  document.getElementById("archiv-suche").addEventListener("input", (e) => { archivSuche = e.target.value; renderArchiv(); });
  initExportPanel();

  document.getElementById("uebersicht-rows").addEventListener("click", (e) => {
    const row = e.target.closest(".trainer-row");
    if (row) openDetail(row.dataset.username, row.dataset.fromTab);
  });
  document.getElementById("archiv-rows").addEventListener("click", (e) => {
    const row = e.target.closest(".trainer-row");
    if (row) openDetail(row.dataset.username, row.dataset.fromTab);
  });
  document.getElementById("detail-actions").addEventListener("click", (e) => {
    if (e.target.closest("#btn-archive")) doArchive(currentDetailUsername);
    else if (e.target.closest("#btn-reactivate")) doReactivate(currentDetailUsername);
  });
  document.getElementById("detail-trainerdaten").addEventListener("click", (e) => {
    const openBtn = e.target.closest(".doc-open-btn");
    if (openBtn) { openTrainerdatenDocument(openBtn); return; }
    const deleteBtn = e.target.closest(".doc-delete-btn");
    if (deleteBtn) removeTrainerdatenDocument(deleteBtn);
  });

  if (!getSessionToken()) {
    showConnectScreen();
    return;
  }

  try {
    const me = await fetchMe();
    currentUsername = me.username;
    currentIsAdmin = !!me.isAdmin;
    currentCanEdit = !!me.canEdit;
    currentVorname = me.vorname || null;
    currentNachname = me.nachname || null;
    // Export erst ab Bearbeiten (User-Entscheidung 2026-07-24, flottenweite
    // Umkehr von "Export ist keine Änderung"): die Sichtgruppe darf die
    // Übersicht ansehen, aber nicht als CSV abziehen.
    document.getElementById("btn-export-toggle").style.display = canEdit() ? "" : "none";
    await loadOverviewAndRender();
    showApp();
    renderHeaderUser();
  } catch (e) {
    if (e instanceof NotLoggedInError) {
      showConnectScreen();
    } else {
      showConnectScreen("Fehler beim Laden: " + e.message);
    }
  }
}

window.addEventListener("DOMContentLoaded", () => { init(); });
