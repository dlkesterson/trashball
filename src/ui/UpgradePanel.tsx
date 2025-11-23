import { useEffect, useState, forwardRef } from 'react';
import { SCRAP_UPGRADE_CATEGORIES, getUpgradeCost } from '../core/ScrapUnlocks';
import { useGameStore } from '../core/GameState';

const UpgradePanel = forwardRef<HTMLDivElement>(function UpgradePanel(_, panelRef) {
  const { scrap, upgrades, purchaseUpgrade } = useGameStore();
  const [expanded, setExpanded] = useState(false);
  const [activeCategory, setActiveCategory] = useState(SCRAP_UPGRADE_CATEGORIES[0].id);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setExpanded(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="pointer-events-none fixed top-16 right-3 sm:top-20 sm:right-6 z-30">
      <div
        ref={panelRef}
        className="pointer-events-auto w-64 sm:w-80 max-w-xs sm:max-w-sm rounded-2xl bg-black/80 border border-slate-800 shadow-xl backdrop-blur-lg overflow-hidden"
      >
        <div className="flex items-center justify-between px-3 sm:px-4 py-2 border-b border-slate-800">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-amber-200">
            Upgrades
            <span className="px-2 py-1 rounded-full bg-amber-500/10 text-amber-100 border border-amber-400/60 font-mono text-[11px]">
              {Math.floor(scrap)}
            </span>
          </div>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="rounded-full bg-slate-900 px-3 py-1.5 text-[11px] font-semibold text-slate-200 border border-slate-700 hover:border-amber-400 transition-all"
          >
            {expanded ? 'Hide' : 'Show'}
          </button>
        </div>

        {expanded && (
          <div className="p-3 sm:p-4 space-y-3 max-h-[60vh] overflow-y-auto">
            <div className="flex flex-wrap gap-2">
              {SCRAP_UPGRADE_CATEGORIES.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                    activeCategory === category.id
                      ? 'bg-amber-500/15 border-amber-400 text-amber-100 shadow-[0_4px_20px_rgba(251,191,36,0.25)]'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  {category.label}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {SCRAP_UPGRADE_CATEGORIES.find((c) => c.id === activeCategory)?.upgrades.map((upgrade) => {
                const level = upgrades[upgrade.id] ?? 0;
                const cost = getUpgradeCost(upgrade.id, level);
                const maxed = level >= upgrade.max;
                const canAfford = scrap >= cost;

                return (
                  <button
                    key={upgrade.id}
                    onClick={() => purchaseUpgrade(upgrade.id)}
                    disabled={!canAfford || maxed}
                    className={`w-full p-3 rounded-2xl border text-left transition-all ${
                      maxed
                        ? 'border-lime-500/70 bg-lime-900/30 text-lime-100'
                        : canAfford
                          ? 'border-amber-400/70 bg-amber-500/10 text-amber-100 hover:border-amber-300 hover:bg-amber-500/15'
                          : 'border-slate-800 bg-slate-900/60 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-semibold text-sm">{upgrade.label}</div>
                        <div className="text-xs text-slate-300 mt-0.5">{upgrade.desc}</div>
                      </div>
                      <span className="text-xs text-amber-200">
                        {maxed ? 'Maxed' : `Lvl ${level}/${upgrade.max}`}
                      </span>
                    </div>
                    {!maxed && (
                      <div className="mt-2 text-xs text-amber-300 font-mono">Cost: {cost} trash</div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default UpgradePanel;
