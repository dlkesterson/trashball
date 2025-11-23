
## 0. Global Dev Tooling Scaffold

Right now you’ve got a single `App` that conditionally shows OrbScene vs ScrapRunOverlay/MainMenu/UpgradePanel. 

### 0.1 Add a “dev mode” switch

**Goal:** Have a clean way to render dev tools without messing with the main loop.

**Plan:**

* Add an env flag in Vite:

```ts
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  define: {
    __DEV_TOOLS__: JSON.stringify(true), // toggle as needed
  },
});
```

* In `App.tsx`, detect a dev mode selector:

  * e.g., `?devTool=shader`, `?devTool=debris`, etc.
  * Fallback to the normal game if no devTool param.

```ts
// src/App.tsx
import ShaderLab from './devtools/ShaderLab';
import DebrisLab from './devtools/DebrisLab';
// ... etc

function getDevToolFromLocation() {
  const params = new URLSearchParams(window.location.search);
  return params.get('devTool');
}

export default function App() {
  const devTool = __DEV_TOOLS__ ? getDevToolFromLocation() : null;
  // existing stuff...
  if (devTool === 'shader') return <ShaderLab />;
  if (devTool === 'debris') return <DebrisLab />;
  // ... other tools

  // existing game UI
}
```

* Create a folder: `src/devtools/` for all 6 tools.

---

## 1. Shader Playground (ShaderLab)

**Goal:** Rapidly iterate on the orb’s shader + postprocessing without touching the main scene.

### 1.1 Surface / UI

* New component: `src/devtools/ShaderLab.tsx`

  * Left: orb viewport (reusing core `OrbScene` logic or a lighter variant).
  * Right: a control panel with sliders/inputs.

Controls to expose:

* Color 1 & 2 (hex or RGB)
* Charge level (0–1)
* Wobble intensity multiplier
* Pattern scale
* Fresnel intensity
* Particle count
* Bloom strength threshold

### 1.2 Implementation

* Extract shader uniforms & material setup from `OrbScene.tsx` into a shared helper:

```ts
// src/orb/orbMaterial.ts
export function createOrbMaterial(initial?: Partial<UniformValues>): THREE.ShaderMaterial { ... }
```

* ShaderLab:

  * Creates scene, camera, renderer similar to `OrbScene`, but:

    * No energy side-effects (no `useGameStore.addEnergy`).
    * Charge driven purely by UI slider.
  * UI panel: just plain React controls bound to `useState`.
  * On change, update uniforms (e.g., `material.uniforms.chargeLevel.value = charge`).

### 1.3 Nice-to-haves

* Preset dropdown:

  * “Calm Idle”
  * “Overcharged”
  * “Critical Surge”
* Export button that prints current uniform presets as JSON in console (for later hardcoding or saving).

---

## 2. ScrapRun Debris Sandbox (DebrisLab)

**Goal:** Tune debris movement, spawn timing, curvature, and hitboxes without playing full runs.

### 2.1 Surface / UI

* New component: `src/devtools/DebrisLab.tsx`
* Layout:

  * Top: view of a simplified `ScrapRunScene` (player + debris, no HUD/overlays).
  * Bottom/right: controls for the key config values.

Config inputs to expose (derived from `BASE_GAME_CONFIG`): 

* spawnInterval
* spawnDistance / despawnDistance
* debrisSpeed
* curvatureStrength
* strafeSpeed / maxStrafe
* good vs bad ratio

### 2.2 Implementation Steps

1. **Extract config:**

   * Move `BASE_GAME_CONFIG` into `src/scraprun/config.ts`.
   * Export a type `ScrapRunConfig`.
2. **Refactor ScrapRunScene** to accept a `config: ScrapRunConfig` prop with default.
3. **Build DebrisLab** that:

   * Uses internal state for `config`.
   * Passes `config` into a stripped-down `ScrapRunScene` variant or a new `ScrapRunDebugScene` that:

     * Skips text overlays and HUD overlays for clarity.
     * Always runs (no game over).
4. Add toggles:

   * “Show Curvature Debug” → draws debug lines for debris paths.
   * “Show Hitboxes” → draws spheres around player/debris.

### 2.3 Stretch

* Add a “freeze time” checkbox:

  * Pause animation loop but allow scrubbing along a “progress” slider.

---

## 3. Upgrade Scaling Simulator (UpgradeSim)

**Goal:** Understand and tune cost and effect curves for each upgrade.

### 3.1 Surface / UI

* New component: `src/devtools/UpgradeSim.tsx`
* Layout:

  * Dropdown to select upgrade (`resonanceTuner`, `criticalSurge`, etc.).
  * Sliders for:

    * Base cost multiplier override (optional)
    * Effect multiplier (e.g., % per level)
  * Table: Level / Cost / Effect summary.
  * Simple line charts (level → cost, level → effect).

### 3.2 Implementation Steps

1. Import `SCRAP_UPGRADE_CATEGORIES`, `getUpgradeCost` from `core/ScrapUnlocks`. 
2. For selected upgrade:

   * Generate an array of levels `[0..max]`.
   * Calculate:

     * cost at each level via `getUpgradeCost`.
     * effect (e.g., for `resonanceTuner`: `1 + 0.15 * level`).
3. Build small visualizations:

   * Could just be `<div>` bars with `% width` if you don’t want a chart library.
4. Add computed “total scrap spent to max” and “effect at max” indicators.

### 3.3 Future extension

* Add side-panel to show “Estimated impact on energy/sec” using the orb tick formula, assuming:

  * fixed charge level
  * fixed time window

---

## 4. Prestige Economy Simulator (PrestigeSim)

**Goal:** See the long-term pacing: energy → prestige → essence → power.

### 4.1 Surface / UI

* New component: `src/devtools/PrestigeSim.tsx`
* Inputs:

  * energy per second (base)
  * resonanceTuner level
  * criticalSurge level
  * prestigeLevel
  * playtime horizon (e.g., minutes or hours)
* Output:

  * Time to first prestige (reach 10k energy).
  * Total energy at horizon.
  * Essence earned using your `calculateEssence` function. 

### 4.2 Implementation Steps

1. Extract `calculateEssence` from `GameState.ts` into a utility file (e.g., `core/progression.ts`). 
2. Implement a pure simulation function:

```ts
type PrestigeSimInput = { /* fields */ };
type PrestigeSimResult = { /* metrics */ };

export function simulatePrestige(input: PrestigeSimInput): PrestigeSimResult {
  // approximate tick-based sim or closed-form approximation
}
```

3. UI:

   * On any change, recompute and display:

     * `tTo10kEnergy`
     * projected `totalEnergy` after horizon
     * `essenceGained` after prestige
4. Show small “phase labels”:

   * early → mid → late game thresholds

---

## 5. Orb Physics Debugger (OrbDebug)

**Goal:** Make the orb’s physics and energy generation transparent.

### 5.1 Surface / UI

* New component: `src/devtools/OrbDebug.tsx`
* Layout:

  * Main: OrbScene (the real one or a debug clone).
  * Side: live readout of:

    * velocity
    * charge
    * energy/sec (smoothed)
    * surge events (last X spikes)
    * applied damping factor
    * effective thrust/gravity

### 5.2 Implementation Steps

1. In `OrbScene.tsx`, expose internal state via a callback or a simple event bus:

   * Props: `onDebugTick?: (debugState: DebugOrbState) => void;`
   * `DebugOrbState` includes:

     * velocity
     * charge
     * deltaTime
     * energyGainedThisFrame
     * surgeTriggered
2. OrbDebug component:

   * Uses a `useState` to keep a sliding window of debug states.
   * Calculations:

     * last N seconds energy/sec = sum(energy)/sum(time).
     * count and mark surge events.
3. Add dev toggles:

   * “Disable energy mutations” (so you can debug physics without altering save).
   * “Force holding” vs “manual hold from input”.

---

## 6. Game State Inspector (Zustand Panel)

**Goal:** Mutate and inspect `GameState` in a single screen without clicking through gameplay.

### 6.1 Surface / UI

* New component: `src/devtools/GameStateInspector.tsx`
* Layout:

  * Left: a condensed version of OrbScene/summary panels.
  * Right: controls for:

    * energy & scrap (numeric input + buttons: +100, +1k, etc.)
    * upgrades (level up/down per upgrade)
    * prestigeLevel & cosmicEssence
    * lastRunTime / cooldown (buttons: “reset cooldown”, “simulate recent run”)
    * toggles: `scrapRunActive`

### 6.2 Implementation Steps

1. Hook into Zustand with `useGameStore` like in `MainMenu` / `UpgradePanel`. 
2. Add some “dev-only” actions to the store (inside `GameState.ts`), gated by a simple conditional:

```ts
devSetState?: (partial: Partial<GameStore>) => void;
devReset?: () => void;
```

3. In `GameStateInspector`, wire:

   * Buttons for “Grant scrap”, “Grant energy”.
   * Dropdown of upgrades with + and –.
   * “Max all upgrades” and “Reset save” buttons.
4. Display:

   * Derived numbers like “charge %”, “cooldown remaining” using same logic as `MainMenu`.

---

## 7. Recommended Build Order & Dependencies

Here’s the order I’d tackle them in, based on leverage:

1. **Game State Inspector**

   * Gives you instant warp to any phase of progression.
   * Makes testing all other tools way nicer.
2. **Shader Playground**

   * Fast win and massively improves orb iteration (the core visual).
3. **Debris Sandbox**

   * Directly attacks the most complex gameplay piece (Scrap Run).
4. **Orb Physics Debugger**

   * Helps tune the idle/hold mechanic, surge feeling, and reward curve.
5. **Upgrade Scaling Simulator**

   * Now that you can jump around and visualize scaling, this lets you tune cost/effect.
6. **Prestige Economy Simulator**

   * Final layer: long-term pacing once early/mid game feel good.

---

