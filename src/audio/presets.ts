import { CALM_IDLE_PRESET, OVERCHARGED_PRESET, SUPER_CRITICAL_PRESET } from '../orb/orbPresets';

export type ControlState = {
  attack: number;
  release: number;
  filterHz: number;
  resonance: number;
  vibrato: number;
  delayTime: number;
  delayFeedback: number;
  reverb: number;
  grit: number;
  glide: number;
  volume: number;
};

export type OrbAudioId = 'calm' | 'charging' | 'superCritical' | 'womp';

export type OrbAudioPreset = {
  id: OrbAudioId;
  label: string;
  desc: string;
  notes: string[];
  visual: typeof CALM_IDLE_PRESET;
  controls: Partial<ControlState>;
};

export type AudioEventId = 'goodScrap' | 'badDebris' | 'shield' | 'gameOver' | 'womp';

export const DEFAULT_CONTROLS: ControlState = {
  attack: 0.45,
  release: 2.4,
  filterHz: 1000,
  resonance: 0.8,
  vibrato: 0.35,
  delayTime: 0.18,
  delayFeedback: 0.25,
  reverb: 0.38,
  grit: 0.12,
  glide: 0.04,
  volume: -12,
};

export const ORB_AUDIO_PRESETS: OrbAudioPreset[] = [
  {
    id: 'calm',
    label: 'Calm Idle',
    desc: 'Silent base layer (default idle).',
    notes: [],
    visual: CALM_IDLE_PRESET,
    controls: {
      attack: 0.01,
      release: 0.2,
      filterHz: 900,
      vibrato: 0,
      delayTime: 0.1,
      delayFeedback: 0,
      reverb: 0,
      grit: 0,
      glide: 0,
      volume: -60,
    },
  },
  {
    id: 'charging',
    label: 'Charging',
    desc: 'Soft pad + airy shimmer (former calm).',
    notes: ['C4', 'G4', 'D5'],
    visual: OVERCHARGED_PRESET,
    controls: {
      attack: 0.65,
      release: 3,
      filterHz: 900,
      vibrato: 0.25,
      delayTime: 0.26,
      delayFeedback: 0.2,
      reverb: 0.48,
      grit: 0.05,
      glide: 0,
      volume: -15,
    },
  },
  {
    id: 'superCritical',
    label: 'Super-Critical',
    desc: 'Distorted hiss + tight pulses to signal danger.',
    notes: ['C4', 'D#4', 'A#4'],
    visual: SUPER_CRITICAL_PRESET,
    controls: {
      attack: 0.08,
      release: 1,
      filterHz: 2100,
      vibrato: 0.18,
      delayTime: 0.09,
      delayFeedback: 0.45,
      reverb: 0.18,
      grit: 0.4,
      glide: 0.08,
      volume: -8,
    },
  },
  {
    id: 'womp',
    label: 'Release Womp',
    desc: 'Bass drop to mark a quick release/impact.',
    notes: ['C2'],
    visual: SUPER_CRITICAL_PRESET,
    controls: {
      attack: 0.02,
      release: 0.8,
      filterHz: 750,
      vibrato: 0,
      delayTime: 0.08,
      delayFeedback: 0.14,
      reverb: 0.2,
      grit: 0.18,
      glide: 0.22,
      volume: -10,
    },
  },
];

export const EVENT_LABELS: Record<AudioEventId, string> = {
  goodScrap: 'Good scrap pickup (pleasant ding)',
  badDebris: 'Bad debris hit (soft dissonance)',
  shield: 'Shield pulse (whoosh + tone)',
  gameOver: 'Game over (descending motif)',
  womp: 'Release bass drop',
};
