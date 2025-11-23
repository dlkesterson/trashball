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
