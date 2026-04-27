# 🌸 Uma Canção Para Sua Mãe
### Infoproduto — Landing page + Checkout + Entrega digital

---

## 📁 Estrutura do projeto

```
cancao-maes/
├── server.js          → Backend Node.js + integração Mercado Pago
├── packs.js           → Catálogo de músicas (edite aqui)
├── public/
│   └── index.html     → Landing page completa (frontend)
├── .env.example       → Variáveis de ambiente (copie para .env)
└── package.json
```

---

## 🚀 Como rodar

### 1. Instalar dependências
```bash
npm install
```

### 2. Configurar variáveis de ambiente
```bash
cp .env.example .env
```
Abra o `.env` e preencha:
- `MP_ACCESS_TOKEN` → sua chave do Mercado Pago (veja abaixo)
- `JWT_SECRET` → qualquer string longa e aleatória
- `BASE_URL` → URL pública do seu servidor

### 3. Iniciar o servidor
```bash
npm start
# ou em modo dev (reinicia automático):
npm run dev
```

Acesse: **http://localhost:3000**

---

## 🔑 Configurar Mercado Pago

1. Acesse: https://www.mercadopago.com.br/developers/panel/app
2. Crie um app (se não tiver)
3. Copie:
   - **Access Token** → vai para `MP_ACCESS_TOKEN` no `.env`
   - **Public Key** → vai para `CONFIG.MP_PUBLIC_KEY` no `public/index.html`

> Use as credenciais de **teste** primeiro para validar tudo, depois troque pelas de **produção**.

---

## 🎵 Adicionar suas músicas

Edite o arquivo `packs.js`:

```js
mp3Url: 'https://SEU_CDN/pack1/nome-da-musica.mp3',
previaUrl: 'https://SEU_CDN/pack1/nome-da-musica-previa.mp3',
```

**Onde hospedar os MP3s:**
- **Google Drive** → compartilhe como "qualquer pessoa com o link" e converta para link direto
- **Cloudflare R2** → gratuito até 10GB, ideal para produção
- **Amazon S3** → robusto, pago por uso
- **GitHub Releases** → gratuito, simples para começar

---

## ⚡ Configurar webhooks (produção)

O Mercado Pago precisa de uma URL pública para notificar pagamentos aprovados.

**Em desenvolvimento:** use o [ngrok](https://ngrok.com)
```bash
ngrok http 3000
# Copie a URL gerada, ex: https://abc123.ngrok.io
# Cole em BASE_URL no .env
```

**Em produção:** deploy no Railway, Render, Fly.io ou VPS e use a URL real.

---

## 🌐 Deploy recomendado (gratuito)

### Railway (mais fácil)
1. Crie conta em https://railway.app
2. Conecte seu repositório GitHub
3. Configure as variáveis de ambiente no painel
4. Deploy automático ✅

### Render
1. Crie conta em https://render.com
2. Novo Web Service → conecte o repositório
3. Build command: `npm install`
4. Start command: `npm start`

---

## 💳 Fluxo de pagamento

```
Cliente clica em "Comprar"
    ↓
Modal de checkout abre
    ↓
Cartão → Brick do MP renderiza formulário seguro
    ↓ (ou)
Pix → mostra chave + botão "já paguei"
    ↓
POST /api/processar-pagamento
    ↓
Mercado Pago confirma
    ↓
Webhook POST /webhook/mercadopago
    ↓
Token de acesso gerado
    ↓
Tela de entrega: player + download MP3 + PDF da letra
```

---

## 📱 Sua chave Pix

No arquivo `public/index.html`, localize:
```js
CHAVE_PIX: 'sua.chave@pix.com.br',
```
Troque pelo seu CPF, CNPJ, e-mail ou celular cadastrado no Pix.

---

## ✅ Checklist antes de lançar

- [ ] Músicas geradas no Suno e hospedadas no CDN
- [ ] Links dos MP3s atualizados em `packs.js`
- [ ] Credenciais de **produção** do Mercado Pago configuradas
- [ ] `BASE_URL` apontando para a URL real do servidor
- [ ] Chave Pix atualizada no `index.html`
- [ ] Webhook configurado no painel do Mercado Pago
- [ ] Testar um pagamento completo (cartão de teste do MP)
- [ ] Conferir e-mail de contato no rodapé da tela de entrega

---

## 📞 Suporte

Dúvidas sobre o Mercado Pago: https://www.mercadopago.com.br/developers/pt/support
