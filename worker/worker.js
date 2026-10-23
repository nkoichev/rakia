// Storage for https://nkoichev.github.io/rakia/ - one JSON document in KV.
// Every request needs the access code (secret RAKIA_KEY) in the X-Key header.
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Key",
};
const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

export default {
  async fetch(req, env) {
    if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
    if (new URL(req.url).pathname !== "/state") return json({ error: "not found" }, 404);
    if (req.headers.get("X-Key") !== env.RAKIA_KEY) return json({ error: "грешен код" }, 401);
    if (req.method === "GET") return json(JSON.parse((await env.RAKIA.get("state")) || "null"));
    if (req.method === "PUT") {
      const text = await req.text();
      if (text.length > 200000) return json({ error: "твърде голямо" }, 413);
      try { JSON.parse(text); } catch { return json({ error: "невалиден JSON" }, 400); }
      await env.RAKIA.put("state", text);
      return json({ ok: true });
    }
    return json({ error: "method" }, 405);
  },
};
