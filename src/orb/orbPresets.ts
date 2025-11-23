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
    color1: '#121212',
    color2: '#f766f9',
    chargeColor: '#0fa997',
    chargeLevel: 1,
    wobbleIntensity: 0,
    patternScale: 1.55,
    fresnelIntensity: 1.85,
  },
  particles: 400,
  bloom: {
    strength: 1.25,
    threshold: 0.28,
  },
};

export const SUPER_CRITICAL_PRESET: OrbVisualPreset = {
  uniforms: {
    color1: '#e2a66e',
    color2: '#f3311b',
    chargeColor: '#b23434',
    chargeLevel: 1,
    wobbleIntensity: 3,
    patternScale: 0.5,
    fresnelIntensity: 2.45,
  },
  particles: 160,
  bloom: {
    strength: 2.45,
    threshold: 0,
  },
};
