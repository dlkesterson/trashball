import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useGameStore } from '../core/GameState';
import { SCRAP_UPGRADE_CATEGORIES, ScrapUpgradeId } from '../core/ScrapUnlocks';

const ENERGY_STEP = [100, 1000, 5000];
const SCRAP_STEP = [100, 500, 2000];
const BASE_COOLDOWN_MS = 2 * 60 * 1000;

export default function GameStateInspector() {
  const {
    energy,
    totalEnergy,
    scrap,
    totalScrap,
    charge,
    prestigeLevel,
    cosmicEssence,
    lastRunTime,
    scrapRunActive,
    upgrades,
    devSetState,
    devReset,
    devAdjustUpgrade,
  } = useGameStore();

  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  const effectiveCooldown = useMemo(() => {
    const cooldownReduction = (upgrades.warpCooldown ?? 0) * 2 * 60 * 1000;
    return Math.max(30_000, BASE_COOLDOWN_MS - cooldownReduction);
  }, [upgrades.warpCooldown]);

  useEffect(() => {
    const tick = () => {
      const remaining = Math.max(0, effectiveCooldown - (Date.now() - lastRunTime));
      setCooldownRemaining(remaining);
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [effectiveCooldown, lastRunTime]);

  const adjustEnergy = (delta: number) => {
    const nextEnergy = Math.max(0, energy + delta);
    const totalDelta = delta > 0 ? delta : 0;
    devSetState?.({
      energy: nextEnergy,
      totalEnergy: Math.max(0, totalEnergy + totalDelta),
    });
  };

  const adjustScrap = (delta: number) => {
    const nextScrap = Math.max(0, scrap + delta);
    const totalDelta = delta > 0 ? delta : 0;
    devSetState?.({
      scrap: nextScrap,
      totalScrap: Math.max(0, totalScrap + totalDelta),
    });
  };

  const setCooldownReady = () => devSetState?.({ lastRunTime: 0 });
  const setCooldownRecent = () => devSetState?.({ lastRunTime: Date.now() - 10_000 });

  const formatMs = (ms: number) => {
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleUpgradeChange = (id: ScrapUpgradeId, delta: number) => {
    devAdjustUpgrade?.(id, delta);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-mono">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
        <div className="md:col-span-2 bg-slate-900/80 border border-slate-700 rounded-xl p-5 shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <div>
              <div className="text-xs text-slate-400">DEV TOOL</div>
              <div className="text-2xl font-bold text-cyan-300">Game State Inspector</div>
            </div>
            <button
              onClick={() => devReset?.()}
              className="px-3 py-2 bg-red-600 hover:bg-red-500 rounded text-sm font-bold"
            >
              Reset Save
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Panel title="Resources">
              <ResourceRow
                label="Energy"
                value={energy}
                steps={ENERGY_STEP}
                onAdjust={adjustEnergy}
              />
              <ResourceRow
                label="Scrap"
                value={scrap}
                steps={SCRAP_STEP}
                onAdjust={adjustScrap}
              />
              <SimpleField
                label="Charge"
                value={`${(charge * 100).toFixed(0)}%`}
                onSet={(val) => devSetState?.({ charge: Math.min(1, Math.max(0, val / 100)) })}
              />
              <SimpleField
                label="Cosmic Essence"
                value={cosmicEssence}
                onSet={(val) => devSetState?.({ cosmicEssence: Math.max(0, Math.floor(val)) })}
              />
              <SimpleField
                label="Prestige Level"
                value={prestigeLevel}
                onSet={(val) => devSetState?.({ prestigeLevel: Math.max(0, Math.floor(val)) })}
              />
            </Panel>

            <Panel title="Runs & Cooldown">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-xs text-slate-500">Cooldown Remaining</div>
                  <div className="text-lg text-amber-300">{formatMs(cooldownRemaining)}</div>
                </div>
                <div className="space-x-2">
                  <button
                    onClick={setCooldownReady}
                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 rounded text-sm"
                  >
                    Reset Cooldown
                  </button>
                  <button
                    onClick={setCooldownRecent}
                    className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded text-sm"
                  >
                    Simulate Run
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  Scrap Run Active: <span className="text-cyan-300">{scrapRunActive ? 'Yes' : 'No'}</span>
                </div>
                <button
                  onClick={() => devSetState?.({ scrapRunActive: !scrapRunActive })}
                  className="px-3 py-1 rounded bg-purple-700 hover:bg-purple-600 text-xs"
                >
                  Toggle
                </button>
              </div>
            </Panel>

            <Panel title="Upgrades">
              <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
                {SCRAP_UPGRADE_CATEGORIES.map((category) => (
                  <div key={category.id}>
                    <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">
                      {category.label}
                    </div>
                    <div className="space-y-2">
                      {category.upgrades.map((upgrade) => {
                        const level = upgrades[upgrade.id] ?? 0;
                        return (
                          <div
                            key={upgrade.id}
                            className="flex items-center justify-between rounded border border-slate-700 bg-slate-800/60 px-3 py-2"
                          >
                            <div>
                              <div className="text-sm text-white">{upgrade.label}</div>
                              <div className="text-[11px] text-slate-400">
                                Level {level}/{upgrade.max}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleUpgradeChange(upgrade.id, -1)}
                                className="px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs"
                              >
                                -
                              </button>
                              <span className="w-6 text-center text-cyan-300">{level}</span>
                              <button
                                onClick={() => handleUpgradeChange(upgrade.id, 1)}
                                className="px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs"
                              >
                                +
                              </button>
                              <button
                                onClick={() => handleUpgradeChange(upgrade.id, upgrade.max)}
                                className="px-2 py-1 bg-emerald-700 hover:bg-emerald-600 rounded text-xs"
                              >
                                Max
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel title="Quick Fill">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => adjustEnergy(10_000)}
                  className="px-3 py-2 bg-cyan-700 hover:bg-cyan-600 rounded text-sm"
                >
                  +10k Energy
                </button>
                <button
                  onClick={() => adjustEnergy(-energy)}
                  className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded text-sm"
                >
                  Zero Energy
                </button>
                <button
                  onClick={() => adjustScrap(5_000)}
                  className="px-3 py-2 bg-amber-700 hover:bg-amber-600 rounded text-sm"
                >
                  +5k Scrap
                </button>
                <button
                  onClick={() => adjustScrap(-scrap)}
                  className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded text-sm"
                >
                  Zero Scrap
                </button>
              </div>
              <div className="mt-4 text-xs text-slate-400 leading-relaxed">
                Use query `?devTool=state` to open this panel. All changes use in-memory dev actions
                so you can experiment without touching the main loop flow.
              </div>
            </Panel>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-5 shadow-lg space-y-4">
          <div>
            <div className="text-xs text-slate-500">Status</div>
            <div className="text-lg text-emerald-300 font-bold">Live Game Snapshot</div>
          </div>
          <StatusRow label="Energy" value={Math.floor(energy).toLocaleString()} />
          <StatusRow label="Total Energy" value={Math.floor(totalEnergy).toLocaleString()} />
          <StatusRow label="Scrap" value={Math.floor(scrap).toLocaleString()} />
          <StatusRow label="Total Scrap" value={Math.floor(totalScrap).toLocaleString()} />
          <StatusRow label="Charge" value={`${(charge * 100).toFixed(0)}%`} />
          <StatusRow label="Prestige" value={`Lv ${prestigeLevel}`} />
          <StatusRow label="Essence" value={cosmicEssence.toString()} />
          <StatusRow label="Run Active" value={scrapRunActive ? 'Yes' : 'No'} />
          <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-800">
            Dev toggles are guarded by `__DEV_TOOLS__`. Flip the Vite define to disable in prod.
          </div>
        </div>
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-4">
      <div className="text-sm text-slate-300 font-semibold mb-3">{title}</div>
      {children}
    </div>
  );
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-400">{label}</span>
      <span className="text-white font-semibold">{value}</span>
    </div>
  );
}

function ResourceRow({
  label,
  value,
  steps,
  onAdjust,
}: {
  label: string;
  value: number;
  steps: number[];
  onAdjust: (n: number) => void;
}) {
  return (
    <div className="mb-3">
      <div className="flex items-center justify-between">
        <div className="text-sm text-white">{label}</div>
        <div className="text-sm text-cyan-300">{Math.floor(value)}</div>
      </div>
      <div className="flex gap-2 mt-2">
        {steps.map((step) => (
          <button
            key={`add-${step}`}
            onClick={() => onAdjust(step)}
            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-xs"
          >
            +{step}
          </button>
        ))}
        {steps.map((step) => (
          <button
            key={`sub-${step}`}
            onClick={() => onAdjust(-step)}
            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-xs"
          >
            -{step}
          </button>
        ))}
      </div>
    </div>
  );
}

function SimpleField({
  label,
  value,
  onSet,
}: {
  label: string;
  value: number | string;
  onSet: (val: number) => void;
}) {
  const [local, setLocal] = useState(value.toString());

  useEffect(() => {
    setLocal(value.toString());
  }, [value]);

  return (
    <div className="mb-3">
      <div className="text-sm text-white mb-1">{label}</div>
      <div className="flex gap-2">
        <input
          value={local}
          onChange={(e) => setLocal(e.target.value)}
          className="w-24 px-2 py-1 rounded bg-slate-800 border border-slate-700 text-sm text-white"
          inputMode="numeric"
        />
        <button
          onClick={() => {
            const parsed = Number(local);
            if (!Number.isNaN(parsed)) {
              onSet(parsed);
            }
          }}
          className="px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded text-xs"
        >
          Set
        </button>
      </div>
    </div>
  );
}
