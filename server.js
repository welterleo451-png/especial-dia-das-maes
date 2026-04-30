require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const crypto  = require('crypto');
const fetch   = require('node-fetch');
const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');
const PACKS   = require('./packs');

const app  = express();
const PORT = process.env.PORT || 3000;

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
  options: { timeout: 5000 },
});

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const pagamentosConfirmados = new Map();

function gerarToken(packId, paymentId) {
  const payload    = `${packId}:${paymentId}:${Date.now()}`;
  const assinatura = crypto.createHmac('sha256', process.env.JWT_SECRET || 'dev-secret').update(payload).digest('hex');
  return Buffer.from(payload).toString('base64url') + '.' + assinatura;
}

function verificarToken(token) {
  try {
    const [payloadB64, assinatura] = token.split('.');
    const payload = Buffer.from(payloadB64, 'base64url').toString();
    const esperada = crypto.createHmac('sha256', process.env.JWT_SECRET || 'dev-secret').update(payload).digest('hex');
    if (assinatura !== esperada) return null;
    const [packId, paymentId] = payload.split(':');
    return { packId, paymentId };
  } catch { return null; }
}

function driveIdDaUrl(url) {
  if (!url) return null;
  const m = url.match(/id=([^&]+)/);
  return m ? m[1] : null;
}

function proxyUrl(driveUrl) {
  const id = driveIdDaUrl(driveUrl);
  return id ? `/audio/${id}` : driveUrl;
}

// Lista todos os IDs autorizados dos packs
function idsAutorizados() {
  return Object.values(PACKS).flatMap(p =>
    p.faixas.flatMap(f => [driveIdDaUrl(f.mp3Url), driveIdDaUrl(f.previaUrl)].filter(Boolean))
  );
}

// PROXY DE AUDIO — resolve CORS do Google Drive
app.get('/audio/:fileId', async (req, res) => {
  const { fileId } = req.params;

  if (!idsAutorizados().includes(fileId)) {
    return res.status(403).json({ erro: 'Arquivo nao autorizado' });
  }

  try {
    const driveUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
    const range = req.headers.range;
    const hdrs = { 'User-Agent': 'Mozilla/5.0' };
    if (range) hdrs['Range'] = range;

    // Segue todos os redirects do Drive automaticamente
    const r = await fetch(driveUrl, { headers: hdrs, follow: 10 });

    const ct = r.headers.get('content-type') || 'audio/mpeg';
    res.setHeader('Content-Type', ct);
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=3600');

    const cl = r.headers.get('content-length');
    if (cl) res.setHeader('Content-Length', cl);
    const cr = r.headers.get('content-range');
    if (cr) { res.setHeader('Content-Range', cr); res.status(206); }

    r.body.pipe(res);
  } catch (err) {
    console.error('Proxy erro:', err.message);
    res.status(500).json({ erro: 'Erro ao buscar audio' });
  }
});

// Serve a public key do MP para o frontend
app.get('/api/mp-public-key', (_req, res) => {
  res.json({ publicKey: process.env.MP_PUBLIC_KEY || '' });
});

app.get('/', (_req, res) => res.sendFile(__dirname + '/public/index.html'));

app.get('/api/packs', (_req, res) => {
  const publicos = Object.values(PACKS).map(p => ({
    id: p.id, ico: p.ico, nome: p.nome, tagline: p.tagline,
    precoLabel: p.precoLabel, destaque: p.destaque || false,
    previaSegundos: p.previaSegundos || 35,
    faixas: p.faixas.map(f => ({
      nome: f.nome, genero: f.genero,
      previaUrl: proxyUrl(f.previaUrl),
    })),
  }));
  res.json(publicos);
});

app.post('/api/criar-preferencia', async (req, res) => {
  const { packId, email } = req.body;
  const pack = PACKS[packId];
  if (!pack) return res.status(400).json({ erro: 'Pack invalido' });
  const baseUrl = (req.headers['x-forwarded-proto'] || req.protocol) + '://' + req.get('host');
  try {
    const preference = new Preference(client);
    const r = await preference.create({ body: {
      items: [{ id: pack.id, title: pack.nome, quantity: 1, currency_id: 'BRL', unit_price: pack.preco / 100 }],
      payer: { email: email || '' },
      payment_methods: { excluded_payment_types: [{ id: 'ticket' }], installments: 1 },
      back_urls: { success: `${baseUrl}/sucesso`, failure: `${baseUrl}/falha`, pending: `${baseUrl}/pendente` },
      auto_return: 'approved',
      notification_url: `${baseUrl}/webhook/mercadopago`,
      metadata: { pack_id: packId },
    }});
    res.json({ preferenceId: r.id });
  } catch (err) { console.error(err); res.status(500).json({ erro: 'Erro MP' }); }
});

app.post('/api/processar-pagamento', async (req, res) => {
  const { packId, token, email, installments = 1, issuerId, paymentMethodId } = req.body;
  const pack = PACKS[packId];
  if (!pack) return res.status(400).json({ erro: 'Pack invalido' });
  const baseUrl = (req.headers['x-forwarded-proto'] || req.protocol) + '://' + req.get('host');
  try {
    const payment = new Payment(client);
    const r = await payment.create({ body: {
      transaction_amount: pack.preco / 100, token, description: pack.nome,
      installments, payment_method_id: paymentMethodId, issuer_id: issuerId,
      payer: { email }, metadata: { pack_id: packId },
      notification_url: `${baseUrl}/webhook/mercadopago`,
    }});
    if (r.status === 'approved') {
      const accessToken = gerarToken(packId, String(r.id));
      pagamentosConfirmados.set(String(r.id), packId);
      return res.json({ status: 'aprovado', accessToken });
    }
    if (['in_process','pending'].includes(r.status)) return res.json({ status: 'pendente', paymentId: r.id });
    return res.status(402).json({ status: 'recusado', detalhe: r.status_detail });
  } catch (err) { console.error(err); res.status(500).json({ erro: 'Erro pagamento' }); }
});

app.post('/webhook/mercadopago', async (req, res) => {
  res.sendStatus(200);
  const { type, data } = req.body;
  if (type !== 'payment') return;
  try {
    const payment = new Payment(client);
    const p = await payment.get({ id: data.id });
    if (p.status === 'approved') {
      const packId = p.metadata?.pack_id;
      if (packId) { pagamentosConfirmados.set(String(p.id), packId); console.log(`Pago: ${p.id} Pack: ${packId}`); }
    }
  } catch (err) { console.error(err); }
});

app.get('/api/verificar-pagamento/:paymentId', async (req, res) => {
  const { paymentId } = req.params;
  if (pagamentosConfirmados.has(paymentId)) {
    return res.json({ status: 'aprovado', accessToken: gerarToken(pagamentosConfirmados.get(paymentId), paymentId) });
  }
  try {
    const payment = new Payment(client);
    const p = await payment.get({ id: paymentId });
    if (p.status === 'approved') {
      const packId = p.metadata?.pack_id;
      pagamentosConfirmados.set(paymentId, packId);
      return res.json({ status: 'aprovado', accessToken: gerarToken(packId, paymentId) });
    }
    res.json({ status: p.status });
  } catch { res.status(500).json({ erro: 'Erro verificar' }); }
});

app.post('/api/acesso', (req, res) => {
  const dados = verificarToken(req.body.token);
  if (!dados) return res.status(401).json({ erro: 'Token invalido' });
  const pack = PACKS[dados.packId];
  if (!pack) return res.status(404).json({ erro: 'Pack nao encontrado' });
  res.json({
    pack: { id: pack.id, ico: pack.ico, nome: pack.nome },
    faixas: pack.faixas.map(f => ({ nome: f.nome, genero: f.genero, mp3Url: proxyUrl(f.mp3Url), letra: f.letra })),
  });
});

// Rota para gerar Pix no Mercado Pago
app.post('/api/gerar-pix', async (req, res) => {
  const { packId, email } = req.body;
  const pack = PACKS[packId];
  if (!pack) return res.status(400).json({ erro: 'Pack invalido' });
  
  const baseUrl = (req.headers['x-forwarded-proto'] || req.protocol) + '://' + req.get('host');
  
  try {
    const payment = new Payment(client);
    const r = await payment.create({ body: {
      transaction_amount: pack.preco / 100,
      description: pack.nome,
      payment_method_id: 'pix',
      payer: { 
        email: email || 'cliente@site.com',
        first_name: 'Cliente',
        last_name: 'Especial'
      },
      metadata: { pack_id: packId },
      notification_url: `${baseUrl}/webhook/mercadopago`,
    }});
    
    // Na v2 do SDK, os dados ficam direto no objeto de resposta
    const qrCodeBase64 = r.point_of_interaction.transaction_data.qr_code_base64;
    const qrCodeText = r.point_of_interaction.transaction_data.qr_code;
    
    res.json({ paymentId: r.id, qrCodeBase64, qrCodeText });
  } catch (err) {
    console.error('Erro MP PIX:', err.message);
    if (err.cause) console.error('Causa:', JSON.stringify(err.cause));
    res.status(500).json({ erro: 'Erro ao gerar Pix no Mercado Pago' });
  }
});


app.get('/sucesso', (req, res) => res.redirect(`/?pagamento=sucesso&pid=${req.query.payment_id}`));
app.get('/falha',   (_req, res) => res.redirect('/?pagamento=falha'));
app.get('/pendente',(_req, res) => res.redirect('/?pagamento=pendente'));

app.listen(PORT, () => {
  console.log(`\n🌸 Servidor rodando em http://localhost:${PORT}\n`);
});
