#!/usr/bin/env python3
"""
build-chars-atlas.py
Converts chars-atlas.png (packed, grey-bg RGB) → chars-engine-atlas.png (uniform grid RGBA)
                                               → chars-engine-atlas.json (character map)

Detection is fully data-driven — no hardcoded frame positions.
"""
import json, os, sys
from PIL import Image

SRC  = os.path.join(os.path.dirname(__file__), '../public/assets/characters/chars-atlas.png')
OUTP = os.path.join(os.path.dirname(__file__), '../public/assets/characters/chars-engine-atlas.png')
OUTJ = os.path.join(os.path.dirname(__file__), '../public/assets/characters/chars-engine-atlas.json')

# ── Background keying parameters (detected by pixel inspection) ───────────────
BG_R, BG_G, BG_B = 232, 232, 231
TOL = 35   # tolerance for grey bg detection

# Minimum content pixels for a span to be considered a real character
MIN_CONTENT_PX = 200
MIN_SPAN_W     = 20   # spans narrower than this are stray artefacts
MERGE_GAP      = 4    # column spans separated by ≤ this px are merged (within-char parts)

# Output grid
OUT_COLS = 12
CELL_PAD = 12   # padding on each side

# ── Load source ───────────────────────────────────────────────────────────────
print(f"\nLoading {SRC} …")
src = Image.open(SRC).convert('RGBA')
W, H = src.size
print(f"  {W} × {H} px, mode={src.mode}")

# ── Background removal → RGBA with transparent bg ────────────────────────────
print("Keying out background …")
data = list(src.getdata())
keyed = []
for r, g, b, a in data:
    if abs(r - BG_R) <= TOL and abs(g - BG_G) <= TOL and abs(b - BG_B) <= TOL:
        keyed.append((r, g, b, 0))
    else:
        keyed.append((r, g, b, a))
rgba = Image.new('RGBA', (W, H))
rgba.putdata(keyed)
print("  Done.")

# ── Row/column projections ────────────────────────────────────────────────────
print("Computing projections …")
alpha_data = [px[3] for px in keyed]

col_proj = [0] * W
row_proj = [0] * H
for idx, a in enumerate(alpha_data):
    if a > 20:
        row, col = divmod(idx, W)
        col_proj[col] += 1
        row_proj[row] += 1

# ── Span detection helpers ────────────────────────────────────────────────────
def find_spans(proj):
    spans, in_span, start = [], False, 0
    for i, v in enumerate(proj):
        if v > 0 and not in_span:
            in_span, start = True, i
        elif v == 0 and in_span:
            in_span = False
            spans.append((start, i - 1))
    if in_span:
        spans.append((start, len(proj) - 1))
    return spans

def merge_spans(spans, max_gap):
    if not spans:
        return []
    merged = [list(spans[0])]
    for s, e in spans[1:]:
        if s - merged[-1][1] - 1 <= max_gap:
            merged[-1][1] = e
        else:
            merged.append([s, e])
    return [tuple(x) for x in merged]

def filter_spans(spans, min_w):
    return [(s, e) for s, e in spans if e - s + 1 >= min_w]

# ── Detect row bands ──────────────────────────────────────────────────────────
raw_rows = find_spans(row_proj)
# Do NOT merge row bands — inter-row gaps are as small as 1px and must stay separate
row_bands = merge_spans(raw_rows, 0)
print(f"\n  Row bands detected: {len(row_bands)}")
for i, (s, e) in enumerate(row_bands):
    print(f"    Band {i}: y={s}–{e}  height={e-s+1}px")

# ── Per-band: detect character columns ───────────────────────────────────────
print("\nDetecting characters per row band …")

characters = []   # list of dicts: {band, col_idx, src_x, src_y, src_w, src_h, content_px}

for band_idx, (band_y0, band_y1) in enumerate(row_bands):
    band_h = band_y1 - band_y0 + 1
    # Column projection within this band only
    band_col = [0] * W
    for row in range(band_y0, band_y1 + 1):
        for col in range(W):
            if alpha_data[row * W + col] > 20:
                band_col[col] += 1

    raw_col_spans = find_spans(band_col)
    # Filter out stray artefact spans (< MIN_SPAN_W px wide)
    real_spans = filter_spans(raw_col_spans, MIN_SPAN_W)
    # Merge spans that are very close (within MERGE_GAP) — within-character sub-parts
    merged_spans = merge_spans(real_spans, MERGE_GAP)

    print(f"\n  Band {band_idx} (y={band_y0}–{band_y1}, h={band_h}px): "
          f"{len(raw_col_spans)} raw → {len(real_spans)} filtered → {len(merged_spans)} merged col spans")

    for col_idx, (cx0, cx1) in enumerate(merged_spans):
        # Tight bounding box for this character within the band
        min_x, max_x, min_y, max_y = W, 0, H, 0
        content_px = 0
        for row in range(band_y0, band_y1 + 1):
            for col in range(cx0, cx1 + 1):
                if alpha_data[row * W + col] > 20:
                    content_px += 1
                    if col < min_x: min_x = col
                    if col > max_x: max_x = col
                    if row < min_y: min_y = row
                    if row > max_y: max_y = row

        if content_px < MIN_CONTENT_PX:
            print(f"    col {col_idx}: x={cx0}–{cx1} SKIPPED (content_px={content_px} < {MIN_CONTENT_PX})")
            continue

        cw = max_x - min_x + 1
        ch = max_y - min_y + 1
        print(f"    col {col_idx}: x={cx0}–{cx1}  bbox=[{min_x},{min_y},{cw}×{ch}]  px={content_px}")

        characters.append({
            'band':       band_idx,
            'col_idx':    col_idx,
            'src_x':      min_x,
            'src_y':      min_y,
            'src_w':      cw,
            'src_h':      ch,
            'content_px': content_px,
        })

print(f"\nTotal characters detected: {len(characters)}")

# ── Compute uniform cell dimensions ──────────────────────────────────────────
max_cw = max(c['src_w'] for c in characters)
max_ch = max(c['src_h'] for c in characters)

# Round up to nearest multiple of 8 for GPU texture alignment
def round8(n): return ((n + 7) // 8) * 8

CELL_W = round8(max_cw + CELL_PAD * 2)
CELL_H = round8(max_ch + CELL_PAD * 2)
print(f"\nMax content: {max_cw} × {max_ch} px")
print(f"Cell size: {CELL_W} × {CELL_H} px  (padded, rounded to 8)")

# ── Layout output atlas ───────────────────────────────────────────────────────
n_chars = len(characters)
n_rows  = (n_chars + OUT_COLS - 1) // OUT_COLS
OUT_W   = CELL_W * OUT_COLS
OUT_H   = CELL_H * n_rows
print(f"\nOutput atlas: {OUT_W} × {OUT_H} px  ({OUT_COLS} cols × {n_rows} rows, {n_chars} chars)")

out_img = Image.new('RGBA', (OUT_W, OUT_H), (0, 0, 0, 0))

char_map = {}  # "band_col_idx" → entry

for i, c in enumerate(characters):
    out_col = i % OUT_COLS
    out_row = i // OUT_COLS

    # Crop character from keyed RGBA source
    crop = rgba.crop((c['src_x'], c['src_y'],
                      c['src_x'] + c['src_w'], c['src_y'] + c['src_h']))

    # Place into cell: centre horizontally, bottom-align vertically
    cell_x0 = out_col * CELL_W
    cell_y0 = out_row * CELL_H

    paste_x = cell_x0 + (CELL_W - c['src_w']) // 2
    paste_y = cell_y0 + CELL_H - c['src_h'] - CELL_PAD  # bottom-align with bottom padding

    out_img.paste(crop, (paste_x, paste_y), crop)

    key = f"r{c['band']}_c{c['col_idx']}"
    char_map[key] = {
        'band':       c['band'],
        'col_idx':    c['col_idx'],
        'source_bbox': {
            'x': c['src_x'], 'y': c['src_y'],
            'w': c['src_w'], 'h': c['src_h'],
        },
        'atlas_col': out_col,
        'atlas_row': out_row,
        'frames': {
            'idle': {
                'x': cell_x0, 'y': cell_y0,
                'w': CELL_W,  'h': CELL_H,
            }
        },
    }

# ── Save outputs ──────────────────────────────────────────────────────────────
out_img.save(OUTP, 'PNG')
print(f"\n  ✓ Saved {OUTP}")

meta = {
    'version':      1,
    'source':       'chars-atlas.png',
    'cell_w':       CELL_W,
    'cell_h':       CELL_H,
    'atlas_cols':   OUT_COLS,
    'atlas_rows':   n_rows,
    'atlas_w':      OUT_W,
    'atlas_h':      OUT_H,
    'total_chars':  n_chars,
    'bg_rgb':       [BG_R, BG_G, BG_B],
    'bg_tol':       TOL,
    'characters':   char_map,
}

with open(OUTJ, 'w') as f:
    json.dump(meta, f, indent=2)
print(f"  ✓ Saved {OUTJ}")

print(f"\nDone. {n_chars} characters → {OUT_W}×{OUT_H} atlas, cell {CELL_W}×{CELL_H} px\n")
