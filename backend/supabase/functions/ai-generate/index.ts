// AI proxy for the Website Builder's "AI Writer".
// The browser POSTs { provider, model, system, user }; this function adds the
// secret API key (server-side, never exposed) and calls OpenAI or Anthropic.
//
// Secrets (set with `supabase secrets set`):
//   OPENAI_API_KEY     - for provider "openai"
//   ANTHROPIC_API_KEY  - for provider "anthropic"
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let body: any;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const provider = (body?.provider || "openai") as string;
  const system = body?.system as string;
  const user = body?.user as string;
  const model = body?.model as string | undefined;
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
          model: model || "claude-opus-4-8",
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
          response_format: { type: "json_object" },
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
