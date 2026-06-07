import { useGame, SCREENS } from './context/GameContext';
import ConsentScreen from './screens/ConsentScreen';
import IdentificationScreen from './screens/IdentificationScreen';
import SetupScreen from './screens/SetupScreen';
import StudyScreen from './screens/StudyScreen';
import WarmupScreen from './screens/WarmupScreen';
import QuizScreen from './screens/QuizScreen';
import ResultScreen from './screens/ResultScreen';
import ClawGameScreen from './screens/ClawGameScreen';
import RankingScreen from './screens/RankingScreen';
import FichasBadge from './components/FichasBadge';

export default function App() {
  const { state } = useGame();

  const screenMap = {
    [SCREENS.CONSENT]: <ConsentScreen />,
    [SCREENS.IDENTIFICATION]: <IdentificationScreen />,
    [SCREENS.SETUP]: <SetupScreen />,
    [SCREENS.STUDY]: <StudyScreen />,
    [SCREENS.WARMUP]: <WarmupScreen />,
    [SCREENS.QUIZ]: <QuizScreen />,
    [SCREENS.RESULT]: <ResultScreen />,
    [SCREENS.CLAW]: <ClawGameScreen />,
    [SCREENS.RANKING]: <RankingScreen />,
  };

  const showBadge = ![SCREENS.CONSENT, SCREENS.IDENTIFICATION].includes(state.screen);

  return (
    <div className="app-wrapper">
      {showBadge && <FichasBadge />}
      <div className="screen-container">
        {screenMap[state.screen]}
      </div>
    </div>
  );
}
