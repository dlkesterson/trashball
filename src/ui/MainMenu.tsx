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
    <div className="pointer-events-none absolute inset-0 flex flex-col justify-end p-4 sm:p-6">
      <div className="pointer-events-auto w-full max-w-3xl mx-auto space-y-3 sm:space-y-4">
        <div className="rounded-3xl border border-lime-500/25 bg-black/70 backdrop-blur-lg shadow-2xl shadow-lime-900/30 p-4 sm:p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-lime-300">Trashball Energy Yard</div>
              <div className="text-[11px] text-slate-400 mt-1">
                Hold to overcharge the trashball. Release to launch and harvest junk from the belt.
              </div>
            </div>
            <div className="text-right">
              <div className="text-[11px] text-slate-400 uppercase tracking-wide">Burn Output</div>
              <div className="text-3xl sm:text-4xl font-bold text-lime-200 font-mono">
                {Math.floor(energy)}
              </div>
              <div className="text-xs text-slate-400 mt-1">{(charge * 100).toFixed(0)}% charged</div>
            </div>
          </div>

          <div className="mt-3 h-2 rounded-full bg-slate-900 overflow-hidden border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-lime-400 to-emerald-400 transition-all duration-150"
              style={{ width: `${Math.min(100, charge * 100)}%` }}
            />
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-300">
            <span className="px-2 py-1 rounded-full bg-lime-500/10 text-lime-300 font-mono">
              Trash Hauled: {Math.floor(scrap)}
            </span>
            <span className="px-2 py-1 rounded-full bg-slate-800 text-slate-200">
              Best Burn Output: {bestRunScore}
            </span>
            <span className="px-2 py-1 rounded-full bg-amber-500/10 text-amber-300">
              Prestige {prestigeLevel} | Essence {cosmicEssence}
            </span>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-black/70 backdrop-blur-lg shadow-xl p-4 sm:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-[1.6fr_1fr] gap-3 sm:gap-4 items-stretch">
            <button
              onClick={startScrapRun}
              disabled={!canLaunch}
              className={`w-full py-4 sm:py-5 rounded-2xl text-lg font-semibold tracking-wide transition-all active:scale-[0.99] ${
                canLaunch
                  ? 'bg-gradient-to-r from-lime-400 to-emerald-500 text-black shadow-[0_10px_40px_rgba(74,222,128,0.35)]'
                  : 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed'
              }`}
            >
              {canLaunch ? 'Start Trash Run' : `Cooldown ${formatTime(cooldownRemaining)}`}
            </button>

            <div className="flex flex-col gap-2 text-sm text-slate-200">
              <button
                onClick={prestige}
                disabled={!canPrestige}
                className={`w-full py-3 rounded-xl font-semibold transition-all active:scale-[0.99] ${
                  canPrestige
                    ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-black shadow-[0_10px_30px_rgba(251,191,36,0.35)]'
                    : 'bg-slate-900 text-slate-500 border border-slate-800 cursor-not-allowed'
                }`}
              >
                Ignite Prestige Core
              </button>
              <div className="rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2 text-xs leading-relaxed text-slate-300">
                {canPrestige
                  ? `Ready to mint +${Math.floor(Math.sqrt(energy / 10000))} essence from stored burn output.`
                  : 'Bank 10,000+ burn output to distill new essence.'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
