export type OrbVisualPreset = {
  uniforms: {
    color1: string;
    color2: string;
    chargeColor: string;
    chargeLevel: number;
    wobbleIntensity: number;
    patternScale: number;
    fresnelIntensity: number;
  };
  particles: number;
  bloom: {
    strength: number;
    threshold: number;
  };
};

export const CALM_IDLE_PRESET: OrbVisualPreset = {
  uniforms: {
    color1: '#3a3a3a',
    color2: '#1b1208',
    chargeColor: '#8fdc3b',
    chargeLevel: 0.05,
    wobbleIntensity: 2.4,
    patternScale: 3.8,
    fresnelIntensity: 2.2,
  },
  particles: 40,
  bloom: {
    strength: 0.25,
    threshold: 0.1,
  },
};

export const OVERCHARGED_PRESET: OrbVisualPreset = {
  uniforms: {
    color1: '#8b5cf6',
    color2: '#ec4899',
    chargeColor: '#f97316',
    chargeLevel: 1,
    wobbleIntensity: 1.8,
    patternScale: 3.6,
    fresnelIntensity: 1.4,
  },
  particles: 220,
  bloom: {
    strength: 1.8,
    threshold: 0.3,
  },
};

export const SUPER_CRITICAL_PRESET: OrbVisualPreset = {
  uniforms: {
    color1: '#0f172a',
    color2: '#38bdf8',
    chargeColor: '#f43f5e',
    chargeLevel: 1,
    wobbleIntensity: 2.1,
    patternScale: 4.2,
    fresnelIntensity: 2.4,
  },
  particles: 180,
  bloom: {
    strength: 1.3,
    threshold: 0.2,
  },
};
