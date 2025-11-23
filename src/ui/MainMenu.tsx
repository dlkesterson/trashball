import { useEffect, useMemo, useState } from 'react';
import { useGameStore } from '../core/GameState';

const BASE_COOLDOWN_MS = 2 * 60 * 1000; // 2 minutes for MVP loop

export default function MainMenu() {
  const {
    energy,
    scrap,
    charge,
    lastRunTime,
    bestRunScore,
    prestigeLevel,
    cosmicEssence,
    upgrades,
    startScrapRun,
    prestige,
  } = useGameStore();

  const cooldownReduction = (upgrades.warpCooldown ?? 0) * 2 * 60 * 1000;
  const effectiveCooldown = useMemo(
    () => Math.max(30_000, BASE_COOLDOWN_MS - cooldownReduction),
    [cooldownReduction]
  );

  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = Math.max(0, effectiveCooldown - (Date.now() - lastRunTime));
      setCooldownRemaining(remaining);
    }, 100);

    return () => clearInterval(interval);
  }, [lastRunTime, effectiveCooldown]);

  const canLaunch = cooldownRemaining === 0;
  const canPrestige = energy >= 10000;

  const formatTime = (ms: number) => {
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <div className="fixed top-6 left-1/2 -translate-x-1/2 text-center z-10">
        <div className="px-8 py-4 rounded-2xl border border-purple-500/60 bg-white/5 backdrop-blur-lg shadow-[0_10px_40px_rgba(108,35,255,0.25)]">
          <div className="text-purple-300 text-sm mb-1 tracking-wide">ENERGY</div>
          <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 font-mono drop-shadow">
            {Math.floor(energy)}
          </div>
          <div className="text-xs text-gray-400 mt-1">{(charge * 100).toFixed(0)}% charged</div>
        </div>
      </div>

      <div className="fixed top-28 left-1/2 -translate-x-1/2 z-10">
        <div className="w-64 h-4 bg-gray-800 rounded-full overflow-hidden border-2 border-purple-500">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-100"
            style={{ width: `${charge * 100}%` }}
          />
        </div>
      </div>

      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-10">
        <div className="px-8 py-6 rounded-2xl border-2 border-purple-600/60 bg-white/5 backdrop-blur-lg shadow-[0_10px_40px_rgba(108,35,255,0.25)]">
          <div className="flex gap-8 items-center">
            <div className="text-center">
              <button
                onClick={startScrapRun}
                disabled={!canLaunch}
                className={`px-8 py-4 rounded-lg font-bold text-lg transition-all ${
                  canLaunch
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shadow-purple-500/50 border-0'
                    : 'bg-gray-700 text-gray-500 cursor-not-allowed border border-gray-700'
                }`}
              >
                {canLaunch ? 'LAUNCH SCRAP RUN' : `COOLDOWN ${formatTime(cooldownRemaining)}`}
              </button>
              <div className="text-xs text-gray-400 mt-2">
                {Math.floor(scrap)} Scrap | Best: {bestRunScore}
              </div>
            </div>

            <div className="text-center border-l-2 border-purple-700 pl-8">
              <button
                onClick={prestige}
                disabled={!canPrestige}
                className={`px-6 py-3 rounded-lg font-bold transition-all ${
                  canPrestige
                    ? 'bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 text-white'
                    : 'bg-gray-700 text-gray-500 cursor-not-allowed border border-gray-700'
                }`}
              >
                PRESTIGE
              </button>
              <div className="text-xs text-gray-400 mt-2">
                Level {prestigeLevel} | ✦ {cosmicEssence} Essence
              </div>
              <div className="text-xs text-yellow-600 mt-1">
                {canPrestige
                  ? `+${Math.floor(Math.sqrt(energy / 10000))} Essence`
                  : 'Need 10,000 energy'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-6 right-6 p-4 rounded-2xl border border-purple-500 bg-white/5 backdrop-blur-lg shadow-[0_10px_40px_rgba(108,35,255,0.25)] text-purple-200 text-sm max-w-xs">
        <div className="font-bold mb-2">Controls</div>
        <div>• Hold anywhere to charge the orb</div>
        <div>• Charge = more energy generation</div>
        <div>• Scrap Runs grant upgrades</div>
        <div className="mt-2 text-xs text-gray-400">
          Higher charge when launching gives better scrap multiplier.
        </div>
      </div>
    </>
  );
}
