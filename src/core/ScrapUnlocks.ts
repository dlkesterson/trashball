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
    label: 'Harmonic',
    accent: '#9b87f5',
    upgrades: [
      {
        id: 'resonanceTuner',
        baseCost: 100,
        scale: 1.8,
        max: 15,
        label: 'Resonance Tuner',
        desc: '+15% energy generation per level',
      },
      {
        id: 'criticalSurge',
        baseCost: 400,
        scale: 2,
        max: 5,
        label: 'Critical Surge',
        desc: '5% chance per level to 10x a tick while holding',
      },
      {
        id: 'orbitalStabilization',
        baseCost: 750,
        scale: 2.1,
        max: 5,
        label: 'Orbital Stabilization',
        desc: 'Reduces charge drain when released',
      },
    ],
  },
  {
    id: 'scavenger',
    label: 'Scavenger',
    accent: '#22c55e',
    upgrades: [
      {
        id: 'tractorBeam',
        baseCost: 500,
        scale: 2,
        max: 5,
        label: 'Tractor Beam',
        desc: 'Wider scrap pickup radius',
      },
      {
        id: 'shieldGenerator',
        baseCost: 900,
        scale: 2.2,
        max: 3,
        label: 'Shield Generator',
        desc: 'Ignore one hit per shield charge',
      },
      {
        id: 'afterburners',
        baseCost: 1200,
        scale: 2.3,
        max: 3,
        label: 'Afterburners',
        desc: 'Faster strafe speed',
      },
    ],
  },
  {
    id: 'chronos',
    label: 'Chronos',
    accent: '#38bdf8',
    upgrades: [
      {
        id: 'warpCooldown',
        baseCost: 1500,
        scale: 2.6,
        max: 5,
        label: 'Warp Cooldown',
        desc: '-2 min launch cooldown per level',
      },
      {
        id: 'timeDilation',
        baseCost: 2000,
        scale: 2.8,
        max: 3,
        label: 'Time Dilation',
        desc: 'Scrap Run debris moves slower',
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
