import { json, requireAuth } from "../lib/auth.js";

export async function onRequestGet({ request, env }) {
  const adminId = await requireAuth(request, env);
  if (!adminId) return json({ success: false, message: "Unauthorized." }, { status: 401 });

  const { results } = await env.DB.prepare(
    "SELECT id, email, created_at FROM signups ORDER BY created_at DESC"
  ).all();

  return json({ success: true, signups: results });
}
