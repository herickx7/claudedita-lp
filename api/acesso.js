import { acessosDe, GUIA_INSTALACAO } from "../lib/entrega.js";

// Chamado pela página de obrigado: confere o pagamento direto no Mercado Pago
// e, se estiver aprovado, devolve os links dos produtos comprados.
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const id = String((req.query && (req.query.payment_id || req.query.collection_id)) || "").replace(/\D/g, "");
  if (!id) return res.status(400).json({ status: "sem_pagamento" });
  try {
    const r = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, { headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` } });
    const p = await r.json();
    if (!r.ok) return res.status(404).json({ status: "nao_encontrado" });
    if (p.status !== "approved") return res.status(200).json({ status: p.status, metodo: p.payment_type_id });
    const m = p.metadata || {};
    const items = m.items ? String(m.items).split(",") : ["metodo"];
    res.status(200).json({
      status: "approved", nome: String(m.name || "").split(" ")[0], email: m.email || (p.payer && p.payer.email) || "",
      ref: p.external_reference, acessos: acessosDe(items), guia: GUIA_INSTALACAO,
    });
  } catch (e) {
    console.error(e); res.status(500).json({ status: "erro" });
  }
}
