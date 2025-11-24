import * as Tone from 'tone';
import {
  DEFAULT_CONTROLS,
  EVENT_LABELS,
  ORB_AUDIO_PRESETS,
  type AudioEventId,
  type ControlState,
  type OrbAudioPreset,
  type OrbAudioId,
} from './presets';

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

class AudioBus {
  private started = false;
  private canStart = false;
  private currentState: OrbAudioId = 'calm';
  private controls: ControlState = { ...DEFAULT_CONTROLS };
  private orbLoop: Tone.Loop;

  private vibrato = new Tone.Vibrato(5, this.controls.vibrato);
  private filter = new Tone.Filter(this.controls.filterHz, 'lowpass', -24);
  private delay = new Tone.FeedbackDelay(this.controls.delayTime, this.controls.delayFeedback);
  private reverb = new Tone.Reverb({ decay: 4, wet: this.controls.reverb });
  private volume = new Tone.Volume(this.controls.volume);
  private wompGain = new Tone.Gain(0);
  private wompActive = false;

  private pad = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'fatsawtooth' },
    envelope: {
      attack: this.controls.attack,
      decay: 0.2,
      sustain: 0.5,
      release: this.controls.release,
    },
    detune: this.controls.grit * 20,
  });

  private bass = new Tone.MonoSynth({
    oscillator: { type: 'sine' },
    envelope: {
      attack: clamp(this.controls.attack * 0.5, 0.005, 0.4),
      decay: 0.1,
      sustain: 0.25,
      release: clamp(this.controls.release * 0.6, 0.1, 1.2),
    },
    filter: {
      Q: this.controls.resonance,
      frequency: this.controls.filterHz * 0.8,
    },
    portamento: this.controls.glide,
  });

  private wompBed = new Tone.MonoSynth({
    oscillator: { type: 'sine' },
    envelope: {
      attack: 0.6,
      decay: 0.4,
      sustain: 0.7,
      release: 1.2,
    },
    filter: {
      Q: 0.6,
      frequency: 360,
    },
    portamento: 0.05,
  });

  private noise = new Tone.NoiseSynth({
    noise: { type: 'brown' },
    envelope: {
      attack: 0.01,
      decay: 0.2,
      sustain: 0,
      release: 0.08,
    },
  });

  constructor() {
    this.pad.chain(this.vibrato, this.filter, this.delay, this.reverb, this.volume);
    this.bass.chain(this.filter, this.delay, this.reverb, this.volume);
    this.wompBed.chain(this.wompGain, this.filter, this.delay, this.reverb, this.volume);
    this.noise.chain(this.filter, this.delay, this.reverb, this.volume);
    this.volume.toDestination();

    this.orbLoop = new Tone.Loop((time) => {
      if (this.orbLoop.mute) return;
      const preset = this.getPreset(this.currentState);
      const notes = preset?.notes ?? [];
      if (notes.length === 0) return;
      notes.forEach((note, idx) => {
        this.pad.triggerAttackRelease(note, '2n', time + idx * 0.08, 0.55);
      });
      if (this.currentState !== 'calm') {
        this.bass.triggerAttackRelease(notes[0], '1n', time + 0.05, 0.5);
      }
      if (this.currentState === 'superCritical') {
        this.noise.volume.value = (preset?.controls.grit ?? 0.2) * 12 - 12;
        this.noise.triggerAttackRelease('16n', time + 0.12);
      }
    }, 1.2);
    this.orbLoop.mute = true;
  }

  private getPreset(id: OrbAudioId) {
    return ORB_AUDIO_PRESETS.find((p) => p.id === id);
  }

  private applyPreset(preset: OrbAudioPreset | undefined) {
    if (!preset) return;
    this.controls = { ...DEFAULT_CONTROLS, ...preset.controls };

    this.pad.set({
      envelope: {
        attack: this.controls.attack,
        decay: 0.2,
        sustain: 0.5,
        release: this.controls.release,
      },
      detune: this.controls.grit * 40,
    });
    this.bass.set({
      envelope: {
        attack: clamp(this.controls.attack * 0.5, 0.005, 0.4),
        decay: 0.1,
        sustain: 0.25,
        release: clamp(this.controls.release * 0.6, 0.1, 1.2),
      },
      portamento: this.controls.glide,
      filter: {
        frequency: this.controls.filterHz * 0.8,
        Q: this.controls.resonance,
      },
    });

    this.filter.frequency.rampTo(this.controls.filterHz, 0.2);
    this.filter.Q.rampTo(this.controls.resonance, 0.15);
    this.vibrato.depth.rampTo(this.controls.vibrato, 0.2);
    this.vibrato.frequency.rampTo(4 + this.controls.vibrato * 6, 0.2);
    this.delay.delayTime.rampTo(this.controls.delayTime, 0.2);
    this.delay.feedback.rampTo(this.controls.delayFeedback, 0.2);
    this.reverb.wet.rampTo(this.controls.reverb, 0.2);
    this.volume.volume.rampTo(this.controls.volume, 0.1);
  }

  private loopIntervalFor(state: OrbAudioId) {
    if (state === 'superCritical') return 0.7;
    if (state === 'charging') return 1;
    return 1.6;
  }

  private canHandleAudio() {
    return this.started || this.canStart;
  }

  private async ensureStarted() {
    if (this.started || !this.canStart) return;
    try {
      await Tone.start();
      if (Tone.Transport.state !== 'started') {
        await Tone.Transport.start();
      }
      this.orbLoop.start(0);
      this.started = true;
    } catch (err) {
      // Browsers block audio until a user gesture; allow retry after resume().
    }
  }

  async setOrbState(state: OrbAudioId) {
    const stateChanged = this.currentState !== state;
    if (!stateChanged && this.started) return;
    await this.ensureStarted();
    this.currentState = state;
    const preset = this.getPreset(state);
    this.applyPreset(preset);
    this.orbLoop.interval = this.loopIntervalFor(state);
    if (state === 'calm') {
      this.orbLoop.mute = true;
      this.setWompBedActive(false);
      return;
    }
    this.orbLoop.mute = false;
    this.triggerChord(preset);
    if (state === 'charging' && stateChanged) {
      void this.playReleaseWomp(0.65, { layerWithCurrent: true });
      this.setWompBedActive(true);
    } else if (state !== 'charging') {
      this.setWompBedActive(false);
    }
  }

  async resume() {
    this.canStart = true;
    await this.ensureStarted();
  }

  async playReleaseWomp(intensity = 0.5, opts?: { layerWithCurrent?: boolean }) {
    if (!this.canHandleAudio()) return;
    await this.ensureStarted();
    const preset = this.getPreset('womp');
    const activePreset = this.getPreset(this.currentState);
    const now = Tone.now();
    const velocity = clamp(0.4 + intensity * 0.6, 0.4, 1);
    const note = preset?.notes[0] ?? 'C2';
    this.applyPreset(preset);
    this.bass.triggerAttackRelease(note, '1n', now, velocity);
    this.pad.triggerAttackRelease('C3', '8n', now, velocity * 0.5);
    this.noise.triggerAttackRelease('16n', now + 0.05, 0.2);
    if (opts?.layerWithCurrent && activePreset) {
      setTimeout(() => {
        if (this.getPreset(this.currentState)?.id === activePreset.id) {
          this.applyPreset(activePreset);
        }
      }, 120);
    }
  }

  async playEvent(id: AudioEventId) {
    if (!this.canHandleAudio()) return;
    await this.ensureStarted();
    const now = Tone.now();
    if (id === 'goodScrap') {
      this.pad.triggerAttackRelease(['C5', 'E5'], '16n', now, 0.5);
      this.pad.triggerAttackRelease('G5', '16n', now + 0.12, 0.35);
    } else if (id === 'badDebris') {
      this.noise.triggerAttackRelease('16n', now, 0.3);
      this.bass.triggerAttackRelease('F2', '8n', now, 0.4);
    } else if (id === 'shield') {
      this.noise.triggerAttackRelease('8n', now, 0.35);
      this.pad.triggerAttackRelease('C4', '8n', now, 0.35);
      this.pad.triggerAttackRelease('G4', '8n', now + 0.1, 0.25);
    } else if (id === 'gameOver') {
      const notes = ['E4', 'C4', 'G3', 'E3'];
      notes.forEach((note, idx) => {
        this.pad.triggerAttackRelease(note, '8n', now + idx * 0.2, 0.55 - idx * 0.08);
      });
      this.bass.triggerAttackRelease('C2', '2n', now + 0.05, 0.5);
    } else if (id === 'womp') {
      this.playReleaseWomp(0.7);
    }
  }

  private triggerChord(preset?: (typeof ORB_AUDIO_PRESETS)[number]) {
    const p = preset ?? this.getPreset(this.currentState);
    if (!p || p.notes.length === 0) return;
    const now = Tone.now();
    p.notes.forEach((note, idx) => {
      this.pad.triggerAttackRelease(note, '1n', now + idx * 0.08, 0.6);
    });
  }

  private setWompBedActive(active: boolean) {
    const ramp = active ? 0.6 : 0.85;
    const target = active ? 0.8 : 0;
    if (active) {
      if (this.wompActive) {
        this.wompGain.gain.rampTo(target, ramp);
        return;
      }
      const preset = this.getPreset('womp');
      const note = preset?.notes[0] ?? 'C2';
      this.wompBed.triggerAttack(note, undefined, 0.8);
      this.wompActive = true;
      this.wompGain.gain.rampTo(target, ramp);
    } else {
      if (!this.wompActive) return;
      this.wompGain.gain.rampTo(target, ramp);
      setTimeout(() => {
        this.wompBed.triggerRelease();
        this.wompActive = false;
      }, ramp * 1000 + 50);
    }
  }
}

const audioBus = new AudioBus();
export { audioBus, EVENT_LABELS };
