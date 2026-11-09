// ============================================================
//  ENTREGA — o que cada produto libera depois do pagamento aprovado.
//  Cole aqui os links (Google Drive com "qualquer pessoa com o link",
//  grupo do WhatsApp etc.). Estes links NUNCA aparecem no site antes
//  do pagamento: só são enviados pelo servidor depois que o Mercado Pago
//  confirma a compra (página de obrigado + e-mail automático).
// ============================================================
export const ENTREGA = {
  metodo:    { label: "Skill de edição (pixel-reel-editor.zip)", url: "COLE_AQUI_O_LINK_DO_DRIVE" },
  prompts:   { label: "Pack 300 prompts (PDF)", url: "COLE_AQUI_O_LINK_DO_DRIVE" },
  sfx:       { label: "Banco de efeitos 8-bit + trilhas", url: "COLE_AQUI_O_LINK_DO_DRIVE" },
  templates: { label: "Templates de personagem e cenas", url: "COLE_AQUI_O_LINK_DO_DRIVE" },
  vip:       { label: "Entrar no Grupo VIP do WhatsApp", url: "COLE_AQUI_O_LINK_DO_GRUPO" },
};

// Link de um guia/aula de "como instalar a skill no Claude" (opcional)
export const GUIA_INSTALACAO = "";

export function acessosDe(ids = []) {
  return ids.filter((id) => ENTREGA[id]).map((id) => ({ id, ...ENTREGA[id] }));
}
