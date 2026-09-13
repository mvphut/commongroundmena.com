import { json, requireAuth } from "../lib/auth.js";

export async function onRequestGet({ request, env }) {
  const adminId = await requireAuth(request, env);
  return json({ authenticated: !!adminId });
}
