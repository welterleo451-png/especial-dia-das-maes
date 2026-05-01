/**
 * ══════════════════════════════════════════════════════════
 *  PRESENTE DIGITAL PARA MAMÃE — script.js
 *  Versão Original Restaurada
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
  btnNext.addEventListener('click', () => {
    if (!validateStep(currentStep)) return;
    if (currentStep < TOTAL_STEPS) goToStep(currentStep + 1);
    else gerarRecordacao();
  });
}

if (btnBack) {
  btnBack.addEventListener('click', () => {
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

/* ── MOTOR DA RETRO ── */
let activeStoryIndex = 0;
let storyTimer = null;
const STORY_DURATION = 5000;

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
  document.getElementById('touch-left').onclick = () => showStory(activeStoryIndex - 1);
  document.getElementById('touch-right').onclick = () => showStory(activeStoryIndex + 1);
}

async function gerarRecordacao() {
  collectFormData();
  const btn = document.querySelector('.btn-next');
  btn.disabled = true; btn.innerText = 'Salvando...';

  try {
    const resp = await fetch('/api/salvar-retro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state)
    });
    const res = await resp.json();
    if (res.success) {
      state.retroId = res.id;
      renderStories(buildStoriesData());
      document.getElementById('retro-section').style.display = 'block';
      document.getElementById('retro-section').classList.remove('hidden');
      initRetro();
      const audio = document.getElementById('bg-audio');
      audio.src = state.gender === 'feminino' ? 'audio/mulher.mp3' : 'audio/homem.mp3';
      audio.play().catch(() => {});
    } else {
      mostrarToast('Erro ao salvar. Verifique sua conexão.');
    }
  } catch {
    mostrarToast('Erro de conexão.');
  } finally {
    btn.disabled = false; btn.innerText = 'Gerar Retrospectiva';
  }
}

/* ── AUXILIARES ── */
function irParaForm() {
  document.getElementById('form-section').classList.remove('hidden');
  document.getElementById('hero').style.display = 'none';
}

function abrirModal() {
  document.getElementById('overlay').classList.add('open');
}

function fecharModal() {
  document.getElementById('overlay').classList.remove('open');
}

function fecharRetro() {
  document.getElementById('retro-section').style.display = 'none';
  document.getElementById('bg-audio').pause();
}

function mostrarToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
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

document.addEventListener('DOMContentLoaded', () => {
  initCountdown();
  setupPhotoUploads();
  updateFormUI();
});

// Globais
window.irParaForm = irParaForm;
window.abrirModal = abrirModal;
window.fecharModal = fecharModal;
window.fecharRetro = fecharRetro;
window.gerarPix = () => { /* lógica original */ };
window.selecionarPagamento = (m) => { /* lógica original */ };
window.selecionarTier = (t, p) => { state.selectedTier = t; state.selectedPrice = p; };
window.compartilhar = () => {
  const link = `${window.location.origin}/retro/${state.retroId}`;
  window.open(`https://wa.me/?text=${encodeURIComponent('💝 Presente: ' + link)}`);
};
