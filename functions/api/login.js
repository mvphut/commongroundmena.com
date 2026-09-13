import { json, verifyCredentials, createSession, sessionCookieHeader } from "../lib/auth.js";

export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return json({ success: false, message: "Invalid request." }, { status: 400 });
  }

  const username = (body.username || "").toString().trim();
  const password = (body.password || "").toString();

  if (!username || !password) {
    return json({ success: false, message: "Username and password are required." }, { status: 400 });
  }

  const adminId = await verifyCredentials(env, username, password);
  if (!adminId) {
    return json({ success: false, message: "Incorrect username or password." }, { status: 401 });
  }

  const { token } = await createSession(env, adminId);

  return json(
    { success: true },
    { headers: { "Set-Cookie": sessionCookieHeader(token, 60 * 60 * 24 * 7) } }
  );
}
