# Vokabeltrainer

Eigenständige Rechtschreib-App für englische Vokabeln (UK-Englisch), Grundschule.
Eine einzige `index.html`, keine Abhängigkeiten, läuft im Browser und speichert nur im Gerät
(`localStorage`, Schlüssel mit Präfix `vt:`). Keine Verbindung zur Schul-App.

## Lernen
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
174 Wörter im Quelltext (`var BASE=`), eigene Wörter in `vt:extra`.
