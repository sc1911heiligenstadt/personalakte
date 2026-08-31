# 🗃️ Personalakte

Alle Trainerinnen und Trainer an einer Stelle — **über die Tools hinweg**.
Statt in jedem Werkzeug einzeln nachzusehen, zeigt die Personalakte je Person,
was in der Familie der Vereins-Tools über sie geführt wird, und trennt dabei
aktive von archivierten Trainern.

**➡️ [Personalakte öffnen](https://sc1911heiligenstadt.github.io/personalakte/)**

## Was drin ist

| Reiter | Wofür |
|---|---|
| **Übersicht** | Die aktiven Trainer, durchsuchbar und filterbar |
| **Archiv** | Wer nicht mehr aktiv ist — nachlesbar, aber aus der Arbeitsliste heraus |

## Woher die Daten kommen

Die Personalakte **pflegt die Stammdaten nicht selbst**. Sie führt zusammen,
was in den Fachwerkzeugen steht — die Stammdaten aus
[Trainerdaten](https://sc1911heiligenstadt.github.io/Trainerdaten/), die
Aufwandsentschädigungen aus
[Personalkosten](https://sc1911heiligenstadt.github.io/Personalkosten/) und den
On-/Offboarding-Stand aus der
[TrainerCheckliste](https://sc1911heiligenstadt.github.io/TrainerCheckliste/).
Geändert wird deshalb immer dort, wo die Angabe hingehört, nicht hier.

Eigenständig entscheidet die Personalakte nur eines: ob eine Person **aktiv**
oder **archiviert** ist. Das Archivieren und Reaktivieren ist ihre einzige
schreibende Aktion.

## Zugang

Die Anmeldung läuft über die [Tools-Übersicht](https://sc1911heiligenstadt.github.io/ToolsUebersicht/) — dort einmal anmelden, danach ist dieses Werkzeug offen.

Die Personalakte bündelt Personendaten mehrerer Werkzeuge — die Sichtbarkeit ist
deshalb besonders eng gesteckt. Wer sie sieht, legt die Tools-Übersicht fest.

## Lokal starten

Über den Eintrag `personalakte` in `E:\.claude\launch.json` — der Server läuft dann auf `http://localhost:8783/`.

## Technik

Vanilla JavaScript ohne Build-Schritt — die Dateien werden so ausgeliefert, wie sie im Repo liegen. Veröffentlicht über GitHub Pages. Die Daten liegen in der Vereins-Nextcloud; der Zugriff läuft ausschließlich über den Login-Worker der Tools-Übersicht, nie mit Zugangsdaten im Browser.

Der Zugriff auf die Daten der anderen Werkzeuge ist **nur lesend** — er läuft
über die Aktion `personalakte-overview` im Login-Worker, die Trainerdaten,
Personalkosten und TrainerCheckliste zusammenführt. Geschrieben wird
ausschließlich der eigene Aktiv-/Archiv-Status.

---

Ein Werkzeug des 1. SC 1911 Heiligenstadt. Alle Werkzeuge auf einen Blick: [Tools-Übersicht](https://sc1911heiligenstadt.github.io/ToolsUebersicht/) · Erklärungen im [Toolbox Wiki](https://sc1911heiligenstadt.github.io/Vereinswiki/).
