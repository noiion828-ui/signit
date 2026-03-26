# SignIt Backend — Supabase

## Edge Functions

### `get-petition-count`

CORS proxy that fetches an openPetition page and returns the current signature count.

**Endpoint:** `POST /functions/v1/get-petition-count`

**Request body:**
```json
{ "url": "https://www.openpetition.de/petition/online/some-petition" }
```

**Response (200):**
```json
{
  "count": 538187,
  "url": "https://www.openpetition.de/petition/online/some-petition",
  "timestamp": "2026-03-26T12:00:00.000Z"
}
```

**Error responses:**
- `400` — Missing/invalid URL or URL not on openpetition.de
- `429` — Rate limit exceeded (100 req/hour per IP)
- `502` — Failed to fetch petition page (network error or HTTP error)
- `422` — Page fetched but signature count could not be parsed

---

## Deploy

### Prerequisites

```bash
npm install -g supabase
supabase login
```

### Link to your project

```bash
cd backend
supabase link --project-ref <YOUR_PROJECT_REF>
```

Find your project ref in: Supabase Dashboard → Project Settings → General.

### Deploy a single function

```bash
supabase functions deploy get-petition-count
```

### Deploy all functions

```bash
supabase functions deploy
```

### Local development

Start the local Supabase stack (requires Docker):

```bash
supabase start
supabase functions serve get-petition-count --no-verify-jwt
```

Then test with curl:

```bash
curl -X POST http://localhost:54321/functions/v1/get-petition-count \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.openpetition.de/petition/online/example"}'
```

### Environment variables

No environment variables required for this function. It runs without JWT verification for public access from the Chrome Extension.

To disable JWT verification in production, set in `supabase/config.toml`:

```toml
[functions.get-petition-count]
verify_jwt = false
```

Or deploy with the flag:

```bash
supabase functions deploy get-petition-count --no-verify-jwt
```
