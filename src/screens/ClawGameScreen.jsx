import { useState, useEffect, useRef, useCallback } from 'react';
import { useGame, SCREENS } from '../context/GameContext';
import { playSound } from '../services/audioManager';

const ANIMALS = [
  { emoji: '🐻', name: 'Urso' },
  { emoji: '🐼', name: 'Panda' },
  { emoji: '🐨', name: 'Coala' },
  { emoji: '🦊', name: 'Raposa' },
  { emoji: '🐰', name: 'Coelho' },
  { emoji: '🐸', name: 'Sapo' },
  { emoji: '🐯', name: 'Tigre' },
  { emoji: '🦁', name: 'Leão' },
  { emoji: '🐶', name: 'Cachorro' },
  { emoji: '🐱', name: 'Gato' },
  { emoji: '🦄', name: 'Unicórnio' },
  { emoji: '🐙', name: 'Polvo' },
];

function generateAnimals(n = 6) {
  const cols = 3;
  return Array.from({ length: n }, (_, i) => ({
    id: i,
    ...ANIMALS[Math.floor(Math.random() * ANIMALS.length)],
    col: i % cols,
    row: Math.floor(i / cols),
  }));
}

export default function ClawGameScreen() {
  const { state, dispatch } = useGame();
  const [animals, setAnimals] = useState(() => generateAnimals());
  const [clawX, setClawX] = useState(50);
  const [phase, setPhase] = useState('aim');
  const [timeLeft, setTimeLeft] = useState(60);
  const [caught, setCaught] = useState(null);
  const [fichasLeft, setFichasLeft] = useState(state.fichas);
  const [results, setResults] = useState([]);
  const [message, setMessage] = useState('');
  const timerRef = useRef(null);
  const clawXRef = useRef(50);
  const machineRef = useRef(null);
  const isDragging = useRef(false);

  const WIN_PROB = 0.65;

  // ── Timer ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'aim' || fichasLeft <= 0) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { triggerDrop(); return 60; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase, fichasLeft]);

  // ── Keyboard control ─────────────────────────────────────────────────────
  useEffect(() => {
    function onKey(e) {
      if (phase !== 'aim') return;
      if (e.key === 'ArrowLeft') moveClaw(Math.max(5, clawXRef.current - 3));
      if (e.key === 'ArrowRight') moveClaw(Math.min(95, clawXRef.current + 3));
      if (e.key === ' ') { e.preventDefault(); triggerDrop(); }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase]);

  function moveClaw(x) {
    clawXRef.current = x;
    setClawX(x);
  }

  // ── Mouse/Touch handlers ─────────────────────────────────────────────────
  function getXPercent(clientX) {
    if (!machineRef.current) return 50;
    const rect = machineRef.current.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    return Math.max(5, Math.min(95, x));
  }

  function handleMouseMove(e) {
    if (phase !== 'aim') return;
    moveClaw(getXPercent(e.clientX));
  }

  function handleTouchMove(e) {
    if (phase !== 'aim') return;
    e.preventDefault();
    moveClaw(getXPercent(e.touches[0].clientX));
  }

  // ── Drop logic ───────────────────────────────────────────────────────────
  const triggerDrop = useCallback(() => {
    if (phase !== 'aim' || fichasLeft <= 0) return;
    clearInterval(timerRef.current);
    setPhase('dropping');
    setMessage('⬇️ A garra desce...');
    dispatch({ type: 'USE_FICHA' });
    setFichasLeft(f => f - 1);
    playSound('claw_drop');

    const currentX = clawXRef.current;
    const win = Math.random() < WIN_PROB;
    // Find nearest animal to claw position (col 0=15%, col 1=50%, col 2=85%)
    const colPositions = [15, 50, 85];
    const nearestCol = colPositions.reduce((best, pos, idx) =>
      Math.abs(pos - currentX) < Math.abs(colPositions[best] - currentX) ? idx : best, 0);
    const nearestAnimal = animals.find(a => a.col === nearestCol);

    setTimeout(() => {
      setPhase('grabbing');
      if (win && nearestAnimal) {
        setCaught(nearestAnimal);
        setMessage(`😱 Pegou o ${nearestAnimal.name}!`);
        setAnimals(prev => prev.filter(a => a.id !== nearestAnimal.id));
        playSound('win');
      } else {
        setCaught(null);
        setMessage('😬 Escorregou! Tente de novo...');
      }

      setTimeout(() => {
        setPhase('lifting');
        setTimeout(() => {
          const didCatch = win && !!nearestAnimal;
          setResults(prev => [...prev, { caught: didCatch, animal: didCatch ? nearestAnimal : null }]);
          setCaught(null);

          const remaining = fichasLeft - 1;
          if (remaining <= 0) {
            setPhase('done');
            setMessage('');
          } else {
            setPhase('aim');
            setTimeLeft(60);
            setMessage('');
          }
        }, 900);
      }, 700);
    }, 1100);
  }, [phase, animals, fichasLeft]);

  // ── Timer color ──────────────────────────────────────────────────────────
  const timerColor = timeLeft <= 10 ? '#ff4444' : timeLeft <= 20 ? '#ffaa00' : '#44ff88';

  return (
    <div className="screen claw-screen">
      <div className="claw-card">
        <h2 className="claw-title">🎰 Máquina da Garra</h2>

        {/* Instruções */}
        <div className="claw-instructions">
          <div className="instr-title">🕹️ Como jogar:</div>
          <div className="instr-row">
            <span>⬅️ ➡️ Arraste o controle abaixo para mover a garra</span>
          </div>
          <div className="instr-row">
            <span>⌨️ Ou use as teclas <strong>← →</strong> do teclado</span>
          </div>
          <div className="instr-row">
            <span>🔴 Clique em <strong>SOLTAR!</strong> para descer a garra</span>
          </div>
        </div>

        {/* Status bar */}
        <div className="claw-status-bar">
          <div className="claw-fichas-left">
            🎫 <strong>{fichasLeft}</strong> ficha{fichasLeft !== 1 ? 's' : ''}
          </div>
          {phase === 'aim' && fichasLeft > 0 && (
            <div className="claw-timer" style={{ color: timerColor }}>
              ⏱️ <strong>{timeLeft}s</strong>
            </div>
          )}
          {message && <div className="claw-message">{message}</div>}
        </div>

        {/* Máquina */}
        <div
          ref={machineRef}
          className="claw-machine-v2"
          onMouseMove={handleMouseMove}
          onTouchMove={handleTouchMove}
          onTouchStart={handleTouchMove}
        >
          {/* Estrutura da máquina */}
          <div className="machine-top-bar" />
          <div className="machine-side-left" />
          <div className="machine-side-right" />

          {/* Trilho */}
          <div className="machine-rail">
            <div className="rail-bar" />
            <div className="rail-shine" />
          </div>

          {/* Garra assembly */}
          <div
            className={`claw-v2 ${phase === 'dropping' ? 'claw-dropping' : ''} ${phase === 'lifting' ? 'claw-lifting' : ''}`}
            style={{ left: `${clawX}%` }}
          >
            <div className="claw-cable" />
            <div className="claw-motor" />
            <div className={`claw-fingers ${caught ? 'claw-closed' : 'claw-open'}`}>
              <div className="claw-finger claw-finger-left" />
              <div className="claw-finger claw-finger-right" />
            </div>
            {caught && (phase === 'lifting' || phase === 'grabbing') && (
              <div className="claw-prize">{caught.emoji}</div>
            )}
          </div>

          {/* Bichinhos */}
          <div className="machine-pit">
            <div className="pit-floor" />
            <div className="animals-grid">
              {animals.map(a => (
                <div key={a.id} className="animal-slot">
                  <div className="animal-plush-v2">
                    <span className="animal-emoji">{a.emoji}</span>
                    <span className="animal-name">{a.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Vidro reflexo */}
          <div className="machine-glass" />
        </div>

        {/* Slider de controle */}
        {phase === 'aim' && fichasLeft > 0 && (
          <div className="claw-controls-v2">
            <span className="slider-label">←</span>
            <input
              type="range"
              min="5"
              max="95"
              value={clawX}
              onChange={e => moveClaw(Number(e.target.value))}
              className="claw-slider-v2"
            />
            <span className="slider-label">→</span>
            <button className="btn-drop-v2" onClick={triggerDrop}>
              ⬇️ SOLTAR!
            </button>
          </div>
        )}

        {/* Resultados */}
        {results.length > 0 && (
          <div className="claw-results-v2">
            <h3>Capturas desta rodada:</h3>
            <div className="results-row">
              {results.map((r, i) => (
                <div key={i} className={`result-chip ${r.caught ? 'chip-win' : 'chip-lose'}`}>
                  {r.caught ? `${r.animal.emoji} +1` : '❌'}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Fim */}
        {phase === 'done' && (
          <div className="claw-end-v2">
            <div className="end-banner">
              🎊 Você capturou <strong>{results.filter(r => r.caught).length}</strong> de {results.length} bichinho(s)!
            </div>
            <div className="end-actions">
              <button className="btn btn-primary" onClick={() => dispatch({ type: 'GO_TO', payload: SCREENS.RANKING })}>
                🏆 Ver Ranking
              </button>
              <button className="btn btn-secondary" onClick={() => dispatch({ type: 'RESTART_ROUND' })}>
                🔄 Jogar Novamente
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
