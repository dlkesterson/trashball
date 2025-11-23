import type React from 'react';
import { useMemo, useState } from 'react';
import OrbScene from './orb/OrbScene';
import ScrapRunOverlay from './scraprun/ScrapRunOverlay';
import MainMenu from './ui/MainMenu';
import UpgradePanel from './ui/UpgradePanel';
import DevToolsHub from './devtools/DevToolsHub';
import { useGameStore } from './core/GameState';

function getDevToolFromLocation() {
  const params = new URLSearchParams(window.location.search);
  return params.get('devTool');
}

export default function App() {
  const devTool = useMemo(() => (__DEV_TOOLS__ ? getDevToolFromLocation() : null), []);
  const scrapRunActive = useGameStore((s) => s.scrapRunActive);
  const [isHolding, setIsHolding] = useState(false);

  const enableHold = () => setIsHolding(true);
  const disableHold = () => setIsHolding(false);

  if (devTool) {
    const initialTool = devTool === 'true' ? null : devTool;
    return <DevToolsHub initialTool={initialTool} />;
  }

  const handleTouchStart: React.TouchEventHandler<HTMLDivElement> = (e) => {
    if (scrapRunActive) return;
    const touch = e.touches[0];
    const target = e.currentTarget.getBoundingClientRect();
    const y = touch.clientY - target.top;
    const topBand = target.height * 0.2;
    const bottomBand = target.height * 0.8;

    if (y > topBand && y < bottomBand) {
      e.preventDefault();
      enableHold();
    }
  };

  return (
    <div
      className="relative w-full min-h-[100dvh] overflow-hidden select-none bg-gradient-to-b from-[#05070f] to-[#020308] touch-none"
      onMouseDown={!scrapRunActive ? enableHold : undefined}
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
          <UpgradePanel />
        </>
      )}
    </div>
  );
}
