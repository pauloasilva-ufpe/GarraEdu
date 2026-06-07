import { useState, useEffect, useRef, useCallback } from 'react';
import { useGame, SCREENS } from '../context/GameContext';
import { playSound } from '../services/audioManager';

const ANIMALS = ['🐻', '🐼', '🐨', '🦊', '🐰', '🐸', '🐯', '🦁', '🐶', '🐱', '🦄', '🐙'];
const WIN_PROB = 0.65; // 65% de chance de pegar o bichinho

function randomAnimal() {
  return ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
}

function generateAnimals(n = 6) {
  return Array.from({ length: n }, (_, i) => ({
    id: i,
    emoji: randomAnimal(),
    x: 10 + (i % 3) * 30 + Math.random() * 10,
    y: 50 + Math.floor(i / 3) * 28,
  }));
}

export default function ClawGameScreen() {
  const { state, dispatch } = useGame();
  const [animals, setAnimals] = useState(() => generateAnimals());
  const [clawX, setClawX] = useState(50); // percent
  const [phase, setPhase] = useState('aim'); // aim | dropping | grabbing | lifting | result
  const [timeLeft, setTimeLeft] = useState(60);
  const [caught, setCaught] = useState(null);
  const [fichasLeft, setFichasLeft] = useState(state.fichas);
  const [results, setResults] = useState([]);
  const timerRef = useRef(null);
  const clawRef = useRef({ x: 50 });

  // Timer de 60s
  useEffect(() => {
    if (phase !== 'aim' || fichasLeft <= 0) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { dropClaw(); return 60; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase, fichasLeft]);

  const dropClaw = useCallback(() => {
    if (phase !== 'aim') return;
    clearInterval(timerRef.current);
    playSound('claw_drop');
    setPhase('dropping');
    dispatch({ type: 'USE_FICHA' });
    setFichasLeft(f => f - 1);

    const win = Math.random() < WIN_PROB;
    const targetAnimal = animals.find(a =>
      Math.abs(a.x - clawRef.current.x) < 20
    );

    setTimeout(() => {
      setPhase('grabbing');
      if (win && targetAnimal) {
        setCaught(targetAnimal.emoji);
        setAnimals(prev => prev.filter(a => a.id !== targetAnimal.id));
        playSound('win');
      } else {
        setCaught(null);
      }
      setTimeout(() => {
        setPhase('lifting');
        setTimeout(() => {
          setResults(prev => [...prev, { caught: win && !!targetAnimal }]);
          if (fichasLeft - 1 <= 0) {
            setPhase('done');
          } else {
            setPhase('aim');
            setTimeLeft(60);
            setCaught(null);
          }
        }, 800);
      }, 600);
    }, 1000);
  }, [phase, animals, fichasLeft]);

  function handleSlider(e) {
    if (phase !== 'aim') return;
    const val = Number(e.target.value);
    setClawX(val);
    clawRef.current.x = val;
  }

  function handleTouch(e) {
    if (phase !== 'aim') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.touches[0].clientX - rect.left) / rect.width) * 100;
    const clamped = Math.max(5, Math.min(95, x));
    setClawX(clamped);
    clawRef.current.x = clamped;
  }

  const phaseLabel = {
    aim: `🕹️ Mire a garra! ${timeLeft}s restantes`,
    dropping: '⬇️ A garra está descendo...',
    grabbing: caught ? '😱 Pegou alguma coisa!' : '😬 Sem sorte dessa vez...',
    lifting: caught ? `🎉 Subindo com o ${caught}!` : '⬆️ Voltando...',
    done: '🏁 Suas tentativas acabaram!',
  }[phase];

  return (
    <div className="screen claw-screen">
      <div className="claw-card">
        <h2 className="claw-title">🎰 Máquina da Garra</h2>
        <div className="claw-status">
          <span>{phaseLabel}</span>
          <span>🎫 {fichasLeft} ficha{fichasLeft !== 1 ? 's' : ''} restante{fichasLeft !== 1 ? 's' : ''}</span>
        </div>

        {/* Máquina da garra */}
        <div
          className="claw-machine"
          onTouchMove={handleTouch}
          onMouseMove={e => {
            if (e.buttons !== 1) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            setClawX(Math.max(5, Math.min(95, x)));
            clawRef.current.x = Math.max(5, Math.min(95, x));
          }}
        >
          {/* Trilho */}
          <div className="claw-rail" />

          {/* Garra */}
          <div
            className={`claw-assembly ${phase === 'dropping' ? 'claw-drop' : ''} ${phase === 'lifting' ? 'claw-lift' : ''}`}
            style={{ left: `${clawX}%` }}
          >
            <div className="claw-wire" />
            <div className="claw-head">
              <span className="claw-prong left">╱</span>
              <span className="claw-body">🔧</span>
              <span className="claw-prong right">╲</span>
            </div>
            {caught && phase === 'lifting' && (
              <span className="claw-caught">{caught}</span>
            )}
          </div>

          {/* Bichinhos na máquina */}
          <div className="claw-pit">
            {animals.map(a => (
              <span
                key={a.id}
                className="animal-plush"
                style={{ left: `${a.x}%`, top: `${a.y}%` }}
              >
                {a.emoji}
              </span>
            ))}
          </div>
        </div>

        {/* Controles */}
        {phase === 'aim' && fichasLeft > 0 && (
          <div className="claw-controls">
            <input
              type="range"
              min="5"
              max="95"
              value={clawX}
              onChange={handleSlider}
              className="claw-slider"
            />
            <button className="btn btn-primary btn-lg claw-drop-btn" onClick={dropClaw}>
              ⬇️ SOLTAR A GARRA!
            </button>
          </div>
        )}

        {/* Resultado acumulado */}
        {results.length > 0 && (
          <div className="claw-results">
            <h3>Suas capturas:</h3>
            <div className="claw-results-list">
              {results.map((r, i) => (
                <span key={i} className={`result-dot ${r.caught ? 'result-win' : 'result-lose'}`}>
                  {r.caught ? '✅' : '❌'}
                </span>
              ))}
            </div>
          </div>
        )}

        {(phase === 'done' || fichasLeft <= 0) && (
          <div className="claw-end">
            <p>🎊 Você pegou <strong>{results.filter(r => r.caught).length}</strong> bichinho(s)!</p>
            <div className="claw-end-actions">
              <button
                className="btn btn-primary"
                onClick={() => dispatch({ type: 'GO_TO', payload: SCREENS.RANKING })}
              >
                🏆 Ver Ranking
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => dispatch({ type: 'RESTART_ROUND' })}
              >
                🔄 Jogar Novamente
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
