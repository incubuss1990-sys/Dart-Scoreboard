# 🎯 Dart-Scoreboard

Mobile Web-App für Dartspiele – ohne Installation und ohne Server.

## Funktionen (Version 1.5)

- 301 / 501 / 701 mit Single-Out oder Double-Out
- Cricket (15–20 und Bull, mit Punktezählung)
- 1 bis 8 Spieler mit eigenen Namen
- Eingabe einzeln über **Single / Double / Triple** sowie Bull 25, Bull 50 und Miss
- Umschaltung auf **Gesamteingabe**: Punkte pro Aufnahme bei X01 bzw. gemeinsame Treffererfassung bei Cricket
- Automatischer Spielerwechsel nach drei Darts; vorzeitiges Beenden der Aufnahme möglich
- Bust-Kontrolle und Wiederherstellung des Punktestands vor der Aufnahme
- Spielhistorie, Statistik, Rückgängig
- Automatisches lokales Speichern im Browser (localStorage)

## Starten

Lade `index.html`, `style.css` und `app.js` gemeinsam in denselben Ordner und öffne `index.html` im Browser. Oder aktiviere GitHub Pages für den Branch `main` aus dem Root-Verzeichnis.

### GitHub Pages aktivieren

1. Repository öffnen → **Settings** → **Pages**
2. Unter **Build and deployment** → **Source:** Deploy from a branch
3. **Branch:** `main` · **Folder:** `/(root)` → **Save**
4. Nach erfolgreicher Veröffentlichung: https://incubuss1990-sys.github.io/Dart-Scoreboard/

## Hinweise

- Die Daten werden nur auf dem jeweiligen Gerät gespeichert, nicht zwischen mehreren Geräten synchronisiert.
- Bei X01-Eingabe einer **Gesamtsumme** kann der letzte Dart nicht automatisch erkannt werden. Ein Double-Out-Checkout muss deshalb ausdrücklich als korrektes Doppel bestätigt werden.
- Cricket braucht Feldinformationen. Im Gesamteingabemodus werden daher bis zu drei einzelne Treffer gesammelt und **gemeinsam übernommen**.
- Die angezeigte Statistik verwendet bei X01 den 3-Dart-Average und bei Cricket Punkte pro Dart. Beim Bust wird die komplette Aufnahme als drei Darts gerechnet.
- Bei Cricket zeigt jede Spielerkarte alle sieben Felder (20–15 und Bull). Geschlossene Felder werden grün. Im Solo-Modus wird der Fortschritt als Anzahl geschlossener Felder dargestellt.
- Noch ohne automatische Browser-Tests und Leg-/Set-System.

## Dateien

- `index.html` – Benutzeroberfläche
- `style.css` – mobiloptimiertes Design
- `app.js` – Spielelogik und Speicherung

## App-Symbol und Startbildschirm

Das Motiv Nr. 3 ist als PNG mit 192 und 512 Pixeln hinterlegt. Das Web App Manifest erlaubt es, die Webseite auf Android zum Startbildschirm hinzuzufügen. Bei bereits vorhandenen Verknüpfungen kann es nötig sein, sie zu entfernen und neu hinzuzufügen, bis das neue Symbol erscheint.
