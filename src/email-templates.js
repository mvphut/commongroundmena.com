// Branded HTML email templates for Common Ground.
// Table-based layout for broad email-client compatibility. Colors match the
// site: dark teal ground, cream foreground, muted sage accent.

const INK = "#0b3630";
const PAPER = "#f7f0da";
const ACCENT = "#9cbb92";
const SITE_URL = "https://commongroundmena.com";
const LOGO_URL = `${SITE_URL}/icon-512.png`;
const MAPS_URL = "https://maps.app.goo.gl/otQvsgbVZnN6SUjN9";
const SPONSOR_MINT_URL = `${SITE_URL}/sponsor-mint-egbank.png`;
const SPONSOR_BADIA_URL = `${SITE_URL}/sponsor-silicon-badia.png`;

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[c]));
}

function sponsorsBlock() {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 22px 0 6px;">
      <tr>
        <td align="center">
          <p style="margin:0 0 10px; font-family: Helvetica, Arial, sans-serif; font-size:11px; letter-spacing:0.14em; text-transform:uppercase; color:#a39a8b;">Sponsors</p>
          <table role="presentation" cellpadding="0" cellspacing="0" style="background-color:${PAPER}; border-radius:14px;">
            <tr>
              <td style="padding: 16px 20px 16px 24px;" valign="middle">
                <img src="${SPONSOR_MINT_URL}" alt="MINT by EGBANK" height="34" style="display:block; height:34px; width:auto; border:0;">
              </td>
              <td style="padding:0 16px;" valign="middle">
                <div style="width:1px; height:28px; background-color:rgba(11,54,48,0.14); font-size:0; line-height:0;">&nbsp;</div>
              </td>
              <td style="padding: 16px 24px 16px 0;" valign="middle">
                <img src="${SPONSOR_BADIA_URL}" alt="Silicon Badia" height="44" style="display:block; height:44px; width:auto; border:0;">
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
}

function emailShell({ preheader, viewInBrowserUrl, bodyHtml }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="color-scheme" content="light">
<meta name="robots" content="noindex, nofollow">
<title>Common Ground</title>
</head>
<body style="margin:0; padding:0; background-color:${PAPER}; font-family: Helvetica, Arial, sans-serif;">
  <div style="display:none; max-height:0; overflow:hidden; opacity:0; mso-hide:all;">
    ${escapeHtml(preheader || "")}
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${PAPER};">
    <tr>
      <td align="center" style="padding: 24px 16px;">

        <table role="presentation" width="100%" style="max-width:560px;" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center" style="padding-bottom: 12px;">
              <a href="${viewInBrowserUrl}" style="font-size:12px; color:#6b6255; text-decoration:underline; font-family: Helvetica, Arial, sans-serif;">View in browser</a>
            </td>
          </tr>
        </table>

        <table role="presentation" width="100%" style="max-width:560px; background-color:${INK}; border-radius:12px 12px 0 0;" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center" style="padding: 28px 24px;">
              <img src="${LOGO_URL}" width="40" height="40" alt="Common Ground" style="display:block; border-radius:8px;">
              <div style="color:${PAPER}; font-family: Helvetica, Arial, sans-serif; font-size:18px; letter-spacing:0.04em; margin-top:10px;">COMMON GROUND</div>
            </td>
          </tr>
        </table>

        <table role="presentation" width="100%" style="max-width:560px; background-color:#ffffff; border-radius:0 0 12px 12px; box-shadow:0 1px 3px rgba(11,54,48,0.08);" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding: 32px 28px; font-family: Helvetica, Arial, sans-serif; font-size:15px; line-height:1.6; color:${INK};">
              ${bodyHtml}
            </td>
          </tr>
        </table>

        <table role="presentation" width="100%" style="max-width:560px;" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center" style="padding: 20px 16px 8px; font-family: Helvetica, Arial, sans-serif; font-size:12px; color:#6b6255;">
              <a href="${SITE_URL}" style="color:#6b6255; text-decoration:underline;">commongroundmena.com</a>
              &nbsp;·&nbsp;
              <a href="${SITE_URL}/privacy" style="color:#6b6255; text-decoration:underline;">Privacy</a>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding: 0 16px 24px; font-family: Helvetica, Arial, sans-serif; font-size:12px; color:#a39a8b;">
              © 2026 Common Ground. All rights reserved.
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>
</body>
</html>`;
}

function button(url, label) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin: 18px 0;"><tr>
    <td style="background-color:${ACCENT}; border-radius:6px;">
      <a href="${url}" style="display:inline-block; padding:12px 22px; font-family: Helvetica, Arial, sans-serif; font-size:14px; color:${INK}; text-decoration:none; font-weight:bold;">${label}</a>
    </td>
  </tr></table>`;
}

export function renderSubscribeEmail() {
  const bodyHtml = `
    <p style="margin:0 0 16px; font-size:18px; font-weight:bold;">You're on the list.</p>
    <p style="margin:0 0 16px;">Thanks for signing up — we'll email you the moment Common Ground launches.</p>
    <p style="margin:24px 0 0; color:#6b6255;">— Common Ground</p>
  `;
  const html = emailShell({
    preheader: "Thanks for signing up — we'll email you when Common Ground launches.",
    viewInBrowserUrl: `${SITE_URL}/email/signup`,
    bodyHtml,
  });
  const text = "You're on the list.\n\nThanks for signing up — we'll email you the moment Common Ground launches.\n\n— Common Ground";
  return { subject: "You're on the list — Common Ground", html, text };
}

export function renderApplyReceivedEmail({ fullName }) {
  const greeting = fullName ? `Hi ${escapeHtml(fullName)},` : "Hi,";
  const greetingText = fullName ? `Hi ${fullName},` : "Hi,";
  const bodyHtml = `
    <p style="margin:0 0 16px; font-size:18px; font-weight:bold;">We got your application.</p>
    <p style="margin:0 0 16px;">${greeting}</p>
    <p style="margin:0 0 16px;">Thanks for applying to <strong>VC Psychology Explained</strong>, hosted by Common Ground x #WTFtv.</p>
    <p style="margin:0 0 16px;">This confirms we've received your application — it does not yet confirm your spot. Slots are limited, and we're reviewing applications on a rolling basis.</p>
    <p style="margin:0 0 16px;">We'll follow up shortly with your status and, if confirmed, your exact slot and venue details.</p>
    ${sponsorsBlock()}
    <p style="margin:12px 0 0; color:#6b6255;">Thank you for your patience,<br>Common Ground x #WTFtv</p>
  `;
  const html = emailShell({
    preheader: "Your application to VC Psychology Explained has been received.",
    viewInBrowserUrl: `${SITE_URL}/email/application-received`,
    bodyHtml,
  });
  const text = [
    "We got your application.",
    "",
    greetingText,
    "",
    "Thanks for applying to VC Psychology Explained, hosted by Common Ground x #WTFtv.",
    "",
    "This confirms we've received your application — it does not yet confirm your spot. Slots are limited, and we're reviewing applications on a rolling basis.",
    "",
    "We'll follow up shortly with your status and, if confirmed, your exact slot and venue details.",
    "",
    "Sponsors: MINT by EGBANK",
    "",
    "Thank you for your patience,",
    "Common Ground x #WTFtv",
  ].join("\n");
  return { subject: "We got your application — VC Psychology Explained", html, text };
}

export function renderApplyAcceptedEmail({ fullName, preferredSlot, venue }) {
  const greeting = fullName ? `Hi ${escapeHtml(fullName)},` : "Hi,";
  const greetingText = fullName ? `Hi ${fullName},` : "Hi,";
  const bodyHtml = `
    <p style="margin:0 0 16px; font-size:18px; font-weight:bold;">You're confirmed.</p>
    <p style="margin:0 0 16px;">${greeting}</p>
    <p style="margin:0 0 16px;">Good news — you're confirmed for <strong>VC Psychology Explained</strong>, hosted by Common Ground x #WTFtv.</p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%; margin: 8px 0 16px; border-collapse:collapse;">
      <tr><td style="padding:6px 0; color:#6b6255; width:110px; vertical-align:top;">Date</td><td style="padding:6px 0; font-weight:bold;">Wednesday, September 16</td></tr>
      <tr><td style="padding:6px 0; color:#6b6255; vertical-align:top;">Time</td><td style="padding:6px 0; font-weight:bold;">${escapeHtml(preferredSlot)}</td></tr>
      <tr><td style="padding:6px 0; color:#6b6255; vertical-align:top;">Venue</td><td style="padding:6px 0; font-weight:bold;">${escapeHtml(venue)}<br><a href="${MAPS_URL}" style="color:#5a7a54; font-size:13px; font-weight:normal;">Get directions ↗</a></td></tr>
      <tr><td style="padding:6px 0; color:#6b6255; vertical-align:top;">Speaker</td><td style="padding:6px 0; font-weight:bold;">Hossam Shafick</td></tr>
    </table>
    <p style="margin:0 0 4px;">Please arrive 10 minutes early. If your slot no longer works for you, reply as soon as possible so we can offer it to someone else.</p>
    ${button(`${SITE_URL}/vc-psychology`, "View event details")}
    ${sponsorsBlock()}
    <p style="margin:12px 0 0; color:#6b6255;">See you there,<br>Common Ground x #WTFtv</p>
  `;
  const html = emailShell({
    preheader: "You're confirmed for VC Psychology Explained on September 16.",
    viewInBrowserUrl: `${SITE_URL}/email/application-confirmed`,
    bodyHtml,
  });
  const text = [
    "You're confirmed.",
    "",
    greetingText,
    "",
    "Good news — you're confirmed for VC Psychology Explained, hosted by Common Ground x #WTFtv.",
    "",
    "Date: Wednesday, September 16",
    `Time: ${preferredSlot}`,
    `Venue: ${venue}`,
    `Get directions: ${MAPS_URL}`,
    "Speaker: Hossam Shafick",
    "",
    "Please arrive 10 minutes early. If your slot no longer works for you, reply as soon as possible so we can offer it to someone else.",
    "",
    "Sponsors: MINT by EGBANK",
    "",
    "See you there,",
    "Common Ground x #WTFtv",
  ].join("\n");
  return { subject: "You're confirmed — VC Psychology Explained, Sept 16", html, text };
}
