import { useMemo, useState } from 'react';
import ScrapRunScene from '../scraprun/ScrapRunScene';
import { BASE_GAME_CONFIG, type ScrapRunConfig } from '../scraprun/config';
import type { ScrapUpgradeId } from '../core/ScrapUnlocks';
import { SCRAP_ASSETS, type ScrapAsset } from '../core/scrapAssets';

const numberField = (n: number, decimals = 2) => Number(n.toFixed(decimals));
type DatasetSortKey = 'scrapValue' | 'mass' | 'burnEnergy' | 'toxicity' | 'smellLevel';

export default function DebrisLab() {
  const [config, setConfig] = useState<ScrapRunConfig>(BASE_GAME_CONFIG);
  const [showCurvature, setShowCurvature] = useState(true);
  const [showHitboxes, setShowHitboxes] = useState(true);
  const [materialFilter, setMaterialFilter] = useState<ScrapAsset['materialType'] | 'all'>('all');
  const [rarityFilter, setRarityFilter] = useState<ScrapAsset['rarity'] | 'all'>('all');
  const [sizeFilter, setSizeFilter] = useState<ScrapAsset['sizeClass'] | 'all'>('all');
  const [sortKey, setSortKey] = useState<DatasetSortKey>('scrapValue');

  const memoConfig = useMemo(() => ({ ...config }), [config]);
  const materialOptions = useMemo(
    () => Array.from(new Set(SCRAP_ASSETS.map((asset) => asset.materialType))).sort(),
    []
  );
  const rarityOptions = useMemo(
    () => Array.from(new Set(SCRAP_ASSETS.map((asset) => asset.rarity))).sort(),
    []
  );
  const sizeOptions = useMemo(
    () => Array.from(new Set(SCRAP_ASSETS.map((asset) => asset.sizeClass))).sort(),
    []
  );
  const filteredAssets = useMemo(() => {
    const subset = SCRAP_ASSETS.filter((asset) => {
      if (materialFilter !== 'all' && asset.materialType !== materialFilter) return false;
      if (rarityFilter !== 'all' && asset.rarity !== rarityFilter) return false;
      if (sizeFilter !== 'all' && asset.sizeClass !== sizeFilter) return false;
      return true;
    });
    const valueFor = (asset: ScrapAsset) => {
      switch (sortKey) {
        case 'mass':
          return asset.mass;
        case 'burnEnergy':
          return asset.burnEnergy;
        case 'toxicity':
          return asset.toxicity;
        case 'smellLevel':
          return asset.smellLevel;
        case 'scrapValue':
        default:
          return asset.scrapValue;
      }
    };
    return subset.sort((a, b) => valueFor(b) - valueFor(a));
  }, [materialFilter, rarityFilter, sizeFilter, sortKey]);
  const datasetStats = useMemo(() => {
    if (filteredAssets.length === 0) {
      return { avgMass: 0, avgBurn: 0, avgToxicity: 0, avgSmell: 0 };
    }
    const totals = filteredAssets.reduce(
      (acc, asset) => ({
        mass: acc.mass + asset.mass,
        burn: acc.burn + asset.burnEnergy,
        toxicity: acc.toxicity + asset.toxicity,
        smell: acc.smell + asset.smellLevel,
      }),
      { mass: 0, burn: 0, toxicity: 0, smell: 0 }
    );
    const count = filteredAssets.length;
    return {
      avgMass: totals.mass / count,
      avgBurn: totals.burn / count,
      avgToxicity: totals.toxicity / count,
      avgSmell: totals.smell / count,
    };
  }, [filteredAssets]);
  const displayAssets = useMemo(() => filteredAssets.slice(0, 30), [filteredAssets]);

  const updateConfig = <K extends keyof ScrapRunConfig>(key: K, value: ScrapRunConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] min-h-screen bg-slate-950 text-slate-100">
      <div className="relative">
        <ScrapRunScene
          onGameOver={() => {}}
          upgrades={{} as Record<ScrapUpgradeId, number>}
          config={memoConfig}
          showCurvatureDebug={showCurvature}
          showHitboxes={showHitboxes}
          minimalUi
          endless
        />
        <div className="absolute top-4 left-4 bg-black/50 px-3 py-2 rounded text-xs text-slate-300">
          Dev Tool: DebrisLab - use ?devTool=debris
        </div>
      </div>

      <div className="p-6 space-y-4 bg-slate-900/80 border-l border-slate-800 overflow-y-auto">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 uppercase">Sandbox</div>
            <div className="text-lg font-semibold">ScrapRun Debris Tuner</div>
          </div>
          <button
            onClick={() => setConfig(BASE_GAME_CONFIG)}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded text-sm"
          >
            Reset to Base
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <NumberSlider
            label="Spawn Interval (ms)"
            value={config.spawnInterval}
            min={200}
            max={2000}
            step={50}
            onChange={(v) => updateConfig('spawnInterval', Math.max(50, Math.round(v)))}
          />
          <NumberSlider
            label="Spawn Distance (Z)"
            value={config.spawnDistance}
            min={-80}
            max={-10}
            step={1}
            onChange={(v) => updateConfig('spawnDistance', numberField(v, 0))}
          />
          <NumberSlider
            label="Despawn Distance (Z)"
            value={config.despawnDistance}
            min={2}
            max={20}
            step={0.5}
            onChange={(v) => updateConfig('despawnDistance', numberField(v))}
          />
          <NumberSlider
            label="Debris Speed"
            value={config.debrisSpeed}
            min={0.05}
            max={0.6}
            step={0.01}
            onChange={(v) => updateConfig('debrisSpeed', numberField(v, 3))}
          />
          <NumberSlider
            label="Curvature Strength"
            value={config.curvatureStrength}
            min={0}
            max={0.6}
            step={0.01}
            onChange={(v) => updateConfig('curvatureStrength', numberField(v, 3))}
          />
          <NumberSlider
            label="Strafe Speed"
            value={config.strafeSpeed}
            min={0.02}
            max={0.4}
            step={0.01}
            onChange={(v) => updateConfig('strafeSpeed', numberField(v, 3))}
          />
          <NumberSlider
            label="Max Strafe"
            value={config.maxStrafe}
            min={1}
            max={8}
            step={0.1}
            onChange={(v) => updateConfig('maxStrafe', numberField(v, 2))}
          />
          <NumberSlider
            label="Good Ratio"
            value={config.goodRatio}
            min={0}
            max={1}
            step={0.02}
            onChange={(v) => updateConfig('goodRatio', numberField(v, 3))}
          />
          <NumberSlider
            label="Inner Orbit"
            value={config.innerOrbit}
            min={-5}
            max={0}
            step={0.1}
            onChange={(v) => updateConfig('innerOrbit', numberField(v, 2))}
          />
          <NumberSlider
            label="Outer Orbit"
            value={config.outerOrbit}
            min={0}
            max={4}
            step={0.1}
            onChange={(v) => updateConfig('outerOrbit', numberField(v, 2))}
          />
          <NumberSlider
            label="Orbit Lerp Speed"
            value={config.orbitSpeed}
            min={0.02}
            max={0.2}
            step={0.01}
            onChange={(v) => updateConfig('orbitSpeed', numberField(v, 3))}
          />
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-slate-200">
            <input
              type="checkbox"
              checked={showCurvature}
              onChange={(e) => setShowCurvature(e.target.checked)}
            />
            Show Curvature Debug
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-200">
            <input
              type="checkbox"
              checked={showHitboxes}
              onChange={(e) => setShowHitboxes(e.target.checked)}
            />
            Show Hitboxes
          </label>
        </div>

        <div className="text-xs text-slate-500 leading-relaxed">
          Endless loop is enabled in this lab so crashes won&apos;t exit the scene. Adjust spawn and
          curve to feel out difficulty without playing full runs.
        </div>

        <div className="border-t border-slate-800 pt-4 space-y-4">
          <div>
            <div className="text-xs text-slate-500 uppercase">Dataset</div>
            <div className="text-lg font-semibold">Scrap Dataset Explorer</div>
            <div className="text-xs text-slate-400 mt-1">
              Filters apply directly to the generated `generatedScrapDefinitions.json`, so it&apos;s
              easy to sanity check new FBX imports.
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block text-xs text-slate-300 space-y-1">
              <span>Material</span>
              <select
                value={materialFilter}
                onChange={(e) => setMaterialFilter(e.target.value as ScrapAsset['materialType'] | 'all')}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm"
              >
                <option value="all">All</option>
                {materialOptions.map((material) => (
                  <option key={material} value={material}>
                    {material}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs text-slate-300 space-y-1">
              <span>Rarity</span>
              <select
                value={rarityFilter}
                onChange={(e) => setRarityFilter(e.target.value as ScrapAsset['rarity'] | 'all')}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm"
              >
                <option value="all">All</option>
                {rarityOptions.map((rarity) => (
                  <option key={rarity} value={rarity}>
                    {rarity}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs text-slate-300 space-y-1">
              <span>Size Class</span>
              <select
                value={sizeFilter}
                onChange={(e) => setSizeFilter(e.target.value as ScrapAsset['sizeClass'] | 'all')}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm"
              >
                <option value="all">All</option>
                {sizeOptions.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs text-slate-300 space-y-1">
              <span>Sort By</span>
              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as DatasetSortKey)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm"
              >
                <option value="scrapValue">Scrap Value</option>
                <option value="mass">Mass</option>
                <option value="burnEnergy">Burn Energy</option>
                <option value="smellLevel">Smell Level</option>
                <option value="toxicity">Toxicity</option>
              </select>
            </label>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <StatCard label="Avg Mass" value={`${numberField(datasetStats.avgMass, 1)} u`} />
            <StatCard label="Avg Burn" value={`${numberField(datasetStats.avgBurn, 1)} kJ`} />
            <StatCard
              label="Avg Smell"
              value={`${numberField(datasetStats.avgSmell, 2)} / 1`}
            />
            <StatCard
              label="Avg Toxic"
              value={`${numberField(datasetStats.avgToxicity, 2)} / 1`}
            />
          </div>

          <div className="rounded-2xl border border-slate-800 bg-black/60 p-3 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>
                Showing {displayAssets.length} of {filteredAssets.length} scraps
              </span>
              <span className="capitalize">Sorted by {sortKey}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs text-left">
                <thead className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
                  <tr>
                    <th className="py-1 pr-2 font-normal">Name</th>
                    <th className="py-1 pr-2 font-normal">Material</th>
                    <th className="py-1 pr-2 font-normal">Size</th>
                    <th className="py-1 pr-2 font-normal">Rarity</th>
                    <th className="py-1 pr-2 font-normal text-right">Mass</th>
                    <th className="py-1 pr-2 font-normal text-right">Burn</th>
                    <th className="py-1 pr-2 font-normal text-right">Scrap</th>
                    <th className="py-1 pr-2 font-normal text-right">Smell/Toxic</th>
                  </tr>
                </thead>
                <tbody>
                  {displayAssets.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-3 text-center text-slate-500">
                        No scraps match the filters.
                      </td>
                    </tr>
                  )}
                  {displayAssets.map((asset) => (
                    <tr key={asset.id} className="border-t border-slate-800/60">
                      <td className="py-2 pr-2 font-semibold text-slate-100">{asset.id}</td>
                      <td className="py-2 pr-2 capitalize">{asset.materialType}</td>
                      <td className="py-2 pr-2">{asset.sizeClass}</td>
                      <td className="py-2 pr-2 capitalize">{asset.rarity}</td>
                      <td className="py-2 pr-2 text-right">{numberField(asset.mass, 1)}</td>
                      <td className="py-2 pr-2 text-right">{numberField(asset.burnEnergy, 1)}</td>
                      <td className="py-2 pr-2 text-right">{asset.scrapValue.toLocaleString()}</td>
                      <td className="py-2 pr-2 text-right">
                        {numberField(asset.smellLevel, 2)} / {numberField(asset.toxicity, 2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
      <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">{label}</div>
      <div className="text-base font-semibold text-slate-100">{value}</div>
    </div>
  );
}

function NumberSlider({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (val: number) => void;
}) {
  return (
    <label className="block text-xs text-slate-300 space-y-1">
      <div className="flex items-center justify-between">
        <span>{label}</span>
        <span className="text-slate-100 font-semibold">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
      />
    </label>
  );
}
