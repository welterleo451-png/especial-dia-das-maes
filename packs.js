// ─── Catálogo de packs ────────────────────────────────────────

const PACKS = {
  p1: {
    id: 'p1',
    ico: '💖',
    nome: 'Pack Emoção Pura',
    tagline: 'Para a mãe guerreira e dedicada',
    preco: 100, // TODO: Voltar para 1790 após o teste (R$ 17,90)
    precoLabel: 'R$ 1,00', // TODO: Voltar para 'R$ 17,90' após o teste
    previaSegundos: 35,
    faixas: [
      {
        nome: 'Obrigada por Tudo',
        genero: 'Pop Romântico',
        mp3Url:   'https://drive.google.com/uc?export=download&id=1A7vQkum5vXeW3-GnD4v2z78lffGbY7TD',
        previaUrl:'https://drive.google.com/uc?export=download&id=1A7vQkum5vXeW3-GnD4v2z78lffGbY7TD',
        letra: `[Verso 1]
Você acordava antes do sol
Pra preparar o meu café
E quando o mundo me assustava
Você me ensinava a ter fé

[Verso 2]
As suas renúncias silenciosas
Os sonhos que você adiou
Tudo o que você deixou de lado
Pra cuidar de quem você gerou

[Pré-Refrão]
Eu nunca disse o suficiente
Mas hoje eu quero que você saiba

[Refrão]
Obrigada por tudo, mãe
Por cada noite que você não dormiu
Obrigada por tudo, mãe
Por segurar minha mão quando eu caí
Você é o amor mais bonito que eu conheço
O maior presente que a vida me deu
Obrigada por tudo, mãe
Por ser exatamente quem você é

[Ponte]
E se um dia eu chegar
Onde eu sempre sonhei
Vou saber que foi você
Que me ensinou a voar

[Refrão Final]
Obrigada por tudo, mãe
Te amo mais do que consigo dizer`,
      },
      {
        nome: 'Minha Fortaleza',
        genero: 'MPB Suave',
        mp3Url:   'https://drive.google.com/uc?export=download&id=1oMmJycumdFkrPZPLfm877Gmmi3pTSeGr',
        previaUrl:'https://drive.google.com/uc?export=download&id=1wqJm8VOB18CW8lJkELu5gvamsL-eMvZd',
        letra: `[Verso 1]
Quando o chão fugiu dos meus pés
Você ficou de pé por mim
Quando as palavras me faltavam
Seu silêncio foi o meu jardim

[Verso 2]
O tempo passou e eu cresci
Mas o seu abraço é o mesmo
O mundo lá fora é tão frio
Mas no seu peito eu me aqueço

[Refrão]
Minha fortaleza, minha mãe
Você é onde eu sempre volto
Minha fortaleza, minha mãe
No seu colo o mundo fica solto
Não precisa de paredes nem de muro
No seu amor eu encontrei o mais seguro lar

[Ponte]
Obrigada por ser forte
Quando eu não conseguia ser
Obrigada por me mostrar
O que é de verdade querer

[Refrão Final]
Minha fortaleza, minha mãe
Você é onde eu sempre volto
Minha fortaleza, minha mãe
No seu amor eu encontrei o mais seguro lar

[Final]
Meu mais seguro lar...
Minha mãe, minha fortaleza.`,
      },
      {
        nome: 'Amor Sem Fim',
        genero: 'Balada',
        mp3Url:   'https://drive.google.com/uc?export=download&id=1VVGaL_WBK91YT4PPHUz03VHtq8_igZ-s',
        previaUrl:'https://drive.google.com/uc?export=download&id=1VVGaL_WBK91YT4PPHUz03VHtq8_igZ-s',
        letra: `[Verso 1]
Existe um amor que não conhece fronteiras
Que atravessa o tempo e o espaço
Que cabe em um olhar, em um abraço
Que cura tudo, sem nenhum traço

[Verso 2]
As estações mudam a cor
Mas o seu sorriso ilumina
Você é o meu farol na dor
A voz que acalma e ensina

[Refrão]
É o amor sem fim que você me dá
Que começou antes de eu respirar
É o amor sem fim que me faz seguir
Que vai comigo até o fim

[Ponte]
Mãe, você não sabe o quanto você vale
Não existe preço, não existe igual
Você é a primeira estrela que eu avistei
E a última que apago ao dormir

[Final]
Até o fim, mãe...
Eu te amo pra sempre.`,
      },
    ],
  },

  p2: {
    id: 'p2',
    ico: '🌹',
    nome: 'Pack Amor de Mãe',
    tagline: 'Para emocionar até a mais durona',
    preco: 2990,
    precoLabel: 'R$ 29,90',
    destaque: true,
    previaSegundos: 35,
    faixas: [
      {
        nome: 'Você É Meu Lar',
        genero: 'Soul Brasileiro',
        mp3Url:   'https://drive.google.com/uc?export=download&id=1cA72413UV40yHwrgD1K9UpwZBZCqONju',
        previaUrl:'https://drive.google.com/uc?export=download&id=1cA72413UV40yHwrgD1K9UpwZBZCqONju',
        letra: `[Verso 1]
Já morei em muitos lugares
Já andei por muitos caminhos
Mas onde quer que eu estivesse
Eu voltava pro seu carinho

[Verso 2]
A vida me levou pra longe
Mas meu coração ficou aí
Nas lembranças da nossa cozinha
No amor que eu sempre senti

[Refrão]
Você é meu lar, mãe
Onde eu sempre quero estar
Você é meu lar, mãe
O melhor lugar do mundo é perto de você
Pode ser qualquer lugar
Se você estiver lá
Você é meu lar, mãe
Meu eterno lar

[Final]
Eterno lar... mãe.`,
      },
      {
        nome: 'Mãe Guerreira',
        genero: 'Gospel Suave',
        mp3Url:   'https://drive.google.com/uc?export=download&id=1JDbL9w9nvu4BUCBAdJBdT8T7MZV5eIL8',
        previaUrl:'https://drive.google.com/uc?export=download&id=1gkgW_BJ-zxjYENQO0ss3t_DN0wol442k',
        letra: `[Verso 1]
Ela acordou cedo tantas vezes
Sem ninguém pra agradecer
Carregou o peso de mil fardos
Só pra ver os filhos crescer

[Verso 2]
As noites mal dormidas, as orações
O medo escondido atrás do sorriso
Você enfrentou furacões
Pra me dar o meu paraíso

[Refrão]
Mãe guerreira, você venceu
Com as mãos calejadas e o coração aberto
Mãe guerreira, Deus te viu
Em cada sacrifício, em cada gesto certo
Você plantou amor onde só havia pedra
E da pedra brotou vida, brotou flor

[Final]
Brotou flor... minha mãe guerreira.`,
      },
      {
        nome: 'Primeiro Abraço',
        genero: 'Acústico',
        mp3Url:   'https://drive.google.com/uc?export=download&id=15zFoZRVcBatSlF3H9aLWc5MzivahnR3P',
        previaUrl:'https://drive.google.com/uc?export=download&id=15zFoZRVcBatSlF3H9aLWc5MzivahnR3P',
        letra: `[Verso 1]
Dizem que o primeiro som que ouvi no mundo
Era o batimento do seu coração
Antes de conhecer o sol ou a lua
Já conhecia o cheiro do seu amor

[Refrão]
No primeiro abraço que você me deu
O mundo inteiro parou de girar
No primeiro abraço, eu aprendi
Que o amor é o lugar mais bonito de estar

[Final]
Obrigada pelo primeiro abraço
E por todos que ainda vêm
Te amo, mãe`,
      },
    ],
  },

  p3: {
    id: 'p3',
    ico: '🌙',
    nome: 'Pack Saudade',
    tagline: 'Para quem está longe mas não esquece',
    preco: 2490,
    precoLabel: 'R$ 24,90',
    previaSegundos: 35,
    faixas: [
      {
        nome: 'Abraço de Longe',
        genero: 'Pop Melancólico',
        mp3Url:   'https://drive.google.com/uc?export=download&id=197UGfWdBDenLR2kt-78IsYz_5-6pXFWp',
        previaUrl:'https://drive.google.com/uc?export=download&id=197UGfWdBDenLR2kt-78IsYz_5-6pXFWp',
        letra: `[Verso 1]
Tem coisas que o celular não entrega
Não dá pra sentir o cheiro do seu cabelo
Não dá pra pegar na sua mão de noite
Quando a saudade chega mais pesada

[Verso 2]
Os dias passam voando aqui
Mas a saudade anda devagar
Eu conto os dias no calendário
Pro momento de te encontrar

[Refrão]
Recebe esse abraço de longe, mãe
Que eu mandei com todo amor que cabia em mim
Esse abraço de longe que atravessa o Brasil
Pra dizer que você sempre foi o meu lar

[Ponte]
E mesmo com essa tela entre nós
Eu consigo sentir o seu calor
A sua voz pelo telefone
Ainda é o meu maior cobertor

[Refrão Final]
Recebe esse abraço de longe, mãe
Que eu mandei com todo amor que cabia em mim
Esse abraço de longe que atravessa o Brasil
Pra dizer que você sempre foi o meu lar`,
      },
      {
        nome: 'Longe, Mas Perto',
        genero: 'Bossa Nova',
        mp3Url:   'https://drive.google.com/uc?export=download&id=1qKTC7Fo843fh75QPTPOzFfKlKNmojVTE',
        previaUrl:'https://drive.google.com/uc?export=download&id=1qKTC7Fo843fh75QPTPOzFfKlKNmojVTE',
        letra: `[Verso 1]
A distância é só em quilômetros
O coração não sabe o que é longe
Cada vez que fecho os olhos
É o seu rosto que eu vejo, tão forte

[Verso 2]
Eu levo seus conselhos na mala
E o seu sorriso na memória
Você é a página mais linda
Que eu tenho na minha história

[Refrão]
Longe, mas perto, mãe
A saudade me diz que você está aqui
Longe, mas perto, mãe
Em cada detalhe da vida que eu construí

[Final]
Em cada detalhe, mãe.
Longe, mas perto.`,
      },
      {
        nome: 'Você Vive em Mim',
        genero: 'Balada Suave',
        mp3Url:   'https://drive.google.com/uc?export=download&id=15wwlKMB4I_LFF2Aoqhk_p-8u6N8m9RL6',
        previaUrl:'https://drive.google.com/uc?export=download&id=1NEonCvuNm-8K_JxY1fodo2AqK5MbCqm4',
        letra: `[Verso 1]
No jeito que eu rio, tem você
Na forma que eu cuido, tem você
Na teimosia que não me deixa desistir
Na força que aparece no pior momento

[Verso 2]
Quando me olho no espelho
Vejo um pouco do seu olhar
E toda vez que eu tropeço
Lembro de você a me guiar

[Refrão]
Você vive em mim, mãe
Em cada parte do que eu me tornei
Você vive em mim, mãe
Em cada escolha certa que eu já tomei
Não importa onde eu for, o que eu fizer
Em mim, você vai estar

[Ponte]
A distância não pode apagar
O que o sangue e a alma escreveram
Nossos laços nunca vão quebrar
Eles só se fortaleceram

[Final]
Em mim, você vai estar...
Pra sempre.`,
      },
    ],
  },
};

module.exports = PACKS;
