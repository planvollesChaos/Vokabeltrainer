# Vokabeltrainer

Eigenständige Rechtschreib-App für englische Vokabeln (UK-Englisch), Grundschule.
Eine einzige `index.html`, keine Abhängigkeiten, läuft im Browser und speichert nur im Gerät
(`localStorage`, Schlüssel mit Präfix `vt:`). Keine Verbindung zur Schul-App.

## Lernen
- **Redewendungen in Bausteinen:** Mehrteilige Einträge (turn right, across the bridge, want to help, cold and hot, can fly/swim/climb trees, lay eggs, give milk, eat grass …) haben `p` (Bausteine mit deutscher Bedeutung) und `sx` (Beispielsatz mit ___). Die Bausteine sind eigene Vokabeln (z. B. turn, right). Eine Wendung kommt erst als neues Wort dran, wenn alle Bausteine mindestens Stufe 4 haben. Stufe 1 der Wendung: jeden Baustein einzeln aufschreiben; Stufe 4: im Satz mit Übersetzung.
- Nur Rechtschreibung einzelner Wörter, keine Grammatik.
- 7 Stufen pro Wort: Entdecken · Lücken · Wortsalat · Tippen · Diktat · Buchstabieren · **Meister**
  (nur das deutsche Wort, ganz ohne Hilfe). Danach gilt das Wort als gelernt (5 Sterne).
- Sterne: ☆ neu · 1 entdeckt · 2 Wortsalat · 3 Tippen/Hören · 4 Buchstabieren · 5 Meister. Fehler kosten Sterne.
- Wiederholung nach wachsenden Abständen, sofortige Korrektur, Stolperstellen farbig markiert.
- **Vokabelschatz:** alle Wörter mit Sternen und Prozent, Filter „von … bis … Sterne“, gezieltes Üben
  oder Testen dieser Auswahl.
- **Gemischter Test:** bunt gemischte Wörter ohne Hilfe, auch bereits gelernte; zeigt den echten Stand.
- **Diplome:** sind bei allen Wörtern eines Themas 5 Sterne, gibt es eine Urkunde (wird als PDF gespeichert, ohne Drucker).
- Profile: Ellena, Merle, Eltern. Eltern ergänzen Wörter einzeln oder als Liste und schalten das Mikrofon
  für Stufe 6 ein (standardmäßig aus).

## Profile und Familie
- Feste Familien-App mit drei Profilen: Ellena (Häschen mit lila Schleife), Merle (hellblaue Schleife) und Eltern (zwei Eltern-Häschen). Es gibt keine Profilverwaltung.
- Eltern-Bereich: Wochenübersicht je Kind (Lernzeit, Tage, Wörter, Trefferquote, Sterne, 5-Sterne-Wörter, Stolperstellen).
- Abgleich zwischen Geräten über Firebase Firestore (Projekt `vokabeln-ca1d7`, Standort Berlin, per REST ohne SDK, ohne Analytics).
  Die Familie hat einen zufälligen Code (`vt:fam`); Geräte verbindet man mit dem Link `…/#fam=CODE`. Gespeichert wird pro Profil nur Name, Häschen, Lernstand und Lernprotokoll.
  Regeln: `firestore.rules`. Zusammenführen pro Wort nach Zeitstempel (`t`), mehrere Geräte pro Kind sind möglich.

## Spiele, Podeste und Ampel
- Nach einem Übungsdurchlauf (ab 8 Antworten, gezählt pro Tag) darf das Kind **mehrere Spiele** wählen (je **Jump-and-Run** mit 3 Leben oder **Sudoku**). Einstellbar im Eltern-Bereich für die ganze Familie (`cfg` im Eltern-Profil, wird abgeglichen): nach jedem **1.** oder jedem **2.** Durchlauf, 1–5 Spiele je Belohnung. Aktuell (Ferien): nach jedem Durchlauf, 3 Spiele. Keine Pause mitten im Durchlauf. Spielzeit zählt nicht als Lernzeit. Eltern können die Spiele ausschalten (nur dieses Gerät).
- **Jump-and-Run** (`spiel-run.js`): Tippen/Pfeil hoch = springen, 2× = Doppelsprung, nach unten wischen/Pfeil runter = ducken, 2× schnell nach oben wischen/Leertaste 2× = Möhre ziehen. Rekord = weiteste Strecke in Metern (`g.run.bm`). Läuft als **Vollseiten-Overlay** ohne Seiten-Scroll (bewusst ohne echten Browser-Vollbildmodus, weil Chrome dabei eine graue Hinweisleiste einblendet); hochkant erscheint ein Dreh-Hinweis, „Lieber hochkant spielen“ ist möglich, rotes ✕ oben links beendet. Skripte werden mit Versionsnummer (`APPV`) geladen, damit Browser keine veralteten Dateien nutzen; bei jeder Änderung `APPV` erhöhen. Karotten werden nicht in oder hinter Tunnel und Riesenmöhre erzeugt.
- **Hoppel-Blöcke** (`spiel-block.js`): Tetris-Art, 10×20, eine Runde bis das Feld voll ist. Ab und zu fällt ein Hasen-Stein (einzeln oder Zweierblock); drei Hasen in einer Reihe (waagerecht/senkrecht) = Hoppel-Bonus (Hasen verschwinden, darüberliegende Steine rutschen nach). Level = 1 + Punkte/1000: langsam schneller, schwierige Formen (S, Z, Plus, U, W) erst ab Level 4–11; Hasen-Stein (einzeln oder als Zweierblock) etwa jeder 5.–7. Stein. Bedienung ohne Knöpfe und fast ohne Text: Tippen drehen, ziehen schieben, runterwischen fallen lassen; PC: Pfeile links/rechts, Leertaste dreht, Pfeil runter schneller, P = Pause. Rekord = Punkte (`g.block.best`), eigenes Podest.
- **Sudoku** (`spiel-sudoku.js`): klein 6×6 oder groß 9×9, eindeutig lösbar, bis 3 Tipps (je 30 s Strafzeit). Bestzeit je Größe (`g.sd6.fast`, `g.sd9.fast`).
- **Profilwahl:** Kacheln mit **Lernzeit-Ampel** (grün/orange/rot nach Tempo zum Wochenziel 4 Tage × 20 Min, mit Zähler „An x Tagen gelernt · y von 80 Min“) und zwei **Spiele-Podeste** (weitester Lauf, schnellstes Sudoku). Lernstände der Wörter sieht man bei den anderen nicht.
- **Eltern-Code:** Das Eltern-Profil ist mit einem 4-stelligen Code gesperrt (Standard 4444, im Eltern-Bereich änderbar, gilt je Gerät; nach 3 Fehlversuchen kurze Sperre, wird länger) und wird nie automatisch angemeldet. Die Spiele der Eltern liegen dahinter.

## Aussprache
Vorab erzeugte britische MP3s in `audio/` (Google Cloud TTS, en-GB-Neural2-A): normal (Tempo 0,95),
`audio/slow/` langsam (0,5), dazu 26 Buchstabennamen (`audio/letter-*.mp3`). Neue Wörter ohne Datei
nutzen die englische Gerätestimme, sonst erscheint ein Hinweis.

## Bilder
Illustrationen (ChatGPT, Maskottchen „Hoppel“) liegen als WebP in `bilder/` (Originale in `../bilder-original/`, nicht Teil der App).
Vorlage für weitere Bilder: `bilder/ChatGPT-Prompts.md`. Fehlende Bilder bleiben einfach unsichtbar.
Vorhanden: `kaninchen-*`, `ergebnis-0…5`, `profil-ellena|merle|eltern` (Merle = Ellenas Häschen mit hellblauer Schleife, Eltern = zwei Häschen nebeneinander), `schatztruhe-0…4`, `papyrusrolle(-gesperrt)`,
`siegel`, `diplom-1…3` (leere Urkunden), `hintergrund-hell-v2.webp`, `hintergrund-dunkel.jpg`.

## Startsammlung
196 Wörter im Quelltext (`var BASE=`), eigene Wörter in `vt:extra`.
