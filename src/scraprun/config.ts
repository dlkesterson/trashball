import { ScrapUpgradeId } from '../core/ScrapUnlocks';

export type ScrapRunConfig = {
  innerOrbit: number;
  outerOrbit: number;
  orbitSpeed: number;
  strafeSpeed: number;
  maxStrafe: number;
  debrisSpeed: number;
  spawnDistance: number;
  despawnDistance: number;
  spawnInterval: number;
  curvatureStrength: number;
  goodRatio: number;
};

export const BASE_GAME_CONFIG: ScrapRunConfig = {
  innerOrbit: -2,
  outerOrbit: 1,
  orbitSpeed: 0.08,
  strafeSpeed: 0.1,
  maxStrafe: 3,
  debrisSpeed: 0.15,
  spawnDistance: -40,
  despawnDistance: 8,
  spawnInterval: 1000,
  curvatureStrength: 0.15,
  goodRatio: 0.7,
};

export function applyUpgradesToConfig(
  base: ScrapRunConfig,
  upgrades: Record<ScrapUpgradeId, number>
): ScrapRunConfig {
  const afterburners = upgrades.afterburners ?? 0;
  const timeDilation = upgrades.timeDilation ?? 0;

  return {
    ...base,
    strafeSpeed: base.strafeSpeed + afterburners * 0.04,
    maxStrafe: base.maxStrafe + afterburners * 0.5,
    debrisSpeed: base.debrisSpeed * (1 - timeDilation * 0.12),
    spawnInterval: base.spawnInterval * (1 + timeDilation * 0.15),
  };
}
