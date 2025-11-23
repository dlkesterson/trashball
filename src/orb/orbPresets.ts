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
    color1: '#666666',
    color2: '#301e0d',
    chargeColor: '#506f4d',
    chargeLevel: 0.03,
    wobbleIntensity: 2.7,
    patternScale: 4.9,
    fresnelIntensity: 2.55,
  },
  particles: 30,
  bloom: {
    strength: 0,
    threshold: 0.08,
  },
};
