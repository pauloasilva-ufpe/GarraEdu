import { useEffect, useState } from 'react';
import { useGame, SCREENS } from '../context/GameContext';
import { fetchStudyContent } from '../services/claudeApi';

export default function StudyScreen() {
  const { state, dispatch } = useGame();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { grade, subject, level, content } = state;

  useEffect(() => {
    if (state.studyData) { setLoading(false); return; }
    fetchStudyContent(grade, subject, level, content)
      .then(data => {
        dispatch({ type: 'SET_STUDY', payload: data });
        setLoading(false);
      })
      .catch(err => { setError(err.message); setLoading(false); });
  }, []);

  const data = state.studyData;

  if (loading) return (
    <div className="screen center-screen">
      <div className="loading-card">
        <div className="spinner">🔄</div>
        <p>Preparando seu conteúdo sobre<br /><strong>"{content}"</strong>...</p>
        <p className="loading-sub">Isso pode levar alguns segundos ✨</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="screen center-screen">
      <div className="error-card">
        <p>😕 Ops! Erro ao carregar: {error}</p>
        <button className="btn btn-primary" onClick={() => window.location.reload()}>Tentar novamente</button>
      </div>
    </div>
  );

  return (
    <div className="screen study-screen">
      <div className="study-card">
        <div className="study-header">
          <span className="study-badge">{subject} · {grade}º Ano · {level}</span>
          <h2 className="study-title">{data.title}</h2>
          <p className="study-intro">{data.intro}</p>
        </div>

        <div className="study-sections">
          {data.sections.map((sec, i) => (
            <div key={i} className="study-section">
              <h3>{sec.heading}</h3>
              <p>{sec.body}</p>
            </div>
          ))}
        </div>

        {data.visual_description && (
          <div className="visual-box">
            <span className="visual-icon">🖼️</span>
            <p><strong>Imagine assim:</strong> {data.visual_description}</p>
          </div>
        )}

        <div className="key-concepts">
          <h3>🗝️ Conceitos-Chave</h3>
          <div className="concept-pills">
            {data.key_concepts.map((c, i) => (
              <span key={i} className="concept-pill">{c}</span>
            ))}
          </div>
        </div>

        {data.fun_fact && (
          <div className="fun-fact-box">
            <span>⚡</span>
            <p><strong>Sabia que...</strong> {data.fun_fact}</p>
          </div>
        )}

        {data.bncc_skills?.length > 0 && (
          <div className="bncc-box">
            <p>📌 Habilidades BNCC: {data.bncc_skills.join(' · ')}</p>
          </div>
        )}

        <button
          className="btn btn-primary btn-lg"
          onClick={() => dispatch({ type: 'GO_TO', payload: SCREENS.WARMUP })}
        >
          ✅ Entendi! Vamos para o Aquecimento →
        </button>
      </div>
    </div>
  );
}
