# Visual Design — Flappy Kiro

Sprite rendering patterns, animation systems, and particle effect guidelines. Complements `game-coding-standards.md` (Canvas API rules) and `game-mechanics.md` (physics/movement).

---

## Color Palette

| Role | Hex | Usage |
|------|-----|-------|
| Background | `#1a1a2e` | Canvas fill |
| Primary text | `#e8e8f0` | Score, prompts |
| Accent | `#f5c542` | Title, high score, highlights |
| Dim text | `#7a7a9a` | Labels, secondary prompts |
| Panel bg | `#16213e` | Overlay panels |
| Pipe fill | `#2ecc71` | Pipe body |
| Pipe border | `#27ae60` | Pipe edge |
| Ghosty body | `#e8e8f0` | Sprite base |
| Ghosty shadow | `#b0b0c8` | Sprite shading |
| Particle | `#c8c8e0` | Trail sparkles |

All colors are constants — never use inline hex strings in draw calls. Define once at module top:

```js
const COLOR = {
  BG:         '#1a1a2e',
  TEXT:       '#e8e8f0',
  ACCENT:     '#f5c542',
  DIM:        '#7a7a9a',
  PANEL:      '#16213e',
  PIPE:       '#2ecc71',
  PIPE_EDGE:  '#27ae60',
  PARTICLE:   '#c8c8e0',
};
```

---

## Sprite Rendering

### Ghosty sprite

```js
// Always disable smoothing for pixel-art sprites
ctx.imageSmoothingEnabled = false;

// Draw centered on physics position
const half = config.ghostySize / 2;
ctx.drawImage(sprite, cx - half, cy - half, config.ghostySize, config.ghostySize);
```

### Sprite sheet frame selection

```js
// Ghosty sprite sheet: 6 frames × 32px wide, 32px tall
// Frame layout: [idle0, idle1, idle2, flap0, flap1, death]
const FRAME_W = 32;
const FRAME_H = 32;

ctx.drawImage(
  sheet,
  frameIndex * FRAME_W, 0,   // source x, y
  FRAME_W, FRAME_H,           // source w, h
  cx - half, cy - half,       // dest x, y
  config.ghostySize, config.ghostySize  // dest w, h (scaled to 48px)
);
```

### Sprite tilt

```js
// Tilt based on vertical velocity — visual only, no physics effect
const MAX_TILT = Math.PI / 9;  // 20°
const tilt = Math.max(-MAX_TILT, Math.min(MAX_TILT,
  (physics.vy / config.terminalVelocity) * MAX_TILT
));

ctx.save();
ctx.translate(cx, cy);
ctx.rotate(tilt);
ctx.drawImage(sprite, -half, -half, config.ghostySize, config.ghostySize);
ctx.restore();
```

### Collision flash

```js
// During COLLIDING state — alternate opacity every 80ms
const FLASH_INTERVAL = 0.08;  // seconds
const visible = Math.floor(collisionElapsed / FLASH_INTERVAL) % 2 === 0;
ctx.globalAlpha = visible ? 1.0 : 0.0;
// draw Ghosty (death frame)
ctx.globalAlpha = 1.0;  // always restore
```

---

## Animation Systems

### Idle animation (frame cycling)

```js
// AnimationState — updated in game loop, not in draw
class AnimationState {
  constructor(frames, fps) {
    this._frames = frames;   // e.g. [0, 1, 2] for idle
    this._fps    = fps;      // e.g. 5 for idle (200ms/frame)
    this._elapsed = 0;
    this.frame   = frames[0];
  }
  update(dt) {
    this._elapsed += dt;
    const idx = Math.floor(this._elapsed * this._fps) % this._frames.length;
    this.frame = this._frames[idx];
  }
  set(frames, fps) {
    if (this._frames === frames) return;  // no restart if same anim
    this._frames  = frames;
    this._fps     = fps;
    this._elapsed = 0;
    this.frame    = frames[0];
  }
}
```

Animation sets:

| State | Frames | FPS | Loop |
|-------|--------|-----|------|
| Idle | [0, 1, 2] | 5 | yes |
| Flap | [3, 4] | 16 | no → return to idle |
| Death | [5] | — | held |

### Score pop

```js
// ScorePop — scale up then back down over scorePopSecs
class ScorePop {
  constructor(config) { this._dur = config.scorePopSecs; this._t = 1; }
  trigger() { this._t = 0; }
  update(dt) { this._t = Math.min(1, this._t + dt / this._dur); }
  get scale() { return 1 + Math.sin(Math.PI * this._t) * 0.5; }
  get active() { return this._t < 1; }
}

// In Renderer:
if (scorePop.active) {
  ctx.save();
  ctx.translate(scoreX, scoreY);
  ctx.scale(scorePop.scale, scorePop.scale);
  ctx.fillText(score, 0, 0);
  ctx.restore();
} else {
  ctx.fillText(score, scoreX, scoreY);
}
```

### Screen shake

```js
// ScreenShake — random offset for shakeSecs duration
class ScreenShake {
  constructor(config) { this._dur = config.screenShakeSecs; this._mag = config.screenShakeMag; this._t = 1; }
  trigger() { this._t = 0; }
  update(dt) { this._t = Math.min(1, this._t + dt / this._dur); }
  get active() { return this._t < 1; }
  get offsetX() { return this.active ? (Math.random() * 2 - 1) * this._mag * (1 - this._t) : 0; }
  get offsetY() { return this.active ? (Math.random() * 2 - 1) * this._mag * (1 - this._t) : 0; }
}

// Wrap game world draw calls:
ctx.save();
ctx.translate(shake.offsetX, shake.offsetY);
// ... draw background, clouds, pipes, particles, Ghosty, score
ctx.restore();
// scanline overlay and UI panels drawn AFTER restore — unaffected by shake
```

### Blinking text

```js
// Shared blink timer — one instance, drives all blinking elements
class BlinkTimer {
  constructor(interval = 0.8) { this._interval = interval; this._t = 0; }
  update(dt) { this._t = (this._t + dt) % (this._interval * 2); }
  get visible() { return this._t < this._interval; }
}
```

---

## Particle Effects

### Trail emission (every PLAYING frame)

```js
// ParticleSystem.emit(x, y) — writes to circular buffer, no allocation
emit(x, y) {
  const p = this._buf[this._head % this._buf.length];
  p.x      = x + (Math.random() - 0.5) * 8;   // random spread ±4px
  p.y      = y + (Math.random() - 0.5) * 8;
  p.vx     = (Math.random() - 0.5) * 20;       // px/s
  p.vy     = (Math.random() - 0.5) * 20;
  p.life   = 1.0;
  p.maxLife = 0.3 + Math.random() * 0.2;       // 0.3–0.5 s
  this._head++;
}
```

### Particle update

```js
// No allocation — mutate in place, mark inactive when expired
update(dt) {
  for (let i = 0; i < this._buf.length; i++) {
    const p = this._buf[i];
    if (p.life <= 0) continue;
    p.x    += p.vx * dt;
    p.y    += p.vy * dt;
    p.life -= dt / p.maxLife;
    if (p.life < 0) p.life = 0;
  }
}
```

### Particle draw (batched)

```js
// Set state once, draw all active particles in one pass
draw(ctx) {
  ctx.fillStyle = COLOR.PARTICLE;
  for (let i = 0; i < this._buf.length; i++) {
    const p = this._buf[i];
    if (p.life <= 0) continue;
    ctx.globalAlpha = p.life * 0.6;  // fade out
    ctx.beginPath();
    ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1.0;  // always restore
}
```

---

## Scanline Overlay

Pre-rendered once at startup onto an offscreen canvas:

```js
function buildScanlineOverlay(width, height) {
  const oc  = new OffscreenCanvas(width, height);
  const octx = oc.getContext('2d');
  octx.fillStyle = 'rgba(0,0,0,0.12)';
  for (let y = 0; y < height; y += 2) {
    octx.fillRect(0, y, width, 1);
  }
  return oc;
}

// In Renderer.draw() — always last, after ctx.restore() for shake:
ctx.drawImage(this._scanlines, 0, 0);
```

---

## Pipe Rendering

```js
// Draw all pipes in one pass — set fillStyle once
drawPipes(ctx, pipes, config, canvasH) {
  ctx.fillStyle   = COLOR.PIPE;
  ctx.strokeStyle = COLOR.PIPE_EDGE;
  ctx.lineWidth   = 2;
  for (const pipe of pipes) {
    if (!pipe.active) continue;
    // Top pipe
    ctx.fillRect(pipe.x, 0, config.pipes.width, pipe.gapTop);
    ctx.strokeRect(pipe.x, 0, config.pipes.width, pipe.gapTop);
    // Bottom pipe
    ctx.fillRect(pipe.x, pipe.gapBottom, config.pipes.width, canvasH - pipe.gapBottom);
    ctx.strokeRect(pipe.x, pipe.gapBottom, config.pipes.width, canvasH - pipe.gapBottom);
  }
}
```

---

## Cloud Rendering

```js
// Draw each layer in one pass — set globalAlpha once per cloud (varies per cloud)
drawClouds(ctx, layers) {
  for (const layer of layers) {
    for (const cloud of layer.clouds) {
      ctx.globalAlpha = cloud.alpha;
      ctx.fillStyle   = COLOR.TEXT;  // off-white clouds
      ctx.beginPath();
      ctx.ellipse(cloud.x, cloud.y, cloud.width / 2, cloud.height / 2, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1.0;
}
```
