import { useEffect, useState } from 'react';
import { useGame, SCREENS } from '../context/GameContext';
import { fetchQuestions } from '../services/claudeApi';
import { getUnusedBatch, saveBatch, markBatchUsed } from '../services/firebase';
import { playSound } from '../services/audioManager';
import QuestionCard from '../components/QuestionCard';

const QUESTION_COUNT = { Fácil: 10, Médio: 8, Difícil: 6 };

function calcFichas(pct) {
  if (pct === 100) return 8;
  if (pct >= 90) return 5;
  if (pct >= 80) return 4;
  if (pct >= 70) return 3;
  if (pct >= 60) return 2;
  return 0;
}

export default function QuizScreen() {
  const { state, dispatch } = useGame();
  const [loading, setLoading] = useState(state.quizQuestions.length === 0);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [multiSelected, setMultiSelected] = useState([]);
  const [answered, setAnswered] = useState(null);
  const { grade, subject, level, content, uuid } = state;
  const count = QUESTION_COUNT[level] || 8;

  useEffect(() => {
    if (state.quizQuestions.length > 0) { setLoading(false); return; }
    loadQuestions();
  }, []);

  async function loadQuestions() {
    try {
      let questions, batchId;
      // 1. Tenta buscar batch não usado no cache
      const cached = await getUnusedBatch(uuid, grade, subject, level, content);
      if (cached) {
        ({ batchId, questions } = cached);
      } else {
        // 2. Gera novas perguntas via Claude
        questions = await fetchQuestions(grade, subject, level, content, count, false);
        batchId = await saveBatch(grade, subject, level, content, questions);
      }
      await markBatchUsed(uuid, batchId);
      dispatch({ type: 'SET_QUIZ_QUESTIONS', payload: questions.slice(0, count) });
      dispatch({ type: 'SET_CLAW_BATCH', payload: batchId });
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  const questions = state.quizQuestions;
  const current = state.currentQuestionIndex;
  const q = questions[current];

  function isCorrect(q, sel) {
    if (q.type === 'multiple_select') {
      const correctSet = new Set(Array.isArray(q.correct) ? q.correct : [q.correct]);
      const selSet = new Set(sel);
      return correctSet.size === selSet.size && [...correctSet].every(v => selSet.has(v));
    }
    if (q.type === 'matching') return sel === 'correct'; // handled by MatchingQuestion component
    return sel === q.correct;
  }

  function handleAnswer(option) {
    if (answered !== null) return;
    if (q.type === 'multiple_select') return; // handled by confirm button
    // matching: option is 'correct' or 'wrong' from MatchingQuestion component
    const correct = q.type === 'matching' ? option === 'correct' : isCorrect(q, option);
    setSelected(option);
    setAnswered(correct);
    dispatch({ type: 'ANSWER_QUESTION', payload: { id: q.id, correct, selected: option } });
    playSound(correct ? 'correct' : 'wrong');
  }

  function handleMultiToggle(option) {
    if (answered !== null) return;
    setMultiSelected(prev =>
      prev.includes(option) ? prev.filter(o => o !== option) : [...prev, option]
    );
  }

  function handleMultiConfirm() {
    if (answered !== null || multiSelected.length === 0) return;
    const correct = isCorrect(q, multiSelected);
    setAnswered(correct);
    dispatch({ type: 'ANSWER_QUESTION', payload: { id: q.id, correct, selected: multiSelected } });
    playSound(correct ? 'correct' : 'wrong');
  }

  function handleNext() {
    const isLast = current + 1 >= questions.length;
    if (isLast) {
      // Calcular resultado
      const allAnswers = [...state.answers, { correct: answered }];
      const correctCount = allAnswers.filter(a => a.correct).length;
      const pct = Math.round((correctCount / questions.length) * 100);
      const fichas = calcFichas(pct);
      const score = correctCount * 100;
      dispatch({ type: 'EARN_FICHAS', payload: fichas, score });
      dispatch({ type: 'GO_TO', payload: SCREENS.RESULT });
    } else {
      dispatch({ type: 'NEXT_QUESTION' });
      setSelected(null);
      setMultiSelected([]);
      setAnswered(null);
    }
  }

  if (loading) return (
    <div className="screen center-screen">
      <div className="loading-card">
        <div className="spinner">🔄</div>
        <p>Carregando perguntas sobre<br /><strong>"{content}"</strong>...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="screen center-screen">
      <div className="error-card">
        <p>😕 Erro ao carregar perguntas: {error}</p>
        <button className="btn btn-primary" onClick={loadQuestions}>Tentar novamente</button>
      </div>
    </div>
  );

  if (!q) return null;

  const progress = ((current) / questions.length) * 100;

  return (
    <div className="screen quiz-screen">
      <div className="quiz-header">
        <div className="quiz-meta">
          <span>🎯 Quiz: {content}</span>
          <span>Pergunta {current + 1}/{questions.length}</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <QuestionCard
        key={q.id}
        question={q}
        selected={q.type === 'multiple_select' ? multiSelected : selected}
        answered={answered}
        onAnswer={q.type === 'multiple_select' ? handleMultiToggle : handleAnswer}
        isMulti={q.type === 'multiple_select'}
      />

      {q.type === 'multiple_select' && answered === null && (
        <button
          className={`btn btn-secondary ${multiSelected.length === 0 ? 'btn-disabled' : ''}`}
          onClick={handleMultiConfirm}
          disabled={multiSelected.length === 0}
        >
          ✅ Confirmar seleção
        </button>
      )}

      {answered !== null && (
        <div className={`feedback-box ${answered ? 'feedback-correct' : 'feedback-wrong'}`}>
          <p className="feedback-title">{answered ? '🎉 Correto!' : '😅 Errado!'}</p>
          <p>{q.explanation}</p>
          {q.bncc_skill && (
            <p className="feedback-bncc">📌 Habilidade BNCC {q.bncc_skill}: {q.bncc_description}</p>
          )}
          <button className="btn btn-primary" onClick={handleNext}>
            {current + 1 >= questions.length ? '📊 Ver Resultado!' : 'Próxima →'}
          </button>
        </div>
      )}
    </div>
  );
}
