import crypto from "node:crypto";
import { computeOrder } from "../lib/catalog.js";
import { cleanLead, baseUrl, postJSON } from "../lib/validate.js";

// Cria a preferência no Mercado Pago com UM único item: o valor final do pedido
// montado no site. O total é recalculado aqui no servidor (nunca confiamos no navegador).
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "method" });
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) return res.status(500).json({ error: "MP_ACCESS_TOKEN não configurado na Vercel" });

  const lead = cleanLead(req.body || {});
  if (lead.errors.length) return res.status(400).json({ error: "invalid", fields: lead.errors });

  const ids = Array.isArray(req.body.items) ? req.body.items : [];
  const order = computeOrder(ids);
  const ref = "CE-" + Date.now().toString(36).toUpperCase() + "-" + crypto.randomBytes(3).toString("hex").toUpperCase();
  const base = baseUrl(req);
  const extras = order.items.length - 1;
  const title = extras > 0 ? `Método claudedita + ${extras} ${extras === 1 ? "bônus" : "bônus"}` : "Método claudedita";
  const [first, ...rest] = lead.name.split(" ");

  const preference = {
    items: [{ id: "pedido-claudedita", title, description: order.items.map((i) => i.name).join(" | ").slice(0, 250), quantity: 1, unit_price: order.total, currency_id: "BRL", category_id: "learnings" }],
    payer: { name: first, surname: rest.join(" "), email: lead.email, phone: { area_code: lead.whatsapp.slice(0, 2), number: lead.whatsapp.slice(2) } },
    back_urls: {
      success: `${base}/obrigado.html?status=aprovado&ref=${ref}`,
      pending: `${base}/obrigado.html?status=pendente&ref=${ref}`,
      failure: `${base}/?pagamento=falhou`,
    },
    auto_return: "approved",
    notification_url: `${base}/api/webhook`,
    external_reference: ref,
    statement_descriptor: "CLAUDEDITA",
    payment_methods: {
      excluded_payment_types: [{ id: "ticket" }], // sem boleto: só Pix e cartão
      installments: Number(process.env.MAX_INSTALLMENTS || 12),
    },
    metadata: { name: lead.name, email: lead.email, whatsapp: "+55" + lead.whatsapp, items: order.items.map((i) => i.id).join(","), total: order.total, ref },
  };

  try {
    const r = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", "X-Idempotency-Key": ref },
      body: JSON.stringify(preference),
    });
    const data = await r.json();
    if (!r.ok) {
      console.error("MP erro", r.status, JSON.stringify(data));
      return res.status(502).json({ error: "mercadopago", detail: data.message || r.status });
    }
    await postJSON(process.env.LEAD_WEBHOOK_URL, {
      event: "checkout_iniciado", ref, name: lead.name, email: lead.email, whatsapp: "+55" + lead.whatsapp,
      items: order.items.map((i) => i.id), total: order.total, at: new Date().toISOString(),
    });
    const sandbox = String(token).startsWith("TEST-");
    res.status(200).json({ url: sandbox ? data.sandbox_init_point : data.init_point, ref, total: order.total });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "falha ao criar pagamento" });
  }
}
