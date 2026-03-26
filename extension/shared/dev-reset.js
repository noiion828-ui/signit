// DEV ONLY — Reset rate limit. Run in extension console:
// chrome.storage.local.remove('signit_rate', () => console.log('Rate limit reset'));
//
// Or load this file temporarily in popup.html to auto-reset on open.

chrome.storage.local.remove('signit_rate', () => {
  console.log('[SignIt DEV] Rate limit reset.');
});
