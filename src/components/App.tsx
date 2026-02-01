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
      <header
        className="text-center py-3 flex-shrink-0"
        style={{
          borderBottom: `1px solid ${UI_COLORS.parchmentShadow}`,
          backgroundColor: UI_COLORS.parchmentDark,
        }}
      >
        <h1 className="text-2xl font-bold" style={{ color: UI_COLORS.black }}>
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
