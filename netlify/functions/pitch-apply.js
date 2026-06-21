// Netlify Function: receives "Pitch It" applications (public/pitch/index.html)
// and emails them to the team via Resend (https://resend.com).
//
// Required env var:  RESEND_API_KEY
// Optional env vars: PITCH_NOTIFY_TO    (default: aitransformers.vn@gmail.com)
//                    PITCH_NOTIFY_FROM  (must be a Resend-verified sender)

const REQUIRED_FIELDS = ['name', 'email', 'phone', 'company', 'website', 'social', 'pitch_topic'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const json = (statusCode, body) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

const escapeHtml = (s = '') =>
  String(s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed.' });
  }

  // Parse body
  let data;
  try {
    data = JSON.parse(event.body || '{}');
  } catch {
    return json(400, { error: 'Invalid request body.' });
  }

  // Validate
  const missing = REQUIRED_FIELDS.filter((f) => !String(data[f] || '').trim());
  if (missing.length) {
    return json(400, { error: `Please fill in all required fields (${missing.join(', ')}).` });
  }
  if (!EMAIL_RE.test(String(data.email).trim())) {
    return json(400, { error: 'Please enter a valid email address.' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('RESEND_API_KEY is not set.');
    return json(500, { error: 'Email service is not configured. Please try again later.' });
  }

  const fields = REQUIRED_FIELDS.map((f) => String(data[f]).trim());
  const [name, email, phone, company, website, social, pitch_topic] = fields;

  const rows = [
    ['Name', name], ['Email', email], ['Phone', phone], ['Company', company],
    ['Website', website], ['Social', social], ['What they\'ll share', pitch_topic],
  ].map(([k, v]) => `<tr><td style="padding:6px 12px;font-weight:600">${escapeHtml(k)}</td>` +
    `<td style="padding:6px 12px">${escapeHtml(v)}</td></tr>`).join('');

  const html = `<h2>New Pitch Application</h2>` +
    `<table style="border-collapse:collapse;font-family:sans-serif">${rows}</table>`;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.PITCH_NOTIFY_FROM || 'AITV Pitch <onboarding@resend.dev>',
        to: [process.env.PITCH_NOTIFY_TO || 'aitransformers.vn@gmail.com'],
        reply_to: email,
        subject: `Pitch application: ${name} (${company})`,
        html,
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      console.error('Resend error:', res.status, detail);
      return json(502, { error: 'Could not send your application. Please try again later.' });
    }

    return json(200, { ok: true });
  } catch (err) {
    console.error('pitch-apply failed:', err);
    return json(500, { error: 'Something went wrong. Please try again.' });
  }
};
