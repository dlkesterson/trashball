import { useEffect, useRef, useState } from 'react';
import type { MouseEvent, TouchEvent } from 'react';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import type { ScrapUpgradeId } from '../core/ScrapUnlocks';
import { BASE_GAME_CONFIG, applyUpgradesToConfig, type ScrapRunConfig } from './config';
import { createOrbMaterial } from '../orb/orbMaterial';
import { CALM_IDLE_PRESET } from '../orb/orbPresets';
import { haptic } from '../utils/haptics';
import { audioBus } from '../audio/audioBus';

const GOOD_SCRAP_URLS = Object.values(
  import.meta.glob('../assets/*.fbx', { eager: true, as: 'url' }) as Record<string, string>
);

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

type Props = {
  onGameOver: (score: number, collected: number) => void;
  upgrades: Record<ScrapUpgradeId, number>;
  config?: ScrapRunConfig;
  showCurvatureDebug?: boolean;
  showHitboxes?: boolean;
  minimalUi?: boolean;
  endless?: boolean;
};

export type ScrapRunDebugState = {
  score: number;
  collected: number;
  shields: number;
  gameOver: boolean;
};

export default function ScrapRunScene({
  onGameOver,
  upgrades,
  config = BASE_GAME_CONFIG,
  showCurvatureDebug = false,
  showHitboxes = false,
  minimalUi = false,
  endless = false,
}: Props) {
  const QUICK_TAP_MS = 150;
  const SHIELD_PULSE_DURATION = 450;
  const SHIELD_PULSE_RADIUS = 3;
  const mountRef = useRef<HTMLDivElement>(null);
  const [isHolding, setIsHolding] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [currentTouchX, setCurrentTouchX] = useState<number | null>(null);
  const [showIntro, setShowIntro] = useState(true);
  const [gameState, setGameState] = useState({
    score: 0,
    collected: 0,
    gameOver: false,
    shields: upgrades.shieldGenerator ?? 0,
  });
  const pressStartRef = useRef<number | null>(null);
  const lastDragXRef = useRef<number | null>(null);
  const lastDragTimeRef = useRef<number>(0);
  const strafeBoostRef = useRef(1);
  const strafeScaleRef = useRef(1);
  const shakeRef = useRef(0);
  const shieldPulseUntilRef = useRef(0);
  const startPointRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const abortTriggeredRef = useRef(false);

  useEffect(() => {
    if (!mountRef.current || gameState.gameOver) return;

    const container = mountRef.current;
    if (container.firstChild) {
      container.replaceChildren();
    }

    const getSize = () => {
      const rect = container.getBoundingClientRect();
      const width = rect.width || window.innerWidth;
      const height = rect.height || window.innerHeight;
      return { width, height };
    };

    const effectiveConfig = applyUpgradesToConfig(config, upgrades);
    const afterburnerLevel = upgrades.afterburners ?? 0;
    const shieldLevel = upgrades.shieldGenerator ?? 0;
    const magnetLevel = upgrades.tractorBeam ?? 0;
    const fbxLoader = new FBXLoader();
    const goodScrapCache = new Map<string, THREE.Object3D>();

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x05070f);
    scene.fog = new THREE.Fog(0x05070f, 10, 50);

    const { width, height } = getSize();

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    const cameraBase = new THREE.Vector3(0, 0, 10);
    camera.position.copy(cameraBase);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(1.5, window.devicePixelRatio || 1));
    renderer.shadowMap.enabled = true;
    renderer.domElement.style.pointerEvents = 'none';
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0x4a90e2, 0.5);
    pointLight.position.set(0, 2, 8);
    scene.add(pointLight);

    const planetGeometry = new THREE.SphereGeometry(6, 32, 32);
    const planetMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a2e, wireframe: true });
    const planet = new THREE.Mesh(planetGeometry, planetMaterial);
    planet.position.set(0, -8, 0);
    planet.receiveShadow = true;
    scene.add(planet);

    const starsGeometry = new THREE.BufferGeometry();
    const starPositions: number[] = [];
    for (let i = 0; i < 200; i++) {
      starPositions.push(
        (Math.random() - 0.5) * 100,
        (Math.random() - 0.5) * 100,
        (Math.random() - 0.5) * 100 - 50
      );
    }
    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
    const starsMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.1 });
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);

    const playerGroup = new THREE.Group();
    playerGroup.position.set(0, effectiveConfig.innerOrbit, 5);
    scene.add(playerGroup);

    const orbGeometry = new THREE.SphereGeometry(0.8, 64, 64);
    const orbMaterial = createOrbMaterial({
      ...CALM_IDLE_PRESET.uniforms,
      chargeLevel: 0.6,
    });
    const orbMesh = new THREE.Mesh(orbGeometry, orbMaterial);
    orbMesh.castShadow = true;
    playerGroup.add(orbMesh);

    const shieldAura =
      shieldLevel > 0
        ? new THREE.Mesh(
            new THREE.SphereGeometry(1.15, 24, 24),
            new THREE.MeshBasicMaterial({
              color: 0x67e8f9,
              transparent: true,
              opacity: 0.12,
              wireframe: true,
            })
          )
        : null;
    if (shieldAura) {
      playerGroup.add(shieldAura);
    }

    const trailGeometry = new THREE.SphereGeometry(0.08, 8, 8);
    const trailParticles: Array<{ mesh: THREE.Mesh; life: number }> = [];
    let trailAccumulator = 0;

    const collectedJunk: THREE.Mesh[] = [];
    const debrisList: THREE.Mesh[] = [];
    let debrisIdCounter = 0;
    let lastSpawnTime = Date.now();
    const shaderClock = new THREE.Clock();

    let currentGameState = { ...gameState };
    let currentOrbitTarget = effectiveConfig.innerOrbit;
    let currentStrafeTarget = 0;
    let currentIsHolding = false;
    let currentTouchPos: number | null = null;
    let currentStrafeSpeed = effectiveConfig.strafeSpeed;

    const hitboxHelper =
      showHitboxes &&
      new THREE.Mesh(
        new THREE.SphereGeometry(1, 16, 16),
        new THREE.MeshBasicMaterial({ color: 0x00ffff, wireframe: true, transparent: true, opacity: 0.2 })
      );
    if (hitboxHelper) {
      playerGroup.add(hitboxHelper);
    }

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

    const disposeDebris = (debris: THREE.Mesh) => {
      if (debris.userData.hitboxHelper) {
        scene.remove(debris.userData.hitboxHelper);
        debris.userData.hitboxHelper.geometry.dispose();
        debris.userData.hitboxHelper.material.dispose();
      }
      if (debris.userData.curveLine) {
        scene.remove(debris.userData.curveLine);
        debris.userData.curveLine.geometry.dispose();
        debris.userData.curveLine.material.dispose();
      }
      if (debris.userData.visual) {
        debris.remove(debris.userData.visual);
        disposeObject3D(debris.userData.visual);
      }
      if (debris.geometry) {
        debris.geometry.dispose();
      }
      if (Array.isArray(debris.material)) {
        debris.material.forEach((mat) => mat.dispose());
      } else if (debris.material) {
        debris.material.dispose();
      }
      scene.remove(debris);
    };

    const disposeCollectedPiece = (piece: THREE.Object3D) => {
      playerGroup.remove(piece);
      disposeObject3D(piece);
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

    const normalizeGoodScrap = (visual: THREE.Object3D) => {
      const box = new THREE.Box3().setFromObject(visual);
      const size = new THREE.Vector3();
      box.getSize(size);
      const maxDim = Math.max(size.x, size.y, size.z) || 1;
      const target = 0.9;
      const scale = target / maxDim;
      visual.scale.multiplyScalar(scale);
      const center = box.getCenter(new THREE.Vector3());
      visual.position.sub(center.multiplyScalar(scale));
      refreshMeshResources(visual);
    };

    const attachGoodScrapVisual = (debris: THREE.Mesh) => {
      if (GOOD_SCRAP_URLS.length === 0) return;
      const url = GOOD_SCRAP_URLS[Math.floor(Math.random() * GOOD_SCRAP_URLS.length)];
      const existing = goodScrapCache.get(url);
      const sourcePromise: Promise<THREE.Object3D> =
        existing !== undefined
          ? Promise.resolve(existing)
          : fbxLoader.loadAsync(url).then((obj: THREE.Object3D) => {
              goodScrapCache.set(url, obj);
              return obj;
            });

      sourcePromise
        .then((source: THREE.Object3D) => {
          if (!debris.parent) return;
          const visual = source.clone(true);
          normalizeGoodScrap(visual);
          debris.add(visual);
          debris.userData.visual = visual;
          const mat = debris.material as THREE.Material & { opacity?: number; transparent?: boolean };
          mat.transparent = true;
          mat.opacity = 0;
        })
        .catch(() => {
          // Fall back to the placeholder if loading fails; no-op.
        });
    };

    const animate = () => {
      if (!currentGameState.gameOver || endless) {
        requestAnimationFrame(animate);
      }

      planet.rotation.y += 0.002;
      const delta = shaderClock.getDelta();
      const elapsed = shaderClock.elapsedTime;
      orbMaterial.uniforms.time.value = elapsed;
      const shieldPulseActive = performance.now() < shieldPulseUntilRef.current;
      const visualCharge = Math.min(
        1,
        0.2 +
          currentGameState.collected * 0.05 +
          (currentIsHolding ? 0.4 : 0) +
          (shieldPulseActive ? 0.2 : 0)
      );
      orbMaterial.uniforms.chargeLevel.value = visualCharge;
      if (shieldAura) {
        shieldAura.visible = currentGameState.shields > 0 || shieldPulseActive;
        const auraScale = 1.05 + currentGameState.shields * 0.04 + (shieldPulseActive ? 0.15 : 0);
        shieldAura.scale.setScalar(auraScale);
        (shieldAura.material as THREE.MeshBasicMaterial).opacity = shieldPulseActive ? 0.24 : 0.12;
      }

      const currentY = playerGroup.position.y;
      const newY = THREE.MathUtils.lerp(currentY, currentOrbitTarget, effectiveConfig.orbitSpeed);
      playerGroup.position.y = newY;

      const currentX = playerGroup.position.x;
      const newX = THREE.MathUtils.lerp(currentX, currentStrafeTarget, currentStrafeSpeed);
      playerGroup.position.x = newX;
      const nextBoost = THREE.MathUtils.lerp(strafeBoostRef.current, 1, 0.08);
      strafeBoostRef.current = nextBoost;
      const baseStrafe = effectiveConfig.strafeSpeed * strafeScaleRef.current;
      currentStrafeSpeed = baseStrafe * (1 + (strafeBoostRef.current - 1) * 0.85);

      const strafing = Math.abs(currentStrafeTarget) > 0.05 || Math.abs(currentX) > 0.05;

      if (afterburnerLevel > 0 && strafing) {
        const spawnRate = 10 + afterburnerLevel * 12;
        trailAccumulator += delta * spawnRate;
        while (trailAccumulator > 1) {
          const particleMaterial = new THREE.MeshBasicMaterial({
            color: 0x38bdf8,
            transparent: true,
            opacity: 0.7,
          });
          const mesh = new THREE.Mesh(trailGeometry, particleMaterial);
          mesh.position.copy(playerGroup.position);
          mesh.position.z -= 0.6;
          mesh.position.y -= 0.1;
          trailParticles.push({ mesh, life: 0.6 });
          scene.add(mesh);
          trailAccumulator -= 1;
        }
      }

      for (let i = trailParticles.length - 1; i >= 0; i--) {
        const particle = trailParticles[i];
        particle.life -= delta;
        const material = particle.mesh.material as THREE.MeshBasicMaterial;
        material.opacity = Math.max(0, particle.life);
        particle.mesh.position.z -= delta * 6;
        particle.mesh.position.y -= delta * 0.5;
        if (particle.life <= 0) {
          scene.remove(particle.mesh);
          material.dispose();
          trailParticles.splice(i, 1);
        }
      }

      if (shakeRef.current > 0) {
        shakeRef.current = Math.max(0, shakeRef.current - delta * 1.5);
        const strength = shakeRef.current * 0.25;
        camera.position.set(
          cameraBase.x + Math.sin(elapsed * 40) * strength,
          cameraBase.y + Math.cos(elapsed * 32) * strength * 0.8,
          cameraBase.z
        );
      } else {
        camera.position.copy(cameraBase);
      }

      playerGroup.rotation.y += 0.01;

      const now = Date.now();
      if (now - lastSpawnTime > effectiveConfig.spawnInterval) {
        lastSpawnTime = now;

        const isGood = Math.random() < effectiveConfig.goodRatio;
        const geometry = isGood
          ? new THREE.BoxGeometry(0.4, 0.4, 0.4)
          : new THREE.OctahedronGeometry(0.5, 0);
        const material = new THREE.MeshLambertMaterial({
          color: isGood ? 0x4ade80 : 0xef4444,
          transparent: isGood,
          opacity: isGood ? 0 : 1,
        });
        const debris = new THREE.Mesh(geometry, material);

        // Keep debris paths inside the player's reachable area.
        const { width: containerWidth } = getSize();
        const widthFactor = clamp(containerWidth / 480, 0.85, 1.25);
        const maxStrafeReach = effectiveConfig.maxStrafe * widthFactor;
        const maxCurveScale = 1 + effectiveConfig.curvatureStrength * 0.5;
        const spawnXLimit = maxStrafeReach / maxCurveScale;
        const startX = THREE.MathUtils.randFloat(-spawnXLimit, spawnXLimit);
        const minY = effectiveConfig.innerOrbit;
        const maxY = effectiveConfig.outerOrbit;
        const maxCurveRise = Math.abs(startX) * effectiveConfig.curvatureStrength;
        const safeStartYMax = maxY - maxCurveRise;
        const startY = THREE.MathUtils.randFloat(minY, Math.max(minY, safeStartYMax));

        debris.position.set(startX, startY, effectiveConfig.spawnDistance);
        debris.castShadow = true;
        debris.userData = {
          id: debrisIdCounter++,
          type: isGood ? 'good' : 'bad',
          initialX: startX,
          initialY: startY,
          rotationSpeed: { x: Math.random() * 0.04 - 0.02, y: Math.random() * 0.04 - 0.02 },
        };
        scene.add(debris);

        if (isGood) {
          attachGoodScrapVisual(debris);
        }

        if (showHitboxes) {
          const helper = new THREE.Mesh(
            new THREE.SphereGeometry(0.4, 12, 12),
            new THREE.MeshBasicMaterial({
              color: isGood ? 0x22c55e : 0xf87171,
              wireframe: true,
              transparent: true,
              opacity: 0.25,
            })
          );
          helper.position.copy(debris.position);
          helper.userData.parentId = debris.userData.id;
          scene.add(helper);
          debris.userData.hitboxHelper = helper;
        }

        if (showCurvatureDebug) {
          const points: THREE.Vector3[] = [];
          const steps = 20;
          for (let step = 0; step <= steps; step++) {
            const t = step / steps;
            const z = effectiveConfig.spawnDistance + t * (effectiveConfig.despawnDistance - effectiveConfig.spawnDistance);
            const progress =
              (z - effectiveConfig.spawnDistance) /
              (effectiveConfig.despawnDistance - effectiveConfig.spawnDistance);
            const curve = Math.sin(progress * Math.PI) * effectiveConfig.curvatureStrength;
            const x = startX + startX * curve * 0.5;
            const y = startY + Math.abs(startX) * curve;
            points.push(new THREE.Vector3(x, y, z));
          }
          const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
          const lineMaterial = new THREE.LineBasicMaterial({
            color: isGood ? 0x22c55e : 0xef4444,
            transparent: true,
            opacity: 0.35,
          });
          const line = new THREE.Line(lineGeometry, lineMaterial);
          scene.add(line);
          debris.userData.curveLine = line;
        }

        debrisList.push(debris);
      }

      const hitboxRadius =
        0.5 + currentGameState.collected * 0.1 + (upgrades.tractorBeam ?? 0) * 0.2;
      const playerPos = playerGroup.position;

      for (let i = debrisList.length - 1; i >= 0; i--) {
        const debris = debrisList[i];

        debris.position.z += effectiveConfig.debrisSpeed;

        const progress =
          (debris.position.z - effectiveConfig.spawnDistance) /
          (effectiveConfig.despawnDistance - effectiveConfig.spawnDistance);
        const curve = Math.sin(progress * Math.PI) * effectiveConfig.curvatureStrength;

        debris.position.x = debris.userData.initialX + debris.userData.initialX * curve * 0.5;
        debris.position.y = debris.userData.initialY + Math.abs(debris.userData.initialX) * curve;

        debris.rotation.x += debris.userData.rotationSpeed.x;
        debris.rotation.y += debris.userData.rotationSpeed.y;

        if (debris.userData.hitboxHelper) {
          debris.userData.hitboxHelper.position.copy(debris.position);
        }

        if (magnetLevel > 0 && debris.userData.type === 'good') {
          const bonusRadius = magnetLevel >= 5 ? 1 : 0;
          const magnetRadius = hitboxRadius + 1.2 + magnetLevel * 0.35 + bonusRadius;
          const magnetDistance = debris.position.distanceTo(playerPos);
          if (magnetDistance < magnetRadius) {
            const pullStrength = 0.01 + magnetLevel * 0.003 + (magnetLevel >= 5 ? 0.006 : 0);
            const pull = (magnetRadius - magnetDistance) * pullStrength;
            debris.position.lerp(playerPos, pull);
            const mat = debris.material as THREE.MeshLambertMaterial;
            mat.opacity = clamp(0.25 + (magnetRadius - magnetDistance) * 0.25, 0.25, 0.95);
          }
        }

        if (shieldPulseActive && debris.userData.type === 'bad') {
          const pulseDistance = debris.position.distanceTo(playerPos);
          if (pulseDistance < SHIELD_PULSE_RADIUS) {
            disposeDebris(debris);
            debrisList.splice(i, 1);
            continue;
          }
        }

        const distance = debris.position.distanceTo(playerPos);
        if (distance < hitboxRadius + 0.3) {
          let collectedVisual: THREE.Mesh | null = null;
          if (debris.userData.type === 'good') {
            collectedVisual = debris.clone(true);
            refreshMeshResources(collectedVisual);
          }
          disposeDebris(debris);
          debrisList.splice(i, 1);

          if (debris.userData.type === 'good') {
            currentGameState.collected++;
            currentGameState.score += 10;
            haptic(10);
            audioBus.playEvent('goodScrap');
            setGameState({ ...currentGameState });

            const junkPiece = collectedVisual ?? debris.clone(true);
            if (!collectedVisual) {
              refreshMeshResources(junkPiece);
            }
            const angle = (collectedJunk.length / 20) * Math.PI * 2;
            const radius = 0.8 + Math.floor(collectedJunk.length / 20) * 0.3;
            junkPiece.position.set(
              Math.cos(angle) * radius,
              (Math.random() - 0.5) * 0.5,
              Math.sin(angle) * radius
            );
            junkPiece.scale.set(0.5, 0.5, 0.5);
            playerGroup.add(junkPiece);
            collectedJunk.push(junkPiece);
          } else {
            audioBus.playEvent('badDebris');
            shakeRef.current = 0.45;
            if (currentGameState.shields > 0) {
              currentGameState.shields -= 1;
              haptic([12, 12, 12]);
              audioBus.playEvent('shield');
              setGameState({ ...currentGameState });
            } else if (currentGameState.collected > 0) {
              const loseCount = Math.min(3, currentGameState.collected);
              currentGameState.collected -= loseCount;

              for (let j = 0; j < loseCount && collectedJunk.length > 0; j++) {
                const junk = collectedJunk.pop();
                if (junk) disposeCollectedPiece(junk);
              }

              setGameState({ ...currentGameState });
            } else {
              if (!endless) {
                currentGameState.gameOver = true;
                setGameState({ ...currentGameState });
                haptic([18, 30, 18]);
                audioBus.playEvent('gameOver');
              }
            }
          }
          continue;
        }

        if (debris.position.z > effectiveConfig.despawnDistance) {
          disposeDebris(debris);
          debrisList.splice(i, 1);
        }
      }

      if (hitboxHelper) {
        hitboxHelper.scale.setScalar(hitboxRadius);
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      const { width: nextWidth, height: nextHeight } = getSize();
      camera.aspect = nextWidth / nextHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(nextWidth, nextHeight);
    };
    window.addEventListener('resize', handleResize);

    const stateInterval = setInterval(() => {
      currentOrbitTarget = currentIsHolding ? effectiveConfig.outerOrbit : effectiveConfig.innerOrbit;

      const rect = mountRef.current?.getBoundingClientRect();
      const containerWidth = rect?.width ?? window.innerWidth;
      if (currentTouchPos !== null && containerWidth > 0) {
        const normalizedX = (currentTouchPos - containerWidth / 2) / (containerWidth / 2);
        const widthFactor = clamp(containerWidth / 480, 0.85, 1.25);
        strafeScaleRef.current = widthFactor;
        const inDeadZone = Math.abs(normalizedX) < 0.12;
        currentStrafeTarget = (inDeadZone ? 0 : normalizedX * widthFactor) * effectiveConfig.maxStrafe;
        currentStrafeSpeed = effectiveConfig.strafeSpeed * widthFactor;
      } else {
        currentStrafeTarget = 0;
        currentStrafeSpeed = effectiveConfig.strafeSpeed;
        strafeScaleRef.current = 1;
      }
    }, 16);

    (window as unknown as Record<string, () => boolean>).activateShieldPulse = () => {
      if (currentGameState.shields <= 0) return false;
      currentGameState.shields -= 1;
      shieldPulseUntilRef.current = performance.now() + SHIELD_PULSE_DURATION;
      haptic([8, 6, 16]);
      audioBus.playEvent('shield');
      setGameState({ ...currentGameState });
      return true;
    };

    (window as unknown as Record<string, (value: any) => void>).updateHoldingState = (
      holding: boolean
    ) => {
      currentIsHolding = holding;
    };

    (window as unknown as Record<string, (value: any) => void>).updateTouchPosition = (
      x: number | null
    ) => {
      currentTouchPos = x;
    };

    return () => {
      window.removeEventListener('resize', handleResize);
      clearInterval(stateInterval);
      delete (window as unknown as Record<string, unknown>).activateShieldPulse;
      delete (window as unknown as Record<string, unknown>).updateHoldingState;
      delete (window as unknown as Record<string, unknown>).updateTouchPosition;

      trailParticles.forEach((particle) => {
        scene.remove(particle.mesh);
        (particle.mesh.material as THREE.Material).dispose();
      });
      trailGeometry.dispose();

      if (shieldAura) {
        playerGroup.remove(shieldAura);
        shieldAura.geometry.dispose();
        (shieldAura.material as THREE.Material).dispose();
      }

      debrisList.forEach((debris) => {
        disposeDebris(debris);
      });

      collectedJunk.forEach((junk) => {
        disposeCollectedPiece(junk);
      });

      if (hitboxHelper) {
        playerGroup.remove(hitboxHelper);
        hitboxHelper.geometry.dispose();
        hitboxHelper.material.dispose();
      }

      if (mountRef.current && renderer.domElement && renderer.domElement.parentElement === mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [gameState.gameOver, upgrades, config, showCurvatureDebug, showHitboxes, endless]);

  useEffect(() => {
    const updater = (window as unknown as Record<string, (value: any) => void>).updateHoldingState;
    if (updater) updater(isHolding);
  }, [isHolding]);

  useEffect(() => {
    const updater = (window as unknown as Record<string, (value: any) => void>).updateTouchPosition;
    if (updater) updater(currentTouchX);
  }, [currentTouchX]);

  useEffect(() => {
    if (minimalUi) return;
    const timer = setTimeout(() => setShowIntro(false), 3000);
    return () => clearTimeout(timer);
  }, [minimalUi]);

  useEffect(() => {
    if (gameState.gameOver) {
      onGameOver(gameState.score, gameState.collected);
    }
  }, [gameState.gameOver, gameState.score, gameState.collected, onGameOver]);

  const handleAbort = () => {
    if (gameState.gameOver) return;
    haptic([12, 24]);
    onGameOver(gameState.score, gameState.collected);
  };

  const getRelativePoint = (clientX: number, clientY: number) => {
    const rect = mountRef.current?.getBoundingClientRect();
    if (!rect) return null;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const trackDragSpeed = (relativeX: number) => {
    const now = performance.now();
    if (lastDragXRef.current !== null && lastDragTimeRef.current > 0) {
      const deltaX = relativeX - lastDragXRef.current;
      const deltaTime = now - lastDragTimeRef.current;
      if (deltaTime > 0) {
        const velocity = Math.abs(deltaX / deltaTime);
        const boost = Math.min(2, 1 + velocity * 0.35);
        strafeBoostRef.current = Math.max(strafeBoostRef.current, boost);
      }
    }
    lastDragXRef.current = relativeX;
    lastDragTimeRef.current = now;
  };

  const maybeAbortFromSwipe = (relativeY: number) => {
    const start = startPointRef.current;
    if (!start || abortTriggeredRef.current || gameState.gameOver) return;
    const deltaY = relativeY - start.y;
    const elapsed = performance.now() - start.time;
    if (deltaY > 120 && elapsed < 500) {
      abortTriggeredRef.current = true;
      haptic([14, 24, 14]);
      handleAbort();
    }
  };

  const maybeActivateShield = () => {
    const activator = (window as unknown as Record<string, () => boolean>).activateShieldPulse;
    if (activator) activator();
  };

  const handleReleaseCommon = (isQuickTap: boolean) => {
    setIsHolding(false);
    setTouchStart(null);
    setCurrentTouchX(null);
    lastDragXRef.current = null;
    lastDragTimeRef.current = 0;
    startPointRef.current = null;
    abortTriggeredRef.current = false;
    if (isQuickTap) {
      maybeActivateShield();
    }
  };

  const handleTouchStart = (e: TouchEvent) => {
    setIsHolding(true);
    pressStartRef.current = performance.now();
    const touch = e.touches[0];
    const relative = getRelativePoint(touch.clientX, touch.clientY);
    if (!relative) return;
    setTouchStart(relative.x);
    setCurrentTouchX(relative.x);
    startPointRef.current = { ...relative, time: performance.now() };
    abortTriggeredRef.current = false;
    trackDragSpeed(relative.x);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (touchStart !== null) {
      const touch = e.touches[0];
      const relative = getRelativePoint(touch.clientX, touch.clientY);
      if (relative) {
        setCurrentTouchX(relative.x);
        trackDragSpeed(relative.x);
        maybeAbortFromSwipe(relative.y);
      }
    }
  };

  const handleTouchEnd = () => {
    const startedAt = pressStartRef.current;
    const isQuickTap = startedAt !== null && performance.now() - startedAt <= QUICK_TAP_MS;
    pressStartRef.current = null;
    handleReleaseCommon(isQuickTap);
  };

  const handleMouseDown = (e: MouseEvent) => {
    setIsHolding(true);
    pressStartRef.current = performance.now();
    const relative = getRelativePoint(e.clientX, e.clientY);
    if (!relative) return;
    setTouchStart(relative.x);
    setCurrentTouchX(relative.x);
    startPointRef.current = { ...relative, time: performance.now() };
    abortTriggeredRef.current = false;
    trackDragSpeed(relative.x);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (touchStart !== null) {
      const relative = getRelativePoint(e.clientX, e.clientY);
      if (relative) {
        setCurrentTouchX(relative.x);
        trackDragSpeed(relative.x);
        maybeAbortFromSwipe(relative.y);
      }
    }
  };

  const handleMouseUp = () => {
    const startedAt = pressStartRef.current;
    const isQuickTap = startedAt !== null && performance.now() - startedAt <= QUICK_TAP_MS;
    pressStartRef.current = null;
    handleReleaseCommon(isQuickTap);
  };

  return (
    <div className="fixed inset-0 bg-black">
      {!minimalUi && (
        <div className="pointer-events-none absolute inset-0 flex flex-col z-10">
          <div className="pointer-events-auto px-4 pt-4 flex items-start justify-between text-xs text-slate-200">
            <div>
              <div className="uppercase tracking-[0.2em] text-lime-300">Trash Run</div>
              <div className="text-[11px] text-slate-400">
                Guide the trashball through the junk tunnel.
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-mono text-lime-200">{gameState.score} kJ</div>
              <div className="text-[11px] text-slate-400">Trash hauled: {gameState.collected}</div>
              {gameState.shields > 0 && (
                <div className="text-[11px] text-cyan-300 mt-1">Shields: {gameState.shields}</div>
              )}
            </div>
          </div>

          {!gameState.gameOver && gameState.score === 0 && (
            <div
              className={`pointer-events-none flex-1 flex items-center justify-center px-4 transition-opacity duration-700 ${
                showIntro ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <div className="bg-black/75 border border-slate-800 rounded-2xl px-4 py-3 text-center text-sm text-slate-200 max-w-md shadow-lg shadow-black/40">
                <div className="text-lime-300 font-semibold mb-1">Charge then dive</div>
                <div>Hold to push into the outer lane, release to fall back in.</div>
                <div className="mt-1">Drag left/right to dodge and scoop trash.</div>
                <div className="mt-1 text-cyan-200">Quick tap to pulse a shield charge.</div>
                <div className="mt-1 text-red-300">Red junk cracks the shell.</div>
              </div>
            </div>
          )}

          {!gameState.gameOver && (
            <div className="pointer-events-auto p-4">
              <div className="rounded-2xl border border-slate-800 bg-black/70 backdrop-blur-md p-3 flex items-center justify-between text-xs text-slate-200">
                <div>
                  <div className="uppercase tracking-[0.2em] text-lime-300 text-[11px]">Trash hauled</div>
                  <div className="text-base font-mono text-lime-200">{gameState.collected}</div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-slate-400">Shields</div>
                  <div className="text-sm text-cyan-300">{gameState.shields}</div>
                </div>
              </div>
              <button
                onClick={handleAbort}
                className="mt-3 w-full py-3 rounded-xl bg-rose-500 text-black font-semibold text-sm shadow-[0_10px_30px_rgba(244,63,94,0.35)] active:scale-[0.99]"
              >
                Emergency Eject (Keep Trash)
              </button>
            </div>
          )}

          {gameState.gameOver && (
            <div className="pointer-events-auto flex-1 flex items-center justify-center px-4 pb-6">
              <div className="w-full max-w-sm rounded-3xl bg-black/80 border border-rose-500/60 shadow-2xl shadow-rose-900/40 p-6 text-center text-slate-100">
                <div className="text-2xl font-bold text-rose-300 mb-2">Hull Breach</div>
                <div className="text-sm text-slate-300">Burn Output: {gameState.score} kJ</div>
                <div className="text-sm text-lime-300 mt-1">Trash Hauled: {gameState.collected}</div>
                <button
                  onClick={handleAbort}
                  className="mt-4 w-full py-3 rounded-xl bg-lime-400 text-black font-semibold active:scale-[0.99]"
                >
                  Return to Yard
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div ref={mountRef} className="w-full h-full pointer-events-none" />

      <div
        className="absolute inset-0 z-0"
        style={{ touchAction: 'none' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
    </div>
  );
}
