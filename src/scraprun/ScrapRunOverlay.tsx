import ScrapRunScene from './ScrapRunScene';
import { useGameStore } from '../core/GameState';

export default function ScrapRunOverlay() {
  const endRun = useGameStore((s) => s.endScrapRun);
  const upgrades = useGameStore((s) => s.upgrades);

  const handleGameOver = (score: number, collected: number) => {
    endRun(score, collected);
  };

  return (
    <div className="fixed inset-0 z-50">
      <ScrapRunScene onGameOver={handleGameOver} upgrades={upgrades} />
      <button
        className="absolute top-4 left-4 z-10 bg-red-600 hover:bg-red-700 px-6 py-3 rounded font-bold text-white"
        onClick={() => handleGameOver(0, 0)}
      >
        ABORT RUN
      </button>
    </div>
  );
}
