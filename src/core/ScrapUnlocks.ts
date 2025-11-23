export type ScrapUpgradeId =
  | 'resonanceTuner'
  | 'criticalSurge'
  | 'orbitalStabilization'
  | 'tractorBeam'
  | 'shieldGenerator'
  | 'afterburners'
  | 'warpCooldown'
  | 'timeDilation';

export type ScrapUpgrade = {
  id: ScrapUpgradeId;
  baseCost: number;
  scale: number;
  max: number;
  label: string;
  desc: string;
};

export type ScrapUpgradeCategory = {
  id: 'harmonic' | 'scavenger' | 'chronos';
  label: string;
  accent: string;
  upgrades: ScrapUpgrade[];
};

export const SCRAP_UPGRADE_CATEGORIES: ScrapUpgradeCategory[] = [
  {
    id: 'harmonic',
    label: 'Compactors',
    accent: '#f97316',
    upgrades: [
      {
        id: 'resonanceTuner',
        baseCost: 100,
        scale: 1.8,
        max: 15,
        label: 'Compactor Rhythm',
        desc: '+15% trash compression per level',
      },
      {
        id: 'criticalSurge',
        baseCost: 400,
        scale: 2,
        max: 5,
        label: 'Toxic Surge',
        desc: '5% chance per level to ignite a 10x burn tick while holding',
      },
      {
        id: 'orbitalStabilization',
        baseCost: 750,
        scale: 2.1,
        max: 5,
        label: 'Gyro Binders',
        desc: 'Locks charge longer when you let go',
      },
    ],
  },
  {
    id: 'scavenger',
    label: 'Scavengers',
    accent: '#22c55e',
    upgrades: [
      {
        id: 'tractorBeam',
        baseCost: 500,
        scale: 2,
        max: 5,
        label: 'Junk Magnet',
        desc: 'Pull in stray trash from further away',
      },
      {
        id: 'shieldGenerator',
        baseCost: 900,
        scale: 2.2,
        max: 3,
        label: 'Hazmat Shielding',
        desc: 'Ignore one collision per shield charge',
      },
      {
        id: 'afterburners',
        baseCost: 1200,
        scale: 2.3,
        max: 3,
        label: 'Thruster Fins',
        desc: 'Sharper strafe speed for lane changes',
      },
    ],
  },
  {
    id: 'chronos',
    label: 'Time-Shifted Landfill',
    accent: '#38bdf8',
    upgrades: [
      {
        id: 'warpCooldown',
        baseCost: 1500,
        scale: 2.6,
        max: 5,
        label: 'Warp Breaker',
        desc: '-2 min launch cooldown per level',
      },
      {
        id: 'timeDilation',
        baseCost: 2000,
        scale: 2.8,
        max: 3,
        label: 'Landfill Slowdown',
        desc: 'Trash tunnel debris moves slower',
      },
    ],
  },
];

export const SCRAP_UPGRADES: Record<ScrapUpgradeId, ScrapUpgrade> = SCRAP_UPGRADE_CATEGORIES.reduce(
  (map, category) => {
    category.upgrades.forEach((upgrade) => {
      map[upgrade.id] = upgrade;
    });
    return map;
  },
  {} as Record<ScrapUpgradeId, ScrapUpgrade>
);

export const getUpgradeCost = (id: ScrapUpgradeId, currentLevel: number): number => {
  const upgrade = SCRAP_UPGRADES[id];
  return Math.floor(upgrade.baseCost * Math.pow(upgrade.scale, currentLevel));
};
