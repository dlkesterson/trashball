export type OrbTimingConfig = {
	chargingThreshold: number;
	superCriticalHoldTime: number; // seconds
	spinSpeed: number;
};

const DEFAULT_CONFIG: OrbTimingConfig = {
	chargingThreshold: 0.4,
	superCriticalHoldTime: 15,
	spinSpeed: 1,
};

let override: Partial<OrbTimingConfig> = {};

export const getOrbTimingConfig = (): OrbTimingConfig => ({
  ...DEFAULT_CONFIG,
  ...override,
});

export const setOrbTimingConfig = (partial: Partial<OrbTimingConfig>) => {
  override = { ...override, ...partial };
};

export const resetOrbTimingConfig = () => {
  override = {};
};
