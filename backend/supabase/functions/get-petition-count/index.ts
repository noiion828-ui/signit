// Supabase Edge Function — get-petition-count
// Fetches an openPetition page and returns the current signature count.
// Runs on Deno (Supabase Edge Runtime). No external dependencies.

const ALLOWED_ORIGIN_PREFIX = "https://www.openpetition.de/";
const RATE_LIMIT_MAX = 100;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

// In-memory rate limit store: ip -> { count, windowStart }
// NOTE: Resets on cold start. Good enough for basic abuse prevention.
const rateLimitStore = new Map<string, { count: number; windowStart: number }>();

function corsHeaders(origin: string | null): Record<string, string> {
  // Allow Chrome Extensions (chrome-extension://*) and the openPetition domain.
  // Supabase Dashboard / curl also need to work, so we accept any origin but
  // only reflect chrome-extension:// origins explicitly.
  const allowedOrigin =
    origin && origin.startsWith("chrome-extension://") ? origin : "*";
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

function jsonResponse(
  body: unknown,
  status: number,
  origin: string | null,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(origin),
    },
  });
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitStore.set(ip, { count: 1, windowStart: now });
    return true; // allowed
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false; // blocked
  }

  entry.count += 1;
  return true; // allowed
}

function parseSignatureCount(html: string): number | null {
  // Strategy 1: progress-box class containing a <strong> with a number
  // e.g. <div class="progress-box"><strong>538.187</strong> Unterschriften</div>
  const progressBoxMatch = html.match(
    /class="[^"]*progress-box[^"]*"[^>]*>[\s\S]*?<strong>([\d.,]+)<\/strong>/i,
  );
  if (progressBoxMatch) {
    const raw = progressBoxMatch[1];
    const normalized = raw.replace(/[.,]/g, "");
    const num = parseInt(normalized, 10);
    if (!isNaN(num)) return num;
  }

  // Strategy 2: number immediately followed by "Unterschriften" or "Signatures"
  // Handles "538.187 Unterschriften", "538,187 Signatures", "538187 Unterschriften"
  const sigMatch = html.match(
    /([\d]{1,3}(?:[.,]\d{3})*|\d+)\s*(?:Unterschriften|Signatures)/i,
  );
  if (sigMatch) {
    const raw = sigMatch[1];
    const normalized = raw.replace(/[.,]/g, "");
    const num = parseInt(normalized, 10);
    if (!isNaN(num)) return num;
  }

  return null;
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405, origin);
  }

  // Rate limiting by IP
  const clientIp =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  if (!checkRateLimit(clientIp)) {
    return jsonResponse(
      { error: "Rate limit exceeded. Max 100 requests per hour." },
      429,
      origin,
    );
  }

  // Parse request body
  let body: { url?: unknown };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400, origin);
  }

  const petitionUrl = body.url;

  // Validate URL
  if (typeof petitionUrl !== "string" || petitionUrl.trim() === "") {
    return jsonResponse(
      { error: 'Missing required field "url"' },
      400,
      origin,
    );
  }

  if (!petitionUrl.startsWith(ALLOWED_ORIGIN_PREFIX)) {
    return jsonResponse(
      {
        error: `URL must start with "${ALLOWED_ORIGIN_PREFIX}"`,
      },
      400,
      origin,
    );
  }

  // Fetch the petition page
  let html: string;
  try {
    const response = await fetch(petitionUrl, {
      headers: {
        // Mimic a browser to avoid bot-blocking
        "User-Agent":
          "Mozilla/5.0 (compatible; SignIt/1.0; +https://signit.app)",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "de-DE,de;q=0.9,en;q=0.8",
      },
      // Deno fetch supports signal for timeout via AbortController
      signal: AbortSignal.timeout(10_000), // 10 second timeout
    });

    if (!response.ok) {
      return jsonResponse(
        {
          error: `Failed to fetch petition page: HTTP ${response.status}`,
        },
        502,
        origin,
      );
    }

    html = await response.text();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return jsonResponse(
      { error: `Failed to fetch petition page: ${message}` },
      502,
      origin,
    );
  }

  // Parse signature count
  const count = parseSignatureCount(html);

  if (count === null) {
    return jsonResponse(
      {
        error:
          "Could not parse signature count from page. The page structure may have changed.",
      },
      422,
      origin,
    );
  }

  return jsonResponse(
    {
      count,
      url: petitionUrl,
      timestamp: new Date().toISOString(),
    },
    200,
    origin,
  );
});
