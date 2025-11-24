import type React from 'react';
import { useMemo, useRef, useState } from 'react';
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
        </>
      )}
    </div>
  );
}
