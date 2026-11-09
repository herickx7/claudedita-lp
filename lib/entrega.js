// ============================================================
//  ENTREGA — o que cada produto libera depois do pagamento aprovado.
//  Cole aqui os links (Google Drive com "qualquer pessoa com o link",
//  convite do Discord etc.). Estes links NUNCA aparecem no site antes
//  do pagamento: só são enviados pelo servidor depois que o Mercado Pago
//  confirma a compra (página de obrigado + e-mail automático).
// ============================================================
export const ENTREGA = {
  metodo:    { label: "Skill de edição (pixel-reel-editor.zip)", url: "https://drive.google.com/file/d/10_cxTC2SjmDnN4ABJQQ4fPlBS28R0xHy/view?usp=sharing" },
  prompts:   { label: "Pack 300 prompts (PDF)", url: "https://drive.google.com/file/d/1fISHq4SnZ4Mx5Z9JRj8yeJiy5G8pmQTf/view?usp=sharing" },
  sfx:       { label: "Banco de efeitos 8-bit + trilhas", url: "https://drive.google.com/file/d/1_VImAS0coVZLMSwj9PnATmgUFgRX-sg9/view?usp=sharing" },
  templates: { label: "Templates de personagem e cenas", url: "https://drive.google.com/file/d/1r4LV167rIpr7_bsEiUETrJOCJwfFIr4S/view?usp=sharing" },
  vip:       { label: "Entrar no Grupo VIP do Discord", url: "https://discord.gg/claudeditavip" },
};

// Link de um guia/aula de "como instalar a skill no Claude" (opcional)
export const GUIA_INSTALACAO = "";

export function acessosDe(ids = []) {
  return ids.filter((id) => ENTREGA[id]).map((id) => ({ id, ...ENTREGA[id] }));
}
