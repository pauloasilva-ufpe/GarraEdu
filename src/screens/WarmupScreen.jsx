import { useEffect, useState } from 'react';
import { useGame, SCREENS } from '../context/GameContext';
import { fetchQuestions } from '../services/claudeApi';
import { playSound } from '../services/audioManager';
import QuestionCard from '../components/QuestionCard';

export default function WarmupScreen() {
  const { state, dispatch } = useGame();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [current, setCurrent] = useState(0);
  const [answered, setAnswered] = useState(null);
  const [selected, setSelected] = useState(null);
  const { grade, subject, level, content } = state;

  useEffect(() => {
    if (state.warmupQuestions.length > 0) { setLoading(false); return; }
    fetchQuestions(grade, subject, level, content, 2, true)
      .then(qs => {
        dispatch({ type: 'SET_WARMUP_QUESTIONS', payload: qs });
        setLoading(false);
      })
      .catch(err => { setError(err.message); setLoading(false); });
  }, []);

  const questions = state.warmupQuestions;

  function handleAnswer(option) {
    if (answered !== null) return;
    const q = questions[current];
    const correct = Array.isArray(q.correct)
      ? q.correct.includes(option)
      : option === q.correct;
    setSelected(option);
    setAnswered(correct);
    playSound(correct ? 'correct' : 'wrong');
  }

  function handleNext() {
    if (current + 1 >= questions.length) {
      dispatch({ type: 'GO_TO', payload: SCREENS.QUIZ });
    } else {
      setCurrent(c => c + 1);
      setAnswered(null);
      setSelected(null);
    }
  }

  if (loading) return (
    <div className="screen center-screen">
      <div className="loading-card">
        <div className="spinner">🔄</div>
        <p>Preparando o aquecimento...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="screen center-screen">
      <div className="error-card">
        <p>😕 Erro: {error}</p>
        <button className="btn btn-primary" onClick={() => dispatch({ type: 'GO_TO', payload: SCREENS.QUIZ })}>
          Pular aquecimento
        </button>
      </div>
    </div>
  );

  const q = questions[current];

  return (
    <div className="screen quiz-screen">
      <div className="quiz-header warmup-header">
        <span className="warmup-badge">🏋️ Aquecimento — Pergunta {current + 1} de {questions.length}</span>
        <p className="warmup-note">Estas perguntas não valem fichas — são só para aquecer! 😄</p>
      </div>

      <QuestionCard
        question={q}
        selected={selected}
        answered={answered}
        onAnswer={handleAnswer}
      />

      {answered !== null && (
        <div className={`feedback-box ${answered ? 'feedback-correct' : 'feedback-wrong'}`}>
          <p>{answered ? '🎉 Isso aí!' : '🤔 Quase!'} {q.explanation}</p>
          <button className="btn btn-primary" onClick={handleNext}>
            {current + 1 >= questions.length ? '🚀 Começar o Quiz!' : 'Próxima →'}
          </button>
        </div>
      )}
    </div>
  );
}
