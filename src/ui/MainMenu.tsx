import { useEffect, useMemo, useState, forwardRef, type RefObject } from 'react';
import { useGameStore } from '../core/GameState';
import UpgradePanel from './UpgradePanel';

const BASE_COOLDOWN_MS = 2 * 60 * 1000; // 2 minutes for MVP loop

type Props = {
  upgradePanelRef: RefObject<HTMLDivElement | null>;
  statsPanelRef: RefObject<HTMLDivElement | null>;
  isUpgradesOpen: boolean;
  isStatsOpen: boolean;
  openUpgrades: () => void;
  closeUpgrades: () => void;
  openStats: () => void;
  closeStats: () => void;
};

export default function MainMenu({
  upgradePanelRef,
  statsPanelRef,
  isUpgradesOpen,
  isStatsOpen,
  openUpgrades,
  closeUpgrades,
  openStats,
  closeStats,
}: Props) {
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
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <IconCircleButton label="Upgrades" onClick={openUpgrades} icon="UP" />
            <IconCircleButton label="Statistics" onClick={openStats} icon="ST" />
          </div>
          {canPrestige && (
            <div className="text-[11px] uppercase tracking-[0.2em] text-amber-200">
              Prestige ready
            </div>
          )}
        </div>

        <div className="h-2.5 rounded-full bg-slate-900/60 overflow-hidden shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-lime-400 via-emerald-400 to-emerald-600 transition-all duration-150"
            style={{ width: `${Math.min(100, charge * 100)}%` }}
          />
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

          {canPrestige && (
            <button
              onClick={prestige}
              className="w-full py-2.5 rounded-lg text-sm font-semibold transition-all active:scale-[0.99] bg-gradient-to-r from-amber-400 to-orange-500 text-black shadow-[0_8px_20px_rgba(251,191,36,0.25)]"
            >
              {`Prestige for +${Math.floor(Math.sqrt(energy / 10000))} essence`}
            </button>
          )}
        </div>
      </div>

      <UpgradePanel ref={upgradePanelRef} open={isUpgradesOpen} onClose={closeUpgrades} />
      <StatisticsPanel
        ref={statsPanelRef}
        open={isStatsOpen}
        onClose={closeStats}
        scrap={scrap}
        bestRunScore={bestRunScore}
        prestigeLevel={prestigeLevel}
        cosmicEssence={cosmicEssence}
        lastSaveLabel={lastSaveLabel}
      />
    </div>
  );
}

function IconCircleButton({
  icon,
  label,
  onClick,
}: {
  icon: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group flex items-center gap-2 rounded-full border border-slate-800 bg-black/50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-200 shadow-lg shadow-black/30 hover:border-lime-300/60 hover:text-lime-100 transition"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-base group-hover:bg-lime-500/15">
        {icon}
      </span>
      {label}
    </button>
  );
}

type StatsProps = {
  open: boolean;
  onClose: () => void;
  scrap: number;
  bestRunScore: number;
  prestigeLevel: number;
  cosmicEssence: number;
  lastSaveLabel: string;
};

type Accent = 'lime' | 'cyan' | 'amber' | 'emerald';

const StatisticsPanel = forwardRef<HTMLDivElement, StatsProps>(function StatisticsPanel(
  { open, onClose, scrap, bestRunScore, prestigeLevel, cosmicEssence, lastSaveLabel },
  panelRef
) {
  if (!open) return null;

  return (
    <div
      ref={panelRef}
      className="pointer-events-auto fixed inset-0 z-40 flex items-end sm:items-center justify-center"
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative m-4 w-full max-w-xl rounded-2xl border border-slate-800 bg-black/80 shadow-[0_20px_60px_rgba(0,0,0,0.45)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
          <div className="text-xs uppercase tracking-[0.24em] text-lime-200">Statistics</div>
          <button
            onClick={onClose}
            className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-[11px] font-semibold text-slate-200 hover:border-lime-300 hover:text-lime-100 transition"
          >
            Close
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4">
          <StatTile label="Scrap" value={Math.floor(scrap).toLocaleString()} accent="lime" />
          <StatTile label="Best Run" value={bestRunScore.toLocaleString()} accent="cyan" />
          <StatTile
            label="Prestige Level"
            value={`Lv ${prestigeLevel} / ${cosmicEssence} essence`}
            accent="amber"
          />
          <StatTile label="Recent Save" value={lastSaveLabel} accent="emerald" />
        </div>
      </div>
    </div>
  );
});

function StatTile({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: Accent;
}) {
  const accentMap: Record<Accent, string> = {
    lime: 'from-lime-400/15 to-lime-500/5 border-lime-400/50 text-lime-100',
    cyan: 'from-cyan-400/15 to-cyan-500/5 border-cyan-300/50 text-cyan-100',
    amber: 'from-amber-400/15 to-amber-500/5 border-amber-300/50 text-amber-100',
    emerald: 'from-emerald-400/15 to-emerald-500/5 border-emerald-300/50 text-emerald-100',
  };

  return (
    <div
      className={`rounded-xl border bg-gradient-to-br p-3 shadow-inner shadow-black/40 ${accentMap[accent]}`}
    >
      <div className="text-[11px] uppercase tracking-[0.2em] text-slate-300">{label}</div>
      <div className="mt-1 text-lg font-semibold">{value}</div>
    </div>
  );
}
