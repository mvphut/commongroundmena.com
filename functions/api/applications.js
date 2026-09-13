import { json, requireAuth } from "../lib/auth.js";

export async function onRequestGet({ request, env }) {
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
