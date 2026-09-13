import { json } from "../lib/auth.js";

export async function onRequestPost({ request, env }) {
  let body;
  const contentType = request.headers.get("Content-Type") || "";
  try {
    if (contentType.includes("application/json")) {
      body = await request.json();
    } else {
      const form = await request.formData();
      body = {};
      for (const [key, value] of form.entries()) {
        if (key.endsWith("[]")) {
          const cleanKey = key.slice(0, -2);
          if (!body[cleanKey]) body[cleanKey] = [];
          body[cleanKey].push(value);
        } else {
          body[key] = value;
        }
      }
    }
  } catch (e) {
    return json({ success: false, message: "Invalid request body." }, { status: 400 });
  }

  if (body.botcheck) {
    return json({ success: true });
  }

  const fullName = (body.full_name || "").toString().trim();
  const email = (body.email || "").toString().trim();
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const preferredSlot = (body.preferred_slot || "").toString().trim();

  if (!fullName || !emailPattern.test(email) || !preferredSlot) {
    return json({ success: false, message: "Please fill in your name, a valid email, and a preferred slot." }, { status: 400 });
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
        preferredSlot,
        (body.startup_name || "").toString().trim(),
        (body.one_liner || "").toString().trim(),
        JSON.stringify(interests),
        (body.expectations || "").toString().trim()
      )
      .run();
  } catch (e) {
    return json({ success: false, message: "Could not save your application. Please try again." }, { status: 500 });
  }

  return json({ success: true });
}
