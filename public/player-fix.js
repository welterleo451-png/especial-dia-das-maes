// ═══════════════════════════════════════════
// CORREÇÕES: countdown 2026 + player real + PDF fix
// Carregado APÓS o script principal do index.html
// ═══════════════════════════════════════════

// --- 1. FIX COUNTDOWN para 2026 ---
(function fixCountdown() {
  function tick2026() {
    var alvo = new Date('2026-05-10T00:00:00');
    var agora = new Date();
    var diff = alvo - agora;
    if (diff <= 0) return;
    function pad(x) { return String(x).padStart(2, '0'); }
    document.getElementById('days').textContent = pad(Math.floor(diff / 864e5));
    document.getElementById('hours').textContent = pad(Math.floor(diff % 864e5 / 36e5));
    document.getElementById('mins').textContent = pad(Math.floor(diff % 36e5 / 6e4));
    document.getElementById('secs').textContent = pad(Math.floor(diff % 6e4 / 1e3));
  }
  tick2026();
  setInterval(tick2026, 1000);
})();

// --- 2. GLOBAL STORAGE para dados de entrega ---
var _tracks = {};
var _faixas = [];
var _audioPlayers = {};
var _curAudioId = null;

// --- 3. OVERRIDE: mostrarEntregaDemo ---
// O original usa `packAtual` que é `let` (não acessível via window)
// Então interceptamos a chamada reescrevendo confirmarPix
(function overrideConfirmarPix() {
  // Salva referência ao botão
  var pixBtn = document.getElementById('btn-pix-pago');
  if (!pixBtn) return;

  // Remove onclick original e adiciona o nosso
  pixBtn.removeAttribute('onclick');
  pixBtn.addEventListener('click', function() {
    pixBtn.textContent = 'Verificando...';
    pixBtn.disabled = true;

    setTimeout(function() {
      // Pega packAtual do escopo global (funciona porque function declarations são globais)
      var packId = document.getElementById('m-nome').textContent;
      var packIco = document.getElementById('m-ico').textContent;

      // Fecha modal
      document.getElementById('overlay').classList.remove('open');
      document.body.style.overflow = '';

      // Busca dados do pack da API
      fetch('/api/packs')
        .then(function(r) { return r.json(); })
        .then(function(packs) {
          // Encontra o pack pelo nome
          var pack = null;
          for (var i = 0; i < packs.length; i++) {
            if (packs[i].nome === packId) { pack = packs[i]; break; }
          }
          if (!pack) pack = packs[0]; // fallback

          renderEntregaReal({
            pack: { ico: pack.ico, nome: pack.nome },
            faixas: pack.faixas.map(function(f) {
              return {
                nome: f.nome,
                genero: f.genero,
                mp3Url: f.mp3Url || f.previaUrl || null,
                letra: f.letra || 'Letra de "' + f.nome + '"'
              };
            })
          });
        })
        .catch(function() {
          // Fallback: mostra mensagem
          document.getElementById('tela-entrega').classList.add('open');
          document.getElementById('d-pack-nome').textContent = packIco + ' ' + packId;
          document.getElementById('d-faixas').innerHTML = '<p style="text-align:center;padding:20px;color:#7a5060">Músicas carregando... Recarregue a página.</p>';
        });

      pixBtn.textContent = '✅ Já Fiz o Pix — Liberar Acesso';
      pixBtn.disabled = false;
    }, 1500);
  });
})();

// --- 4. RENDERIZAR ENTREGA com player real ---
function renderEntregaReal(dados) {
  document.getElementById('d-pack-nome').textContent = (dados.pack.ico || '') + ' ' + dados.pack.nome;
  var c = document.getElementById('d-faixas');
  _tracks = {};
  _faixas = dados.faixas;
  _audioPlayers = {};
  _curAudioId = null;

  var html = '';
  for (var i = 0; i < dados.faixas.length; i++) {
    var f = dados.faixas[i];
    var id = 'trk' + i;
    _tracks[id] = f.mp3Url || '';

    html += '<div class="d-track">';
    html += '<div class="d-track-head">';
    html += '<div class="d-num">' + (i + 1) + '</div>';
    html += '<div class="d-tname">' + f.nome + '</div>';
    html += '<div class="d-genre">' + f.genero + '</div>';
    html += '</div>';
    html += '<div class="d-player">';
    html += '<button class="d-playbtn" data-tid="' + id + '" onclick="playToggle(\'' + id + '\',this)">';
    html += '<svg width="11" height="12" viewBox="0 0 11 12"><polygon points="1,1 10,6 1,11" fill="white"/></svg>';
    html += '</button>';
    html += '<div class="d-prog" onclick="audioSeek(event,\'' + id + '\')"><div class="d-progfill" id="bar-' + id + '"></div></div>';
    html += '<div class="d-time" id="tm-' + id + '">--:--</div>';
    html += '</div>';
    html += '<div class="d-actions">';
    html += '<button class="d-btn d-btn-dl" onclick="dlTrack(' + i + ')">⬇ Baixar MP3</button>';
    html += '<button class="d-btn d-btn-pdf" onclick="dlLetra(' + i + ')">📄 Letra em PDF</button>';
    html += '</div>';
    html += '</div>';
  }
  c.innerHTML = html;
  document.getElementById('tela-entrega').classList.add('open');
  window.scrollTo(0, 0);
}

// --- 5. PLAYER DE ÁUDIO REAL ---
function playToggle(id, btn) {
  // Parar outro que esteja tocando
  if (_curAudioId && _curAudioId !== id) {
    stopTrack(_curAudioId);
  }
  var player = _audioPlayers[id];
  if (player && player.playing) {
    stopTrack(id);
  } else {
    startTrack(id, btn);
  }
}

function startTrack(id, btn) {
  if (!_audioPlayers[id]) {
    var url = _tracks[id];
    if (!url) {
      showMsg('MP3 não disponível ainda');
      return;
    }
    var audio = new Audio(url);
    _audioPlayers[id] = { audio: audio, playing: false };

    audio.addEventListener('timeupdate', function() {
      var bar = document.getElementById('bar-' + id);
      var tm = document.getElementById('tm-' + id);
      if (audio.duration && bar) {
        bar.style.width = (audio.currentTime / audio.duration * 100) + '%';
      }
      if (tm) {
        var rem = Math.max(0, Math.floor((audio.duration || 0) - audio.currentTime));
        tm.textContent = Math.floor(rem / 60) + ':' + String(rem % 60).padStart(2, '0');
      }
    });

    audio.addEventListener('loadedmetadata', function() {
      var tm = document.getElementById('tm-' + id);
      if (tm) {
        var d = Math.floor(audio.duration);
        tm.textContent = Math.floor(d / 60) + ':' + String(d % 60).padStart(2, '0');
      }
    });

    audio.addEventListener('ended', function() {
      stopTrack(id);
    });
  }

  var p = _audioPlayers[id];
  p.playing = true;
  _curAudioId = id;
  p.audio.play().catch(function() {
    showMsg('Erro ao reproduzir. Tente baixar o MP3.');
  });
  // Mostrar ícone de pause
  btn.innerHTML = '<svg width="9" height="10" viewBox="0 0 9 10"><rect x="0" y="0" width="3" height="10" rx="1" fill="white"/><rect x="5" y="0" width="3" height="10" rx="1" fill="white"/></svg>';
}

function stopTrack(id) {
  var p = _audioPlayers[id];
  if (!p) return;
  p.playing = false;
  p.audio.pause();
  var btn = document.querySelector('[data-tid="' + id + '"]');
  if (btn) {
    btn.innerHTML = '<svg width="11" height="12" viewBox="0 0 11 12"><polygon points="1,1 10,6 1,11" fill="white"/></svg>';
  }
}

function audioSeek(event, id) {
  var p = _audioPlayers[id];
  if (!p || !p.audio || !p.audio.duration) return;
  var rect = event.currentTarget.getBoundingClientRect();
  var pct = (event.clientX - rect.left) / rect.width;
  p.audio.currentTime = pct * p.audio.duration;
}

// --- 6. DOWNLOAD MP3 ---
function dlTrack(idx) {
  var f = _faixas[idx];
  if (!f) return;
  if (f.mp3Url) {
    var a = document.createElement('a');
    a.href = f.mp3Url;
    a.download = f.nome + '.mp3';
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } else {
    showMsg('MP3 não disponível ainda');
  }
}

// --- 7. GERAR PDF COM LETRA ---
function dlLetra(idx) {
  var f = _faixas[idx];
  if (!f) return;
  var w = window.open('', '_blank');
  if (!w) { showMsg('Permita pop-ups para baixar o PDF'); return; }
  var doc = '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">';
  doc += '<style>';
  doc += 'body{font-family:Georgia,serif;max-width:520px;margin:56px auto;color:#1e1014;line-height:1.8;padding:0 20px}';
  doc += 'h1{color:#8b1a3a;font-size:1.75rem;margin-bottom:3px}';
  doc += 'h2{color:#c0395f;font-size:.95rem;font-style:italic;font-weight:normal;margin-bottom:22px}';
  doc += 'pre{white-space:pre-wrap;font-family:Georgia,serif;font-size:.95rem;line-height:1.85;color:#3a2028}';
  doc += '.lbl{font-size:.7rem;letter-spacing:2px;text-transform:uppercase;color:#c9a84c;margin-bottom:5px}';
  doc += '.rod{margin-top:36px;font-size:.7rem;color:#bbb;text-align:center;border-top:1px solid #f0d5e0;padding-top:10px}';
  doc += '</style></head><body>';
  doc += '<div class="lbl">Uma Canção Para Sua Mãe 🌸</div>';
  doc += '<h1>' + f.nome + '</h1>';
  doc += '<h2>' + f.genero + '</h2>';
  doc += '<pre>' + (f.letra || '') + '</pre>';
  doc += '<div class="rod">Uma Canção Para Sua Mãe · Feliz Dia das Mães! 🌸</div>';
  doc += '<scr' + 'ipt>setTimeout(function(){window.print()},500)<\/scr' + 'ipt>';
  doc += '</body></html>';
  w.document.write(doc);
  w.document.close();
}

// --- Helper ---
function showMsg(msg) {
  var t = document.getElementById('toast');
  if (t) {
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(function() { t.classList.remove('show'); }, 3000);
  }
}
