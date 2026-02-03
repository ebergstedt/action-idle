import { BattleView } from './battle';
import { UI_COLORS } from '../core/theme/colors';

function App() {
  return (
    <div
      className="h-screen w-screen flex flex-col overflow-hidden"
      style={{
        backgroundColor: UI_COLORS.parchmentBase,
        color: UI_COLORS.inkBrown,
      }}
    >
      <main className="flex-1 p-4 overflow-hidden">
        <BattleView />
      </main>
    </div>
  );
}

export default App;
