/**
 * ══════════════════════════════════════════════════════════
 *  PRESENTE DIGITAL PARA MAMÃE — script.js
 *  Autor: gerado com Claude (Anthropic)
 * ══════════════════════════════════════════════════════════
 */

'use strict';

const state = {
  gifterName:   '',
  gender:       '',
  momName:      '',
  momNickname:  '',
  yearsTogether: 0,
  momPhrase:    '',
  bestFood:     '',
  bestMemory:   '',
  hobbies:      '',
  traditions:   '',
  qualities:    '',
  photos:       [null, null, null, null, null],
  dedication:   '',
};

const TOTAL_STEPS = 6;
let currentStep  = 1;

// Referências DOM Principais
const landingPage      = document.getElementById('landing-page');
const formSection      = document.getElementById('form-section');
const mainHeader       = document.querySelector('.main-header');
const topbar           = document.querySelector('.topbar');

/**
 * showForm()
 * ──────────
 * Transição da Landing Page para o Formulário de criação.
 */
function showForm() {
  landingPage.classList.add('hidden');
  mainHeader.classList.add('hidden');
  topbar.classList.add('hidden');
  formSection.classList.remove('hidden');
  currentStep = 1;
  goToStep(1, 'next');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Conectar botões da Landing Page dinamicamente
document.addEventListener('DOMContentLoaded', () => {
  startCountdown();
  const allCtaButtons = document.querySelectorAll('.btn-primary, .nav-menu a[href="#hero"]');
  allCtaButtons.forEach(btn => {
    btn.onclick = (e) => {
      if (btn.innerText.toLowerCase().includes('criar') || btn.innerText.toLowerCase().includes('surpreenda')) {
        e.preventDefault();
        showForm();
      }
    };
  });
});

/**
 * startCountdown()
 * ───────────────
 * Inicia o contador regressivo para o Dia das Mães.
 */
function startCountdown() {
  // Alvo: Segundo domingo de Maio de 2026 (10 de Maio)
  const targetDate = new Date('May 10, 2026 00:00:00').getTime();

  const update = () => {
    const now = new Date().getTime();
    const diff = targetDate - now;

    if (diff <= 0) {
      clearInterval(timerInterval);
      return;
    }

    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((diff % (1000 * 60)) / 1000);

    const vals = document.querySelectorAll('.t-val');
    if (vals.length >= 4) {
      vals[0].textContent = d.toString().padStart(2, '0');
      vals[1].textContent = h.toString().padStart(2, '0');
      vals[2].textContent = m.toString().padStart(2, '0');
      vals[3].textContent = s.toString().padStart(2, '0');
    }
  };

  const timerInterval = setInterval(update, 1000);
  update();
}

// Inicializa o countdown ao carregar
document.addEventListener('DOMContentLoaded', startCountdown);

// ── Referências DOM do formulário ──
const progressFill    = document.getElementById('form-progress-fill');
const stepCurrentEl   = document.getElementById('step-current');
const btnBack         = document.getElementById('btn-back');
const btnNext         = document.getElementById('btn-next');

// Inicialização
updateFormUI();
setupPhotoUploads();

btnNext.addEventListener('click', () => {
  if (currentStep < TOTAL_STEPS) {
    goToStep(currentStep + 1, 'next');
  } else {
    collectFormData();
    launchRetro();
  }
});

btnBack.addEventListener('click', () => {
  if (currentStep > 1) goToStep(currentStep - 1, 'prev');
});

function goToStep(targetStep, direction = 'next') {
  const currentEl = document.getElementById(`step-${currentStep}`);
  const targetEl = document.getElementById(`step-${targetStep}`);
  
  if (currentEl) {
    currentEl.classList.add('hidden');
    currentEl.classList.remove('slide-in-right', 'slide-in-left');
  }
  
  if (targetEl) {
    targetEl.classList.remove('hidden');
    targetEl.classList.add(direction === 'next' ? 'slide-in-right' : 'slide-in-left');
  }
  
  currentStep = targetStep;
  updateFormUI();
}

function updateFormUI() {
  const pct = (currentStep / TOTAL_STEPS) * 100;
  progressFill.style.width = pct + '%';
  stepCurrentEl.textContent = currentStep;
  btnBack.style.visibility = currentStep === 1 ? 'hidden' : 'visible';
  btnNext.textContent = currentStep === TOTAL_STEPS ? '🎁 Gerar Retrospectiva' : 'Continuar →';
}

function setupPhotoUploads() {
  document.querySelectorAll('.photo-input').forEach((input, index) => {
    input.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        state.photos[index] = ev.target.result;
        const previewEl = document.getElementById(input.getAttribute('data-preview'));
        previewEl.style.backgroundImage = `url(${ev.target.result})`;
        previewEl.innerHTML = '';
      };
      reader.readAsDataURL(file);
    });
  });
}

function collectFormData() {
  state.gifterName = document.getElementById('user-name').value;
  state.gender = document.querySelector('input[name="user-gender"]:checked')?.value || '';
  state.momName = document.getElementById('mom-name').value;
  state.yearsTogether = document.getElementById('years-together').value;
  state.momPhrase = document.getElementById('mom-phrase').value;
  state.genderAudio = document.querySelector('input[name="audio-gender"]:checked')?.value || 'mulher';
  state.dedication = document.getElementById('dedication').value;
}

let activeStoryIndex = 0;
let storyTimer = null;
const STORY_DURATION = 5000;

function launchRetro() {
  document.getElementById('form-section').classList.add('hidden');
  document.getElementById('retro-section').classList.remove('hidden');
  initRetro();
}

function initRetro() {
  const stories = [
    { bg: 'story-bg-1', title: `Para: ${state.momName}`, body: 'Uma história de amor.' },
    { bg: 'story-bg-2', title: `${state.yearsTogether} anos`, body: `Ouvindo: "${state.momPhrase}"` },
    { bg: 'story-bg-3', title: 'Ela ama', body: state.hobbies },
    { bg: 'story-bg-4', title: 'Nossa memória', body: state.bestMemory },
    { bg: 'story-bg-5', title: 'Te amo!', body: state.dedication }
  ];

  renderStories(stories);
  renderProgressBar(stories.length);
  showStory(0);

  document.getElementById('touch-left').onclick = () => showStory(activeStoryIndex - 1);
  document.getElementById('touch-right').onclick = () => showStory(activeStoryIndex + 1);
  document.getElementById('btn-close-retro').onclick = () => window.location.reload();
  
  const audio = document.getElementById('bg-audio');
  audio.src = state.gender === 'masculino' ? 'audio/homem.mp3' : 'audio/mulher.mp3';
  audio.play().catch(() => {});
}

function renderStories(stories) {
  const container = document.getElementById('stories-container');
  container.innerHTML = '';
  stories.forEach((s, i) => {
    const div = document.createElement('div');
    div.className = `story ${s.bg}`;
    div.innerHTML = `<h2>${s.title}</h2><p>${s.body}</p>`;
    container.appendChild(div);
  });
}

function renderProgressBar(count) {
  const bar = document.getElementById('stories-progress');
  bar.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const seg = document.createElement('div');
    seg.className = 'progress-segment';
    seg.innerHTML = '<div class="progress-segment-fill"></div>';
    bar.appendChild(seg);
  }
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
  }, STORY_DURATION);
}
