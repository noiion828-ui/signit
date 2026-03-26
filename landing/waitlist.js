// SignIt Waitlist Handler
// Supabase integration placeholder — replace SUPABASE_URL and SUPABASE_ANON_KEY

const SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';
const USE_SUPABASE = false; // flip to true once Supabase is configured

async function submitToSupabase(email) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/waitlist`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify({ email, signed_up_at: new Date().toISOString() }),
  });
  if (!res.ok) throw new Error(`Supabase error: ${res.status}`);
}

function saveLocally(email) {
  const existing = JSON.parse(localStorage.getItem('signit_waitlist') || '[]');
  if (existing.includes(email)) return false; // already registered
  existing.push(email);
  localStorage.setItem('signit_waitlist', JSON.stringify(existing));
  return true;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('waitlist-form');
  const input = document.getElementById('waitlist-email');
  const btn = document.getElementById('waitlist-btn');
  const success = document.getElementById('waitlist-success');
  const errorMsg = document.getElementById('waitlist-error');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = input.value.trim();

    // Reset state
    errorMsg.textContent = '';
    errorMsg.style.display = 'none';

    if (!isValidEmail(email)) {
      errorMsg.textContent = 'Bitte eine gueltige E-Mail-Adresse eingeben.';
      errorMsg.style.display = 'block';
      input.focus();
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Wird eingetragen...';

    try {
      if (USE_SUPABASE) {
        await submitToSupabase(email);
      } else {
        const isNew = saveLocally(email);
        if (!isNew) {
          errorMsg.textContent = 'Diese E-Mail ist bereits auf der Waitlist.';
          errorMsg.style.display = 'block';
          btn.disabled = false;
          btn.textContent = 'Auf Waitlist setzen';
          return;
        }
        // Simulate network delay for UX
        await new Promise(r => setTimeout(r, 600));
      }

      form.style.display = 'none';
      success.style.display = 'flex';
    } catch (err) {
      console.error(err);
      errorMsg.textContent = 'Etwas ist schiefgelaufen. Bitte versuch es nochmal.';
      errorMsg.style.display = 'block';
      btn.disabled = false;
      btn.textContent = 'Auf Waitlist setzen';
    }
  });
});
