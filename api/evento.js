import { postJSON } from "../lib/validate.js";

// Marcos do funil (em que ponto cada visitante chegou). Só aceita nomes da lista,
// e repassa pra planilha (aba Funil) pelo mesmo endereço dos leads.
const OK = new Set(["1_entrou", "1b_ligou_som", "2_viu_pergunta", "2b_respondeu", "3_viu_demo", "3b_gerou_roteiro", "3c_pulou_demo",
  "4_viu_oferta", "4b_abriu_modulos", "4c_adicionou_extra", "4c_comecou_dados", "4d_preencheu_dados",
  "5_clicou_pagar", "5a_erro_nos_dados", "5b_gerou_pix", "5b_foi_pro_mercado_pago", "5c_voltou_sem_pagar", "5d_erro_ao_gerar_pix", "5d_erro_ao_abrir_pagamento", "5e_copiou_pix", "5f_pix_pago", "5g_fechou_pix"]);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  let b = req.body || {};
  if (typeof b === "string") { try { b = JSON.parse(b); } catch { b = {}; } }
  const step = String(b.step || "");
  if (!OK.has(step)) return res.status(400).json({ ok: false });
  await postJSON(process.env.LEAD_WEBHOOK_URL, {
    event: "funil", step, sid: String(b.sid || "").slice(0, 12), origem: String(b.origem || "").slice(0, 80), at: new Date().toISOString(),
  });
  res.status(200).json({ ok: true });
}
