# 🏠 O Caminho para Casa

**Platformer para crianças** — Guia o Pip de volta à família!

## 🚀 Instalação e Arranque

### Requisitos
- [Node.js](https://nodejs.org) v16 ou superior

### Passos

```bash
# 1. Entrar na pasta do projeto
cd caminho-para-casa

# 2. Instalar dependências
npm install

# 3. Iniciar o servidor
npm start
```

O servidor mostra automaticamente os IPs disponíveis na rede:

```
🏠 ═══════════════════════════════════════
   O CAMINHO PARA CASA — Servidor iniciado!
═══════════════════════════════════════════

📡 Acesso local:    http://localhost:3000

🌐 Acesso na rede:
   eth0            http://192.168.1.42:3000
   wlan0           http://192.168.1.42:3001
```

### Jogar em rede local
1. Inicia o servidor num computador
2. Os outros jogadores na mesma rede ligam-se ao IP mostrado no terminal
3. Cada jogador tem a sua própria sessão de jogo
4. As pontuações são partilhadas em tempo real!

---

## 🎮 Controlos

| Tecla | Ação |
|-------|------|
| `← →` ou `A D` | Mover |
| `↑`, `W` ou `Espaço` | Saltar |
| Duplo `↑` | Duplo salto |
| `P` ou `Esc` | Pausa |

**No telemóvel:** usa os botões no ecrã (deteta toque automáticamente).

---

## 📖 Modos de Jogo

### Modo História (~10 minutos)
- **7 níveis** com ambientes diferentes
- Abre com uma cutscene animada: o pai de careca como farol 🔦
- Cada nível tem inimigos, moedas e um objetivo
- A dificuldade aumenta gradualmente
- Termina quando o Pip chega ao topo da montanha 🏔️

### Modo Infinito
- Terreno gerado proceduralmente, para sempre
- Pontuação baseada na distância percorrida
- Inimigos ficam mais frequentes ao longo do tempo
- Paletes de cores aleatórias em cada sessão

---

## 🎨 Personagens

- **Afonso** — O protagonista. Criança aventureira perdida no bosque.
- **Mãe** — No topo da montanha, usa a lanterna com engenho.
- **Pai** — A sua careca brilhante serve de farol para guiar o Pip! 👨‍🦲💡
- **Lima** — Guardião e guia do Afonso
- **Bichos laranja** — Inimigos que patrulham o chão.
- **Cogumelos saltadores** — Inimigos que saltam de surpresa.

---

## 🛠 Estrutura do Projeto

```
caminho-para-casa/
├── server/
│   └── index.js          # Servidor Node.js + WebSocket
├── public/
│   ├── index.html         # HTML principal
│   ├── css/
│   │   └── style.css      # Estilos do jogo
│   └── js/
│       ├── input.js       # Teclado e toque
│       ├── audio.js       # Sons procedurais (Web Audio API)
│       ├── network.js     # Cliente WebSocket
│       ├── cutscene.js    # Cutscene animada
│       ├── world.js       # Geração de níveis
│       ├── player.js      # Física e render do Pip
│       ├── entities.js    # Inimigos, moedas, render do mundo
│       ├── game.js        # Loop principal do jogo
│       └── ui.js          # Gestão de ecrãs
└── package.json
```

---

## 🌐 API WebSocket

O servidor expõe uma API WebSocket simples para comunicação entre clientes:

| Mensagem | Direção | Descrição |
|----------|---------|-----------|
| `welcome` | Server → Client | ID do jogador + total de jogadores |
| `playerCount` | Server → All | Atualização do número de jogadores |
| `score` | Client → Server | Pontuação atual |
| `finish` | Client → Server | Completou o modo história |
| `leaderboard` | Server → All | Top 10 pontuações |

---

*Feito com ❤️ para putos aventureiros*
