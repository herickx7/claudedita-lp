import { cleanLead, postJSON } from "../lib/validate.js";

// Recebe o lead (nome, e-mail, WhatsApp + respostas do quiz) assim que ele preenche,
// mesmo que não compre. Se LEAD_WEBHOOK_URL estiver configurada (Make, n8n, Zapier,
// Google Sheets via Apps Script...), o lead é repassado pra lá.
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "method" });
  const lead = cleanLead(req.body || {});
  if (lead.errors.length) return res.status(400).json({ error: "invalid", fields: lead.errors });
  const answers = typeof req.body.answers === "object" && req.body.answers ? req.body.answers : {};
  const payload = {
    event: "lead",
    name: lead.name,
    email: lead.email,
    whatsapp: "+55" + lead.whatsapp,
    answers,
    utm: req.body.utm || {},
    at: new Date().toISOString(),
  };
  console.log("LEAD", JSON.stringify(payload));
  await postJSON(process.env.LEAD_WEBHOOK_URL, payload);
  res.status(200).json({ ok: true });
}
