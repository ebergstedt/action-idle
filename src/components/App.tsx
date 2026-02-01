import { BattleView } from './battle';
import { DARK_THEME } from '../core/theme/colors';

function App() {
  return (
    <div className="h-screen w-screen bg-gray-900 text-gray-100 flex flex-col overflow-hidden">
      <header className="text-center py-3 flex-shrink-0 border-b border-gray-800 bg-gray-900/50">
        <h1 className="text-2xl font-bold" style={{ color: DARK_THEME.accentGold }}>
          Total Idle
        </h1>
      </header>

      <main className="flex-1 p-6 overflow-hidden">
        <BattleView />
      </main>
    </div>
  );
}

export default App;
