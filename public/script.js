/**
 * ══════════════════════════════════════════════════════════
 *  PRESENTE DIGITAL PARA MAMÃE — script.js
 *  Versão Fiel ao Vídeo (Design Integrado Claro)
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
    else gerarRecordacao(e);
  });
}

if (btnBack) {
  btnBack.addEventListener('click', (e) => {
    if (e) e.preventDefault();
    if (currentStep > 1) goToStep(currentStep - 1);
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

/* ════════════════════════════════════════════
   2. MOTOR DA RETROSPECTIVA (SLIDES INTEGRADOS)
   ════════════════════════════════════════════ */

let activeStoryIndex = 0;
let storyTimer = null;
const STORY_DURATION = 6000;

function buildStoriesData() {
  const { momName, photos, yearsTogether, momPhrase, bestFood, bestMemory, hobbies, traditions, qualities, dedication } = state;
  return [
    { title: `Para a melhor mãe: ${momName}`, subtitle: 'Uma história de amor...', image: photos[0], icon: '💝' },
    { title: `${yearsTogether} anos incríveis`, subtitle: `Você sempre diz: "${momPhrase}"`, image: photos[1], icon: '✨' },
    { title: 'O sabor da felicidade', subtitle: `Nada supera o seu ${bestFood}`, image: photos[2], icon: '🍽️' },
    { title: 'Nossa melhor memória', subtitle: bestMemory, image: photos[3], icon: '📸' },
    { title: 'Você é única', subtitle: `Pelo seu jeito ${qualities}`, image: photos[4], icon: '🏡' },
    { title: 'Minha gratidão eterna', subtitle: dedication, isFinal: true, icon: '✉️' }
  ];
}

function renderStories(data) {
  if (!storiesContainer || !storiesProgressEl) return;
  storiesContainer.innerHTML = '';
  storiesProgressEl.innerHTML = '';
  
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
        <div class="story-icon-badge">${item.icon || '💝'}</div>
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
   3. GERAÇÃO E SALVAMENTO
   ════════════════════════════════════════════ */

async function gerarRecordacao(e) {
  if (e) e.preventDefault();
  collectFormData();
  
  const storiesData = buildStoriesData();
  renderStories(storiesData);
  
  const retro = document.getElementById('retro-section');
  if (retro) {
    retro.style.display = 'block';
    retro.classList.remove('hidden');
    // ESTILO INTEGRADO (VÍDEO 4)
    retro.style.position = 'relative';
    retro.style.width = '100%';
    retro.style.height = '600px'; // Tamanho aproximado do vídeo
    retro.style.margin = '20px 0';
    retro.style.background = 'transparent';
    retro.style.zIndex = '1';
  }
  
  // Rola até a prévia
  if (retro) retro.scrollIntoView({ behavior: 'smooth' });
  
  initRetro();

  const audio = document.getElementById('bg-audio');
  if (audio) {
     audio.src = (state.gender === 'feminino') ? 'audio/mulher.mp3' : 'audio/homem.mp3';
     audio.play().catch(() => {});
  }

  salvarRetrospectiva().then(id => { if(id) state.retroId = id; });
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

/* ════════════════════════════════════════════
   4. UTILITÁRIOS
   ════════════════════════════════════════════ */

function irParaForm() {
  if (formSection) formSection.classList.remove('hidden');
}

function abrirModal() {
  const overlay = document.getElementById('overlay');
  if (overlay) overlay.classList.add('open');
}

function fecharModal() {
  const overlay = document.getElementById('overlay');
  if (overlay) overlay.classList.remove('open');
}

function mostrarToast(msg) {
  const t = document.getElementById('toast');
  if (t) {
    t.textContent = msg; t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  setupPhotoUploads();
  updateFormUI();
});

// Globais
window.irParaForm = irParaForm;
window.abrirModal = abrirModal;
window.fecharModal = fecharModal;
window.gerarRecordacao = gerarRecordacao;
window.compartilhar = () => {
  const link = `${window.location.origin}/retro/${state.retroId || ''}`;
  window.open(`https://wa.me/?text=${encodeURIComponent('💝 Presente: ' + link)}`);
};
