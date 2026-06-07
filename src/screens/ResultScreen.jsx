import { useGame, SCREENS } from '../context/GameContext';
import { saveScore } from '../services/firebase';
import { useEffect, useRef } from 'react';
import { playSound } from '../services/audioManager';

const FICHA_RULES = [
  { min: 100, fichas: 8, msg: '🏆 PERFEITO! Você dominou' },
  { min: 90, fichas: 5, msg: '⭐ Incrível! Você arrasou em' },
  { min: 80, fichas: 4, msg: '🎉 Muito bem! Você foi ótimo em' },
  { min: 70, fichas: 3, msg: '👏 Bom trabalho! Continue praticando' },
  { min: 60, fichas: 2, msg: '💪 Quase lá! Vamos revisar' },
  { min: 0, fichas: 0, msg: '🤗 Não desanime! Vamos estudar mais' },
];

function getFichaRule(pct) {
  return FICHA_RULES.find(r => pct >= r.min);
}

export default function ResultScreen() {
  const { state, dispatch } = useGame();
  const saved = useRef(false);

  const answers = state.answers;
  const total = state.quizQuestions.length;
  const correct = answers.filter(a => a.correct).length;
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
  const rule = getFichaRule(pct);
  const fichasEarned = state.fichas - (state.fichas - rule.fichas); // fichas from this round

  // Get fichas earned this round from EARN_FICHAS action result
  // We read the fichas field which was just updated
  const bnccSkills = state.quizQuestions
    .map(q => q.bncc_skill)
    .filter(Boolean)
    .filter((v, i, a) => a.indexOf(v) === i);

  const wrongQuestions = state.quizQuestions.filter((q, i) => answers[i] && !answers[i].correct);

  useEffect(() => {
    if (saved.current) return;
    saved.current = true;
    if (rule.fichas > 0) {
      playSound('win');
      saveScore(state.playerName, state.uuid, rule.fichas, correct * 100).catch(console.error);
    }
  }, []);

  function handleClaw() {
    dispatch({ type: 'GO_TO', payload: SCREENS.CLAW });
  }

  function handleRetry() {
    dispatch({ type: 'RESTART_ROUND' });
  }

  return (
    <div className="screen result-screen">
      <div className="result-card">
        <div className="result-hero">
          <div className="score-circle">
            <span className="score-pct">{pct}%</span>
            <span className="score-label">{correct}/{total} certas</span>
          </div>
          <h2 className="result-msg">
            {rule.msg} <span className="result-content">"{state.content}"</span>!
          </h2>
        </div>

        <div className="fichas-earned">
          {rule.fichas > 0 ? (
            <>
              <span className="fichas-badge-big">🎫 ×{rule.fichas}</span>
              <p>Você ganhou <strong>{rule.fichas} ficha{rule.fichas > 1 ? 's' : ''}</strong> para jogar na máquina da garra!</p>
            </>
          ) : (
            <p>Que tal tentar de novo? Acerte 60% ou mais para ganhar fichas! 💪</p>
          )}
        </div>

        {/* Feedback pedagógico BNCC para erros */}
        {wrongQuestions.length > 0 && (
          <div className="bncc-feedback">
            <h3>📖 Para crescer ainda mais:</h3>
            {wrongQuestions.map((q, i) => (
              <div key={i} className="bncc-feedback-item">
                <p className="bncc-q">❓ {q.question}</p>
                <p className="bncc-exp">✅ {q.explanation}</p>
                {q.bncc_skill && (
                  <p className="bncc-tag">
                    📌 Habilidade BNCC <strong>{q.bncc_skill}</strong>: {q.bncc_description}
                    <br />
                    <em>Dica: revise este conceito no livro didático ou converse com seu professor! 🙌</em>
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="result-actions">
          {rule.fichas > 0 && (
            <button className="btn btn-primary btn-lg" onClick={handleClaw}>
              🎮 Jogar na Máquina da Garra! ({state.fichas} ficha{state.fichas !== 1 ? 's' : ''})
            </button>
          )}
          <button className="btn btn-secondary" onClick={handleRetry}>
            🔄 Jogar Novamente
          </button>
        </div>
      </div>
    </div>
  );
}
