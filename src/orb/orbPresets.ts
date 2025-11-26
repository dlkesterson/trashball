export type OrbVisualPreset = {
  uniforms: {
    color1: string;
    color2: string;
    chargeColor: string;
    chargeLevel: number;
    wobbleIntensity: number;
    patternScale: number;
    fresnelIntensity: number;
    bandStrength?: number;
    bandFrequency?: number;
    crackThreshold?: number;
    crackSharpness?: number;
    pulseSpeed?: number;
    pulseStrength?: number;
    facetSteps?: number;
    glitchIntensity?: number;
    wireIntensity?: number;
    wireThickness?: number;
    sparkIntensity?: number;
    blackHoleIntensity?: number;
    coreRadius?: number;
    ringIntensity?: number;
    warpStrength?: number;
    vineIntensity?: number;
    vineWidth?: number;
    mossStrength?: number;
    flameIntensity?: number;
    flameScale?: number;
    flameSpeed?: number;
    flameNoiseDetail?: number;
    coreIntensity?: number;
    scrapIntensity?: number;
    streakStrength?: number;
    impactSparkIntensity?: number;
    holoIntensity?: number;
    scanSpeed?: number;
    sludgeIntensity?: number;
    dripScale?: number;
    glowStrength?: number;
    frostIntensity?: number;
    frostSharpness?: number;
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
    bandStrength: 0,
    bandFrequency: 7,
    crackThreshold: 0.75,
    crackSharpness: 0,
    pulseSpeed: 2.5,
    pulseStrength: 0,
    facetSteps: 0,
    glitchIntensity: 0,
    wireIntensity: 0,
    wireThickness: 0.25,
    sparkIntensity: 0,
    blackHoleIntensity: 0,
    coreRadius: 0.75,
    ringIntensity: 0,
    warpStrength: 0,
    vineIntensity: 0,
    vineWidth: 0.35,
    mossStrength: 0,
    flameIntensity: 0,
    flameScale: 1.5,
    flameSpeed: 1.2,
    coreIntensity: 0,
    scrapIntensity: 0,
    streakStrength: 0,
    impactSparkIntensity: 0,
    holoIntensity: 0,
    scanSpeed: 1,
    sludgeIntensity: 0,
    dripScale: 1.2,
    glowStrength: 0.2,
    frostIntensity: 0,
    frostSharpness: 10,
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
    bandStrength: 0.3,
    bandFrequency: 8,
    crackThreshold: 0.45,
    crackSharpness: 4,
    pulseSpeed: 4.5,
    pulseStrength: 0.9,
    facetSteps: 4,
    glitchIntensity: 0.25,
    wireIntensity: 0.6,
    wireThickness: 0.35,
    sparkIntensity: 0.6,
    blackHoleIntensity: 0.3,
    coreRadius: 0.6,
    ringIntensity: 0.4,
    warpStrength: 0.3,
    vineIntensity: 0,
    vineWidth: 0.35,
    mossStrength: 0,
    flameIntensity: 0.8,
    flameScale: 2.2,
    flameSpeed: 3,
    coreIntensity: 0.9,
    scrapIntensity: 0.4,
    streakStrength: 0.35,
    impactSparkIntensity: 0.45,
    holoIntensity: 0.1,
    scanSpeed: 2.5,
    sludgeIntensity: 0,
    dripScale: 1.2,
    glowStrength: 0.2,
    frostIntensity: 0,
    frostSharpness: 10,
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
    bandStrength: 0.5,
    bandFrequency: 11,
    crackThreshold: 0.3,
    crackSharpness: 6,
    pulseSpeed: 6,
    pulseStrength: 1.1,
    facetSteps: 6,
    glitchIntensity: 0.6,
    wireIntensity: 0.85,
    wireThickness: 0.4,
    sparkIntensity: 0.8,
    blackHoleIntensity: 0.7,
    coreRadius: 0.5,
    ringIntensity: 0.85,
    warpStrength: 0.6,
    vineIntensity: 0.15,
    vineWidth: 0.3,
    mossStrength: 0.2,
    flameIntensity: 1.2,
    flameScale: 2.7,
    flameSpeed: 4.2,
    coreIntensity: 1.1,
    scrapIntensity: 0.65,
    streakStrength: 0.6,
    impactSparkIntensity: 0.7,
    holoIntensity: 0.15,
    scanSpeed: 3,
    sludgeIntensity: 0.25,
    dripScale: 1.5,
    glowStrength: 0.35,
    frostIntensity: 0.08,
    frostSharpness: 12,
  },
  particles: 160,
  bloom: {
    strength: 2.45,
    threshold: 0,
  },
};
