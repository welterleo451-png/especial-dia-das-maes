// ═══════════════════════════════════════════
// OVERRIDE: Player real + PDF fix + countdown
// Este arquivo é carregado APÓS o script principal
// ═══════════════════════════════════════════

// --- Fix countdown para 2026 ---
(function() {
  function tickFix() {
    const alvo = new Date('2026-05-10T00:00:00');
    const agora = new Date();
    const diff = alvo - agora;
    if (diff <= 0) return;
    const pad = x => String(x).padStart(2, '0');
    document.getElementById('days').textContent = pad(Math.floor(diff / 864e5));
    document.getElementById('hours').textContent = pad(Math.floor(diff % 864e5 / 36e5));
    document.getElementById('mins').textContent = pad(Math.floor(diff % 36e5 / 6e4));
    document.getElementById('secs').textContent = pad(Math.floor(diff % 6e4 / 1e3));
  }
  tickFix();
  setInterval(tickFix, 1000);
})();

// --- Override mostrarEntregaDemo para incluir mp3Url e letra real ---
window._originalMostrarEntregaDemo = window.mostrarEntregaDemo;
window.mostrarEntregaDemo = function() {
  const pack = window.packAtual;
  window.renderizarEntregaReal({
    pack: { ico: pack.ico, nome: pack.nome },
    faixas: (pack.faixas || []).map(f => ({
      nome: f.nome,
      genero: f.genero,
      mp3Url: f.mp3Url || f.previaUrl || null,
      letra: f.letra || 'Letra completa de "' + f.nome + '"',
    })),
  });
};

// --- Override mostrarEntrega para usar renderizarEntregaReal ---
window._originalMostrarEntrega = window.mostrarEntrega;
window.mostrarEntrega = async function(token) {
  try {
    const res = await fetch((window.CONFIG ? CONFIG.API_URL : '') + '/api/acesso', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: token }),
    });
    const dados = await res.json();
    if (dados.faixas) window.renderizarEntregaReal(dados);
    else window.mostrarEntregaDemo();
  } catch(e) {
    window.mostrarEntregaDemo();
  }
};

// --- Novo renderizarEntrega com player real ---
window._audioTracks = {};
window._audioFaixas = [];

window.renderizarEntregaReal = function(dados) {
  document.getElementById('d-pack-nome').textContent = (dados.pack.ico || '') + ' ' + dados.pack.nome;
  const c = document.getElementById('d-faixas');
  window._audioTracks = {};
  window._audioFaixas = dados.faixas;

  let html = '';
  dados.faixas.forEach(function(f, i) {
    const id = 'da' + i;
    window._audioTracks[id] = f.mp3Url || '';
    html += '<div class="d-track">';
    html += '<div class="d-track-head">';
    html += '<div class="d-num">' + (i+1) + '</div>';
    html += '<div class="d-tname">' + f.nome + '</div>';
    html += '<div class="d-genre">' + f.genero + '</div>';
    html += '</div>';
    html += '<div class="d-player">';
    html += '<button class="d-playbtn" data-track="' + id + '" onclick="window.toggleAudio(this,\'' + id + '\')">';
    html += '<svg width="11" height="12" viewBox="0 0 11 12"><polygon points="1,1 10,6 1,11" fill="white"/></svg>';
    html += '</button>';
    html += '<div class="d-prog" onclick="window.seekAudio(event,\'' + id + '\')"><div class="d-progfill" id="dpb-' + id + '"></div></div>';
    html += '<div class="d-time" id="dtl-' + id + '">--:--</div>';
    html += '</div>';
    html += '<div class="d-actions">';
    html += '<button class="d-btn d-btn-dl" onclick="window.dlMP3(' + i + ')">⬇ Baixar MP3</button>';
    html += '<button class="d-btn d-btn-pdf" onclick="window.dlPDF(' + i + ')">📄 Letra em PDF</button>';
    html += '</div></div>';
  });
  c.innerHTML = html;

  document.getElementById('tela-entrega').classList.add('open');
  window.scrollTo(0, 0);
};

// --- Player de áudio real ---
window._audioPlayers = {};
window._curAudio = null;

window.toggleAudio = function(btn, id) {
  if (window._curAudio && window._curAudio !== id) {
    window.stopAudio(window._curAudio);
  }
  const player = window._audioPlayers[id];
  if (player && player.playing) {
    window.stopAudio(id);
  } else {
    window.playAudio(btn, id);
  }
};

window.playAudio = function(btn, id) {
  if (!window._audioPlayers[id]) {
    const url = window._audioTracks[id];
    if (!url) {
      if (typeof mostrarToast === 'function') mostrarToast('MP3 não disponível ainda');
      return;
    }
    const audio = new Audio(url);
    window._audioPlayers[id] = { audio: audio, playing: false };

    audio.addEventListener('timeupdate', function() {
      const pb = document.getElementById('dpb-' + id);
      const tl = document.getElementById('dtl-' + id);
      if (audio.duration && pb) {
        pb.style.width = (audio.currentTime / audio.duration * 100) + '%';
      }
      if (tl) {
        const remaining = Math.max(0, Math.floor((audio.duration || 0) - audio.currentTime));
        const mins = Math.floor(remaining / 60);
        const secs = remaining % 60;
        tl.textContent = mins + ':' + String(secs).padStart(2, '0');
      }
    });

    audio.addEventListener('loadedmetadata', function() {
      const tl = document.getElementById('dtl-' + id);
      if (tl) {
        const dur = Math.floor(audio.duration);
        const mins = Math.floor(dur / 60);
        const secs = dur % 60;
        tl.textContent = mins + ':' + String(secs).padStart(2, '0');
      }
    });

    audio.addEventListener('ended', function() {
      window.stopAudio(id);
    });
  }

  const player = window._audioPlayers[id];
  player.playing = true;
  window._curAudio = id;
  player.audio.play().catch(function() {
    if (typeof mostrarToast === 'function') mostrarToast('Erro ao reproduzir. Tente baixar o MP3.');
  });
  btn.innerHTML = '<svg width="9" height="10" viewBox="0 0 9 10"><rect x="0" y="0" width="3" height="10" rx="1" fill="white"/><rect x="5" y="0" width="3" height="10" rx="1" fill="white"/></svg>';
};

window.stopAudio = function(id) {
  const player = window._audioPlayers[id];
  if (!player) return;
  player.playing = false;
  player.audio.pause();
  const btn = document.querySelector('[data-track="' + id + '"]');
  if (btn) {
    btn.innerHTML = '<svg width="11" height="12" viewBox="0 0 11 12"><polygon points="1,1 10,6 1,11" fill="white"/></svg>';
  }
};

window.seekAudio = function(event, id) {
  const player = window._audioPlayers[id];
  if (!player || !player.audio || !player.audio.duration) return;
  const rect = event.currentTarget.getBoundingClientRect();
  const pct = (event.clientX - rect.left) / rect.width;
  player.audio.currentTime = pct * player.audio.duration;
};

// --- Download MP3 ---
window.dlMP3 = function(idx) {
  const f = window._audioFaixas[idx];
  if (!f) return;
  const url = f.mp3Url;
  if (url) {
    const a = document.createElement('a');
    a.href = url;
    a.download = f.nome + '.mp3';
    a.target = '_blank';
    a.click();
  } else {
    if (typeof mostrarToast === 'function') mostrarToast('MP3 não disponível ainda');
  }
};

// --- Gerar PDF com letra ---
window.dlPDF = function(idx) {
  const f = window._audioFaixas[idx];
  if (!f) return;
  const nome = f.nome;
  const genero = f.genero;
  const letra = f.letra || '';
  const w = window.open('', '_blank');
  if (!w) return;
  const html = '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">' +
    '<style>' +
    'body{font-family:Georgia,serif;max-width:520px;margin:56px auto;color:#1e1014;line-height:1.8;padding:0 20px}' +
    'h1{color:#8b1a3a;font-size:1.75rem;margin-bottom:3px}' +
    'h2{color:#c0395f;font-size:.95rem;font-style:italic;font-weight:normal;margin-bottom:22px}' +
    'pre{white-space:pre-wrap;font-family:Georgia,serif;font-size:.95rem;line-height:1.85;color:#3a2028}' +
    '.lbl{font-size:.7rem;letter-spacing:2px;text-transform:uppercase;color:#c9a84c;margin-bottom:5px}' +
    '.rod{margin-top:36px;font-size:.7rem;color:#bbb;text-align:center;border-top:1px solid #f0d5e0;padding-top:10px}' +
    '</style></head><body>' +
    '<div class="lbl">Uma Canção Para Sua Mãe 🌸</div>' +
    '<h1>' + nome + '</h1>' +
    '<h2>' + genero + '</h2>' +
    '<pre>' + letra + '</pre>' +
    '<div class="rod">Uma Canção Para Sua Mãe · Feliz Dia das Mães! 🌸</div>' +
    '<scr' + 'ipt>setTimeout(function(){window.print()},500)<\/scr' + 'ipt>' +
    '</body></html>';
  w.document.write(html);
  w.document.close();
};
