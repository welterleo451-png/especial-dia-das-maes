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
  selectedTier: 'complete',
  selectedPrice: 19.90,
  unlockedTier: '',
};

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
btnNext.addEventListener('click', () => {
  if (!validateStep(currentStep)) return;

  if (currentStep < TOTAL_STEPS) {
    goToStep(currentStep + 1, 'forward');
  } else {
    // Última etapa → coleta dados e inicia a retrospectiva
    collectFormData();
    launchRetro();
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

  // ── ÁUDIO ──────────────────────────────────────────────────────────
  let audio = document.getElementById('bg-audio');
  if (!audio) {
    audio = document.createElement('audio');
    audio.id = 'bg-audio';
    audio.loop = true;
    document.body.appendChild(audio);
  }
  audio.src = (state.gender === 'masculino') ? 'audio/homem.mp3' : 'audio/mulher.mp3';
  audio.play().catch(e => console.log("Erro ao iniciar áudio:", e));
  // ─────────────────────────────────────────────────────────────────────


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
            <button class="btn-unlock" onclick="compartilhar()" style="background: #fff; color: #ff3cac; box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
              🔗 Compartilhar Presente
            </button>
            
            ${state.unlockedTier === 'lifetime' ? `
              <button class="btn-download-story" onclick="baixarTudo()">
                📥 Baixar Fotos e Mensagem
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

function abrirModal() {
  document.getElementById('overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
  
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
  metodoPagamento = metodo;
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
  if (metodoPagamento === 'cartao') {
    renderizarBrickCartao();
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
  // Altera para o plano vitalício com preço promocional
  state.selectedTier = 'lifetime';
  state.selectedPrice = 19.90;
  
  document.querySelectorAll('.tier-card').forEach(el => el.classList.remove('selected'));
  document.getElementById(`tier-lifetime`).classList.add('selected');
  // Atualiza o texto do preço no card de forma visual para o usuário ver o desconto
  document.querySelector('#tier-lifetime .tier-price').textContent = 'R$ 19,90';
  
  mostrarToast('🔥 Oferta ativada! Vitalício por R$ 19,90');
  
  const pixValDisplay = document.getElementById('pix-val-display');
  if (pixValDisplay) pixValDisplay.textContent = 'R$ 19,90';

  if (brickController) { brickController.unmount(); brickController = null; }
  if (metodoPagamento === 'cartao') renderizarBrickCartao();
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
  if (metodoPagamento === 'cartao') renderizarBrickCartao();
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
          // DISPARAR DOWNSELL (Cartão): Se estiver no plano de 14.90 e ainda não viu a oferta
          if (state.selectedTier === 'complete' && state.selectedPrice === 14.90 && !state.downsellShown) {
            state.downsellShown = true;
            mostrarDownsell();
            return;
          }

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
  // GATILHO DE DOWNSELL: Intercepta o pagamento se for o plano de 14,90
  const isBasico = state.selectedTier === 'complete' && (state.selectedPrice >= 14.80 && state.selectedPrice <= 15.00);

  if (isBasico && !state.downsellShown) {
    state.downsellShown = true;
    mostrarDownsell();
    return;
  }

  const email = document.getElementById('email-checkout').value;
  if (!email || !email.includes('@')) { mostrarToast('Preencha um e-mail válido.'); return; }
  
  const btn = document.getElementById('btn-pix');
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Gerando Pix...';
  }
  
  try {
    const resp = await fetch('/api/gerar-pix', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ packId: state.selectedTier || 'complete', email }),
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
  fecharModal();
  state.unlocked = true;
  state.unlockedTier = state.selectedTier;
  document.getElementById('retro-preview-overlay').classList.add('hidden');
  
  const audio = document.getElementById('bg-audio');
  if (audio) audio.play();
  
  // Recriar os stories para atualizar os botões finais
  const stories = buildStoriesData();
  renderStories(stories);
  
  // Injetar botão de compartilhar flutuante para garantir que apareça
  const shareBtnContainer = document.createElement('div');
  shareBtnContainer.style.cssText = 'position:fixed; bottom:20px; left:50%; transform:translateX(-50%); z-index:9999; width:90%; max-width:400px;';
  shareBtnContainer.innerHTML = `
    <button onclick="compartilhar()" style="width:100%; padding:18px; background:#25D366; color:#fff; border-radius:50px; border:none; font-weight:bold; font-size:1.1rem; box-shadow:0 10px 25px rgba(0,0,0,0.3); display:flex; align-items:center; justify-content:center; gap:10px;">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .004 5.412 0 12.048c0 2.12.554 4.189 1.605 6.04L0 24l6.117-1.605a11.79 11.79 0 005.925 1.585h.005c6.637 0 12.046-5.412 12.05-12.048a11.825 11.825 0 00-3.576-8.514z"/></svg>
      Enviar para o WhatsApp
    </button>
  `;
  document.body.appendChild(shareBtnContainer);
  
  // Volta para onde parou para continuar assistindo
  showStory(activeStoryIndex);
}

/**
 * compartilhar()
 * ──────────────
 * Usa a Web Share API se disponível, senão copia para o clipboard.
 */
async function compartilhar() {
  const { momNickname, gifterName } = state;
  const shareData = {
    title: `Presente Especial para ${momNickname} 💝`,
    text: `Oi ${momNickname}! O ${gifterName} preparou uma surpresa inesquecível para você. Veja agora:`,
    url: window.location.origin // Idealmente seria um link único salvo no banco
  };

  try {
    if (navigator.share) {
      await navigator.share(shareData);
    } else {
      await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
      mostrarToast('Link copiado para o WhatsApp! ✅');
    }
  } catch (err) {
    console.error('Erro ao compartilhar:', err);
  }
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

// Inicializa tudo ao carregar
document.addEventListener('DOMContentLoaded', () => {
  initCountdown();
});

function irParaForm() { abrirForm(); document.getElementById('form-section').scrollIntoView({ behavior: 'smooth' }); }
