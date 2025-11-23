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
    </div>
  );
}
