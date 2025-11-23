import { useEffect, useRef, useState } from 'react';
import type { MouseEvent, TouchEvent } from 'react';
import * as THREE from 'three';
import type { ScrapUpgradeId } from '../core/ScrapUnlocks';
import { BASE_GAME_CONFIG, applyUpgradesToConfig, type ScrapRunConfig } from './config';
import { createOrbMaterial } from '../orb/orbMaterial';
import { CALM_IDLE_PRESET } from '../orb/orbPresets';

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
  const mountRef = useRef<HTMLDivElement>(null);
  const [isHolding, setIsHolding] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [currentTouchX, setCurrentTouchX] = useState<number | null>(null);
  const [gameState, setGameState] = useState({
    score: 0,
    collected: 0,
    gameOver: false,
    shields: upgrades.shieldGenerator ?? 0,
  });

  useEffect(() => {
    if (!mountRef.current || gameState.gameOver) return;

    // Clean up any previous canvas if StrictMode double-mounts.
    if (mountRef.current.firstChild) {
      mountRef.current.replaceChildren();
    }

    const effectiveConfig = applyUpgradesToConfig(config, upgrades);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a1a);
    scene.fog = new THREE.Fog(0x0a0a1a, 10, 50);

    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 10);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.domElement.style.pointerEvents = 'none';
    mountRef.current.appendChild(renderer.domElement);

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

    const hitboxHelper =
      showHitboxes &&
      new THREE.Mesh(
        new THREE.SphereGeometry(1, 16, 16),
        new THREE.MeshBasicMaterial({ color: 0x00ffff, wireframe: true, transparent: true, opacity: 0.2 })
      );
    if (hitboxHelper) {
      playerGroup.add(hitboxHelper);
    }

    const animate = () => {
      if (!currentGameState.gameOver || endless) {
        requestAnimationFrame(animate);
      }

      planet.rotation.y += 0.002;
      const elapsed = shaderClock.getElapsedTime();
      orbMaterial.uniforms.time.value = elapsed;
      const visualCharge = Math.min(
        1,
        0.2 + currentGameState.collected * 0.05 + (currentIsHolding ? 0.4 : 0)
      );
      orbMaterial.uniforms.chargeLevel.value = visualCharge;

      const currentY = playerGroup.position.y;
      const newY = THREE.MathUtils.lerp(currentY, currentOrbitTarget, effectiveConfig.orbitSpeed);
      playerGroup.position.y = newY;

      const currentX = playerGroup.position.x;
      const newX = THREE.MathUtils.lerp(currentX, currentStrafeTarget, effectiveConfig.strafeSpeed);
      playerGroup.position.x = newX;

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
        });
        const debris = new THREE.Mesh(geometry, material);

        const startX = (Math.random() - 0.5) * 6;
        const startY = (Math.random() - 0.5) * 4 - 1;

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

        const distance = debris.position.distanceTo(playerPos);
        if (distance < hitboxRadius + 0.3) {
          scene.remove(debris);
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
          debrisList.splice(i, 1);

          if (debris.userData.type === 'good') {
            currentGameState.collected++;
            currentGameState.score += 10;
            setGameState({ ...currentGameState });

            const junkPiece = debris.clone();
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
            if (currentGameState.shields > 0) {
              currentGameState.shields -= 1;
              setGameState({ ...currentGameState });
            } else if (currentGameState.collected > 0) {
              const loseCount = Math.min(3, currentGameState.collected);
              currentGameState.collected -= loseCount;

              for (let j = 0; j < loseCount && collectedJunk.length > 0; j++) {
                const junk = collectedJunk.pop();
                if (junk) playerGroup.remove(junk);
              }

              setGameState({ ...currentGameState });
            } else {
              if (!endless) {
                currentGameState.gameOver = true;
                setGameState({ ...currentGameState });
              }
            }
          }
          continue;
        }

        if (debris.position.z > effectiveConfig.despawnDistance) {
          scene.remove(debris);
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
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    const stateInterval = setInterval(() => {
      currentOrbitTarget = currentIsHolding ? effectiveConfig.outerOrbit : effectiveConfig.innerOrbit;

      if (currentTouchPos !== null) {
        const normalizedX = (currentTouchPos - window.innerWidth / 2) / (window.innerWidth / 2);
        currentStrafeTarget = normalizedX * effectiveConfig.maxStrafe;
      } else {
        currentStrafeTarget = 0;
      }
    }, 16);

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

      debrisList.forEach((debris) => {
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
        scene.remove(debris);
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
    if (gameState.gameOver) {
      onGameOver(gameState.score, gameState.collected);
    }
  }, [gameState.gameOver, gameState.score, gameState.collected, onGameOver]);

  const handleAbort = () => {
    onGameOver(gameState.score, gameState.collected);
  };

  const handleTouchStart = (e: TouchEvent) => {
    setIsHolding(true);
    const touch = e.touches[0];
    setTouchStart(touch.clientX);
    setCurrentTouchX(touch.clientX);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (touchStart !== null) {
      const touch = e.touches[0];
      setCurrentTouchX(touch.clientX);
    }
  };

  const handleTouchEnd = () => {
    setIsHolding(false);
    setTouchStart(null);
    setCurrentTouchX(null);
  };

  const handleMouseDown = (e: MouseEvent) => {
    setIsHolding(true);
    setTouchStart(e.clientX);
    setCurrentTouchX(e.clientX);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (touchStart !== null && isHolding) {
      setCurrentTouchX(e.clientX);
    }
  };

  const handleMouseUp = () => {
    setIsHolding(false);
    setTouchStart(null);
    setCurrentTouchX(null);
  };

  return (
    <div className="fixed inset-0 bg-black">
      {!minimalUi && (
        <div
          className="absolute top-5 left-0 right-0 z-10 text-center font-mono text-xl text-green-400"
          style={{ textShadow: '0 0 10px rgba(74, 222, 128, 0.5)' }}
        >
          <div>SCRAP: {gameState.collected} | SCORE: {gameState.score}</div>
          <div className="text-sm mt-1 text-purple-400">
            {isHolding ? '↑ OUTER ORBIT' : '↓ INNER ORBIT'}
          </div>
          {gameState.shields > 0 && (
            <div className="text-xs text-cyan-400 mt-1">Shields: {gameState.shields}</div>
          )}
        </div>
      )}

      {!minimalUi && !gameState.gameOver && gameState.score === 0 && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 text-white font-mono text-center bg-black bg-opacity-80 p-5 rounded-lg pointer-events-none">
          <div className="text-green-400 text-2xl mb-2">GREED vs GRAVITY</div>
          <div>HOLD SCREEN → OUTER ORBIT</div>
          <div>RELEASE → INNER ORBIT</div>
          <div className="mt-2">DRAG LEFT/RIGHT → STRAFE</div>
          <div className="mt-2 text-green-400">✓ Collect green junk</div>
          <div className="text-red-500">✖ Avoid red obstacles</div>
        </div>
      )}

      {!minimalUi && gameState.gameOver && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 text-white font-mono text-2xl text-center bg-black bg-opacity-90 p-10 rounded-lg">
          <div className="text-red-500 text-3xl mb-5">WRECKED</div>
          <div>Final Score: {gameState.score}</div>
          <div>Scrap Collected: {gameState.collected}</div>
          <button
            onClick={handleAbort}
            className="mt-5 px-8 py-3 text-lg bg-green-500 hover:bg-green-600 border-0 rounded cursor-pointer font-mono text-black font-bold"
          >
            RETURN TO ORB
          </button>
        </div>
      )}

      {!minimalUi && !gameState.gameOver && (
        <button
          onClick={handleAbort}
          className="absolute top-5 right-5 z-10 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold"
        >
          ABORT RUN
        </button>
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
