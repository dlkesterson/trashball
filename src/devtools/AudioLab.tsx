import { useEffect, useRef, useState } from 'react';
import * as Tone from 'tone';
import {
  DEFAULT_CONTROLS,
  EVENT_LABELS,
  ORB_AUDIO_PRESETS,
  type ControlState,
  type OrbAudioId,
  type AudioEventId,
  type OrbAudioPreset,
} from '../audio/presets';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export default function AudioLab() {
  const [controls, setControls] = useState<ControlState>(DEFAULT_CONTROLS);
  const [activePreset, setActivePreset] = useState<OrbAudioId>('calm');
  const [exportText, setExportText] = useState('');
  const [started, setStarted] = useState(false);

  const synthRef = useRef<Tone.PolySynth | null>(null);
  const bassRef = useRef<Tone.MonoSynth | null>(null);
  const noiseRef = useRef<Tone.NoiseSynth | null>(null);
  const filterRef = useRef<Tone.Filter | null>(null);
  const vibratoRef = useRef<Tone.Vibrato | null>(null);
  const delayRef = useRef<Tone.FeedbackDelay | null>(null);
  const reverbRef = useRef<Tone.Reverb | null>(null);
  const volumeRef = useRef<Tone.Volume | null>(null);
  const analyserRef = useRef<Tone.Analyser | null>(null);
  const waveformRef = useRef<Tone.Waveform | null>(null);

  const scopeCanvasRef = useRef<HTMLCanvasElement>(null);
  const spectrumCanvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  const ensureAudio = async () => {
    if (!started) {
      await Tone.start();
      setStarted(true);
    }
  };

  useEffect(() => {
    const vibrato = new Tone.Vibrato(5, controls.vibrato);
    const filter = new Tone.Filter(controls.filterHz, 'lowpass', -24);
    const delay = new Tone.FeedbackDelay(controls.delayTime, controls.delayFeedback);
    const reverb = new Tone.Reverb({ decay: 4, wet: controls.reverb });
    const volume = new Tone.Volume(controls.volume);
    const analyser = new Tone.Analyser('fft', 128);
    const waveform = new Tone.Waveform(512);

    const synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'fatsawtooth' },
      envelope: {
        attack: controls.attack,
        decay: 0.2,
        sustain: 0.5,
        release: controls.release,
      },
      detune: controls.grit * 20,
    });

    const bass = new Tone.MonoSynth({
      oscillator: { type: 'sine' },
      envelope: {
        attack: clamp(controls.attack * 0.5, 0.005, 0.4),
        decay: 0.1,
        sustain: 0.25,
        release: clamp(controls.release * 0.6, 0.1, 1.2),
      },
      filter: {
        Q: controls.resonance,
        frequency: controls.filterHz * 0.8,
      },
      portamento: controls.glide,
    });

    const noise = new Tone.NoiseSynth({
      noise: { type: 'brown' },
      envelope: {
        attack: 0.01,
        decay: 0.2,
        sustain: 0,
        release: 0.08,
      },
    });

    synth.chain(vibrato, filter, delay, reverb, volume);
    bass.chain(filter, delay, reverb, volume);
    noise.chain(filter, delay, reverb, volume);

    volume.connect(analyser);
    volume.connect(waveform);
    volume.toDestination();

    synthRef.current = synth;
    bassRef.current = bass;
    noiseRef.current = noise;
    filterRef.current = filter;
    vibratoRef.current = vibrato;
    delayRef.current = delay;
    reverbRef.current = reverb;
    volumeRef.current = volume;
    analyserRef.current = analyser;
    waveformRef.current = waveform;

    return () => {
      rafRef.current && cancelAnimationFrame(rafRef.current);
      synth.dispose();
      bass.dispose();
      noise.dispose();
      vibrato.dispose();
      filter.dispose();
      delay.dispose();
      reverb.dispose();
      volume.dispose();
      analyser.dispose();
      waveform.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!synthRef.current || !bassRef.current || !filterRef.current) return;

    synthRef.current.set({
      envelope: { attack: controls.attack, decay: 0.2, sustain: 0.5, release: controls.release },
      detune: controls.grit * 40,
    });
    bassRef.current.set({
      envelope: {
        attack: clamp(controls.attack * 0.5, 0.005, 0.4),
        decay: 0.1,
        sustain: 0.25,
        release: clamp(controls.release * 0.6, 0.1, 1.2),
      },
      portamento: controls.glide,
      filter: {
        frequency: controls.filterHz * 0.8,
        Q: controls.resonance,
      },
    });

    filterRef.current.frequency.rampTo(controls.filterHz, 0.2);
    filterRef.current.Q.rampTo(controls.resonance, 0.1);
    vibratoRef.current?.depth.rampTo(controls.vibrato, 0.2);
    if (vibratoRef.current) {
      vibratoRef.current.frequency.rampTo(4 + controls.vibrato * 6, 0.2);
    }
    if (delayRef.current) {
      delayRef.current.delayTime.rampTo(controls.delayTime, 0.2);
      delayRef.current.feedback.rampTo(controls.delayFeedback, 0.2);
    }
    if (reverbRef.current) {
      reverbRef.current.wet.rampTo(controls.reverb, 0.2);
    }
    if (volumeRef.current) {
      volumeRef.current.volume.rampTo(controls.volume, 0.1);
    }
  }, [controls]);

  useEffect(() => {
    const draw = () => {
      const scopeCtx = scopeCanvasRef.current?.getContext('2d');
      const spectrumCtx = spectrumCanvasRef.current?.getContext('2d');
      if (scopeCtx && waveformRef.current) {
        const values = waveformRef.current.getValue();
        scopeCtx.clearRect(0, 0, scopeCtx.canvas.width, scopeCtx.canvas.height);
        scopeCtx.strokeStyle = '#67e8f9';
        scopeCtx.lineWidth = 2;
        scopeCtx.beginPath();
        for (let i = 0; i < values.length; i++) {
          const x = (i / values.length) * scopeCtx.canvas.width;
          const y = (0.5 + values[i] / 2) * scopeCtx.canvas.height;
          i === 0 ? scopeCtx.moveTo(x, y) : scopeCtx.lineTo(x, y);
        }
        scopeCtx.stroke();
      }

      if (spectrumCtx && analyserRef.current) {
        const values = analyserRef.current.getValue() as Float32Array;
        spectrumCtx.clearRect(0, 0, spectrumCtx.canvas.width, spectrumCtx.canvas.height);
        values.forEach((v, i) => {
          const magnitude = (v + 140) / 140;
          const x = (i / values.length) * spectrumCtx.canvas.width;
          const height = magnitude * spectrumCtx.canvas.height;
          spectrumCtx.fillStyle = '#a855f7';
          spectrumCtx.fillRect(x, spectrumCtx.canvas.height - height, spectrumCtx.canvas.width / values.length, height);
        });
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const applyPreset = (preset: OrbAudioPreset) => {
    setActivePreset(preset.id);
    setControls((prev) => ({ ...prev, ...preset.controls }));
  };

  const playChord = async (preset: OrbAudioPreset) => {
    await ensureAudio();
    const synth = synthRef.current;
    if (!synth) return;
    const now = Tone.now();
    preset.notes.forEach((note: string, idx: number) => {
      synth.triggerAttackRelease(note, '2n', now + idx * 0.08, 0.6);
    });
    if (noiseRef.current && preset.id === 'superCritical') {
      noiseRef.current.volume.value = controls.grit * 12 - 12;
      noiseRef.current.triggerAttackRelease('16n', now + 0.12);
    }
    if (bassRef.current && preset.id !== 'calm') {
      bassRef.current.triggerAttackRelease(preset.notes[0], '1n', now + 0.05, 0.7);
    }
  };

  const triggerEvent = async (id: AudioEventId) => {
    await ensureAudio();
    const now = Tone.now();
    if (id === 'goodScrap' && synthRef.current) {
      synthRef.current.triggerAttackRelease(['C5', 'E5'], '16n', now, 0.5);
      synthRef.current.triggerAttackRelease('G5', '16n', now + 0.12, 0.35);
    } else if (id === 'badDebris') {
      noiseRef.current?.triggerAttackRelease('16n', now);
      bassRef.current?.triggerAttackRelease('F2', '8n', now, 0.4);
    } else if (id === 'shield') {
      noiseRef.current?.triggerAttackRelease('8n', now, controls.grit * 0.4 + 0.2);
      synthRef.current?.triggerAttackRelease('C4', '8n', now, 0.35);
      synthRef.current?.triggerAttackRelease('G4', '8n', now + 0.1, 0.25);
    } else if (id === 'gameOver' && synthRef.current) {
      const notes = ['E4', 'C4', 'G3', 'E3'];
      notes.forEach((note: string, idx: number) => {
        synthRef.current?.triggerAttackRelease(note, '8n', now + idx * 0.2, 0.55 - idx * 0.08);
      });
      bassRef.current?.triggerAttackRelease('C2', '2n', now + 0.05, 0.5);
    } else if (id === 'womp') {
      const preset = ORB_AUDIO_PRESETS.find((p) => p.id === 'womp');
      const note = preset?.notes[0] ?? 'C2';
      bassRef.current?.triggerAttackRelease(note, '1n', now, 0.7);
      synthRef.current?.triggerAttackRelease('C3', '8n', now + 0.05, 0.45);
      noiseRef.current?.triggerAttackRelease('16n', now + 0.08, 0.2);
    }
  };

  const exportPreset = () => {
    const payload = {
      orbStates: ORB_AUDIO_PRESETS.reduce<Record<string, any>>((acc, preset) => {
        acc[preset.id] = {
          notes: preset.notes,
          controls: { ...DEFAULT_CONTROLS, ...preset.controls },
          colors: preset.visual.uniforms,
        };
        return acc;
      }, {}),
      events: EVENT_LABELS,
    };
    const snippet = `export const AUDIO_LAB_PRESET = ${JSON.stringify(payload, null, 2)};`;
    setExportText(snippet);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(snippet).catch(() => {
        // ignore clipboard errors in dev
      });
    }
  };

  const ControlSlider = ({
    label,
    value,
    min,
    max,
    step,
    format = (v) => v.toFixed(2),
    onChange,
  }: {
    label: string;
    value: number;
    min: number;
    max: number;
    step: number;
    format?: (v: number) => string;
    onChange: (n: number) => void;
  }) => (
    <label className="space-y-1 text-xs text-slate-300">
      <div className="flex items-center justify-between">
        <span>{label}</span>
        <span className="text-slate-100 font-mono">{format(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        className="w-full"
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 grid grid-cols-1 lg:grid-cols-[2fr_1fr]">
      <div className="relative">
        <div className="px-6 pt-6 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[10px] uppercase tracking-[0.25em] text-slate-500">Dev Tool</div>
              <div className="text-xl font-semibold">Audio Lab (Tone.js)</div>
              <div className="text-sm text-slate-400">
                Orb state beds, scrap run one-shots, waveform + spectrum monitors.
              </div>
            </div>
            <button
              onClick={ensureAudio}
              className="rounded-full bg-emerald-500 text-black text-xs font-semibold px-3 py-1.5 shadow-[0_10px_30px_rgba(16,185,129,0.35)]"
            >
              {started ? 'Audio Armed' : 'Start Audio'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ORB_AUDIO_PRESETS.map((preset) => (
              <div
                key={preset.id}
                className={`rounded-2xl border p-4 space-y-3 transition ${
                  activePreset === preset.id
                    ? 'border-cyan-400/70 bg-cyan-500/5'
                    : 'border-slate-800 bg-slate-900/70'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="text-sm font-semibold">{preset.label}</div>
                    <div className="text-[11px] text-slate-400">{preset.desc}</div>
                  </div>
                  <div className="flex -space-x-1">
                    <ColorSwatch color={preset.visual.uniforms.color1} />
                    <ColorSwatch color={preset.visual.uniforms.color2} />
                    <ColorSwatch color={preset.visual.uniforms.chargeColor} />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => applyPreset(preset)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 text-xs border border-slate-700 hover:border-cyan-400 transition"
                  >
                    Apply Preset
                  </button>
                  <button
                    onClick={() => playChord(preset)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500/90 text-black text-xs font-semibold shadow-[0_6px_18px_rgba(16,185,129,0.3)]"
                  >
                    Audition
                  </button>
                  <div className="text-[11px] text-slate-400 font-mono ml-auto">
                    {preset.notes.join(' · ')}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
                    Synth + Texture
                  </div>
                  <div className="text-sm text-slate-100">Match to orb vibes</div>
                </div>
                <span className="text-[11px] text-slate-400">Pad / Bass / Noise chain</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <ControlSlider
                  label="Attack"
                  value={controls.attack}
                  min={0.01}
                  max={1.5}
                  step={0.01}
                  onChange={(n) => setControls((c) => ({ ...c, attack: n }))}
                />
                <ControlSlider
                  label="Release"
                  value={controls.release}
                  min={0.2}
                  max={4}
                  step={0.05}
                  onChange={(n) => setControls((c) => ({ ...c, release: n }))}
                />
                <ControlSlider
                  label="Filter (Hz)"
                  value={controls.filterHz}
                  min={300}
                  max={2600}
                  step={10}
                  format={(v) => `${Math.round(v)}hz`}
                  onChange={(n) => setControls((c) => ({ ...c, filterHz: n }))}
                />
                <ControlSlider
                  label="Resonance (Q)"
                  value={controls.resonance}
                  min={0.1}
                  max={2.5}
                  step={0.05}
                  onChange={(n) => setControls((c) => ({ ...c, resonance: n }))}
                />
                <ControlSlider
                  label="Vibrato Depth"
                  value={controls.vibrato}
                  min={0}
                  max={1}
                  step={0.02}
                  onChange={(n) => setControls((c) => ({ ...c, vibrato: n }))}
                />
                <ControlSlider
                  label="Delay Time"
                  value={controls.delayTime}
                  min={0.05}
                  max={0.35}
                  step={0.01}
                  onChange={(n) => setControls((c) => ({ ...c, delayTime: n }))}
                />
                <ControlSlider
                  label="Delay Feedback"
                  value={controls.delayFeedback}
                  min={0}
                  max={0.8}
                  step={0.01}
                  onChange={(n) => setControls((c) => ({ ...c, delayFeedback: n }))}
                />
                <ControlSlider
                  label="Reverb Mix"
                  value={controls.reverb}
                  min={0}
                  max={1}
                  step={0.01}
                  onChange={(n) => setControls((c) => ({ ...c, reverb: n }))}
                />
                <ControlSlider
                  label="Grit / Noise"
                  value={controls.grit}
                  min={0}
                  max={0.6}
                  step={0.01}
                  onChange={(n) => setControls((c) => ({ ...c, grit: n }))}
                />
                <ControlSlider
                  label="Glide (womp)"
                  value={controls.glide}
                  min={0}
                  max={0.35}
                  step={0.01}
                  onChange={(n) => setControls((c) => ({ ...c, glide: n }))}
                />
                <ControlSlider
                  label="Bus Volume"
                  value={controls.volume}
                  min={-30}
                  max={0}
                  step={0.5}
                  format={(v) => `${v.toFixed(1)} dB`}
                  onChange={(n) => setControls((c) => ({ ...c, volume: n }))}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Events</div>
                  <div className="text-sm text-slate-100">Scrap Run one-shots</div>
                </div>
                <span className="text-[11px] text-slate-400">Tap to audition</span>
              </div>
              <div className="space-y-2">
                {(Object.keys(EVENT_LABELS) as AudioEventId[]).map((eventId) => (
                  <button
                    key={eventId}
                    onClick={() => triggerEvent(eventId)}
                    className="w-full text-left px-3 py-2 rounded-xl border border-slate-800 bg-slate-900/80 hover:border-emerald-400/70 transition flex items-center justify-between"
                  >
                    <span className="text-sm">{EVENT_LABELS[eventId]}</span>
                    <span className="text-[11px] text-emerald-300 font-semibold">Play</span>
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <div className="text-[11px] text-slate-500 uppercase tracking-[0.2em] mb-1">
                    Waveform
                  </div>
                  <canvas ref={scopeCanvasRef} width={320} height={150} className="w-full rounded-lg bg-slate-950 border border-slate-800" />
                </div>
                <div>
                  <div className="text-[11px] text-slate-500 uppercase tracking-[0.2em] mb-1">
                    Spectrum
                  </div>
                  <canvas ref={spectrumCanvasRef} width={320} height={150} className="w-full rounded-lg bg-slate-950 border border-slate-800" />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 space-y-3 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
                  Export / Share
                </div>
                <div className="text-sm text-slate-100">Copy current scene + event map</div>
              </div>
              <button
                onClick={exportPreset}
                className="px-3 py-1.5 rounded-lg bg-cyan-500 text-black text-xs font-semibold shadow-[0_8px_22px_rgba(6,182,212,0.35)]"
              >
                Copy Snippet
              </button>
            </div>
            <pre className="whitespace-pre-wrap text-[11px] bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 overflow-x-auto">
              {exportText || 'Click "Copy Snippet" to generate AUDIO_LAB_PRESET.'}
            </pre>
          </div>
        </div>

        <div className="absolute top-3 left-4 bg-black/60 border border-slate-800 px-3 py-1.5 rounded text-[11px] text-slate-300">
          Dev Tool: AudioLab — use ?devTool=audio
        </div>
      </div>

      <div className="p-6 border-l border-slate-900 bg-slate-900/70 space-y-4 overflow-y-auto">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 space-y-3">
          <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Orb States</div>
          <p className="text-sm text-slate-200">
            Map sonic moods to orb visuals. Use presets to line up with the existing shader themes,
            then tweak envelopes and effects with the knobs on the left.
          </p>
          <ul className="text-sm text-slate-300 space-y-1">
            <li>- Calm: pad bed with shimmer (idle loop)</li>
            <li>- Charging: arps that tighten as charge rises</li>
            <li>- Super-critical: gritty pulses + noise</li>
            <li>- Womp: bass drop for quick-release moment</li>
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 space-y-3">
          <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Scrap Run Hooks</div>
          <p className="text-sm text-slate-200">
            These one-shots match the plan: gentle ding for good scrap, soft stab for debris hits,
            shield whoosh, and a descending game-over cue. Swap notes quickly in code via the
            exported snippet.
          </p>
          <p className="text-sm text-slate-400">
            Recommended: route the snippet into a `useAudioBus` helper that wires events to the
            runner loop.
          </p>
        </div>
      </div>
    </div>
  );
}

function ColorSwatch({ color }: { color: string }) {
  return (
    <span
      className="w-4 h-4 rounded-full border border-white/20"
      style={{ background: color }}
      title={color}
    />
  );
}




