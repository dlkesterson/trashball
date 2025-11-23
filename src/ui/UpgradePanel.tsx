import { useState } from 'react';
import { SCRAP_UPGRADE_CATEGORIES, getUpgradeCost } from '../core/ScrapUnlocks';
import { useGameStore } from '../core/GameState';

export default function UpgradePanel() {
  const { scrap, upgrades, purchaseUpgrade } = useGameStore();
  const [expanded, setExpanded] = useState(true);
  const [activeCategory, setActiveCategory] = useState(SCRAP_UPGRADE_CATEGORIES[0].id);

  return (
    <div
      className={`fixed left-4 top-1/2 -translate-y-1/2 bg-gray-900 bg-opacity-95 rounded-lg border-2 border-purple-500 transition-all ${
        expanded ? 'w-80' : 'w-12'
      }`}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-12 bg-purple-600 hover:bg-purple-500 rounded-r-lg flex items-center justify-center text-white font-bold"
      >
        {expanded ? '«' : '»'}
      </button>

      {expanded && (
        <div className="p-4">
          <div className="text-purple-300 font-bold text-lg mb-2">UPGRADES</div>
          <div className="flex gap-2 mb-4">
            {SCRAP_UPGRADE_CATEGORIES.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`flex-1 px-2 py-1 rounded text-xs font-bold border ${
                  activeCategory === category.id
                    ? 'bg-purple-700 border-purple-400 text-white'
                    : 'bg-gray-800 border-gray-700 text-gray-400'
                }`}
                style={
                  activeCategory === category.id ? { boxShadow: `0 0 12px ${category.accent}` } : {}
                }
              >
                {category.label}
              </button>
            ))}
          </div>
          <div className="mb-4 text-yellow-400 font-mono">☆ {Math.floor(scrap)} Scrap</div>

          <div className="space-y-3">
            {SCRAP_UPGRADE_CATEGORIES.find((c) => c.id === activeCategory)?.upgrades.map(
              (upgrade) => {
                const level = upgrades[upgrade.id] ?? 0;
                const cost = getUpgradeCost(upgrade.id, level);
                const maxed = level >= upgrade.max;
                const canAfford = scrap >= cost;

                return (
                  <button
                    key={upgrade.id}
                    onClick={() => purchaseUpgrade(upgrade.id)}
                    disabled={!canAfford || maxed}
                    className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                      maxed
                        ? 'border-green-500 bg-green-900 bg-opacity-30'
                        : canAfford
                          ? 'border-purple-500 bg-purple-900 bg-opacity-30 hover:bg-opacity-50'
                          : 'border-gray-700 bg-gray-800 bg-opacity-30 opacity-60'
                    }`}
                  >
                    <div className="text-white font-bold text-sm">{upgrade.label}</div>
                    <div className="text-gray-400 text-xs mb-1">{upgrade.desc}</div>
                    <div className="flex justify-between items-center text-xs">
                      <span className={maxed ? 'text-green-400' : 'text-purple-300'}>
                        {maxed ? 'MAX' : `Level ${level}/${upgrade.max}`}
                      </span>
                      {!maxed && <span className="text-yellow-400">☆ {cost}</span>}
                    </div>
                  </button>
                );
              }
            )}
          </div>
        </div>
      )}
    </div>
  );
}
