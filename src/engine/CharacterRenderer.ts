import * as PIXI from 'pixi.js'

// ─── JSON types ───────────────────────────────────────────────────────────────
interface FrameRect { x: number; y: number; w: number; h: number }
interface CharEntry { frames: { idle: FrameRect } & Record<string, FrameRect> }
interface CharsEngineAtlas { characters: Record<string, CharEntry> }

const PLAYER_SCALE = 0.5

// ─── CharacterRenderer ────────────────────────────────────────────────────────
// Draws characters from chars-engine-atlas.png using frame coords from the JSON.
// Manages one PIXI.Sprite per characterId; adds it to the container on first call,
// then only updates position on subsequent calls.
export class CharacterRenderer {
  private readonly texture: PIXI.Texture
  private readonly atlas: CharsEngineAtlas
  private readonly sprites = new Map<string, PIXI.Sprite>()

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

  render(
    container: PIXI.Container,
    characterId: string,
    _animation: string,
    _direction: string,
    _frameIndex: number,
    worldX: number,
    worldY: number,
  ): void {
    let spr = this.sprites.get(characterId)
    if (!spr) {
      const char = this.atlas.characters[characterId]
      if (!char) throw new Error(`CharacterRenderer: unknown id "${characterId}"`)
      const f = char.frames.idle
      spr = new PIXI.Sprite(new PIXI.Texture({
        source: this.texture.source,
        frame:  new PIXI.Rectangle(f.x, f.y, f.w, f.h),
      }))
      spr.anchor.set(0.5, 1)
      spr.scale.set(PLAYER_SCALE)
      this.sprites.set(characterId, spr)
    }
    if (!spr.parent) container.addChild(spr)
    spr.x = worldX
    spr.y = worldY
  }
}
