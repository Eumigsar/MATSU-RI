import * as PIXI from 'pixi.js'
import type { FrameRect, AnimDef, AnimationSet, Direction } from './types'

// ─── JSON types ────────────────────────────────────────────────────────────────
interface CharEntry {
  animations: AnimationSet
  frames:     { idle: FrameRect }   // legacy field — fallback only
}
interface CharsEngineAtlas {
  version:    number
  characters: Record<string, CharEntry>
}

const PLAYER_SCALE = 0.5

// ─── CharacterRenderer ────────────────────────────────────────────────────────
// Renders characters from chars-engine-atlas.png.
// Frame coordinates come exclusively from chars-engine-atlas.json — never
// hardcoded in this file.
//
// One PIXI.Sprite is created per (characterId). Its texture is swapped each
// render() call to reflect the current animation frame. Textures are cached by
// "characterId:animation:direction:frameIndex" so each unique frame is only
// allocated once.
export class CharacterRenderer {
  private readonly texture: PIXI.Texture
  private readonly atlas:   CharsEngineAtlas
  private readonly sprites  = new Map<string, PIXI.Sprite>()
  private readonly texCache = new Map<string, PIXI.Texture>()

  private constructor(texture: PIXI.Texture, atlas: CharsEngineAtlas) {
    this.texture = texture
    this.atlas   = atlas
  }

  static load(): Promise<CharacterRenderer> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onerror = reject
      img.onload = () => {
        const cv = document.createElement('canvas')
        cv.width = img.width; cv.height = img.height
        cv.getContext('2d')!.drawImage(img, 0, 0)
        const texture = PIXI.Texture.from(cv)
        fetch('/assets/characters/chars-engine-atlas.json')
          .then(r => r.json())
          .then((atlas: CharsEngineAtlas) => resolve(new CharacterRenderer(texture, atlas)))
          .catch(reject)
      }
      img.src = '/assets/characters/chars-engine-atlas.png'
    })
  }

  // Returns the AnimationSet for a character — pass to AnimationController.
  getAnimations(characterId: string): AnimationSet {
    const char = this.atlas.characters[characterId]
    if (!char) throw new Error(`CharacterRenderer: unknown id "${characterId}"`)
    if (char.animations) return char.animations

    // Backward-compat: build a minimal set from the legacy frames.idle field.
    const idle = char.frames?.idle
    if (!idle) throw new Error(`CharacterRenderer: no animations or frames for "${characterId}"`)
    const stub: AnimDef = { frames: [idle], fps: 1, loop: true, next: null }
    return { idle: stub, walk: stub, run: stub, attack: { ...stub, loop: false, next: 'idle' },
             interact: { ...stub, loop: false, next: 'idle' }, sit: stub }
  }

  // Render a character at world coordinates.
  // animation, direction, frameIndex come from AnimationController — never hardcoded.
  render(
    container: PIXI.Container,
    characterId: string,
    animation:   string,
    direction:   Direction,
    frameIndex:  number,
    worldX:      number,
    worldY:      number,
  ): void {
    const tex = this._resolveTexture(characterId, animation, direction, frameIndex)

    let spr = this.sprites.get(characterId)
    if (!spr) {
      spr = new PIXI.Sprite(tex)
      spr.anchor.set(0.5, 1)
      spr.scale.set(PLAYER_SCALE)
      this.sprites.set(characterId, spr)
    } else if (spr.texture !== tex) {
      spr.texture = tex   // swap only when the frame actually changed
    }

    if (!spr.parent) container.addChild(spr)
    spr.x = worldX
    spr.y = worldY
  }

  // ── Internal ────────────────────────────────────────────────────────────────

  private _resolveTexture(
    characterId: string,
    animation:   string,
    direction:   Direction,
    frameIndex:  number,
  ): PIXI.Texture {
    const cacheKey = `${characterId}:${animation}:${direction}:${frameIndex}`
    let tex = this.texCache.get(cacheKey)
    if (tex) return tex

    const f = this._resolveFrame(characterId, animation, direction, frameIndex)
    tex = new PIXI.Texture({
      source: this.texture.source,
      frame:  new PIXI.Rectangle(f.x, f.y, f.w, f.h),
    })
    this.texCache.set(cacheKey, tex)
    return tex
  }

  private _resolveFrame(
    characterId: string,
    animation:   string,
    direction:   Direction,
    frameIndex:  number,
  ): FrameRect {
    const char = this.atlas.characters[characterId]
    if (!char) throw new Error(`CharacterRenderer: unknown id "${characterId}"`)

    // Prefer the requested animation; fall back to idle.
    const animDef: AnimDef | undefined = char.animations?.[animation] ?? char.animations?.['idle']
    if (!animDef) return char.frames.idle   // ultimate fallback

    // Per-direction frames override the default frames when present.
    const frames = animDef.directions?.[direction] ?? animDef.frames
    return frames[frameIndex] ?? frames[0]
  }
}
