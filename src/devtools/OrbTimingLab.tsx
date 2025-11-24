import { useEffect, useState } from 'react';
import {
	getOrbTimingConfig,
	resetOrbTimingConfig,
	setOrbTimingConfig,
	type OrbTimingConfig,
} from '../orb/orbTimingConfig';
import OrbScene from '../orb/OrbScene';

export default function OrbTimingLab() {
	const [controls, setControls] = useState<OrbTimingConfig>(() =>
		getOrbTimingConfig()
	);
	const [isHolding, setIsHolding] = useState(false);

	useEffect(() => {
		setOrbTimingConfig(controls);
	}, [controls]);

	useEffect(
		() => () => {
			resetOrbTimingConfig();
		},
		[]
	);

	const update = (partial: Partial<OrbTimingConfig>) => {
		setControls((c) => ({ ...c, ...partial }));
	};

	const reset = () => {
		resetOrbTimingConfig();
		setControls(getOrbTimingConfig());
	};

	const exportConfig = () => {
		const payload = getOrbTimingConfig();
		// eslint-disable-next-line no-console
		console.log('Orb timing config', payload);
	};

	return (
		<div className="min-h-screen bg-slate-950 text-slate-100 grid grid-cols-1 lg:grid-cols-[2fr_1fr]">
			<div className="p-6 space-y-4">
				<div className="flex items-center justify-between">
					<div>
						<div className="text-xs text-slate-500 uppercase">
							Dev Tool: Orb Timing Lab
						</div>
						<div className="text-2xl font-semibold">
							State transition tuning
						</div>
						<div className="text-sm text-slate-400">
							?devTool=timing -- live overrides for OrbScene state
							transitions.
						</div>
					</div>
					<button
						onClick={reset}
						className="rounded border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm font-semibold text-slate-200 hover:border-lime-300 hover:text-lime-100 transition"
					>
						Reset to defaults
					</button>
				</div>

				<div className="relative h-[420px] rounded-2xl border border-slate-800 bg-slate-950/60 overflow-hidden">
					<OrbScene isHolding={isHolding} />
					<div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-black/30" />
					<div className="absolute top-3 left-3 flex items-center gap-2">
						<button
							onClick={() => setIsHolding((v) => !v)}
							className={`rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] border transition ${
								isHolding
									? 'bg-emerald-500/20 text-emerald-100 border-emerald-300/60'
									: 'bg-slate-900/80 text-slate-200 border-slate-700 hover:border-emerald-400/60'
							}`}
						>
							{isHolding ? 'Holding' : 'Idle'}
						</button>
						<span className="text-[11px] text-slate-400">
							Live orb preview reflects slider values above.
						</span>
					</div>
				</div>

				<div className="grid gap-4 max-w-xl">
					<ControlSlider
						label="Charging Threshold"
						description="Charge level required (while holding) before switching from calm to charging."
						min={0}
						max={1}
						step={0.01}
						value={controls.chargingThreshold}
						display={(v) => `${(v * 100).toFixed(0)}%`}
						onChange={(n) => update({ chargingThreshold: n })}
					/>
					<ControlSlider
						label="Super-Critical Hold Time"
						description="Seconds of continuous hold before triggering super-critical."
						min={1}
						max={30}
						step={0.1}
						value={controls.superCriticalHoldTime}
						display={(v) => `${v.toFixed(1)}s`}
						onChange={(n) => update({ superCriticalHoldTime: n })}
					/>
					<ControlSlider
						label="Spin Speed"
						description="Multiplier on orb spin rate."
						min={0.2}
						max={3}
						step={0.05}
						value={controls.spinSpeed}
						display={(v) => `${v.toFixed(2)}x`}
						onChange={(n) => update({ spinSpeed: n })}
					/>
				</div>

				<div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 space-y-3">
					<div className="flex items-center justify-between">
						<div className="text-sm font-semibold">Live Preview</div>
						<button
							onClick={exportConfig}
							className="rounded border border-slate-700 bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-200 hover:border-cyan-300 hover:text-cyan-100 transition"
						>
							Export to console
						</button>
					</div>
					<PreviewRow
						label="Charging threshold"
						value={controls.chargingThreshold}
						max={1}
						format={(v) => `${(v * 100).toFixed(0)}%`}
						color="from-lime-500 to-emerald-400"
					/>
					<PreviewRow
						label="Super-critical delay"
						value={controls.superCriticalHoldTime}
						max={30}
						format={(v) => `${v.toFixed(1)}s`}
						color="from-amber-400 to-orange-500"
					/>
					<PreviewRow
						label="Spin speed"
						value={controls.spinSpeed}
						max={3}
						format={(v) => `${v.toFixed(2)}x`}
						color="from-cyan-400 to-blue-500"
					/>
				</div>
			</div>

			<div className="p-6 border-l border-slate-800 bg-slate-900/70 space-y-3">
				<div className="text-sm font-semibold">Current overrides</div>
				<div className="text-xs text-slate-400">
					Changes apply immediately in the live orb scene. Reload or
					hit reset to clear.
				</div>
				<div className="space-y-2 text-sm">
					<div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900 px-3 py-2">
						<span className="text-slate-300">Charging threshold</span>
						<span className="font-mono text-lime-200">
							{(controls.chargingThreshold * 100).toFixed(0)}%
						</span>
					</div>
					<div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900 px-3 py-2">
						<span className="text-slate-300">Super-critical delay</span>
						<span className="font-mono text-amber-200">
							{controls.superCriticalHoldTime.toFixed(1)}s
						</span>
					</div>
					<div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900 px-3 py-2">
						<span className="text-slate-300">Spin speed</span>
						<span className="font-mono text-cyan-200">
							{controls.spinSpeed.toFixed(2)}x
						</span>
					</div>
				</div>
			</div>
		</div>
	);
}

function ControlSlider({
	label,
	description,
	min,
	max,
	step,
	value,
	display,
	onChange,
}: {
	label: string;
	description: string;
	min: number;
	max: number;
	step: number;
	value: number;
	display: (v: number) => string;
	onChange: (n: number) => void;
}) {
	return (
		<div className="space-y-1">
			<div className="flex items-center justify-between">
				<div>
					<div className="text-sm font-semibold text-white">{label}</div>
					<div className="text-xs text-slate-400">{description}</div>
				</div>
				<div className="text-sm font-mono text-lime-200">
					{display(value)}
				</div>
			</div>
			<input
				type="range"
				min={min}
				max={max}
				step={step}
				value={value}
				onChange={(e) => onChange(Number(e.target.value))}
				className="w-full accent-lime-400"
			/>
		</div>
	);
}

function PreviewRow({
	label,
	value,
	max,
	format,
	color,
}: {
	label: string;
	value: number;
	max: number;
	format: (n: number) => string;
	color: string;
}) {
	const width = Math.min(100, (value / max) * 100);
	return (
		<div className="space-y-1">
			<div className="flex items-center justify-between text-sm text-slate-200">
				<span>{label}</span>
				<span className="font-mono text-lime-200">{format(value)}</span>
			</div>
			<div className="h-2 rounded-full bg-slate-800 overflow-hidden">
				<div
					className={`h-full bg-gradient-to-r ${color}`}
					style={{ width: `${width}%` }}
				/>
			</div>
		</div>
	);
}
