
## 🎯 Current Scrap Run Controls Analysis

Your current **Debris Harvest (Scrap Run)** controls, found in `src/scraprun/ScrapRunScene.tsx`, are:

1.  **Hold/Release (Vertical/Orbit):**
      * `Hold`: Moves the Trashball to the **Outer Orbit** (`effectiveConfig.outerOrbit`).
      * `Release`: Moves the Trashball to the **Inner Orbit** (`effectiveConfig.innerOrbit`).
2.  **Drag/Swipe (Horizontal/Strafe):**
      * `TouchStart`/`MouseDown`: Sets `isHolding = true` and captures `touchStart`/`currentTouchX`.
      * `TouchMove`/`MouseMove`: Updates `currentTouchX` to allow for horizontal **Strafe** movement.

**Key Insight:** You are currently using **Hold** for *two simultaneous actions*:

1.  **Vertical Movement** (Outer Orbit)
2.  **Enabling/Tracking Horizontal Strafe** (Drag/Swipe)

This is already good, but we can make it more interactive and less restrictive by using the **entire Thumb Zone** for all inputs and separating the primary actions.

-----

## 🚀 Optimization for "Subway Thumb"

The primary goal is to maximize the entire screen as an interactive input surface and differentiate between the two core actions: **Orbit Change** and **Strafe/Steering**.

### 1\. Refined Input Mapping

| Action | Recommended Single-Thumb Gesture | Implementation Rationale |
| :--- | :--- | :--- |
| **Orbit Change** (Inner/Outer) | **Tapping/Holding** in the **Primary Action Zone** (e.g., the bottom 70% of the screen). | Keep the existing hold-to-boost/release-to-fall mechanic, but make the input area massive and forgiving. Your current implementation already uses `isHolding` for this, which is great. |
| **Strafe/Steering** (Horizontal) | **Dragging/Swiping Left/Right** *anywhere* on the screen. | **Crucially, the drag must work independently of the orbit hold.** The horizontal position of the thumb relative to the screen center should *always* control strafing when the thumb is down, regardless of how long it has been held. |

### 2\. Implementation Adjustments in `ScrapRunScene.tsx`

The core logic is already in place. The main change is ensuring the hold state (`isHolding`) isn't solely what enables position tracking, and also using the drag *speed* for an added layer.

  * **Current Strafe Logic (Good):**

    ```typescript
    // Inside stateInterval:
    if (currentTouchPos !== null && containerWidth > 0) {
        const normalizedX = (currentTouchPos - containerWidth / 2) / (containerWidth / 2);
        currentStrafeTarget = normalizedX * effectiveConfig.maxStrafe;
    } else {
        currentStrafeTarget = 0;
    }
    ```

    This means as long as the screen is touched (`currentTouchPos !== null`), the horizontal position steers the ball. **This is perfect for the Thumb Zone.** The player can steer anywhere on the screen.

  * **Orbit Logic (Also Good):**

    ```typescript
    // Inside stateInterval:
    currentOrbitTarget = currentIsHolding ? effectiveConfig.outerOrbit : effectiveConfig.innerOrbit;
    ```

    `currentIsHolding` is set on `TouchStart/MouseDown` and cleared on `TouchEnd/MouseUp/MouseLeave`. **This means the Hold-to-Boost and Drag-to-Steer happen simultaneously, which is the desired outcome.**

-----

## 🌟 Suggestions for Enhanced Interactivity

Your current system is fundamentally sound for one-thumb play\! To push the interactivity even further:

### 1\. Differentiate by Tap Timing (If needed)

If you need a **third, separate action** (e.g., "Use Shield"), you can introduce a fast tap/release as distinct from a hold.

  * **Gesture:** **Quick Tap** (touch down and up in $<150ms$).
  * **Action:** Trigger `shieldGenerator` usage.
  * **Logic:** Requires adding a timer to `handleTouchStart` and `handleTouchEnd` to detect a "short press" vs. a "long press/hold." If a quick tap is detected, you would override the normal orbit change logic for that frame.

### 2\. Contextual Orbit-Change

Since the drag determines the horizontal position, the vertical orbit change could be **directional** based on the drag, not just a simple on/off hold.

  * **Current:** Hold $\rightarrow$ Outer Orbit.
  * **Alternative:**
      * **Drag Up:** Briefly sets the orbit target even further out (a "Super-Boost").
      * **Drag Down:** Briefly forces a faster descent to the Inner Orbit (a "Dodge-Pull").

This uses the *vector* of the swipe (up/down) to modify the magnitude of the orbit change, adding a layer of skill to the vertical axis.

### 3\. Use the Drag Distance/Speed as an Input Multiplier

Currently, your strafe target is purely based on the absolute `currentTouchX`. You could introduce a speed modifier based on the drag's velocity for more responsive control (utilizing the `effectiveConfig.strafeSpeed` for the lerp is already partway there).

  * **Adjustment:** When `currentTouchX` is updated, calculate the speed of the finger movement. Use this speed to *temporarily* increase the `maxStrafe` or `strafeSpeed` in the `lerp` function. A quick, aggressive drag feels more responsive than a slow drag.
