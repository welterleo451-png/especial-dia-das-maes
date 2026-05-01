/**
 * ══════════════════════════════════════════════════════════
 *  PRESENTE DIGITAL PARA MAMÃE — script.js
 *  Versão Estável Restaurada (Premium Layout)
 * ══════════════════════════════════════════════════════════
 */

'use strict';

const state = {
  gifterName: '', gender: '', gifterWhatsapp: '',
  momName: '', momNickname: '', yearsTogether: 0,
  momPhrase: '', bestFood: '', bestMemory: '',
  hobbies: '', traditions: '', qualities: '',
  photos: [null, null, null, null, null],
  dedication: '',
  unlocked: false, selectedTier: 'complete', selectedPrice: 14.90,
  retroId: null,
};

if (window.RETRO_DATA) {
  Object.assign(state, window.RETRO_DATA);
  if (window.RETRO_DATA.unlocked) state.unlocked = true;
}

const TOTAL_STEPS = 6;
let currentStep = 1;

// Referências DOM
const formSection = document.getElementById('form-section');
const progressFill = document.getElementById('form-progress-fill');
const stepCurrentEl = document.getElementById('step-current');
const btnBack = document.getElementById('btn-back');
const btnNext = document.getElementById('btn-next');
const formIcon = document.getElementById('form-icon');
const storiesContainer = document.getElementById('stories-container');
const storiesProgressEl = document.getElementById('stories-progress');

const stepIcons = ['💝', '👩', '✨', '🏡', '🖼️', '✉️'];

/* ════════════════════════════════════════════
   1. LÓGICA DO FORMULÁRIO (WIZARD)
   ════════════════════════════════════════════ */

function updateFormUI() {
  const pct = (currentStep / TOTAL_STEPS) * 100;
  if (progressFill) progressFill.style.width = pct + '%';
  if (stepCurrentEl) stepCurrentEl.textContent = currentStep;
  if (btnBack) btnBack.style.visibility = currentStep === 1 ? 'hidden' : 'visible';
  
  if (btnNext) {
    btnNext.textContent = currentStep === TOTAL_STEPS ? '🎁 Gerar Retrospectiva' : 'Continuar →';
    btnNext.classList.toggle('is-generate', currentStep === TOTAL_STEPS);
  }
  
  if (formIcon) formIcon.textContent = stepIcons[currentStep - 1];
}

function validateStep(step) {
  if (step === 1) {
    const name = document.getElementById('gifter-name').value.trim();
    const gender = document.querySelector('input[name="gender"]:checked');
    if (!name || !gender) { mostrarToast('Preencha seu nome e gênero'); return false; }
    state.gifterName = name;
    state.gender = gender.value;
  }
  return true;
}

function goToStep(targetStep, direction) {
  const current = document.getElementById(`step-${currentStep}`);
  const next = document.getElementById(`step-${targetStep}`);
  if (!current || !next) return;

  current.classList.add('step-exiting');
  setTimeout(() => {
    current.classList.add('hidden');
    current.classList.remove('step-exiting');
    next.classList.remove('hidden');
    next.classList.add(direction === 'forward' ? 'step-entering' : 'step-entering-back');
    
    next.addEventListener('animationend', () => {
      next.classList.remove('step-entering', 'step-entering-back');
    }, { once: true });

    currentStep = targetStep;
    updateFormUI();
  }, 300);
}

if (btnNext) {
  btnNext.addEventListener('click', (e) => {
    if (e) e.preventDefault();
    if (!validateStep(currentStep)) return;
    if (currentStep < TOTAL_STEPS) goToStep(currentStep + 1, 'forward');
    else gerarRecordacao(e);
  });
}

if (btnBack) {
  btnBack.addEventListener('click', () => {
    if (currentStep > 1) goToStep(currentStep - 1, 'back');
  });
}

function collectFormData() {
  state.momName = document.getElementById('mom-name').value.trim();
  state.momNickname = document.getElementById('mom-nickname').value.trim() || state.momName;
  state.yearsTogether = document.getElementById('years-together').value || 0;
  state.momPhrase = document.getElementById('mom-phrase').value.trim();
  state.bestFood = document.getElementById('best-food').value.trim();
  state.bestMemory = document.getElementById('best-memory').value.trim();
  state.hobbies = document.getElementById('hobbies').value.trim();
  state.traditions = document.getElementById('traditions').value.trim();
  state.qualities = document.getElementById('qualities').value.trim();
  state.dedication = document.getElementById('dedication').value.trim();
}

function setupPhotoUploads() {
  document.querySelectorAll('.photo-input').forEach((input, index) => {
    input.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target.result;
        state.photos[index] = base64;
        const preview = document.getElementById(input.dataset.preview);
        if (preview) {
          preview.style.backgroundImage = `url(${base64})`;
          preview.innerHTML = '';
          preview.classList.add('has-image');
        }
      };
      reader.readAsDataURL(file);
    });
  });
}

function setupRadioPills() {
  document.querySelectorAll('.radio-pill').forEach(pill => {
    const input = pill.querySelector('input');
    pill.addEventListener('click', () => {
      document.querySelectorAll('.radio-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      if (input) input.checked = true;
    });
  });
}

/* ════════════════════════════════════════════
   2. MOTOR DA RETROSPECTIVA (SLIDES)
   ════════════════════════════════════════════ */

let activeStoryIndex = 0;
let storyTimer = null;
const STORY_DURATION = 5000;

function buildStoriesData() {
  const { momName, momNickname, gifterName, photos, yearsTogether, momPhrase, bestFood, bestMemory, hobbies, traditions, qualities, dedication } = state;
  return [
    { title: `Para a melhor mãe: ${momName}`, subtitle: 'Uma história de amor que começou há muito tempo...', image: photos[0], icon: '💝' },
    { title: `${yearsTogether} anos de momentos incríveis`, subtitle: `Você sempre diz: "${momPhrase}" e a gente cai na risada!`, image: photos[1], icon: '✨' },
    { title: 'O sabor da felicidade', subtitle: `Nada supera o seu ${bestFood}. É o tempero da nossa vida!`, image: photos[2], icon: '🍽️' },
    { title: 'Nossa melhor memória', subtitle: `${bestMemory}. Um dia que ficou guardado para sempre.`, image: photos[3], icon: '📸' },
    { title: 'Você é única', subtitle: `Pelo seu jeito ${qualities}, por amar ${hobbies} e nossas tradições de ${traditions}.`, image: photos[4], icon: '🏡' },
    { title: 'Minha gratidão eterna', subtitle: dedication, isFinal: true, icon: '✉️' }
  ];
}

function renderStories(data) {
  if (!storiesContainer || !storiesProgressEl) return;
  storiesContainer.innerHTML = '';
  storiesProgressEl.innerHTML = '';
  
  data.forEach((item, i) => {
    const story = document.createElement('div');
    story.className = 'story' + (i === 0 ? ' active' : '');
    
    story.innerHTML = `
      <div class="story-bg" style="background-image: url('${item.image || ''}')"></div>
      <div class="story-overlay"></div>
      <div class="story-content">
        <div class="story-icon-badge">${item.icon || '💝'}</div>
        <h2>${item.title}</h2>
        <p>${item.subtitle}</p>
        ${item.isFinal && !state.unlocked ? '<div class="premium-lock"><span>Bloqueado até o pagamento</span></div>' : ''}
      </div>
    `;
    storiesContainer.appendChild(story);

    const seg = document.createElement('div');
    seg.className = 'progress-segment';
    seg.innerHTML = '<div class="progress-segment-fill"></div>';
    storiesProgressEl.appendChild(seg);
  });
}

function showStory(index) {
  const stories = document.querySelectorAll('.story');
  if (index < 0 || index >= stories.length) return;
  
  clearTimeout(storyTimer);
  stories.forEach(s => s.classList.remove('active'));
  stories[index].classList.add('active');
  activeStoryIndex = index;
  
  const fills = document.querySelectorAll('.progress-segment-fill');
  fills.forEach((f, i) => {
    f.style.transition = 'none';
    f.style.width = i < index ? '100%' : '0%';
  });
  
  setTimeout(() => {
    fills[index].style.transition = `width ${STORY_DURATION}ms linear`;
    fills[index].style.width = '100%';
  }, 50);

  storyTimer = setTimeout(() => {
    if (activeStoryIndex < stories.length - 1) showStory(activeStoryIndex + 1);
    else if (!state.unlocked) abrirModal();
  }, STORY_DURATION);
}

function initRetro() {
  activeStoryIndex = 0;
  showStory(0);
  const left = document.getElementById('touch-left');
  const right = document.getElementById('touch-right');
  if (left) left.onclick = () => showStory(activeStoryIndex - 1);
  if (right) right.onclick = () => showStory(activeStoryIndex + 1);
}

/* ════════════════════════════════════════════
   3. GERAÇÃO E PAGAMENTO
   ════════════════════════════════════════════ */

async function gerarRecordacao(e) {
  if (e) e.preventDefault();
  collectFormData();
  
  const btn = document.querySelector('.btn-submit');
  if (btn) {
    btn.disabled = true;
    btn.innerText = 'Gerando sua surpresa...';
  }

  // Mostra a prévia
  const storiesData = buildStoriesData();
  renderStories(storiesData);
  
  const retro = document.getElementById('retro-section');
  if (retro) {
    retro.style.display = 'block';
    retro.classList.remove('hidden');
    retro.style.position = 'fixed';
    retro.style.top = '0'; retro.style.left = '0'; retro.style.zIndex = '999999';
  }
  
  document.body.classList.add('retro-view-mode');
  if (formSection) formSection.classList.add('hidden');
  
  initRetro();
  window.scrollTo({ top: 0, behavior: 'smooth' });

  const audio = document.getElementById('bg-audio');
  if (audio) {
     audio.src = (state.gender === 'feminino') ? 'audio/mulher.mp3' : 'audio/homem.mp3';
     audio.play().catch(() => {});
  }

  // Tenta salvar no banco
  salvarRetrospectiva().then(id => { if(id) state.retroId = id; });

  // Checkout automático após 15s
  setTimeout(() => {
    if (!state.unlocked) abrirModal();
  }, 15000);
}

async function salvarRetrospectiva() {
  try {
    const resp = await fetch('/api/salvar-retro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state)
    });
    const res = await resp.json();
    return res.success ? res.id : null;
  } catch { return null; }
}

let mp = null;
let brickController = null;

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const res = await fetch('/api/mp-public-key');
    const data = await res.json();
    if (data.publicKey) mp = new MercadoPago(data.publicKey, { locale: 'pt-BR' });
  } catch {}
  
  initCountdown();
  setupPhotoUploads();
  setupRadioPills();
  updateFormUI();
});

function abrirModal() {
  const overlay = document.getElementById('overlay');
  if(overlay) overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
  selecionarPagamento('pix');
}

function fecharModal() {
  const overlay = document.getElementById('overlay');
  if(overlay) overlay.classList.remove('open');
  document.body.style.overflow = '';
}

function selecionarPagamento(metodo) {
  state.paymentMethod = metodo;
  const optCartao = document.getElementById('opt-cartao');
  const optPix = document.getElementById('opt-pix');
  if(optCartao) optCartao.classList.toggle('sel', metodo === 'cartao');
  if(optPix) optPix.classList.toggle('sel', metodo === 'pix');
  
  const camposCartao = document.getElementById('campos-cartao');
  const camposPix = document.getElementById('campos-pix');
  if(camposCartao) camposCartao.style.display = metodo === 'cartao' ? 'block' : 'none';
  if(camposPix) camposPix.style.display = metodo === 'pix' ? 'block' : 'none';
}

async function gerarPix() {
  const emailInput = document.getElementById('email-checkout');
  const email = emailInput ? emailInput.value : '';
  if (!email || !email.includes('@')) return mostrarToast('E-mail inválido');
  
  const btn = document.getElementById('btn-pix');
  if(btn) { btn.disabled = true; btn.textContent = 'Gerando...'; }

  try {
    const resp = await fetch('/api/gerar-pix', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ packId: state.selectedTier, email, retroId: state.retroId })
    });
    const data = await resp.json();
    if (data.qrCodeBase64) {
      document.getElementById('pix-area-gerar').style.display = 'none';
      document.getElementById('pix-area-pagamento').style.display = 'block';
      document.getElementById('pix-qr').src = 'data:image/png;base64,' + data.qrCodeBase64;
      document.getElementById('pix-copia-cola').value = data.qrCodeText;
      
      const poll = setInterval(async () => {
        try {
          const check = await fetch(`/api/verificar-pagamento/${data.paymentId}`);
          const res = await check.json();
          if (res.status === 'aprovado') { clearInterval(poll); sucessoPagamento(); }
        } catch {}
      }, 5000);
    }
  } catch { if(btn) { btn.disabled = false; btn.textContent = 'Gerar Pix'; } }
}

function sucessoPagamento() {
  fecharModal();
  state.unlocked = true;
  const shareContainer = document.getElementById('share-btn-container');
  if(shareContainer) shareContainer.classList.remove('hidden');
  renderStories(buildStoriesData());
  showStory(0);
}

function compartilhar() {
  const link = `${window.location.origin}/retro/${state.retroId || ''}`;
  const msg = encodeURIComponent(`💝 Olá! Preparei um presente especial: ${link}`);
  window.open(`https://wa.me/?text=${msg}`, '_blank');
}

function mostrarToast(msg) {
  const t = document.getElementById('toast');
  if(t) {
    t.textContent = msg; t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
  }
}

function initCountdown() {
  const target = new Date('2026-05-11T00:00:00').getTime();
  const el = document.getElementById('countdown-timer');
  if (!el) return;
  setInterval(() => {
    const diff = target - new Date().getTime();
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    el.textContent = `${d}d ${h}h ${m}m ${s}s`;
  }, 1000);
}

function irParaForm() {
  if(formSection) formSection.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

window.gerarRecordacao = gerarRecordacao;
window.compartilhar = compartilhar;
window.irParaForm = irParaForm;
window.abrirModal = abrirModal;
window.fecharModal = fecharModal;
window.selecionarPagamento = selecionarPagamento;
window.gerarPix = gerarPix;
window.aceitarDownsell = () => { state.selectedPrice = 19.90; fecharModal(); abrirModal(); };
window.recusarDownsell = () => fecharModal();
