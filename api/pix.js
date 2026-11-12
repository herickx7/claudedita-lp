import crypto from "node:crypto";
import { computeOrder } from "../lib/catalog.js";
import { cleanLead, baseUrl, postJSON } from "../lib/validate.js";

// Gera o Pix direto pela API do Mercado Pago e devolve o QR code e o "copia e cola"
// pra serem mostrados na nossa própria página (sem mandar a pessoa pro site do Mercado Pago).
// O total é recalculado aqui no servidor. A confirmação chega pelo /api/webhook, igual ao cartão.
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "method" });
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) return res.status(500).json({ error: "MP_ACCESS_TOKEN não configurado" });

  const lead = cleanLead(req.body || {});
  if (lead.errors.length) return res.status(400).json({ error: "invalid", fields: lead.errors });

  const order = computeOrder(Array.isArray(req.body.items) ? req.body.items : [], req.body.coupon);
  const ref = "CE-" + Date.now().toString(36).toUpperCase() + "-" + crypto.randomBytes(3).toString("hex").toUpperCase();
  const base = baseUrl(req);
  const [first, ...rest] = lead.name.split(" ");
  const extras = order.items.length - 1;

  const payment = {
    transaction_amount: order.total,
    description: extras > 0 ? `Método claudedita + ${extras} bônus` : "Método claudedita",
    payment_method_id: "pix",
    payer: { email: lead.email, first_name: first, last_name: rest.join(" ") || first },
    external_reference: ref,
    notification_url: `${base}/api/webhook`,
    statement_descriptor: "CLAUDEDITA",
    metadata: { coupon: order.coupon, name: lead.name, email: lead.email, whatsapp: "+55" + lead.whatsapp, items: order.items.map((i) => i.id).join(","), total: order.total, ref },
  };

  try {
    const r = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", "X-Idempotency-Key": ref },
      body: JSON.stringify(payment),
    });
    const p = await r.json();
    const td = p.point_of_interaction && p.point_of_interaction.transaction_data;
    if (!r.ok || !td || !td.qr_code) {
      console.error("MP pix erro", r.status, JSON.stringify(p));
      return res.status(502).json({ error: "pix_indisponivel", detail: p.message || r.status });
    }
    await postJSON(process.env.LEAD_WEBHOOK_URL, {
      event: "checkout_iniciado", ref, name: lead.name, email: lead.email, whatsapp: "+55" + lead.whatsapp,
      items: order.items.map((i) => i.id), total: order.total, cupom: order.coupon, metodo: "pix_na_pagina", at: new Date().toISOString(),
    });
    res.status(200).json({ id: p.id, ref, total: order.total, qr: td.qr_code, qr64: td.qr_code_base64, ticket: td.ticket_url || "" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "falha ao gerar pix" });
  }
}
