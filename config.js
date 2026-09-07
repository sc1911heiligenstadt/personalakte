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

// Was die Personalakte kann -- steht im Info-Reiter als Karte "Funktionen".
// WICHTIG: Das ist NICHT der Changelog. Hier steht der ZUSTAND ("die Liste zeigt
// den Kodex-Stand"), dort die Aenderung ("die Liste zeigt den Kodex-Stand JETZT").
// Wer eine Funktion umbaut oder abschaltet, zieht diesen Text mit -- und ebenso
// E:\SC1911-Tools-Anleitung.txt, wo dasselbe ausfuehrlich steht.
const APP_FUNKTIONEN = [
  {
    title: "Wofür die Personalakte da ist",
    items: [
      "Die appübergreifende Sicht auf die Trainer: Stammdaten, Vertrag, Trainerkodex, On- und Offboarding, Personalkosten, Kadermanager-Rolle und der Stand der Dokumente — alles auf einer Seite.",
      "Zusammengeführt wird, was in den Fachwerkzeugen steht. Geändert wird immer dort, wo die Angabe hingehört.",
      "Bankverbindung und IBAN bleiben bewusst draußen. Sie tauchen hier nirgends auf, auch nicht im Export."
    ]
  },
  {
    title: "Trainerübersicht",
    items: [
      "Liste aller Mitglieder der Gruppe „Trainer“ mit Name, Lizenz und Mannschaften.",
      "Je Person Kennzeichen für Trainerkodex, Vertrag, Checkliste, Führungszeugnis und Jugendschutzkonzept.",
      "Suchfeld nach Namen und ein Filter nach Lizenz.",
      "Wer in den Trainerdaten als „Nur Kontaktdaten“ geführt wird, trägt „Kein Vertrag nötig“ statt einer offenen Aufgabe."
    ]
  },
  {
    title: "Detailansicht je Trainer",
    items: [
      "Alle Quellen untereinander: Stammdaten mit Geburtsdatum, Adresse, Telefon und E-Mail, dazu Vertragsstand, Trainerkodex und Jugendschutzkonzept mit „bestätigt am“ und „gültig bis“.",
      "Dazu die Checkliste für Zugang und Abgang, die Personalkosten der laufenden Saison und die Rolle im Kadermanager.",
      "Die Trainerlizenz steht mit Lizenzart und Gültigkeit da. Wer in den Trainerdaten bestätigt hat, keine zu besitzen, erscheint als „Keine Trainerlizenz vorhanden (bestätigt)“ und nicht als Lücke.",
      "Jede Karte hat einen Knopf, der das zuständige Werkzeug öffnet — Trainerdaten, TrainerCheckliste, Personalkosten oder Kadermanager."
    ]
  },
  {
    title: "Nur lesen, nicht ändern",
    items: [
      "Die Personalakte hat kein eigenes Bearbeiten-Formular für die zusammengeführten Felder. So gibt es zu jeder Angabe genau einen Ort, an dem sie gepflegt wird.",
      "Eigene Entscheidungen trifft sie nur zwei: ob eine Person aktiv oder archiviert ist, und ob ein hinterlegtes Dokument wieder verschwindet."
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
      "„Archivieren“ sperrt das zentrale Konto für die Anmeldung und legt einen Datenschnappschuss ab. Ein Grund lässt sich dabei angeben.",
      "Gruppenzugehörigkeiten bleiben unangetastet — beim Reaktivieren ist nichts wiederherzustellen.",
      "Der Reiter „Archiv“ listet die archivierten Konten mit eigenem Suchfeld.",
      "„Reaktivieren“ hebt die Sperre auf; die Anmeldung funktioniert danach sofort wieder."
    ]
  },
  {
    title: "Export",
    items: [
      "CSV-Export der Trainerübersicht, frei zusammenstellbar: Stammdaten, Archivierung, Trainerkodex und Jugendschutz, Trainerdaten und Vertrag, Dokumente, TrainerCheckliste und Personalkosten sind einzeln wählbar; „Alle“ und „Keine“ setzen die Auswahl auf einen Schlag.",
      "Der Export übernimmt die eingestellte Suche und den Lizenzfilter.",
      "Ein Haken „Archivierte Trainer mit exportieren“ nimmt die archivierten Konten mit; die Zeile darunter sagt, wie viele davon in der Auswahl stecken.",
      "Bankverbindung und IBAN sind auch hier nicht enthalten."
    ]
  },
  {
    title: "Wer darf was",
    items: [
      "Das Werkzeug ist nur für eine eigens freigegebene Gruppe sichtbar, weil es Personaldaten zusammenführt.",
      "Sehen: Übersicht, Archiv und Detailansichten.",
      "Bearbeiten: zusätzlich der CSV-Export sowie Archivieren und Reaktivieren.",
      "Der Zugriff auf die einzelnen Dokumente hängt an eigenen, engeren Rechten."
    ]
  },
  {
    title: "Daten, Speicherung und Bedienung",
    items: [
      "Die Angaben werden bei jedem Aufruf frisch aus den Quell-Werkzeugen geholt; die Personalakte hält keine eigene zweite Kopie.",
      "Zugang über die zentrale Anmeldung der Tools-Übersicht — ein eigenes Passwort braucht es nicht.",
      "Gedacht ist die Personalakte für den großen Bildschirm. Am Handy bricht die Reiterleiste um, statt seitlich aus dem Bild zu laufen, und ein Dokument öffnet sich auch auf dem iPhone in einem neuen Reiter."
    ]
  }
];

const APP_CHANGELOG = [
  {
    version: "1.4",
    groups: [
      {
        title: "Im Info-Reiter steht jetzt, was die App kann",
        items: [
          "Die Liste der Änderungen und die Versionsnummer sind aus dem Info-Reiter verschwunden.",
          "Stattdessen steht dort die Karte „Funktionen“: was die App kann, nach Themen geordnet.",
          "Was sich geändert hat, steht weiterhin in den Neuigkeiten auf der Startseite der Tools-Übersicht."
        ]
      }
    ]
  },
  {
    version: "1.3",
    groups: [
      {
        title: "Kein „Vertrag ausstehend“ mehr für Leute ohne Vertrag",
        items: [
          "Wer in den Trainerdaten als „Nur Kontaktdaten“ geführt wird — Geschäftsstelle, Vorstand, Helfer —, trug hier dauerhaft das gelbe Abzeichen „Vertrag ausstehend“. Das war eine Aufgabe, die niemand erledigen kann. Jetzt steht dort grau „Kein Vertrag nötig“.",
          "In der Detailansicht stand als Status der rohe Wert „kontaktdaten“; jetzt steht dort „Nur Kontaktdaten“. Die Zeile „Vertrag“ sagt in diesem Fall „Nicht nötig“ statt „Nein“.",
          "Der vierte Status kam bisher gar nicht bis hierher — das Gateway kannte nur drei. Auch das ist behoben."
        ]
      }
    ]
  },
  {
    version: "1.2",
    groups: [
      {
        title: "Export",
        items: [
          "Neuer Haken „Archivierte Trainer mit exportieren“ im Export-Panel.",
          "Vorher war das ein Weg ins Leere: Man konnte die Felder „Archiviert am“, „Archivierungsgrund“ und „Archiviert von“ anhaken, exportiert wurden aber nur aktive Trainer. Die drei Spalten blieben in jeder Zeile leer, und „Status“ sagte in jeder Zeile „Aktiv“. Wer wissen wollte, wer wann und warum gegangen ist, las aus der leeren Spalte „niemand“.",
          "Die Zeile unter den Feldern sagt jetzt dazu, wie viele der Zeilen archiviert sind.",
          "Ohne Haken bleibt alles wie bisher: nur die aktiven Trainer der eingestellten Suche."
        ]
      }
    ]
  },
  {
    version: "1.1",
    groups: [
      {
        title: "Trainerlizenz",
        items: [
          "Die Trainerlizenz zeigt jetzt, ob sie noch gilt. Vorher stand dort nur „Hochgeladen am …“ — eine längst abgelaufene Lizenz sah damit aus wie eine gültige.",
          "Wer in Trainerdaten angehakt hat, dass er keine Lizenz besitzt, steht jetzt als „Keine Trainerlizenz vorhanden (bestätigt)“ da. Vorher bekam er dasselbe rote „fehlt“ wie jemand, der nie etwas hochgeladen hat.",
          "Ist die Art der Lizenz hinterlegt, steht sie mit in der Zeile."
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
          "Detailansicht je Trainer mit allen Quellen, zusätzlich Personalkosten-Saison und Rolle im Kadermanager.",
          "Jede Karte der Detailansicht hat einen Knopf, der das zuständige Werkzeug öffnet — Trainerdaten, TrainerCheckliste, Personalkosten oder Kadermanager."
        ]
      },
      {
        title: "Nur lesen, nicht ändern",
        items: [
          "Die Personalakte führt Daten aus mehreren Werkzeugen zusammen und zeigt sie an. Geändert wird immer in der Quelle — in Trainerdaten, in der TrainerCheckliste, in den Personalkosten.",
          "So gibt es zu jeder Angabe genau einen Ort, an dem sie gepflegt wird.",
          "Eigene Entscheidungen trifft die Personalakte nur zwei: ob eine Person aktiv oder archiviert ist, und ob ein hinterlegtes Dokument wieder verschwindet."
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
          "Trainer, die den Verein verlassen, lassen sich archivieren: das zentrale Konto wird für die Anmeldung gesperrt, und ein Datenschnappschuss wandert ins Archiv. Ein Grund lässt sich dabei angeben.",
          "Die Gruppenzugehörigkeiten bleiben dabei unangetastet — beim Reaktivieren ist nichts wiederherzustellen.",
          "Der Reiter „Archiv“ listet die archivierten Konten mit eigenem Suchfeld.",
          "Archivierte Trainer lassen sich jederzeit reaktivieren — die Anmeldung funktioniert danach sofort wieder."
        ]
      },
      {
        title: "Export",
        items: [
          "CSV-Export der Trainer-Übersicht, frei zusammenstellbar: Stammdaten, Archivierung, Trainerkodex und Jugendschutz, Trainerdaten und Vertrag, Dokumente, TrainerCheckliste und Personalkosten sind einzeln wählbar; „Alle“ und „Keine“ setzen die Auswahl auf einen Schlag.",
          "Der Export übernimmt die eingestellte Suche und den Lizenzfilter.",
          "Bankverbindung und IBAN sind auch hier nicht enthalten."
        ]
      },
      {
        title: "Wer darf was",
        items: [
          "Das Werkzeug ist nur für die freigegebene Gruppe sichtbar, weil es Personaldaten zusammenführt.",
          "Sehen: Übersicht, Archiv und Detailansichten.",
          "Bearbeiten: zusätzlich der CSV-Export sowie Archivieren und Reaktivieren.",
          "Der Zugriff auf die einzelnen Dokumente hängt an eigenen, engeren Rechten (siehe oben).",
          "Der Reiter „Info“ ist für alle sichtbar. Dort stehen eine Kurzbeschreibung, diese Änderungsliste und der Datenschutzhinweis des Vereins."
        ]
      },
      {
        title: "Bedienung am Handy",
        items: [
          "Die Reiterleiste bricht am Handy um, statt seitlich aus dem Bild zu laufen — auch die hinteren Reiter sind auf schmalen Bildschirmen erreichbar.",
          "Eingabefelder sind groß genug, dass der iPhone-Browser beim Antippen nicht ungefragt in die Seite hineinzoomt.",
          "Ein Dokument öffnet sich auch auf dem iPhone in einem neuen Reiter, statt vom Browser stillschweigend geblockt zu werden."
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
