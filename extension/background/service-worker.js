/**
 * SignIt Service Worker — Micro-Impact Polling.
 *
 * Periodically checks signature counts for petitions the user signed.
 * Updates badge with total new signatures since signing.
 *
 * Two modes:
 * 1. Direct fetch (tries to get petition page HTML directly)
 * 2. Proxy fetch (via Supabase Edge Function if CORS blocks direct)
 */

console.log('[SignIt SW] Service worker starting...');

const POLL_INTERVAL_MINUTES = 240; // 4 hours
const ALARM_NAME = 'signit-impact-poll';
const PETITIONS_KEY = 'signit_petitions';

// Supabase Edge Function URL — set when deployed
// For now, direct fetch only (proxy added in Woche 4)
const PROXY_URL = ''; // e.g., 'https://xyz.supabase.co/functions/v1/get-petition-count'

// --- Alarm Setup ---

chrome.runtime.onInstalled.addListener(() => {
  console.log('[SignIt SW] Extension installed/updated.');
  chrome.alarms.create(ALARM_NAME, {
    delayInMinutes: 1,
    periodInMinutes: POLL_INTERVAL_MINUTES,
  });
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === ALARM_NAME) {
    console.log('[SignIt SW] Impact poll triggered.');
    await pollPetitionCounts();
  }
});

// --- Signature Count Extraction ---

function parseCountFromHTML(html) {
  const patterns = [
    /progress-box[\s\S]*?<strong>\s*([\d.,]+)/i,
    /([\d.]+)\s*(?:Unterschriften|Signatures|Unterstützer)/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) {
      // Handle both "538.187" (DE) and "538,187" (EN) formats
      const numStr = match[1].replace(/[.,]/g, '');
      const num = parseInt(numStr, 10);
      if (!isNaN(num) && num > 0) return num;
    }
  }
  return null;
}

async function fetchCountDirect(url) {
  try {
    const resp = await fetch(url, {
      headers: { 'Accept': 'text/html' },
    });
    if (!resp.ok) return null;
    const html = await resp.text();
    return parseCountFromHTML(html);
  } catch (err) {
    console.debug('[SignIt SW] Direct fetch failed:', url, err.message);
    return null;
  }
}

async function fetchCountViaProxy(url) {
  if (!PROXY_URL) return null;
  try {
    const resp = await fetch(PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    return data.count || null;
  } catch (err) {
    console.debug('[SignIt SW] Proxy fetch failed:', url, err.message);
    return null;
  }
}

async function fetchPetitionCount(url) {
  // Try direct first, fallback to proxy
  let count = await fetchCountDirect(url);
  if (count === null) {
    count = await fetchCountViaProxy(url);
  }
  return count;
}

// --- Polling Logic ---

async function pollPetitionCounts() {
  const result = await chrome.storage.local.get(PETITIONS_KEY);
  const petitions = result[PETITIONS_KEY] || [];

  if (petitions.length === 0) {
    console.log('[SignIt SW] No petitions to poll.');
    return;
  }

  console.log(`[SignIt SW] Polling ${petitions.length} petitions...`);
  let totalDelta = 0;
  let updated = 0;

  for (const petition of petitions) {
    try {
      const count = await fetchPetitionCount(petition.url);
      if (count !== null && count >= petition.countAtSigning) {
        if (count !== petition.currentCount) {
          petition.currentCount = count;
          petition.delta = count - petition.countAtSigning;
          petition.lastChecked = new Date().toISOString();
          updated++;
        }
      }
      totalDelta += (petition.delta || 0);
    } catch (err) {
      console.warn(`[SignIt SW] Error polling ${petition.url}:`, err);
    }

    // Rate limit: wait 3s between requests to be polite
    await new Promise(r => setTimeout(r, 3000));
  }

  // Save updated counts
  await chrome.storage.local.set({ [PETITIONS_KEY]: petitions });
  console.log(`[SignIt SW] Poll complete. ${updated} updated. Total delta: +${totalDelta}`);

  // Update badge
  updateBadge(totalDelta);
}

function updateBadge(totalDelta) {
  if (totalDelta > 0) {
    const text = totalDelta > 9999 ? `${Math.floor(totalDelta / 1000)}k` :
                 totalDelta > 999 ? `${(totalDelta / 1000).toFixed(1)}k` :
                 String(totalDelta);
    chrome.action.setBadgeText({ text });
    chrome.action.setBadgeBackgroundColor({ color: '#00b894' });
    console.log(`[SignIt SW] Badge updated: +${text}`);
  } else {
    chrome.action.setBadgeText({ text: '' });
  }
}

// --- Message Handler (from popup) ---

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'POLL_NOW') {
    console.log('[SignIt SW] Manual poll requested.');
    pollPetitionCounts().then(() => sendResponse({ ok: true }));
    return true; // async response
  }
  if (msg.type === 'GET_TOTAL_DELTA') {
    chrome.storage.local.get(PETITIONS_KEY).then(result => {
      const petitions = result[PETITIONS_KEY] || [];
      const total = petitions.reduce((sum, p) => sum + (p.delta || 0), 0);
      sendResponse({ totalDelta: total });
    });
    return true;
  }
});
