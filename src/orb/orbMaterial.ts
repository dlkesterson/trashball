import * as THREE from 'three';
import { CALM_IDLE_PRESET } from './orbPresets';

type ColorInput = THREE.Color | number | string;

export type OrbUniformValues = {
  chargeLevel: number;
  color1: ColorInput;
  color2: ColorInput;
  chargeColor: ColorInput;
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

const defaultColors = {
  color1: new THREE.Color(CALM_IDLE_PRESET.uniforms.color1).getHex(),
  color2: new THREE.Color(CALM_IDLE_PRESET.uniforms.color2).getHex(),
  chargeColor: new THREE.Color(CALM_IDLE_PRESET.uniforms.chargeColor).getHex(),
};

const asColor = (value: ColorInput | undefined, fallback: number) => {
  if (value instanceof THREE.Color) return value;
  if (value !== undefined) return new THREE.Color(value);
  return new THREE.Color(fallback);
};

export const DEFAULT_ORB_UNIFORMS: OrbUniformValues = {
  chargeLevel: CALM_IDLE_PRESET.uniforms.chargeLevel,
  color1: asColor(undefined, defaultColors.color1),
  color2: asColor(undefined, defaultColors.color2),
  chargeColor: asColor(undefined, defaultColors.chargeColor),
  wobbleIntensity: CALM_IDLE_PRESET.uniforms.wobbleIntensity,
  patternScale: CALM_IDLE_PRESET.uniforms.patternScale,
  fresnelIntensity: CALM_IDLE_PRESET.uniforms.fresnelIntensity,
  bandStrength: CALM_IDLE_PRESET.uniforms.bandStrength ?? 0,
  bandFrequency: CALM_IDLE_PRESET.uniforms.bandFrequency ?? 6,
  crackThreshold: CALM_IDLE_PRESET.uniforms.crackThreshold ?? 0.75,
  crackSharpness: CALM_IDLE_PRESET.uniforms.crackSharpness ?? 0,
  pulseSpeed: CALM_IDLE_PRESET.uniforms.pulseSpeed ?? 2.5,
  pulseStrength: CALM_IDLE_PRESET.uniforms.pulseStrength ?? 0,
  facetSteps: CALM_IDLE_PRESET.uniforms.facetSteps ?? 0,
  glitchIntensity: CALM_IDLE_PRESET.uniforms.glitchIntensity ?? 0,
  wireIntensity: CALM_IDLE_PRESET.uniforms.wireIntensity ?? 0,
  wireThickness: CALM_IDLE_PRESET.uniforms.wireThickness ?? 0.25,
  sparkIntensity: CALM_IDLE_PRESET.uniforms.sparkIntensity ?? 0,
  blackHoleIntensity: CALM_IDLE_PRESET.uniforms.blackHoleIntensity ?? 0,
  coreRadius: CALM_IDLE_PRESET.uniforms.coreRadius ?? 0.75,
  ringIntensity: CALM_IDLE_PRESET.uniforms.ringIntensity ?? 0,
  warpStrength: CALM_IDLE_PRESET.uniforms.warpStrength ?? 0,
  vineIntensity: CALM_IDLE_PRESET.uniforms.vineIntensity ?? 0,
  vineWidth: CALM_IDLE_PRESET.uniforms.vineWidth ?? 0.3,
  mossStrength: CALM_IDLE_PRESET.uniforms.mossStrength ?? 0,
  flameIntensity: CALM_IDLE_PRESET.uniforms.flameIntensity ?? 0,
  flameScale: CALM_IDLE_PRESET.uniforms.flameScale ?? 1.5,
  flameSpeed: CALM_IDLE_PRESET.uniforms.flameSpeed ?? 1.2,
  flameNoiseDetail: CALM_IDLE_PRESET.uniforms.flameNoiseDetail ?? 1,
  coreIntensity: CALM_IDLE_PRESET.uniforms.coreIntensity ?? 0,
  scrapIntensity: CALM_IDLE_PRESET.uniforms.scrapIntensity ?? 0,
  streakStrength: CALM_IDLE_PRESET.uniforms.streakStrength ?? 0,
  impactSparkIntensity: CALM_IDLE_PRESET.uniforms.impactSparkIntensity ?? 0,
  holoIntensity: CALM_IDLE_PRESET.uniforms.holoIntensity ?? 0,
  scanSpeed: CALM_IDLE_PRESET.uniforms.scanSpeed ?? 1,
  sludgeIntensity: CALM_IDLE_PRESET.uniforms.sludgeIntensity ?? 0,
  dripScale: CALM_IDLE_PRESET.uniforms.dripScale ?? 1.2,
  glowStrength: CALM_IDLE_PRESET.uniforms.glowStrength ?? 0.2,
  frostIntensity: CALM_IDLE_PRESET.uniforms.frostIntensity ?? 0,
  frostSharpness: CALM_IDLE_PRESET.uniforms.frostSharpness ?? 10,
};

export function createOrbMaterial(initial?: Partial<OrbUniformValues>): THREE.ShaderMaterial {
  const uniforms: Record<keyof OrbUniformValues | 'time', { value: any }> = {
    time: { value: 0 },
    chargeLevel: { value: initial?.chargeLevel ?? DEFAULT_ORB_UNIFORMS.chargeLevel },
    color1: { value: asColor(initial?.color1, defaultColors.color1) },
    color2: { value: asColor(initial?.color2, defaultColors.color2) },
    chargeColor: { value: asColor(initial?.chargeColor, defaultColors.chargeColor) },
    wobbleIntensity: { value: initial?.wobbleIntensity ?? DEFAULT_ORB_UNIFORMS.wobbleIntensity },
    patternScale: { value: initial?.patternScale ?? DEFAULT_ORB_UNIFORMS.patternScale },
    fresnelIntensity: { value: initial?.fresnelIntensity ?? DEFAULT_ORB_UNIFORMS.fresnelIntensity },
    bandStrength: { value: initial?.bandStrength ?? DEFAULT_ORB_UNIFORMS.bandStrength ?? 0 },
    bandFrequency: { value: initial?.bandFrequency ?? DEFAULT_ORB_UNIFORMS.bandFrequency ?? 6 },
    crackThreshold: { value: initial?.crackThreshold ?? DEFAULT_ORB_UNIFORMS.crackThreshold ?? 0.75 },
    crackSharpness: { value: initial?.crackSharpness ?? DEFAULT_ORB_UNIFORMS.crackSharpness ?? 0 },
    pulseSpeed: { value: initial?.pulseSpeed ?? DEFAULT_ORB_UNIFORMS.pulseSpeed ?? 2.5 },
    pulseStrength: { value: initial?.pulseStrength ?? DEFAULT_ORB_UNIFORMS.pulseStrength ?? 0 },
    facetSteps: { value: initial?.facetSteps ?? DEFAULT_ORB_UNIFORMS.facetSteps ?? 0 },
    glitchIntensity: { value: initial?.glitchIntensity ?? DEFAULT_ORB_UNIFORMS.glitchIntensity ?? 0 },
    wireIntensity: { value: initial?.wireIntensity ?? DEFAULT_ORB_UNIFORMS.wireIntensity ?? 0 },
    wireThickness: { value: initial?.wireThickness ?? DEFAULT_ORB_UNIFORMS.wireThickness ?? 0.25 },
    sparkIntensity: { value: initial?.sparkIntensity ?? DEFAULT_ORB_UNIFORMS.sparkIntensity ?? 0 },
    blackHoleIntensity: { value: initial?.blackHoleIntensity ?? DEFAULT_ORB_UNIFORMS.blackHoleIntensity ?? 0 },
    coreRadius: { value: initial?.coreRadius ?? DEFAULT_ORB_UNIFORMS.coreRadius ?? 0.75 },
    ringIntensity: { value: initial?.ringIntensity ?? DEFAULT_ORB_UNIFORMS.ringIntensity ?? 0 },
    warpStrength: { value: initial?.warpStrength ?? DEFAULT_ORB_UNIFORMS.warpStrength ?? 0 },
    vineIntensity: { value: initial?.vineIntensity ?? DEFAULT_ORB_UNIFORMS.vineIntensity ?? 0 },
    vineWidth: { value: initial?.vineWidth ?? DEFAULT_ORB_UNIFORMS.vineWidth ?? 0.3 },
    mossStrength: { value: initial?.mossStrength ?? DEFAULT_ORB_UNIFORMS.mossStrength ?? 0 },
    flameIntensity: { value: initial?.flameIntensity ?? DEFAULT_ORB_UNIFORMS.flameIntensity ?? 0 },
    flameScale: { value: initial?.flameScale ?? DEFAULT_ORB_UNIFORMS.flameScale ?? 1.5 },
    flameSpeed: { value: initial?.flameSpeed ?? DEFAULT_ORB_UNIFORMS.flameSpeed ?? 1.2 },
    flameNoiseDetail: { value: initial?.flameNoiseDetail ?? DEFAULT_ORB_UNIFORMS.flameNoiseDetail ?? 1 },
    coreIntensity: { value: initial?.coreIntensity ?? DEFAULT_ORB_UNIFORMS.coreIntensity ?? 0 },
    scrapIntensity: { value: initial?.scrapIntensity ?? DEFAULT_ORB_UNIFORMS.scrapIntensity ?? 0 },
    streakStrength: { value: initial?.streakStrength ?? DEFAULT_ORB_UNIFORMS.streakStrength ?? 0 },
    impactSparkIntensity: { value: initial?.impactSparkIntensity ?? DEFAULT_ORB_UNIFORMS.impactSparkIntensity ?? 0 },
    holoIntensity: { value: initial?.holoIntensity ?? DEFAULT_ORB_UNIFORMS.holoIntensity ?? 0 },
    scanSpeed: { value: initial?.scanSpeed ?? DEFAULT_ORB_UNIFORMS.scanSpeed ?? 1 },
    sludgeIntensity: { value: initial?.sludgeIntensity ?? DEFAULT_ORB_UNIFORMS.sludgeIntensity ?? 0 },
    dripScale: { value: initial?.dripScale ?? DEFAULT_ORB_UNIFORMS.dripScale ?? 1.2 },
    glowStrength: { value: initial?.glowStrength ?? DEFAULT_ORB_UNIFORMS.glowStrength ?? 0.2 },
    frostIntensity: { value: initial?.frostIntensity ?? DEFAULT_ORB_UNIFORMS.frostIntensity ?? 0 },
    frostSharpness: { value: initial?.frostSharpness ?? DEFAULT_ORB_UNIFORMS.frostSharpness ?? 10 },
  };

  return new THREE.ShaderMaterial({
    uniforms,
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vPosition;
      uniform float time;
      uniform float chargeLevel;
      uniform float wobbleIntensity;
      uniform float patternScale;
      uniform float vineIntensity;
      uniform float vineWidth;

      float vineMaskValue(vec3 unitPos) {
        if (vineIntensity <= 0.0 || vineWidth <= 0.0) return 0.0;
        float theta = atan(unitPos.z, unitPos.x);
        float phi = asin(unitPos.y);
        float primary = smoothstep(vineWidth, 0.0, abs(phi - theta * 0.4));
        float secondary = smoothstep(vineWidth * 0.8, 0.0, abs(phi + theta * 0.35 + 0.6));
        return max(primary, secondary);
      }

      void main() {
        vNormal = normalize(normalMatrix * normal);

        vec3 pos = position;
        vec3 unitPos = normalize(pos);
        float wobble = sin(time * 2.0 + position.y * 3.0) * 0.05 * chargeLevel * wobbleIntensity;
        pos += normal * wobble;

        float vineMask = vineMaskValue(unitPos);
        if (vineMask > 0.0) {
          float vineNoise = 0.5 + 0.5 * sin(unitPos.y * 18.0 + time * 0.6 + unitPos.x * 8.0);
          float vineLift = vineMask * vineIntensity * 0.12 * vineNoise;
          pos += unitPos * vineLift;
        }

        vPosition = pos;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: `
      uniform float time;
      uniform float chargeLevel;
      uniform vec3 color1;
      uniform vec3 color2;
      uniform vec3 chargeColor;
      uniform float patternScale;
      uniform float fresnelIntensity;
      uniform float bandStrength;
      uniform float bandFrequency;
      uniform float crackThreshold;
      uniform float crackSharpness;
      uniform float pulseSpeed;
      uniform float pulseStrength;
      uniform float facetSteps;
      uniform float glitchIntensity;
      uniform float wireIntensity;
      uniform float wireThickness;
      uniform float sparkIntensity;
      uniform float blackHoleIntensity;
      uniform float coreRadius;
      uniform float ringIntensity;
      uniform float warpStrength;
      uniform float vineIntensity;
      uniform float vineWidth;
      uniform float mossStrength;
      uniform float flameIntensity;
      uniform float flameScale;
      uniform float flameSpeed;
      uniform float flameNoiseDetail;
      uniform float coreIntensity;
      uniform float scrapIntensity;
      uniform float streakStrength;
      uniform float impactSparkIntensity;
      uniform float holoIntensity;
      uniform float scanSpeed;
      uniform float sludgeIntensity;
      uniform float dripScale;
      uniform float glowStrength;
      uniform float frostIntensity;
      uniform float frostSharpness;
      varying vec3 vNormal;
      varying vec3 vPosition;

      float hash(vec3 p) {
        return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
      }

      float noise(vec3 p) {
        vec3 i = floor(p);
        vec3 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        float n000 = hash(i + vec3(0.0, 0.0, 0.0));
        float n100 = hash(i + vec3(1.0, 0.0, 0.0));
        float n010 = hash(i + vec3(0.0, 1.0, 0.0));
        float n110 = hash(i + vec3(1.0, 1.0, 0.0));
        float n001 = hash(i + vec3(0.0, 0.0, 1.0));
        float n101 = hash(i + vec3(1.0, 0.0, 1.0));
        float n011 = hash(i + vec3(0.0, 1.0, 1.0));
        float n111 = hash(i + vec3(1.0, 1.0, 1.0));
        float nx00 = mix(n000, n100, f.x);
        float nx10 = mix(n010, n110, f.x);
        float nx01 = mix(n001, n101, f.x);
        float nx11 = mix(n011, n111, f.x);
        float nxy0 = mix(nx00, nx10, f.y);
        float nxy1 = mix(nx01, nx11, f.y);
        return mix(nxy0, nxy1, f.z);
      }

      float fbm(vec3 p) {
        float value = 0.0;
        float amp = 0.5;
        for (int i = 0; i < 5; i++) {
          value += amp * noise(p);
          p *= 2.0;
          amp *= 0.5;
        }
        return value;
      }

      float vineMaskValue(vec3 unitPos) {
        if (vineIntensity <= 0.0 || vineWidth <= 0.0) return 0.0;
        float theta = atan(unitPos.z, unitPos.x);
        float phi = asin(unitPos.y);
        float primary = smoothstep(vineWidth, 0.0, abs(phi - theta * 0.4));
        float secondary = smoothstep(vineWidth * 0.8, 0.0, abs(phi + theta * 0.35 + 0.6));
        return max(primary, secondary);
      }

      vec3 applyBands(vec3 color, vec3 unitPos) {
        if (bandStrength <= 0.0 || bandFrequency <= 0.0) return color;
        float lat = unitPos.y;
        float bands = sin(lat * bandFrequency + time * 0.4);
        bands = bands * bands;
        vec3 bandColor = mix(color1, color2, 0.8);
        return mix(color, bandColor, clamp(bandStrength * bands * chargeLevel, 0.0, 1.0));
      }

      vec3 applyCracks(vec3 color, float pattern) {
        if (crackSharpness <= 0.0) return color;
        float crackNoise = abs(pattern);
        float width = max(0.001, 1.0 / crackSharpness);
        float cracks = smoothstep(crackThreshold, crackThreshold + width, crackNoise);
        vec3 cracked = mix(color, chargeColor, cracks * chargeLevel);
        return cracked + cracks * chargeColor * 0.3;
      }

      vec3 applyPulse(vec3 color, vec3 pos) {
        if (pulseStrength <= 0.0) return color;
        float r = length(pos);
        float wave = sin(r * 8.0 - time * pulseSpeed);
        float pulse = pow(wave * 0.5 + 0.5, 2.0) * pulseStrength * chargeLevel;
        return color + pulse * chargeColor;
      }

      vec3 applyFacets(vec3 color, vec3 normal) {
        if (facetSteps <= 0.0) return color;
        float steps = max(1.0, facetSteps);
        float ndotv = dot(normalize(normal), vec3(0.0, 0.0, 1.0));
        float stepped = floor((ndotv * 0.5 + 0.5) * steps) / steps;
        vec3 faceted = mix(color1, color2, stepped);
        return mix(color, faceted, 0.6);
      }

      vec3 applyGlitch(vec3 color, vec3 pos) {
        if (glitchIntensity <= 0.0) return color;
        float scan = sin(pos.y * 40.0 + time * 6.0);
        float scanMask = step(0.8, scan);
        float jitter = sin(pos.x * 90.0 + time * 40.0);
        float glitch = scanMask * step(0.6, abs(jitter));
        return mix(color, chargeColor, glitch * glitchIntensity * chargeLevel);
      }

      vec3 applyWire(vec3 color, vec3 unitPos) {
        if (wireIntensity <= 0.0) return color;
        vec3 axes[3];
        axes[0] = vec3(1.0, 0.0, 0.0);
        axes[1] = normalize(vec3(0.0, 1.0, 1.0));
        axes[2] = normalize(vec3(1.0, 1.0, 0.0));
        for (int i = 0; i < 3; i++) {
          float proj = abs(dot(axes[i], unitPos));
          float band = smoothstep(1.0 - wireThickness, 1.0, proj);
          float spark = max(0.0, sin(time * 4.0 + float(i) * 1.7 + unitPos.x * 20.0));
          vec3 wireColor = mix(color1, chargeColor, 0.3 + 0.7 * band);
          color = mix(color, wireColor, band * wireIntensity);
          color += spark * sparkIntensity * band * wireIntensity * chargeColor * 0.3;
        }
        return color;
      }

      vec3 applySingularity(vec3 color, vec3 unitPos, vec3 normal) {
        if (blackHoleIntensity <= 0.0) return color;
        float sink = smoothstep(coreRadius, 1.0, length(unitPos));
        vec3 darkened = mix(color, vec3(0.0), sink * blackHoleIntensity);
        float lat = asin(unitPos.y);
        float ring = exp(-lat * lat * 12.0);
        vec3 ringColor = mix(color1, chargeColor, 0.5 + 0.5 * sin(time * 1.5));
        darkened = mix(darkened, ringColor, ring * ringIntensity);
        float rim = pow(1.0 - abs(dot(normal, vec3(0.0, 0.0, 1.0))), 2.0);
        darkened += rim * warpStrength * chargeColor * 0.6;
        return darkened;
      }

      vec3 applyVines(vec3 color, vec3 unitPos) {
        if (vineIntensity <= 0.0) return color;
        float vineMask = vineMaskValue(unitPos);
        if (vineMask <= 0.0) return color;
        vec3 vineColor = mix(color1, color2, 0.2 + 0.6 * vineMask);
        vec3 mossColor = mix(color1, chargeColor, fbm(unitPos * 2.5));
        color = mix(color, vineColor, vineMask * vineIntensity);
        color = mix(color, mossColor, (1.0 - vineMask) * mossStrength * vineIntensity);
        return color;
      }

      vec3 applyFlame(vec3 color, vec3 pos) {
        if (flameIntensity <= 0.0) return color;
        vec3 unitPos = normalize(pos);
        float detailScale = max(0.2, flameNoiseDetail);
        vec3 samplePos = vec3(pos.x, pos.y + time * flameSpeed, pos.z) * flameScale * detailScale;
        float noiseVal = fbm(samplePos);
        float verticalBias = unitPos.y * 0.35;
        float baseMask = smoothstep(0.2, 1.0, noiseVal + verticalBias);
        float tongueMask = smoothstep(0.4, 0.95, noiseVal * 1.4 + unitPos.y * 0.75);
        float fadeOut = smoothstep(0.45, 1.0, unitPos.y);
        float core = smoothstep(0.85, 0.3, length(pos));
        vec3 emberColor = mix(color, chargeColor, core * coreIntensity);
        vec3 flameColor = mix(emberColor, chargeColor, baseMask * flameIntensity);
        vec3 tongueColor = mix(chargeColor, vec3(1.0, 0.65, 0.25), 0.6);
        flameColor = mix(flameColor, tongueColor, tongueMask * fadeOut * flameIntensity);
        float flicker = 0.85 + 0.15 * sin(time * 3.0 + noiseVal * 8.0);
        return flameColor * flicker;
      }

      vec3 applyScrap(vec3 color, vec3 pos) {
        if (scrapIntensity <= 0.0) return color;
        float mask = smoothstep(0.45, 0.9, fbm(pos * 1.8));
        vec3 junk = mix(color2, chargeColor, mask);
        color = mix(color, junk, mask * scrapIntensity);
        vec3 sourceDir = normalize(vec3(0.4, -0.1, 1.0));
        float streak = pow(max(0.0, dot(normalize(pos), sourceDir)), 3.0);
        color = mix(color, chargeColor, streak * streakStrength * scrapIntensity);
        float spark = max(0.0, sin(time * 5.0 + pos.x * 25.0)) * impactSparkIntensity;
        color += streak * spark * chargeColor * scrapIntensity;
        return color;
      }

      vec3 applyHologram(vec3 color, vec3 pos) {
        if (holoIntensity <= 0.0) return color;
        vec3 grid = floor(pos * 6.0) / 6.0;
        float cell = fract(sin(dot(grid, vec3(12.9898, 78.233, 37.719))) * 43758.5453);
        float cellMask = step(0.6, cell);
        color = mix(color, mix(color1, chargeColor, cell), cellMask * holoIntensity);
        float scan = fract(pos.y * 3.5 + time * scanSpeed);
        float scanMask = smoothstep(0.0, 0.25, 0.5 - abs(scan - 0.5));
        return color + scanMask * holoIntensity * 0.4 * chargeColor;
      }

      vec3 applySludge(vec3 color, vec3 pos) {
        if (sludgeIntensity <= 0.0) return color;
        vec3 unitPos = normalize(pos);
        float dripNoise = fbm(vec3(pos.x, pos.y, pos.z) * dripScale + time * 0.3);
        float drip = smoothstep(0.45, 1.0, dripNoise * clamp(-unitPos.y, 0.0, 1.0));
        vec3 sludgeColor = mix(color1, color2, drip);
        color = mix(color, sludgeColor, drip * sludgeIntensity);
        color += (1.0 - drip) * glowStrength * sludgeIntensity * chargeColor;
        return color;
      }

      vec3 applyFrost(vec3 color, vec3 pos) {
        if (frostIntensity <= 0.0) return color;
        float cell = fbm(pos * 4.0);
        float shards = pow(cell, frostSharpness);
        vec3 icy = mix(color1, vec3(0.6, 0.85, 1.0), shards);
        return mix(color, icy, frostIntensity);
      }

      void main() {
        vec3 unitPos = normalize(vPosition);
        float pattern = sin(vPosition.x * patternScale + time) *
                       cos(vPosition.y * patternScale + time * 0.7) *
                       sin(vPosition.z * patternScale + time * 0.5);
        vec3 baseColor = mix(color1, color2, pattern * 0.5 + 0.5);
        vec3 finalColor = mix(baseColor, chargeColor, chargeLevel * 0.7);

        float fresnel = pow(1.0 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
        finalColor += fresnel * chargeColor * chargeLevel * 0.5 * fresnelIntensity;

        finalColor = applyBands(finalColor, unitPos);
        finalColor = applyCracks(finalColor, pattern);
        finalColor = applyPulse(finalColor, vPosition);
        finalColor = applyFacets(finalColor, vNormal);
        finalColor = applyGlitch(finalColor, vPosition);
        finalColor = applyWire(finalColor, unitPos);
        finalColor = applySingularity(finalColor, unitPos, vNormal);
        finalColor = applyVines(finalColor, unitPos);
        finalColor = applyFlame(finalColor, vPosition);
        finalColor = applyScrap(finalColor, vPosition);
        finalColor = applyHologram(finalColor, vPosition);
        finalColor = applySludge(finalColor, vPosition);
        finalColor = applyFrost(finalColor, vPosition);

        float particles = step(0.95, sin(vPosition.x * 20.0 + time * 5.0) *
                                     cos(vPosition.y * 20.0 + time * 3.0));
        finalColor += particles * chargeColor * chargeLevel;

        gl_FragColor = vec4(finalColor, 1.0);
      }
    `,
  });
}
