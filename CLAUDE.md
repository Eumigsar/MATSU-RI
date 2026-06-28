# MATSU-RI — Contrato de Desenvolvimento

## Visão Geral

Jogo educativo de RPG pixel-art com temática Wuxia/Xianxia chinesa.
O jogador explora um mundo scrollável 2D aprendendo caracteres Hanzi (HSK 1–6)
através da interação com orbes mágicos espalhados pelo mapa.

- **Stack**: React + TypeScript + PixiJS 8.5.2 + Supabase + Tailwind
- **Canvas**: 900×560 px — mundo 2700×900 px (WW×WH)
- **Branch de desenvolvimento**: `claude/laughing-turing-wwb4ro`
- **Branch principal**: `main`

---

## Style Guide — Mundo

```
Tema:         Chinese Wuxia / Xianxia
Perspectiva:  Top-down lateral (pseudo-isométrico)
Tile size:    32×32 px (unidade base)
Lighting:     Top-left
Paleta:       Natural — sem cores neon
Arquitetura:  Tang + Song Dynasty
Natureza:     Bambu denso, pedras, templos antigos, vilarejos na montanha
Materiais:    Pedra, madeira antiga, argila, telhas escuras, bambu, água, grama, areia, mármore
Regra:        Tudo modular, encaixado no grid 32×32
              Todos os atlases compatíveis entre si
              Nunca gerar placeholders — só usar assets existentes
              O mundo final deve parecer um RPG pixel-art artesanal profissional
```

---

## Arquitetura de Layers (12 lógicas → 6 PIXI containers)

```
app.stage
  skyLay    #01-02  Céu + nuvens            (viewport-fixo, x-parallax 0.12×)
  mtnLay    #03-04  Montanhas + colinas      (viewport-fixo, x-parallax 0.06×)
  world     (scrolla com a câmera)
    groundLay #05-06  Tiles de terreno       (world-fixed)
    infraLay  #07     Paredes, cercas, pontes, degraus, placas (world-fixed, abaixo do Y-sort)
    ysortLay  #08-11  Y-SORTED: edifícios + árvores + props + NPCs + player
    partLay   #12     Partículas, folhas, fumaça, pássaros, shimmer de água
```

**Regra Y-sort**: todo filho de `ysortLay` deve ter `.y = Y do pé/base` no espaço do mundo.
O ticker ordena `ysortLay.children` por `.y` a cada frame — Y maior = mais na frente.

**Parallax**: skyLay/mtnLay estão em `app.stage` (não dentro de `world`), então NÃO
se movem verticalmente com a câmera. Apenas o eixo X tem parallax:
```typescript
skyLay.x = -Math.round(camX * 0.12)  // céu se move a 12% da velocidade da câmera
mtnLay.x = -Math.round(camX * 0.06)  // montanhas a 6%
```

---

## Constantes Globais

```typescript
const W  = 900    // viewport width
const H  = 560    // viewport height
const WW = 2700   // world width
const WH = 900    // world height
const GY = 770    // ground Y (linha do chão) — âncoras de pé dos sprites
```

---

## Assinatura dos Zone Builders

```typescript
function buildZoneN(
  ground: PIXI.Container,  // TilingSprites de terreno + Graphics de chão
  infra:  PIXI.Container,  // paredes, cercas, pontes, degraus, lanternas, placas
  ysort:  PIXI.Container,  // edifícios, árvores, props, NPCs — tudo Y-sorted
  ctx:    Ctx              // { gt, bsp, nsp, psp } — helpers de atlas
): void
```

---

## Zonas do Mundo

| Zona | X (world) | Tema | Conteúdo principal |
|------|-----------|------|--------------------|
| 1 — Academia | 0–540 | 武館 Escola de artes marciais | Edifícios, dummies, cerejeiras, Sifu Liang |
| 2 — Floresta de Bambu | 540–1080 | 竹林 Bambu denso | Bambu, riacho, rochas, ponte |
| 3 — Vilarejo | 1080–1620 | 村落 Aldeia | Casas atlas, barraquinhas, lago, NPCs |
| 4 — Caminho da Montanha | 1620–2160 | 山道 Trilha íngreme | Terreno elevado, bonsais, cachoeira |
| 5 — Templo Antigo | 2160–2700 | 古刹 Templo | Portal, sino, estátuas, incenso |

---

## Inventário de Assets (`public/assets/`)

### USADOS no jogo
| Arquivo | Tamanho | Uso |
|---------|---------|-----|
| `ground-atlas.png` | 3.5 MB — 1536×1024 RGBA | Tiles de terreno (128×128, grid 12×8) |
| `building-atlas.png` | 3.3 MB — 1536×1024 RGBA | Fachadas, portões, grades |
| `nature-atlas.png` | 3.5 MB — 1536×1024 RGBA | Bambu, cerejeiras, bonsais, rochas |
| `props-atlas.png` | 2.1 MB — 1024×1024 RGBA | Poço, manequins, incenso, barris |
| `tileset.png` | 1.1 MB — 1408×768 **JPEG** (sem alpha) | Lanterna orbe (tileset especial) |
| `player_apprentice_blue_walk.png` | 1.3 KB — 128×128 RGBA | Player principal (4×4 frames 32×32) |
| `sifu_liang_walk.png` | 1.3 KB — 128×128 RGBA | NPC Sifu Liang |
| `grandma_zhang_walk.png` | 1.4 KB — 128×128 RGBA | NPC Vovó Zhang |
| `hua_lan_walk.png` | 1.3 KB — 128×128 RGBA | NPC Hua Lan |
| `wen_bo_walk.png` | 1.3 KB — 128×128 RGBA | NPC Wen Bo |
| `little_wu_walk.png` | 1.3 KB — 128×128 RGBA | NPC Pequeno Wu |
| `player_apprentice_jade_walk.png` | 1.3 KB — 128×128 RGBA | NPC jade (pool de 6) |
| `player_apprentice_red_walk.png` | 1.3 KB — 128×128 RGBA | NPC vermelho (pool de 6) |
| `xiao_long_paper_dragon_float.png` | 421 B — 128×32 RGBA | Dragão Xiao Long (4 frames 32×32) |
| `bg-login.png` | 2.7 MB — 1536×1024 RGBA | Fundo da tela de login |

### DISPONÍVEIS — ainda não integrados
| Arquivo | Tamanho | Conteúdo | Como usar |
|---------|---------|----------|-----------|
| `pixel-art-autotile-atlas.png` | 3.8 MB — 1536×1024 RGBA | 6 tipos de terreno autotile | Substituir TilingSprites uniformes |
| `pixel-art-overlay-atlas.png` | 3.1 MB — 1536×1024 RGBA | Telhas de telhado, pétalas, nuvens | Overlays de decoração |
| `grass-autotile-47.png` | 2.8 MB — 1024×1024 RGBA | Grama estilo 47-blob | Transições de grama |
| `chars-atlas1.png` | 3.2 MB — 1536×1024 RGBA | Personagens estilo aquarela, RGBA | Variedade de NPCs |
| `chars-atlas.png` | 2.7 MB — 1536×1024 **RGB** (sem alpha) | Personagens, fundo cinza ~234 | Requer remoção de fundo (como tileset.png) |

### Tratamento especial de assets sem alpha
`tileset.png` e `chars-atlas.png` são JPEG/RGB sem canal alpha. Para carregá-los:
```typescript
const loadAndRemoveBackground = (src: string): Promise<PIXI.Texture> =>
  new Promise(resolve => {
    const img = new Image()
    img.onload = () => {
      const cv = document.createElement('canvas')
      cv.width = img.width; cv.height = img.height
      const ctx = cv.getContext('2d')!
      ctx.drawImage(img, 0, 0)
      const id = ctx.getImageData(0, 0, cv.width, cv.height)
      const d = id.data
      for (let i = 0; i < d.length; i += 4) {
        const r = d[i], g = d[i+1], b = d[i+2]
        const hi = Math.max(r, g, b), lo = Math.min(r, g, b)
        if (r > 185 && g > 185 && b > 185 && (hi - lo) < 35) d[i+3] = 0
      }
      ctx.putImageData(id, 0, 0)
      resolve(PIXI.Texture.from(cv))
    }
    img.src = src
  })
```

---

## Formato dos Walk Sprites

Todos os walk sprites (128×128 RGBA, grid 4×4 de frames 32×32):
```
Row 0 = Down (de frente)
Row 1 = Left (para a esquerda)
Row 2 = Right (para a direita)
Row 3 = Up (de costas)
```
Construção de frames:
```typescript
const mkFrames = (tex: PIXI.Texture, row: number): PIXI.Texture[] =>
  [0,1,2,3].map(col => new PIXI.Texture({
    source: tex.source,
    frame: new PIXI.Rectangle(col * 32, row * 32, 32, 32)
  }))
```

---

## Referências dos Atlases

### ground-atlas.png — tiles 128×128, grid (col, row)
```typescript
const gt = (col: number, row: number, w: number, h: number): PIXI.TilingSprite
// Tile (0,0) = grama base, (5,1) = pátio, (3,1) = mármore, (9,0) = calçada
// (4,0) = terra/dirt, (7,2) = água animada, (1,0) = grama clara
```

### building-atlas.png — sprites por coordenada pixel
```typescript
const BA = {
  FAC_WIDE:    [229,  323, 328, 136],  // fachada larga
  FAC_NARR:    [37,   323, 173, 136],  // fachada estreita
  FAC_MED1:    [673,  323, 148, 136],
  FAC_MED2:    [829,  323,  95, 136],
  ARCH_OPEN:   [1374, 323, 124, 136],  // arco aberto
  FAC_B1:      [33,   501, 154, 124],
  FAC_B2:      [198,  501, 150, 124],
  FAC_B3:      [488,  501, 149, 124],
  DOORS:       [949,  501, 155, 124],
  GATE_LG:     [676,  740, 611, 230],  // portão grande
  GATE_SM:     [1293, 740, 234, 230],  // portão pequeno
  RAILING_LG:  [41,   658, 303,  57],
  RAILING_RED: [358,  658, 101,  57],
}
```

### nature-atlas.png
```typescript
const NA = {
  BAMB_WIDE:  [32,   33, 514, 161],
  BAMB_SM:    [32,   33,  85, 161],
  BAMB_MID:   [132,  33, 200, 161],
  CHERRY_1:   [847,  33, 210, 161],
  CHERRY_2:   [1059, 33, 188, 161],
  CHERRY_3:   [1249, 33, 176, 161],
  BONSAI_1:   [27,  361, 218, 191],
  BONSAI_2:   [245, 361, 218, 191],
  BONSAI_3:   [463, 361, 218, 191],
  BONSAI_4:   [681, 361, 218, 191],
  ROCK_LG:    [31,  556, 210, 164],
  ROCK_MED:   [240, 556, 195, 164],
  ROCK_SM:    [430, 556, 145, 164],
}
```

### props-atlas.png
```typescript
const PA = {
  STONE_LAN: [29,   24,  58, 126],
  WELL:      [406,  24, 103, 126],
  DUMMY_1:   [37,  155,  58, 125],
  DUMMY_2:   [107, 155,  59, 125],
  DUMMY_3:   [187, 155,  73, 125],
  BARREL:    [23,  415,  63, 115],
  INCENSE:   [855, 840, 140, 143],
}
```

---

## NPCs e Player

```typescript
// 6 texturas de NPCs ambulantes
const npcWalkTexes = [grandmaWalkTex, huaWalkTex, wenWalkTex, wuWalkTex, jadeWalkTex, redWalkTex]

// Zonas de patrulha dos NPCs
{ x:230,  min:130,  max:420  }  // Zona 1 Academia
{ x:1180, min:1140, max:1280 }  // Zona 3 Vilarejo (×4)
{ x:2380, min:2290, max:2530 }  // Zona 5 Templo

// Sifu Liang: NPC fixo em x=290, y=GY — diálogo sobre os orbes
```

---

## Orbes Hanzi

5 orbes posicionados ao longo do mundo:
- 一 (yī) em x=350 — Academia
- 二 (èr) em x=870 — Floresta de Bambu
- 三 (sān) em x=1450 — Vilarejo
- 四 (sì) em x=2080 — Montanha
- 五 (wǔ) em x=2510 — Templo

Cada orbe usa a lanterna de `tileset.png` (frame 353, 393, 58, 140) com o caractere
Hanzi e pinyin sobrepostos. Os orbes flutuam verticalmente com seno.

---

## Partículas e Efeitos (partLay)

- **Folhas caindo**: 40 folhas (cerejeira + grama) fluindo com seno
- **Fumaça**: 5 emissores (edificios e barraquinhas) — partículas que sobem e somem
- **Pássaros**: 6 pássaros V-shape cruzando o céu da esquerda para direita
- **Shimmer de água**: 3 áreas (riacho, lago, cachoeira) — linhas horizontais oscilantes

---

## Dragão Xiao Long

Sprite `xiao_long_paper_dragon_float.png` (128×32, 4 frames 32×32).
Adicionado a `skyLay` para ficar ATRÁS do mundo. Voa da esquerda para direita
em loop, com oscilação vertical suave (seno). Velocidade: 0.55 px/frame.
Posição Y: `H * 0.42` (viewport-relativo, ~235px do topo).

---

## Regras de Desenvolvimento

1. **Nunca** hardcoding de cores onde há um sprite de atlas equivalente
2. **Nunca** adicionar features além do solicitado (sem abstrações prematuras)
3. **Sempre** usar `anchor.set(0.5, 1)` com `.y = GY` para sprites Y-sorted
4. **Sempre** adicionar sprites do mundo a `ysortLay` se forem objetos que o player passa na frente/atrás
5. **Sempre** adicionar decoração fixa (paredes, cercas, degraus) a `infraLay`
6. **Sempre** adicionar tiles de chão e gráficos de terreno a `groundLay`
7. TypeScript strict mode ativo (`noUnusedLocals`, `noUnusedParameters`)
8. Após cada mudança substancial: `npx tsc --noEmit` deve passar com 0 erros
9. Branch de dev: `claude/laughing-turing-wwb4ro` — nunca commitar em main diretamente

---

## Estado Atual do Projeto

### Implementado ✅
- Mundo scrollável 2700px com câmera suave
- Sistema de 12 layers (6 containers PIXI)
- Y-sort depth sorting funcionando (player passa atrás/frente de objetos)
- Parallax dual (céu 0.12×, montanhas 0.06×) — sky/mtn viewport-fixos
- 5 zonas com terreno, infraestrutura e objetos via atlas
- 5 orbes Hanzi interativos com sistema de aprendizagem
- Sifu Liang + 6 NPCs ambulantes com animação de caminhada direcional
- Dragão Xiao Long voando no céu
- Partículas: folhas, fumaça, pássaros, shimmer de água
- Autenticação com Supabase (e modo demo sem conta)

### Pendente 🔲
- Integrar `pixel-art-autotile-atlas.png` para transições de terreno suaves
- Integrar `pixel-art-overlay-atlas.png` para overlays de telhado e decoração
- Integrar `grass-autotile-47.png` para grama com bordas orgânicas
- Integrar `chars-atlas1.png` para mais variedade de NPC visual
- Substituir lanternas, placas e cercas vetoriais por sprites dos atlases
- Sistema de colisão (atualmente o player atravessa tudo)
- Sons e música ambiente
