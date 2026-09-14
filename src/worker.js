import {
  json,
  verifyCredentials,
  createSession,
  sessionCookieHeader,
  clearSessionCookieHeader,
  requireAuth,
  deleteSession,
} from "./auth.js";
import {
  renderSubscribeEmail,
  renderApplyReceivedEmail,
  renderApplyAcceptedEmail,
} from "./email-templates.js";

const VALID_STATUSES = ["awaiting_review", "accepted", "waitlist", "declined"];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FROM_ADDRESS = "Common Ground <hello@commongroundmena.com>";
const EVENT_VENUE = "The Startup Kitchen, Sheikh Zayed";
// Single session. Still written to applications.preferred_slot so new rows stay
// comparable with older ones, which carry the slot the applicant picked.
const EVENT_TIME = "12:00 PM";

async function sendEmail(env, { to, subject, text, html }) {
  if (!env.RESEND_API_KEY) return;
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM_ADDRESS, to: [to], subject, text, html }),
    });
  } catch (e) {
    // Best-effort: never let email delivery block or fail the user-facing response.
  }
}

function sendSubscribeConfirmation(env, ctx, email) {
  const { subject, html, text } = renderSubscribeEmail();
  const promise = sendEmail(env, { to: email, subject, text, html });
  if (ctx && ctx.waitUntil) ctx.waitUntil(promise);
  return promise;
}

function sendApplyReceived(env, ctx, { email, fullName }) {
  const { subject, html, text } = renderApplyReceivedEmail({ fullName });
  const promise = sendEmail(env, { to: email, subject, text, html });
  if (ctx && ctx.waitUntil) ctx.waitUntil(promise);
  return promise;
}

function sendApplyAccepted(env, ctx, { email, fullName }) {
  const { subject, html, text } = renderApplyAcceptedEmail({ fullName, time: EVENT_TIME, venue: EVENT_VENUE });
  const promise = sendEmail(env, { to: email, subject, text, html });
  if (ctx && ctx.waitUntil) ctx.waitUntil(promise);
  return promise;
}

async function parseBody(request) {
  const contentType = request.headers.get("Content-Type") || "";
  if (contentType.includes("application/json")) {
    return await request.json();
  }
  const form = await request.formData();
  const body = {};
  for (const [key, value] of form.entries()) {
    if (key.endsWith("[]")) {
      const cleanKey = key.slice(0, -2);
      if (!body[cleanKey]) body[cleanKey] = [];
      body[cleanKey].push(value);
    } else {
      body[key] = value;
    }
  }
  return body;
}

async function handleSubscribe(request, env, ctx) {
  let body;
  try {
    body = await parseBody(request);
  } catch (e) {
    return json({ success: false, message: "Invalid request body." }, { status: 400 });
  }

  const email = (body.email || "").toString().trim();
  if (!email || !EMAIL_PATTERN.test(email)) {
    return json({ success: false, message: "Please provide a valid email address." }, { status: 400 });
  }

  if (body.botcheck) {
    return json({ success: true });
  }

  try {
    await env.DB.prepare("INSERT INTO signups (email) VALUES (?)").bind(email).run();
  } catch (e) {
    return json({ success: false, message: "Could not save your signup. Please try again." }, { status: 500 });
  }

  sendSubscribeConfirmation(env, ctx, email);

  return json({ success: true });
}

async function handleApply(request, env, ctx) {
  let body;
  try {
    body = await parseBody(request);
  } catch (e) {
    return json({ success: false, message: "Invalid request body." }, { status: 400 });
  }

  if (body.botcheck) {
    return json({ success: true });
  }

  const fullName = (body.full_name || "").toString().trim();
  const email = (body.email || "").toString().trim();

  if (!fullName || !EMAIL_PATTERN.test(email)) {
    return json({ success: false, message: "Please fill in your name and a valid email." }, { status: 400 });
  }

  const interests = Array.isArray(body.interests) ? body.interests : (body.interests ? [body.interests] : []);

  try {
    await env.DB.prepare(
      `INSERT INTO applications
        (full_name, mobile, email, current_role, preferred_slot, startup_name, one_liner, interests, expectations)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        fullName,
        (body.mobile || "").toString().trim(),
        email,
        (body.current_role || "").toString().trim(),
        EVENT_TIME,
        (body.startup_name || "").toString().trim(),
        (body.one_liner || "").toString().trim(),
        JSON.stringify(interests),
        (body.expectations || "").toString().trim()
      )
      .run();
  } catch (e) {
    return json({ success: false, message: "Could not save your application. Please try again." }, { status: 500 });
  }

  sendApplyReceived(env, ctx, { email, fullName });

  return json({ success: true });
}

async function handleLogin(request, env) {
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

async function handleLogout(request, env) {
  await deleteSession(env, request);
  return json({ success: true }, { headers: { "Set-Cookie": clearSessionCookieHeader() } });
}

async function handleSession(request, env) {
  const adminId = await requireAuth(request, env);
  return json({ authenticated: !!adminId });
}

async function handleSignups(request, env) {
  const adminId = await requireAuth(request, env);
  if (!adminId) return json({ success: false, message: "Unauthorized." }, { status: 401 });

  const { results } = await env.DB.prepare(
    "SELECT id, email, created_at FROM signups ORDER BY created_at DESC"
  ).all();

  return json({ success: true, signups: results });
}

async function handleApplicationsList(request, env) {
  const adminId = await requireAuth(request, env);
  if (!adminId) return json({ success: false, message: "Unauthorized." }, { status: 401 });

  const { results } = await env.DB.prepare(
    `SELECT id, full_name, mobile, email, current_role, preferred_slot,
            startup_name, one_liner, interests, expectations, status, created_at
     FROM applications ORDER BY created_at DESC`
  ).all();

  const applications = results.map((row) => {
    let interests = [];
    try {
      interests = JSON.parse(row.interests || "[]");
    } catch (e) {
      interests = [];
    }
    return { ...row, interests };
  });

  return json({ success: true, applications });
}

async function handleApplicationPatch(request, env, ctx, id) {
  const adminId = await requireAuth(request, env);
  if (!adminId) return json({ success: false, message: "Unauthorized." }, { status: 401 });

  const numericId = parseInt(id, 10);
  if (!numericId) return json({ success: false, message: "Invalid application id." }, { status: 400 });

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return json({ success: false, message: "Invalid request." }, { status: 400 });
  }

  const status = (body.status || "").toString();
  if (!VALID_STATUSES.includes(status)) {
    return json({ success: false, message: "Invalid status." }, { status: 400 });
  }

  const existing = await env.DB.prepare(
    "SELECT full_name, email, status FROM applications WHERE id = ?"
  )
    .bind(numericId)
    .first();

  await env.DB.prepare("UPDATE applications SET status = ? WHERE id = ?").bind(status, numericId).run();

  if (existing && status === "accepted" && existing.status !== "accepted") {
    sendApplyAccepted(env, ctx, {
      email: existing.email,
      fullName: existing.full_name,
    });
  }

  return json({ success: true });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const { pathname } = url;
    const method = request.method;

    try {
      if (pathname === "/api/subscribe" && method === "POST") return await handleSubscribe(request, env, ctx);
      if (pathname === "/api/apply" && method === "POST") return await handleApply(request, env, ctx);
      if (pathname === "/api/login" && method === "POST") return await handleLogin(request, env);
      if (pathname === "/api/logout" && method === "POST") return await handleLogout(request, env);
      if (pathname === "/api/session" && method === "GET") return await handleSession(request, env);
      if (pathname === "/api/signups" && method === "GET") return await handleSignups(request, env);
      if (pathname === "/api/applications" && method === "GET") return await handleApplicationsList(request, env);

      const appMatch = pathname.match(/^\/api\/applications\/([^/]+)$/);
      if (appMatch && method === "PATCH") return await handleApplicationPatch(request, env, ctx, appMatch[1]);
    } catch (e) {
      return json({ success: false, message: "Server error." }, { status: 500 });
    }

    return env.ASSETS.fetch(request);
  },
};
