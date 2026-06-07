export default function QuestionCard({ question: q, selected, answered, onAnswer, isMulti }) {
  if (!q) return null;

  if (q.type === 'matching') {
    return (
      <div className="question-card">
        <p className="question-text">{q.question}</p>
        <div className="matching-pairs">
          {q.pairs?.map((pair, i) => (
            <div key={i} className="matching-row">
              <span className="matching-left">{pair.left}</span>
              <span className="matching-arrow">↔️</span>
              <span className="matching-right">{pair.right}</span>
            </div>
          ))}
        </div>
        {answered === null && (
          <button className="btn btn-primary" onClick={() => onAnswer('confirmed')}>
            ✅ Entendi a associação!
          </button>
        )}
      </div>
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
