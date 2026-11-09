/**
 * claudedita — Planilha de leads/vendas + entrega automática por e-mail
 * Cole este código em: Planilha Google → Extensões → Apps Script.
 * Guia passo a passo: automacao/COMO-CONFIGURAR.md
 */

// ===================== CONFIGURAÇÃO =====================
const TOKEN = "TROQUE-POR-UMA-SENHA-LONGA";   // a MESMA da variável WEBHOOK_TOKEN na Vercel
const REMETENTE = "claudedita";                // nome que aparece no e-mail
const SUPORTE_WHATSAPP = "";                   // ex: 5584999999999 (opcional, vai no rodapé do e-mail)
const ASSUNTO = "🎮 Seu acesso chegou — claudedita";
// ========================================================

const ABAS = {
  Leads:    ["Data", "Nome", "E-mail", "WhatsApp", "Perfil", "Trava", "Ideia testada", "Origem (UTM)", "Status", "Última atualização", "Chamar no WhatsApp"],
  Pedidos:  ["Data", "Pedido", "Nome", "E-mail", "WhatsApp", "Itens", "Total (R$)", "Status", "Método", "ID pagamento", "Entregue em", "Atualizado"],
  Clientes: ["Data da compra", "Nome", "E-mail", "WhatsApp", "Itens", "Valor (R$)", "Pedido", "Mensagem de boas-vindas (1 clique)"],
  Log:      ["Data", "Evento", "Dados"],
};
const STATUS_PT = { approved: "PAGO", pending: "AGUARDANDO", in_process: "EM ANÁLISE", rejected: "RECUSADO", cancelled: "CANCELADO", refunded: "REEMBOLSADO", charged_back: "ESTORNADO" };

function doPost(e) {
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const d = JSON.parse(e.postData.contents || "{}");
    if (d.token !== TOKEN) return out({ ok: false, erro: "token" });
    delete d.token;
    log_(d.event, d);
    if (d.event === "lead") onLead_(d);
    else if (d.event === "checkout_iniciado") onCheckout_(d);
    else if (String(d.event || "").indexOf("pagamento_") === 0) onPagamento_(d);
    return out({ ok: true });
  } catch (err) {
    log_("erro", { msg: String(err) });
    return out({ ok: false, erro: String(err) });
  } finally { lock.releaseLock(); }
}
function doGet() { return out({ ok: true, msg: "planilha claudedita online" }); }

// ---------------- eventos ----------------
function onLead_(d) {
  const a = d.answers || {};
  const utm = d.utm ? [d.utm.utm_source, d.utm.utm_campaign, d.utm.utm_content].filter(String).join(" / ") : "";
  upsert_("Leads", 3, d.email, {
    "Data": new Date(), "Nome": d.name, "E-mail": d.email, "WhatsApp": d.whatsapp, "Perfil": a.perfil || "", "Trava": a.trava || "",
    "Ideia testada": a.ideia || "", "Origem (UTM)": utm, "Status": "LEAD", "Última atualização": new Date(),
    "Chamar no WhatsApp": wa_(d.whatsapp, `Oi ${primeiro_(d.name)}! Vi que você testou a IA de edição no claudedita. Ficou alguma dúvida? 😊`),
  }, ["Data"]);
}

function onCheckout_(d) {
  upsert_("Leads", 3, d.email, { "Status": "CHECKOUT", "Última atualização": new Date() }, [], true);
  upsert_("Pedidos", 2, d.ref, {
    "Data": new Date(), "Pedido": d.ref, "Nome": d.name, "E-mail": d.email, "WhatsApp": d.whatsapp,
    "Itens": (d.items || []).join(", "), "Total (R$)": d.total, "Status": "AGUARDANDO", "Atualizado": new Date(),
  }, ["Data"]);
}

function onPagamento_(d) {
  const st = STATUS_PT[d.status] || String(d.status || "").toUpperCase();
  const row = upsert_("Pedidos", 2, d.ref, {
    "Pedido": d.ref, "Nome": d.name, "E-mail": d.email, "WhatsApp": d.whatsapp, "Itens": (d.items || []).join(", "),
    "Total (R$)": d.valor, "Status": st, "Método": d.metodo === "bank_transfer" ? "Pix" : d.metodo, "ID pagamento": d.payment_id, "Atualizado": new Date(),
  }, []);
  if (d.status !== "approved") return;
  upsert_("Leads", 3, d.email, { "Status": "CLIENTE", "Última atualização": new Date() }, [], true);

  const sh = aba_("Pedidos"), col = ABAS.Pedidos.indexOf("Entregue em") + 1;
  if (sh.getRange(row, col).getValue()) return; // já entregue (o Mercado Pago avisa mais de uma vez)
  enviarEmail_(d);
  sh.getRange(row, col).setValue(new Date());
  const links = (d.acessos || []).map(a => `${a.label}: ${a.url}`).join("\n");
  aba_("Clientes").appendRow([new Date(), d.name, d.email, d.whatsapp, (d.items || []).join(", "), d.valor, d.ref,
    wa_(d.whatsapp, `Oi ${primeiro_(d.name)}! 🎮 Seu acesso ao claudedita está liberado:\n\n${links}\n\nQualquer dúvida, é só chamar aqui.`)]);
}

// ---------------- e-mail ----------------
function enviarEmail_(d) {
  if (!d.email) return;
  const itens = (d.acessos || []).map(a => {
    const ok = /^https?:\/\//.test(a.url);
    return `<tr><td style="padding:10px 0;border-bottom:1px solid #2e2a6e;color:#f5f5ff;font-weight:bold">${esc_(a.label)}</td>
      <td style="padding:10px 0;border-bottom:1px solid #2e2a6e;text-align:right">${ok ? `<a href="${a.url}" style="background:#ffc41a;color:#110e26;padding:8px 12px;text-decoration:none;font-weight:bold;font-family:monospace">ABRIR</a>` : "em breve"}</td></tr>`;
  }).join("");
  const html = `<div style="background:#110e26;padding:24px;font-family:Arial,sans-serif;color:#f5f5ff">
    <div style="max-width:520px;margin:0 auto;background:#221e52;border:3px solid #0c0a1c;padding:22px">
      <div style="font-family:monospace;color:#3de0ff;font-size:12px">PAGAMENTO APROVADO · PEDIDO ${esc_(d.ref || "")}</div>
      <h1 style="margin:8px 0 4px;font-size:26px">${esc_(primeiro_(d.name))}, você</h1>
      <div style="display:inline-block;background:#ffc41a;color:#110e26;font-weight:bold;font-size:24px;padding:2px 10px;border:3px solid #0c0a1c">ZEROU O JOGO!</div>
      <p style="color:#c8c8e8;line-height:1.5">Aqui estão os seus acessos. Guarde este e-mail.</p>
      <table style="width:100%;border-collapse:collapse">${itens}</table>
      ${d.guia ? `<p><a href="${d.guia}" style="color:#3de0ff">Como instalar a skill no Claude →</a></p>` : ""}
      <p style="color:#c8c8e8;line-height:1.5;margin-top:18px"><b>Próximo passo:</b> suba o arquivo <b>pixel-reel-editor.zip</b> no Claude (área de Skills) e peça: "faz um vídeo nesse estilo sobre [seu tema]".</p>
      ${SUPORTE_WHATSAPP ? `<p><a href="https://wa.me/${SUPORTE_WHATSAPP}" style="color:#39d98a">Precisa de ajuda? Chama no WhatsApp</a></p>` : ""}
      <p style="font-family:monospace;color:#8888b0;font-size:11px;margin-top:22px">Garantia de 7 dias: se não gostar, responda este e-mail pedindo o reembolso.</p>
    </div></div>`;
  MailApp.sendEmail({ to: d.email, subject: ASSUNTO, htmlBody: html, name: REMETENTE });
}

// ---------------- utilidades ----------------
function aba_(nome) {
  const ss = SpreadsheetApp.getActiveSpreadsheet(); let sh = ss.getSheetByName(nome);
  if (!sh) {
    sh = ss.insertSheet(nome); sh.appendRow(ABAS[nome]); sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, ABAS[nome].length).setFontWeight("bold").setBackground("#221e52").setFontColor("#ffc41a");
  }
  return sh;
}
// atualiza a linha cuja coluna-chave == valor; se não existir, cria. Retorna o número da linha.
function upsert_(nome, colChave, valor, campos, soNaCriacao, soAtualizar) {
  const sh = aba_(nome), cab = ABAS[nome]; valor = String(valor || "").trim();
  let row = 0;
  if (valor && sh.getLastRow() > 1) {
    const vals = sh.getRange(2, colChave, sh.getLastRow() - 1, 1).getValues();
    for (let i = vals.length - 1; i >= 0; i--) if (String(vals[i][0]).trim().toLowerCase() === valor.toLowerCase()) { row = i + 2; break; }
  }
  if (!row) {
    if (soAtualizar) return 0;
    sh.appendRow(cab.map(c => campos[c] !== undefined ? campos[c] : "")); return sh.getLastRow();
  }
  cab.forEach((c, i) => {
    if (campos[c] === undefined || (soNaCriacao || []).indexOf(c) >= 0) return;
    if (campos[c] === "" || campos[c] === null) return;
    sh.getRange(row, i + 1).setValue(campos[c]);
  });
  return row;
}
function log_(ev, d) { try { aba_("Log").appendRow([new Date(), ev, JSON.stringify(d).slice(0, 4000)]); } catch (e) {} }
function wa_(num, msg) { num = String(num || "").replace(/\D/g, ""); return num ? `https://wa.me/${num}?text=${encodeURIComponent(msg)}` : ""; }
function primeiro_(n) { return String(n || "").split(" ")[0] || "Olá"; }
function esc_(s) { return String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }
function out(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

// Rode esta função UMA vez pelo editor (botão ▶) para criar as abas e autorizar o envio de e-mail.
function configurarPlanilha() {
  Object.keys(ABAS).forEach(aba_);
  const del = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Página1") || SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Sheet1");
  if (del && SpreadsheetApp.getActiveSpreadsheet().getSheets().length > 1) SpreadsheetApp.getActiveSpreadsheet().deleteSheet(del);
  MailApp.getRemainingDailyQuota(); // força a permissão de e-mail
}
