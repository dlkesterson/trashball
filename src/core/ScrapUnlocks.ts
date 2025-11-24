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
  role?: 'idle' | 'runner' | 'tempo';
  perLevel?: string;
  breakpoints?: Array<{ level: number; text: string }>;
  hint?: string;
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
        role: 'idle',
        perLevel: '+15% mass gain',
        hint: 'Best early pick for idle growth.',
      },
      {
        id: 'criticalSurge',
        baseCost: 400,
        scale: 2,
        max: 5,
        label: 'Toxic Surge',
        desc: '5% chance per level to ignite a 10x burn tick while holding',
        role: 'idle',
        perLevel: '+5% surge chance',
        breakpoints: [{ level: 3, text: 'Surge streaks extend while charging' }],
        hint: 'Pair with high charge to spike prestige income.',
      },
      {
        id: 'orbitalStabilization',
        baseCost: 750,
        scale: 2.1,
        max: 5,
        label: 'Gyro Binders',
        desc: 'Locks charge longer when you let go',
        role: 'idle',
        perLevel: '-2% charge bleed',
        breakpoints: [{ level: 4, text: 'Charge ring stays lit when gliding' }],
        hint: 'Stretches idle gains between taps.',
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
        role: 'runner',
        perLevel: '+0.2 pickup radius',
        breakpoints: [
          { level: 3, text: 'Visible magnet trails on close scrap' },
          { level: 5, text: 'Auto-collect field engages on near-misses' },
        ],
        hint: 'Best opener for safer Scrap Runs.',
      },
      {
        id: 'shieldGenerator',
        baseCost: 900,
        scale: 2.2,
        max: 3,
        label: 'Hazmat Shielding',
        desc: 'Ignore one collision per shield charge',
        role: 'runner',
        perLevel: '+1 shield charge',
        breakpoints: [
          { level: 2, text: 'Pulse tap gains wider blast' },
          { level: 3, text: 'Forcefield aura stays active' },
        ],
        hint: 'Great for spiky tunnels and learning routes.',
      },
      {
        id: 'afterburners',
        baseCost: 1200,
        scale: 2.3,
        max: 3,
        label: 'Thruster Fins',
        desc: 'Sharper strafe speed for lane changes',
        role: 'runner',
        perLevel: '+0.04 strafe speed, +0.5 lane span',
        breakpoints: [{ level: 2, text: 'Adds exhaust trail for motion cues' }],
        hint: 'Pairs with Junk Magnet for aggressive scoops.',
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
        role: 'tempo',
        perLevel: '-2 min launch cooldown',
        hint: 'Prestige-gated pacing unlock.',
      },
      {
        id: 'timeDilation',
        baseCost: 2000,
        scale: 2.8,
        max: 3,
        label: 'Landfill Slowdown',
        desc: 'Trash tunnel debris moves slower',
        role: 'tempo',
        perLevel: '-12% debris speed, +15% spawn spacing',
        hint: 'Great for high-speed lanes with afterburners.',
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
