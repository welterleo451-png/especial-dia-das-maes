/**
 * ══════════════════════════════════════════════════════════
 *  PRESENTE DIGITAL PARA MAMÃE — script.js
 *  Autor: gerado com Claude (Anthropic)
 *
 *  Estrutura principal:
 *  1. Estado global da aplicação
 *  2. Lógica do Formulário Wizard (4 etapas)
 *  3. Lógica da Retrospectiva (Stories)
 *  4. Utilitários
 * ══════════════════════════════════════════════════════════
 */

'use strict';

/* ════════════════════════════════════════════
   1. ESTADO GLOBAL
   Todos os dados coletados pelo formulário
   ficam aqui e são usados para montar os stories
   ════════════════════════════════════════════ */
const state = {
  // Etapa 1
  gifterName:   '',
  gender:       '',   // 'masculino' | 'feminino'
  gifterWhatsapp: '',

  // Etapa 2
  momName:      '',
  momNickname:  '',
  yearsTogether: 0,

  // Etapa 3
  momPhrase:    '',
  bestFood:     '',
  bestMemory:   '',

  // Etapa 4
  hobbies:      '',
  traditions:   '',
  qualities:    '',

  // Etapa 5
  photos:       [null, null, null, null, null], // 5 fotos agora

  // Etapa 6
  dedication:   '',
  
  unlocked: false,
  selectedTier: null,
  selectedPrice: null,
  unlockedTier: '',
  retroId: null,
};

// Se vier do link da mãe (injetado pelo servidor no HTML)
if (window.RETRO_DATA) {
  Object.assign(state, window.RETRO_DATA);
  // Se estiver desbloqueado, garantimos que a flag 'unlocked' esteja true
  if (window.RETRO_DATA.unlocked) state.unlocked = true;
  if (window.RETRO_DATA.tier) state.unlockedTier = window.RETRO_DATA.tier;
  console.log('Retro Data carregada do banco:', state.retroId);
}

// Expõe a escolha de gênero globalmente (para integração de áudio — ver index.html)
window.genderChoice = '';


/* ════════════════════════════════════════════
   2. FORMULÁRIO WIZARD
   ════════════════════════════════════════════ */

const TOTAL_STEPS = 6;
let currentStep  = 1;

// ── Referências DOM do formulário ──
const formSection     = document.getElementById('form-section');
const progressFill    = document.getElementById('form-progress-fill');
const stepCurrentEl   = document.getElementById('step-current');
const btnBack         = document.getElementById('btn-back');
const btnNext         = document.getElementById('btn-next');
const formIcon        = document.getElementById('form-icon');

// Ícones para cada etapa (aparece no topo do card)
const stepIcons = ['💝', '👩', '✨', '🖼️'];

// ── Inicialização ──
updateFormUI();
setupPhotoUploads();
setupRadioPills();

// ── Form overlay open/close ──
document.querySelectorAll('a[href="#form-section"]').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    formSection.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  });
});

const formCloseBtn = document.getElementById('form-close-btn');
if (formCloseBtn) {
  formCloseBtn.addEventListener('click', () => {
    formSection.classList.add('hidden');
    document.body.style.overflow = '';
    const audio = document.getElementById('bg-audio');
    if (audio) audio.pause();
  });
}

// ── Listener: botão Continuar / Gerar ──
btnNext.addEventListener('click', (e) => {
  if (e) e.preventDefault();
  if (!validateStep(currentStep)) return;

  if (currentStep < TOTAL_STEPS) {
    goToStep(currentStep + 1, 'forward');
  } else {
    // Última etapa → coleta dados e inicia a retrospectiva
    collectFormData();
    gerarRecordacao(e); // FUNÇÃO CORRETA RESTAURADA
  }
});

// ── Listener: botão Voltar ──
btnBack.addEventListener('click', () => {
  if (currentStep > 1) goToStep(currentStep - 1, 'back');
});

/**
 * goToStep(targetStep, direction)
 * ──────────────────────────────
 * Gerencia a transição animada entre etapas do formulário.
 * direction: 'forward' | 'back'
 *
 * FLUXO:
 *  1. Adiciona classe CSS de saída na etapa atual (slide out)
 *  2. Aguarda o fim da animação (CSS: ~300ms)
 *  3. Oculta a etapa atual e exibe a próxima
 *  4. Adiciona classe CSS de entrada na nova etapa (slide in)
 *  5. Atualiza os indicadores de progresso
 */
function goToStep(targetStep, direction) {
  const current = document.getElementById(`step-${currentStep}`);
  const next    = document.getElementById(`step-${targetStep}`);

  // Classe de saída (animação CSS)
  current.classList.add('step-exiting');

  // Após a animação de saída, troca os steps
  setTimeout(() => {
    current.classList.add('hidden');
    current.classList.remove('step-exiting');

    next.classList.remove('hidden');
    next.classList.add(direction === 'forward' ? 'step-entering' : 'step-entering-back');

    // Remove a classe de animação após terminar (para reutilização)
    next.addEventListener('animationend', () => {
      next.classList.remove('step-entering', 'step-entering-back');
    }, { once: true });

    currentStep = targetStep;
    updateFormUI();
  }, 300);
}

/**
 * updateFormUI()
 * ──────────────
 * Atualiza: barra de progresso, indicador numérico,
 * visibilidade do botão Voltar, label do botão Avançar,
 * ícone decorativo no topo do card.
 */
function updateFormUI() {
  // Porcentagem de progresso (ex: etapa 2/4 = 50%)
  const pct = (currentStep / TOTAL_STEPS) * 100;
  progressFill.style.width = pct + '%';

  // Indicador numérico
  stepCurrentEl.textContent = currentStep;
  document.getElementById('step-total').textContent = TOTAL_STEPS;

  // Botão Voltar
  btnBack.style.visibility = currentStep === 1 ? 'hidden' : 'visible';

  // Botão Avançar / Gerar
  if (currentStep === TOTAL_STEPS) {
    btnNext.textContent = '🎁 Gerar Retrospectiva';
    btnNext.classList.add('is-generate');
  } else {
    btnNext.textContent = 'Continuar →';
    btnNext.classList.remove('is-generate');
  }

  // Ícone decorativo
  formIcon.textContent = stepIcons[currentStep - 1];
}

/**
 * validateStep(step)
 * ──────────────────
 * Validação básica antes de avançar.
 * Retorna true se o step está preenchido corretamente.
 * Aplica shake visual no campo inválido.
 */
function validateStep(step) {
  if (step === 1) {
    const name   = document.getElementById('gifter-name').value.trim();
    const gender = document.querySelector('input[name="gender"]:checked');
    const wpp    = document.getElementById('gifter-whatsapp').value.trim();
    if (!name)   { shakeField('gifter-name'); return false; }
    if (!gender) { shakeField('pill-m');     return false; }
    if (!wpp)    { shakeField('gifter-whatsapp'); return false; }
  }

  if (step === 2) {
    const momName = document.getElementById('mom-name').value.trim();
    const years   = document.getElementById('years-together').value;
    if (!momName) { shakeField('mom-name');       return false; }
    if (!years)   { shakeField('years-together'); return false; }
  }

  if (step === 3) {
    const phrase = document.getElementById('mom-phrase').value.trim();
    const food   = document.getElementById('best-food').value.trim();
    const mem    = document.getElementById('best-memory').value.trim();
    if (!phrase) { shakeField('mom-phrase'); return false; }
    if (!food)   { shakeField('best-food'); return false; }
    if (!mem)    { shakeField('best-memory'); return false; }
  }

  if (step === 4) {
    const hobbies    = document.getElementById('hobbies').value.trim();
    const traditions = document.getElementById('traditions').value.trim();
    const qualities  = document.getElementById('qualities').value.trim();
    if (!hobbies)    { shakeField('hobbies'); return false; }
    if (!traditions) { shakeField('traditions'); return false; }
    if (!qualities)  { shakeField('qualities'); return false; }
  }

  if (step === 5) {
    // Exigir pelo menos 1 foto
    const hasAnyPhoto = state.photos.some(p => p !== null);
    if (!hasAnyPhoto) {
      shakeField('step-5'); // balança a área inteira
      return false;
    }
  }

  if (step === 6) {
    const ded = document.getElementById('dedication').value.trim();
    if (!ded) { shakeField('dedication'); return false; }
  }

  return true;
}

/**
 * shakeField(elementId)
 * ─────────────────────
 * Aplica animação de "shake" em um campo para feedback visual de erro.
 */
function shakeField(elementId) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.style.animation = 'none';
  el.offsetHeight; // force reflow
  el.style.animation = 'shake 0.35s ease';
  el.addEventListener('animationend', () => el.style.animation = '', { once: true });

  // Injeta o keyframe se não existir ainda
  if (!document.getElementById('shake-style')) {
    const style = document.createElement('style');
    style.id = 'shake-style';
    style.textContent = `
      @keyframes shake {
        0%,100% { transform: translateX(0); }
        20%      { transform: translateX(-8px); }
        40%      { transform: translateX(8px); }
        60%      { transform: translateX(-6px); }
        80%      { transform: translateX(6px); }
      }
    `;
    document.head.appendChild(style);
  }
}

/**
 * setupPhotoUploads()
 * ───────────────────
 * Configura os inputs de arquivo para exibir preview local.
 * Nota: as imagens são salvas como Data URLs (base64) em state.photos[].
 * Não há envio para servidor — tudo funciona localmente no browser.
 */
function setupPhotoUploads() {
  const inputs = document.querySelectorAll('.photo-input');

  inputs.forEach((input, index) => {
    input.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const previewId = input.getAttribute('data-preview');
      const previewEl = document.getElementById(previewId);

      // FileReader lê o arquivo localmente e gera uma URL de dados (base64)
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target.result;

        // Salva no estado global
        state.photos[index] = dataUrl;

        // Atualiza o visual do preview
        previewEl.classList.add('has-image');
        previewEl.innerHTML = `<img src="${dataUrl}" alt="Foto ${index + 1}" />`;
      };
      reader.readAsDataURL(file);
    });
  });
}

/**
 * setupRadioPills()
 * ─────────────────
 * Sincroniza o estado visual dos pills de gênero
 * com a seleção do radio button (CSS :checked cuida disso,
 * mas aqui garantimos o reset ao clicar no pill inteiro).
 */
function setupRadioPills() {
  const radios = document.querySelectorAll('input[name="gender"]');
  radios.forEach(radio => {
    radio.addEventListener('change', () => {
      // Expõe globalmente para integração de áudio
      window.genderChoice = radio.value;
    });
  });
}

/**
 * collectFormData()
 * ─────────────────
 * Lê todos os campos do formulário e popula o objeto `state`.
 */
function collectFormData() {
  state.gifterName    = document.getElementById('gifter-name').value.trim();
  state.gender        = (document.querySelector('input[name="gender"]:checked') || {}).value || '';
  state.gifterWhatsapp = document.getElementById('gifter-whatsapp').value.trim();
  state.momName       = document.getElementById('mom-name').value.trim();
  state.momNickname   = document.getElementById('mom-nickname').value.trim() || state.momName;
  state.yearsTogether = parseInt(document.getElementById('years-together').value) || 0;
  state.momPhrase     = document.getElementById('mom-phrase').value.trim() || '"Você comeu?"';
  state.bestFood      = document.getElementById('best-food').value.trim()  || 'a comida dela';
  state.bestMemory    = document.getElementById('best-memory').value.trim() || 'cada momento juntos';
  state.hobbies       = document.getElementById('hobbies').value.trim() || 'cozinhar e cuidar da família';
  state.traditions    = document.getElementById('traditions').value.trim() || 'reuniões familiares';
  state.qualities     = document.getElementById('qualities').value.trim() || 'amor e dedicação';
  state.dedication    = document.getElementById('dedication').value.trim() || 'Você é tudo para mim!';

  window.genderChoice = state.gender;
}


/* ════════════════════════════════════════════
   3. RETROSPECTIVA (STORIES)
   ════════════════════════════════════════════ */

// ── Configuração do carrossel ──
let activeStoryIndex = 0;      // índice do story atual
let storyTimer       = null;   // timer do progresso automático
let progressInterval = null;   // interval de atualização da barra
const STORY_DURATION = 6000;   // duração de cada story em ms
let progressStartTime = 0;     // timestamp de início do story atual

// ── Referências DOM da retrospectiva ──
const retroSection      = document.getElementById('retro-section');
const storiesContainer  = document.getElementById('stories-container');
const storiesProgressEl = document.getElementById('stories-progress');
const touchLeft         = document.getElementById('touch-left');
const touchRight        = document.getElementById('touch-right');
const btnCloseRetro     = document.getElementById('btn-close-retro');
/**
 * launchRetro()
 * ─────────────
 * Exibe a tela de loading e depois inicializa a retrospectiva.
 * Cria um overlay animado de "carregando" para dar expectativa.
 */
function launchRetro() {
  // ── INICIALIZA ÁUDIO IMEDIATAMENTE (Evita bloqueio de autoplay) ──
  let audio = document.getElementById('bg-audio');
  if (!audio) {
    audio = document.createElement('audio');
    audio.id = 'bg-audio';
    audio.loop = true;
    document.body.appendChild(audio);
  }
  audio.src = (state.gender === 'feminino') ? 'audio/mulher.mp3' : 'audio/homem.mp3';
  audio.load();
  audio.play().catch(e => {
    console.log("Autoplay bloqueado, tentaremos novamente após o loading.");
  });
  // ─────────────────────────────────────────────────────────────────

  // Cria overlay de loading
  const overlay = document.createElement('div');
  overlay.id = 'loading-overlay';
  overlay.innerHTML = `
    <div class="loading-heart">💖</div>
    <div class="loading-text">Preparando algo especial…</div>
  `;
  document.body.appendChild(overlay);

  // Após 2s, esconde o formulário e exibe a retrospectiva
  setTimeout(() => {
    formSection.classList.add('hidden');
    overlay.remove();
    initRetro();
    retroSection.classList.remove('hidden');
    
    // Tenta tocar novamente caso tenha sido bloqueado antes
    if (audio.paused) audio.play().catch(() => {});
  }, 2000);
}

/**
 * initRetro()
 * ───────────
 * Monta os stories dinamicamente com os dados do formulário,
 * cria a barra de progresso, configura os event listeners
 * de navegação e inicia o timer do primeiro story.
 */
function initRetro() {
  // Gera os dados dos stories
  const stories = buildStoriesData();

  // Renderiza os stories no DOM
  renderStories(stories);

  // Renderiza a barra de progresso (um segmento por story)
  renderProgressBar(stories.length);

  // Listeners de navegação por toque
  touchRight.addEventListener('click', () => nextStory());
  touchLeft.addEventListener('click',  () => prevStory());

  // Listener: fechar retrospectiva
  btnCloseRetro.addEventListener('click', closeRetro);
  
  const btnGenerate = document.getElementById('btn-generate-gift');
  if (btnGenerate) {
    btnGenerate.addEventListener('click', generateGift);
  }

  // Inicia no primeiro story
  showStory(0);
}

/**
 * buildStoriesData()
 * ──────────────────
 * Retorna um array de objetos descrevendo cada story.
 * O conteúdo HTML de cada story é gerado dinamicamente
 * usando os dados do estado global.
 *
 * Cada objeto: { bgClass: string, html: string, hasGallery: bool }
 */
function buildStoriesData() {
  const { momName, momNickname, gifterName, yearsTogether,
          momPhrase, bestFood, bestMemory, hobbies, traditions,
          qualities, dedication, photos } = state;

  // Verifica se há fotos carregadas
  const hasPhotos = photos.some(p => p !== null);
  const validPhotos = photos.filter(p => p !== null);

  const stories = [];

  // ── Story 1: Apresentação ──────────────────────────────────────
  stories.push({
    bgClass: 'story-bg-1',
    hasGallery: false,
    html: `
      <div class="story-content">
        <span class="story-emoji">💝</span>
        <p class="story-label">Uma mensagem especial de ${escapeHtml(gifterName)}</p>
        <h1 class="story-title">Para a melhor<br/>mãe do mundo,<br/><span class="highlight">${escapeHtml(momName)}</span></h1>
        <p class="story-body">Este é o seu momento. Aproveite cada segundo.</p>
      </div>
    `,
  });

  // ── Story 2: Anos juntos (stat grande estilo Wrapped) ──────────
  stories.push({
    bgClass: 'story-bg-2',
    hasGallery: false,
    html: `
      <div class="story-content">
        <span class="story-emoji">📅</span>
        <p class="story-label">Anos de amor e história</p>
        <div class="story-stat">${yearsTogether}</div>
        <h2 class="story-title">anos ouvindo:</h2>
        <div class="story-quote">"${escapeHtml(momPhrase)}"</div>
        <p class="story-body" style="margin-top:16px;color:rgba(0,0,0,0.6)">
          E cada vez que ouço isso, sei que estou em casa. 🏡
        </p>
      </div>
    `,
  });

  // ── Story 3: Hobbies e paixões ────────────────────────────────
  stories.push({
    bgClass: 'story-bg-3',
    hasGallery: false,
    html: `
      <div class="story-content">
        <span class="story-emoji">🎨</span>
        <p class="story-label">As paixões que a fazem brilhar</p>
        <h2 class="story-title">${escapeHtml(momNickname)} ama</h2>
        <div class="story-quote">${escapeHtml(hobbies)}</div>
        <p class="story-body" style="margin-top:16px;color:rgba(0,0,0,0.6)">
          E quando ela faz isso, o mundo fica mais bonito. ✨
        </p>
      </div>
    `,
  });

  // ── Story 4: Tradições familiares ─────────────────────────────
  stories.push({
    bgClass: 'story-bg-4',
    hasGallery: false,
    html: `
      <div class="story-content">
        <span class="story-emoji">🏡</span>
        <p class="story-label">As tradições que nos unem</p>
        <h2 class="story-title">Sempre juntos em</h2>
        <div class="story-quote">${escapeHtml(traditions)}</div>
        <p class="story-body" style="margin-top:16px;color:rgba(0,0,0,0.6)">
          Momentos que criam laços eternos. 💕
        </p>
      </div>
    `,
  });

  // ── Story 5: Qualidades admiráveis ────────────────────────────
  stories.push({
    bgClass: 'story-bg-5',
    hasGallery: false,
    html: `
      <div class="story-content">
        <span class="story-emoji">👑</span>
        <p class="story-label">O que mais admiro nela</p>
        <h2 class="story-title">Sua maior força é</h2>
        <div class="story-quote">${escapeHtml(qualities)}</div>
        <p class="story-body" style="margin-top:16px;color:rgba(0,0,0,0.6)">
          E isso me inspira todos os dias. 🌟
        </p>
      </div>
    `,
  });

  // ── Story 6: Galeria ou estatística de comida ──────────────────
  if (hasPhotos && validPhotos.length > 0) {
    // Galeria de fotos com transição automática
    const imgTags = validPhotos.map((src, i) =>
      `<img src="${src}" alt="Foto ${i+1}" class="${i === 0 ? 'visible' : ''}" data-gallery-img="${i}" />`
    ).join('');

    stories.push({
      bgClass: 'story-bg-1',
      hasGallery: true,
      galleryPhotos: validPhotos,
      html: `
        <div class="story-gallery">
          ${imgTags}
          <div class="gallery-overlay"></div>
        </div>
        <div class="story-content" style="position:relative;z-index:3;margin-top:auto;">
          <p class="story-label">O álbum de vocês</p>
          <h2 class="story-title" style="font-size:2rem;">Cada foto,<br/>uma memória.</h2>
        </div>
      `,
    });
  } else {
    // Sem fotos → mostra stat de comida
    stories.push({
      bgClass: 'story-bg-1',
      hasGallery: false,
      html: `
        <div class="story-content">
          <span class="story-emoji">🍽️</span>
          <p class="story-label">O prato mais pedido em</p>
          <div class="story-stat" style="font-size:3.5rem;">casa</div>
          <h2 class="story-title" style="font-size:1.8rem;color:rgba(0,0,0,0.75)">
            ${escapeHtml(bestFood)}
          </h2>
          <p class="story-body" style="color:rgba(0,0,0,0.6);margin-top:12px">
            Não tem restaurante no mundo que chegue perto. 🌟
          </p>
        </div>
      `,
    });
  }

  // ── Story 7: Memória especial ──────────────────────────────────
  stories.push({
    bgClass: 'story-bg-2',
    hasGallery: false,
    html: `
      <div class="story-content">
        <span class="story-emoji">🌟</span>
        <p class="story-label">O momento que não esqueço</p>
        <h2 class="story-title">Lembra de<br/>${escapeHtml(bestMemory)}?</h2>
        <p class="story-body" style="margin-top:16px">
          Esse momento está guardado para sempre no meu coração, ${escapeHtml(momNickname)}.
        </p>
      </div>
    `,
  });

  // ── Story 8: Dedicatória pessoal ───────────────────────────────
  stories.push({
    bgClass: 'story-bg-3',
    hasGallery: false,
    html: `
      <div class="story-content">
        <span class="story-emoji">💌</span>
        <p class="story-label">Uma mensagem do coração</p>
        <h2 class="story-title">Para você,<br/>${escapeHtml(momNickname)}</h2>
        <div class="story-quote" style="font-size:1.2rem;line-height:1.6;margin:20px 0;">
          ${escapeHtml(dedication).replace(/\n/g, '<br/>')}
        </div>
        <p class="story-body" style="margin-top:16px;color:rgba(0,0,0,0.6)">
          Com todo o meu amor, ${escapeHtml(gifterName)}. ❤️
        </p>
      </div>
    `,
  });

  // ── Story 9: Encerramento ──────────────────────────────────────
  stories.push({
    bgClass: 'story-bg-4',
    hasGallery: false,
    html: `
      <div class="story-content">
        <span class="story-emoji">💌</span>
        <p class="story-label">De ${escapeHtml(gifterName)} para</p>
        <h1 class="story-title">${escapeHtml(momNickname)}</h1>
        <div class="story-card-final">
          <p style="font-size:1.1rem;line-height:1.6;color:rgba(255,255,255,0.9)">
            Obrigada por cada abraço, cada conselho, cada olhar de carinho.
            Você é a razão de eu ser quem eu sou.
          </p>
          <p style="margin-top:16px;font-size:1.5rem;font-weight:700;">
            Feliz Dia das Mães! 💖
          </p>
          
          <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 20px;">
            ${state.unlockedTier === 'lifetime' || state.unlockedTier === 'lifetime_downsell' ? `
              <button class="btn-download-story" onclick="baixarTudo()">
                📥 Baixar Recordação Vitalícia
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    `,
  });

  return stories;
}

/**
 * renderStories(stories)
 * ──────────────────────
 * Insere os elementos de story no DOM.
 * Cada story começa oculto (opacity: 0 via CSS .story).
 */
function renderStories(stories) {
  storiesContainer.innerHTML = '';

  stories.forEach((s, i) => {
    const div = document.createElement('div');
    div.className = `story ${s.bgClass}`;
    div.id = `story-${i}`;
    div.innerHTML = s.html;

    // Guarda referência para galeria (se houver)
    if (s.hasGallery) {
      div.dataset.hasGallery = 'true';
      div.dataset.galleryPhotos = JSON.stringify(s.galleryPhotos || []);
    }

    storiesContainer.appendChild(div);
  });
}

/**
 * renderProgressBar(count)
 * ────────────────────────
 * Cria os segmentos da barra de progresso no topo.
 * count = número de stories.
 */
function renderProgressBar(count) {
  storiesProgressEl.innerHTML = '';

  for (let i = 0; i < count; i++) {
    const seg = document.createElement('div');
    seg.className = 'progress-segment';
    seg.id = `seg-${i}`;

    const fill = document.createElement('div');
    fill.className = 'progress-segment-fill';
    seg.appendChild(fill);

    storiesProgressEl.appendChild(seg);
  }
}

/**
 * showStory(index)
 * ────────────────
 * Exibe o story de índice `index` e inicia seu timer.
 *
 * FLUXO:
 *  1. Para timers anteriores
 *  2. Remove estado 'active' de todos os stories
 *  3. Ativa o story alvo (CSS .active → opacity: 1)
 *  4. Atualiza a barra de progresso
 *  5. Inicia o timer de avanço automático
 *  6. Se o story tiver galeria, inicia o slideshow das fotos
 */
function showStory(index) {
  const storyEls = storiesContainer.querySelectorAll('.story');
  const total    = storyEls.length;

  // Limpa timers existentes
  clearTimeout(storyTimer);
  clearInterval(progressInterval);

  // Valida índice
  if (index < 0 || index >= total) return;

  // Mostra paywall no slide 6 (índice 5) se não estiver desbloqueado
  if (index >= 5 && !state.unlocked) {
    const audio = document.getElementById('bg-audio');
    if (audio) audio.pause();
    document.getElementById('retro-preview-overlay').classList.remove('hidden');
    return;
  }

  activeStoryIndex = index;

  // Remove 'active' de todos
  storyEls.forEach(el => el.classList.remove('active'));

  // Ativa o story atual
  const activeEl = document.getElementById(`story-${index}`);
  activeEl.classList.add('active');

  // ── Atualiza barra de progresso ──
  for (let i = 0; i < total; i++) {
    const seg = document.getElementById(`seg-${i}`);
    if (!seg) continue;
    const fill = seg.querySelector('.progress-segment-fill');

    if (i < index) {
      // Já assistido → cheio
      seg.classList.add('done');
      seg.classList.remove('active');
      fill.style.width = '100%';
    } else if (i === index) {
      // Atual → animação de preenchimento
      seg.classList.add('active');
      seg.classList.remove('done');
      fill.style.width = '0%';
    } else {
      // Próximos → vazio
      seg.classList.remove('done', 'active');
      fill.style.width = '0%';
    }
  }

  // ── Animação da barra de progresso ──
  // Atualiza a cada 100ms para suavidade
  progressStartTime = Date.now();
  const activeSeg = document.getElementById(`seg-${index}`);
  const activeFill = activeSeg ? activeSeg.querySelector('.progress-segment-fill') : null;

  if (activeFill) {
    progressInterval = setInterval(() => {
      const elapsed = Date.now() - progressStartTime;
      const pct     = Math.min((elapsed / STORY_DURATION) * 100, 100);
      activeFill.style.width = pct + '%';

      if (pct >= 100) clearInterval(progressInterval);
    }, 100);
  }

  // ── Timer de avanço automático ──
  storyTimer = setTimeout(() => {
    if (activeStoryIndex < total - 1) {
      nextStory();
    } else {
      // Último story → mantém na tela (não fecha sozinho)
      clearInterval(progressInterval);
      if (activeFill) activeFill.style.width = '100%';
    }
  }, STORY_DURATION);

  // ── Galeria de fotos (se o story tiver) ──
  if (activeEl.dataset.hasGallery === 'true') {
    const photos = JSON.parse(activeEl.dataset.galleryPhotos || '[]');
    startGallerySlideshow(activeEl, photos);
  }
}

/**
 * nextStory()
 * ───────────
 * Avança para o próximo story.
 */
function nextStory() {
  const total = storiesContainer.querySelectorAll('.story').length;
  let maxIndex = total - 1;
  
  if (activeStoryIndex < maxIndex) {
    showStory(activeStoryIndex + 1);
  }
}

/**
 * prevStory()
 * ───────────
 * Volta para o story anterior.
 */
function prevStory() {
  if (activeStoryIndex > 0) {
    showStory(activeStoryIndex - 1);
  }
}

/**
 * startGallerySlideshow(storyEl, photos)
 * ───────────────────────────────────────
 * Faz um slideshow automático das fotos dentro de um story de galeria.
 * Troca a imagem visível a cada 1.8 segundos com fade in/out.
 * O intervalo é limpo quando o story muda (o clearInterval em showStory cuida disso).
 */
function startGallerySlideshow(storyEl, photos) {
  if (!photos || photos.length === 0) return;

  let currentPhoto = 0;
  const imgs = storyEl.querySelectorAll('[data-gallery-img]');

  if (imgs.length === 0) return;

  // Exibe a primeira foto imediatamente
  imgs[0].classList.add('visible');

  // Troca de foto a cada 1.8s
  const galleryInterval = setInterval(() => {
    imgs[currentPhoto].classList.remove('visible');
    currentPhoto = (currentPhoto + 1) % imgs.length;
    imgs[currentPhoto].classList.add('visible');
  }, 1800);

  // Armazena o interval no elemento para limpeza posterior
  storyEl.dataset.galleryInterval = galleryInterval;

  // Limpa quando o story perder a classe 'active'
  // (observado via MutationObserver ou pelo clearInterval global)
  const observer = new MutationObserver(() => {
    if (!storyEl.classList.contains('active')) {
      clearInterval(galleryInterval);
      observer.disconnect();
    }
  });
  observer.observe(storyEl, { attributes: true, attributeFilter: ['class'] });
}

/**
 * closeRetro()
 * ────────────
 * Fecha a retrospectiva, limpa todos os timers
 * e volta para o formulário (resetado).
 */
function closeRetro() {
  // Para timers
  clearTimeout(storyTimer);
  clearInterval(progressInterval);

  // Para áudio (se ativo)
  const audio = document.getElementById('bg-audio');
  if (audio) { audio.pause(); audio.remove(); }

  // Esconde retrospectiva, mostra formulário
  retroSection.classList.add('hidden');
  formSection.classList.remove('hidden');

  // Reseta o formulário para o início
  resetForm();
}

/**
 * resetForm()
 * ───────────
 * Limpa todos os campos, volta para a etapa 1 e
 * reseta o estado global.
 */
function resetForm() {
  // Limpa campos
  ['gifter-name','mom-name','mom-nickname','years-together',
   'mom-phrase','best-food','best-memory','hobbies','traditions',
   'qualities','dedication'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });

  // Reseta radios
  document.querySelectorAll('input[name="gender"]').forEach(r => r.checked = false);

  // Reseta previews de foto
  [1,2,3,4,5].forEach(i => {
    const prev = document.getElementById(`preview-${i}`);
    if (prev) {
      prev.classList.remove('has-image');
      const icons = [
        ['👶','Foto de infância'],
        ['👨‍👩‍👧','Foto em família'],
        ['📸','Foto recente'],
        ['😂','Momento engraçado'],
        ['💝','Foto especial']
      ];
      prev.innerHTML = `<span class="photo-icon">${icons[i-1][0]}</span><span class="photo-text">${icons[i-1][1]}</span>`;
    }
    const input = document.getElementById(`photo-${i}`);
    if (input) input.value = '';
  });

  // Reseta estado
  Object.assign(state, {
    gifterName: '', gender: '', momName: '', momNickname: '',
    yearsTogether: 0, momPhrase: '', bestFood: '', bestMemory: '',
    hobbies: '', traditions: '', qualities: '', dedication: '',
    photos: [null, null, null, null, null],
  });
  window.genderChoice = '';

  // Mostra step 1, esconde os demais
  document.querySelectorAll('.step').forEach((el, i) => {
    if (i === 0) el.classList.remove('hidden');
    else         el.classList.add('hidden');
  });

  currentStep = 1;
  updateFormUI();

  // Limpa stories do DOM
  storiesContainer.innerHTML   = '';
  storiesProgressEl.innerHTML  = '';
}


/* ════════════════════════════════════════════
   4. UTILITÁRIOS
   ════════════════════════════════════════════ */

/**
 * escapeHtml(str)
 * ───────────────
 * Escapa caracteres especiais HTML para evitar XSS
 * ao inserir dados do usuário no innerHTML.
 */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&#39;');
}

/**
 * generateGift()
 * ──────────────
 * Gera um resumo do presente personalizado para compartilhar via WhatsApp
 * ou outras plataformas de mensagem.
 */
function generateGift() {
  const { momName, momNickname, gifterName, yearsTogether, momPhrase,
          bestFood, bestMemory, hobbies, traditions, qualities, dedication } = state;

  // Cria uma mensagem formatada para WhatsApp
  const message = `*🎁 PRESENTE ESPECIAL PARA ${momName.toUpperCase()} 🎁*

Oi ${momNickname}! 👋

Preparei algo muito especial para você neste Dia das Mães! 💝

*Uma retrospectiva personalizada com:*
📅 ${yearsTogether} anos de amor e história
💬 Sempre dizendo: "${momPhrase}"
🍽️ Adorando comer: ${bestFood}
🌟 Nossa melhor memória: ${bestMemory}
🎨 Amando: ${hobbies}
🏡 Nossas tradições: ${traditions}
👑 Sua maior força: ${qualities}

💌 *Minha dedicatória para você:*
"${dedication}"

❤️ Com todo o meu amor,
${gifterName}

*Para ver a retrospectiva completa com fotos e música personalizada, acesse:*
[LINK DO SITE AQUI]

#DiaDasMães #PresenteEspecial #Mamãe`;

  // Codifica a mensagem para URL
  const encodedMessage = encodeURIComponent(message);

  // Cria link do WhatsApp
  const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;

  // Abre o WhatsApp com a mensagem
  window.open(whatsappUrl, '_blank');
}


/* ════════════════════════════════════════════
   5. INTEGRAÇÃO MERCADO PAGO E CHECKOUT
   ════════════════════════════════════════════ */

let mp = null;
let brickController = null;
let metodoPagamento = 'cartao';

// Inicializa Mercado Pago SDK com a chave real do servidor
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const res = await fetch('/api/mp-public-key');
    const data = await res.json();
    if (data.publicKey) {
      mp = new MercadoPago(data.publicKey, { locale: 'pt-BR' });
      console.log('MercadoPago SDK inicializado com sucesso');
    } else {
      console.warn('MP Public Key não configurada');
    }
  } catch(e) {
    console.warn('MercadoPago SDK falhou ao iniciar:', e);
  }
});

async function abrirModal() {
  document.getElementById('overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
  
  // Salva no banco e pega o ID para o link
  await salvarRetrospectiva();
  
  document.getElementById('pix-area-gerar').style.display = 'block';
  document.getElementById('pix-area-pagamento').style.display = 'none';
  const btnPix = document.getElementById('btn-gerar-pix');
  if (btnPix) { btnPix.textContent = 'Gerar Código Pix Seguro'; btnPix.disabled = false; }
  
  selecionarPagamento('pix');
}

function fecharModal() {
  document.getElementById('overlay').classList.remove('open');
  document.body.style.overflow = '';
  if (brickController) { brickController.unmount(); brickController = null; }
  
  // Se o pagamento não foi concluído e o modal fechou, pausamos o áudio da retro
  const audio = document.getElementById('bg-audio');
  if (audio && !state.unlocked) audio.pause();
}

function fecharSeClicarFora(e) { 
  if (e.target === document.getElementById('overlay')) fecharModal(); 
}

function selecionarPagamento(metodo) {
  state.paymentMethod = metodo;

  document.getElementById('opt-cartao').classList.toggle('sel', metodo === 'cartao');
  document.getElementById('opt-pix').classList.toggle('sel', metodo === 'pix');
  
  const camposCartao = document.getElementById('campos-cartao');
  const camposPix = document.getElementById('campos-pix');
  
  camposCartao.style.display = metodo === 'cartao' ? 'block' : 'none';
  camposPix.style.display = metodo === 'pix' ? 'block' : 'none';
  
  if (metodo === 'cartao' && mp) renderizarBrickCartao();
}

function selecionarTier(tier, price) {
  state.selectedTier = tier;
  state.selectedPrice = price;
  
  document.querySelectorAll('.tier-card').forEach(el => el.classList.remove('selected'));
  document.getElementById(`tier-${tier}`).classList.add('selected');

  const pixValDisplay = document.getElementById('pix-val-display');
  if (pixValDisplay) pixValDisplay.textContent = 'R$ ' + price.toFixed(2).replace('.', ',');
  
  if (brickController) {
    brickController.unmount();
    brickController = null;
  }
  if (state.paymentMethod === 'cartao') {
    renderizarBrickCartao();
  }

  // DOWNSELL: Se escolheu o plano básico, mostra a oferta de R$ 19,90 imediatamente
  if (tier === 'complete' && !state.downsellShown) {
    state.downsellShown = true;
    mostrarDownsell();
  }
}

// ── LÓGICA DE DOWNSELL ──
function mostrarDownsell() {
  document.getElementById('downsell-overlay').style.display = 'flex';
}

function fecharDownsell() {
  document.getElementById('downsell-overlay').style.display = 'none';
}

function aceitarDownsell() {
  fecharDownsell();
  // Altera para o plano vitalício com o NOVO ID do pack de desconto
  state.selectedTier = 'lifetime_downsell';
  state.selectedPrice = 19.90;
  
  document.querySelectorAll('.tier-card').forEach(el => el.classList.remove('selected'));
  document.getElementById(`tier-lifetime`).classList.add('selected');
  // Atualiza o preço visualmente
  const priceDisplay = document.querySelector('#tier-lifetime .tier-price');
  if (priceDisplay) priceDisplay.textContent = 'R$ 19,90';
  
  mostrarToast('🔥 Oferta ativada! Vitalício por R$ 19,90');
  
  const pixValDisplay = document.getElementById('pix-val-display');
  if (pixValDisplay) pixValDisplay.textContent = 'R$ 19,90';

  // Se o método for Pix, já gera automaticamente
  if (state.paymentMethod === 'pix') {
    gerarPix();
  } else if (state.paymentMethod === 'cartao') {
    if (brickController) { brickController.unmount(); brickController = null; }
    renderizarBrickCartao();
  }
}

function recusarDownsell() {
  fecharDownsell();
  // Mantém o plano de 14.90
  state.selectedTier = 'complete';
  state.selectedPrice = 14.90;
  
  document.querySelectorAll('.tier-card').forEach(el => el.classList.remove('selected'));
  document.getElementById(`tier-complete`).classList.add('selected');
  
  const pixValDisplay = document.getElementById('pix-val-display');
  if (pixValDisplay) pixValDisplay.textContent = 'R$ 14.90';

  if (brickController) { brickController.unmount(); brickController = null; }
  if (state.paymentMethod === 'cartao') renderizarBrickCartao();
}

async function renderizarBrickCartao() {
  if (brickController) return;
  if (!mp) {
    document.getElementById('cardPaymentBrick_container').innerHTML = '<p style="color:#7c3aed;font-size:.85rem;text-align:center;padding:16px">SDK de pagamento não disponível. Use o Pix.</p>';
    return;
  }
  
  const container = document.getElementById('cardPaymentBrick_container');
  container.innerHTML = '<div style="text-align:center;padding:20px;color:#999;font-size:.8rem">Carregando formulário seguro...</div>';

  try {
    const amountVal = state.selectedPrice || 19.90;
    const bricksBuilder = mp.bricks();
    brickController = await bricksBuilder.create('cardPayment', 'cardPaymentBrick_container', {
      initialization: {
        amount: amountVal,
        payer: { email: '' },
      },
      customization: {
        visual: { style: { theme: 'default' } },
        paymentMethods: { types: { included: ['credit_card', 'debit_card'] } },
      },
      callbacks: {
        onReady: () => { 
          console.log('CardPayment Brick pronto');
          // Remove a mensagem de carregamento ao carregar o brick
          const loadingMsg = container.querySelector('div[style*="text-align:center"]');
          if (loadingMsg) loadingMsg.remove();
        },
        onSubmit: async (cardFormData) => {
          try {
            mostrarToast('Processando pagamento...');
            const resp = await fetch('/api/processar-pagamento', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                packId: state.selectedTier || 'complete',
                token: cardFormData.token,
                email: cardFormData.payer.email,
                installments: cardFormData.installments,
                issuerId: cardFormData.issuer_id,
                paymentMethodId: cardFormData.payment_method_id,
                retroId: state.retroId // Link para desbloquear no banco
              }),
            });
            const result = await resp.json();
            if (result.status === 'aprovado') {
              mostrarToast('Pagamento aprovado! Desbloqueando...');
              sucessoPagamento();
            } else if (result.status === 'pendente') {
              mostrarToast('Pagamento pendente. Aguarde...');
            } else {
              mostrarToast('Pagamento recusado: ' + (result.detalhe || 'Tente outro cartão'));
            }
          } catch (err) {
            console.error(err);
            mostrarToast('Erro ao processar. Tente novamente.');
          }
        },
        onError: (err) => console.error('Brick error:', err),
      },
    });
  } catch (err) {
    console.error('Erro ao criar Brick:', err);
    container.innerHTML = '<p style="color:#7c3aed;font-size:.8rem;text-align:center;padding:12px">Erro ao carregar formulário. Tente o Pix.</p>';
  }
}

function copiarCopiaECola() {
  const input = document.getElementById('pix-copia-cola');
  input.select();
  navigator.clipboard.writeText(input.value).then(() => mostrarToast('Código Pix copiado!'));
}

async function gerarPix() {
  const email = document.getElementById('email-checkout').value;
  if (!email || !email.includes('@')) { 
    mostrarToast('Por favor, informe um e-mail válido para receber o presente.'); 
    document.getElementById('email-checkout').focus();
    return; 
  }
  
  const btn = document.getElementById('btn-pix');
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Gerando Pix...';
  }
  
  try {
    const resp = await fetch('/api/gerar-pix', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        packId: state.selectedTier || 'complete', 
        email,
        retroId: state.retroId // Link para desbloquear no banco
      }),
    });
    const data = await resp.json();

    
    if (data.erro) { mostrarToast(data.erro); btn.textContent = 'Gerar Código Pix Seguro'; btn.disabled = false; return; }
    
    document.getElementById('pix-area-gerar').style.display = 'none';
    document.getElementById('pix-area-pagamento').style.display = 'block';
    
    // QR Code
    const qrImg = document.getElementById('pix-qr');
    if (data.qrCodeBase64) { qrImg.src = 'data:image/png;base64,' + data.qrCodeBase64; qrImg.style.display = 'inline-block'; }
    
    // Copia e Cola
    document.getElementById('pix-copia-cola').value = data.qrCodeText || '';
    
    // Polling — verifica pagamento a cada 5s
    const paymentId = data.paymentId;
    let tentativas = 0;
    const pollInterval = setInterval(async () => {
      tentativas++;
      if (tentativas > 60) { clearInterval(pollInterval); return; } // max 5 min
      try {
        const check = await fetch(`/api/verificar-pagamento/${paymentId}`);
        const result = await check.json();
        if (result.status === 'aprovado') {
          clearInterval(pollInterval);
          mostrarToast('PIX confirmado! Desbloqueando...');
          sucessoPagamento();
        }
      } catch {}
    }, 5000);
    
  } catch (err) {
    console.error(err);
    mostrarToast('Erro ao gerar Pix. Tente novamente.');
    btn.textContent = 'Gerar Código Pix Seguro'; btn.disabled = false;
  }
}

async function baixarTudo() {
  mostrarToast('Gerando seu Arquivo de Recordação... 🎁');
  
  const { momNickname, photos, gifterName } = state;
  
  // Pegamos o CSS necessário (simplificado para o arquivo de saída)
  const css = Array.from(document.styleSheets)
    .filter(sheet => !sheet.href || sheet.href.includes(window.location.origin))
    .map(sheet => {
      try {
        return Array.from(sheet.cssRules).map(rule => rule.cssText).join('\n');
      } catch (e) { return ''; }
    }).join('\n');

  // Criamos o HTML do arquivo de recordação
  const storiesHTML = Array.from(storiesContainer.querySelectorAll('.story')).map(el => {
    // Clonamos para não afetar o original e limpamos classes de animação ativa
    const clone = el.cloneNode(true);
    clone.classList.remove('active');
    return clone.outerHTML;
  }).join('\n');

  const standaloneHTML = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Recordação: Para ${momNickname} 💝</title>
    <link href="https://fonts.googleapis.com/css2?family=Syne:wght@800;900&family=DM+Sans:wght@400;700&display=swap" rel="stylesheet">
    <style>
        ${css}
        body { background: #000; margin: 0; }
        #retro-section { display: block !important; position: relative; height: 100vh; width: 100vw; }
        .btn-close-retro, .retro-preview-overlay, .btn-download-story { display: none !important; }
        @media(min-width: 1024px) {
          .stories-container { max-width: 450px; margin: 0 auto; left: 50%; transform: translateX(-50%); }
        }
    </style>
</head>
<body>
    <div id="retro-section">
        <div class="stories-progress" id="stories-progress"></div>
        <div class="stories-container" id="stories-container">
            ${storiesHTML}
        </div>
        <div class="touch-zone touch-left" id="touch-left"></div>
        <div class="touch-zone touch-right" id="touch-right"></div>
    </div>

    <script>
        // Dados injetados
        const state = ${JSON.stringify({ ...state, unlocked: true })};
        
        // Versão ultra-leve do motor de stories para o arquivo offline
        let activeStoryIndex = 0;
        let storyTimer = null;
        const STORY_DURATION = 5000;

        function showStory(index) {
            const stories = document.querySelectorAll('.story');
            if (index < 0 || index >= stories.length) return;
            
            clearTimeout(storyTimer);
            stories.forEach(s => s.classList.remove('active'));
            stories[index].classList.add('active');
            
            activeStoryIndex = index;
            
            // Atualiza progresso simples
            const progress = document.getElementById('stories-progress');
            progress.innerHTML = '';
            for(let i=0; i<stories.length; i++) {
                const seg = document.createElement('div');
                seg.className = 'progress-segment ' + (i < index ? 'done' : (i === index ? 'active' : ''));
                const fill = document.createElement('div');
                fill.className = 'progress-segment-fill';
                fill.style.width = i < index ? '100%' : (i === index ? '0%' : '0%');
                seg.appendChild(fill);
                progress.appendChild(seg);
                if(i === index) {
                    setTimeout(() => fill.style.transition = 'width 5s linear', 10);
                    setTimeout(() => fill.style.width = '100%', 50);
                }
            }

            storyTimer = setTimeout(() => {
                if (activeStoryIndex < stories.length - 1) showStory(activeStoryIndex + 1);
            }, STORY_DURATION);
        }

        document.getElementById('touch-right').onclick = () => showStory(activeStoryIndex + 1);
        document.getElementById('touch-left').onclick = () => showStory(activeStoryIndex - 1);
        
        window.onload = () => showStory(0);
    <\/script>
</body>
</html>`;

  // Download do arquivo
  const blob = new Blob([standaloneHTML], { type: 'text/html' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Retrospectiva_${momNickname}_Recordacao.html`;
  a.click();

  mostrarToast('Pronto! Você agora tem a retrospectiva para sempre. ❤️');
}

function sucessoPagamento() {
  console.log('Sucesso no pagamento! Desbloqueando conteúdo...');
  fecharModal();
  
  state.unlocked = true;
  state.unlockedTier = state.selectedTier;
  
  // Esconde o overlay de preview e garante que a seção de retro está visível
  const previewOverlay = document.getElementById('retro-preview-overlay');
  if (previewOverlay) previewOverlay.classList.add('hidden');
  
  const retroSection = document.getElementById('retro-section');
  if (retroSection) retroSection.style.display = 'block';

  // Tenta tocar o áudio com volume alto
  const audio = document.getElementById('bg-audio');
  if (audio) {
    audio.volume = 1.0;
    audio.play().catch(e => console.log('Erro ao tocar áudio:', e));
  }
  
  // Mostrar o botão de compartilhar que agora está no HTML
  const shareBtnContainer = document.getElementById('share-btn-container');
  if (shareBtnContainer) shareBtnContainer.classList.remove('hidden');

  // Adiciona o evento de clique ao botão estático
  const mainShareBtn = document.getElementById('main-share-btn');
  if (mainShareBtn) {
    mainShareBtn.onclick = compartilhar;
  }

  // Garantir que o ID esteja salvo localmente para o link
  if (state.retroId) localStorage.setItem('last_retro_id', state.retroId);

  atualizarLinkCompartilhar();

  // Forçar a reconstrução dos stories para garantir que apareçam
  const storiesData = buildStoriesData();
  renderStories(storiesData);
  showStory(activeStoryIndex);
}

/**
 * compartilhar()
 * ──────────────
 * Abre o WhatsApp diretamente com uma mensagem personalizada.
 */
function compartilhar() {
  const { momNickname, gifterName } = state;
  // Prioridade: ID do estado, senão ID do localStorage
  let retroId = state.retroId || localStorage.getItem('last_retro_id');
  
  const siteUrl = window.location.origin;
  
  // O link agora é a URL única da retrospectiva no banco
  const linkRetro = retroId ? `${siteUrl}/retro/${retroId}` : siteUrl;
  
  const mensagem = `💝 *PARA A MELHOR MÃE DO MUNDO* 💝\n\n` +
    `Oi${momNickname ? ', ' + momNickname : ''}! 🌸\n\n` +
    `Eu preparei um presente muito especial para você! É uma retrospectiva com a nossa história e todo o meu amor em fotos e música. ✨\n\n` +
    `Acesse agora para ver a sua surpresa:\n${linkRetro}\n\n` +
    `Com amor, ${gifterName || 'seu filho(a)'} ❤️`;

  const urlWhatsApp = `https://wa.me/?text=${encodeURIComponent(mensagem)}`;
  window.open(urlWhatsApp, '_blank');
}

// Expõe globalmente para o onclick do botão injetado
window.compartilhar = compartilhar;

function atualizarLinkCompartilhar() {
  // Se estivermos em modo de visualização (mãe acessando), não mostramos botão de compartilhar
  const btn = document.getElementById('share-btn-container');
  if (window.RETRO_DATA && btn) {
     btn.style.display = 'none';
  }
}

async function salvarRetrospectiva() {
  // Só salva se ainda não temos ID (ou se quisermos atualizar, mas vamos focar no insert inicial)
  if (state.retroId) return state.retroId;

  try {
    const resp = await fetch('/api/salvar-retro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gifter_name:   state.gifterName,
        gender:         state.gender,
        mom_name:      state.momName,
        mom_nickname:  state.momNickname,
        years_together: state.yearsTogether,
        mom_phrase:    state.momPhrase,
        best_food:     state.bestFood,
        best_memory:   state.bestMemory,
        hobbies:       state.hobbies,
        traditions:    state.traditions,
        qualities:     state.qualities,
        photos:        state.photos,
        dedication:    state.dedication
      })
    });
    const result = await resp.json();
    if (result.success) {
      state.retroId = result.id;
      console.log('Retro salva no banco com ID:', state.retroId);
      return result.id;
    }
  } catch (err) {
    console.error('Falha ao salvar retro:', err);
  }
  return null;
}

function mostrarToast(msg) {
  const t = document.getElementById('toast'); 
  t.textContent = msg; 
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

// ══ COUNTDOWN TIMER ══
function initCountdown() {
  const targetDate = new Date('2026-05-11T00:00:00').getTime(); // Dia das Mães 2026 (10/05)
  const timerEl = document.getElementById('countdown-timer');
  if (!timerEl) return;

  function update() {
    const now = new Date().getTime();
    const diff = targetDate - now;

    if (diff <= 0) {
      timerEl.parentElement.innerHTML = "É HOJE! Feliz Dia das Mães! 💝";
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    timerEl.textContent = `${days}d ${hours}h ${minutes}m ${seconds}s`;
  }

  update();
  setInterval(update, 1000);
}

function irParaForm() { 
  formSection.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  document.getElementById('step-1').scrollIntoView({ behavior: 'smooth' }); 
}

/**
 * gerarRecordacao(e)
 * ─────────────────
 * Chamada ao final do formulário. Salva os dados e inicia a PRÉVIA.
 */
async function gerarRecordacao(e) {
  if (e) e.preventDefault(); // MATA O REFRESH
  
  const btn = document.querySelector('.btn-submit');
  if (btn) {
    btn.disabled = true;
    btn.innerText = 'Gerando sua surpresa...';
  }

  try {
    // 1. Salva no Supabase e pega o ID
    const retroId = await salvarRetrospectiva();
    if (!retroId) throw new Error('Falha ao salvar no banco');

    // 2. Constrói os stories com os dados reais
    const storiesData = buildStoriesData();
    
    // 3. Renderiza no container
    renderStories(storiesData);
    
    // LIMPEZA TOTAL DA TELA
    document.querySelector('.hero').style.display = 'none';
    document.querySelector('.site-header').style.display = 'none';
    if(document.querySelector('.how-it-works')) document.querySelector('.how-it-works').style.display = 'none';
    if(document.querySelector('.cta-final')) document.querySelector('.cta-final').style.display = 'none';
    document.querySelector('.site-footer').style.display = 'none';
    
    // 4. Exibe a seção de retrospectiva em tela cheia
    const retroSection = document.getElementById('retro-section');
    retroSection.style.display = 'block';
    retroSection.classList.remove('hidden');
    retroSection.style.position = 'fixed';
    retroSection.style.top = '0';
    retroSection.style.left = '0';
    retroSection.style.zIndex = '999999';
    
    // 5. Esconde o resto do site e o formulário
    document.body.classList.add('retro-view-mode');
    formSection.classList.add('hidden');
    
    // 6. Inicia o motor da retrospectiva
    initRetro();
    
    // 7. Rola para o topo e toca a música de prévia
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const audio = document.getElementById('bg-audio');
    if (audio) {
       audio.src = (state.gender === 'feminino') ? 'audio/mulher.mp3' : 'audio/homem.mp3';
       audio.play().catch(() => {});
    }

    // 8. Abre o checkout após alguns segundos de "Uau"
    setTimeout(() => {
        abrirModal();
    }, 15000);

  } catch (error) {
    console.error('Erro ao gerar:', error);
    mostrarToast('Erro ao salvar. Verifique sua conexão.');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerText = 'Gerar Recordação Especial';
    }
  }
}

// Expõe globalmente para o formulário
window.gerarRecordacao = gerarRecordacao;

// Inicializa tudo ao carregar
document.addEventListener('DOMContentLoaded', () => {
  initCountdown();
  
  // Modo de visualização da mãe (Link Único)
  if (window.RETRO_DATA) {
    console.log('Modo Mãe: Iniciando presente...');
    document.body.classList.add('retro-view-mode');
    const storiesData = buildStoriesData();
    renderStories(storiesData);
    if (state.unlocked) {
       const audio = document.getElementById('bg-audio');
       if (audio) {
         audio.src = (state.gender === 'feminino') ? 'audio/mulher.mp3' : 'audio/homem.mp3';
         audio.play().catch(() => {});
       }
       initRetro();
    }
    return;
  }

  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('pagamento') === 'sucesso') {
    sucessoPagamento();
  }
});
