import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { createOrbMaterial } from '../orb/orbMaterial';
import { CALM_IDLE_PRESET } from '../orb/orbPresets';

type ControlState = {
  color1: string;
  color2: string;
  chargeColor: string;
  charge: number;
  wobbleIntensity: number;
  patternScale: number;
  fresnelIntensity: number;
  particleCount: number;
  bloomStrength: number;
  bloomThreshold: number;
};

const PRESETS: Record<string, Partial<ControlState>> = {
  calm: {
    color1: CALM_IDLE_PRESET.uniforms.color1,
    color2: CALM_IDLE_PRESET.uniforms.color2,
    chargeColor: CALM_IDLE_PRESET.uniforms.chargeColor,
    charge: CALM_IDLE_PRESET.uniforms.chargeLevel,
    wobbleIntensity: CALM_IDLE_PRESET.uniforms.wobbleIntensity,
    patternScale: CALM_IDLE_PRESET.uniforms.patternScale,
    fresnelIntensity: CALM_IDLE_PRESET.uniforms.fresnelIntensity,
    particleCount: CALM_IDLE_PRESET.particles,
    bloomStrength: CALM_IDLE_PRESET.bloom.strength,
    bloomThreshold: CALM_IDLE_PRESET.bloom.threshold,
  },
  overcharged: {
    color1: '#8b5cf6',
    color2: '#ec4899',
    chargeColor: '#f97316',
    charge: 1,
    wobbleIntensity: 1.8,
    patternScale: 3.6,
    fresnelIntensity: 1.4,
    particleCount: 220,
    bloomStrength: 1.8,
    bloomThreshold: 0.3,
  },
  critical: {
    color1: '#0f172a',
    color2: '#38bdf8',
    chargeColor: '#f43f5e',
    charge: 0.8,
    wobbleIntensity: 1.4,
    patternScale: 4.2,
    fresnelIntensity: 2.1,
    particleCount: 180,
    bloomStrength: 1.3,
    bloomThreshold: 0.2,
  },
};

const DEFAULT_CONTROLS: ControlState = {
  color1: CALM_IDLE_PRESET.uniforms.color1,
  color2: CALM_IDLE_PRESET.uniforms.color2,
  chargeColor: CALM_IDLE_PRESET.uniforms.chargeColor,
  charge: CALM_IDLE_PRESET.uniforms.chargeLevel,
  wobbleIntensity: CALM_IDLE_PRESET.uniforms.wobbleIntensity,
  patternScale: CALM_IDLE_PRESET.uniforms.patternScale,
  fresnelIntensity: CALM_IDLE_PRESET.uniforms.fresnelIntensity,
  particleCount: CALM_IDLE_PRESET.particles,
  bloomStrength: CALM_IDLE_PRESET.bloom.strength,
  bloomThreshold: CALM_IDLE_PRESET.bloom.threshold,
};

export default function ShaderLab() {
  const mountRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<THREE.Points | null>(null);
  const particleGeometryRef = useRef<THREE.BufferGeometry | null>(null);
  const stateRef = useRef<ControlState>(DEFAULT_CONTROLS);

  const [controls, setControls] = useState<ControlState>(DEFAULT_CONTROLS);

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
    const orbMaterial = createOrbMaterial({
      color1: controls.color1,
      color2: controls.color2,
      chargeColor: controls.chargeColor,
      chargeLevel: controls.charge,
      wobbleIntensity: controls.wobbleIntensity,
      patternScale: controls.patternScale,
      fresnelIntensity: controls.fresnelIntensity,
    });

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
    setControls((c) => ({ ...c, ...preset }));
  };

  const exportConfig = () => {
    const payload = {
      uniforms: {
        color1: controls.color1,
        color2: controls.color2,
        chargeColor: controls.chargeColor,
        chargeLevel: controls.charge,
        wobbleIntensity: controls.wobbleIntensity,
        patternScale: controls.patternScale,
        fresnelIntensity: controls.fresnelIntensity,
      },
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
