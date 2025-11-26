import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { createOrbMaterial, type OrbUniformValues } from '../orb/orbMaterial';
import type { OrbVisualPreset } from '../orb/orbPresets';
import { ORB_THEME_PRESETS, type OrbThemePreset } from './orbThemePresets';

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
const UNIFORM_FIELD_NAMES = [
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
] as const;

type UniformField = typeof UNIFORM_FIELD_NAMES[number];

const NUMERIC_FIELDS: Array<UniformField> = [...UNIFORM_FIELD_NAMES];

const toControls = (preset: OrbVisualPreset): ControlState => ({
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

const buildUniformConfig = (state: ControlState): Partial<OrbUniformValues> => {
	const base: Partial<OrbUniformValues> = {
		color1: state.color1,
		color2: state.color2,
		chargeColor: state.chargeColor,
	};
	NUMERIC_FIELDS.forEach((key) => {
		const uniformName = key === 'charge' ? 'chargeLevel' : key;
		(base as Record<string, number>)[uniformName] = state[key];
	});
	return base;
};

const sliderGroups = [
	{
		title: 'Energy & Pattern',
		sliders: [
			{ field: 'charge', label: 'Charge', min: 0, max: 1, step: 0.01 },
			{ field: 'wobbleIntensity', label: 'Wobble', min: 0, max: 4, step: 0.05 },
			{ field: 'patternScale', label: 'Pattern Scale', min: 0.5, max: 6, step: 0.05 },
			{ field: 'fresnelIntensity', label: 'Fresnel', min: 0, max: 4, step: 0.05 },
		],
	},
	{
		title: 'Structure',
		sliders: [
			{ field: 'bandStrength', label: 'Band Strength', min: 0, max: 1, step: 0.01 },
			{ field: 'bandFrequency', label: 'Band Freq', min: 2, max: 20, step: 0.5 },
			{ field: 'crackThreshold', label: 'Crack Threshold', min: 0, max: 1, step: 0.01 },
			{ field: 'crackSharpness', label: 'Crack Sharpness', min: 0, max: 10, step: 0.2 },
			{ field: 'pulseSpeed', label: 'Pulse Speed', min: 0, max: 8, step: 0.1 },
			{ field: 'pulseStrength', label: 'Pulse Strength', min: 0, max: 1.5, step: 0.05 },
			{ field: 'facetSteps', label: 'Facet Steps', min: 0, max: 32, step: 1 },
			{ field: 'glitchIntensity', label: 'Glitch', min: 0, max: 1, step: 0.05 },
		],
	},
	{
		title: 'Barbed Wire',
		sliders: [
			{ field: 'wireIntensity', label: 'Wire Intensity', min: 0, max: 1, step: 0.01 },
			{ field: 'wireThickness', label: 'Wire Thickness', min: 0.05, max: 1, step: 0.05 },
			{ field: 'sparkIntensity', label: 'Wire Sparks', min: 0, max: 1, step: 0.05 },
		],
	},
	{
		title: 'Singularity',
		sliders: [
			{ field: 'blackHoleIntensity', label: 'Gravity Intensity', min: 0, max: 1, step: 0.01 },
			{ field: 'coreRadius', label: 'Core Radius', min: 0.2, max: 1, step: 0.02 },
			{ field: 'ringIntensity', label: 'Ring Intensity', min: 0, max: 1, step: 0.05 },
			{ field: 'warpStrength', label: 'Warp Strength', min: 0, max: 1, step: 0.05 },
		],
	},
	{
		title: 'Vine Growth',
		sliders: [
			{ field: 'vineIntensity', label: 'Vine Intensity', min: 0, max: 1, step: 0.01 },
			{ field: 'vineWidth', label: 'Vine Width', min: 0.05, max: 1, step: 0.02 },
			{ field: 'mossStrength', label: 'Moss Strength', min: 0, max: 1, step: 0.05 },
		],
	},
	{
		title: 'Flame Core',
		sliders: [
			{ field: 'flameIntensity', label: 'Flame Intensity', min: 0, max: 1.5, step: 0.05 },
			{ field: 'flameScale', label: 'Flame Scale', min: 0.5, max: 3.5, step: 0.1 },
			{ field: 'flameSpeed', label: 'Flame Speed', min: 0, max: 5, step: 0.1 },
			{ field: 'flameNoiseDetail', label: 'Noise Detail', min: 0.3, max: 3, step: 0.05 },
			{ field: 'coreIntensity', label: 'Core Intensity', min: 0, max: 1.5, step: 0.05 },
		],
	},
	{
		title: 'Scrap Magnet',
		sliders: [
			{ field: 'scrapIntensity', label: 'Scrap Intensity', min: 0, max: 1, step: 0.01 },
			{ field: 'streakStrength', label: 'Streak Strength', min: 0, max: 1, step: 0.05 },
			{ field: 'impactSparkIntensity', label: 'Impact Sparks', min: 0, max: 1, step: 0.05 },
		],
	},
	{
		title: 'Hologram & Scan',
		sliders: [
			{ field: 'holoIntensity', label: 'Holo Intensity', min: 0, max: 1, step: 0.05 },
			{ field: 'scanSpeed', label: 'Scan Speed', min: 0, max: 4, step: 0.1 },
		],
	},
	{
		title: 'Sludge Flow',
		sliders: [
			{ field: 'sludgeIntensity', label: 'Sludge Intensity', min: 0, max: 1, step: 0.05 },
			{ field: 'dripScale', label: 'Drip Scale', min: 0.2, max: 3, step: 0.1 },
			{ field: 'glowStrength', label: 'Glow Strength', min: 0, max: 0.6, step: 0.02 },
		],
	},
	{
		title: 'Frost Shell',
		sliders: [
			{ field: 'frostIntensity', label: 'Frost Intensity', min: 0, max: 1, step: 0.01 },
			{ field: 'frostSharpness', label: 'Frost Sharpness', min: 1, max: 20, step: 0.5 },
		],
	},
];

const toPreset = (state: ControlState): OrbVisualPreset => ({
	uniforms: {
		color1: state.color1,
		color2: state.color2,
		chargeColor: state.chargeColor,
		chargeLevel: state.charge,
		wobbleIntensity: state.wobbleIntensity,
		patternScale: state.patternScale,
		fresnelIntensity: state.fresnelIntensity,
		bandStrength: state.bandStrength,
		bandFrequency: state.bandFrequency,
		crackThreshold: state.crackThreshold,
		crackSharpness: state.crackSharpness,
		pulseSpeed: state.pulseSpeed,
		pulseStrength: state.pulseStrength,
		facetSteps: state.facetSteps,
		glitchIntensity: state.glitchIntensity,
		wireIntensity: state.wireIntensity,
		wireThickness: state.wireThickness,
		sparkIntensity: state.sparkIntensity,
		blackHoleIntensity: state.blackHoleIntensity,
		coreRadius: state.coreRadius,
		ringIntensity: state.ringIntensity,
		warpStrength: state.warpStrength,
		vineIntensity: state.vineIntensity,
		vineWidth: state.vineWidth,
		mossStrength: state.mossStrength,
		flameIntensity: state.flameIntensity,
		flameScale: state.flameScale,
		flameSpeed: state.flameSpeed,
		flameNoiseDetail: state.flameNoiseDetail,
		coreIntensity: state.coreIntensity,
		scrapIntensity: state.scrapIntensity,
		streakStrength: state.streakStrength,
		impactSparkIntensity: state.impactSparkIntensity,
		holoIntensity: state.holoIntensity,
		scanSpeed: state.scanSpeed,
		sludgeIntensity: state.sludgeIntensity,
		dripScale: state.dripScale,
		glowStrength: state.glowStrength,
		frostIntensity: state.frostIntensity,
		frostSharpness: state.frostSharpness,
	},
	particles: Math.round(state.particleCount),
	bloom: {
		strength: state.bloomStrength,
		threshold: state.bloomThreshold,
	},
});

export default function OrbShaderVariantsLab() {
	const defaultTheme = ORB_THEME_PRESETS[0];
	const [activeThemeId, setActiveThemeId] = useState(defaultTheme.id);
	const activeTheme: OrbThemePreset = useMemo(() => ORB_THEME_PRESETS.find((t) => t.id === activeThemeId) ?? defaultTheme, [activeThemeId, defaultTheme]);
	const [controls, setControls] = useState<ControlState>(() => toControls(defaultTheme.preset));
	const [copied, setCopied] = useState(false);
	const mountRef = useRef<HTMLDivElement | null>(null);
	const controlsRef = useRef<ControlState>(controls);
	const orbMaterialRef = useRef<ReturnType<typeof createOrbMaterial> | null>(null);
	const bloomPassRef = useRef<UnrealBloomPass | null>(null);
 const particlesRef = useRef<THREE.Points | null>(null);
 const rebuildParticlesRef = useRef<((count: number) => void) | null>(null);

	useEffect(() => {
		controlsRef.current = controls;
	}, [controls]);

	useEffect(() => {
		setControls(toControls(activeTheme.preset));
	}, [activeTheme]);

	useEffect(() => {
		if (!mountRef.current) return;

		const container = mountRef.current;
		const getSize = () => {
			const width = container.clientWidth || window.innerWidth;
			const height = container.clientHeight || Math.max(360, window.innerHeight * 0.5);
			return { width, height };
		};
		const { width, height } = getSize();
		container.style.minHeight = `${height}px`;

		const scene = new THREE.Scene();
		scene.background = new THREE.Color('#030409');

		const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
		camera.position.set(0, 0, 4.5);

		const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
		renderer.setSize(width, height);
		renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
		container.appendChild(renderer.domElement);

		const orbGeometry = new THREE.SphereGeometry(1, 64, 64);
		const initialState = controlsRef.current;
		const orbMaterial = createOrbMaterial(buildUniformConfig(initialState));
		orbMaterialRef.current = orbMaterial;

		const orb = new THREE.Mesh(orbGeometry, orbMaterial);
		scene.add(orb);

		const ambient = new THREE.AmbientLight(0xffffff, 0.3);
		scene.add(ambient);

		const pointLight = new THREE.PointLight(initialState.chargeColor, 2.5, 8);
		pointLight.position.set(0, 0, 3);
		scene.add(pointLight);

		const composer = new EffectComposer(renderer);
		composer.addPass(new RenderPass(scene, camera));
		const bloomPass = new UnrealBloomPass(new THREE.Vector2(width, height), initialState.bloomStrength, 0.8, initialState.bloomThreshold);
		composer.addPass(bloomPass);
		bloomPassRef.current = bloomPass;

		const particles = new THREE.Points(new THREE.BufferGeometry(), new THREE.PointsMaterial({ color: initialState.chargeColor, size: 0.05, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending }));
		particlesRef.current = particles;
		const rebuildParticles = (count: number) => {
			const geometry = new THREE.BufferGeometry();
			const positions = new Float32Array(count * 3);
			for (let i = 0; i < count; i++) {
				positions[i * 3] = (Math.random() - 0.5) * 2;
				positions[i * 3 + 1] = (Math.random() - 0.5) * 2;
				positions[i * 3 + 2] = (Math.random() - 0.5) * 2;
			}
			geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
			particles.geometry.dispose();
			particles.geometry = geometry;
		};
		rebuildParticlesRef.current = rebuildParticles;
		rebuildParticles(initialState.particleCount);
		scene.add(particles);

		const clock = new THREE.Clock();
		let animationId = 0;

		const animate = () => {
			animationId = requestAnimationFrame(animate);
			const elapsed = clock.getElapsedTime();
			const state = controlsRef.current;

			orb.rotation.y += 0.03;
			orb.rotation.x = Math.sin(elapsed * 0.06) * 0.1;

			const uniforms = orbMaterial.uniforms;
			uniforms.time.value = elapsed;
			uniforms.color1.value.set(state.color1);
			uniforms.color2.value.set(state.color2);
			uniforms.chargeColor.value.set(state.chargeColor);

			NUMERIC_FIELDS.forEach((key) => {
				const uniformName = key === 'charge' ? 'chargeLevel' : key;
				const uniform = uniforms[uniformName as keyof typeof uniforms];
				if (uniform) {
					uniform.value = state[key];
				}
			});

			pointLight.color.set(state.chargeColor);
			pointLight.intensity = 1.4 + state.charge * 2.6;
			(particles.material as THREE.PointsMaterial).color.set(state.chargeColor);

			if (bloomPassRef.current) {
				bloomPassRef.current.strength = state.bloomStrength;
				bloomPassRef.current.threshold = state.bloomThreshold;
			}

			composer.render();
		};

		animate();

		const handleResize = () => {
			const next = getSize();
			camera.aspect = next.width / next.height;
			camera.updateProjectionMatrix();
			renderer.setSize(next.width, next.height);
			composer.setSize(next.width, next.height);
		};
		window.addEventListener('resize', handleResize);

		return () => {
			cancelAnimationFrame(animationId);
			window.removeEventListener('resize', handleResize);
			orbGeometry.dispose();
			orbMaterial.dispose();
			renderer.dispose();
			composer.dispose();
			if (renderer.domElement.parentElement === container) {
				container.removeChild(renderer.domElement);
			}
		};
	}, []);

	const handleSlider = (field: keyof ControlState) => (event: ChangeEvent<HTMLInputElement>) => {
		const value = parseFloat(event.target.value);
		setControls((prev) => ({ ...prev, [field]: Number.isNaN(value) ? prev[field] : value }));
	};

	const presetJson = useMemo(() => JSON.stringify(toPreset(controls), null, 2), [controls]);

	useEffect(() => {
		rebuildParticlesRef.current?.(controls.particleCount);
	}, [controls.particleCount]);

	return (
		<div className="flex min-h-screen flex-col bg-slate-950 text-slate-100 lg:h-screen lg:flex-row lg:overflow-hidden">
			<aside className="w-full border-b border-slate-900/70 bg-slate-950/90 p-6 lg:w-[420px] lg:border-b-0 lg:border-r lg:overflow-y-auto">
				<div className="space-y-5 pb-8">
					<div>
						<div className="text-[10px] uppercase tracking-[0.3em] text-slate-500">Orb Theme Lab</div>
						<h1 className="mt-1 text-2xl font-semibold">Shader Variants</h1>
						<p className="mt-2 text-sm text-slate-400">Browse curated presets and tune advanced shader uniforms before exporting to JSON.</p>
					</div>
					<div className="space-y-2">
						{ORB_THEME_PRESETS.map((theme) => (
							<button
								key={theme.id}
								onClick={() => setActiveThemeId(theme.id)}
								className={`w-full rounded-xl border px-3 py-3 text-left transition ${activeTheme.id === theme.id ? 'border-cyan-400/60 bg-cyan-400/10' : 'border-slate-800 hover:border-slate-700'}`}
							>
								<div className="flex items-center justify-between">
									<div className="text-sm font-semibold">{theme.label}</div>
									{activeTheme.id === theme.id && <span className="text-[11px] text-cyan-300">Active</span>}
								</div>
								<div className="mt-1 text-xs text-slate-400">{theme.description}</div>
							</button>
						))}
					</div>
					<div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-inner shadow-black/30">
						<div className="text-[11px] uppercase tracking-[0.25em] text-slate-400">Tune preset</div>
						<div className="mt-3 grid grid-cols-2 gap-3">
							<ColorInput label="Color A" value={controls.color1} onChange={(val) => setControls((prev) => ({ ...prev, color1: val }))} />
							<ColorInput label="Color B" value={controls.color2} onChange={(val) => setControls((prev) => ({ ...prev, color2: val }))} />
							<ColorInput label="Charge" value={controls.chargeColor} onChange={(val) => setControls((prev) => ({ ...prev, chargeColor: val }))} />
						</div>
						<div className="mt-4 space-y-4">
							{sliderGroups.map((group) => (
								<div key={group.title} className="border-t border-slate-800 pt-3">
									<div className="mb-2 text-xs uppercase tracking-[0.3em] text-slate-500">{group.title}</div>
									{group.sliders.map((slider) => (
										<SliderInput
											key={slider.field}
											label={slider.label}
											min={slider.min}
											max={slider.max}
											step={slider.step}
											value={controls[slider.field as keyof ControlState] as number}
											onChange={handleSlider(slider.field as keyof ControlState)}
										/>
									))}
								</div>
							))}
							<SliderInput label="Particle Count" min={20} max={400} step={1} value={controls.particleCount} onChange={handleSlider('particleCount')} />
							<SliderInput label="Bloom Strength" min={0} max={3} step={0.05} value={controls.bloomStrength} onChange={handleSlider('bloomStrength')} />
							<SliderInput label="Bloom Threshold" min={0} max={0.6} step={0.01} value={controls.bloomThreshold} onChange={handleSlider('bloomThreshold')} />
						</div>
						<div className="mt-4 flex gap-2">
							<button onClick={() => setControls(toControls(activeTheme.preset))} className="flex-1 rounded-lg border border-slate-800 bg-slate-900 py-2 text-sm font-semibold text-slate-200 hover:border-cyan-400">
								Reset to Theme
							</button>
							<button
								onClick={() => {
									navigator.clipboard?.writeText(presetJson).then(() => {
										setCopied(true);
										setTimeout(() => setCopied(false), 1500);
									});
								}}
								className="flex-1 rounded-lg border border-cyan-400/50 bg-cyan-500/20 py-2 text-sm font-semibold text-cyan-100 hover:bg-cyan-400/30"
							>
								{copied ? 'Copied!' : 'Copy JSON'}
							</button>
						</div>
						<textarea className="mt-3 w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs font-mono text-slate-300" rows={9} readOnly value={presetJson} />
					</div>
				</div>
			</aside>
			<main className="flex flex-1 items-center justify-center p-4 lg:p-8">
				<div className="relative w-full max-w-[640px] flex-1 aspect-square overflow-hidden rounded-3xl border border-slate-900 bg-gradient-to-b from-slate-950 to-slate-900 shadow-[0_40px_120px_rgba(0,0,0,0.65)]">
					<div className="absolute inset-4 rounded-3xl border border-white/5" />
					<div ref={mountRef} className="absolute inset-0" />
					<div className="pointer-events-none absolute bottom-4 left-4 right-4 rounded-2xl border border-slate-800 bg-slate-950/70 p-3 text-xs text-slate-400">
						<div className="flex items-center justify-between">
							<span className="text-[10px] uppercase tracking-[0.3em] text-slate-500">Active preset</span>
							<span className="text-sm text-slate-200">{activeTheme.label}</span>
						</div>
						<p className="mt-1 text-xs text-slate-400">{activeTheme.description}</p>
					</div>
				</div>
			</main>
		</div>
	);
}

function SliderInput({ label, value, min, max, step, onChange }: { label: string; value: number; min: number; max: number; step: number; onChange: (event: ChangeEvent<HTMLInputElement>) => void }) {
	return (
		<label className="block text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
			{label}
			<input type="range" min={min} max={max} step={step} value={value} onChange={onChange} className="mt-1 w-full accent-cyan-400" />
			<div className="mt-0.5 text-right text-[11px] text-slate-300">{value.toFixed(2)}</div>
		</label>
	);
}

function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
	return (
		<label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
			{label}
			<input type="color" value={value} onChange={(event) => onChange(event.target.value)} className="h-10 w-full rounded-xl border border-slate-800 bg-slate-950 p-1" />
		</label>
	);
}
