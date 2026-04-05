# Ghosty Sprite Specifications

## Sprite Sheet

- Sprite dimensions: 32×32 px per frame
- Source file: `assets/ghosty.png`
- Sheet layout: horizontal strip, all frames left-to-right
- Total frames: 6 (3 idle + 2 flap + 1 death)

## Hitbox

- Shape: circle
- Radius: 12 px
- Center: sprite center (16, 16)
- Inset from sprite edge: 4 px on all sides

## Animation States

### Idle (frames 0–2)
- Frame count: 3
- Duration per frame: 200 ms
- Loop: yes
- Description: gentle hover bob — ghost body slightly expands and contracts, eyes half-open

| Frame | Description |
|-------|-------------|
| 0 | Neutral resting pose |
| 1 | Slight upward float, body slightly wider |
| 2 | Return toward neutral, subtle tail drift |

### Flap (frames 3–4)
- Frame count: 2
- Duration per frame: 60 ms
- Loop: no — plays once per jump input, then returns to idle
- Description: sharp upward lunge — body squashes vertically, eyes widen, tail flicks up

| Frame | Description |
|-------|-------------|
| 3 | Body squash (wider, shorter), eyes wide, tail flicks up |
| 4 | Body stretch (taller, narrower), transitioning back to idle |

### Death (frame 5)
- Frame count: 1
- Duration: held for full collision animation (600 ms)
- Loop: no
- Description: X eyes, body crumpled, tail limp — flashes on/off during collision animation

| Frame | Description |
|-------|-------------|
| 5 | X eyes, crumpled body, limp tail, slightly rotated |

## Rendering Notes

- Render at 48×48 px in-game (scaled up 1.5× from 32×32 source for visibility)
- Use `ctx.imageSmoothingEnabled = false` to preserve pixel-art crispness
- During COLLIDING state: alternate `globalAlpha` between 1.0 and 0.0 at 80 ms intervals
- During PLAYING state with downward velocity > 300 px/s: tilt sprite up to 20° clockwise (falling tilt)
- During PLAYING state with upward velocity: tilt sprite up to 15° counter-clockwise (rising tilt)

## Color Palette

| Element | Color |
|---------|-------|
| Body | `#e8e8f0` (off-white) |
| Body shadow | `#b0b0c8` (muted lavender) |
| Eyes (normal) | `#2a2a3a` (near-black) |
| Eyes (death X) | `#cc3333` (retro red) |
| Tail/wisp | `#c8c8e0` (light lavender) |
| Outline | `#4a4a6a` (dark purple-grey) |
