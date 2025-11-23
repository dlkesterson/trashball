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

      void main() {
        vNormal = normalize(normalMatrix * normal);
        vPosition = position;

        vec3 pos = position;
        float wobble = sin(time * 2.0 + position.y * 3.0) * 0.05 * chargeLevel * wobbleIntensity;
        pos += normal * wobble;

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
      varying vec3 vNormal;
      varying vec3 vPosition;

      void main() {
        float pattern = sin(vPosition.x * patternScale + time) *
                       cos(vPosition.y * patternScale + time * 0.7) *
                       sin(vPosition.z * patternScale + time * 0.5);

        vec3 baseColor = mix(color1, color2, pattern * 0.5 + 0.5);
        vec3 finalColor = mix(baseColor, chargeColor, chargeLevel * 0.7);

        float fresnel = pow(1.0 - dot(vNormal, vec3(0, 0, 1)), 2.0);
        finalColor += fresnel * chargeColor * chargeLevel * 0.5 * fresnelIntensity;

        float particles = step(0.95, sin(vPosition.x * 20.0 + time * 5.0) *
                                     cos(vPosition.y * 20.0 + time * 3.0));
        finalColor += particles * chargeColor * chargeLevel;

        gl_FragColor = vec4(finalColor, 1.0);
      }
    `,
  });
}
