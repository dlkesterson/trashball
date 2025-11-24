import type React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import OrbScene from './orb/OrbScene';
import ScrapRunOverlay from './scraprun/ScrapRunOverlay';
import MainMenu from './ui/MainMenu';
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
  const [isUpgradesOpen, setIsUpgradesOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const upgradePanelRef = useRef<HTMLDivElement | null>(null);
  const statsPanelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const resume = () => audioBus.resume();
    window.addEventListener('pointerdown', resume, { once: true });
    window.addEventListener('touchstart', resume, { once: true });
    window.addEventListener('keydown', resume, { once: true });
    return () => {
      window.removeEventListener('pointerdown', resume);
      window.removeEventListener('touchstart', resume);
      window.removeEventListener('keydown', resume);
    };
  }, []);

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

  const isWithinUiLayer = (target: EventTarget | null) => {
    if (!target) return false;
    const node = target as Node;
    return (
      (upgradePanelRef.current && upgradePanelRef.current.contains(node)) ||
      (statsPanelRef.current && statsPanelRef.current.contains(node))
    );
  };

  if (devTool) {
    const initialTool = devTool === 'true' ? null : devTool;
    return <DevToolsHub initialTool={initialTool} />;
  }

  const handleTouchStart: React.TouchEventHandler<HTMLDivElement> = (e) => {
    if (scrapRunActive || isWithinUiLayer(e.target)) return;
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
              if (isWithinUiLayer(e.target)) return;
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
          <MainMenu
            upgradePanelRef={upgradePanelRef}
            statsPanelRef={statsPanelRef}
            isUpgradesOpen={isUpgradesOpen}
            isStatsOpen={isStatsOpen}
            openUpgrades={() => setIsUpgradesOpen(true)}
            closeUpgrades={() => setIsUpgradesOpen(false)}
            openStats={() => setIsStatsOpen(true)}
            closeStats={() => setIsStatsOpen(false)}
          />
        </>
      )}
    </div>
  );
}
