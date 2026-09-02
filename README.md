# 🗃️ Personalakte

Alle Trainerinnen und Trainer an einer Stelle — **über die Tools hinweg**.
Statt in jedem Werkzeug einzeln nachzusehen, zeigt die Personalakte je Person,
was in der Familie der Vereins-Tools über sie geführt wird, und trennt dabei
aktive von archivierten Trainern.

**➡️ [Personalakte öffnen](https://sc1911heiligenstadt.github.io/personalakte/)**

## Was drin ist

| Reiter | Wofür |
|---|---|
| **Übersicht** | Die aktiven Trainer, durchsuchbar, nach Lizenz filterbar, mit CSV-Export |
| **Archiv** | Wer nicht mehr aktiv ist — mit eigenem Suchfeld, nachlesbar, aber aus der Arbeitsliste heraus |
| **Info** | Kurzbeschreibung, Änderungsliste und Datenschutzhinweis |

Ein Klick auf eine Person öffnet die **Detailansicht** mit je einer Karte für
Stammdaten, Trainerkodex und Jugendschutz, Trainerdaten und Vertrag,
TrainerCheckliste, Personalkosten der laufenden Saison und die Rolle im
Kadermanager. Jede Karte hat einen Knopf, der das zuständige Werkzeug öffnet.
In der Liste steht je Person ein Kennzeichen für Kodex, Vertrag, Checkliste,
Führungszeugnis und Jugendschutzkonzept.

**Bankverbindung und IBAN kommen hier nirgends vor** — weder in der Anzeige noch
im Export.

## Dokumente

Trainerlizenz, Führerschein und Führungszeugnis lassen sich aus der
Trainerdaten-Karte direkt öffnen. Führungszeugnis und Trainerlizenz sehen nur
Administratoren, den Führerschein zusätzlich die Gruppe *Führerschein Einsicht*
— geprüft wird das auf dem Server, nicht nur am Bildschirm. Ein unbrauchbares
Dokument lässt sich löschen; die Person sieht es danach in Trainerdaten wieder
als offene Aufgabe und lädt selbst ein neues hoch.

## CSV-Export

Der Export der Trainer-Übersicht ist frei zusammenstellbar: Stammdaten,
Archivierung, Trainerkodex und Jugendschutz, Trainerdaten und Vertrag,
Dokumente, TrainerCheckliste und Personalkosten sind einzeln an- und abwählbar,
*Alle* und *Keine* setzen die Auswahl auf einen Schlag. Der Export übernimmt die
eingestellte Suche und den Lizenzfilter.

## Woher die Daten kommen

Die Personalakte **pflegt die Stammdaten nicht selbst**. Sie führt zusammen,
was in den Fachwerkzeugen steht — die Stammdaten aus
[Trainerdaten](https://sc1911heiligenstadt.github.io/Trainerdaten/), die
Aufwandsentschädigungen aus
[Personalkosten](https://sc1911heiligenstadt.github.io/Personalkosten/), den
On-/Offboarding-Stand aus der
[TrainerCheckliste](https://sc1911heiligenstadt.github.io/TrainerCheckliste/)
und die Team-Rollen aus dem
[Kadermanager](https://sc1911heiligenstadt.github.io/kadermanager/).
Geändert wird deshalb immer dort, wo die Angabe hingehört, nicht hier.

Eigenständig entscheidet die Personalakte nur zweierlei: ob eine Person **aktiv
oder archiviert** ist — Archivieren sperrt den Login des zentralen Kontos sofort,
die Gruppenzugehörigkeiten bleiben erhalten — und ob ein hinterlegtes **Dokument
gelöscht** wird. Das sind ihre einzigen schreibenden Aktionen.

## Zugang

Die Anmeldung läuft über die [Tools-Übersicht](https://sc1911heiligenstadt.github.io/ToolsUebersicht/) — dort einmal anmelden, danach ist dieses Werkzeug offen.

**Sehen** heißt Übersicht, Archiv und Detailansichten; **Bearbeiten** ergänzt den
CSV-Export sowie Archivieren und Reaktivieren. Der Zugriff auf die einzelnen
Dokumente hängt an eigenen, engeren Rechten (siehe oben). Der Reiter *Info* ist
für alle sichtbar.

Die Personalakte bündelt Personendaten mehrerer Werkzeuge — die Sichtbarkeit ist
deshalb besonders eng gesteckt. Wer sie sieht, legt die Tools-Übersicht fest.

## Lokal starten

Über den Eintrag `personalakte` in `E:\.claude\launch.json` — der Server läuft dann auf `http://localhost:8783/`.

## Technik

Vanilla JavaScript ohne Build-Schritt — die Dateien werden so ausgeliefert, wie sie im Repo liegen; ausgeliefert wird die einzelne Seite `index.html`. Veröffentlicht über GitHub Pages. Die Daten liegen in der Vereins-Nextcloud; der Zugriff läuft ausschließlich über den Login-Worker der Tools-Übersicht, nie mit Zugangsdaten im Browser. Eine eigene zweite Kopie der Daten hält die Personalakte nicht — die Angaben werden bei jedem Aufruf frisch aus den Quellen geholt.

Der Zugriff auf die Daten der anderen Werkzeuge ist **nur lesend** — er läuft
über die Aktion `personalakte-overview` im Login-Worker, die Trainerdaten,
Personalkosten, TrainerCheckliste und Kadermanager zusammenführt. Geschrieben
werden ausschließlich der Aktiv-/Archiv-Status und das Löschen eines Dokuments.

---

Ein Werkzeug des 1. SC 1911 Heiligenstadt. Alle Werkzeuge auf einen Blick: [Tools-Übersicht](https://sc1911heiligenstadt.github.io/ToolsUebersicht/) · Erklärungen im [Toolbox Wiki](https://sc1911heiligenstadt.github.io/Vereinswiki/).
