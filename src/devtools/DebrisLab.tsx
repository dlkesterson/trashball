import { useMemo, useState } from 'react';
import ScrapRunScene from '../scraprun/ScrapRunScene';
import { BASE_GAME_CONFIG, type ScrapRunConfig } from '../scraprun/config';
import type { ScrapUpgradeId } from '../core/ScrapUnlocks';

const numberField = (n: number, decimals = 2) => Number(n.toFixed(decimals));

export default function DebrisLab() {
  const [config, setConfig] = useState<ScrapRunConfig>(BASE_GAME_CONFIG);
  const [showCurvature, setShowCurvature] = useState(true);
  const [showHitboxes, setShowHitboxes] = useState(true);

  const memoConfig = useMemo(() => ({ ...config }), [config]);

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
      </div>
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
