import 'dotenv/config';
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
const CLAUDE_MODEL = 'claude-opus-4-6';

app.use(cors());
app.use(express.json());

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

app.get('/health', (_, res) => res.json({ status: 'ok' }));

app.post('/api/study', async (req, res) => {
  try {
    const { grade, subject, level, content } = req.body;
    const system = `Você é um pedagogo especialista em BNCC para o Ensino Fundamental brasileiro.
Crie conteúdo educativo claro, lúdico e adequado à idade. Use emojis moderadamente.
SEMPRE retorne JSON válido, sem texto fora do bloco JSON.`;

    const user = `Gere conteúdo de estudo sobre "${content}" para alunos do ${grade}º ano do Ensino Fundamental,
disciplina ${subject}, nível ${level}.
Retorne APENAS o JSON abaixo:
\`\`\`json
{
  "title": "título atraente do conteúdo",
  "intro": "introdução motivadora em 2 frases, linguagem infantil",
  "sections": [
    { "heading": "subtítulo", "body": "parágrafo explicativo (máx 120 palavras)" }
  ],
  "key_concepts": ["conceito 1", "conceito 2", "conceito 3", "conceito 4"],
  "visual_description": "descrição vívida de uma imagem mental (2 frases)",
  "fun_fact": "curiosidade incrível sobre o tema (1 frase)",
  "bncc_skills": ["código habilidade BNCC 1", "código habilidade BNCC 2"]
}
\`\`\``;

    const raw = await callClaude(system, user, 1500);
    res.json(extractJSON(raw));
  } catch (err) {
    console.error('Error /api/study:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/questions', async (req, res) => {
  try {
    const { grade, subject, level, content, count, warmup = false, excludeIds = [] } = req.body;
    const questionTypes = warmup
      ? 'múltipla escolha (4 opções)'
      : 'variados: múltipla escolha (4 opções), múltipla seleção (marque todas corretas) e associação (pares)';

    const levelInstructions = {
      'Fácil': `Nível FÁCIL: perguntas de reconhecimento e identificação. Contextos diretos. O aluno reconhece ou lembra o conceito básico.`,
      'Médio': `Nível MÉDIO: perguntas de compreensão e aplicação. O aluno deve entender e aplicar o conceito, não apenas memorizar.`,
      'Difícil': `Nível DIFÍCIL: perguntas de análise e raciocínio em múltiplas etapas. Para MATEMÁTICA: crie situações-problema onde o aluno descobre sozinho qual operação resolver — NUNCA indique a operação diretamente. Para outras disciplinas: exija inferência, síntese ou análise crítica.`
    };

    const system = `Você é um pedagogo especialista em BNCC para o Ensino Fundamental brasileiro.
Crie perguntas educativas desafiadoras e adequadas à faixa etária do ${grade}º ano.

REGRAS OBRIGATÓRIAS:
1. NUNCA inclua a resposta correta dentro do enunciado da pergunta.
2. O enunciado deve DESAFIAR o aluno a pensar, não guiar a resposta.
3. Os distratores (opções erradas) devem ser plausíveis, não obviamente incorretos.
4. A pergunta deve exigir raciocínio, não apenas identificar palavras-chave.
5. SEMPRE retorne JSON válido. Use aspas simples dentro das strings, nunca aspas duplas.
${excludeIds.length > 0 ? `6. NUNCA repita as perguntas com ids: ${excludeIds.join(', ')}` : ''}`;

    const user = `Gere ${count} perguntas ${warmup ? 'de aquecimento (simples, reconhecimento)' : `de quiz — ${levelInstructions[level] || `nível ${level}`}`}
sobre "${content}" para alunos do ${grade}º ano, disciplina ${subject}.
Tipos de questão: ${questionTypes}.

Para ASSOCIAÇÃO: type "matching", campo "pairs": [{"left":"...","right":"..."}], SEM "options" e SEM "correct". Mínimo 3 pares, máximo 4 pares.
Para MÚLTIPLA SELEÇÃO: type "multiple_select", "correct" é array com TODOS os corretos (mínimo 2).
Para MÚLTIPLA ESCOLHA: type "multiple_choice", "correct" é string exata de uma opção.

Retorne APENAS:
\`\`\`json
[
  {
    "id": "q1",
    "type": "multiple_choice",
    "question": "texto da pergunta sem revelar a resposta",
    "options": ["A. opção", "B. opção", "C. opção", "D. opção"],
    "correct": "A. opção",
    "explanation": "explicação curta do raciocínio correto em até 50 palavras",
    "bncc_skill": "EF0XCI01",
    "bncc_description": "descrição curta da habilidade BNCC"
  }
]
\`\`\``;

    const raw = await callClaude(system, user, 4096);
    res.json(extractJSON(raw));
  } catch (err) {
    console.error('Error /api/questions:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🎮 GarraEdu server rodando em http://localhost:${PORT}`);
  if (!CLAUDE_API_KEY) console.warn('⚠️  CLAUDE_API_KEY não configurada!');
});
