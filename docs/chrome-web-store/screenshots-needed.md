# Screenshots Needed — Chrome Web Store

Chrome Web Store requires 1–5 screenshots at exactly **1280x800** or **640x400** pixels (PNG or JPEG).
Recommended: 1280x800, PNG, no rounded corners (Chrome adds them).

---

## Screenshot 1 — Popup with filled profile

**What to show**: The SignIt popup open, Profile tab active, all fields filled in with example data (Max Mustermann, max@mustermann.de, 10965, Berlin, Musterstr. 42). Save button visible. Status "Profil gespeichert" shown.

**Why**: First thing reviewers and users see. Shows the core value proposition — easy profile setup.

**Setup**:
1. Open extension popup
2. Fill all fields with clean example data
3. Click save so the status message appears
4. Screenshot at 1280x800 with popup centered or docked

---

## Screenshot 2 — Autofill button on openPetition page

**What to show**: A real openPetition.de petition page with the purple "SignIt: Autofill" button visible in the bottom-right corner. The petition signing form should be visible in the background (Step 1 fields: name, email).

**Why**: Shows the extension in action on the target site. Core feature proof.

**Setup**:
1. Navigate to any open petition on openpetition.de/petition/online/*
2. Wait for the content script to inject the button
3. Screenshot full browser window (1280x800) showing petition + SignIt button

---

## Screenshot 3 — Gmail deeplink toast

**What to show**: The SignIt confirmation toast visible on a petition page after signing. Toast shows "Email bestaetigen" headline, explanatory text, and the Gmail + Outlook buttons. The toast should be clearly readable against the petition page background.

**Why**: Differentiating feature — shows SignIt helps complete the full signing flow, not just the form.

**Setup**:
1. On a petition page, manually trigger the toast (or simulate the confirmation message appearing)
2. Screenshot with toast fully visible, bottom-right, over the petition page
3. Crop if needed to highlight the toast

---

## Screenshot 4 — Impact summary in popup (Petitions tab)

**What to show**: The SignIt popup, Petitions tab active, with at least 2–3 petitions listed. The impact counter at the top shows "+1.234 neue Unterschriften seit dir". One petition entry expanded showing title, signing date, and delta count. Green badge visible on extension icon if possible.

**Why**: Shows the tracking/impact feature — the emotional hook that differentiates SignIt from a simple autofill tool.

**Setup**:
1. Sign 2–3 petitions (or mock data in storage)
2. Update counts via "Impact aktualisieren" button
3. Open popup, switch to Petitions tab
4. Screenshot with impact number visible

---

## Screenshot 5 — Landing page (signit.tools)

**What to show**: Full-width screenshot of signit.tools above-the-fold section. Should show headline, tagline, and a clear install CTA button. Clean, professional layout.

**Why**: Establishes brand credibility. Chrome Web Store shows it alongside extension screenshots.

**Setup**:
1. Open signit.tools in Chrome at 1280x800
2. Ensure no browser UI artifacts (use full-screen or crop to page only)
3. Screenshot the hero section

---

## File naming convention

```
screenshot-01-popup-profile.png
screenshot-02-autofill-button.png
screenshot-03-gmail-toast.png
screenshot-04-impact-summary.png
screenshot-05-landing-page.png
```

Save to: `docs/chrome-web-store/screenshots/`

---

## Promotional images (optional but recommended)

- **Small promo tile**: 440x280 PNG — used in search results
- **Large promo tile**: 920x680 PNG — used on featured pages
- **Marquee promo**: 1400x560 PNG — used if featured by Google

These should show the SignIt logo + tagline on a dark background (matching the popup's dark theme: #12121a / #6c5ce7 purple accent).
