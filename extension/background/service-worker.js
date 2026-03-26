/**
 * SignIt Service Worker — Micro-Impact Polling.
 *
 * Periodically checks signature counts for petitions the user signed.
 * Updates badge with total new signatures since signing.
 */

console.log('[SignIt SW] Service worker starting...');

const POLL_INTERVAL_MINUTES = 240; // 4 hours
const ALARM_NAME = 'signit-impact-poll';

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
    await pollPetitionCounts();
  }
});

// --- Polling Logic ---

async function pollPetitionCounts() {
  const result = await chrome.storage.local.get('signit_petitions');
  const petitions = result.signit_petitions || [];

  if (petitions.length === 0) return;

  let totalDelta = 0;

  for (const petition of petitions) {
    try {
      const count = await fetchPetitionCount(petition.url);
      if (count !== null && count > petition.currentCount) {
        petition.currentCount = count;
        petition.delta = count - petition.countAtSigning;
        petition.lastChecked = new Date().toISOString();
      }
      totalDelta += petition.delta;
    } catch (err) {
      console.warn(`SignIt: Failed to poll ${petition.url}`, err);
    }

    // Rate limit: wait 2s between requests
    await new Promise(r => setTimeout(r, 2000));
  }

  // Save updated counts
  await chrome.storage.local.set({ signit_petitions: petitions });

  // Update badge
  updateBadge(totalDelta);
}

async function fetchPetitionCount(petitionUrl) {
  // Try direct fetch first (may fail due to CORS)
  try {
    const resp = await fetch(petitionUrl, {
      headers: { 'Accept': 'text/html' },
    });
    if (!resp.ok) return null;

    const html = await resp.text();

    // Parse signature count from HTML
    // openPetition: <div class="progress-box"><strong>119,469\t\tSignatures</strong>
    const patterns = [
      /progress-box[^>]*>[\s\S]*?<strong>\s*([\d.,]+)/i,
      /([\d.]+)\s*(?:Unterschriften|Signatures|Unterstützer)/i,
      /class="[^"]*counter[^"]*"[^>]*>[\s]*([\d.,]+)/i,
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match) {
        return parseInt(match[1].replace(/\./g, ''), 10);
      }
    }
  } catch (err) {
    // CORS blocked — needs proxy (Phase: Woche 4 Supabase Edge Function)
    console.debug('SignIt: Direct fetch failed, proxy needed', err.message);
  }

  return null;
}

function updateBadge(totalDelta) {
  if (totalDelta > 0) {
    const text = totalDelta > 999 ? `${Math.floor(totalDelta / 1000)}k` : String(totalDelta);
    chrome.action.setBadgeText({ text });
    chrome.action.setBadgeBackgroundColor({ color: '#00b894' });
  } else {
    chrome.action.setBadgeText({ text: '' });
  }
}

// --- Message Handler (from popup) ---

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'POLL_NOW') {
    pollPetitionCounts().then(() => sendResponse({ ok: true }));
    return true; // async response
  }
});
