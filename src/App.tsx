import type React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import OrbScene from './orb/OrbScene';
import ScrapRunOverlay from './scraprun/ScrapRunOverlay';
import MainMenu from './ui/MainMenu';
import UpgradePanel from './ui/UpgradePanel';
import DevToolsHub from './devtools/DevToolsHub';
import { useGameStore } from './core/GameState';
import { haptic } from './utils/haptics';
import { audioBus } from './audio/audioBus';

function getDevToolFromLocation() {
  const params = new URLSearchParams(window.location.search);
  return params.get('devTool');
}

export default function App() {
  const devTool = useMemo(() => (__DEV_TOOLS__ ? getDevToolFromLocation() : null), []);
  const scrapRunActive = useGameStore((s) => s.scrapRunActive);
  const charge = useGameStore((s) => s.charge);
  const [isHolding, setIsHolding] = useState(false);
  const [showThumbOverlay, setShowThumbOverlay] = useState(false);
  const upgradePanelRef = useRef<HTMLDivElement>(null);

  const enableHold = () => {
    audioBus.resume();
    setIsHolding(true);
  };
  const disableHold = () => {
    if (charge > 0.35 && !scrapRunActive) {
      audioBus.playReleaseWomp(charge);
    }
    setIsHolding(false);
  };

  useEffect(() => {
    const isTouch =
      typeof window !== 'undefined' &&
      (window.matchMedia?.('(pointer: coarse)').matches || navigator.maxTouchPoints > 0);
    setShowThumbOverlay(isTouch);
  }, []);

  const isWithinUpgradePanel = (target: EventTarget | null) => {
    if (!target || !upgradePanelRef.current) return false;
    return upgradePanelRef.current.contains(target as Node);
  };

  if (devTool) {
    const initialTool = devTool === 'true' ? null : devTool;
    return <DevToolsHub initialTool={initialTool} />;
  }

  const handleTouchStart: React.TouchEventHandler<HTMLDivElement> = (e) => {
    if (scrapRunActive || isWithinUpgradePanel(e.target)) return;
    const touch = e.touches[0];
    const target = e.currentTarget.getBoundingClientRect();
    const y = touch.clientY - target.top;
    const topBand = target.height * 0.2;
    const bottomBand = target.height * 0.8;

    if (y > topBand && y < bottomBand) {
      e.preventDefault();
      enableHold();
      haptic([12]);
    }
  };

  return (
    <div
      className="relative w-full min-h-[100dvh] overflow-hidden select-none bg-gradient-to-b from-[#05070f] to-[#020308] touch-none"
      onMouseDown={
        !scrapRunActive
          ? (e) => {
              if (isWithinUpgradePanel(e.target)) return;
              enableHold();
            }
          : undefined
      }
      onMouseUp={!scrapRunActive ? disableHold : undefined}
      onMouseLeave={!scrapRunActive ? disableHold : undefined}
      onTouchStart={handleTouchStart}
      onTouchEnd={!scrapRunActive ? disableHold : undefined}
    >
      {!scrapRunActive && <OrbScene isHolding={isHolding} />}

      {scrapRunActive ? (
        <ScrapRunOverlay />
      ) : (
        <>
          <MainMenu />
          <UpgradePanel ref={upgradePanelRef} />
          {showThumbOverlay && <ThumbZoneOverlay />}
        </>
      )}
    </div>
  );
}

function ThumbZoneOverlay() {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center px-3 pb-5 sm:pb-7">
      <div className="w-full max-w-4xl">
        <div className="relative h-24 rounded-2xl border border-emerald-400/25 bg-gradient-to-b from-emerald-500/10 via-emerald-500/5 to-transparent overflow-hidden">
          <div className="absolute inset-x-[12%] top-[26%] h-10 rounded-xl border border-emerald-300/50 bg-emerald-400/15 blur-[1px]" />
          <div className="absolute inset-0 flex items-center justify-between px-4 text-[11px] uppercase tracking-[0.2em] text-emerald-100">
            <span>Safe Hold Zone</span>
            <span className="text-amber-200">Quick tap = shield pulse</span>
          </div>
          <div className="absolute inset-x-0 bottom-2 flex justify-center">
            <div className="px-3 py-1.5 rounded-full bg-black/70 border border-emerald-300/40 text-xs text-emerald-100 shadow-[0_10px_30px_rgba(16,185,129,0.15)]">
              Drag for strafe - Release to glide back
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
