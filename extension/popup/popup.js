/**
 * SignIt Popup — Civic Identity Management + Petition Overview.
 * Self-contained: Storage functions inline (no external import issues).
 */

console.log('[SignIt Popup] popup.js executing...');

// --- Inline Storage (avoid cross-file import issues) ---

const IDENTITY_KEY = 'signit_identity';
const PETITIONS_KEY = 'signit_petitions';

async function popupGetIdentity() {
  const result = await chrome.storage.local.get(IDENTITY_KEY);
  return result[IDENTITY_KEY] || null;
}

async function popupSaveIdentity(identity) {
  const data = {
    ...identity,
    version: 1,
    updatedAt: new Date().toISOString(),
  };
  if (!data.createdAt) data.createdAt = data.updatedAt;
  await chrome.storage.local.set({ [IDENTITY_KEY]: data });
  return data;
}

async function popupClearAll() {
  await chrome.storage.local.remove([IDENTITY_KEY, PETITIONS_KEY, 'signit_rate']);
}

async function popupGetPetitions() {
  const result = await chrome.storage.local.get(PETITIONS_KEY);
  return result[PETITIONS_KEY] || [];
}

// --- Tab Navigation ---

document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(`panel-${tab.dataset.tab}`).classList.add('active');
  });
});

// --- Identity Form ---

const form = document.getElementById('identity-form');
const saveStatus = document.getElementById('save-status');
const clearBtn = document.getElementById('clear-btn');
const fields = ['firstName', 'lastName', 'email', 'postalCode', 'city', 'street'];

async function loadIdentity() {
  try {
    const identity = await popupGetIdentity();
    console.log('[SignIt Popup] Loaded identity:', identity ? 'exists' : 'empty');
    if (identity) {
      fields.forEach(f => {
        const el = document.getElementById(f);
        if (el && identity[f]) el.value = identity[f];
      });
      clearBtn.style.display = 'block';
      document.getElementById('save-btn').textContent = 'Profil aktualisieren';
    }
  } catch (err) {
    console.error('[SignIt Popup] loadIdentity error:', err);
  }
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  console.log('[SignIt Popup] Saving identity...');

  const identity = {};
  fields.forEach(f => {
    const val = document.getElementById(f).value.trim();
    if (val) identity[f] = val;
  });

  try {
    await popupSaveIdentity(identity);
    saveStatus.textContent = 'Gespeichert!';
    saveStatus.className = 'status success';
    clearBtn.style.display = 'block';
    document.getElementById('save-btn').textContent = 'Profil aktualisieren';
    console.log('[SignIt Popup] Identity saved:', identity);
  } catch (err) {
    saveStatus.textContent = 'Fehler: ' + err.message;
    saveStatus.className = 'status error';
    console.error('[SignIt Popup] Save error:', err);
  }

  setTimeout(() => { saveStatus.textContent = ''; saveStatus.className = 'status'; }, 2000);
});

clearBtn.addEventListener('click', async () => {
  if (confirm('Alle SignIt-Daten loeschen? (Profil + Petitionen)')) {
    await popupClearAll();
    fields.forEach(f => { document.getElementById(f).value = ''; });
    clearBtn.style.display = 'none';
    document.getElementById('save-btn').textContent = 'Profil speichern';
    saveStatus.textContent = 'Alle Daten geloescht.';
    saveStatus.className = 'status error';
    renderPetitions([]);
  }
});

// --- Petitions List ---

async function renderPetitions(petitions) {
  const list = document.getElementById('petition-list');
  const empty = document.getElementById('no-petitions');

  if (!petitions) petitions = await popupGetPetitions();

  if (petitions.length === 0) {
    list.innerHTML = '';
    empty.style.display = 'block';
    return;
  }

  empty.style.display = 'none';
  list.innerHTML = petitions.map(p => {
    const date = new Date(p.signedAt).toLocaleDateString('de-DE');
    const deltaText = p.delta > 0 ? `+${p.delta.toLocaleString('de-DE')} neue seit dir` : 'Noch keine neuen';
    const deltaColor = p.delta > 0 ? 'var(--green)' : 'var(--text2)';

    return `
      <div class="petition-card">
        <div class="petition-title" title="${p.title}">${p.title}</div>
        <div class="petition-meta">Unterschrieben am ${date} bei ${p.countAtSigning.toLocaleString('de-DE')} Stimmen</div>
        <div class="petition-delta" style="color:${deltaColor}">${deltaText}</div>
      </div>
    `;
  }).join('');
}

// --- Impact Summary ---

async function updateImpactSummary() {
  const petitions = await popupGetPetitions();
  const totalDelta = petitions.reduce((sum, p) => sum + (p.delta || 0), 0);
  const summary = document.getElementById('impact-summary');
  const totalEl = document.getElementById('impact-total');

  if (totalDelta > 0 || petitions.length > 0) {
    summary.style.display = 'block';
    totalEl.textContent = `+${totalDelta.toLocaleString('de-DE')}`;
  }
}

// --- Poll Button ---

document.getElementById('poll-btn').addEventListener('click', async () => {
  const btn = document.getElementById('poll-btn');
  btn.textContent = 'Aktualisiere...';
  btn.disabled = true;

  try {
    await chrome.runtime.sendMessage({ type: 'POLL_NOW' });
    // Wait a moment for storage to update
    await new Promise(r => setTimeout(r, 1000));
    await renderPetitions();
    await updateImpactSummary();
    btn.textContent = 'Aktualisiert!';
    setTimeout(() => { btn.textContent = 'Impact aktualisieren'; btn.disabled = false; }, 2000);
  } catch (err) {
    console.error('[SignIt Popup] Poll error:', err);
    btn.textContent = 'Fehler — nochmal versuchen';
    btn.disabled = false;
  }
});

// --- Init ---

console.log('[SignIt Popup] Running init...');
loadIdentity();
renderPetitions();
updateImpactSummary();
console.log('[SignIt Popup] Init complete.');
