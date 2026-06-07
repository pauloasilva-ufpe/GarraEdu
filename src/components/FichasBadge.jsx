import { useGame } from '../context/GameContext';

export default function FichasBadge() {
  const { state } = useGame();
  if (state.fichas === 0) return null;
  return (
    <div className="fichas-badge-float">
      🎫 <strong>{state.fichas}</strong>
    </div>
  );
}
