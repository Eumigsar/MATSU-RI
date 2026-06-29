import type { Direction, AnimationSet, FrameRect } from './types'

export type { Direction }

// ─── AnimationController ──────────────────────────────────────────────────────
// Pure state machine. No rendering.
//
// Animation definitions come entirely from chars-engine-atlas.json via
// CharacterRenderer.getAnimations(). The controller never hardcodes timing,
// frame counts, or transition targets.
//
// Usage:
//   const ctrl = new AnimationController(charRenderer.getAnimations('r0_c0'))
//   ctrl.setState('walk', 'right')   // request transition
//   ctrl.update(ticker.deltaTime)    // advance (deltaTime in PixiJS ticks, 1 = 1/60s)
//   const { animation, direction, frameIndex } = ctrl
//   charRenderer.render(layer, charId, animation, direction, frameIndex, x, y)
//
// Movement auto-switching (idle ↔ walk) is the caller's responsibility:
//   moving ? ctrl.setState('walk', dir) : ctrl.setState('idle')
// ─────────────────────────────────────────────────────────────────────────────

export class AnimationController {
  private readonly defs: AnimationSet

  private _animation: string    = 'idle'
  private _direction: Direction = 'down'
  private _frameIdx:  number    = 0
  private _elapsed:   number    = 0   // accumulated ticks since last frame advance

  constructor(defs: AnimationSet) {
    this.defs = defs
    this._animation = 'idle' in defs ? 'idle' : Object.keys(defs)[0] ?? 'idle'
  }

  // ── State transition ────────────────────────────────────────────────────────
  // No-ops if already in the requested animation (direction may still change).
  // Always resets to frame 0 when the animation itself changes.
  setState(anim: string, direction?: Direction): void {
    if (direction !== undefined) this._direction = direction
    if (anim === this._animation) return

    // Fall back to idle if the requested animation is not defined.
    const resolved = anim in this.defs ? anim : ('idle' in this.defs ? 'idle' : this._animation)
    this._animation = resolved
    this._frameIdx  = 0
    this._elapsed   = 0
  }

  // ── Frame advance ────────────────────────────────────────────────────────────
  // deltaTicks: PixiJS ticker.deltaTime  (1.0 = exactly one 60fps frame)
  update(deltaTicks: number): void {
    const def = this.defs[this._animation]
    if (!def || def.frames.length <= 1) return   // static or missing — no advance needed

    const ticksPerFrame = 60 / def.fps
    this._elapsed += deltaTicks

    while (this._elapsed >= ticksPerFrame) {
      this._elapsed -= ticksPerFrame
      this._frameIdx++

      if (this._frameIdx >= def.frames.length) {
        if (def.loop) {
          this._frameIdx = 0
        } else {
          this._frameIdx = def.frames.length - 1
          // Transition to the follow-up animation (e.g. attack → idle).
          if (def.next) this.setState(def.next)
          return   // setState already reset elapsed; don't keep looping
        }
      }
    }
  }

  // ── Read-only state ─────────────────────────────────────────────────────────
  get animation(): string    { return this._animation }
  get direction(): Direction { return this._direction }
  get frameIndex(): number   { return this._frameIdx  }

  // Resolved frame rect for the current state — useful for hitbox / collision.
  // CharacterRenderer also resolves this internally; callers don't need to call
  // this unless they need the rect for non-rendering purposes.
  get frame(): FrameRect {
    const def = this.defs[this._animation] ?? this.defs['idle']
    const frames = def.directions?.[this._direction] ?? def.frames
    return frames[this._frameIdx] ?? frames[0]
  }
}
