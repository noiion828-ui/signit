/**
 * SignIt Content Script — openPetition.de Autofill.
 *
 * openPetition uses a multi-step AJAX form:
 *   Step 1: name + email + visibility (form.petition-signature-form)
 *   Step 2: address + postcode + city + country (injected via AJAX after reCAPTCHA)
 *   Step 3: comment (optional motivation)
 *
 * Field names are ENGLISH on the server side regardless of UI language.
 * Step 2 is dynamically injected — we use MutationObserver to detect it.
 */

// --- Selectors (update here if openPetition changes DOM) ---

const SELECTORS = {
  // Form containers
  formContainer: '#petition-action-container',
  signForm: 'form.petition-signature-form',

  // Step 1 fields
  name: 'form.petition-signature-form input[name="name"]',
  email: 'form.petition-signature-form input[name="email"]',
  visibility: 'select#visibility-signature',
  submitStep1: 'button.button-sign',

  // Step 2 fields (injected after reCAPTCHA)
  address: '[name="address"]',
  postcode: '[name="postcode"]',
  city: '[name="city"]',
  country: '[name="country"]',

  // Petition info
  title: 'h1.headline',
  signatureCount: 'div.progress-box strong',
};

// --- Field Fill Logic ---

function fillField(selector, value) {
  if (!value) return false;
  const el = document.querySelector(selector);
  if (!el) return false;

  el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  // Some frameworks need focus/blur cycle
  el.dispatchEvent(new Event('focus', { bubbles: true }));
  el.dispatchEvent(new Event('blur', { bubbles: true }));
  return true;
}

function extractPetitionInfo() {
  const titleEl = document.querySelector(SELECTORS.title);
  const title = titleEl ? titleEl.textContent.trim() : document.title;

  const countEl = document.querySelector(SELECTORS.signatureCount);
  let count = 0;
  if (countEl) {
    // Count format: "119,469\t\t\tSignatures" or "119.469"
    const text = countEl.innerText.trim().split(/[\t\n]/)[0];
    count = parseInt(text.replace(/[^0-9]/g, ''), 10) || 0;
  }

  return {
    title,
    currentCount: count,
    url: window.location.href.split('?')[0],
  };
}

// --- Autofill Button ---

function createAutofillButton(label, onClick) {
  const btn = document.createElement('button');
  btn.className = 'signit-btn';
  btn.textContent = label;
  btn.type = 'button'; // prevent form submission
  btn.style.cssText = `
    position: fixed; bottom: 20px; right: 20px; z-index: 99999;
    background: #6c5ce7; color: white; border: none;
    padding: 12px 24px; border-radius: 8px;
    font-size: 14px; font-weight: 600; cursor: pointer;
    box-shadow: 0 4px 12px rgba(108,92,231,0.4);
    transition: all 0.2s;
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
  `;
  btn.addEventListener('mouseenter', () => { btn.style.transform = 'scale(1.05)'; });
  btn.addEventListener('mouseleave', () => { btn.style.transform = 'scale(1)'; });
  btn.addEventListener('click', onClick);
  document.body.appendChild(btn);
  return btn;
}

function showButtonFeedback(btn, text, color, duration = 2500) {
  const origText = btn.textContent;
  const origBg = btn.style.background;
  btn.textContent = text;
  btn.style.background = color;
  setTimeout(() => {
    btn.textContent = origText;
    btn.style.background = origBg;
  }, duration);
}

// --- Step 1: Name + Email ---

async function handleStep1Fill(btn) {
  // Rate limit check
  const rateCheck = await checkRateLimit();
  if (!rateCheck.allowed) {
    showButtonFeedback(btn, `Limit (${rateCheck.minutesLeft} Min)`, '#e17055');
    return;
  }

  const identity = await getIdentity();
  if (!identity) {
    showButtonFeedback(btn, 'Profil zuerst anlegen →', '#fdcb6e');
    return;
  }

  let filled = 0;

  // Combine firstName + lastName into single name field
  const fullName = [identity.firstName, identity.lastName].filter(Boolean).join(' ');
  if (fillField(SELECTORS.name, fullName)) filled++;
  if (fillField(SELECTORS.email, identity.email)) filled++;

  // Set visibility to "public" by default
  const visSelect = document.querySelector(SELECTORS.visibility);
  if (visSelect) {
    visSelect.value = '0'; // public
    visSelect.dispatchEvent(new Event('change', { bubbles: true }));
  }

  await recordAutofill();

  // Track petition
  const petitionInfo = extractPetitionInfo();
  await addSignedPetition(petitionInfo);

  if (filled > 0) {
    showButtonFeedback(btn, `${filled} Felder ausgefuellt`, '#00b894');
    btn.textContent = 'SignIt: Adresse (Step 2)';
  } else {
    showButtonFeedback(btn, 'Keine Felder gefunden', '#e17055');
  }
}

// --- Step 2: Address (injected after reCAPTCHA) ---

async function handleStep2Fill(btn) {
  const identity = await getIdentity();
  if (!identity) return;

  let filled = 0;

  if (fillField(SELECTORS.address, identity.street)) filled++;
  if (fillField(SELECTORS.postcode, identity.postalCode)) filled++;
  if (fillField(SELECTORS.city, identity.city)) filled++;

  // Set country to Germany (value="2")
  const countrySelect = document.querySelector(SELECTORS.country);
  if (countrySelect) {
    countrySelect.value = '2'; // Deutschland
    countrySelect.dispatchEvent(new Event('change', { bubbles: true }));
    filled++;
  }

  if (filled > 0) {
    showButtonFeedback(btn, `${filled} Adress-Felder ausgefuellt`, '#00b894');
  }
}

// --- MutationObserver for Step 2 ---

function watchForStep2(btn) {
  const container = document.querySelector(SELECTORS.formContainer);
  if (!container) return;

  const observer = new MutationObserver((mutations) => {
    // Check if address fields appeared
    const addressField = document.querySelector(SELECTORS.address);
    if (addressField) {
      // Step 2 is visible — update button
      btn.textContent = 'SignIt: Adresse ausfuellen';
      btn.onclick = () => handleStep2Fill(btn);

      // Auto-fill if identity has address data
      getIdentity().then(identity => {
        if (identity && identity.street) {
          handleStep2Fill(btn);
        }
      });
    }
  });

  observer.observe(container, {
    childList: true,
    subtree: true,
  });
}

// --- Init ---

function init() {
  // Detect if we're on a petition page with a signing form
  const form = document.querySelector(SELECTORS.signForm);
  if (!form) return;

  // Create autofill button
  const btn = createAutofillButton('SignIt: Autofill', () => handleStep1Fill(btn));

  // Watch for Step 2 (address form injected after reCAPTCHA)
  watchForStep2(btn);

  // Auto-fill Step 1 if identity exists
  getIdentity().then(identity => {
    if (identity) {
      // Small delay to ensure form is fully rendered
      setTimeout(() => handleStep1Fill(btn), 500);
    }
  });
}

// Wait for DOM ready, then init
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
