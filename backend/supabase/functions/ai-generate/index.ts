// AI proxy for the Website Builder's "AI Writer".
//
// Two modes, one function:
//   1. Text prompts   — { provider, model, system, user }  (the original interview generator)
//   2. Profile import — { mode:"extract", file:{name,type,data} }  (reads an uploaded
//      firm profile / resume / brochure and returns structured facts)
//
// The secret API key is added here, server-side, and never reaches the browser.
//
// Secrets (set with `supabase secrets set`):
//   OPENAI_API_KEY     - for provider "openai"
//   ANTHROPIC_API_KEY  - for provider "anthropic" AND for every extract call
//
// NOTE (hardening TODO before public launch): this is a thin proxy. Add
// per-user auth, rate limiting, and/or move prompt construction server-side so
// it can't be used as a general-purpose LLM proxy on your quota.

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(obj: unknown, status = 200): Response {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...cors, "content-type": "application/json" },
  });
}

/* ============================================================
   DOCX text extraction

   Claude reads PDFs and images natively, so those go to the model
   untouched. .docx is the one format it will not take, so we pull the
   text out here first.

   A .docx is a ZIP whose word/document.xml holds the body text. Deno has
   DecompressionStream built in, so this needs NO dependency - which matters
   for a function that holds the API keys. We read the ZIP central directory
   (rather than scanning local headers) because Word sometimes defers the
   entry sizes to a trailing data descriptor, leaving the local header zeroed.
   ============================================================ */

const SIG_EOCD = 0x06054b50;   // end of central directory
const SIG_CDIR = 0x02014b50;   // central directory file header

function findEOCD(view: DataView): number {
  // The EOCD sits at the very end unless the archive has a comment (max 65535).
  const min = Math.max(0, view.byteLength - 22 - 65535);
  for (let i = view.byteLength - 22; i >= min; i--) {
    if (view.getUint32(i, true) === SIG_EOCD) return i;
  }
  return -1;
}

async function inflate(bytes: Uint8Array, method: number): Promise<Uint8Array> {
  if (method === 0) return bytes;                    // stored, not compressed
  if (method !== 8) throw new Error("Unsupported zip compression method " + method);
  // Zip uses raw DEFLATE (no zlib header), hence "deflate-raw".
  // .slice() gives us a copy backed by its own ArrayBuffer: `bytes` is a view
  // into the whole archive, so passing it straight to Blob would send the
  // entire file rather than this one entry.
  const ds = new DecompressionStream("deflate-raw");
  const stream = new Blob([bytes.slice().buffer]).stream().pipeThrough(ds);
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function readZipEntry(buf: ArrayBuffer, wanted: string): Promise<Uint8Array | null> {
  const view = new DataView(buf);
  const eocd = findEOCD(view);
  if (eocd < 0) throw new Error("Not a valid .docx (no zip directory found)");

  const count = view.getUint16(eocd + 10, true);
  let p = view.getUint32(eocd + 16, true);           // offset of central directory
  const dec = new TextDecoder();

  for (let i = 0; i < count; i++) {
    if (view.getUint32(p, true) !== SIG_CDIR) break;
    const method = view.getUint16(p + 10, true);
    const compSize = view.getUint32(p + 20, true);
    const nameLen = view.getUint16(p + 28, true);
    const extraLen = view.getUint16(p + 30, true);
    const commentLen = view.getUint16(p + 32, true);
    const localOff = view.getUint32(p + 42, true);
    const name = dec.decode(new Uint8Array(buf, p + 46, nameLen));

    if (name === wanted) {
      // Re-read the name/extra lengths from the LOCAL header: they can differ
      // from the central directory's, and the data starts right after them.
      const lNameLen = view.getUint16(localOff + 26, true);
      const lExtraLen = view.getUint16(localOff + 28, true);
      const start = localOff + 30 + lNameLen + lExtraLen;
      return await inflate(new Uint8Array(buf, start, compSize), method);
    }
    p += 46 + nameLen + extraLen + commentLen;
  }
  return null;
}

function docxXmlToText(xml: string): string {
  return xml
    // Word puts every run of text in <w:t>; paragraphs and breaks become newlines.
    .replace(/<w:p[ >]/g, "\n<w:p ")
    .replace(/<w:br\s*\/>/g, "\n")
    .replace(/<w:tab\s*\/>/g, "\t")
    .replace(/<[^>]+>/g, "")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function docxToText(b64: string): Promise<string> {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const entry = await readZipEntry(bytes.buffer, "word/document.xml");
  if (!entry) throw new Error("No document body found inside the .docx");
  return docxXmlToText(new TextDecoder().decode(entry));
}

/* ============================================================
   Profile extraction

   RULE (learned the hard way on 2026-07-28): a field the profile did not
   answer must come back EMPTY, never guessed. The interview's screenErr()
   then treats it as unanswered and asks the user for it. If the model
   invents a plausible "best known for", the user publishes a claim they
   never made and never saw a prompt about.
   ============================================================ */

const EXTRACT_SYSTEM = `You read a professional's own profile document (firm profile, resume, CV, brochure, or a photo of one) and pull out only what is actually stated in it.

The person is an Indian finance or legal professional: Chartered Accountant, Advocate, Tax Consultant, GST Practitioner, Company Secretary, or Cost Accountant. The extracted facts will pre-fill a website builder, and the user reviews every field before publishing.

THE ONE RULE THAT MATTERS: only report what the document actually says.
- Never infer, guess, embellish, or fill a gap with something typical for the profession.
- If the document does not state something, leave that field empty (empty string or empty array). An empty field is correct and expected; the builder will ask the user for it.
- Do not convert a job title into a claim of expertise, or a list of past employers into a client list.
- Copy contact details, names, and numbers exactly as written. Do not reformat phone numbers or correct spellings.
- For years_practising, only give a number if the document states it or gives a start year you can subtract from ${new Date().getFullYear()}. Otherwise leave it empty.
- For best_known_for and typical_clients, only include entries the document explicitly claims. Two vague entries are worse than one real one, and none at all is fine.
- For key_numbers, only include figures printed in the document (e.g. "500+ returns filed"). Never estimate a count.

Return the structured object. Every field is optional; omit or empty anything the document does not support.`;

const EXTRACT_SCHEMA = {
  type: "object",
  properties: {
    /* These enum values are the builder's own profession keys (PROF_LABEL in
       frontend/index.html). Keep them identical - if they drift, the interview
       silently falls back to Chartered Accountant for everyone else. */
    profession: {
      type: "string",
      enum: ["ca", "advocate", "tax_consultant", "gst_practitioner", "company_secretary", "cost_accountant", ""],
      description: "Profession, only if clearly identifiable from qualifications or title (FCA/ACA -> ca, LLB/Advocate -> advocate, CS -> company_secretary, ICWA/CMA -> cost_accountant). Empty otherwise.",
    },
    firm: { type: "string", description: "Firm or practice name exactly as written." },
    years_practising: { type: "string", description: "Digits only, e.g. \"14\". Empty unless stated or derivable from a start year." },
    city: { type: "string", description: "City, optionally with state." },
    phone: { type: "string" },
    email: { type: "string" },
    address: { type: "string", description: "Full office address as written." },
    hours: { type: "string", description: "Office hours, e.g. \"Mon-Sat, 10 AM - 7 PM\"." },
    website: { type: "string" },
    /* These four are the only platforms the builder has fields for (SOCIALS in
       frontend/index.html). Asking for a twitter/X handle just produces a value
       with nowhere to land. */
    socials: {
      type: "object",
      properties: {
        linkedin: { type: "string" },
        facebook: { type: "string" },
        instagram: { type: "string" },
        youtube: { type: "string" },
      },
      required: ["linkedin", "facebook", "instagram", "youtube"],
      additionalProperties: false,
    },
    partners: {
      type: "array",
      description: "People who run the practice. Only those named in the document.",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          role: { type: "string", description: "e.g. \"Senior Partner\", \"Founder\". Empty if not stated." },
          qualification: { type: "string", description: "e.g. \"FCA\", \"LLB\". Empty if not stated." },
        },
        required: ["name", "role", "qualification"],
        additionalProperties: false,
      },
    },
    services: {
      type: "array",
      description: "Services the document says the practice offers.",
      items: { type: "string" },
    },
    best_known_for: {
      type: "array",
      description: "Short phrases the document explicitly claims as strengths. Empty if the document only lists services or job history.",
      items: { type: "string" },
    },
    typical_clients: {
      type: "array",
      description: "Client types the document names. Never past employers, never inferred from services.",
      items: { type: "string" },
    },
    key_numbers: {
      type: "array",
      description:
        "Numbers that would make a PROSPECTIVE CLIENT more likely to hire this firm. Almost every figure printed in a firm profile fails this test, so returning an EMPTY LIST is the normal and expected answer. One genuine trust signal is worth more than four true but irrelevant facts. " +
        "The test is not 'is it true' and not 'does it read well'. It is: would somebody choosing an accountant care about this? " +
        "INCLUDE, client-facing proof: clients served or retained (\"2,000+ clients\"), ratings or review scores (\"4.9 star rating\"), volume of work completed (\"5,000+ returns filed\"), how long the firm has been practising (\"46 years in practice\"), measurable service outcomes the document actually states (\"100% on-time filing\"), and the number of cities or offices if there are several. " +
        "EXCLUDE, internal facts a client does not care about, even though the document states them plainly: team or staff size (\"13 team members\", \"40+ team members\"), number of partners or qualified staff (\"5 partners\", \"5 chartered accountants\"), staffing breakdowns (\"8 audit staff\"), combined or aggregate experience added up across partners, and anything about one individual's career history. Nobody chooses an accountant because the firm employs thirteen people. " +
        "REWRITE, DO NOT COPY. A homepage statistic is plain and confident, 2 to 5 words: \"we have completed over five thousand income tax returns\" becomes \"5,000+ returns filed\"; \"46 years legacy\" becomes \"46 years in practice\". Never leave words like \"Persons\", \"strength\", \"staffs\", \"nos.\" or \"total\" in a published statistic. " +
        "NEVER invent or estimate a figure, and never lower the bar because the document offered nothing better. An empty list is the right answer when the document has no client-facing numbers; the user is asked for their own.",
      items: { type: "string" },
    },
    workflow: {
      type: "array",
      description: "Steps of the firm's client process, only if the document describes one.",
      items: { type: "string" },
    },
    notes: {
      type: "string",
      description: "One sentence for the user if the document was unreadable, was not a professional profile, or was mostly unusable. Empty when extraction went fine.",
    },
  },
  required: [
    "profession", "firm", "years_practising", "city", "phone", "email",
    "address", "hours", "website", "socials", "partners", "services",
    "best_known_for", "typical_clients", "key_numbers", "workflow", "notes",
  ],
  additionalProperties: false,
};

const OK_IMAGE = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const MAX_BYTES = 10 * 1024 * 1024;   // 10 MB, matching the picker's stated limit

const ASK = "Extract this professional's details from the attached profile. Leave empty anything the document does not actually state.";

/* Work out what we were actually given, once, so each provider builder below
   only has to deal with three cases: pdf, image, or plain text. */
async function classify(file: { name?: string; type?: string; data?: string }) {
  const b64 = String(file?.data || "");
  if (!b64) throw new Error("No file data received");

  // base64 is 4 chars per 3 bytes; close enough to reject oversized uploads early.
  if (b64.length * 0.75 > MAX_BYTES) throw new Error("That file is over 10 MB. Please upload a smaller one.");

  const name = String(file?.name || "").toLowerCase();
  let type = String(file?.type || "");
  // Browsers sometimes send an empty or generic type; fall back to the extension.
  if (!type || type === "application/octet-stream") {
    if (name.endsWith(".pdf")) type = "application/pdf";
    else if (name.endsWith(".docx")) type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    else if (name.endsWith(".png")) type = "image/png";
    else if (name.endsWith(".jpg") || name.endsWith(".jpeg")) type = "image/jpeg";
    else if (name.endsWith(".webp")) type = "image/webp";
  }

  if (type === "application/pdf") return { kind: "pdf" as const, mime: type, b64, name: file?.name || "profile.pdf" };
  if (OK_IMAGE.includes(type)) return { kind: "image" as const, mime: type, b64, name: file?.name || "profile" };
  if (type.indexOf("wordprocessingml") >= 0 || name.endsWith(".docx")) {
    const text = await docxToText(b64);
    if (!text.trim()) throw new Error("That .docx appears to be empty.");
    return { kind: "text" as const, mime: type, text: text.slice(0, 120000), name: file?.name || "profile.docx" };
  }
  if (type === "application/msword" || name.endsWith(".doc")) {
    throw new Error("Old .doc files are not supported. Please save it as .docx or PDF and try again.");
  }
  throw new Error("Unsupported file type. Please upload a PDF, DOCX, JPG, PNG, or WEBP.");
}

/* ---------- OpenRouter (default): one key, many models ---------- */
async function extractViaOpenRouter(src: any, model: string, referer: string, schema: any) {
  const key = Deno.env.get("OPENROUTER_API_KEY");
  if (!key) return json({ error: "OPENROUTER_API_KEY is not set" }, 500);

  const content: any[] = [{ type: "text", text: ASK }];
  const extra: any = {};

  if (src.kind === "pdf") {
    content.push({
      type: "file",
      file: { filename: src.name, file_data: "data:application/pdf;base64," + src.b64 },
    });
    /* "native" hands the PDF to models that read PDFs themselves (Gemini, Claude).
       Without this OpenRouter defaults to the mistral-ocr engine, which bills
       $2 per 1,000 pages ON TOP of tokens and flattens the layout first. */
    extra.plugins = [{ id: "file-parser", pdf: { engine: "native" } }];
  } else if (src.kind === "image") {
    content.push({ type: "image_url", image_url: { url: "data:" + src.mime + ";base64," + src.b64 } });
  } else {
    content.push({ type: "text", text: "PROFILE DOCUMENT:\n\n" + src.text });
  }

  const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: "Bearer " + key,
      // Optional attribution headers OpenRouter uses for its dashboards.
      "HTTP-Referer": referer || "https://kdksites.in",
      "X-Title": "KDK Sites - Profile Import",
    },
    body: JSON.stringify({
      model,
      max_tokens: 8000,
      messages: [
        { role: "system", content: EXTRACT_SYSTEM },
        { role: "user", content },
      ],
      response_format: {
        type: "json_schema",
        json_schema: { name: "profile", strict: true, schema },
      },
      ...extra,
    }),
  });

  if (!r.ok) return json({ error: "openrouter " + r.status + ": " + (await r.text()).slice(0, 300) }, 502);
  const d = await r.json();
  if (d?.error) return json({ error: "openrouter: " + (d.error.message || JSON.stringify(d.error)).slice(0, 300) }, 502);

  const text = d?.choices?.[0]?.message?.content || "";
  return finish(text, d?.usage || null, model);
}

/* ---------- Anthropic direct (used when provider:"anthropic") ---------- */
async function extractViaAnthropic(src: any, model: string, schema: any) {
  const key = Deno.env.get("ANTHROPIC_API_KEY");
  if (!key) return json({ error: "ANTHROPIC_API_KEY is not set" }, 500);

  const content: any[] = [];
  if (src.kind === "pdf") {
    content.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data: src.b64 } });
  } else if (src.kind === "image") {
    content.push({ type: "image", source: { type: "base64", media_type: src.mime, data: src.b64 } });
  } else {
    content.push({ type: "text", text: "PROFILE DOCUMENT:\n\n" + src.text });
  }
  content.push({ type: "text", text: ASK });

  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 8000,
      system: EXTRACT_SYSTEM,
      // Structured outputs: the model must return an object matching the schema,
      // so there is no prose to parse and no "sometimes it wraps it in ```json".
      output_config: { format: { type: "json_schema", schema } },
      messages: [{ role: "user", content }],
    }),
  });

  if (!r.ok) return json({ error: "anthropic " + r.status + ": " + (await r.text()).slice(0, 300) }, 502);
  const d = await r.json();
  if (d.stop_reason === "refusal") {
    return json({ error: "The document could not be processed. Please try a different file." }, 422);
  }
  const text = (d.content || []).filter((b: any) => b.type === "text").map((b: any) => b.text).join("");
  return finish(text, d.usage || null, model);
}

/* Both providers land here: parse, and normalise the usage shape so the
   caller sees the same {input_tokens, output_tokens} either way. */
function finish(text: string, usage: any, model: string): Response {
  if (!text) return json({ error: "Empty response from the model" }, 502);
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    return json({ error: "Model returned malformed JSON" }, 502);
  }
  const u = usage
    ? {
        input_tokens: usage.input_tokens ?? usage.prompt_tokens ?? 0,
        output_tokens: usage.output_tokens ?? usage.completion_tokens ?? 0,
        cost: usage.cost ?? null,     // OpenRouter reports actual USD spent
      }
    : null;
  return json({ profile: parsed, usage: u, model });
}

/* The builder ships a fixed service list per profession, and each entry is already
   the shape a website wants: a grouped title ("GST Registration & Returns") whose
   description carries the specifics ("GSTR-1 and GSTR-3B filing, annual GSTR-9...").
   A firm profile instead lists 25 flat line items.

   Rather than fuzzy-matching those strings in the browser (where "Statutory Audits"
   vs "Tax Audit (Section 44AB)" is a coin flip), the caller passes its own service
   names in and the model picks from THEM as a closed enum. Semantic matching is what
   the model is good at, and an enum means what comes back is always a name the
   builder can toggle, never an invented one. */
function withCatalog(catalog: string[]) {
  if (!catalog.length) return EXTRACT_SCHEMA;
  const s: any = JSON.parse(JSON.stringify(EXTRACT_SCHEMA));
  s.properties.services_matched = {
    type: "array",
    description:
      "Which of the website's built-in services this firm actually offers, judging by the document. " +
      "IMPORTANT: this allowed list reflects whatever profession the website is currently set to, which may be the WRONG profession for this document. It is not evidence about the person. Judge the `profession` field only from the document's own qualifications and job titles, and if the two disagree, trust the document and return an empty list here. " +
      "Pick ONLY from the allowed values, matching on meaning rather than wording: a profile listing " +
      "\"GSTR-1, GSTR-3B and annual return filing\" supports the GST service even though the words differ. " +
      "Include a service only if the document shows the firm does that work. Omit anything you are unsure " +
      "about: a service switched on wrongly puts an offering on their website that they may not provide.",
    items: { type: "string", enum: catalog },
  };
  s.required.push("services_matched");
  return s;
}

async function handleExtract(body: any, referer: string): Promise<Response> {
  let src;
  try {
    src = await classify(body?.file || {});
  } catch (e) {
    // These are user-fixable problems (wrong format, too big), not server faults.
    return json({ error: String((e as Error).message || e) }, 400);
  }

  const catalog = Array.isArray(body?.catalog)
    ? body.catalog.map((x: any) => String(x || "")).filter(Boolean).slice(0, 40)
    : [];
  const schema = withCatalog(catalog);

  const provider = String(body?.provider || "openrouter");
  if (provider === "anthropic") {
    return await extractViaAnthropic(src, body?.model || "claude-opus-5", schema);
  }
  return await extractViaOpenRouter(src, body?.model || "google/gemini-3.5-flash-lite", referer, schema);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let body: any;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  // Profile import runs its own path: it reads the file itself (no client-side
  // parsing) and always returns a schema-validated object rather than free text.
  if (body?.mode === "extract") {
    try {
      return await handleExtract(body, req.headers.get("referer") || "");
    } catch (e) {
      return json({ error: String(e) }, 500);
    }
  }

  const provider = (body?.provider || "openai") as string;
  const system = body?.system as string;
  const user = body?.user as string;
  const model = body?.model as string | undefined;
  /* "json" (default) keeps OpenAI in json_object mode for the whole-site generator.
     "text" is for single-field rewrites: json_object mode 400s unless the prompt
     itself mentions JSON, which prose rewrites have no reason to do. */
  const format = (body?.format === "text" ? "text" : "json") as "json" | "text";
  if (!system || !user) return json({ error: "Missing system/user prompt" }, 400);

  try {
    let content = "";

    if (provider === "anthropic") {
      const key = Deno.env.get("ANTHROPIC_API_KEY");
      if (!key) return json({ error: "ANTHROPIC_API_KEY is not set" }, 500);
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": key,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: model || "claude-opus-5",
          max_tokens: 2000,
          system,
          messages: [{ role: "user", content: user }],
        }),
      });
      if (!r.ok) return json({ error: "anthropic " + r.status + ": " + (await r.text()).slice(0, 300) }, 502);
      const d = await r.json();
      content = (d.content || []).filter((b: any) => b.type === "text").map((b: any) => b.text).join("");
    } else {
      const key = Deno.env.get("OPENAI_API_KEY");
      if (!key) return json({ error: "OPENAI_API_KEY is not set" }, 500);
      const r = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: "Bearer " + key },
        body: JSON.stringify({
          model: model || "gpt-4o-mini",
          ...(format === "json" ? { response_format: { type: "json_object" } } : {}),
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
        }),
      });
      if (!r.ok) return json({ error: "openai " + r.status + ": " + (await r.text()).slice(0, 300) }, 502);
      const d = await r.json();
      content = d?.choices?.[0]?.message?.content || "";
    }

    if (!content) return json({ error: "Empty response from the model" }, 502);
    return json({ content });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
