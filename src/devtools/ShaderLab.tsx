import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { createOrbMaterial } from '../orb/orbMaterial';
import { CALM_IDLE_PRESET, OVERCHARGED_PRESET, SUPER_CRITICAL_PRESET } from '../orb/orbPresets';

type ControlState = {
  color1: string;
  color2: string;
  chargeColor: string;
  charge: number;
  wobbleIntensity: number;
  patternScale: number;
  fresnelIntensity: number;
  bandStrength: number;
  bandFrequency: number;
  crackThreshold: number;
  crackSharpness: number;
  pulseSpeed: number;
  pulseStrength: number;
  facetSteps: number;
  glitchIntensity: number;
  wireIntensity: number;
  wireThickness: number;
  sparkIntensity: number;
  blackHoleIntensity: number;
  coreRadius: number;
  ringIntensity: number;
  warpStrength: number;
  vineIntensity: number;
  vineWidth: number;
  mossStrength: number;
  flameIntensity: number;
  flameScale: number;
  flameSpeed: number;
  flameNoiseDetail: number;
  coreIntensity: number;
  scrapIntensity: number;
  streakStrength: number;
  impactSparkIntensity: number;
  holoIntensity: number;
  scanSpeed: number;
  sludgeIntensity: number;
  dripScale: number;
  glowStrength: number;
  frostIntensity: number;
  frostSharpness: number;
  particleCount: number;
  bloomStrength: number;
  bloomThreshold: number;
};

const NUMERIC_UNIFORM_KEYS: Array<keyof ControlState> = [
  'charge',
  'wobbleIntensity',
  'patternScale',
  'fresnelIntensity',
  'bandStrength',
  'bandFrequency',
  'crackThreshold',
  'crackSharpness',
  'pulseSpeed',
  'pulseStrength',
  'facetSteps',
  'glitchIntensity',
  'wireIntensity',
  'wireThickness',
  'sparkIntensity',
  'blackHoleIntensity',
  'coreRadius',
  'ringIntensity',
  'warpStrength',
  'vineIntensity',
  'vineWidth',
  'mossStrength',
  'flameIntensity',
  'flameScale',
  'flameSpeed',
  'flameNoiseDetail',
  'coreIntensity',
  'scrapIntensity',
  'streakStrength',
  'impactSparkIntensity',
  'holoIntensity',
  'scanSpeed',
  'sludgeIntensity',
  'dripScale',
  'glowStrength',
  'frostIntensity',
  'frostSharpness',
];

const presetToControls = (preset: typeof CALM_IDLE_PRESET): ControlState => ({
  color1: preset.uniforms.color1,
  color2: preset.uniforms.color2,
  chargeColor: preset.uniforms.chargeColor,
  charge: preset.uniforms.chargeLevel,
  wobbleIntensity: preset.uniforms.wobbleIntensity,
  patternScale: preset.uniforms.patternScale,
  fresnelIntensity: preset.uniforms.fresnelIntensity,
  bandStrength: preset.uniforms.bandStrength ?? 0,
  bandFrequency: preset.uniforms.bandFrequency ?? 6,
  crackThreshold: preset.uniforms.crackThreshold ?? 0.75,
  crackSharpness: preset.uniforms.crackSharpness ?? 0,
  pulseSpeed: preset.uniforms.pulseSpeed ?? 2.5,
  pulseStrength: preset.uniforms.pulseStrength ?? 0,
  facetSteps: preset.uniforms.facetSteps ?? 0,
  glitchIntensity: preset.uniforms.glitchIntensity ?? 0,
  wireIntensity: preset.uniforms.wireIntensity ?? 0,
  wireThickness: preset.uniforms.wireThickness ?? 0.25,
  sparkIntensity: preset.uniforms.sparkIntensity ?? 0,
  blackHoleIntensity: preset.uniforms.blackHoleIntensity ?? 0,
  coreRadius: preset.uniforms.coreRadius ?? 0.75,
  ringIntensity: preset.uniforms.ringIntensity ?? 0,
  warpStrength: preset.uniforms.warpStrength ?? 0,
  vineIntensity: preset.uniforms.vineIntensity ?? 0,
  vineWidth: preset.uniforms.vineWidth ?? 0.35,
  mossStrength: preset.uniforms.mossStrength ?? 0,
  flameIntensity: preset.uniforms.flameIntensity ?? 0,
  flameScale: preset.uniforms.flameScale ?? 1.5,
  flameSpeed: preset.uniforms.flameSpeed ?? 1.2,
  flameNoiseDetail: preset.uniforms.flameNoiseDetail ?? 1,
  coreIntensity: preset.uniforms.coreIntensity ?? 0,
  scrapIntensity: preset.uniforms.scrapIntensity ?? 0,
  streakStrength: preset.uniforms.streakStrength ?? 0,
  impactSparkIntensity: preset.uniforms.impactSparkIntensity ?? 0,
  holoIntensity: preset.uniforms.holoIntensity ?? 0,
  scanSpeed: preset.uniforms.scanSpeed ?? 1,
  sludgeIntensity: preset.uniforms.sludgeIntensity ?? 0,
  dripScale: preset.uniforms.dripScale ?? 1.2,
  glowStrength: preset.uniforms.glowStrength ?? 0.2,
  frostIntensity: preset.uniforms.frostIntensity ?? 0,
  frostSharpness: preset.uniforms.frostSharpness ?? 10,
  particleCount: preset.particles,
  bloomStrength: preset.bloom.strength,
  bloomThreshold: preset.bloom.threshold,
});

const PRESETS: Record<string, ControlState> = {
  calm: presetToControls(CALM_IDLE_PRESET),
  overcharged: presetToControls(OVERCHARGED_PRESET),
  critical: presetToControls(SUPER_CRITICAL_PRESET),
};

const DEFAULT_CONTROLS: ControlState = PRESETS.calm;

const buildMaterialConfig = (state: ControlState) => {
  const uniforms: Record<string, number | string> = {
    color1: state.color1,
    color2: state.color2,
    chargeColor: state.chargeColor,
  };
  NUMERIC_UNIFORM_KEYS.forEach((key) => {
    const uniformName = key === 'charge' ? 'chargeLevel' : key;
    uniforms[uniformName] = state[key];
  });
  return uniforms;
};

export default function ShaderLab() {
  const mountRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<THREE.Points | null>(null);
  const particleGeometryRef = useRef<THREE.BufferGeometry | null>(null);
  const stateRef = useRef<ControlState>(DEFAULT_CONTROLS);

  const [controls, setControls] = useState<ControlState>(() => ({ ...DEFAULT_CONTROLS }));

  stateRef.current = controls;

  const presetOptions = useMemo(
    () => [
      { id: 'calm', label: 'Calm Idle' },
      { id: 'overcharged', label: 'Overcharged' },
      { id: 'critical', label: 'Critical Surge' },
    ],
    []
  );

  useEffect(() => {
    if (!mountRef.current) return;

    const container = mountRef.current;
    const getDimensions = () => {
      const width = container.clientWidth || window.innerWidth;
      const height = container.clientHeight || Math.max(400, window.innerHeight * 0.6);
      return { width, height };
    };
    const { width: initialWidth, height: initialHeight } = getDimensions();
    container.style.minHeight = `${initialHeight}px`;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#05070f');

    const camera = new THREE.PerspectiveCamera(
      60,
      initialWidth / initialHeight,
      0.1,
      100
    );
    camera.position.set(0, 0, 5);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(initialWidth, initialHeight);
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    container.appendChild(renderer.domElement);

    const orbGeometry = new THREE.SphereGeometry(1, 64, 64);
    const orbMaterial = createOrbMaterial(buildMaterialConfig(controls));

    const orb = new THREE.Mesh(orbGeometry, orbMaterial);
    scene.add(orb);

    const light = new THREE.PointLight(controls.chargeColor, 2, 8);
    light.position.set(0, 0, 3);
    scene.add(light);

    const ambient = new THREE.AmbientLight(0xffffff, 0.1);
    scene.add(ambient);

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(container.clientWidth, container.clientHeight),
      controls.bloomStrength,
      0.8,
      controls.bloomThreshold
    );
    composer.addPass(bloomPass);

    const rebuildParticles = (count: number) => {
      if (particlesRef.current) {
        scene.remove(particlesRef.current);
        particleGeometryRef.current?.dispose();
      }

      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(count * 3);
      const velocities: number[] = [];
      for (let i = 0; i < count; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 2;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 2;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 2;
        velocities.push((Math.random() - 0.5) * 0.02, (Math.random() - 0.5) * 0.02, (Math.random() - 0.5) * 0.02);
      }
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('velocity', new THREE.BufferAttribute(new Float32Array(velocities), 3));

      const material = new THREE.PointsMaterial({
        color: controls.chargeColor,
        size: 0.05,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
      });

      const points = new THREE.Points(geometry, material);
      particlesRef.current = points;
      particleGeometryRef.current = geometry;
      scene.add(points);
    };

    rebuildParticles(controls.particleCount);

    const clock = new THREE.Clock();
    let animationId = 0;

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();
      const delta = clock.getDelta();
      const current = stateRef.current!;

      orbMaterial.uniforms.time.value = elapsed;
      orbMaterial.uniforms.chargeLevel.value = current.charge;
      orbMaterial.uniforms.color1.value.set(current.color1);
      orbMaterial.uniforms.color2.value.set(current.color2);
      orbMaterial.uniforms.chargeColor.value.set(current.chargeColor);
      orbMaterial.uniforms.wobbleIntensity.value = current.wobbleIntensity;
      orbMaterial.uniforms.patternScale.value = current.patternScale;
      orbMaterial.uniforms.fresnelIntensity.value = current.fresnelIntensity;
      NUMERIC_UNIFORM_KEYS.forEach((key) => {
        if (key === 'charge') return;
        const uniform = orbMaterial.uniforms[key as keyof typeof orbMaterial.uniforms];
        if (uniform) {
          uniform.value = current[key];
        }
      });

      light.color = new THREE.Color(current.chargeColor);
      light.intensity = 2 + current.charge * 2;

      if (particlesRef.current) {
        const positions = particlesRef.current.geometry.attributes.position as THREE.BufferAttribute;
        const velocities = particlesRef.current.geometry.attributes.velocity as THREE.BufferAttribute;
        for (let i = 0; i < positions.count; i++) {
          const vx = velocities.getX(i);
          const vy = velocities.getY(i);
          const vz = velocities.getZ(i);
          positions.setXYZ(i, positions.getX(i) + vx * (1 + current.charge * 5), positions.getY(i) + vy * (1 + current.charge * 5), positions.getZ(i) + vz * (1 + current.charge * 5));
          const dist = Math.sqrt(
            positions.getX(i) ** 2 + positions.getY(i) ** 2 + positions.getZ(i) ** 2
          );
          if (dist > 2) {
            positions.setXYZ(i, (Math.random() - 0.5) * 0.2, (Math.random() - 0.5) * 0.2, (Math.random() - 0.5) * 0.2);
          }
        }
        positions.needsUpdate = true;
      }

      bloomPass.strength = current.bloomStrength;
      bloomPass.threshold = current.bloomThreshold;

      const heartbeat = 1 + Math.sin(elapsed * 2) * 0.05;
      orb.rotation.y += delta * (0.6 + current.charge * 3);
      orb.rotation.x = Math.sin(elapsed * 0.5) * 0.2;
      orb.scale.setScalar(heartbeat + current.charge * 0.2);
      orb.position.y = Math.sin(elapsed * 1.5) * 0.1;

      composer.render();
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const { width, height } = getDimensions();
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      composer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      orbGeometry.dispose();
      orbMaterial.dispose();
      particleGeometryRef.current?.dispose();
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, []);

  useEffect(() => {
    if (particlesRef.current && particleGeometryRef.current) {
      const material = particlesRef.current.material as THREE.PointsMaterial;
      material.color = new THREE.Color(controls.chargeColor);
    }
  }, [controls.chargeColor]);

  useEffect(() => {
    if (!particlesRef.current || !particleGeometryRef.current || !mountRef.current) return;
    const scene = particlesRef.current.parent;
    if (!scene) return;

    const rebuild = () => {
      const count = controls.particleCount;
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(count * 3);
      const velocities: number[] = [];
      for (let i = 0; i < count; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 2;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 2;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 2;
        velocities.push((Math.random() - 0.5) * 0.02, (Math.random() - 0.5) * 0.02, (Math.random() - 0.5) * 0.02);
      }
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('velocity', new THREE.BufferAttribute(new Float32Array(velocities), 3));
      const material = particlesRef.current!.material;
      scene.remove(particlesRef.current!);
      particleGeometryRef.current?.dispose();
      const next = new THREE.Points(geometry, material);
      particlesRef.current = next;
      particleGeometryRef.current = geometry;
      scene.add(next);
    };

    rebuild();
  }, [controls.particleCount]);

  const applyPreset = (id: string) => {
    const preset = PRESETS[id];
    if (!preset) return;
    setControls({ ...preset });
  };

  const exportConfig = () => {
    const payload = {
      uniforms: buildMaterialConfig(controls),
      particles: controls.particleCount,
      bloom: {
        strength: controls.bloomStrength,
        threshold: controls.bloomThreshold,
      },
    };
    // eslint-disable-next-line no-console
    console.log('ShaderLab preset', payload);
  };

  const ControlSlider = ({
    label,
    value,
    min,
    max,
    step,
    onChange,
  }: {
    label: string;
    value: number;
    min: number;
    max: number;
    step: number;
    onChange: (n: number) => void;
  }) => (
    <div>
      <div className="flex justify-between text-xs text-slate-400 mb-1">
        <span>{label}</span>
        <span className="text-slate-200">{value.toFixed(2)}</span>
      </div>
      <input
        type="range"
        className="w-full"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 grid grid-cols-1 lg:grid-cols-[2fr_1fr]">
      <div className="relative">
        <div ref={mountRef} className="w-full h-[60vh] lg:h-screen" />
        <div className="absolute top-4 left-4 bg-black/50 px-3 py-2 rounded text-xs text-slate-300">
          Dev Tool: ShaderLab — use ?devTool=shader
        </div>
      </div>
      <div className="p-6 space-y-4 bg-slate-900/80 border-l border-slate-800 overflow-y-auto">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 uppercase">Presets</div>
            <div className="text-lg font-semibold">Orb Shader Playground</div>
          </div>
          <select
            className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm"
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) applyPreset(e.target.value);
            }}
          >
            <option value="">Choose</option>
            {presetOptions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <ColorInput
            label="Color 1"
            value={controls.color1}
            onChange={(color) => setControls((c) => ({ ...c, color1: color }))}
          />
          <ColorInput
            label="Color 2"
            value={controls.color2}
            onChange={(color) => setControls((c) => ({ ...c, color2: color }))}
          />
          <ColorInput
            label="Charge Color"
            value={controls.chargeColor}
            onChange={(color) => setControls((c) => ({ ...c, chargeColor: color }))}
          />
        </div>

        <ControlSlider
          label="Charge Level"
          value={controls.charge}
          min={0}
          max={1}
          step={0.01}
          onChange={(n) => setControls((c) => ({ ...c, charge: n }))}
        />
        <ControlSlider
          label="Wobble Intensity"
          value={controls.wobbleIntensity}
          min={0}
          max={3}
          step={0.05}
          onChange={(n) => setControls((c) => ({ ...c, wobbleIntensity: n }))}
        />
        <ControlSlider
          label="Pattern Scale"
          value={controls.patternScale}
          min={0.5}
          max={6}
          step={0.05}
          onChange={(n) => setControls((c) => ({ ...c, patternScale: n }))}
        />
        <ControlSlider
          label="Fresnel Intensity"
          value={controls.fresnelIntensity}
          min={0}
          max={3}
          step={0.05}
          onChange={(n) => setControls((c) => ({ ...c, fresnelIntensity: n }))}
        />
        <div className="pt-4 border-t border-slate-800">
          <div className="text-xs uppercase tracking-[0.3em] text-slate-500 mb-2">Structure</div>
          <ControlSlider label="Band Strength" value={controls.bandStrength} min={0} max={1} step={0.01} onChange={(n) => setControls((c) => ({ ...c, bandStrength: n }))} />
          <ControlSlider label="Band Frequency" value={controls.bandFrequency} min={2} max={20} step={0.5} onChange={(n) => setControls((c) => ({ ...c, bandFrequency: n }))} />
          <ControlSlider label="Crack Threshold" value={controls.crackThreshold} min={0} max={1} step={0.01} onChange={(n) => setControls((c) => ({ ...c, crackThreshold: n }))} />
          <ControlSlider label="Crack Sharpness" value={controls.crackSharpness} min={0} max={10} step={0.2} onChange={(n) => setControls((c) => ({ ...c, crackSharpness: n }))} />
          <ControlSlider label="Pulse Speed" value={controls.pulseSpeed} min={0} max={8} step={0.1} onChange={(n) => setControls((c) => ({ ...c, pulseSpeed: n }))} />
          <ControlSlider label="Pulse Strength" value={controls.pulseStrength} min={0} max={1.5} step={0.05} onChange={(n) => setControls((c) => ({ ...c, pulseStrength: n }))} />
          <ControlSlider label="Facet Steps" value={controls.facetSteps} min={0} max={32} step={1} onChange={(n) => setControls((c) => ({ ...c, facetSteps: Math.max(0, Math.round(n)) }))} />
          <ControlSlider label="Glitch Intensity" value={controls.glitchIntensity} min={0} max={1} step={0.05} onChange={(n) => setControls((c) => ({ ...c, glitchIntensity: n }))} />
        </div>
        <div className="pt-4 border-t border-slate-800">
          <div className="text-xs uppercase tracking-[0.3em] text-slate-500 mb-2">Barbed Wire</div>
          <ControlSlider label="Wire Intensity" value={controls.wireIntensity} min={0} max={1} step={0.01} onChange={(n) => setControls((c) => ({ ...c, wireIntensity: n }))} />
          <ControlSlider label="Wire Thickness" value={controls.wireThickness} min={0.05} max={1} step={0.05} onChange={(n) => setControls((c) => ({ ...c, wireThickness: n }))} />
          <ControlSlider label="Spark Intensity" value={controls.sparkIntensity} min={0} max={1} step={0.05} onChange={(n) => setControls((c) => ({ ...c, sparkIntensity: n }))} />
        </div>
        <div className="pt-4 border-t border-slate-800">
          <div className="text-xs uppercase tracking-[0.3em] text-slate-500 mb-2">Singularity</div>
          <ControlSlider label="Gravity Intensity" value={controls.blackHoleIntensity} min={0} max={1} step={0.01} onChange={(n) => setControls((c) => ({ ...c, blackHoleIntensity: n }))} />
          <ControlSlider label="Core Radius" value={controls.coreRadius} min={0.2} max={1} step={0.02} onChange={(n) => setControls((c) => ({ ...c, coreRadius: n }))} />
          <ControlSlider label="Ring Intensity" value={controls.ringIntensity} min={0} max={1} step={0.05} onChange={(n) => setControls((c) => ({ ...c, ringIntensity: n }))} />
          <ControlSlider label="Warp Strength" value={controls.warpStrength} min={0} max={1} step={0.05} onChange={(n) => setControls((c) => ({ ...c, warpStrength: n }))} />
        </div>
        <div className="pt-4 border-t border-slate-800">
          <div className="text-xs uppercase tracking-[0.3em] text-slate-500 mb-2">Vine Growth</div>
          <ControlSlider label="Vine Intensity" value={controls.vineIntensity} min={0} max={1} step={0.01} onChange={(n) => setControls((c) => ({ ...c, vineIntensity: n }))} />
          <ControlSlider label="Vine Width" value={controls.vineWidth} min={0.05} max={1} step={0.02} onChange={(n) => setControls((c) => ({ ...c, vineWidth: n }))} />
          <ControlSlider label="Moss Strength" value={controls.mossStrength} min={0} max={1} step={0.05} onChange={(n) => setControls((c) => ({ ...c, mossStrength: n }))} />
        </div>
        <div className="pt-4 border-t border-slate-800">
          <div className="text-xs uppercase tracking-[0.3em] text-slate-500 mb-2">Flame Core</div>
          <ControlSlider label="Flame Intensity" value={controls.flameIntensity} min={0} max={1.5} step={0.05} onChange={(n) => setControls((c) => ({ ...c, flameIntensity: n }))} />
          <ControlSlider label="Flame Scale" value={controls.flameScale} min={0.5} max={3.5} step={0.1} onChange={(n) => setControls((c) => ({ ...c, flameScale: n }))} />
          <ControlSlider label="Flame Speed" value={controls.flameSpeed} min={0} max={5} step={0.1} onChange={(n) => setControls((c) => ({ ...c, flameSpeed: n }))} />
          <ControlSlider label="Noise Detail" value={controls.flameNoiseDetail} min={0.3} max={3} step={0.05} onChange={(n) => setControls((c) => ({ ...c, flameNoiseDetail: n }))} />
          <ControlSlider label="Core Intensity" value={controls.coreIntensity} min={0} max={1.5} step={0.05} onChange={(n) => setControls((c) => ({ ...c, coreIntensity: n }))} />
        </div>
        <div className="pt-4 border-t border-slate-800">
          <div className="text-xs uppercase tracking-[0.3em] text-slate-500 mb-2">Scrap Magnet</div>
          <ControlSlider label="Scrap Intensity" value={controls.scrapIntensity} min={0} max={1} step={0.01} onChange={(n) => setControls((c) => ({ ...c, scrapIntensity: n }))} />
          <ControlSlider label="Streak Strength" value={controls.streakStrength} min={0} max={1} step={0.05} onChange={(n) => setControls((c) => ({ ...c, streakStrength: n }))} />
          <ControlSlider label="Impact Sparks" value={controls.impactSparkIntensity} min={0} max={1} step={0.05} onChange={(n) => setControls((c) => ({ ...c, impactSparkIntensity: n }))} />
        </div>
        <div className="pt-4 border-t border-slate-800">
          <div className="text-xs uppercase tracking-[0.3em] text-slate-500 mb-2">Hologram & Sludge</div>
          <ControlSlider label="Holo Intensity" value={controls.holoIntensity} min={0} max={1} step={0.05} onChange={(n) => setControls((c) => ({ ...c, holoIntensity: n }))} />
          <ControlSlider label="Scan Speed" value={controls.scanSpeed} min={0} max={4} step={0.1} onChange={(n) => setControls((c) => ({ ...c, scanSpeed: n }))} />
          <ControlSlider label="Sludge Intensity" value={controls.sludgeIntensity} min={0} max={1} step={0.05} onChange={(n) => setControls((c) => ({ ...c, sludgeIntensity: n }))} />
          <ControlSlider label="Drip Scale" value={controls.dripScale} min={0.2} max={3} step={0.1} onChange={(n) => setControls((c) => ({ ...c, dripScale: n }))} />
          <ControlSlider label="Glow Strength" value={controls.glowStrength} min={0} max={0.6} step={0.02} onChange={(n) => setControls((c) => ({ ...c, glowStrength: n }))} />
        </div>
        <div className="pt-4 border-t border-slate-800">
          <div className="text-xs uppercase tracking-[0.3em] text-slate-500 mb-2">Frost</div>
          <ControlSlider label="Frost Intensity" value={controls.frostIntensity} min={0} max={1} step={0.01} onChange={(n) => setControls((c) => ({ ...c, frostIntensity: n }))} />
          <ControlSlider label="Shard Sharpness" value={controls.frostSharpness} min={1} max={20} step={0.5} onChange={(n) => setControls((c) => ({ ...c, frostSharpness: n }))} />
        </div>
        <ControlSlider
          label="Particle Count"
          value={controls.particleCount}
          min={20}
          max={400}
          step={10}
          onChange={(n) => setControls((c) => ({ ...c, particleCount: Math.floor(n) }))}
        />
        <ControlSlider
          label="Bloom Strength"
          value={controls.bloomStrength}
          min={0}
          max={2.5}
          step={0.05}
          onChange={(n) => setControls((c) => ({ ...c, bloomStrength: n }))}
        />
        <ControlSlider
          label="Bloom Threshold"
          value={controls.bloomThreshold}
          min={0}
          max={1}
          step={0.01}
          onChange={(n) => setControls((c) => ({ ...c, bloomThreshold: n }))}
        />

        <button
          onClick={exportConfig}
          className="w-full py-2 rounded bg-cyan-700 hover:bg-cyan-600 text-sm font-semibold"
        >
          Export Preset to Console
        </button>
      </div>
    </div>
  );
}

function ColorInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
}) {
  return (
    <label className="text-xs text-slate-300 space-y-1">
      <span className="block">{label}</span>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-10 rounded border border-slate-700 bg-slate-800"
      />
    </label>
  );
}
