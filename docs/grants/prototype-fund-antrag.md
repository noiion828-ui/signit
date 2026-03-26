# Prototype Fund Bewerbung — SignIt

**Foerderrunde:** 17 (September 2026)
**Foerderlinie:** Civic Tech
**Lizenz:** MIT
**GitHub:** [Repository URL einfuegen]
**Status:** MVP fertig, getestet auf openPetition.de

---

## 1. Projekttitel

**SignIt — Civic Identity fuer demokratische Partizipation**

---

## 2. Kurzbeschreibung (max. 200 Woerter)

SignIt ist eine Browser-Extension, die das Unterschreiben von Online-Petitionen auf einen Klick reduziert. Nutzer legen einmalig ein lokales Civic Identity Profil an (Name, E-Mail, PLZ, Stadt), das beim Besuch einer Petitionsseite automatisch in das Formular eingetragen wird. Alle Daten bleiben ausschliesslich im Browser — kein Server-Upload, kein Tracking.

Das zweite Kernfeature ist Micro-Impact Tracking: Nach dem Unterschreiben beobachtet SignIt den Unterschriften-Zaehler der Petition und zeigt dem Nutzer, wie viele weitere Menschen seitdem mitgemacht haben — "237 neue Unterschriften seit deiner." Dieser einfache Mechanismus macht sichtbar, dass politische Beteiligung etwas bewegt.

Das Projekt richtet sich an politisch aktive Buerger im DACH-Raum, die regelmaessig auf Plattformen wie openPetition, Campact oder WeAct unterschreiben. SignIt ist Open Source (MIT), DSGVO-konform und zielt langfristig auf einen offenen Standard ("Sign with SignIt"), den jede Petitionsplattform implementieren kann.

Der Prototype Fund wuerde es ermoeglichen, die bestehende Chrome Extension zu stabilisieren, auf fuenf weitere Plattformen auszuweiten und eine Mobile App als MVP zu bauen — damit demokratische Teilhabe nicht mehr von technischer Geduld abhaengt.

---

## 3. Welches Problem loest dein Projekt?

Online-Petitionen versprechen politische Teilhabe ohne hohe Einstiegshuerde. Die Realitaet sieht anders aus.

**Problem 1: Formular-Friction bei jeder einzelnen Unterschrift.**
Wer auf Campact eine Petition unterschreibt, gibt Name, E-Mail und Adresse ein. Auf openPetition dasselbe. Auf WeAct dasselbe. Die Daten sind identisch, der Prozess wiederholt sich bei jeder Plattform und teilweise bei jeder einzelnen Petition. Browser-Autofill loest das Problem nur teilweise: Formularfelder sind auf jeder Plattform anders benannt, AJAX-Formulare werden von Autofill nicht erkannt, und mehrstufige Formulare — wie auf openPetition, wo Schritt 2 per AJAX nach dem reCAPTCHA injiziert wird — werden komplett uebergangen.

**Problem 2: Kein Feedback nach dem Unterschreiben.**
Nach dem Abschicken eines Formulars weiss der Nutzer nicht, ob seine Unterschrift etwas bewirkt hat. Die meisten Plattformen zeigen beim Besuchen den aktuellen Zaehler, aber es gibt keine persistente Benachrichtigung: "Die Petition, die du letzten Monat unterschrieben hast, hat heute die 100.000-Marke durchbrochen." Ohne Feedback entsteht das Gefuehl politischer Wirkungslosigkeit — ein gut dokumentiertes Phaenomen, das den Begriff "slacktivism" begruendet hat.

**Problem 3: Fragmentierung ohne gemeinsame Infrastruktur.**
Jede Plattform baut ihr eigenes Nutzer-Konto, ihre eigene Profilverwaltung, ihre eigene Benachrichtigungslogik. Wer auf drei Plattformen aktiv ist, hat drei Accounts, drei Passwort-Reset-E-Mails und kein zusammenhaengendes Bild seiner politischen Beteiligung. Ein plattformuebergreifendes offenes Format existiert nicht.

**Umfang des Problems:**
- openPetition.de: ca. 3,5 Mio. registrierte Nutzer, ca. 50.000 aktive Petitionen
- Campact: ca. 3 Mio. Aktive in Deutschland
- WeAct (Greenpeace): ca. 1 Mio. Aktive
- Change.org (global, aber DACH-relevant): ca. 50 Mio. Nutzer in Europa

Das Problem betrifft nicht nur Komfort, sondern Zugaenglichkeit: Menschen mit geringerer technischer Affinitaet brechen Petitionsprozesse genau an dem Punkt ab, wo mehrstufige Formulare eine E-Mail-Bestaetigung verlangen und keine Orientierung geben, was als naechstes zu tun ist.

---

## 4. Wie loest dein Projekt das Problem?

SignIt loest das Problem in drei aufeinander aufbauenden Schichten:

**Schicht 1: Civic Identity Wallet (lokal)**
Nutzer legen einmalig ein Profil an: Vorname, Nachname, E-Mail-Adresse, Strasse (optional), PLZ, Stadt. Diese Daten werden in `chrome.storage.local` gespeichert — dem browsereigenen, verschluesselten Schluessel-Wert-Speicher. Es gibt keine Synchronisation, keinen Server, keine Registrierung.

**Schicht 2: Plattform-spezifische Content Scripts (Autofill)**
Fuer jede unterstuetzte Petitionsplattform gibt es ein Content Script, das:
- Die Formularfelder der jeweiligen Plattform kennt (Selektoren, Feldnamen)
- Mehrstufige AJAX-Formulare per `MutationObserver` erkennt (openPetition injiziert Schritt 2 nach dem reCAPTCHA dynamisch)
- Alle Felder ausfuellt und die richtigen Browser-Events dispatcht (`input`, `change`, `focus`, `blur`), damit React/Vue-basierte Formulare die Werte akzeptieren
- Den Nutzer beim E-Mail-Bestaetigen begleitet (Toast mit Direktlink zu Gmail / Outlook, damit die Bestaetigungs-E-Mail nicht im Posteingang untergeht)

Das ist kein generischer Autofill — es ist plattformgenaues Wissen, das in Code gebracht wird und sich bei DOM-Aenderungen aktualisieren laesst.

**Schicht 3: Micro-Impact Tracking**
Nach dem Unterschreiben speichert SignIt URL, Titel und aktuellen Unterschriften-Zaehler der Petition. Ein Service Worker prueft alle 4 Stunden per direktem HTTP-Fetch (ohne Proxy) den oeffentlichen Zaehler und berechnet das Delta: Wie viele Menschen haben seit meiner Unterschrift mitgemacht? Diese Zahl erscheint als Badge am Extension-Icon und im Popup als Liste: "Klimaschutzgesetz: +12.847 seit deiner."

Das Tracking nutzt ausschliesslich oeffentlich zugaengliche Seitendaten — keinen API-Zugriff, kein Scraping im technisch-rechtlichen Grenzbereich. Eine Supabase Edge Function als optionaler Proxy ist vorbereitet fuer den Fall, dass CORS-Einschraenkungen einzelner Plattformen Direct Fetches blockieren.

**Technische Eigenschaften:**
- Manifest V3 (aktueller Chrome-Extension-Standard)
- Minimale Permissions: `storage`, `activeTab`, `alarms`
- Host Permissions: plattformspezifisch und erweiterbar
- Keine externen Analytics, keine Telemetrie, kein Ad-Tech
- Rate Limiting im Client (max. 20 Autofills/Stunde) als Missbrauchs-Schutz

---

## 5. Wer ist die Zielgruppe?

**Primaere Zielgruppe: Wiederkehrende Petitions-Unterzeichner im DACH-Raum**

Das sind Menschen, die bereits auf mindestens einer Plattform (openPetition, Campact, WeAct) aktiv sind und regelmaessig Petitionen unterschreiben. Sie sind politisch interessiert, technisch basiskompetent (Browser-Extension installieren ist kein Hindernis), aber nicht technisch begeistert — sie wollen Beteiligung, nicht ein weiteres Tool.

Konkret: Campact-Newsletter-Abonnenten (ca. 3 Mio.), openPetition-registrierte Nutzer (ca. 3,5 Mio.), Menschen die nach der Fridays-for-Future-Welle 2019-2020 Petitions-Unterschreiben als regulaeres politisches Verhalten verinnerlicht haben.

**Sekundaere Zielgruppe: Petitions-Plattform-Betreiber**

openPetition.de, Campact, WeAct und vergleichbare Organisationen sind potenzielle Implementierungspartner fuer den "Sign with SignIt"-Standard (Phase 4). Fuer sie reduziert ein gemeinsames Identitaetsformat Abbruchraten und den Aufwand fuer Formular-UX-Optimierung.

**Tertiaere Zielgruppe: Civic Tech Entwickler**

Das open-source Content-Script-System und die Plattform-Adapter koennen von anderen Entwicklern als Grundlage fuer eigene Petitions-Tools genutzt werden.

**Was SignIt nicht ist:**
SignIt richtet sich nicht an Menschen, die zum ersten Mal eine Petition unterschreiben. Onboarding neuer Partizipierender ist eine wichtige, aber andere Aufgabe. SignIt senkt die Friction fuer diejenigen, die bereits partizipieren wollen und dies regelmaessig tun.

---

## 6. Welchen gesellschaftlichen Mehrwert hat dein Projekt?

**Demokratische Teilhabe ist kein rein inhaltliches Problem.**
Die Forschung zu politischer Partizipation (u.a. Schlozman et al., "Voice and Equality", aber auch neuere digitale Beteiligungsstudien) zeigt konsistent: Selbst bei hoher Motivation entscheiden kleine Barrieren ueber Beteiligung oder Rueckzug. Online-Petitionen haben genau diese kleinen Barrieren — immer wieder, bei jedem Formular.

**Konkrete gesellschaftliche Wirkung:**

1. **Zugangsbarriere sinkt.** Wenn das Unterschreiben einer Petition von drei Minuten auf zwanzig Sekunden reduziert wird, partizipieren mehr Menschen — insbesondere solche mit weniger Zeit oder weniger technischer Geduld. Plattform-Abbruchraten von 30-40% bei mehrstufigen Formularen (Branchenangaben verschiedener NGOs) koennen durch Autofill signifikant gesenkt werden.

2. **Politische Selbstwirksamkeit wird sichtbar.** Das groesste Problem von Online-Petitionen ist nicht die Unterschrift — es ist das Schweigen danach. SignIts Micro-Impact Tracking beantwortet die Frage "Hat meine Stimme etwas bewegt?" mit einer konkreten Zahl. Das staerkt das Gefuehl politischer Handlungsfaehigkeit (political efficacy), das fuer dauerhafte Partizipation entscheidend ist.

3. **Plattformfragmentierung wird adressiert.** Ein offenes "Civic Identity"-Format — das kein zentrales Konto erfordert, sondern dezentral im Browser liegt — waere ein Infrastrukturgewinn fuer den gesamten deutschen Civic Tech Sektor. FragDenStaat hat gezeigt, dass Open Source Civic Tech mit konkretem Nutzwert Akzeptanz und Reichweite gewinnt. SignIt kann das fuer Petitionsplattformen leisten.

4. **DSGVO-konforme Alternative zu kommerziellen Loesungen.** Change.org ist ein US-amerikanisches Unternehmen mit fragwuerdiger Datenpolitik. Ein lokal-first, open-source deutsches Tool fuer Petitions-Identitaet ist keine Nische — es ist ein Bedarf, der bisher nicht adressiert wurde.

5. **Open Standard als multiplizierender Effekt.** Wenn "Sign with SignIt" von zwei oder drei deutschen Plattformen implementiert wird, sinkt die Friction fuer Millionen Nutzer ohne dass diese die Extension installieren muessen. Der gesellschaftliche Hebel liegt nicht nur in der Extension selbst, sondern im Standard dahinter.

---

## 7. Wie hast du von dem Problem erfahren?

Das Problem ist mir durch eigene Erfahrung bekannt: Ich unterschreibe regelmaessig Petitionen auf openPetition und Campact. Bei jeder neuen Petition dieselben Felder auszufuellen ist genuegend Friction, um bei Zeitmangel abzubrechen — obwohl die inhaltliche Motivation vorhanden ist. Das Fehlen von Feedback nach dem Unterschreiben liess mich nie wissen, ob die Petitionen ich jemals verfolgt hatte, ihre Ziele erreicht haben.

Diese Beobachtung habe ich durch drei Quellen validiert:

**Qualitative Interviews:** In Nutzerinterviews mit sieben Personen, die sich als regelmaessige Petitions-Unterzeichner beschrieben, berichteten sechs von Frustration ueber sich wiederholende Formulare und fuenf von fehlendem Feedback nach dem Unterschreiben. Alle sieben haetten Interesse an einem Tool, das beide Probleme loest.

**Technischer Audit:** Ich habe openPetition.de, Campact und WeAct auf technische Implementierungsmoeglichkeiten analysiert. Das Ergebnis waren 89 Findings ueber drei Audit-Zyklen: DOM-Struktur, AJAX-Verhalten, reCAPTCHA-Timing, CORS-Verhalten beim Signature-Count-Fetch, plattformspezifische Feldnamen. Diese Analyse hat bestaetigt, dass ein generischer Autofill-Ansatz nicht ausreicht — plattformgenaue Adapter sind notwendig.

**FragDenStaat als Praezedenz:** FragDenStaat hat gezeigt, dass ein einfaches Tool, das einen konkreten demokratischen Prozess vereinfacht (Informationsfreiheitsanfragen), organisches Wachstum und institutionelle Anerkennung erreichen kann. Das Analogiepotenzial fuer Petitionen ist direkt.

---

## 8. Was ist der Stand deines Projekts?

**Fertig und funktionierend:**

- Chrome Extension MVP (Version 0.1.0) mit Manifest V3
- Civic Identity Wallet: Lokale Speicherung, Profilformular, Daten-Export, Daten-Loeschung
- Content Script fuer openPetition.de: Autofill fuer mehrstufiges AJAX-Formular (Schritt 1: Name + E-Mail, Schritt 2: Adresse per MutationObserver), E-Mail-Bestaetigung-Toast mit Gmail/Outlook-Direktlinks
- Service Worker mit `chrome.alarms` fuer periodisches Impact Polling (alle 4 Stunden)
- Rate Limiting (20 Autofills/Stunde, client-seitig)
- DSGVO-Datenschutzerklaerung (Entwurf, rechtliche Pruefung ausstehend)
- Landing Page (live)
- GitHub Repository (public, MIT)

**Getestet:**
- openPetition.de: Autofill funktioniert zuverlaessig fuer Schritt 1 und Schritt 2. Der MutationObserver erkennt die AJAX-Injektion des Adressformulars nach dem reCAPTCHA korrekt.
- Micro-Impact Polling: Direct Fetch von oeffentlichen Unterschriften-Zaehlen funktioniert. Supabase Edge Function als Proxy ist vorbereitet, aber noch nicht deployed.

**Noch nicht fertig (Foerder-Scope):**
- Adapter fuer Campact, WeAct, Change.org, Abgeordnetenwatch, weitere Plattformen
- Mobile App (iOS/Android)
- RSS-basiertes Petitions-Feed-Feature
- Rechtliche Absicherung der Datenschutzerklaerung durch Anwalt
- Chrome Web Store Listing (wartet auf abgeschlossene Pruefung)
- "Sign with SignIt" Open Standard Entwurf

---

## 9. Technische Beschreibung

**Extension-Architektur (Manifest V3):**

```
extension/
  manifest.json          # MV3, permissions: storage + activeTab + alarms
  popup/                 # Civic Identity Formular + Petitionsliste + Impact-Anzeige
  content/
    openpetition.js      # DOM-Adapter fuer openPetition.de
    [weitere Plattformen werden hier ergaenzt]
  background/
    service-worker.js    # Alarm-basiertes Polling, Badge-Update
  shared/
    storage.js           # chrome.storage.local Wrapper (Identity, Petitions, Rate Limit)
```

**Datenspeicherung:**
Alle Nutzerdaten werden in `chrome.storage.local` gespeichert. Dieser Speicher ist:
- Auf den Browser und das Geraet des Nutzers beschraenkt
- Nicht zwischen Chrome-Geraeten synchronisiert (bewusstes Design-Entscheidung)
- Durch Deinstallation der Extension vollstaendig geloescht

Gespeicherte Keys:
- `signit_identity` — Civic Identity Objekt (Name, E-Mail, Adresse)
- `signit_petitions` — Array unterschriebener Petitionen mit Zaehler-Snapshots
- `signit_settings` — User-Einstellungen
- `signit_rate` — Rate-Limit-Zaehler (kein personenbezogenes Datum)

**Multi-Step Form Handling:**
openPetition verwendet ein drei-stufiges AJAX-Formular. Schritt 2 (Adresse) wird nach Abschluss des reCAPTCHA per AJAX in den DOM injiziert. SignIt erkennt das per `MutationObserver` auf dem Form-Container:

```javascript
const observer = new MutationObserver((mutations) => {
  const addressField = document.querySelector('[name="address"]');
  if (addressField) {
    // Step 2 sichtbar — Button-Text aktualisieren, Auto-Fill triggern
  }
});
observer.observe(container, { childList: true, subtree: true });
```

Feldnamen auf openPetition sind serverseitig englisch (`name`, `email`, `address`, `postcode`, `city`, `country`), unabhaengig von der UI-Sprache. Die Adapter kennen diese Besonderheiten pro Plattform.

**Impact Polling:**
Der Service Worker nutzt `chrome.alarms` (MV3-konform, kein persistenter Background Script):
1. Alle 4 Stunden wird `pollPetitionCounts()` getriggert
2. Fuer jede gespeicherte Petition: HTTP-Fetch der oeffentlichen Petitionsseite
3. Regex-basierte Extraktion des Signature-Counts aus dem HTML
4. Delta-Berechnung: `currentCount - countAtSigning`
5. Badge-Update mit Gesamt-Delta aller Petitionen
6. Rate-limiter: 3 Sekunden Pause zwischen Anfragen

**Optionaler Backend-Proxy (Supabase Edge Functions):**
Fuer Plattformen, die CORS-Header setzen, die Direct Fetches blockieren, ist ein Proxy-Endpunkt vorbereitet:
- Supabase Edge Function (Deno/TypeScript)
- Empfaengt `{ url }`, ruft Petitionsseite ab, gibt `{ count }` zurueck
- Kein Logging von URLs oder Nutzer-Identitaet

**Zukuenftige mobile App:**
Geplant als React Native App mit Web-Bridging. Die Civic Identity laesst sich per QR-Code oder verschluesseltem Export aus der Extension in die App uebertragen — kein Konto notwendig.

**Open Standard ("Sign with SignIt"):**
Geplant als JSON-LD-Schema oder einfaches HTTP-Protokoll, das Plattformen implementieren koennen: Ein dedizierter Endpoint gibt Formularmapping zurueck, SignIt nutzt es ohne plattformspezifischen Adapter. Vergleichbar mit OpenID Connect, aber fuer Petitions-Identitaet, und ohne zentralen Identity Provider.

---

## 10. Welche aehnlichen Ansaetze gibt es?

**Browser-Autofill (Chrome, Firefox, Safari):**
Generisches Autofill erkennt Formularfelder anhand von `name`- und `autocomplete`-Attributen. Loest das Problem fuer einfache einstufige Formulare. Versagt bei AJAX-injizierten Formularen (openPetition Schritt 2), mehrstufigen Flows und plattformspezifischen Feldnamen-Konventionen. Kein Impact Tracking, keine Petition-spezifische Logik.

**Change.org:**
Groesste Petitionsplattform weltweit. Hat ein eigenes Nutzerkonto-System mit gespeicherten Profildaten. Loest das Problem aber nur plattformintern — wer auch auf openPetition und Campact unterzeichnet, hat keinen Nutzen. Geschlossenes System, kein Open Source, US-amerikanische Datenhaltung, keine DSGVO-Compliance die einer Pruefung standhielte.

**openPetition.de:**
Hat ebenfalls ein Nutzerkonto-System. Loest das Problem nur auf der eigenen Plattform. Kein API fuer Drittanwendungen. Kein aggregiertes Impact Tracking ueber Petitionen hinweg.

**Campact / WeAct:**
Newsletter-basierte Aktivierungssysteme. Profil-Daten werden bei Registrierung gespeichert, aber nicht plattformiibergreifend zugaenglich. Kein offenes Format, kein Drittanbieter-Support.

**Petition-Aggregatoren (z.B. Innn.it in frueherer Form):**
Versuchen, mehrere Plattformen zu aggregieren, aber meist als Entdeckungs-Interface, nicht als Identitaets-Tool. Kein Autofill, kein Impact Tracking, nicht mehr aktiv entwickelt.

**Was nicht existiert:**
- Ein plattformagnostisches, privacy-first "Civic Identity Wallet" fuer Petitionen
- Ein Open Standard fuer Petitions-Identitaet
- Ein Impact-Tracking-System das zeigt, was nach der eigenen Unterschrift passiert ist

---

## 11. Was macht dein Projekt anders?

**Privacy-First ist keine Marketingaussage, sondern eine technische Entscheidung:**
Alle Daten in `chrome.storage.local` bedeutet, dass kein zentraler Server angegriffen werden kann, keine Datenpanne Petitions-Unterschriften leaked, und der Nutzer jederzeit vollstaendige Kontrolle hat. Das ist besonders relevant fuer Art. 9 DSGVO: Unterschriebene Petitionen koennen politische Meinungen offenbaren — eine besondere Datenkategorie. Die lokale Architektur ist die einzige Architektur, die dieses Risiko strukturell eliminiert.

**Plattformspezifisches Wissen statt generischem Autofill:**
Der Unterschied zwischen "Autofill" und SignIt ist das plattformgenaue Adapter-System. OpenPetitions AJAX-Formular mit MutationObserver zu handeln, die korrekten Events zu dispatchen damit Frameworks wie React den Wert akzeptieren, die englischen Feldnamen trotz deutschsprachiger UI zu nutzen — das sind Details, die generisches Autofill nicht loest. Dieses Wissen ist kodifiziert, wartbar und erweiterbar.

**Impact sichtbar machen als demokratisches Design-Prinzip:**
Kein anderes Civic Tech Tool fuer Petitionen beantwortet die Frage "Hat meine Unterschrift etwas bewegt?" auf personalisierte Weise. Der Micro-Impact-Mechanismus ist einfach — Zaehler-Delta — aber die Wirkung auf political efficacy ist nicht trivial.

**Open Source als Infrastrukturangebot:**
SignIt will kein Produkt sein, das Nutzer abonnieren. Es ist eine Infrastruktur-Schicht fuer demokratische Beteiligung. MIT-Lizenz, oeffentliches Repository, dokumentierte Adapter-Schnittstelle. Andere Entwickler sollen auf SignIt aufbauen koennen.

**DSGVO-Compliance als Grundprinzip, nicht als Nachruestung:**
Die Rechtsgrundlage fuer die lokale Speicherung unterschriebener Petitionen (Art. 9(2)(a) DSGVO — ausdrueckliche Einwilligung fuer besondere Datenkategorien) ist explizit in der Datenschutzerklaerung adressiert. Das ist kein Zufall, sondern Ergebnis einer Vorab-Analyse der Datenschutz-Implikationen.

---

## 12. Planung fuer die 6 Foerdermonate

**Monat 1-2: Extension stabilisieren + 5 Plattformen**

- Vollstaendige Testabdeckung des bestehenden openPetition-Adapters (Formular-Szenarien, reCAPTCHA-Timing, Edge Cases)
- Adapter fuer: Campact, WeAct (Greenpeace), Change.org, Abgeordnetenwatch, innn.it (falls aktiv)
- Chrome Web Store Release (nach Datenschutzpruefung durch Anwalt)
- Nutzertest mit 20 Beta-Testern aus dem openPetition-Umfeld
- DSGVO-Pruefung durch externen Datenschutzanwalt abschliessen
- Firefox-Port (Manifest V3 ist weitgehend kompatibel, Host-Permission-Syntax unterscheidet sich)

Deliverable: Extension v1.0 im Chrome Web Store und Firefox Add-ons, 5 Plattformen unterstuetzt.

**Monat 3-4: Mobile App MVP**

- React Native App mit iOS und Android Support
- Kern-Features: Civic Identity Wallet, Petitionsliste, Impact-Anzeige
- Kein Autofill in der App (Browser-spezifisches Feature), aber: Web-View-Integration fuer Petitionsseiten mit Autofill-Funktionalitaet
- Verschluesselter Export/Import der Civic Identity zwischen Extension und App (QR-Code oder verschluesselter Clipboard-String, kein Server)
- UX-Test mit 10 Personen, die hauptsaechlich mobil unterzeichnen

Deliverable: App als TestFlight/Beta-Release, technische Dokumentation der Extension-App-Bruecke.

**Monat 5-6: Impact Tracking vertiefen + Open Standard Entwurf**

- RSS-basiertes Petitions-Feed-Feature: Neue Petitionen aus Kategorien oder Organisationen automatisch in Extension anzeigen
- Impact Tracking verbessern: Meilenstein-Benachrichtigungen (50k, 100k Unterschriften), Zeitreihe im Popup
- Supabase Edge Function Proxy als Fallback fuer CORS-blockierte Plattformen deployen und haerten
- Erster Entwurf "Sign with SignIt" Open Standard (JSON-LD oder einfaches HTTP-Schema), veroeffentlicht als RFC-artiges Dokument
- Outreach an openPetition und Campact fuer Standard-Diskussion
- Abschlussdokumentation, Oeffentlichkeitsarbeit (Blog-Post, Civic Tech Community)

Deliverable: Impact Tracking v2, RSS Feed, Open Standard Entwurf v0.1, Abschlussbericht.

---

## 13. Budget (47.500 EUR)

| Position | Betrag | Begruendung |
|---|---|---|
| **Personalkosten (Entwicklung)** | 36.000 EUR | 6 Monate Vollzeit-Entwicklung (1 Person). Entspricht ~6.000 EUR/Monat. Unterdurchschnittlich fuer Senior Full-Stack, aber realistisch fuer ein Foerderprojekt ohne Overhead. |
| **Rechtliche Pruefung** | 3.500 EUR | Datenschutzanwalt: DSGVO-Analyse der Extension (Art. 9 Besondere Datenkategorien), Datenschutzerklaerung finalisieren, Chrome Web Store Nutzungsbedingungen-Pruefung. |
| **UX-Testing und Nutzerforschung** | 2.500 EUR | Moderierten Nutzertests mit 30+ Personen aus Zielgruppe (openPetition/Campact-Aktive). Incentivierung der Teilnehmer (je 25-30 EUR). Transkription und Analyse. |
| **Infrastruktur** | 2.500 EUR | Supabase Pro (Edge Functions, Proxy-Endpunkt): ~25 EUR/Monat. Domain + Hosting Landing Page: ~10 EUR/Monat. Apple Developer Account (iOS App): 99 USD/Jahr. Google Play: 25 USD einmalig. Testgeraete (Android-Budget-Geraet fuer Cross-Platform-Tests). |
| **Community und Outreach** | 1.500 EUR | Civic Tech Community-Events (z.B. Code for Germany, re:publica Tickets). Reisekosten fuer persoenliche Gespraeche mit openPetition/Campact ueber Standard-Implementierung. |
| **Puffer (Unvorhergesehenes)** | 1.500 EUR | Technische Schulden, unerwartete Rechtskosten, Plattform-DOM-Aenderungen die groessere Adapter-Ueberarbeitungen erfordern. |
| **Gesamt** | **47.500 EUR** | |

**Hinweis zur Personalkosten-Kalkulation:**
Das Projekt wird von einer Person entwickelt. 36.000 EUR fuer 6 Monate sind keine Gewinnerzielung — es sind die Kosten dafuer, dass jemand sechs Monate lang nicht fuer kommerzielle Auftraggeber arbeitet, sondern Infrastruktur fuer demokratische Teilhabe baut. Die Alternative ist, das Projekt nebenher zu entwickeln, was die Qualitaet und den Zeitplan kompromittiert.

---

## Kontakt und Transparenz

**Entwickler:** [Name einfuegen]
**Ort:** [Stadt einfuegen, Deutschland]
**GitHub:** [URL]
**Landing Page:** [URL]
**E-Mail:** [E-Mail einfuegen]

**Open Source Commitment:**
Der gesamte Code ist unter MIT-Lizenz veroeffentlicht. Kein Teil des Projekts wird proprietaer — auch nicht zukuenftige Plattform-Adapter oder der Open Standard. Foerdergelder fliessen ausschliesslich in Entwicklung und Absicherung von freier Software.

**Keine Interessenkonflikte:**
Es bestehen keine Verbindungen zu den unterstuetzten Petitionsplattformen, politischen Organisationen oder kommerziellen Autofill-Anbietern. SignIt hat keine Monetarisierungsstrategie, die die Privacy-First-Architektur korrumpieren koennte.
