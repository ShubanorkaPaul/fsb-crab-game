import GameCanvas from './game/GameCanvas';

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 flex flex-col items-center justify-center p-4">
      {/* Title */}
      <div className="text-center mb-4">
        <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-amber-400 to-red-500 mb-1 tracking-wider">
          🦀 FSB CRAB 🦀
        </h1>
        <p className="text-amber-400 text-lg md:text-xl font-mono tracking-widest">
          AMBERLAND HUNTER
        </p>
      </div>

      {/* Game Canvas */}
      <GameCanvas />

      {/* Controls info */}
      <div className="mt-4 text-gray-400 text-sm text-center font-mono space-y-1">
        <p>
          <span className="text-amber-400">←→</span> or{' '}
          <span className="text-amber-400">A/D</span> — Move |{' '}
          <span className="text-amber-400">↑/W/Space</span> — Jump
        </p>
        <p className="text-gray-500">
          Collect all 🍺 Amberland beer cans! Jump on enemies to defeat them!
        </p>
      </div>

      {/* Footer */}
      <div className="mt-6 text-gray-600 text-xs font-mono">
        <p>Made with 🦀 and ❤️ | A totally serious game</p>
      </div>
    </div>
  );
}
