import { useEffect, useState } from 'react';
import { useGame, SCREENS } from '../context/GameContext';
import { getTopRanking } from '../services/firebase';

const MEDALS = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];

export default function RankingScreen() {
  const { state, dispatch } = useGame();
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTopRanking(5)
      .then(data => { setRanking(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="screen ranking-screen">
      <div className="ranking-card">
        <h2 className="ranking-title">🏆 Hall da Fama — Top 5</h2>
        <p className="ranking-sub">Os maiores caçadores de bichinhos do GarraEdu!</p>

        {loading ? (
          <div className="loading-card"><div className="spinner">🔄</div></div>
        ) : ranking.length === 0 ? (
          <p className="ranking-empty">Ninguém no ranking ainda. Seja o primeiro! 🌟</p>
        ) : (
          <div className="ranking-list">
            {ranking.map((player, i) => (
              <div
                key={i}
                className={`ranking-item ${player.player_name === state.playerName ? 'ranking-item-me' : ''}`}
              >
                <span className="rank-medal">{MEDALS[i]}</span>
                <div className="rank-info">
                  <span className="rank-name">
                    {player.player_name}
                    {player.player_name === state.playerName && ' (você!)'}
                  </span>
                  <span className="rank-detail">
                    🎫 {player.fichas_totais} fichas · ⭐ {player.total_score} pts
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="ranking-actions">
          <button
            className="btn btn-primary"
            onClick={() => dispatch({ type: 'RESTART_ROUND' })}
          >
            🔄 Jogar Novamente
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => dispatch({ type: 'GO_TO', payload: SCREENS.CLAW })}
          >
            🎮 Mais fichas disponíveis? Ir para a Garra!
          </button>
        </div>
      </div>
    </div>
  );
}
