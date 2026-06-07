import { useState } from 'react';
import { useGame, SCREENS } from '../context/GameContext';

export default function ConsentScreen() {
  const { dispatch } = useGame();
  const [checked, setChecked] = useState(false);

  function handleStart() {
    if (!checked) return;
    dispatch({ type: 'GO_TO', payload: SCREENS.IDENTIFICATION });
  }

  return (
    <div className="screen consent-screen">
      <div className="consent-card">
        <div className="logo-area">
          <span className="logo-emoji">🎮</span>
          <h1 className="logo-title">GarraEdu</h1>
          <p className="logo-sub">Aventura Científica</p>
        </div>

        <div className="consent-body">
          <h2>📋 Termo de Consentimento e Uso</h2>

          <div className="consent-text">
            <p><strong>Olá! Antes de começar a aventura, leia com atenção:</strong></p>

            <p>O <strong>GarraEdu</strong> é um jogo educativo gratuito alinhado à BNCC. Para funcionar,
            coletamos e armazenamos as seguintes informações:</p>

            <ul>
              <li>📛 <strong>Nome do jogador</strong> – para exibir no ranking.</li>
              <li>🔑 <strong>Identificador anônimo</strong> – gerado automaticamente no seu dispositivo
              (sem dados pessoais sensíveis) para salvar seu progresso e evitar repetição de perguntas.</li>
              <li>🏆 <strong>Pontuação e fichas</strong> – armazenados no ranking público do jogo.</li>
            </ul>

            <p><strong>Não coletamos</strong> e-mail, senha, localização ou qualquer dado sensível.
            Os dados são armazenados no Firebase (Google) com segurança.</p>

            <p>Ao continuar, você (ou o responsável pela criança) autoriza o uso das informações
            acima conforme a <strong>LGPD (Lei 13.709/2018)</strong>.</p>

            <p className="consent-small">
              Para crianças menores de 13 anos, recomendamos que um responsável adulto leia
              e aceite este termo.
            </p>
          </div>

          <label className="consent-check">
            <input
              type="checkbox"
              checked={checked}
              onChange={e => setChecked(e.target.checked)}
            />
            <span>
              Li e concordo com os termos acima. Autorizo o uso das informações descritas.
            </span>
          </label>

          <button
            className={`btn btn-primary btn-lg ${!checked ? 'btn-disabled' : ''}`}
            onClick={handleStart}
            disabled={!checked}
          >
            🚀 Vamos Começar a Aventura!
          </button>
        </div>
      </div>
    </div>
  );
}
