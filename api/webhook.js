import crypto from "node:crypto";
import { postJSON } from "../lib/validate.js";
import { acessosDe, GUIA_INSTALACAO } from "../lib/entrega.js";

// Notificações do Mercado Pago. Consulta o pagamento direto na API (não confia no corpo)
// e, quando aprovado, avisa DELIVERY_WEBHOOK_URL pra liberar o acesso (WhatsApp/e-mail).
function validSignature(req, dataId) {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) return true; // validação desligada se não houver chave
  const sig = String(req.headers["x-signature"] || "");
  const reqId = String(req.headers["x-request-id"] || "");
  const parts = Object.fromEntries(sig.split(",").map((p) => p.trim().split("=")));
  if (!parts.ts || !parts.v1) return false;
  const manifest = `id:${String(dataId).toLowerCase()};request-id:${reqId};ts:${parts.ts};`;
  const hmac = crypto.createHmac("sha256", secret).update(manifest).digest("hex");
  try { return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(parts.v1)); } catch { return false; }
}

export default async function handler(req, res) {
  const q = req.query || {};
  const body = req.body || {};
  const type = body.type || q.type || q.topic;
  const id = (body.data && body.data.id) || q["data.id"] || q.id;
  if (type !== "payment" || !id) return res.status(200).json({ ignored: true });
  if (!validSignature(req, id)) return res.status(401).json({ error: "assinatura inválida" });

  try {
    const r = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
      headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
    });
    const p = await r.json();
    if (!r.ok) { console.error("consulta pagamento falhou", r.status, p); return res.status(200).json({ ok: false }); }
    const m = p.metadata || {};
    const payload = {
      event: "pagamento_" + p.status, // pagamento_approved, pagamento_pending, pagamento_rejected...
      payment_id: p.id, status: p.status, metodo: p.payment_type_id, valor: p.transaction_amount,
      ref: p.external_reference, name: m.name, email: m.email || (p.payer && p.payer.email), whatsapp: m.whatsapp,
      items: m.items ? String(m.items).split(",") : [], at: new Date().toISOString(),
    };
    if (p.status === "approved") { payload.acessos = acessosDe(payload.items); payload.guia = GUIA_INSTALACAO; }
    console.log("PAGAMENTO", JSON.stringify(payload));
    // um único endereço já basta (a planilha registra e entrega); DELIVERY_WEBHOOK_URL é opcional e separado
    await postJSON(process.env.LEAD_WEBHOOK_URL, payload);
    if (p.status === "approved" && process.env.DELIVERY_WEBHOOK_URL && process.env.DELIVERY_WEBHOOK_URL !== process.env.LEAD_WEBHOOK_URL)
      await postJSON(process.env.DELIVERY_WEBHOOK_URL, payload);
  } catch (e) {
    console.error(e);
  }
  res.status(200).json({ ok: true });
}
