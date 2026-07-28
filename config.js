const APP_VERSION = "1.0";

// Konfigurierbarer CSV-Export der Trainer-Übersicht (siehe initExportPanel/
// exportTrainerCsv in app.js): jedes Feld einzeln per Checkbox an-/abwählbar,
// gruppiert wie die Detailansicht (renderDetail). "key" ist ein Punkt-Pfad in
// den zusammengeführten Trainer-Datensatz (getPath in app.js), "type" steuert
// nur die Formatierung des Zellwerts (exportFieldValue) — ohne "type" wird der
// Rohwert unverändert exportiert. Bewusst ohne IBAN/Bankverbindung (kommen aus
// der Quelle ohnehin nie mit, siehe CLAUDE.md), Signatur-Bilddaten, groupIds/
// Kadermanager-Array (kein flacher Tabellenwert) und mustSetPassword (rein
// technischer Konto-Zustand, keine Personalakte-Aussage).
const EXPORT_FIELD_GROUPS = [
  {
    title: "Stammdaten",
    fields: [
      { key: "vorname", label: "Vorname" },
      { key: "nachname", label: "Nachname" },
      { key: "username", label: "Benutzername" },
      { key: "lizenz", label: "Lizenz" },
      { key: "mannschaften", label: "Mannschaften", type: "join" },
      { key: "archiviert", label: "Status", type: "archivstatus" },
      { key: "lastLoginAt", label: "Zuletzt angemeldet", type: "date" }
    ]
  },
  {
    title: "Archivierung",
    fields: [
      { key: "archiviertAm", label: "Archiviert am", type: "date" },
      { key: "archiviertGrund", label: "Archivierungsgrund" },
      { key: "archiviertVon", label: "Archiviert von" }
    ]
  },
  {
    title: "Trainerkodex & Jugendschutz",
    fields: [
      { key: "trainerkodex.bestaetigt", label: "Trainerkodex bestätigt", type: "bool" },
      { key: "trainerkodex.datum", label: "Trainerkodex bestätigt am", type: "date" },
      { key: "trainerdaten.kodexGueltig", label: "Trainerkodex gültig", type: "bool" },
      { key: "trainerdaten.kodexGueltigBis", label: "Trainerkodex gültig bis", type: "date" },
      { key: "trainerdaten.jugendschutzBestaetigtAm", label: "Jugendschutzkonzept bestätigt am", type: "date" },
      { key: "trainerdaten.jugendschutzGueltig", label: "Jugendschutzkonzept gültig", type: "bool" },
      { key: "trainerdaten.jugendschutzGueltigBis", label: "Jugendschutzkonzept gültig bis", type: "date" }
    ]
  },
  {
    title: "Trainerdaten (Vertrag)",
    fields: [
      { key: "trainerdaten.status", label: "Vertragsstatus", type: "tdstatus" },
      { key: "trainerdaten.unterschriftAm", label: "Eingereicht am", type: "eingereicht" },
      { key: "trainerdaten.vertragsGeneriert", label: "Word-Vertrag generiert", type: "bool" },
      { key: "trainerdaten.vertragPdfBereitgestelltAm", label: "Vertrag bereitgestellt am", type: "date" },
      { key: "trainerdaten.vertragUnterschriebenAm", label: "Vertrag unterschrieben am", type: "date" },
      { key: "trainerdaten.geburtsdatum", label: "Geburtsdatum", type: "dateonly" },
      { key: "trainerdaten.strasse", label: "Straße" },
      { key: "trainerdaten.plz", label: "PLZ" },
      { key: "trainerdaten.ort", label: "Ort" },
      { key: "trainerdaten.telefon", label: "Telefon" },
      { key: "trainerdaten.email", label: "E-Mail" }
    ]
  },
  {
    title: "Dokumente",
    fields: [
      { key: "trainerdaten.trainerlizenzHochgeladenAm", label: "Trainerlizenz hochgeladen am", type: "date" },
      { key: "trainerdaten.trainerlizenzArt", label: "Trainerlizenz-Art" },
      { key: "trainerdaten.trainerlizenzGueltigBis", label: "Trainerlizenz gültig bis", type: "dateonly" },
      { key: "trainerdaten.trainerlizenzNichtVorhanden", label: "Keine Trainerlizenz vorhanden", type: "bool" },
      { key: "trainerdaten.fuehrerscheinHochgeladenAm", label: "Führerschein hochgeladen am", type: "date" },
      { key: "trainerdaten.fuehrerscheinGueltig", label: "Führerschein gültig", type: "bool" },
      { key: "trainerdaten.fuehrerscheinGueltigBis", label: "Führerschein gültig bis", type: "date" },
      { key: "trainerdaten.fuehrungszeugnisEingereichtAm", label: "Führungszeugnis eingereicht am", type: "date" }
    ]
  },
  {
    title: "TrainerCheckliste (Zugang/Abgang)",
    fields: [
      { key: "trainercheckliste.zugang.abgeschlossen", label: "Zugang abgeschlossen", type: "bool" },
      { key: "trainercheckliste.zugang.datum", label: "Zugang-Datum", type: "dateonly" },
      { key: "trainercheckliste.abgang.abgeschlossen", label: "Abgang abgeschlossen", type: "bool" },
      { key: "trainercheckliste.abgang.datum", label: "Abgang-Datum", type: "dateonly" }
    ]
  },
  {
    title: "Personalkosten (aktuelle Saison)",
    fields: [
      { key: "personalkosten.mannschaft", label: "Mannschaft (Personalkosten)" },
      { key: "personalkosten.position", label: "Position (Personalkosten)" },
      { key: "personalkosten.besonderheit", label: "Besonderheit (Personalkosten)" }
    ]
  }
];

const APP_CHANGELOG = [
  {
    version: "1.1",
    groups: [
      {
        title: "Bedienung am Handy",
        items: [
          "Die Tab-Leiste bricht am Handy jetzt um, statt seitlich aus dem Bild zu laufen. Vorher waren die hinteren Tabs auf schmalen Bildschirmen nicht erreichbar.",
          "Eingabefelder sind am Handy mindestens 16 Pixel groß. Dadurch zoomt der iPhone-Browser beim Antippen eines Feldes nicht mehr ungefragt in die Seite hinein und bleibt danach verschoben stehen."
        ]
      }
    ]
  },
  {
    version: "1.0",
    groups: [
      {
        title: "Übersicht",
        items: [
          "Zusammengeführte Ansicht aller Trainer/Nutzerkonten: Lizenz, Mannschaften, Trainerkodex-Status, Trainerdaten (inkl. Geburtsdatum, Adresse, Telefon, E-Mail sowie Trainerlizenz-, Führerschein- und Führungszeugnis-Status) und Checkliste Zugang/Abgang auf einen Blick. IBAN/Bankverbindung bleiben bewusst ausgeblendet.",
          "Trainerkodex- und Jugendschutzkonzept-Status (bestätigt am / gültig bis) direkt in der Detailansicht.",
          "Die Übersichtsliste zeigt pro Person zusätzlich Führungszeugnis- und Jugendschutzkonzept-Status als Badge (neben Kodex, Vertrag und Checkliste).",
          "Suchfeld und Lizenz-Filter für die Übersichtsliste.",
          "Der CSV-Export steht nur noch Bearbeitern zur Verfügung — für die reine Sichtgruppe ist der Export-Knopf ausgeblendet.",
          "Detailansicht pro Trainer mit allen Quellen (zusätzlich Personalkosten-Saison und Kadermanager-Rolle) — bearbeitet wird weiterhin nur in der jeweiligen Quell-App, die Personalakte selbst ist rein lesende Aggregation."
        ]
      },
      {
        title: "Dokumente",
        items: [
          "Trainerlizenz, Führerschein und Führungszeugnis lassen sich direkt aus der Trainerdaten-Karte öffnen — Führungszeugnis und Trainerlizenz nur für Admins, Führerschein für Admins und die Gruppe „Führerschein Einsicht“ (Rechte serverseitig geprüft).",
          "Admins können ein unbrauchbares Dokument (unscharfes Foto, falsche Datei, veralteter Stand) direkt löschen — die Person sieht es danach wieder als offen und kann ein neues hochladen."
        ]
      },
      {
        title: "CSV-Export",
        items: [
          "Konfigurierbarer CSV-Export der Trainer-Übersicht – jedes Feld (Stammdaten, Archivierung, Trainerkodex & Jugendschutz, Trainerdaten/Vertrag, Dokumente, TrainerCheckliste, Personalkosten) einzeln per Checkbox wählbar, berücksichtigt die aktuelle Such-/Lizenzfilter-Einstellung. IBAN/Bankverbindung sind wie überall in Personalakte nicht Teil der Daten."
        ]
      },
      {
        title: "Archiv",
        items: [
          "Trainer, die den Verein verlassen, lassen sich archivieren: das zentrale Konto wird für den Login gesperrt, ein Datenschnappschuss wandert ins Archiv.",
          "Gruppenzugehörigkeiten bleiben beim Archivieren unangetastet.",
          "Archivierte Trainer lassen sich jederzeit wieder reaktivieren — der Login funktioniert danach sofort wieder."
        ]
      }
    ]
  }
];
