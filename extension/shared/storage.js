/**
 * SignIt Storage — chrome.storage.local wrapper.
 * All civic identity and petition data stays local. No server upload.
 */

const STORAGE_KEYS = {
  IDENTITY: 'signit_identity',
  PETITIONS: 'signit_petitions',
  SETTINGS: 'signit_settings',
};

const SCHEMA_VERSION = 1;

// --- Civic Identity ---

async function getIdentity() {
  const result = await chrome.storage.local.get(STORAGE_KEYS.IDENTITY);
  return result[STORAGE_KEYS.IDENTITY] || null;
}

async function saveIdentity(identity) {
  const data = {
    ...identity,
    version: SCHEMA_VERSION,
    updatedAt: new Date().toISOString(),
  };
  if (!data.createdAt) {
    data.createdAt = data.updatedAt;
  }
  await chrome.storage.local.set({ [STORAGE_KEYS.IDENTITY]: data });
  return data;
}

async function clearIdentity() {
  await chrome.storage.local.remove(STORAGE_KEYS.IDENTITY);
}

// --- Signed Petitions ---

async function getSignedPetitions() {
  const result = await chrome.storage.local.get(STORAGE_KEYS.PETITIONS);
  return result[STORAGE_KEYS.PETITIONS] || [];
}

async function addSignedPetition(petition) {
  const petitions = await getSignedPetitions();
  const existing = petitions.find(p => p.url === petition.url);
  if (existing) return petitions; // already tracked

  const entry = {
    url: petition.url,
    title: petition.title || 'Unbekannte Petition',
    signedAt: new Date().toISOString(),
    countAtSigning: petition.currentCount || 0,
    currentCount: petition.currentCount || 0,
    lastChecked: new Date().toISOString(),
    delta: 0,
  };

  petitions.unshift(entry); // newest first
  await chrome.storage.local.set({ [STORAGE_KEYS.PETITIONS]: petitions });
  return petitions;
}

async function updatePetitionCount(url, newCount) {
  const petitions = await getSignedPetitions();
  const petition = petitions.find(p => p.url === url);
  if (!petition) return;

  petition.currentCount = newCount;
  petition.delta = newCount - petition.countAtSigning;
  petition.lastChecked = new Date().toISOString();

  await chrome.storage.local.set({ [STORAGE_KEYS.PETITIONS]: petitions });
  return petition;
}

// --- Rate Limiting ---

const RATE_LIMIT_KEY = 'signit_rate';
const MAX_AUTOFILLS_PER_HOUR = 20; // 20 for beta, reduce to 5 for production

async function checkRateLimit() {
  const result = await chrome.storage.local.get(RATE_LIMIT_KEY);
  const data = result[RATE_LIMIT_KEY] || { count: 0, resetAt: 0 };

  const now = Date.now();
  if (now > data.resetAt) {
    // Reset window
    return { allowed: true, remaining: MAX_AUTOFILLS_PER_HOUR - 1 };
  }

  if (data.count >= MAX_AUTOFILLS_PER_HOUR) {
    const minutesLeft = Math.ceil((data.resetAt - now) / 60000);
    return { allowed: false, remaining: 0, minutesLeft };
  }

  return { allowed: true, remaining: MAX_AUTOFILLS_PER_HOUR - data.count };
}

async function recordAutofill() {
  const result = await chrome.storage.local.get(RATE_LIMIT_KEY);
  const data = result[RATE_LIMIT_KEY] || { count: 0, resetAt: 0 };

  const now = Date.now();
  if (now > data.resetAt) {
    data.count = 1;
    data.resetAt = now + 3600000; // 1 hour
  } else {
    data.count++;
  }

  await chrome.storage.local.set({ [RATE_LIMIT_KEY]: data });
}
