# claudedita — funil de vendas (Vercel + Mercado Pago)

Página interativa que aquece o lead em 4 fases e manda pro pagamento:

1. **Abertura**: vitrine com 3 vídeos de nichos diferentes (`assets/vitrine.mp4`), diferente do anúncio que leva a pessoa até a página
2. **Fase 1**: quiz (quem é você + maior trava), com resposta personalizada pra cada opção
3. **Fase 2**: calculadora do quanto custa ter vídeo bom todo mês
4. **Fase 3**: demo ao vivo: a pessoa digita uma ideia e recebe roteiro, cenas e 3 ganchos pra copiar
5. **Fase 4**: captura de nome, e-mail e WhatsApp (com aviso de que o acesso chega pelo WhatsApp)
6. **Oferta**: produto principal + order bumps que a pessoa marca, desconto no combo completo e total ao vivo
7. **Pagamento**: o servidor recalcula o total e cria UMA cobrança no Mercado Pago com o valor final (Pix ou cartão)

## Subir no ar

1. Crie um repositório no GitHub e envie todos os arquivos desta pasta.
2. Na Vercel: **Add New → Project → importe o repositório → Deploy** (não precisa configurar build).
3. Em **Settings → Environment Variables**, adicione pelo menos:
   - `MP_ACCESS_TOKEN`: Mercado Pago → Suas integrações → sua aplicação → **Credenciais de produção → Access Token** (começa com `APP_USR-`)
4. Clique em **Redeploy** pra valer a variável.
5. No Mercado Pago, cadastre uma **chave Pix** na conta (sem isso o Pix não aparece no checkout).

Pra testar sem cobrar de verdade, use o Access Token de **teste** (`TEST-...`): o site abre automaticamente o checkout de sandbox.

### Entrega automática e planilha
Siga `automacao/COMO-CONFIGURAR.md`: links dos produtos em `lib/entrega.js`, planilha Google com Apps Script recebendo leads, pedidos e pagamentos, e e-mail de acesso automático.

### Variáveis opcionais (veja `.env.example`)
- `LEAD_WEBHOOK_URL`: recebe cada lead, cada checkout iniciado e cada status de pagamento. Use a URL da planilha (Apps Script) do guia de automação.
- `WEBHOOK_TOKEN`: senha que a planilha confere para aceitar os dados.
- `DELIVERY_WEBHOOK_URL`: recebe **só pagamentos aprovados**, com nome, e-mail, WhatsApp e itens comprados. Use pra disparar o acesso no WhatsApp/e-mail automaticamente.
- `MP_WEBHOOK_SECRET`: assinatura secreta do webhook (Mercado Pago → Webhooks). Se preencher, as notificações falsas são recusadas.
- `MAX_INSTALLMENTS`: máximo de parcelas (padrão 12).
- `COUPONS`: cupons secretos em JSON, ex. `{"AMIGO20":20}`. Funcionam só por link: `seusite.com.br/?cupom=AMIGO20`. Valor mínimo cobrado: R$ 1,00.

O webhook do Mercado Pago já é configurado sozinho em cada pagamento (`/api/webhook`).

## Onde editar
- **Preços, nomes e bumps** → `lib/catalog.js` (é a única fonte de preço; o navegador não consegue alterar o valor cobrado)
- **Textos do funil, perguntas e respostas do quiz, FAQ** → `app.js`
- **Meta Pixel** → `PIXEL_ID` no topo de `app.js` e de `obrigado.html`
- **WhatsApp de suporte na página de obrigado** → `SUPPORT_WHATSAPP` em `obrigado.html`
- **Vídeo da abertura** → `assets/vitrine.mp4` (vertical, de preferência com menos de 5 MB). Não use o mesmo vídeo do anúncio: quem chega já viu.
- **Cores** → variáveis no topo de `styles.css`

## Estrutura
```
index.html  styles.css  app.js     → o funil
obrigado.html                      → retorno do Mercado Pago (aprovado/pendente)
api/catalog.js                     → entrega o catálogo pro site
api/lead.js                        → recebe o lead
api/checkout.js                    → cria a cobrança no Mercado Pago (valor final)
api/webhook.js                     → confirma o pagamento e dispara a entrega
api/acesso.js                      → libera os links na página de obrigado (só se o pagamento estiver aprovado)
lib/entrega.js                     → links de entrega de cada produto
automacao/                         → planilha + e-mail automático (Google Apps Script)
lib/catalog.js                     → preços
assets/                            → vídeo, avatares, fontes
```
