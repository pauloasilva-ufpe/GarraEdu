import { useState } from 'react';
import { useGame, SCREENS } from '../context/GameContext';
import { playSound } from '../services/audioManager';

const GRADES = ['1º', '2º', '3º', '4º', '5º', '6º', '7º', '8º', '9º'];

const SUBJECTS = {
  '1º': ['Língua Portuguesa', 'Matemática', 'Ciências', 'História', 'Geografia', 'Arte', 'Educação Física'],
  '2º': ['Língua Portuguesa', 'Matemática', 'Ciências', 'História', 'Geografia', 'Arte', 'Educação Física'],
  '3º': ['Língua Portuguesa', 'Matemática', 'Ciências', 'História', 'Geografia', 'Arte', 'Educação Física'],
  '4º': ['Língua Portuguesa', 'Matemática', 'Ciências', 'História', 'Geografia', 'Arte', 'Educação Física'],
  '5º': ['Língua Portuguesa', 'Matemática', 'Ciências', 'História', 'Geografia', 'Arte', 'Educação Física'],
  '6º': ['Língua Portuguesa', 'Matemática', 'Ciências', 'História', 'Geografia', 'Arte', 'Educação Física', 'Inglês'],
  '7º': ['Língua Portuguesa', 'Matemática', 'Ciências', 'História', 'Geografia', 'Arte', 'Educação Física', 'Inglês'],
  '8º': ['Língua Portuguesa', 'Matemática', 'Ciências', 'História', 'Geografia', 'Arte', 'Educação Física', 'Inglês'],
  '9º': ['Língua Portuguesa', 'Matemática', 'Ciências', 'História', 'Geografia', 'Arte', 'Educação Física', 'Inglês'],
};

const LEVELS = [
  { value: 'Fácil', emoji: '🌱', desc: '10 perguntas — ideal para revisar!' },
  { value: 'Médio', emoji: '🔥', desc: '8 perguntas — para quem já sabe um pouco!' },
  { value: 'Difícil', emoji: '💎', desc: '6 perguntas — desafio dos campeões!' },
];

export default function SetupScreen() {
  const { state, dispatch } = useGame();
  const [grade, setGrade] = useState(state.grade || '');
  const [subject, setSubject] = useState(state.subject || '');
  const [level, setLevel] = useState(state.level || '');
  const [content, setContent] = useState(state.content || '');

  const gradeNum = grade ? grade.replace('º', '') : '';
  const subjects = grade ? SUBJECTS[grade] || [] : [];

  const valid = grade && subject && level && content.trim().length >= 3;

  function handleStart() {
    if (!valid) return;
    playSound('click');
    dispatch({
      type: 'SET_CONFIG',
      payload: { grade: gradeNum, subject, level, content: content.trim() },
    });
    dispatch({ type: 'GO_TO', payload: SCREENS.STUDY });
  }

  return (
    <div className="screen setup-screen">
      <div className="setup-card">
        <h2 className="setup-title">🎯 Configure sua Aventura!</h2>
        <p className="setup-sub">Olá, <strong>{state.playerName}</strong>! Escolha o que quer estudar hoje.</p>

        <div className="setup-grid">
          {/* Ano */}
          <div className="field-group">
            <label>📚 Ano Escolar</label>
            <div className="pill-group">
              {GRADES.map(g => (
                <button
                  key={g}
                  className={`pill ${grade === g ? 'pill-active' : ''}`}
                  onClick={() => { setGrade(g); setSubject(''); }}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Disciplina */}
          {grade && (
            <div className="field-group">
              <label>🔬 Disciplina</label>
              <div className="pill-group">
                {subjects.map(s => (
                  <button
                    key={s}
                    className={`pill ${subject === s ? 'pill-active' : ''}`}
                    onClick={() => setSubject(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Nível */}
          {subject && (
            <div className="field-group">
              <label>⚡ Nível de Dificuldade</label>
              <div className="level-group">
                {LEVELS.map(l => (
                  <button
                    key={l.value}
                    className={`level-card ${level === l.value ? 'level-active' : ''}`}
                    onClick={() => setLevel(l.value)}
                  >
                    <span className="level-emoji">{l.emoji}</span>
                    <span className="level-name">{l.value}</span>
                    <span className="level-desc">{l.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Conteúdo */}
          {level && (
            <div className="field-group">
              <label>✏️ O que você quer estudar em {subject}?</label>
              <input
                className="input-content"
                type="text"
                placeholder={`Ex: frações, fotossíntese, Segunda Guerra Mundial...`}
                value={content}
                maxLength={80}
                onChange={e => setContent(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleStart()}
                autoFocus
              />
            </div>
          )}
        </div>

        <button
          className={`btn btn-primary btn-lg ${!valid ? 'btn-disabled' : ''}`}
          onClick={handleStart}
          disabled={!valid}
        >
          🚀 Começar o Estudo!
        </button>
      </div>
    </div>
  );
}
