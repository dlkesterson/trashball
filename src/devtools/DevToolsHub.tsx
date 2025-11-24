import { useEffect, useMemo, useState, type ComponentType } from 'react';
import ShaderLab from './ShaderLab';
import AudioLab from './AudioLab';
import DebrisLab from './DebrisLab';
import UpgradeSim from './UpgradeSim';
import PrestigeSim from './PrestigeSim';
import OrbDebug from './OrbDebug';
import GameStateInspector from './GameStateInspector';

type DevToolId = 'shader' | 'audio' | 'debris' | 'upgrade' | 'prestige' | 'orbdebug' | 'state';

const DEV_TOOLS: Array<{
  id: DevToolId;
  label: string;
  description: string;
  component: ComponentType;
}> = [
  {
    id: 'shader',
    label: 'Shader Lab',
    description: 'Orb shader playground for gradients, wobble, and bloom.',
    component: ShaderLab,
  },
  {
    id: 'audio',
    label: 'Audio Lab',
    description: 'Tone.js playground for orb states + ScrapRun one-shots.',
    component: AudioLab,
  },
  {
    id: 'debris',
    label: 'Debris Lab',
    description: 'Tune ScrapRun debris spawns, paths, and debugging overlays.',
    component: DebrisLab,
  },
  {
    id: 'upgrade',
    label: 'Upgrade Sim',
    description: 'Placeholder for upgrade pacing and scaling experiments.',
    component: UpgradeSim,
  },
  {
    id: 'prestige',
    label: 'Prestige Sim',
    description: 'Placeholder for prestige loop simulations.',
    component: PrestigeSim,
  },
  {
    id: 'orbdebug',
    label: 'Orb Debug',
    description: 'Placeholder for orb physics and input visualizers.',
    component: OrbDebug,
  },
  {
    id: 'state',
    label: 'Game State Inspector',
    description: 'Live snapshot with resource editing and upgrade controls.',
    component: GameStateInspector,
  },
];

type Props = {
  initialTool: string | null;
};

export default function DevToolsHub({ initialTool }: Props) {
  const fallback = DEV_TOOLS[0];

  const initialId = useMemo<DevToolId>(() => {
    const match = DEV_TOOLS.find((tool) => tool.id === initialTool);
    return match?.id ?? fallback.id;
  }, [initialTool, fallback.id]);

  const [activeTool, setActiveTool] = useState<DevToolId>(initialId);
  const [panelOpen, setPanelOpen] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.set('devTool', activeTool);
    const url = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, '', url);
  }, [activeTool]);

  const active = DEV_TOOLS.find((tool) => tool.id === activeTool) ?? fallback;
  const ActiveComponent = active.component;

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100">
      <ActiveComponent />

      <div className="fixed top-4 right-4 z-[60] w-80">
        <button
          onClick={() => setPanelOpen((v) => !v)}
          className="ml-auto block rounded-full bg-slate-900/80 border border-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 shadow-lg shadow-black/30 hover:border-cyan-400 transition"
        >
          {panelOpen ? 'Hide Dev Tools' : 'Show Dev Tools'}
        </button>

        {panelOpen && (
          <div className="mt-2 max-h-[75vh] overflow-hidden rounded-xl border border-slate-800 bg-slate-900/90 shadow-2xl backdrop-blur">
            <div className="px-4 py-3 border-b border-slate-800">
              <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Dev Tools</div>
              <div className="text-sm text-slate-200">Switch panels (devTool=true)</div>
            </div>
            <div className="divide-y divide-slate-800 overflow-y-auto max-h-[65vh]">
              {DEV_TOOLS.map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => setActiveTool(tool.id)}
                  className={`w-full text-left px-4 py-3 transition hover:bg-slate-800/70 ${
                    activeTool === tool.id ? 'bg-slate-800/80' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-white">{tool.label}</div>
                    {activeTool === tool.id && (
                      <span className="text-[11px] text-cyan-400 font-semibold">Active</span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 mt-1 leading-snug">{tool.description}</div>
                  <div className="text-[11px] text-slate-500 mt-1">?devTool={tool.id}</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
