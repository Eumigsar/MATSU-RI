# MATSU-RI — Global Art Direction

> **Single source of truth** for every visual decision in the game.
> Any rendering that contradicts this document is a bug.

---

## 1. Pixel Style

**Genre**: Pixel-art RPG — top-down lateral (pseudo-isometric)  
**References**: Stardew Valley, Eastward, Fields of Mistria, Octopath Traveler  
**Theme**: Chinese Wuxia / Xianxia — Tang + Song Dynasty aesthetics  
**Feel**: Handcrafted, warm, grounded — not neon, not fantasy-generic

Pixel art must feel **consistent across all atlases**. Every asset uses the same palette range, the same top-left lighting assumption, and the same perspective angle. No element may look like it comes from a different game.

---

## 2. Character Rules

**Rule**: Every humanoid visible on screen must originate from a pixel-art sprite atlas. No exceptions.

### Approved character sources

| File | Style | Alpha | Notes |
|------|-------|-------|-------|
| `player_apprentice_blue_walk.png` | Pixel art 4×4 walk | RGBA | Player |
| `sifu_liang_walk.png` | Pixel art 4×4 walk | RGBA | NPC |
| `grandma_zhang_walk.png` | Pixel art 4×4 walk | RGBA | NPC |
| `hua_lan_walk.png` | Pixel art 4×4 walk | RGBA | NPC |
| `wen_bo_walk.png` | Pixel art 4×4 walk | RGBA | NPC |
| `little_wu_walk.png` | Pixel art 4×4 walk | RGBA | NPC |
| `player_apprentice_jade_walk.png` | Pixel art 4×4 walk | RGBA | NPC pool |
| `player_apprentice_red_walk.png` | Pixel art 4×4 walk | RGBA | NPC pool |
| `chars-atlas.png` | Pixel art chibi — 12×7 grid | RGB (BG remove) | Additional NPCs/portraits |
| `chars-atlas1.png` | Watercolor chibi — 12×6 grid | RGBA | Decorative/quest NPCs |

### Walk sprite frame layout (128×128, 4×4 grid of 32×32 frames)

```
Row 0 = Down  (facing camera)
Row 1 = Left
Row 2 = Right
Row 3 = Up    (back to camera)
```

### `chars-atlas.png` (1536×1024 RGB, background removal required)

Pixel-art characters, ~128×128px per sprite, 12 columns × 7 rows.  
Load via `AtlasRegistry.loadAndRemoveBg()` — same pipeline as `tileset.png`.

### `chars-atlas1.png` (1536×1024 RGBA)

Watercolor-style characters, ~128×170px per sprite, 12 columns × 6 rows.  
Load via `AtlasRegistry.loadTex()`.

---

## 3. Scale

| Constant | Value | Meaning |
|----------|-------|---------|
| `W` | 900 | Viewport width (px) |
| `H` | 560 | Viewport height (px) |
| `WW` | 2700 | World width (px) |
| `WH` | 900 | World height (px) |
| `GY` | 770 | Ground Y — foot anchor for all Y-sorted sprites |
| `TILE_SIZE` | 128 | Ground atlas tile size (px) |

### Sprite scale conventions

| Object type | Typical scale | Anchor |
|-------------|---------------|--------|
| Large building (FAC_WIDE, GATE_LG) | 0.85–1.15 | 0.5, 1 |
| Medium building (FAC_NARR, FAC_B*) | 0.65–0.90 | 0.5, 1 or 0, 1 |
| Large tree (CHERRY_*, BAMB_WIDE) | 0.75–1.05 | 0.5, 1 |
| Small tree (BAMB_SM, BAMB_MID) | 0.45–0.65 | 0.5, 1 |
| Rock (ROCK_LG) | 0.50–0.85 | 0.5, 1 |
| Rock (ROCK_SM) | 0.30–0.55 | 0.5, 1 |
| Props (barrel, well, lantern) | 0.40–0.60 | 0.5, 1 |
| Player / NPC | 1.0 (32px frame) | 0.5, 1 |

---

## 4. Camera

- Viewport: 900×560 px, fixed in screen space
- World: 2700×900 px, scrolls horizontally with player
- Camera follows player with smooth lerp (factor 0.12 per frame)
- Camera X clamped to `[0, WW - W]`
- Camera Y: fixed (no vertical scroll — world height matches viewport)
- Sky layer (`skyLay`) and mountain layer (`mtnLay`) are **viewport-fixed** (not children of `world`)
- Parallax:
  - `skyLay.x = -Math.round(camX * 0.12)` — 12% speed
  - `mtnLay.x = -Math.round(camX * 0.06)` — 6% speed

---

## 5. Depth (Y-Sort)

All objects in `ysortLay` are **Y-sorted every frame**.

```typescript
ysortLay.children.sort((a, b) => a.y - b.y)
```

**Rules**:
- Every Y-sorted sprite must have `anchor.set(0.5, 1)` — foot at (x, y)
- `.y` must equal the foot position in world space
- Higher y = closer to the camera = renders on top
- To place an object "behind" another at the same ground level, give it a lower `.y`
- Background buildings (inner compound): y = GY − 80 to GY − 30
- Foreground buildings (main structures): y = GY
- Player and NPCs: y updates every frame to their current foot position

**Depth layers** (render order, back to front):
```
sky / parallax mountains   (app.stage — never scroll vertically)
ground tiles               (groundLay — world-fixed TilingSprites)
terrain fills              (groundLay — Graphics: water, dirt, stone beds)
infra fixed objects        (infraLay — walls, fences, steps, signs, lanterns)
Y-sorted world objects     (ysortLay — buildings, trees, rocks, NPCs, player)
particles / effects        (partLay — leaves, smoke, shimmer, birds)
```

---

## 6. Environment Palette (per biome)

### Zone 1 — Academy (x: 0–540) 武館

- Ground: Stone courtyard (`K.cobble`), marble inner compound, grass borders
- Walls: Stone masonry (`K.stoneD`, `K.stone`, `K.stoneL`)
- Architecture: Dark wood beams, red lanterns, gold accents
- Nature: Cherry trees (pink), bamboo screen (west), bonsai garden (east)
- Mood: Disciplined, formal, warm stone + wood

### Zone 2 — Bamboo Forest (x: 540–1080) 竹林

- Ground: Grass (`K.grass`), dirt patches (`K.dirt`), stone streambed
- Water: Running stream — water tile `gt(7, 2)` + stone bed Graphics fill
- Nature: Dense bamboo columns, scatter rocks
- Mood: Dense, shadowed, cool greens

### Zone 3 — Village (x: 1080–1620) 村落

- Ground: Cobblestone street (`gt(9, 0)`), grass edges
- Architecture: Tea house, library — building-atlas facades
- Market: 3 small stall facades + barrel props
- Water: Koi pond — overlay atlas water patches + lily pad sprites
- Nature: Bonsai, cherry tree
- Mood: Lively, warm earthen tones

### Zone 4 — Mountain Path (x: 1620–2160) 山道

- Ground: Grass with elevated slope polygon fill, dirt path segments, stone ledges
- Water: Waterfall column + basin ellipse fills
- Nature: Bonsai cluster on slope, rock formations
- Entrance: Cave framed by large rock formation (ROCK_LG + ROCK_MED)
- Mood: Rugged, ascending, muted greens and stone

### Zone 5 — Ancient Temple (x: 2160–2700) 古刹

- Ground: Marble courtyard (`gt(3, 1)`)
- Walls: Stone perimeter wall
- Architecture: Gate, bell tower, main temple hall
- Props: Incense burner, Dao/De/Ren stone tablets, stone guardian rocks flanking entrance
- Nature: Large bonsai trees flanking approach
- Mood: Solemn, reverent, blue-grey stone + gold accents

---

## 7. Object Density

**Composition over decoration.** Every element must have a reason for being there.

| Zone section | Density rule |
|-------------|--------------|
| Training square (Zone 1) | Intentionally **empty** — negative space is the lesson |
| Bamboo forest (Zone 2) | Dense bamboo columns: two rows, 20+ stems — fill the zone |
| Mountain path (Zone 4) | Sparse — rocks and trees only where the eye naturally looks |
| Temple courtyard (Zone 5) | Formal symmetry — paired objects on centreline |

**Clustering**: Trees and rocks must be **grouped**, never evenly scattered. A solo bonsai is not interesting. Three bonsai in a composed triangle is.

**Clearance**: Always leave foot-traffic corridors at ground level (y=GY region) unobstructed between zones.

---

## 8. Visual Hierarchy

1. **Player** — highest contrast at all times (blue apprentice robe on neutral background)
2. **Zone landmark building** — dominant scale (FAC_WIDE × 0.88, GATE_SM × 1.05)
3. **Interactive objects** (orbes, Sifu Liang) — glow / shimmer effect draws eye
4. **Secondary architecture** — 0.65–0.75 scale, set back by lower Y
5. **Nature decoration** — fills gaps, never occludes entrances

Every zone must have **one dominant anchor building** the eye finds first.

---

## 9. Lighting

- **Direction**: Top-left (sun at upper-left corner)
- **Shadow tone**: All shadows are `K.stoneD` or `{ color: 0x000000, alpha: 0.10–0.25 }`
- **Ambient**: Warm diffuse — no harsh dark shadows
- **Player shadow**: Flat ellipse underneath player, `alpha: 0.18`
- **Lantern glow**: Soft ellipse `K.lanG` at `alpha: 0.10`, radius ~ 22px
- **Orb shimmer**: Vertical sine float, glow ring cycles opacity 0.20–0.55

No point lights, no dynamic lighting passes — this is a flat pixel-art game with hand-tuned lighting values only.

---

## 10. UI Aesthetic

- **Font**: Noto Serif SC for all Chinese characters; system sans-serif for English labels
- **HUD**: Minimal — stats tucked in corners, fade to transparent at edges
- **Modals** (Learning, Talent, Inventory): Dark semi-transparent panels, gold border, red accents
- **Orb interaction**: Full-width overlay modal — character + pinyin + definition
- **No CSS gradients visible to player**: All visual UI must feel consistent with the pixel-art world

---

## 11. Login Screen

- Background: `bg-login.png` (1536×1024 RGBA) — full-bleed, scaled to fill viewport
- Title text: Calligraphy-style, gold on dark
- Input fields: Semi-transparent dark panels with gold border
- Button: Red (`K.red`) with gold text
- No other graphics or effects — the background asset carries the entire visual weight

---

## 12. Forbidden List

The following are **strictly prohibited** in any renderer:

| Forbidden | Reason | Use instead |
|-----------|--------|-------------|
| `PIXI.Graphics` humanoid construction (rects + ellipses forming a person/creature) | Placeholder art | Sprite from `chars-atlas.png` or `props-atlas.png` |
| Procedural market stalls (wood rectangles as shop architecture) | Placeholder architecture | `BA.FAC_B3` scaled small + `PA.BARREL` props |
| CSS avatar / SVG character | Not pixel-art | Walk sprite from approved atlas |
| Inline colour fills representing buildings | Placeholder | `building-atlas.png` sprites |
| `new PIXI.Graphics()` for koi / pond fish | Placeholder | Overlay atlas water patches |
| Procedural cloud ellipses (sky layer) | Not pixel-art | `pixel-art-overlay-atlas.png` cloud sprites |
| `drawStoneWall` as the sole representation of a building | Placeholder | Building atlas facade, wall as infra only |
| Randomly scattered objects | Bad composition | Compose groups; use `rng()` for natural micro-variation only |

### Acceptable procedural use

The following uses of `PIXI.Graphics` are **permitted** because no atlas equivalent exists:

| Allowed | Why |
|---------|-----|
| Sky gradient fill (`buildSky`) | Background colour fill, not an object |
| Mountain/hill silhouette polygons (`buildMountains`) | Structural background, no mountain-silhouette atlas |
| Stone wall brick pattern (`drawStoneWall`) | Infra only — never represents an entire building |
| Bridge planks (`drawBridge`) | Infra only |
| Stone fence, steps | Infra only |
| Terrain slope polygon (Zone 4) | Structural ground fill — no tile equivalent for polygon terrain |
| Waterfall column + basin (Zone 4) | No waterfall sprite in atlases |
| Particle effects (leaves, smoke, shimmer) | Small ephemeral particles — no atlas equivalent |
| Bird V-shapes (GameScene) | Pending — replace when bird sprite atlas is available |
| Orb glow ring | Special effect, not an object |
| Player / NPC shadow ellipse | Special effect |

---

## Atlas Quick Reference

### `ground-atlas.png` — TilingSprite tiles, 128×128 px, 12×8 grid

```typescript
gt(col, row, w, h)  // col=0 grass base, col=1 grass light, col=3 marble,
                     // col=4 dirt, col=5 courtyard stone, col=7 water animated, col=9 cobble
```

### `building-atlas.png` (BA)

```typescript
BA.FAC_WIDE    = [229,  323, 328, 136]  // dominant hall facade
BA.FAC_NARR    = [37,   323, 173, 136]  // narrow building
BA.FAC_MED1    = [673,  323, 148, 136]
BA.FAC_MED2    = [829,  323,  95, 136]
BA.ARCH_OPEN   = [1374, 323, 124, 136]
BA.FAC_B1      = [33,   501, 154, 124]  // tea house / library
BA.FAC_B2      = [198,  501, 150, 124]
BA.FAC_B3      = [488,  501, 149, 124]  // market stall facade
BA.DOORS       = [949,  501, 155, 124]
BA.GATE_LG     = [676,  740, 611, 230]  // large gate
BA.GATE_SM     = [1293, 740, 234, 230]  // small gate
BA.RAILING_LG  = [41,   658, 303,  57]
BA.RAILING_RED = [358,  658, 101,  57]
```

### `nature-atlas.png` (NA)

```typescript
NA.BAMB_WIDE  = [32,   33, 514, 161]
NA.BAMB_SM    = [32,   33,  85, 161]
NA.BAMB_MID   = [132,  33, 200, 161]
NA.CHERRY_1   = [847,  33, 210, 161]
NA.CHERRY_2   = [1059, 33, 188, 161]
NA.CHERRY_3   = [1249, 33, 176, 161]
NA.BONSAI_1   = [27,  361, 218, 191]
NA.BONSAI_2   = [245, 361, 218, 191]
NA.BONSAI_3   = [463, 361, 218, 191]
NA.BONSAI_4   = [681, 361, 218, 191]
NA.ROCK_LG    = [31,  556, 210, 164]
NA.ROCK_MED   = [240, 556, 195, 164]
NA.ROCK_SM    = [430, 556, 145, 164]
```

### `props-atlas.png` (PA)

```typescript
PA.STONE_LAN  = [29,   24,  58, 126]  // stone lantern
PA.WELL       = [406,  24, 103, 126]
PA.DUMMY_1    = [37,  155,  58, 125]  // training dummy
PA.DUMMY_2    = [107, 155,  59, 125]
PA.DUMMY_3    = [187, 155,  73, 125]
PA.BARREL     = [23,  415,  63, 115]  // market goods
PA.INCENSE    = [855, 840, 140, 143]
```

### `pixel-art-overlay-atlas.png` (OA) — 1536×1024 RGBA

```typescript
OA.ROOF_LG_1   = [14,   10, 290, 142]  // Tang dynasty eave — large
OA.ROOF_LG_2   = [314,  10, 220, 142]  // Tang dynasty eave — medium
OA.ROOF_SM_1   = [540,  10, 100, 100]  // eave fragment left
OA.ROOF_SM_2   = [648,  10,  90, 100]  // eave fragment right

OA.CLOUD_DK_1  = [668,   8, 148, 120]  // dark storm cloud — row 1
OA.CLOUD_DK_2  = [820,   8, 155, 120]
OA.CLOUD_DK_3  = [978,   8, 148, 120]
OA.CLOUD_DK_4  = [1130,  8, 155, 120]
OA.CLOUD_DK_5  = [1288,  8, 148, 120]

OA.CLOUD_WH_1  = [6,   942, 330,  80]  // soft white sky cloud — row 10
OA.CLOUD_WH_2  = [342, 942, 280,  80]
OA.CLOUD_WH_3  = [630, 942, 240,  80]

OA.CLOUD_SND_1 = [8,   500, 220,  80]  // sand/beige cloud puff — row 5
OA.CLOUD_SND_2 = [238, 500, 225,  80]
OA.CLOUD_SND_3 = [472, 500, 215,  80]

OA.FOG_STRIP_1 = [838, 660, 698,  52]  // grey mist band — right half
OA.FOG_STRIP_2 = [838, 718, 698,  58]
OA.FOG_STRIP_3 = [838, 790, 698,  52]

OA.WATER_PAT_1 = [8,   660, 210,  68]  // blue water puddle overlay
OA.WATER_PAT_2 = [228, 660, 218,  68]
OA.WATER_PAT_3 = [454, 660, 210,  68]
OA.WATER_PAT_4 = [672, 660, 188,  68]

OA.PETAL_HEAP  = [328, 330, 190, 100]  // pink petal ground pile
OA.GOLD_HEAP   = [10,  330, 155, 100]  // gold blossom ground pile
```

### `pixel-art-autotile-atlas.png` (AT) — 1536×1024 RGBA

47-blob autotile sets. Terrain types (approximate 384×256 blocks per type):

| Type | Grid position | Centre tile (fill) |
|------|--------------|-------------------|
| Grass | col 0, row 0 | `AT.GRASS_CENTER = [128, 64, 128, 128]` |
| Dirt | col 1, row 0 | `AT.DIRT_CENTER  = [512, 64, 128, 128]` |
| Temple Stone | col 2, row 0 | `AT.STONE_CENTER = [896, 64, 128, 128]` |
| Wooden Floor | col 3, row 0 | `AT.WOOD_CENTER  = [1280, 64, 128, 128]` |
| Drrt (alt dirt) | col 0, row 1 | `AT.DRRT_CENTER  = [128, 576, 128, 128]` |
| Temble Stone | col 1, row 1 | `AT.TSTONE_CENTER= [512, 576, 128, 128]` |
| Moss | col 2, row 1 | `AT.MOSS_CENTER  = [896, 576, 128, 128]` |
| Sand | col 3, row 1 | `AT.SAND_CENTER  = [1280, 576, 128, 128]` |

Full 47-tile autotiling for organic terrain edges is **Phase 2** work.

---

## Asset Pipeline Checklist

Before shipping any visual feature, verify:

- [ ] All characters come from approved walk sprites or chars-atlas
- [ ] No `PIXI.Graphics` forms represent a recognisable object (person, animal, building)
- [ ] Buildings use `bsp()` (building-atlas), not filled rectangles
- [ ] Sky clouds use `osp()` (overlay-atlas), not procedural ellipses
- [ ] Koi pond / water features use overlay atlas water patches, not raw ellipse fills
- [ ] Market stalls use `bsp(BA.FAC_B3)` + barrel props, not procedural rectangles
- [ ] Stone guardian positions use `nsp(NA.ROCK_LG)`, not geometric stacked shapes
- [ ] All sprites have `anchor.set(0.5, 1)` and correct `.y = GY` (or slope-adjusted y)
- [ ] TypeScript strict mode passes: `npx tsc --noEmit` = 0 errors
