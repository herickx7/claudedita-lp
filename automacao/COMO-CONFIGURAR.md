# Entrega automática + planilha de leads (15 minutos, grátis)

Depois disso, sozinho e sem você fazer nada:
- todo lead (nome, e-mail, WhatsApp, respostas do quiz, origem do anúncio) cai na aba **Leads**;
- quem clica em pagar vira uma linha na aba **Pedidos**, e o status muda sozinho (AGUARDANDO → PAGO);
- quando o pagamento é aprovado, o cliente recebe os links **na página de obrigado e por e-mail**, vira linha na aba **Clientes** e já fica pronto um link de WhatsApp com a mensagem de boas-vindas.

## 1. Suba os produtos no Google Drive
1. Crie uma pasta no Drive e envie os arquivos: `pixel-reel-editor.zip`, `pack-300-prompts.zip`, `chiptune-sfx-generator.zip`, `pixel-templates.zip`.
2. Em cada arquivo: botão direito → **Compartilhar** → "Qualquer pessoa com o link" (Leitor) → **Copiar link**.
3. Cole cada link no arquivo `lib/entrega.js` (troque os `COLE_AQUI...`). No `vip`, cole o link de convite do servidor do Discord (de preferência um convite que não expira).

## 2. Crie a planilha
1. Crie uma planilha nova no Google Sheets (com a mesma conta Gmail que vai enviar os e-mails).
2. Menu **Extensões → Apps Script**. Apague o que tiver e cole todo o conteúdo de `automacao/planilha-e-entrega.gs`.
3. Na linha `const TOKEN = "..."`, troque por uma senha longa só sua (ex: `claudedita-8f3k2m9x-2027`). Preencha `SUPORTE_WHATSAPP` se quiser.
4. Salve (ícone de disquete). No seletor de funções lá em cima, escolha **configurarPlanilha** e clique **▶ Executar**. Autorize o acesso quando pedir (pode aparecer "app não verificado": clique em *Avançado → Acessar*). As abas Leads, Pedidos, Clientes e Log vão aparecer.
5. Clique **Implantar → Nova implantação** → tipo **App da Web** → Executar como: **Eu** → Quem pode acessar: **Qualquer pessoa** → **Implantar**. Copie a **URL do app da Web** (termina em `/exec`).

## 3. Ligue na Vercel
Em **Settings → Environment Variables**, crie:
- `LEAD_WEBHOOK_URL` = a URL `/exec` que você copiou
- `WEBHOOK_TOKEN` = a mesma senha do passo 2.3

Depois: **Deployments → ⋯ → Redeploy**.

## 4. Teste
1. Faça o funil até o cadastro → em segundos o lead aparece na aba **Leads**.
2. Faça um pagamento de teste → aba **Pedidos** com status PAGO, linha em **Clientes** e o e-mail de acesso na caixa do comprador (confira o spam no primeiro).
3. Se nada aparecer, olhe a aba **Log** e os Logs da Vercel.

## Observações
- Se você editar o código do Apps Script depois, faça **Implantar → Gerenciar implantações → editar (lápis) → Nova versão**; senão a URL continua usando a versão antiga.
- Conta Gmail comum envia até ~100 e-mails por dia pelo Apps Script; Google Workspace, ~1.500. Se passar disso, a planilha continua registrando e a página de obrigado continua entregando os links.
- WhatsApp 100% automático exige uma API paga (ex: Z-API, Evolution API). Por enquanto, a coluna "Mensagem de boas-vindas (1 clique)" abre o WhatsApp com a mensagem e os links já escritos: é só apertar enviar.
- Os links dos produtos ficam só no servidor: só aparecem depois que o Mercado Pago confirma o pagamento.
