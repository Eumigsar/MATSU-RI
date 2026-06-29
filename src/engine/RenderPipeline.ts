import * as PIXI from 'pixi.js'
import { H, WW } from '../world/constants'
import type { LayerId } from './types'

// ─── Render Pipeline ──────────────────────────────────────────────────────────
// Creates and manages the 18 render layers in correct draw order.
//
// Layer stack (bottom → top):
//   Viewport-fixed (on app.stage, parallax x only):
//     01 sky          — sky gradient + clouds            (x-parallax 0.12×)
//     02 mountains    — mountain silhouettes + hills      (x-parallax 0.06×)
//
//   World-space (inside world container, scrolls with camera):
//     03 bgDecoration — background environment decor
//     04 ground       — terrain tiles (TilingSprite-based)
//     05 autotile     — autotile terrain transitions
//     06 roads        — paths, dirt roads, cobblestone
//     07 water        — ponds, rivers, waterfalls
//     08 overlays     — roof tiles, petal overlays, shadow decals
//     09 buildings    — building facades and structures
//     10 trees        — trees, bamboo, bonsai (Y-sorted)
//     11 props        — interactive + decorative props (Y-sorted)
//     12 interactive  — interactive objects, orbs, signs
//     13 npcs         — NPC sprites (Y-sorted)
//     14 player       — player sprite (Y-sorted)
//     15 particles    — leaves, smoke, weather FX
//     16 weather      — rain, snow, fog (reserved)
//     17 lighting     — dynamic lighting overlays (reserved)
//     18 ui           — in-world UI (damage numbers, speech) (reserved)
//
// Y-sort note: layers 09-14 are combined into a single ysortLay container
// that sorts all children by .y each frame for correct depth ordering.
// Internally they are logical categories, not separate containers.

export const PARALLAX_SKY = 0.12
export const PARALLAX_MTN = 0.06

export interface PipelineLayers {
  // Viewport-fixed (app.stage children)
  sky:      PIXI.Container
  mountains: PIXI.Container

  // World-space (world children)
  world:       PIXI.Container
  bgDecoration:PIXI.Container
  ground:      PIXI.Container
  autotile:    PIXI.Container
  roads:       PIXI.Container
  water:       PIXI.Container
  overlays:    PIXI.Container
  infra:       PIXI.Container  // walls, fences, bridges, signs (under ysort)
  ysort:       PIXI.Container  // Y-sorted: buildings + trees + props + npcs + player
  particles:   PIXI.Container
  // weather, lighting, ui containers reserved for future phases
}

export class RenderPipeline {
  readonly layers: PipelineLayers

  constructor(stage: PIXI.Container) {
    // Viewport-fixed background layers
    const sky       = new PIXI.Container()
    const mountains = new PIXI.Container()

    // Scrollable world container
    const world        = new PIXI.Container()
    const bgDecoration = new PIXI.Container()
    const ground       = new PIXI.Container()
    const autotile     = new PIXI.Container()
    const roads        = new PIXI.Container()
    const water        = new PIXI.Container()
    const overlays     = new PIXI.Container()
    const infra        = new PIXI.Container()
    const ysort        = new PIXI.Container()
    const particles    = new PIXI.Container()

    // Insert in draw order: sky first (behind everything), ui last (reserved)
    stage.addChild(sky, mountains, world)
    world.addChild(bgDecoration, ground, autotile, roads, water, overlays, infra, ysort, particles)

    this.layers = {
      sky, mountains,
      world, bgDecoration, ground, autotile, roads, water, overlays, infra, ysort, particles,
    }
  }

  // Call every frame from the game ticker.
  // camX/camY: smoothed camera position in world space.
  update(camX: number, camY: number): void {
    const { sky, mountains, world } = this.layers

    // Scroll world with camera
    world.x = -Math.round(camX)
    world.y = -Math.round(camY)

    // Viewport-fixed backgrounds move only horizontally at reduced rates
    sky.x       = -Math.round(camX * PARALLAX_SKY)
    mountains.x = -Math.round(camX * PARALLAX_MTN)

    // Y-sort: sort ysortLay children by foot Y each frame
    // Higher Y = lower on screen = renders in front
    this.layers.ysort.children.sort((a, b) => a.y - b.y)
  }

  // Get any layer by ID. Used by zone builders and special renderers.
  get(id: LayerId): PIXI.Container {
    const map: Record<LayerId, PIXI.Container> = {
      sky:           this.layers.sky,
      mountains:     this.layers.mountains,
      bgDecoration:  this.layers.bgDecoration,
      ground:        this.layers.ground,
      autotile:      this.layers.autotile,
      roads:         this.layers.roads,
      water:         this.layers.water,
      overlays:      this.layers.overlays,
      buildings:     this.layers.ysort,
      trees:         this.layers.ysort,
      props:         this.layers.ysort,
      interactive:   this.layers.ysort,
      npcs:          this.layers.ysort,
      player:        this.layers.ysort,
      particles:     this.layers.particles,
      weather:       this.layers.particles,
      lighting:      this.layers.particles,
      ui:            this.layers.particles,
    }
    return map[id]
  }

  // Convenience: build a sky background that fills the full viewport.
  // Called by world builder — keeps this module free of content knowledge.
  buildSkyRect(sw = WW + 400, sh = H): PIXI.Graphics {
    return new PIXI.Graphics()
      .rect(0, 0, sw, sh)
  }
}
