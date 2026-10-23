// Storage for https://nkoichev.github.io/rakia/ - one JSON document in KV ("state"),
// plus the last version of every day ("day:YYYY-MM-DD", kept a year) to restore from.
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};
const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

export default {
  async fetch(req, env) {
    if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
    if (new URL(req.url).pathname !== "/state") return json({ error: "not found" }, 404);
    if (req.method === "GET") return json(JSON.parse((await env.RAKIA.get("state")) || "null"));
    if (req.method === "PUT") {
      const text = await req.text();
      if (text.length > 200000) return json({ error: "твърде голямо" }, 413);
      try { JSON.parse(text); } catch { return json({ error: "невалиден JSON" }, 400); }
      await env.RAKIA.put("state", text);
      await env.RAKIA.put("day:" + new Date().toISOString().slice(0, 10), text, { expirationTtl: 365 * 86400 });
      return json({ ok: true });
    }
    return json({ error: "method" }, 405);
  },
};
