const FORMSPREE_ENDPOINT =
  process.env.FORMSPREE_ENDPOINT ?? "https://formspree.io/f/mqegdknv";

const MAX_TRANSCRIPT_TURNS = 20;
const MAX_MESSAGE_CHARS = 1000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 3;

const ALLOWED_ORIGINS = [
  "https://www.nerocharge.be",
  "https://nerocharge.be",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const rateLimitBuckets = new Map();

function isRateLimited(ip) {
  const now = Date.now();
  const hits = (rateLimitBuckets.get(ip) ?? []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS,
  );

  if (hits.length >= RATE_LIMIT_MAX_REQUESTS) {
    rateLimitBuckets.set(ip, hits);
    return true;
  }

  hits.push(now);
  rateLimitBuckets.set(ip, hits);
  return false;
}

function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };
}

function json(status, body, origin) {
  return new Response(JSON.stringify(body), {
    status,
    headers: corsHeaders(origin),
  });
}

export default async function handler(request) {
  const origin = request.headers.get("origin") ?? "";
  const allowed = ALLOWED_ORIGINS.includes(origin);

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }

  if (!allowed) {
    return json(403, { error: "Origin niet toegestaan." }, origin);
  }

  if (request.method !== "POST") {
    return json(405, { error: "Methode niet toegestaan." }, origin);
  }

  const ip =
    request.headers.get("x-nf-client-connection-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    "unknown";

  if (isRateLimited(ip)) {
    return json(429, { error: "Te veel aanvragen. Probeer het later opnieuw." }, origin);
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json(400, { error: "Ongeldige aanvraag." }, origin);
  }

  const email = String(payload?.email ?? "").trim().slice(0, 200);

  if (!EMAIL_PATTERN.test(email)) {
    return json(400, { error: "Vul een geldig e-mailadres in." }, origin);
  }

  const transcript = (Array.isArray(payload?.messages) ? payload.messages : [])
    .filter(
      (m) =>
        (m?.role === "user" || m?.role === "assistant") &&
        typeof m?.content === "string",
    )
    .slice(-MAX_TRANSCRIPT_TURNS)
    .map(
      (m) =>
        `${m.role === "user" ? "Bezoeker" : "Assistent"}: ${m.content.slice(0, MAX_MESSAGE_CHARS)}`,
    )
    .join("\n\n");

  try {
    const result = await fetch(FORMSPREE_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        _subject: "Nieuwe chat-lead via nerocharge.be",
        bron: "AI-chat op de website",
        email,
        gesprek: transcript || "(geen gespreksverloop)",
      }),
    });

    if (!result.ok) {
      console.error(`Formspree gaf status ${result.status} terug.`);
      return json(502, { error: "Versturen mislukt. Probeer het later opnieuw." }, origin);
    }

    return json(200, { ok: true }, origin);
  } catch (error) {
    console.error("Fout bij doorsturen van lead:", error);
    return json(500, { error: "Versturen mislukt. Probeer het later opnieuw." }, origin);
  }
}
