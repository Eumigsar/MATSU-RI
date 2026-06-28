// ─── InputState ───────────────────────────────────────────────────────────────
// Shared mutable state between MobileControls (writer) and GameScene ticker (reader).
// Plain object — no React, no observers. The ticker reads it once per frame.

/** Direction + intensity produced by the virtual joystick. Reset to zero on touch end. */
export const moveInput = {
  dx:        0 as number,   // -1.0 → +1.0  (left → right)
  dy:        0 as number,   // -1.0 → +1.0  (up   → down)
  magnitude: 0 as number,   //  0.0 → 1.0   (idle → full push)
}

/** Below this magnitude the joystick is treated as idle (thumb dead-zone). */
export const DEAD_ZONE = 0.06

/** Magnitude at or above which the player transitions to running. */
export const RUN_THRESHOLD = 0.80

/** Speed multiplier applied when running (magnitude ≥ RUN_THRESHOLD). */
export const RUN_SPEED_MULT = 1.7

// ─── Action event bus ─────────────────────────────────────────────────────────
// Action buttons fire named events. Game code registers handlers via InputEvents.on().

export type ActionId = 'attack' | 'interact'

const _handlers = new Map<ActionId, () => void>()

export const InputEvents = {
  on:   (id: ActionId, cb: () => void) => { _handlers.set(id, cb) },
  off:  (id: ActionId)                 => { _handlers.delete(id) },
  fire: (id: ActionId)                 => { _handlers.get(id)?.() },
}
