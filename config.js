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
        title: "Die Trainerübersicht ist schneller da",
        items: [
          "Beim Öffnen wurde erst das eigene Konto abgefragt und danach die Trainerübersicht. Die zweite Abfrage wartet auf die erste nicht — jetzt laufen beide gemeinsam los."
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
          "Zusammengeführte Sicht auf alle Trainer- und Nutzerkonten: Lizenz, Mannschaften, Trainerkodex, Trainerdaten samt Geburtsdatum, Adresse, Telefon und E-Mail sowie der Stand von Trainerlizenz, Führerschein und Führungszeugnis — dazu die Checkliste für Zugang und Abgang.",
          "Bankverbindung und IBAN bleiben bewusst außen vor. Sie tauchen in diesem Werkzeug nirgends auf, auch nicht im Export.",
          "Trainerkodex und Jugendschutzkonzept stehen mit „bestätigt am“ und „gültig bis“ in der Detailansicht.",
          "Die Liste zeigt je Person Kennzeichen für Kodex, Vertrag, Checkliste, Führungszeugnis und Jugendschutzkonzept.",
          "Suchfeld und Filter nach Lizenz.",
          "Detailansicht je Trainer mit allen Quellen, zusätzlich Personalkosten-Saison und Rolle im Kadermanager."
        ]
      },
      {
        title: "Nur lesen, nicht ändern",
        items: [
          "Die Personalakte führt Daten aus mehreren Werkzeugen zusammen und zeigt sie an. Geändert wird immer in der Quelle — in Trainerdaten, in der TrainerCheckliste, in den Personalkosten.",
          "So gibt es zu jeder Angabe genau einen Ort, an dem sie gepflegt wird."
        ]
      },
      {
        title: "Dokumente",
        items: [
          "Trainerlizenz, Führerschein und Führungszeugnis lassen sich direkt aus der Trainerdaten-Karte öffnen.",
          "Führungszeugnis und Trainerlizenz sehen nur Administratoren, den Führerschein zusätzlich die Gruppe „Führerschein Einsicht“. Geprüft wird das auf dem Server, nicht nur am Bildschirm.",
          "Ein unbrauchbares Dokument — unscharfes Foto, falsche Datei, veralteter Stand — lässt sich löschen. Die Person sieht es danach wieder als offen und kann ein neues hochladen."
        ]
      },
      {
        title: "Archiv",
        items: [
          "Trainer, die den Verein verlassen, lassen sich archivieren: das zentrale Konto wird für die Anmeldung gesperrt, und ein Datenschnappschuss wandert ins Archiv.",
          "Die Gruppenzugehörigkeiten bleiben dabei unangetastet.",
          "Archivierte Trainer lassen sich jederzeit reaktivieren — die Anmeldung funktioniert danach sofort wieder."
        ]
      },
      {
        title: "Export",
        items: [
          "CSV-Export der Trainer-Übersicht, frei zusammenstellbar: Stammdaten, Archivierung, Trainerkodex und Jugendschutz, Trainerdaten und Vertrag, Dokumente, TrainerCheckliste und Personalkosten sind einzeln wählbar.",
          "Der Export übernimmt die eingestellte Suche und den Lizenzfilter.",
          "Bankverbindung und IBAN sind auch hier nicht enthalten."
        ]
      },
      {
        title: "Wer darf was",
        items: [
          "Das Werkzeug ist nur für die freigegebene Gruppe sichtbar, weil es Personaldaten zusammenführt.",
          "Sehen: Übersicht und Detailansichten.",
          "Bearbeiten: zusätzlich der CSV-Export sowie Archivieren und Reaktivieren.",
          "Der Zugriff auf die einzelnen Dokumente hängt an eigenen, engeren Rechten (siehe oben).",
          "Der Reiter „Info“ ist für alle sichtbar."
        ]
      },
      {
        title: "Bedienung am Handy",
        items: [
          "Die Reiterleiste bricht am Handy um, statt seitlich aus dem Bild zu laufen — auch die hinteren Reiter sind auf schmalen Bildschirmen erreichbar.",
          "Eingabefelder sind mindestens 16 Pixel groß, damit der iPhone-Browser beim Antippen nicht ungefragt in die Seite hineinzoomt und verschoben stehen bleibt."
        ]
      },
      {
        title: "Daten & Speicherung",
        items: [
          "Die Angaben werden bei jedem Aufruf frisch aus den Quell-Werkzeugen geholt; die Personalakte hält keine eigene zweite Kopie.",
          "Zugang über die zentrale Anmeldung der Tools-Übersicht — ein eigenes Passwort braucht es nicht."
        ]
      }
    ]
  }
];
