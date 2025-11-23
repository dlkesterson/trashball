import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SCRAP_UPGRADES, ScrapUpgradeId, getUpgradeCost } from './ScrapUnlocks';

export type PhysicsParams = {
  gravity: number;
  thrustForce: number;
  terminalVelocity: number;
  chargeDamping: number;
};

type GameValues = {
  energy: number;
  totalEnergy: number;
  charge: number;
  scrap: number;
  totalScrap: number;
  lastRunTime: number;
  bestRunScore: number;
  scrapRunActive: boolean;
  prestigeLevel: number;
  cosmicEssence: number;
  physics: PhysicsParams;
  upgrades: Record<ScrapUpgradeId, number>;
};

export type GameStore = GameValues & {
  addEnergy: (n: number) => void;
  setCharge: (n: number) => void;
  addScrap: (n: number) => void;
  startScrapRun: () => void;
  endScrapRun: (score: number, collected: number) => void;
  purchaseUpgrade: (id: ScrapUpgradeId) => void;
  prestige: () => void;
  devSetState?: (partial: Partial<GameValues>) => void;
  devReset?: () => void;
  devAdjustUpgrade?: (id: ScrapUpgradeId, delta: number) => void;
};

const initialPhysics: PhysicsParams = {
  gravity: 0.5,
  thrustForce: 1.2,
  terminalVelocity: 5,
  chargeDamping: 0.95,
};

const calculateEssence = (totalEnergy: number) => Math.floor(Math.sqrt(totalEnergy / 10000));

const buildInitialState = (): GameValues => ({
  energy: 0,
  totalEnergy: 0,
  charge: 0,
  scrap: 0,
  totalScrap: 0,
  lastRunTime: 0,
  bestRunScore: 0,
  scrapRunActive: false,
  prestigeLevel: 0,
  cosmicEssence: 0,
  physics: { ...initialPhysics },
  upgrades: {} as Record<ScrapUpgradeId, number>,
});

export const useGameStore = create<GameStore>()(
  persist(
    (set) => ({
      ...buildInitialState(),

      addEnergy: (n) =>
        set((state) => {
          const nextEnergy = Math.max(0, state.energy + n);
          const gained = n > 0 ? n : 0;
          return {
            energy: nextEnergy,
            totalEnergy: state.totalEnergy + gained,
          };
        }),

      setCharge: (n) => set({ charge: Math.max(0, Math.min(1, n)) }),

      addScrap: (n) =>
        set((state) => ({
          scrap: state.scrap + n,
          totalScrap: state.totalScrap + n,
        })),

      startScrapRun: () => set({ scrapRunActive: true, lastRunTime: Date.now() }),

      endScrapRun: (score, collected) =>
        set((state) => {
          const baseScrap = Math.floor(score / 10);
          const chargeBonus = state.charge > 0.9 ? 1.5 : 1;
          const prestigeBonus = 1 + state.prestigeLevel * 0.1;
          const scrapEarned = Math.floor((baseScrap + collected) * chargeBonus * prestigeBonus);

          return {
            scrap: state.scrap + scrapEarned,
            totalScrap: state.totalScrap + scrapEarned,
            bestRunScore: Math.max(state.bestRunScore, score),
            scrapRunActive: false,
            charge: 0,
          };
        }),

      purchaseUpgrade: (id) =>
        set((state) => {
          const currentLevel = state.upgrades[id] ?? 0;
          const upgrade = SCRAP_UPGRADES[id];
          if (currentLevel >= upgrade.max) return state;

          const cost = getUpgradeCost(id, currentLevel);
          if (state.scrap < cost) return state;

          return {
            scrap: state.scrap - cost,
            upgrades: { ...state.upgrades, [id]: currentLevel + 1 },
          };
        }),

      prestige: () =>
        set((state) => ({
          energy: 0,
          scrap: 0,
          upgrades: {} as Record<ScrapUpgradeId, number>,
          prestigeLevel: state.prestigeLevel + 1,
          cosmicEssence: state.cosmicEssence + calculateEssence(state.totalEnergy),
        })),
      devSetState: __DEV_TOOLS__
        ? (partial) =>
            set((state) => {
              const next: Partial<GameStore> = {};

              if (partial.physics) {
                next.physics = { ...state.physics, ...partial.physics };
              }
              if (partial.upgrades) {
                next.upgrades = { ...state.upgrades, ...partial.upgrades };
              }

              const { physics, upgrades, ...rest } = partial;
              return { ...rest, ...next };
            })
        : undefined,
      devReset: __DEV_TOOLS__
        ? () =>
            set(() => ({
              ...buildInitialState(),
            }))
        : undefined,
      devAdjustUpgrade: __DEV_TOOLS__
        ? (id, delta) =>
            set((state) => {
              const current = state.upgrades[id] ?? 0;
              const upgrade = SCRAP_UPGRADES[id];
              const nextLevel = Math.max(0, Math.min(upgrade.max, current + delta));
              if (nextLevel === current) return state;
              return { upgrades: { ...state.upgrades, [id]: nextLevel } };
            })
        : undefined,
    }),
    { name: 'orb-ascent-save' }
  )
);
