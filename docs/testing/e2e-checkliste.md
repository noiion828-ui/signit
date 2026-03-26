# SignIt E2E Test-Checkliste

## Vorbereitung
- [ ] Extension in `chrome://extensions/` geladen (Entwicklermodus)
- [ ] Alle vorherigen Daten geloescht (Popup → "Alle Daten loeschen")

---

## Test 1: Profil anlegen
**Steps:**
1. Klick SignIt Icon → Popup oeffnet
2. Felder ausfuellen: Vorname, Nachname, Email, PLZ, Stadt
3. "Profil speichern" klicken

**Erwartung:**
- [ ] Gruene Meldung "Gespeichert!"
- [ ] Button wechselt zu "Profil aktualisieren"
- [ ] "Alle Daten loeschen" Button erscheint

---

## Test 2: Profil laden nach Browser-Restart
**Steps:**
1. Chrome komplett schliessen + neu oeffnen
2. SignIt Popup oeffnen

**Erwartung:**
- [ ] Alle Felder sind vorausgefuellt
- [ ] Kein Datenverlust

---

## Test 3: Autofill auf aktiver Petition
**Steps:**
1. Aktive Petition oeffnen: https://www.openpetition.de/petitionen → beliebige mit "Time remaining"
2. Warten bis Seite geladen

**Erwartung:**
- [ ] Lila "SignIt: Autofill" Button erscheint unten rechts
- [ ] Console zeigt: `[SignIt] Form detection: FOUND`

3. Autofill Button klicken

**Erwartung:**
- [ ] Name-Feld wird ausgefuellt (Vorname + Nachname kombiniert)
- [ ] Email-Feld wird ausgefuellt
- [ ] Button zeigt kurz "2 Felder ausgefuellt" (gruen)

---

## Test 4: Autofill auf geschlossener Petition
**Steps:**
1. Geschlossene Petition oeffnen (Status: "Collection finished")

**Erwartung:**
- [ ] Kein Autofill-Button (kein Formular vorhanden)
- [ ] Console: `[SignIt] Form detection: NOT FOUND`

---

## Test 5: Autofill ohne Profil
**Steps:**
1. Alle Daten loeschen (Popup → "Alle Daten loeschen")
2. Petition mit Formular oeffnen
3. Autofill Button klicken

**Erwartung:**
- [ ] Button zeigt "Profil zuerst anlegen →" (gelb)
- [ ] Felder bleiben leer

---

## Test 6: Rate Limiting
**Steps:**
1. Autofill auf 21 verschiedenen Petitionen ausfuehren (oder schnell hintereinander)

**Erwartung:**
- [ ] Nach 20: Button zeigt "Limit (X Min)" (rot)
- [ ] Funktioniert wieder nach Ablauf

---

## Test 7: Petition-Tracking
**Steps:**
1. Autofill auf einer Petition ausfuehren
2. Popup oeffnen → Tab "Petitionen"

**Erwartung:**
- [ ] Petition erscheint in der Liste
- [ ] Titel korrekt
- [ ] Datum korrekt
- [ ] Unterschriften-Zaehler angezeigt

---

## Test 8: Gmail Deeplink Toast
**Steps:**
1. Petition unterschreiben (Autofill → manuell Submit → reCAPTCHA → Adresse → Submit)
2. Warten bis "Email bestaetigen" Meldung erscheint

**Erwartung:**
- [ ] Toast erscheint unten rechts mit "Email bestaetigen"
- [ ] "Gmail oeffnen" Button vorhanden
- [ ] "Outlook" Button vorhanden
- [ ] "OK" schliesst Toast
- [ ] Gmail-Link oeffnet Gmail mit korrektem Suchfilter

---

## Test 9: Impact aktualisieren
**Steps:**
1. Mindestens 1 Petition unterschrieben
2. Popup → Tab "Petitionen" → "Impact aktualisieren" klicken

**Erwartung:**
- [ ] Button zeigt "Aktualisiere..."
- [ ] Nach einigen Sekunden: "Aktualisiert!"
- [ ] Delta wird angezeigt ("+X neue seit dir" oder "Noch keine neuen")

---

## Test 10: Daten loeschen
**Steps:**
1. Popup → "Alle Daten loeschen" → Bestaetigen

**Erwartung:**
- [ ] Alle Felder leer
- [ ] Petitionsliste leer
- [ ] Meldung "Alle Daten geloescht"
- [ ] Badge verschwindet

---

## Bekannte Einschraenkungen
- Step 2 (Adresse) wird per AJAX nach reCAPTCHA injected — Autofill funktioniert nur wenn MutationObserver triggert
- Impact-Polling funktioniert nur wenn Service Worker aktiv ist (Manifest V3 wacht bei Bedarf auf)
- Direct Fetch fuer Impact kann wegen CORS fehlschlagen — dann zeigt Delta 0 bis Supabase Proxy deployed ist
- openPetition kann DOM-Selektoren aendern — dann muessen SELECTORS in openpetition.js aktualisiert werden
