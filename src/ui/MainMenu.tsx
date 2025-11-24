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
    lastSaveAt,
    startScrapRun,
    prestige,
  } = useGameStore();

  const cooldownReduction = (upgrades.warpCooldown ?? 0) * 2 * 60 * 1000;
  const effectiveCooldown = useMemo(
    () => Math.max(30_000, BASE_COOLDOWN_MS - cooldownReduction),
    [cooldownReduction]
  );

  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [lastSaveLabel, setLastSaveLabel] = useState('Just now');

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = Math.max(0, effectiveCooldown - (Date.now() - lastRunTime));
      setCooldownRemaining(remaining);
    }, 100);

    return () => clearInterval(interval);
  }, [lastRunTime, effectiveCooldown]);

  useEffect(() => {
    const updateLabel = () => {
      if (!lastSaveAt) {
        setLastSaveLabel('Pending');
        return;
      }
      const diff = Date.now() - lastSaveAt;
      if (diff < 15_000) {
        setLastSaveLabel('Just now');
      } else if (diff < 60_000) {
        setLastSaveLabel(`${Math.floor(diff / 1000)}s ago`);
      } else if (diff < 3_600_000) {
        setLastSaveLabel(`${Math.floor(diff / 60000)}m ago`);
      } else {
        setLastSaveLabel(`${Math.floor(diff / 3_600_000)}h ago`);
      }
    };
    updateLabel();
    const interval = setInterval(updateLabel, 10_000);
    return () => clearInterval(interval);
  }, [lastSaveAt]);

  const canLaunch = cooldownRemaining === 0;
  const canPrestige = energy >= 10000;

  const formatTime = (ms: number) => {
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col justify-end p-3 sm:p-4">
      <div className="pointer-events-auto w-full max-w-2xl mx-auto space-y-3">
        <div className="rounded-2xl border border-lime-500/15 bg-black/60 backdrop-blur-md shadow-xl shadow-black/30 p-3 sm:p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[11px] uppercase tracking-[0.2em] text-lime-300">
                Trashball Energy
              </div>
            </div>
            <div className="text-xs text-slate-400 text-right">
              <div className="font-mono text-slate-200">{(charge * 100).toFixed(0)}%</div>
              <div className="text-[10px]">Charged</div>
            </div>
          </div>

          <div className="mt-2 h-2 rounded-full bg-slate-900 overflow-hidden border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-lime-400 to-emerald-500 transition-all duration-150"
              style={{ width: `${Math.min(100, charge * 100)}%` }}
            />
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-300">
            <span className="px-2 py-1 rounded-full bg-lime-500/10 text-lime-200 font-mono">
              Scrap: {Math.floor(scrap)}
            </span>
            <span className="px-2 py-1 rounded-full bg-slate-800 text-slate-200">
              Best: {bestRunScore}
            </span>
            <span className="px-2 py-1 rounded-full bg-amber-500/10 text-amber-200">
              Prestige {prestigeLevel} / Essence {cosmicEssence}
            </span>
            <span className="px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-200 border border-emerald-400/30">
              Save: {lastSaveLabel}
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-black/70 backdrop-blur-md shadow-lg p-3 sm:p-4 space-y-2">
          <button
            onClick={startScrapRun}
            disabled={!canLaunch}
            className={`w-full py-3 sm:py-3.5 rounded-xl text-base sm:text-lg font-semibold tracking-wide transition-all active:scale-[0.99] ${
              canLaunch
                ? 'bg-gradient-to-r from-lime-400 to-emerald-500 text-black shadow-[0_8px_28px_rgba(74,222,128,0.3)]'
                : 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed'
            }`}
          >
            {canLaunch ? 'Start Trash Run' : `Cooldown ${formatTime(cooldownRemaining)}`}
          </button>

          <button
            onClick={prestige}
            disabled={!canPrestige}
            className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-all active:scale-[0.99] ${
              canPrestige
                ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-black shadow-[0_8px_20px_rgba(251,191,36,0.25)]'
                : 'bg-slate-900 text-slate-500 border border-slate-800 cursor-not-allowed'
            }`}
          >
            {canPrestige
              ? `Prestige for +${Math.floor(Math.sqrt(energy / 10000))} essence`
              : 'Prestige locked'}
          </button>
        </div>
      </div>
    </div>
  );
}
