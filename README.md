# 🎮 GarraEdu: Aventura Científica

Jogo educativo de máquina de garra para crianças do 1º ao 9º ano, alinhado à BNCC.  
Stack: **React + Vite** (front-end) · **Node/Express** (proxy Claude API) · **Firebase Firestore** (ranking + cache)

---

## 📋 Pré-requisitos

- Node.js 18+ instalado
- Conta na [Anthropic Console](https://console.anthropic.com) com chave API
- Projeto no [Firebase Console](https://console.firebase.google.com) com Firestore ativado

---

## 🚀 Instalação em 5 passos

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

Copie o arquivo de exemplo e preencha com suas chaves:

```bash
cp .env.example .env
```

Abra o `.env` e preencha:

```
CLAUDE_API_KEY=sk-ant-SUA_CHAVE_AQUI

VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu-projeto
VITE_FIREBASE_STORAGE_BUCKET=seu-projeto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=000000000000
VITE_FIREBASE_APP_ID=1:000000000000:web:xxxxxxxx
```

> **Onde achar as chaves Firebase?**  
> Console Firebase → Configurações do Projeto → Seus apps → Configuração do SDK

### 3. Configurar regras do Firestore

No Console Firebase → Firestore → Regras, use:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Ranking: leitura pública, escrita autenticada por UUID (sem login)
    match /ranking/{uuid} {
      allow read: if true;
      allow write: if true; // para MVP; em produção, adicione validação
    }
    // Cache de perguntas
    match /question_cache/{key}/batches/{batch} {
      allow read, write: if true;
    }
    // Histórico de usuário
    match /users/{uuid} {
      allow read, write: if true;
    }
  }
}
```

### 4. Rodar em desenvolvimento

```bash
npm run dev
```

Isso inicia simultaneamente:
- **Servidor Express** em `http://localhost:3001` (proxy Claude API)
- **App React/Vite** em `http://localhost:5173`

### 5. Abrir no navegador

Acesse `http://localhost:5173` 🎉

---

## 🏗️ Estrutura do projeto

```
garraEdu/
├── server.js              # Backend Node: proxy Claude API
├── .env.example           # Template de variáveis
├── vite.config.js         # Config Vite + proxy /api → porta 3001
├── index.html
└── src/
    ├── main.jsx
    ├── App.jsx            # Roteamento de telas
    ├── context/
    │   └── GameContext.jsx   # Estado global (useReducer)
    ├── screens/
    │   ├── ConsentScreen.jsx      # Termo LGPD
    │   ├── IdentificationScreen.jsx # Nome + UUID
    │   ├── SetupScreen.jsx        # Ano / Disciplina / Nível / Conteúdo
    │   ├── StudyScreen.jsx        # Conteúdo gerado por Claude
    │   ├── WarmupScreen.jsx       # 2 perguntas de aquecimento
    │   ├── QuizScreen.jsx         # Quiz com cache/rotação
    │   ├── ResultScreen.jsx       # Pontuação + feedback BNCC
    │   ├── ClawGameScreen.jsx     # Minigame da garra (CSS + Canvas)
    │   └── RankingScreen.jsx      # Top 5 Firestore
    ├── components/
    │   ├── QuestionCard.jsx       # Renderiza múltipla escolha / seleção / associação
    │   └── FichasBadge.jsx        # Badge flutuante de fichas
    └── services/
        ├── firebase.js            # Ranking, cache de perguntas, histórico
        ├── claudeApi.js           # Chamadas ao servidor /api
        └── audioManager.js       # Howler.js para sons
```

---

## 🔄 Lógica de rotação de perguntas

1. Cada conjunto de perguntas é salvo no Firestore como um "batch" com ID único.
2. O histórico de batches usados por cada jogador (identificado por UUID anônimo) é mantido em `users/{uuid}`.
3. Ao iniciar um quiz, o app busca um batch **ainda não usado** por aquele jogador.
4. Se todos os batches disponíveis já foram usados, o Claude gera um novo conjunto de perguntas automaticamente.
5. Isso garante variedade mesmo para o mesmo conteúdo e nível.

---

## 🚢 Deploy (Firebase Hosting)

```bash
# Build da versão de produção do React
npm run build

# Instalar Firebase CLI (se não tiver)
npm install -g firebase-tools

# Login e inicializar
firebase login
firebase init hosting  # pasta pública: dist

# Deploy do front-end
firebase deploy --only hosting
```

Para o servidor Node (proxy Claude API) em produção, use **Cloud Run** ou **Railway**:

```bash
# Exemplo com Railway
railway up
```

> ⚠️ **Nunca exponha a chave Claude API no front-end!**  
> O servidor Express é obrigatório para protegê-la em produção.

---

## 💡 Limitações e próximos passos

| Item | Situação atual | Sugestão futura |
|------|---------------|-----------------|
| Autenticação | UUID anônimo (localStorage) | Google Sign-In para App Store |
| Áudio | CDN externo | Assets `.mp3` próprios |
| Animações | CSS puro | Lottie JSON para bichinhos |
| LGPD | Consent MVP | Política de privacidade completa |
| Escala | Firestore Spark (gratuito) | Plano Blaze para +50k req/dia |

