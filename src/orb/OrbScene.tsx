import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { useGameStore } from '../core/GameState';
import { haptic } from '../utils/haptics';
import { audioBus } from '../audio/audioBus';
import { createOrbMaterial } from './orbMaterial';
import { CALM_IDLE_PRESET, OVERCHARGED_PRESET, SUPER_CRITICAL_PRESET } from './orbPresets';

type Props = {
  isHolding: boolean;
};

type VisualState = 'calm' | 'charging' | 'superCritical';

const SUPER_CRITICAL_HOLD_TIME = 15; // seconds of continuous hold before meltdown
const SUPER_CRITICAL_DRAIN_MULTIPLIER = 0.35; // how fast energy bleeds while super critical

const SCRAP_FBX_URLS = Object.values(
  import.meta.glob('../assets/*.fbx', { eager: true, as: 'url' }) as Record<string, string>
);

export default function OrbScene({ isHolding }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const addEnergy = useGameStore((s) => s.addEnergy);
  const setCharge = useGameStore((s) => s.setCharge);
  const energy = useGameStore((s) => s.energy);
  const physics = useGameStore((s) => s.physics);
  const upgrades = useGameStore((s) => s.upgrades);
  const prestigeLevel = useGameStore((s) => s.prestigeLevel);
  const scrap = useGameStore((s) => s.scrap);

  const stateRef = useRef({
    velocity: 0,
    charge: 0,
  });
  const visualStateRef = useRef<VisualState>('calm');
  const holdTimerRef = useRef({ duration: 0, superCritical: false });
  const bloomSettingsRef = useRef({
    strength: CALM_IDLE_PRESET.bloom.strength,
    threshold: CALM_IDLE_PRESET.bloom.threshold,
  });
  const [visualState, setVisualState] = useState<VisualState>('calm');

  // Keep latest external values without recreating the scene.
  const holdRef = useRef(isHolding);
  useEffect(() => {
    holdRef.current = isHolding;
  }, [isHolding]);

  const physicsRef = useRef(physics);
  useEffect(() => {
    physicsRef.current = physics;
  }, [physics]);

  const upgradesRef = useRef(upgrades);
  useEffect(() => {
    upgradesRef.current = upgrades;
  }, [upgrades]);

  const prestigeRef = useRef(prestigeLevel);
  useEffect(() => {
    prestigeRef.current = prestigeLevel;
  }, [prestigeLevel]);

  const scrapValueRef = useRef(scrap);
  const scrapUpdaterRef = useRef<((scrapValue: number) => void) | null>(null);
  const scrapGroupRef = useRef<THREE.Group | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const container = mountRef.current;

    const getSize = () => {
      const rect = container.getBoundingClientRect();
      const width = rect.width || window.innerWidth;
      const height = rect.height || window.innerHeight;
      return { width, height };
    };

    const { width, height } = getSize();

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(1.75, window.devicePixelRatio || 1));
    renderer.setClearColor(0x05070f, 1);
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.inset = '0';
    container.appendChild(renderer.domElement);

    camera.position.z = 5;

    const basePreset = CALM_IDLE_PRESET;
    const orbGeometry = new THREE.SphereGeometry(1, 64, 64);
    const orbMaterial = createOrbMaterial({ ...basePreset.uniforms });

    const orb = new THREE.Mesh(orbGeometry, orbMaterial);
    scene.add(orb);

    const scrapGroup = new THREE.Group();
    orb.add(scrapGroup);
    scrapGroupRef.current = scrapGroup;

    const scrapMaterials = [
      new THREE.MeshStandardMaterial({ color: 0x9ca3af, metalness: 0.3, roughness: 0.7 }),
      new THREE.MeshStandardMaterial({ color: 0x4b5563, metalness: 0.4, roughness: 0.8 }),
      new THREE.MeshStandardMaterial({ color: 0x6b7280, metalness: 0.2, roughness: 0.9 }),
      new THREE.MeshStandardMaterial({ color: 0x22c55e, emissive: 0x16a34a, emissiveIntensity: 0.8 }),
    ];
    const scrapGeometries = [
      new THREE.BoxGeometry(0.26, 0.14, 0.08),
      new THREE.CylinderGeometry(0.08, 0.12, 0.26, 6),
      new THREE.TetrahedronGeometry(0.2),
      new THREE.BoxGeometry(0.18, 0.08, 0.26),
    ];

    const disposeObject3D = (object: THREE.Object3D) => {
      object.traverse((child) => {
        const mesh = child as THREE.Mesh;
        if ((mesh as unknown as { isMesh?: boolean }).isMesh && mesh.geometry) {
          mesh.geometry.dispose();
        }
        const material = (mesh as unknown as { material?: THREE.Material | THREE.Material[] })
          .material;
        if (Array.isArray(material)) {
          material.forEach((m) => m.dispose());
        } else if (material) {
          material.dispose();
        }
      });
    };

    const refreshMeshResources = (object: THREE.Object3D) => {
      object.traverse((child) => {
        const mesh = child as THREE.Mesh;
        if (!(mesh as unknown as { isMesh?: boolean }).isMesh) return;
        if (mesh.geometry) {
          mesh.geometry = mesh.geometry.clone();
        }
        const mat = mesh.material as THREE.Material | THREE.Material[];
        if (Array.isArray(mat)) {
          mesh.material = mat.map((m) => m.clone());
        } else if (mat) {
          mesh.material = mat.clone();
        }
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      });
    };

    const normalizeScrap = (visual: THREE.Object3D) => {
      const box = new THREE.Box3().setFromObject(visual);
      const size = new THREE.Vector3();
      box.getSize(size);
      const maxDim = Math.max(size.x, size.y, size.z) || 1;
      const target = 0.7;
      const scale = target / maxDim;
      visual.scale.multiplyScalar(scale);
      const center = box.getCenter(new THREE.Vector3());
      visual.position.sub(center.multiplyScalar(scale));
    };

    const fbxLoader = new FBXLoader();
    const scrapCache = new Map<string, Promise<THREE.Object3D | null>>();
    const scrapSources: THREE.Object3D[] = [];

    const loadScrapFromUrl = (url: string) => {
      let promise = scrapCache.get(url);
      if (!promise) {
        promise = fbxLoader
          .loadAsync(url)
          .then((obj) => {
            normalizeScrap(obj);
            return obj;
          })
          .catch(() => null);
        scrapCache.set(url, promise);
      }
      return promise;
    };

    SCRAP_FBX_URLS.forEach((url) => {
      loadScrapFromUrl(url).then((obj) => {
        if (!obj) return;
        scrapSources.push(obj);
        scrapUpdaterRef.current?.(scrapValueRef.current);
      });
    });

    const buildScrapPiece = (index: number) => {
      const container = new THREE.Group();
      const hasAssets = scrapSources.length > 0;
      if (hasAssets) {
        const source = scrapSources[Math.floor(Math.random() * scrapSources.length)];
        const visual = source.clone(true);
        refreshMeshResources(visual);
        container.add(visual);
      } else {
        const geometry = scrapGeometries[index % scrapGeometries.length];
        const material = scrapMaterials[index % scrapMaterials.length];
        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        container.add(mesh);
      }
      return container;
    };

    const disposeScrapPieces = () => {
      const group = scrapGroupRef.current;
      if (!group) return;
      group.children.forEach((child) => disposeObject3D(child));
      group.clear();
    };

    scrapUpdaterRef.current = (scrapValue: number) => {
      const group = scrapGroupRef.current;
      if (!group) return;

      const upgrades = upgradesRef.current;
      const upgradeBonus =
        1 +
        (upgrades.tractorBeam ?? 0) * 0.08 +
        (upgrades.resonanceTuner ?? 0) * 0.03 +
        prestigeRef.current * 0.05;
      const maxPiecesBase = 40 * upgradeBonus;
      const screenScale = window.innerWidth < 640 ? 0.6 : 1;
      const maxPieces = Math.floor(maxPiecesBase * screenScale);
      const count = Math.min(maxPieces, Math.max(0, Math.floor(scrapValue)));
      disposeScrapPieces();

      for (let i = 0; i < count; i++) {
        const scrapPiece = buildScrapPiece(i);

        const direction = new THREE.Vector3(
          Math.random() - 0.5,
          Math.random() - 0.5,
          Math.random() - 0.5
        ).normalize();
        const radius = 1.05 + Math.random() * 0.35;
        scrapPiece.position.copy(direction.multiplyScalar(radius));
        scrapPiece.rotation.set(
          Math.random() * Math.PI,
          Math.random() * Math.PI,
          Math.random() * Math.PI
        );
        const scale = 0.7 + Math.random() * 0.6;
        scrapPiece.scale.setScalar(scale);

        group.add(scrapPiece);
      }
    };

    scrapUpdaterRef.current(scrap);

    const particleGeometry = new THREE.BufferGeometry();
    let particleCount = basePreset.particles;
    let particlePositions = new Float32Array(particleCount * 3);
    let particleVelocities: { x: number; y: number; z: number }[] = [];

    const rebuildParticles = (count: number) => {
      particleCount = count;
      particlePositions = new Float32Array(count * 3);
      particleVelocities = [];
      for (let i = 0; i < count; i++) {
        particlePositions[i * 3] = (Math.random() - 0.5) * 2;
        particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 2;
        particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 2;
        particleVelocities.push({
          x: (Math.random() - 0.5) * 0.02,
          y: (Math.random() - 0.5) * 0.02,
          z: (Math.random() - 0.5) * 0.02,
        });
      }
      particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
      particleGeometry.attributes.position.needsUpdate = true;
    };

    rebuildParticles(basePreset.particles);

    const particleMaterial = new THREE.PointsMaterial({
      color: new THREE.Color(basePreset.uniforms.chargeColor).getHex(),
      size: 0.05,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    const ambientLight = new THREE.AmbientLight(0x404040, 2);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(
      new THREE.Color(basePreset.uniforms.chargeColor).getHex(),
      0,
      10
    );
    pointLight.position.set(0, 0, 3);
    scene.add(pointLight);

    const getPreset = (state: VisualState) => {
      if (state === 'charging') return OVERCHARGED_PRESET;
      if (state === 'superCritical') return SUPER_CRITICAL_PRESET;
      return CALM_IDLE_PRESET;
    };

    const applyPreset = (state: VisualState) => {
      if (visualStateRef.current !== state) {
        visualStateRef.current = state;
        setVisualState(state);
      }
      const preset = getPreset(state);
      bloomSettingsRef.current = { ...preset.bloom };

      orbMaterial.uniforms.color1.value.set(preset.uniforms.color1);
      orbMaterial.uniforms.color2.value.set(preset.uniforms.color2);
      orbMaterial.uniforms.chargeColor.value.set(preset.uniforms.chargeColor);
      orbMaterial.uniforms.wobbleIntensity.value = preset.uniforms.wobbleIntensity;
      orbMaterial.uniforms.patternScale.value = preset.uniforms.patternScale;
      orbMaterial.uniforms.fresnelIntensity.value = preset.uniforms.fresnelIntensity;
      orbMaterial.uniforms.chargeLevel.value = preset.uniforms.chargeLevel;

      particleMaterial.color.set(preset.uniforms.chargeColor);
      pointLight.color.set(preset.uniforms.chargeColor);

      if (preset.particles !== particleCount) {
        rebuildParticles(preset.particles);
      }
    };

    applyPreset('calm');

    // Post-processing: bloom for high charge glow
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      bloomSettingsRef.current.strength,
      0.8,
      bloomSettingsRef.current.threshold
    );
    composer.addPass(bloomPass);

    const clock = new THREE.Clock();
    let animationId = 0;

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const deltaTime = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();
      const localState = stateRef.current;

      const physics = physicsRef.current;
      const upgrades = upgradesRef.current;
      const prestigeLevel = prestigeRef.current;
      const holdTimer = holdTimerRef.current;
      const upgradeAura =
        1 +
        (upgrades.resonanceTuner ?? 0) * 0.03 +
        (upgrades.orbitalStabilization ?? 0) * 0.02 +
        prestigeLevel * 0.05;

      if (holdRef.current) {
        holdTimer.duration += deltaTime;
        if (!holdTimer.superCritical && holdTimer.duration >= SUPER_CRITICAL_HOLD_TIME) {
          holdTimer.superCritical = true;
        }
      } else {
        holdTimer.duration = 0;
        if (holdTimer.superCritical) {
          holdTimer.superCritical = false;
        }
      }

      const isSuperCritical = holdTimer.superCritical;

      if (holdRef.current) {
        localState.velocity += physics.thrustForce * deltaTime;
        localState.charge = Math.min(1, localState.charge + deltaTime * 2);
      } else {
        const stabilizationBonus = (upgrades.orbitalStabilization ?? 0) * 0.02;
        const effectiveDamping = Math.max(0.7, physics.chargeDamping - stabilizationBonus);
        localState.velocity -= physics.gravity * deltaTime;
        localState.charge *= effectiveDamping;
      }

      localState.velocity = Math.max(
        -physics.terminalVelocity,
        Math.min(physics.terminalVelocity, localState.velocity)
      );

      setCharge(localState.charge);

      const targetVisual: VisualState =
        isSuperCritical && holdRef.current
          ? 'superCritical'
          : localState.charge > 0.4 && holdRef.current
          ? 'charging'
          : 'calm';

      if (visualStateRef.current !== targetVisual) {
        applyPreset(targetVisual);
      }

      if (localState.charge > 0) {
        const baseGen = localState.charge * 10 * deltaTime;
        if (isSuperCritical && holdRef.current) {
          addEnergy(-baseGen * SUPER_CRITICAL_DRAIN_MULTIPLIER);
        } else {
          const resonanceBonus = 1 + (upgrades.resonanceTuner ?? 0) * 0.15;
          const prestigeBonus = 1 + prestigeLevel * 0.5;
          const surgeChance = Math.min(1, (upgrades.criticalSurge ?? 0) * 0.05);
          const surgeMultiplier = Math.random() < surgeChance ? 10 : 1;
          addEnergy(baseGen * resonanceBonus * prestigeBonus * surgeMultiplier);
        }
      }

      const heartbeat = 1 + Math.sin(elapsedTime * (holdRef.current ? 2 : 1)) * 0.05;
      const rotationSpeed = 0.5 + localState.charge * 3;
      orb.rotation.y = elapsedTime * rotationSpeed;
      orb.rotation.x = Math.sin(elapsedTime * 0.3) * 0.2;
      orb.scale.setScalar(heartbeat + localState.charge * 0.2);

      orbMaterial.uniforms.time.value = elapsedTime;
      orbMaterial.uniforms.chargeLevel.value = localState.charge;
      orb.position.y = Math.sin(elapsedTime * 2) * 0.1 * (1 - localState.charge * 0.5);

      particleMaterial.opacity = Math.min(1, localState.charge * (isSuperCritical ? 1.2 : 0.8));
      const positions = particleGeometry.attributes.position.array as Float32Array;

      for (let i = 0; i < particleCount; i++) {
        positions[i * 3] += particleVelocities[i].x * (1 + localState.charge * 5);
        positions[i * 3 + 1] += particleVelocities[i].y * (1 + localState.charge * 5);
        positions[i * 3 + 2] += particleVelocities[i].z * (1 + localState.charge * 5);

        const dist = Math.sqrt(
          positions[i * 3] ** 2 +
            positions[i * 3 + 1] ** 2 +
            positions[i * 3 + 2] ** 2
        );

        if (dist > 2) {
          positions[i * 3] = (Math.random() - 0.5) * 0.2;
          positions[i * 3 + 1] = (Math.random() - 0.5) * 0.2;
          positions[i * 3 + 2] = (Math.random() - 0.5) * 0.2;
        }
      }

      particleGeometry.attributes.position.needsUpdate = true;
      pointLight.intensity = localState.charge * (isSuperCritical ? 7 : 5) * upgradeAura;

      bloomPass.strength =
        Math.max(
          bloomSettingsRef.current.strength,
          localState.charge * (isSuperCritical ? 3 : 2)
        ) * upgradeAura;
      bloomPass.threshold = bloomSettingsRef.current.threshold;
      composer.render();
    };

    animate();

    const handleResize = () => {
      const { width: nextWidth, height: nextHeight } = getSize();
      camera.aspect = nextWidth / nextHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(nextWidth, nextHeight);
      composer.setSize(nextWidth, nextHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
      disposeScrapPieces();
      scrapGeometries.forEach((geo) => geo.dispose());
      scrapMaterials.forEach((mat) => mat.dispose());
      orbGeometry.dispose();
      orbMaterial.dispose();
      particleGeometry.dispose();
      particleMaterial.dispose();
      renderer.dispose();
    };
  }, [addEnergy, setCharge]);

  useEffect(() => {
    scrapValueRef.current = scrap;
    scrapUpdaterRef.current?.(scrap);
  }, [scrap]);

  const stateStyles: Record<VisualState, { label: string; pillClass: string; pulse?: boolean }> = {
    calm: {
      label: 'CALM',
      pillClass: 'border-lime-400/50 bg-lime-500/10 text-lime-200',
    },
    charging: {
      label: 'CHARGING',
      pillClass: 'border-cyan-300/60 bg-cyan-400/10 text-cyan-100',
    },
    superCritical: {
      label: 'SUPER-CRITICAL',
      pillClass: 'border-rose-400/70 bg-rose-500/15 text-rose-100',
      pulse: true,
    },
  };

  const style = stateStyles[visualState];

  useEffect(() => {
    if (visualState === 'superCritical') {
      haptic([18, 12, 18]);
    } else if (visualState === 'charging') {
      haptic(8);
    }
  }, [visualState]);

  useEffect(() => {
    audioBus.setOrbState(visualState);
  }, [visualState]);

  return (
    <div ref={mountRef} className="absolute inset-x-0 top-0 bottom-32 sm:bottom-40">
      <div className="pointer-events-none absolute top-3 inset-x-0 flex justify-center px-4 z-10">
        <div className="w-full max-w-4xl flex flex-wrap items-center justify-between gap-3">
          <div className="text-[11px] uppercase tracking-[0.25em] text-slate-300">
            Burn Output{' '}
            <span className="text-3xl font-bold font-mono text-lime-100 tracking-normal ml-2">
              {Math.floor(energy).toLocaleString()}
            </span>
          </div>
          <div
            className={`flex items-center gap-2 px-3 py-1 rounded-full border text-[11px] uppercase tracking-[0.2em] font-semibold ${
              style.pillClass
            } ${style.pulse ? 'animate-pulse' : ''}`}
          >
            {style.label}
          </div>
        </div>
      </div>
    </div>
  );
}
