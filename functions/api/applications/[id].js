import { json, requireAuth } from "../../lib/auth.js";

const VALID_STATUSES = ["awaiting_review", "accepted", "waitlist", "declined"];

export async function onRequestPatch({ request, env, params }) {
  const adminId = await requireAuth(request, env);
  if (!adminId) return json({ success: false, message: "Unauthorized." }, { status: 401 });

  const id = parseInt(params.id, 10);
  if (!id) return json({ success: false, message: "Invalid application id." }, { status: 400 });

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

  await env.DB.prepare("UPDATE applications SET status = ? WHERE id = ?").bind(status, id).run();

  return json({ success: true });
}
