import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { useGameStore } from '../core/GameState';
import { createOrbMaterial } from './orbMaterial';
import { CALM_IDLE_PRESET } from './orbPresets';

type Props = {
  isHolding: boolean;
};

const CHARGE_COLOR = new THREE.Color(CALM_IDLE_PRESET.uniforms.chargeColor).getHex();

export default function OrbScene({ isHolding }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const addEnergy = useGameStore((s) => s.addEnergy);
  const setCharge = useGameStore((s) => s.setCharge);
  const physics = useGameStore((s) => s.physics);
  const upgrades = useGameStore((s) => s.upgrades);
  const prestigeLevel = useGameStore((s) => s.prestigeLevel);

  const stateRef = useRef({
    velocity: 0,
    charge: 0,
  });

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

  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
    renderer.setClearColor(0x080812, 1);
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.inset = '0';
    mountRef.current.appendChild(renderer.domElement);

    camera.position.z = 5;

    const orbGeometry = new THREE.SphereGeometry(1, 64, 64);
    const orbMaterial = createOrbMaterial({ chargeColor: CHARGE_COLOR });

    const orb = new THREE.Mesh(orbGeometry, orbMaterial);
    scene.add(orb);

    const particleCount = CALM_IDLE_PRESET.particles;
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleVelocities: { x: number; y: number; z: number }[] = [];

    for (let i = 0; i < particleCount; i++) {
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

    const particleMaterial = new THREE.PointsMaterial({
      color: CHARGE_COLOR,
      size: 0.05,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    const ambientLight = new THREE.AmbientLight(0x404040, 2);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(CHARGE_COLOR, 0, 10);
    pointLight.position.set(0, 0, 3);
    scene.add(pointLight);

    // Post-processing: bloom for high charge glow
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      CALM_IDLE_PRESET.bloom.strength,
      0.8,
      CALM_IDLE_PRESET.bloom.threshold
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

      if (localState.charge > 0) {
        const baseGen = localState.charge * 10 * deltaTime;
        const resonanceBonus = 1 + (upgrades.resonanceTuner ?? 0) * 0.15;
        const prestigeBonus = 1 + prestigeLevel * 0.5;
        const surgeChance = Math.min(1, (upgrades.criticalSurge ?? 0) * 0.05);
        const surgeMultiplier = Math.random() < surgeChance ? 10 : 1;
        addEnergy(baseGen * resonanceBonus * prestigeBonus * surgeMultiplier);
      }

      const heartbeat = 1 + Math.sin(elapsedTime * (holdRef.current ? 2 : 1)) * 0.05;
      const rotationSpeed = 0.5 + localState.charge * 3;
      orb.rotation.y = elapsedTime * rotationSpeed;
      orb.rotation.x = Math.sin(elapsedTime * 0.3) * 0.2;
      orb.scale.setScalar(heartbeat + localState.charge * 0.2);

      orbMaterial.uniforms.time.value = elapsedTime;
      orbMaterial.uniforms.chargeLevel.value = localState.charge;
      orb.position.y = Math.sin(elapsedTime * 2) * 0.1 * (1 - localState.charge * 0.5);

      particleMaterial.opacity = localState.charge * 0.8;
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
      pointLight.intensity = localState.charge * 5;

      bloomPass.strength = Math.max(CALM_IDLE_PRESET.bloom.strength, localState.charge * 2);
      composer.render();
    };

    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      composer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
      orbGeometry.dispose();
      orbMaterial.dispose();
      particleGeometry.dispose();
      particleMaterial.dispose();
      renderer.dispose();
    };
  }, [addEnergy, setCharge]);

  return <div ref={mountRef} className="fixed inset-0" />;
}
