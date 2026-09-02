// Persistenz über das zentrale ToolsUebersicht-Login-Gateway.
// Adaptiert aus E:\materialbedarf\db.js (gleiches Gateway-Muster), aber ohne
// generisches dav-load/dav-save: alle Schreibzugriffe laufen über zwei
// dedizierte Aktionen (archive-trainer/reactivate-trainer), damit der Server
// (nicht der Client) den Datenschnappschuss konsistent zusammenbaut.
const GATEWAY_URL = "https://landingpage.michel-brunner.workers.dev";
const TOKEN_STORAGE_KEY = "tu_session_token";
const GATEWAY_APP_ID = "personalakte";

// Direkter Aufruf von Trainerdatens eigenem Worker (nicht über das Gateway hier) --
// Führerschein-/Führungszeugnis-Dateien laufen bewusst nicht über PROVISION_ONLY_PATHS
// (das würde IBAN-nahe Zugriffe generisch öffnen), sondern über Trainerdatens native
// Aktionen (Admin bzw. Gruppe fuehrerschein-einsicht für Führerschein, nur Admin für
// Führungszeugnis), siehe E:\Trainerdaten\submit-worker.js und dessen CLAUDE.md.
const TRAINERDATEN_WORKER_URL = "https://trainerdaten1.michel-brunner.workers.dev";

class NotLoggedInError extends Error {
  constructor(message) {
    super(message || "Nicht angemeldet");
    this.name = "NotLoggedInError";
  }
}

class ConflictError extends Error {
  constructor(message) {
    super(message || "Daten wurden zwischenzeitlich von einem anderen Gerät geändert");
    this.name = "ConflictError";
  }
}

function getSessionToken() {
  try { return localStorage.getItem(TOKEN_STORAGE_KEY); } catch (_) { return null; }
}

async function gatewayRequest(payload) {
  const token = getSessionToken();
  if (!token) throw new NotLoggedInError();
  const resp = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
    body: JSON.stringify(payload)
  });
  if (resp.status === 401) throw new NotLoggedInError("Sitzung abgelaufen");
  if (resp.status === 403) throw new Error("Kein Zugriff auf dieses Tool.");
  if (resp.status === 409) throw new ConflictError((await resp.json().catch(() => null))?.error);
  if (!resp.ok) throw new Error(`Gateway-Fehler (HTTP ${resp.status})`);
  return resp.json();
}

// Liefert {username, isAdmin, groupIds, vorname, nachname, mannschaften, canEdit} der eingeloggten Person.
async function fetchMe() {
  return gatewayRequest({ action: "me", app: GATEWAY_APP_ID });
}

// Liefert {trainerGroupExists, trainers:[...]} -- ein Datensatz je Mitglied der
// Trainer-Gruppe, inkl. archivierter (Gruppen werden beim Archivieren nicht
// entzogen). Ein bulk Join statt Einzel-Abruf pro Person, siehe CLAUDE.md.
async function fetchOverview() {
  return gatewayRequest({ action: "personalakte-overview" });
}

async function archiveTrainer(username, grund) {
  return gatewayRequest({ action: "archive-trainer", username, grund: grund || "" });
}

async function reactivateTrainer(username) {
  return gatewayRequest({ action: "reactivate-trainer", username });
}

// Trainerlizenz-/Führerschein- oder Führungszeugnis-Datei eines Trainers als Blob
// laden (docType: "trainerlizenz"|"fuehrerschein"|"fuehrungszeugnis"). Ruft NICHT
// das Gateway hier, sondern direkt Trainerdatens eigenen Worker mit demselben
// Bearer-Token -- der prüft Admin/Gruppe selbst (403, falls nicht berechtigt).
const TRAINERDATEN_DOC_ACTIONS = {
  trainerlizenz: "trainerlizenz-file-for-owner",
  fuehrerschein: "fuehrerschein-file-for-owner",
  fuehrungszeugnis: "fuehrungszeugnis-file-for-owner"
};
async function fetchTrainerdatenDocument(trainerId, docType) {
  const token = getSessionToken();
  if (!token) throw new NotLoggedInError();
  const action = TRAINERDATEN_DOC_ACTIONS[docType];
  const resp = await fetch(TRAINERDATEN_WORKER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
    body: JSON.stringify({ action, trainerId })
  });
  if (resp.status === 401) throw new NotLoggedInError("Sitzung abgelaufen");
  if (resp.status === 403) throw new Error(docType === "fuehrerschein"
    ? "Kein Zugriff — nur Admin oder Gruppe „Führerschein Einsicht“ dürfen das ansehen."
    : "Kein Zugriff — das darf nur ein Admin ansehen.");
  if (resp.status === 404) throw new Error("Datei nicht gefunden.");
  if (!resp.ok) throw new Error(`Trainerdaten-Fehler (HTTP ${resp.status})`);
  return resp.blob();
}

// Hinterlegtes Dokument eines Trainers löschen -- für den Fall "das Hinterlegte taugt
// nicht, die Person soll ein neues hochladen". Gleicher Direktweg zu Trainerdatens
// Worker wie fetchTrainerdatenDocument, serverseitig aber NUR Admin: auch beim
// Führerschein, wo die Gruppe „Führerschein Einsicht" zwar ansehen, aber nicht
// verwalten darf.
const TRAINERDATEN_DOC_DELETE_ACTIONS = {
  trainerlizenz: "delete-trainerlizenz-for-owner",
  fuehrerschein: "delete-fuehrerschein-for-owner",
  fuehrungszeugnis: "delete-fuehrungszeugnis-for-owner"
};
async function deleteTrainerdatenDocument(trainerId, docType) {
  const token = getSessionToken();
  if (!token) throw new NotLoggedInError();
  const action = TRAINERDATEN_DOC_DELETE_ACTIONS[docType];
  const resp = await fetch(TRAINERDATEN_WORKER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
    body: JSON.stringify({ action, trainerId })
  });
  if (resp.status === 401) throw new NotLoggedInError("Sitzung abgelaufen");
  if (resp.status === 403) throw new Error("Kein Zugriff — löschen darf nur ein Admin.");
  if (resp.status === 404) throw new Error("Kein Dokument hinterlegt.");
  if (!resp.ok) {
    // Der Worker meldet hier u.a. den Teilerfolg „Datei gelöscht, aber Metadaten-Update
    // fehlgeschlagen" — dieser Text muss durchkommen, sonst weiß niemand, dass ein
    // zweiter Löschversuch den Zustand geradezieht.
    let msg = `Trainerdaten-Fehler (HTTP ${resp.status})`;
    try {
      const body = await resp.json();
      if (body && body.error) msg = body.error;
    } catch (_) { /* keine JSON-Antwort -> generische Meldung behalten */ }
    throw new Error(msg);
  }
  return resp.json();
}
