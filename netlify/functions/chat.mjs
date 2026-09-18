import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-opus-5";
const MAX_TOKENS = 800;
const MAX_MESSAGE_CHARS = 1000;
const MAX_HISTORY_TURNS = 20;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 10;

// EXTRA_ALLOWED_ORIGIN laat je een Netlify preview-URL toe zonder code te wijzigen.
const ALLOWED_ORIGINS = [
  "https://www.nerocharge.be",
  "https://nerocharge.be",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  process.env.EXTRA_ALLOWED_ORIGIN,
].filter(Boolean);

const KNOWLEDGE_BASE = `
# Nero Charge — bedrijfsinformatie

## Wat is Nero Charge?
Nero Charge verhuurt powerbanks via gedeelde laadstations in horecagelegenheden,
strandclubs en uitgaansgelegenheden in België. Je huurt contactloos met je bankkaart
of gsm (tap to pay), laadt je telefoon op, en brengt de powerbank terug.
Er is GEEN app nodig.

## Het product
- Powerbank verhuur via zelfbedieningsstations
- Contactloos betalen met bankkaart, Apple Pay of Google Pay
- USB-C en Lightning kabels ingebouwd in elke powerbank
- 10W laadvermogen — telefoon naar 50% in ongeveer 45 minuten
- Werkt met vrijwel elke smartphone, tablet en draadloze oordopjes
- Beschikbaar op 30+ locaties in België

## Hoe het werkt (3 stappen)
1. Tap & betaal — tik op het scherm van het station waar "Rent a Powerbank" staat
   en betaal contactloos. Je krijgt meteen een volledig opgeladen powerbank.
2. Overal opladen — werkt met elk toestel, kabels zitten ingebouwd.
3. Terugbrengen & klaar — breng de powerbank terug naar HETZELFDE station.
   De betaling stopt automatisch.

## Locaties

### Antwerpen
- Berlin Antwerp — Kleine Markt 1, 2000 Antwerpen
- Tabanco — Scheldestraat 36, 2000 Antwerpen
- Cantine Antwerp — Scheldestraat 77, 2000 Antwerpen
- Bar Zorro — Hendrik Conscienceplein 5, 2000 Antwerpen
- Cordobar — Volkstraat 25, 2000 Antwerpen
- Fidele — Wapenstraat 18, 2000 Antwerpen
- Bar Du Port — Napoleonkaai 53, 2000 Antwerpen
- Barbossa — Sint-Jorispoort 1, 2000 Antwerpen

### Knokke-Heist
- Kiki Beach — Zeedijk-Duinbergen 387, 8301 Knokke-Heist
- Indi Beach — Zeedijk-Het Zoute 648, 8300 Knokke-Heist
- Knokke Strand — Zeedijk-Het Zoute 664, 8300 Knokke-Heist
- Yssis Beach — Zeedijk-Albertstrand 542, 8300 Knokke-Heist
- Lichttorenstrand — Zeedijk-Het Zoute 680, 8300 Knokke-Heist
- Brunello's Beach Club — Rubensplein, Albertstrand, 8300 Knokke-Heist

De volledige kaart met alle stations staat op de website onder "Vind een station".

## Prijzen
Eenvoudige, transparante prijzen: een klein bedrag per uur gebruik. Geen verborgen
kosten, geen abonnementen. Bij het huren wordt een pre-autorisatie op de betaalkaart
geplaatst — dit is GEEN afschrijving, maar een tijdelijke reservering. Die komt
automatisch vrij wanneer de powerbank wordt teruggebracht (binnen 5 à 7 werkdagen,
afhankelijk van de bank). Het exacte tarief staat op het scherm van het station.
BELANGRIJK: noem nooit een concreet bedrag in euro — dat verschilt per locatie en
staat op het station.

## Terugbrengen
De powerbank moet teruggebracht worden bij HETZELFDE station waar hij gehuurd is.
Terugbrengen bij een ander station is niet mogelijk.

## Te laat terugbrengen
Wordt de powerbank niet binnen 48 uur teruggebracht, dan kan de pre-autorisatie
aangerekend worden als schadevergoeding. Nero brengt de klant altijd op de hoogte
vóór er kosten worden aangerekend. Normale slijtage wordt niet aangerekend.

## Voor locaties / partners
Horeca-uitbaters, strandclubs en evenementenlocaties kunnen een Nero laadstation
GRATIS laten plaatsen. Nero regelt installatie, logistiek en support volledig.
Voordelen voor de locatie: gelukkigere klanten (gasten blijven langer), nul
onderhoud, en het station is volledig zelfsturend zodat personeel zich op de
service kan focussen. Aanmelden kan via de knop "Word partner" op de website
of via nerocharge.be/partner.

## Contact
- Telefoon: +32 468 06 02 76
- E-mail: nerocharge@outlook.com
- Website: https://www.nerocharge.be
- Algemene voorwaarden: https://www.nerocharge.be/algemene-voorwaarden.html
- Privacybeleid: https://www.nerocharge.be/privacybeleid.html
`.trim();

const SYSTEM_PROMPT = `Je bent de digitale assistent van Nero Charge, een Belgisch bedrijf dat powerbanks verhuurt.

Je beantwoordt vragen van websitebezoekers UITSLUITEND op basis van de bedrijfsinformatie hieronder.

REGELS:
1. Antwoord enkel met informatie die letterlijk in de bedrijfsinformatie staat. Verzin NOOIT locaties, prijzen, openingsuren, voorwaarden of functies die er niet in staan.
2. Weet je iets niet, of staat het antwoord er niet in? Zeg dat eerlijk en verwijs door: "Dat weet ik niet zeker — mail even naar nerocharge@outlook.com of bel +32 468 06 02 76, dan helpen we je verder."
3. Noem nooit een concreet huurtarief in euro. Verwijs naar het scherm van het station.
4. Antwoord in de taal van de bezoeker. Standaard Nederlands. Spreek de bezoeker aan met "je".
5. Hou het kort: 2 tot 4 zinnen. Dit is een chatvenster, geen handleiding.
6. Wees vriendelijk en behulpzaam, maar niet overdreven enthousiast. Geen emoji's.
7. Bij interesse om partner te worden: verwijs naar de knop "Word partner" op de site.
8. Je bent een AI-assistent. Doe nooit alsof je een mens bent als er expliciet naar gevraagd wordt.

BEDRIJFSINFORMATIE:

${KNOWLEDGE_BASE}`;

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

  if (rateLimitBuckets.size > 5000) {
    for (const [key, times] of rateLimitBuckets) {
      if (times.every((t) => now - t >= RATE_LIMIT_WINDOW_MS)) {
        rateLimitBuckets.delete(key);
      }
    }
  }

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
    return json(
      429,
      { error: "Te veel berichten na elkaar. Probeer het zo even opnieuw." },
      origin,
    );
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("ANTHROPIC_API_KEY ontbreekt in de omgevingsvariabelen.");
    return json(500, { error: "De assistent is even niet beschikbaar." }, origin);
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json(400, { error: "Ongeldige aanvraag." }, origin);
  }

  const incoming = Array.isArray(payload?.messages) ? payload.messages : [];

  const messages = incoming
    .filter(
      (m) =>
        (m?.role === "user" || m?.role === "assistant") &&
        typeof m?.content === "string" &&
        m.content.trim().length > 0,
    )
    .slice(-MAX_HISTORY_TURNS)
    .map((m) => ({
      role: m.role,
      content: m.content.slice(0, MAX_MESSAGE_CHARS),
    }));

  if (messages.length === 0 || messages[messages.length - 1].role !== "user") {
    return json(400, { error: "Geen geldig bericht ontvangen." }, origin);
  }

  const client = new Anthropic();

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      output_config: { effort: "low" },
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages,
    });

    if (response.stop_reason === "refusal") {
      return json(
        200,
        {
          reply:
            "Daar kan ik niet op antwoorden. Mail gerust naar nerocharge@outlook.com, dan helpen we je verder.",
        },
        origin,
      );
    }

    const reply = response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("")
      .trim();

    return json(
      200,
      {
        reply:
          reply ||
          "Sorry, daar heb ik even geen antwoord op. Mail naar nerocharge@outlook.com, dan helpen we je verder.",
      },
      origin,
    );
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) {
      return json(
        429,
        { error: "Het is even druk. Probeer het zo opnieuw." },
        origin,
      );
    }
    if (error instanceof Anthropic.AuthenticationError) {
      console.error("Anthropic authenticatie mislukt — controleer ANTHROPIC_API_KEY.");
      return json(500, { error: "De assistent is even niet beschikbaar." }, origin);
    }
    if (error instanceof Anthropic.APIError) {
      console.error(`Anthropic API-fout ${error.status}:`, error.message);
    } else {
      console.error("Onverwachte fout in chatfunctie:", error);
    }
    return json(500, { error: "Er ging iets mis. Probeer het zo opnieuw." }, origin);
  }
}
