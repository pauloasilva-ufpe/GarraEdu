import { useState } from 'react';
import { useGame, SCREENS } from '../context/GameContext';

export default function IdentificationScreen() {
  const { state, dispatch } = useGame();
  const [name, setName] = useState(state.playerName || '');

  function handleNext() {
    const trimmed = name.trim();
    if (!trimmed) return;
    localStorage.setItem('garraedu_name', trimmed);
    dispatch({ type: 'SET_PLAYER', payload: trimmed });
    dispatch({ type: 'GO_TO', payload: SCREENS.SETUP });
  }

  return (
    <div className="screen id-screen">
      <div className="id-card">
        <div className="mascot-area">
          <span className="mascot">🐻</span>
          <div className="mascot-bubble">
            Oi! Eu sou o Garry, seu guia nessa aventura! Como você se chama?
          </div>
        </div>

        <h2>✨ Qual é o seu nome de jogador?</h2>
        <p className="id-hint">Esse nome vai aparecer no ranking dos melhores!</p>

        <input
          className="input-name"
          type="text"
          placeholder="Ex: Sophia, João, Larissa..."
          value={name}
          maxLength={20}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleNext()}
          autoFocus
        />

        <button
          className={`btn btn-primary btn-lg ${!name.trim() ? 'btn-disabled' : ''}`}
          onClick={handleNext}
          disabled={!name.trim()}
        >
          Continuar →
        </button>
      </div>
    </div>
  );
}
