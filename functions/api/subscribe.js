import { json } from "../lib/auth.js";

export async function onRequestPost({ request, env }) {
  let body;
  const contentType = request.headers.get("Content-Type") || "";
  try {
    if (contentType.includes("application/json")) {
      body = await request.json();
    } else {
      const form = await request.formData();
      body = Object.fromEntries(form.entries());
    }
  } catch (e) {
    return json({ success: false, message: "Invalid request body." }, { status: 400 });
  }

  const email = (body.email || "").toString().trim();
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailPattern.test(email)) {
    return json({ success: false, message: "Please provide a valid email address." }, { status: 400 });
  }

  // Honeypot: silently accept but don't store.
  if (body.botcheck) {
    return json({ success: true });
  }

  try {
    await env.DB.prepare("INSERT INTO signups (email) VALUES (?)").bind(email).run();
  } catch (e) {
    return json({ success: false, message: "Could not save your signup. Please try again." }, { status: 500 });
  }

  return json({ success: true });
}
