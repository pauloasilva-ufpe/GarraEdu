import { useState } from 'react';

// ── Matching Question Component ───────────────────────────────────────────
function MatchingQuestion({ question: q, answered, onAnswer }) {
  const [selectedLeft, setSelectedLeft] = useState(null);
  const [matches, setMatches] = useState({}); // { leftItem: rightItem }
  const [wrongPair, setWrongPair] = useState(null);

  const leftItems = q.pairs.map(p => p.left);
  const rightItems = [...q.pairs.map(p => p.right)].sort(() => Math.random() - 0.5);
  // keep shuffled order stable across renders
  const [shuffledRight] = useState(() => [...q.pairs.map(p => p.right)].sort(() => Math.random() - 0.5));

  const correctMap = Object.fromEntries(q.pairs.map(p => [p.left, p.right]));
  const matchedRights = Object.values(matches);

  function handleLeft(item) {
    if (answered !== null) return;
    setSelectedLeft(item === selectedLeft ? null : item);
  }

  function handleRight(item) {
    if (answered !== null) return;
    if (!selectedLeft) return;
    if (matchedRights.includes(item)) return;

    const newMatches = { ...matches, [selectedLeft]: item };
    setMatches(newMatches);
    setSelectedLeft(null);

    // If all pairs matched, check correctness
    if (Object.keys(newMatches).length === q.pairs.length) {
      const allCorrect = Object.entries(newMatches).every(
        ([l, r]) => correctMap[l] === r
      );
      onAnswer(allCorrect ? 'correct' : 'wrong');
    }
  }

  function handleReset() {
    setMatches({});
    setSelectedLeft(null);
  }

  const allMatched = Object.keys(matches).length === q.pairs.length;

  return (
    <div className="question-card">
      <p className="question-text">{q.question}</p>
      <p className="match-hint">💡 Clique em um item da esquerda, depois no correspondente da direita!</p>

      <div className="matching-grid">
        {/* Left column */}
        <div className="matching-col">
          <p className="matching-col-label">Coluna A</p>
          {leftItems.map((item, i) => {
            const isMatched = matches[item] !== undefined;
            const isSelected = selectedLeft === item;
            return (
              <button
                key={i}
                className={`match-btn match-left ${isSelected ? 'match-selected' : ''} ${isMatched ? 'match-done' : ''} ${answered !== null && isMatched && correctMap[item] === matches[item] ? 'match-correct' : ''} ${answered !== null && isMatched && correctMap[item] !== matches[item] ? 'match-wrong' : ''}`}
                onClick={() => handleLeft(item)}
                disabled={answered !== null || isMatched}
              >
                {item}
                {isMatched && <span className="match-arrow"> → {matches[item]}</span>}
              </button>
            );
          })}
        </div>

        {/* Right column */}
        <div className="matching-col">
          <p className="matching-col-label">Coluna B</p>
          {shuffledRight.map((item, i) => {
            const isMatched = matchedRights.includes(item);
            return (
              <button
                key={i}
                className={`match-btn match-right ${isMatched ? 'match-done' : ''} ${selectedLeft ? 'match-right-active' : ''}`}
                onClick={() => handleRight(item)}
                disabled={answered !== null || isMatched}
              >
                {item}
              </button>
            );
          })}
        </div>
      </div>

      {Object.keys(matches).length > 0 && answered === null && (
        <button className="btn-reset-match" onClick={handleReset}>↩️ Recomeçar associação</button>
      )}
    </div>
  );
}

// ── Main QuestionCard ─────────────────────────────────────────────────────
export default function QuestionCard({ question: q, selected, answered, onAnswer, isMulti }) {
  if (!q) return null;

  if (q.type === 'matching') {
    return (
      <MatchingQuestion
        question={q}
        answered={answered}
        onAnswer={onAnswer}
      />
    );
  }

  return (
    <div className="question-card">
      {isMulti && (
        <p className="multi-hint">💡 Selecione TODAS as opções corretas!</p>
      )}
      <p className="question-text">{q.question}</p>
      <div className="options-grid">
        {q.options?.map((opt, i) => {
          const isSelected = isMulti
            ? Array.isArray(selected) && selected.includes(opt)
            : selected === opt;

          let cls = 'option-btn';
          if (answered !== null) {
            const isCorrectOpt = Array.isArray(q.correct)
              ? q.correct.includes(opt)
              : opt === q.correct;
            if (isCorrectOpt) cls += ' option-correct';
            else if (isSelected && !isCorrectOpt) cls += ' option-wrong';
          } else if (isSelected) {
            cls += ' option-selected';
          }

          return (
            <button
              key={i}
              className={cls}
              onClick={() => onAnswer(opt)}
              disabled={answered !== null && !isMulti}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}
