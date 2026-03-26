/**
 * SignIt Popup — Civic Identity Management + Petition Overview.
 */

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
  const identity = await getIdentity();
  if (identity) {
    fields.forEach(f => {
      const el = document.getElementById(f);
      if (el && identity[f]) el.value = identity[f];
    });
    clearBtn.style.display = 'block';
    document.getElementById('save-btn').textContent = 'Profil aktualisieren';
  }
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const identity = {};
  fields.forEach(f => {
    const val = document.getElementById(f).value.trim();
    if (val) identity[f] = val;
  });

  await saveIdentity(identity);

  saveStatus.textContent = 'Gespeichert!';
  saveStatus.className = 'status success';
  clearBtn.style.display = 'block';
  document.getElementById('save-btn').textContent = 'Profil aktualisieren';

  setTimeout(() => { saveStatus.textContent = ''; saveStatus.className = 'status'; }, 2000);
});

clearBtn.addEventListener('click', async () => {
  if (confirm('Alle SignIt-Daten loeschen? (Profil + Petitionen)')) {
    await clearIdentity();
    await chrome.storage.local.remove('signit_petitions');
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

  if (!petitions) petitions = await getSignedPetitions();

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

// --- Init ---

loadIdentity();
renderPetitions();
