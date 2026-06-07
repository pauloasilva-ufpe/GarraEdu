import { createContext, useContext, useReducer, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

export const SCREENS = {
  CONSENT: 'consent',
  IDENTIFICATION: 'identification',
  SETUP: 'setup',
  STUDY: 'study',
  WARMUP: 'warmup',
  QUIZ: 'quiz',
  RESULT: 'result',
  CLAW: 'claw',
  RANKING: 'ranking',
};

const initialState = {
  screen: SCREENS.CONSENT,
  uuid: null,
  playerName: '',
  grade: '',
  subject: '',
  level: '',
  content: '',
  studyData: null,
  warmupQuestions: [],
  quizQuestions: [],
  currentQuestionIndex: 0,
  answers: [],
  fichas: 0,
  totalScore: 0,
  clawBatch: null,       // batchId das perguntas desta rodada
  sessionFichas: 0,      // fichas ganhas nesta sessão
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_UUID':
      return { ...state, uuid: action.payload };
    case 'SET_PLAYER':
      return { ...state, playerName: action.payload };
    case 'SET_CONFIG':
      return { ...state, ...action.payload };
    case 'SET_STUDY':
      return { ...state, studyData: action.payload };
    case 'SET_WARMUP_QUESTIONS':
      return { ...state, warmupQuestions: action.payload };
    case 'SET_QUIZ_QUESTIONS':
      return { ...state, quizQuestions: action.payload, currentQuestionIndex: 0, answers: [] };
    case 'SET_CLAW_BATCH':
      return { ...state, clawBatch: action.payload };
    case 'ANSWER_QUESTION':
      return { ...state, answers: [...state.answers, action.payload] };
    case 'NEXT_QUESTION':
      return { ...state, currentQuestionIndex: state.currentQuestionIndex + 1 };
    case 'EARN_FICHAS':
      return {
        ...state,
        fichas: state.fichas + action.payload,
        sessionFichas: state.sessionFichas + action.payload,
        totalScore: state.totalScore + action.score,
      };
    case 'USE_FICHA':
      return { ...state, fichas: Math.max(0, state.fichas - 1) };
    case 'GO_TO':
      return { ...state, screen: action.payload };
    case 'RESTART_ROUND':
      return {
        ...state,
        screen: SCREENS.SETUP,
        studyData: null,
        warmupQuestions: [],
        quizQuestions: [],
        currentQuestionIndex: 0,
        answers: [],
        clawBatch: null,
      };
    default:
      return state;
  }
}

const GameContext = createContext(null);

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Gera ou recupera UUID do localStorage na primeira montagem
  useEffect(() => {
    let id = localStorage.getItem('garraedu_uuid');
    if (!id) {
      id = uuidv4();
      localStorage.setItem('garraedu_uuid', id);
    }
    const savedName = localStorage.getItem('garraedu_name') || '';
    dispatch({ type: 'SET_UUID', payload: id });
    if (savedName) dispatch({ type: 'SET_PLAYER', payload: savedName });
  }, []);

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  return useContext(GameContext);
}
