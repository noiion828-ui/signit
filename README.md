# SignIt — Deine Petition lebt weiter.

Chrome Extension fuer openPetition: Autofill + Micro-Impact Tracking.

## Was es tut

1. **Civic Identity Profil** — Einmal Daten hinterlegen (Name, Email, PLZ, Stadt)
2. **1-Click Autofill** — openPetition Signing-Formular automatisch ausfuellen
3. **Micro-Impact** — "+237 neue Unterschriften seit deiner" — sieh was deine Stimme bewirkt

## Installation (Entwicklung)

1. `chrome://extensions/` oeffnen
2. "Entwicklermodus" aktivieren (oben rechts)
3. "Entpackte Erweiterung laden" → `extension/` Ordner waehlen
4. openPetition.de besuchen → Petition oeffnen → "SignIt: Autofill" Button erscheint

## Architektur

```
extension/
  manifest.json          # Manifest V3, minimal permissions
  popup/                 # Civic Identity Form + Petition Liste
  content/               # openPetition DOM Detection + Autofill
  background/            # Service Worker (Impact Polling)
  shared/                # Storage Wrapper (chrome.storage.local)
```

## Privacy

- Alle Daten lokal im Browser (chrome.storage.local)
- Kein Server-Upload der Civic Identity
- Kein Tracking, keine Analytics, kein Ad-Tech
- Nur openPetition.de als Host Permission

## Roadmap

- [x] Phase 1: Chrome Extension MVP (openPetition Autofill)
- [ ] Phase 2: Mobile App + weitere Plattformen + Gesetzgebungs-Tracking
- [ ] Phase 3: Petition Feed + MC-Meinungsbild
- [ ] Phase 4: "Sign with SignIt" Open Standard

## Lizenz

MIT
