// Shared auth helpers for Pages Functions.
// Password hashing: PBKDF2-SHA256, 100000 iterations, 32-byte derived key, hex-encoded.
// Sessions: random 32-byte token stored in D1 with an expiry, set as an httpOnly cookie.

const ITERATIONS = 100000;
const KEY_LENGTH_BITS = 256; // 32 bytes
const SESSION_COOKIE = "cg_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

function bytesToHex(bytes) {
  return Array.from(new Uint8Array(bytes))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBytes(hex) {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return out;
}

export async function hashPassword(password, saltHex) {
  const enc = new TextEncoder();
  const salt = hexToBytes(saltHex);
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );
  const derived = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: ITERATIONS, hash: "SHA-256" },
    keyMaterial,
    KEY_LENGTH_BITS
  );
  return bytesToHex(derived);
}

export function randomHex(byteLength) {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return bytesToHex(bytes);
}

export async function verifyCredentials(env, username, password) {
  const row = await env.DB.prepare(
    "SELECT id, password_hash, salt FROM admins WHERE username = ?"
  )
    .bind(username)
    .first();
  if (!row) return null;
  const computed = await hashPassword(password, row.salt);
  // constant-time-ish compare
  if (computed.length !== row.password_hash.length) return null;
  let diff = 0;
  for (let i = 0; i < computed.length; i++) {
    diff |= computed.charCodeAt(i) ^ row.password_hash.charCodeAt(i);
  }
  if (diff !== 0) return null;
  return row.id;
}

export async function createSession(env, adminId) {
  const token = randomHex(32);
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000).toISOString();
  await env.DB.prepare(
    "INSERT INTO sessions (token, admin_id, expires_at) VALUES (?, ?, ?)"
  )
    .bind(token, adminId, expiresAt)
    .run();
  return { token, expiresAt };
}

export function sessionCookieHeader(token, maxAgeSeconds) {
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAgeSeconds}`;
}

export function clearSessionCookieHeader() {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

function getCookie(request, name) {
  const header = request.headers.get("Cookie") || "";
  const parts = header.split(";").map((p) => p.trim());
  for (const part of parts) {
    if (part.startsWith(name + "=")) {
      return part.substring(name.length + 1);
    }
  }
  return null;
}

export async function requireAuth(request, env) {
  const token = getCookie(request, SESSION_COOKIE);
  if (!token) return null;
  const row = await env.DB.prepare(
    "SELECT admin_id, expires_at FROM sessions WHERE token = ?"
  )
    .bind(token)
    .first();
  if (!row) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) return null;
  return row.admin_id;
}

export async function deleteSession(env, request) {
  const token = getCookie(request, SESSION_COOKIE);
  if (!token) return;
  await env.DB.prepare("DELETE FROM sessions WHERE token = ?").bind(token).run();
}

export function json(data, init) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init && init.headers ? init.headers : {}),
    },
  });
}
