/**
 * ══════════════════════════════════════════════════════════
 *  PRESENTE DIGITAL PARA MAMÃE — script.js
 *  VERSÃO COMPLETA RESTAURADA + CORREÇÃO DE PRÉVIA
 * ══════════════════════════════════════════════════════════
 */

'use strict';

const state = {
  gifterName: '', gender: '',
  momName: '', momNickname: '', yearsTogether: 0,
  momPhrase: '', bestFood: '', bestMemory: '',
  hobbies: '', traditions: '', qualities: '',
  photos: [null, null, null, null, null],
  dedication: '',
  unlocked: false, selectedTier: 'complete', selectedPrice: 14.90,
  retroId: null,
};

const TOTAL_STEPS = 6;
let currentStep = 1;

// Referências DOM
const formSection = document.getElementById('form-section');
const progressFill = document.getElementById('form-progress-fill');
const stepCurrentEl = document.getElementById('step-current');
const btnBack = document.getElementById('btn-back');
const btnNext = document.getElementById('btn-next');
const storiesContainer = document.getElementById('stories-container');
const storiesProgressEl = document.getElementById('stories-progress');

/* ── 1. CONTAGEM REGRESSIVA ── */
function initCountdown() {
  const target = new Date('2026-05-11T00:00:00').getTime();
  const el = document.getElementById('countdown-timer');
  if (!el) return;
  
  const timer = setInterval(() => {
    const now = new Date().getTime();
    const diff = target - now;
    
    if (diff <= 0) {
      clearInterval(timer);
      el.textContent = "É hoje! Feliz Dia das Mães! 💝";
      return;
    }
    
    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((diff % (1000 * 60)) / 1000);
    
    el.textContent = `${d}d ${h}h ${m}m ${s}s`;
  }, 1000);
}

/* ── 2. LÓGICA DO FORMULÁRIO ── */
function updateFormUI() {
  const pct = (currentStep / TOTAL_STEPS) * 100;
  if (progressFill) progressFill.style.width = pct + '%';
  if (stepCurrentEl) stepCurrentEl.textContent = currentStep;
  if (btnBack) btnBack.style.visibility = currentStep === 1 ? 'hidden' : 'visible';
  if (btnNext) {
    btnNext.textContent = currentStep === TOTAL_STEPS ? '🎁 Gerar Retrospectiva' : 'Continuar →';
  }
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

function goToStep(targetStep) {
  const current = document.getElementById(`step-${currentStep}`);
  const next = document.getElementById(`step-${targetStep}`);
  if (current) current.classList.add('hidden');
  if (next) next.classList.remove('hidden');
  currentStep = targetStep;
  updateFormUI();
}

if (btnNext) {
  btnNext.addEventListener('click', (e) => {
    if (e) e.preventDefault();
    if (!validateStep(currentStep)) return;
    if (currentStep < TOTAL_STEPS) goToStep(currentStep + 1);
    else gerarRecordacao();
  });
}

if (btnBack) {
  btnBack.addEventListener('click', (e) => {
    if (e) e.preventDefault();
    if (currentStep > 1) goToStep(currentStep - 1);
  });
}

function setupPhotoUploads() {
  document.querySelectorAll('.photo-input').forEach((input, index) => {
    input.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        state.photos[index] = event.target.result;
        const preview = document.getElementById(input.dataset.preview);
        if (preview) {
          preview.style.backgroundImage = `url(${event.target.result})`;
          preview.innerHTML = '';
          preview.classList.add('has-image');
        }
      };
      reader.readAsDataURL(file);
    });
  });
}

/* ── 3. MOTOR DA RETROSPECTIVA (INTEGRADA) ── */
let activeStoryIndex = 0;
let storyTimer = null;
const STORY_DURATION = 5000;

function renderStories() {
  storiesContainer.innerHTML = '';
  storiesProgressEl.innerHTML = '';
  
  const data = [
    { title: `Para: ${document.getElementById('mom-name').value}`, subtitle: 'Uma história linda...', image: state.photos[0] },
    { title: 'Frase da Mãe', subtitle: document.getElementById('mom-phrase').value, image: state.photos[1] },
    { title: 'Sabor de Casa', subtitle: document.getElementById('best-food').value, image: state.photos[2] },
    { title: 'Melhor Memória', subtitle: document.getElementById('best-memory').value, image: state.photos[3] },
    { title: 'Qualidades', subtitle: document.getElementById('qualities').value, image: state.photos[4] },
    { title: 'Te Amo!', subtitle: document.getElementById('dedication').value }
  ];

  data.forEach((item, i) => {
    const seg = document.createElement('div');
    seg.className = 'progress-segment';
    seg.innerHTML = '<div class="progress-segment-fill"></div>';
    storiesProgressEl.appendChild(seg);

    const story = document.createElement('div');
    story.className = 'story' + (i === 0 ? ' active' : '');
    story.innerHTML = `
      <div class="story-bg" style="background-image: url('${item.image || ''}')"></div>
      <div class="story-overlay"></div>
      <div class="story-content">
        <h2>${item.title}</h2>
        <p>${item.subtitle}</p>
      </div>
    `;
    storiesContainer.appendChild(story);
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
    else abrirModal();
  }, STORY_DURATION);
}

function gerarRecordacao() {
  renderStories();
  const retro = document.getElementById('retro-section');
  retro.classList.remove('hidden');
  retro.style.display = 'block';
  retro.scrollIntoView({ behavior: 'smooth' });
  
  activeStoryIndex = 0;
  showStory(0);
  
  document.getElementById('touch-left').onclick = () => showStory(activeStoryIndex - 1);
  document.getElementById('touch-right').onclick = () => showStory(activeStoryIndex + 1);

  const audio = document.getElementById('bg-audio');
  const gender = document.querySelector('input[name="gender"]:checked').value;
  audio.src = gender === 'feminino' ? 'audio/mulher.mp3' : 'audio/homem.mp3';
  audio.play().catch(() => {});
}

/* ── 4. UTILITÁRIOS E MODAIS ── */
function irParaForm() {
  const form = document.getElementById('form-section');
  form.classList.remove('hidden');
  document.getElementById('hero').style.display = 'none';
  window.scrollTo({ top: form.offsetTop - 100, behavior: 'smooth' });
}

function abrirModal() { document.getElementById('overlay').classList.add('open'); }
function fecharModal() { document.getElementById('overlay').classList.remove('open'); }
function fecharRetro() { document.getElementById('retro-section').style.display = 'none'; }

function mostrarToast(msg) {
  const t = document.getElementById('toast');
  if (t) {
    t.textContent = msg; t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initCountdown();
  setupPhotoUploads();
  updateFormUI();
});

// Vinculação Global
window.irParaForm = irParaForm;
window.abrirModal = abrirModal;
window.fecharModal = fecharModal;
window.fecharRetro = fecharRetro;
window.gerarRecordacao = gerarRecordacao;
window.compartilhar = () => { window.open(`https://wa.me/?text=${encodeURIComponent('💝 Presente Digital!')}`); };
