# UI Mockups — Flappy Kiro

Canvas size: 480×640 px. All coordinates are canvas pixels. Font: pixel/monospace (e.g. "Press Start 2P" or system monospace fallback). All screens are drawn directly onto the canvas — no DOM overlays.

---

## Color Palette

| Role | Color |
|------|-------|
| Background | `#1a1a2e` (deep navy) |
| Primary text | `#e8e8f0` (off-white) |
| Accent / highlight | `#f5c542` (retro yellow) |
| Dim text | `#7a7a9a` (muted lavender) |
| Panel background | `#16213e` (darker navy, semi-transparent) |
| Pipe fill | `#2ecc71` (retro green) |
| Pipe border | `#27ae60` (darker green) |

---

## 1. Main Menu (START state)

```
┌─────────────────────────────────────┐  y=0
│                                     │
│                                     │
│         ░░ FLAPPY KIRO ░░           │  y=160  font: 16px, color: #f5c542
│                                     │
│           [ghosty sprite]           │  y=220  48×48px, idle animation
│                                     │
│        PRESS SPACE TO PLAY          │  y=310  font: 8px, color: #e8e8f0
│          or tap the screen          │  y=330  font: 7px, color: #7a7a9a
│                                     │
│         ───────────────────         │  y=390  divider line, color: #7a7a9a
│                                     │
│           BEST SCORE                │  y=420  font: 8px, color: #7a7a9a
│               0                    │  y=445  font: 14px, color: #f5c542
│                                     │
│                                     │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │  y=620  scanline overlay
└─────────────────────────────────────┘  y=640
```

### Layout details
- Title "FLAPPY KIRO": centered at x=240, y=160; font size 16px; color `#f5c542`; subtle pixel shadow offset (+2,+2) in `#4a3a00`
- Ghosty sprite: centered at x=240, y=240; plays idle animation loop
- "PRESS SPACE TO PLAY": centered at x=240, y=310; font 8px; color `#e8e8f0`; blinks at 800ms interval (alternates opacity 1.0 ↔ 0.3)
- "or tap the screen": centered at x=240, y=332; font 7px; color `#7a7a9a`
- Divider: horizontal line from x=80 to x=400 at y=390; color `#7a7a9a`; opacity 0.4
- "BEST SCORE" label: centered at x=240, y=420; font 8px; color `#7a7a9a`
- High score value: centered at x=240, y=448; font 14px; color `#f5c542`
- Clouds scroll in background throughout

---

## 2. In-Game HUD (PLAYING state)

```
┌─────────────────────────────────────┐  y=0
│  42                                 │  y=40   current score, top-left
│                                     │
│                                     │
│           [ghosty + trail]          │  y=320  gameplay area
│                                     │
│    ║║║║║                ║║║║║       │         pipes
│    ║║║║║                ║║║║║       │
│                                     │
│                                     │
│                                     │
└─────────────────────────────────────┘  y=640
```

### Layout details
- Score: top-left at x=24, y=40; font 14px; color `#e8e8f0`; pixel shadow (+1,+1) `#00000080`
- Score_Pop animation: on increment, scale from 1.0 → 1.5 → 1.0 over 300ms using `ctx.scale` centered on score position
- No other HUD elements during gameplay — keep screen uncluttered
- Scanline overlay rendered on top of everything each frame

---

## 3. Pause Overlay (PAUSED state)

```
┌─────────────────────────────────────┐
│  42                                 │  score still visible
│                                     │
│  ┌───────────────────────────────┐  │
│  │                               │  │  panel: x=80, y=220, w=320, h=200
│  │          ⏸ PAUSED             │  │  y=260  font 14px, #e8e8f0
│  │                               │  │
│  │   PRESS ESC OR P TO RESUME    │  │  y=310  font 7px, #7a7a9a
│  │                               │  │
│  └───────────────────────────────┘  │
│                                     │
└─────────────────────────────────────┘
```

### Layout details
- Semi-transparent dark overlay: full canvas fill `#00000080`
- Panel: rounded rect at x=80, y=220, w=320, h=200; fill `#16213e`; border `#7a7a9a` 1px
- "PAUSED": centered at x=240, y=268; font 14px; color `#e8e8f0`
- Resume prompt: centered at x=240, y=310; font 7px; color `#7a7a9a`
- Game world (pipes, clouds, Ghosty) frozen and visible behind overlay

---

## 4. Game Over Screen (GAME_OVER state)

```
┌─────────────────────────────────────┐
│                                     │
│                                     │
│          ░ GAME OVER ░              │  y=160  font 16px, #e8e8f0
│                                     │
│  ┌───────────────────────────────┐  │
│  │                               │  │  panel: x=80, y=210, w=320, h=220
│  │          SCORE                │  │  y=248  font 8px, #7a7a9a
│  │            42                 │  │  y=272  font 20px, #f5c542
│  │                               │  │
│  │         ───────────           │  │  y=305  divider
│  │                               │  │
│  │        BEST SCORE             │  │  y=328  font 8px, #7a7a9a
│  │            42                 │  │  y=352  font 14px, #f5c542
│  │                               │  │
│  └───────────────────────────────┘  │
│                                     │
│        PRESS SPACE TO RETRY         │  y=460  font 8px, #e8e8f0, blinking
│          or tap the screen          │  y=480  font 7px, #7a7a9a
│                                     │
└─────────────────────────────────────┘
```

### Layout details
- "GAME OVER": centered at x=240, y=168; font 16px; color `#e8e8f0`; pixel shadow (+2,+2) `#00000080`
- If new high score achieved: "NEW BEST!" badge above score panel at y=210; font 8px; color `#f5c542`; brief scale-up animation on appear
- Panel: rounded rect at x=80, y=218, w=320, h=220; fill `#16213e`; border `#f5c542` 1px (highlight border if new high score, else `#7a7a9a`)
- "SCORE" label: centered at x=240, y=252; font 8px; color `#7a7a9a`
- Final score value: centered at x=240, y=278; font 20px; color `#f5c542`
- Divider: horizontal line from x=120 to x=360 at y=308; color `#7a7a9a`; opacity 0.4
- "BEST SCORE" label: centered at x=240, y=332; font 8px; color `#7a7a9a`
- High score value: centered at x=240, y=356; font 14px; color `#f5c542`
- "PRESS SPACE TO RETRY": centered at x=240, y=462; font 8px; color `#e8e8f0`; blinks at 800ms
- "or tap the screen": centered at x=240, y=482; font 7px; color `#7a7a9a`
- Ghosty death frame visible behind panel (frozen, still flashing from collision animation)

---

## 5. Rendering Notes

- All panels use `ctx.roundRect` (or manual arc-based rounded rect fallback) with 8px corner radius
- Blinking elements use a shared `blinkTimer` incremented each frame; toggle visibility every 800ms
- Scanline overlay (`drawImage` from offscreen canvas) is always the last draw call, on top of all UI
- Font loading: attempt to load "Press Start 2P" via `@font-face` in `index.html`; fall back to `"Courier New", monospace` if unavailable
- All text uses `ctx.textAlign = 'center'` and `ctx.textBaseline = 'middle'` for consistent centering
