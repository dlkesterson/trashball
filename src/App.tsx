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

  return (
    <div
      className="relative w-full h-screen overflow-hidden select-none bg-gradient-to-b from-[#0a0f2c] to-[#05060f]"
      onMouseDown={!scrapRunActive ? enableHold : undefined}
      onMouseUp={!scrapRunActive ? disableHold : undefined}
      onMouseLeave={!scrapRunActive ? disableHold : undefined}
      onTouchStart={!scrapRunActive ? enableHold : undefined}
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
