import 'dotenv/config';
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
const CLAUDE_MODEL = 'claude-opus-4-6';

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:4173'] }));
app.use(express.json());

// ── Utilitário de chamada à API Claude ─────────────────────────────────────
async function callClaude(systemPrompt, userPrompt, maxTokens = 2048) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': CLAUDE_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Claude API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

function extractJSON(text) {
  const match = text.match(/```json\s*([\s\S]*?)```/) || text.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
  if (match) return JSON.parse(match[1] || match[0]);
  return JSON.parse(text);
}

// ── POST /api/study ────────────────────────────────────────────────────────
// Gera conteúdo de estudo para a tela de Study
app.post('/api/study', async (req, res) => {
  try {
    const { grade, subject, level, content } = req.body;

    const system = `Você é um pedagogo especialista em BNCC para o Ensino Fundamental brasileiro.
Crie conteúdo educativo claro, lúdico e adequado à idade. Use emojis moderadamente.
SEMPRE retorne JSON válido, sem texto fora do bloco JSON.`;

    const user = `Gere conteúdo de estudo sobre "${content}" para alunos do ${grade}º ano do Ensino Fundamental,
disciplina ${subject}, nível ${level}.

Retorne APENAS o JSON abaixo, sem markdown além do bloco json:
\`\`\`json
{
  "title": "título atraente do conteúdo",
  "intro": "introdução motivadora em 2 frases, linguagem infantil",
  "sections": [
    { "heading": "subtítulo", "body": "parágrafo explicativo (máx 120 palavras, linguagem acessível para ${grade}º ano)" }
  ],
  "key_concepts": ["conceito 1", "conceito 2", "conceito 3", "conceito 4"],
  "visual_description": "descrição vívida de uma imagem mental que ajude a entender o conteúdo (2 frases)",
  "fun_fact": "curiosidade incrível sobre o tema (1 frase)",
  "bncc_skills": ["código habilidade BNCC 1", "código habilidade BNCC 2"]
}
\`\`\``;

    const raw = await callClaude(system, user, 1500);
    const data = extractJSON(raw);
    res.json(data);
  } catch (err) {
    console.error('Error /api/study:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/questions ────────────────────────────────────────────────────
// Gera perguntas do quiz (warmup ou main quiz)
app.post('/api/questions', async (req, res) => {
  try {
    const { grade, subject, level, content, count, warmup = false, excludeIds = [] } = req.body;

    const questionTypes = warmup
      ? 'múltipla escolha (4 opções)'
      : 'variados: múltipla escolha (4 opções), múltipla seleção (marque todas corretas) e associação (pares)';

    const system = `Você é um pedagogo especialista em BNCC para o Ensino Fundamental brasileiro.
Crie perguntas educativas precisas, criativas e adequadas à idade.
SEMPRE retorne JSON válido conforme o schema solicitado.
${excludeIds.length > 0 ? `NUNCA repita as perguntas com ids: ${excludeIds.join(', ')}` : ''}`;

    const user = `Gere ${count} perguntas ${warmup ? 'de aquecimento (mais simples, diagnósticas)' : `de quiz nível ${level}`}
sobre "${content}" para alunos do ${grade}º ano, disciplina ${subject}.
Tipos de questão: ${questionTypes}.
Linguagem adequada para ${grade}º ano.

Para perguntas de ASSOCIAÇÃO, use type "matching" com "pairs": [{"left":"...","right":"..."}] e sem "options"/"correct".
Para MÚLTIPLA SELEÇÃO, use type "multiple_select" com "correct" sendo um array com todos os itens corretos.
Para MÚLTIPLA ESCOLHA, use type "multiple_choice" com "correct" sendo a string exata de uma opção.

Retorne APENAS:
\`\`\`json
[
  {
    "id": "q1",
    "type": "multiple_choice",
    "question": "texto da pergunta",
    "options": ["A. opção", "B. opção", "C. opção", "D. opção"],
    "correct": "A. opção",
    "explanation": "explicação didática da resposta correta (máx 60 palavras)",
    "bncc_skill": "EF0XCI01",
    "bncc_description": "descrição curta da habilidade BNCC"
  }
]
\`\`\``;

    const raw = await callClaude(system, user, 2500);
    const data = extractJSON(raw);
    res.json(data);
  } catch (err) {
    console.error('Error /api/questions:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🎮 GarraEdu server rodando em http://localhost:${PORT}`);
  if (!CLAUDE_API_KEY) console.warn('⚠️  CLAUDE_API_KEY não configurada no .env!');
});
