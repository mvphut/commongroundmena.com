import { json, deleteSession, clearSessionCookieHeader } from "../lib/auth.js";

export async function onRequestPost({ request, env }) {
  await deleteSession(env, request);
  return json({ success: true }, { headers: { "Set-Cookie": clearSessionCookieHeader() } });
}
