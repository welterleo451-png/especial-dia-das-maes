require('dotenv').config();
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');
const PACKS = require('./packs');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Configuração Mercado Pago ────────────────────────────────
const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
  options: { timeout: 5000 },
});

// ─── Middleware ───────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// ─── Armazenamento em memória (troque por banco de dados em prod)
// Guarda pagamentos confirmados: { paymentId -> packId }
const pagamentosConfirmados = new Map();

// ─── Gera token de acesso assinado após pagamento confirmado ──
function gerarToken(packId, paymentId) {
  const payload = `${packId}:${paymentId}:${Date.now()}`;
  const assinatura = crypto
    .createHmac('sha256', process.env.JWT_SECRET || 'dev-secret')
    .update(payload)
    .digest('hex');
  // Token = payload em base64 + assinatura
  return Buffer.from(payload).toString('base64url') + '.' + assinatura;
}

function verificarToken(token) {
  try {
    const [payloadB64, assinatura] = token.split('.');
    const payload = Buffer.from(payloadB64, 'base64url').toString();
    const assinaturaEsperada = crypto
      .createHmac('sha256', process.env.JWT_SECRET || 'dev-secret')
      .update(payload)
      .digest('hex');
    if (assinatura !== assinaturaEsperada) return null;
    const [packId, paymentId] = payload.split(':');
    return { packId, paymentId };
  } catch {
    return null;
  }
}

// ════════════════════════════════════════════════════════════════
// ROTAS
// ════════════════════════════════════════════════════════════════

// ─── GET / → serve a landing page ────────────────────────────
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// ─── GET /api/packs → lista os packs (sem URLs de MP3) ───────
app.get('/api/packs', (req, res) => {
  const packsPublicos = Object.values(PACKS).map(p => ({
    id: p.id,
    ico: p.ico,
    nome: p.nome,
    tagline: p.tagline,
    precoLabel: p.precoLabel,
    destaque: p.destaque || false,
    faixas: p.faixas.map(f => ({
      nome: f.nome,
      genero: f.genero,
      previaUrl: f.previaUrl, // só a prévia é pública
    })),
  }));
  res.json(packsPublicos);
});

// ─── POST /api/criar-preferencia → cria preferência no MP ────
// Usado para pagamento com cartão via Checkout Bricks
app.post('/api/criar-preferencia', async (req, res) => {
  const { packId, email } = req.body;
  const pack = PACKS[packId];
  if (!pack) return res.status(400).json({ erro: 'Pack inválido' });

  try {
    const preference = new Preference(client);
    const resultado = await preference.create({
      body: {
        items: [
          {
            id: pack.id,
            title: pack.nome,
            description: `${pack.faixas.length} músicas MP3 + letras em PDF — Dia das Mães`,
            quantity: 1,
            currency_id: 'BRL',
            unit_price: pack.preco / 100,
          },
        ],
        payer: { email: email || '' },
        payment_methods: {
          excluded_payment_types: [{ id: 'ticket' }], // sem boleto
          installments: 1,
        },
        back_urls: {
          success: `${process.env.BASE_URL}/sucesso`,
          failure: `${process.env.BASE_URL}/falha`,
          pending: `${process.env.BASE_URL}/pendente`,
        },
        auto_return: 'approved',
        notification_url: `${process.env.BASE_URL}/webhook/mercadopago`,
        metadata: { pack_id: packId },
      },
    });

    res.json({ preferenceId: resultado.id });
  } catch (err) {
    console.error('Erro ao criar preferência:', err);
    res.status(500).json({ erro: 'Erro ao criar preferência de pagamento' });
  }
});

// ─── POST /api/processar-pagamento → pagamento direto via API ─
// Para cartão de crédito com Checkout Transparente (avançado)
app.post('/api/processar-pagamento', async (req, res) => {
  const { packId, token, email, installments = 1, issuerId, paymentMethodId } = req.body;
  const pack = PACKS[packId];
  if (!pack) return res.status(400).json({ erro: 'Pack inválido' });

  try {
    const payment = new Payment(client);
    const resultado = await payment.create({
      body: {
        transaction_amount: pack.preco / 100,
        token,           // token gerado pelo SDK do MP no frontend
        description: pack.nome,
        installments,
        payment_method_id: paymentMethodId,
        issuer_id: issuerId,
        payer: { email },
        metadata: { pack_id: packId },
        notification_url: `${process.env.BASE_URL}/webhook/mercadopago`,
      },
    });

    if (resultado.status === 'approved') {
      const accessToken = gerarToken(packId, String(resultado.id));
      pagamentosConfirmados.set(String(resultado.id), packId);
      return res.json({ status: 'aprovado', accessToken });
    }

    if (resultado.status === 'in_process' || resultado.status === 'pending') {
      return res.json({ status: 'pendente', paymentId: resultado.id });
    }

    return res.status(402).json({ status: 'recusado', detalhe: resultado.status_detail });
  } catch (err) {
    console.error('Erro no pagamento:', err);
    res.status(500).json({ erro: 'Erro ao processar pagamento' });
  }
});

// ─── POST /webhook/mercadopago → recebe notificações do MP ───
app.post('/webhook/mercadopago', async (req, res) => {
  // Responde 200 imediatamente (MP exige resposta rápida)
  res.sendStatus(200);

  const { type, data } = req.body;
  if (type !== 'payment') return;

  try {
    const payment = new Payment(client);
    const pagamento = await payment.get({ id: data.id });

    if (pagamento.status === 'approved') {
      const packId = pagamento.metadata?.pack_id;
      if (!packId) return;

      pagamentosConfirmados.set(String(pagamento.id), packId);
      console.log(`✅ Pagamento ${pagamento.id} aprovado — Pack: ${packId}`);

      // Aqui você pode:
      // - Enviar e-mail com o token de acesso
      // - Salvar no banco de dados
      // - Notificar via webhook próprio
    }
  } catch (err) {
    console.error('Erro ao processar webhook:', err);
  }
});

// ─── GET /api/verificar-pagamento/:paymentId → polling status ─
app.get('/api/verificar-pagamento/:paymentId', async (req, res) => {
  const { paymentId } = req.params;

  // Verifica se já está confirmado em memória
  if (pagamentosConfirmados.has(paymentId)) {
    const packId = pagamentosConfirmados.get(paymentId);
    const accessToken = gerarToken(packId, paymentId);
    return res.json({ status: 'aprovado', accessToken });
  }

  // Consulta o MP
  try {
    const payment = new Payment(client);
    const pagamento = await payment.get({ id: paymentId });

    if (pagamento.status === 'approved') {
      const packId = pagamento.metadata?.pack_id;
      pagamentosConfirmados.set(paymentId, packId);
      const accessToken = gerarToken(packId, paymentId);
      return res.json({ status: 'aprovado', accessToken });
    }

    res.json({ status: pagamento.status });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao verificar pagamento' });
  }
});

// ─── POST /api/acesso → valida token e retorna URLs dos MP3s ──
app.post('/api/acesso', (req, res) => {
  const { token } = req.body;
  const dados = verificarToken(token);

  if (!dados) {
    return res.status(401).json({ erro: 'Token inválido ou expirado' });
  }

  const pack = PACKS[dados.packId];
  if (!pack) return res.status(404).json({ erro: 'Pack não encontrado' });

  // Aqui retorna as URLs reais dos MP3s (só após pagamento confirmado)
  const faixasCompletas = pack.faixas.map(f => ({
    nome: f.nome,
    genero: f.genero,
    mp3Url: f.mp3Url,
    letra: f.letra,
  }));

  res.json({
    pack: {
      id: pack.id,
      ico: pack.ico,
      nome: pack.nome,
    },
    faixas: faixasCompletas,
  });
});

// ─── Páginas de retorno do checkout ──────────────────────────
app.get('/sucesso', (req, res) => {
  const { payment_id, external_reference } = req.query;
  res.redirect(`/?pagamento=sucesso&pid=${payment_id}`);
});
app.get('/falha', (req, res) => res.redirect('/?pagamento=falha'));
app.get('/pendente', (req, res) => res.redirect('/?pagamento=pendente'));

// ─── Inicia o servidor ────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════╗
║   🌸 Uma Canção Para Sua Mãe            ║
║   Servidor rodando em http://localhost:${PORT} ║
╚══════════════════════════════════════════╝
  `);
});
