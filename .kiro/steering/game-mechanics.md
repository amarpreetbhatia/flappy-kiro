# Game Mechanics — Flappy Kiro

Reference for physics constants, movement algorithms, and collision detection patterns. All values sourced from `game-config.json` via constructor injection — never hardcoded in subsystem logic.

---

## Physics Constants

| Constant | Value | Unit | Notes |
|----------|-------|------|-------|
| `gravity` | 800 | px/s² | Downward acceleration applied every frame |
| `ascentVelocity` | 300 | px/s | Upward speed set on jump (applied as negative vy) |
| `terminalVelocity` | 600 | px/s | Maximum downward fall speed |
| `ghostyX` | 120 | px | Fixed horizontal position of Ghosty |
| `ghostySize` | 48 | px | Rendered sprite size (scaled from 32×32 source) |
| `hitboxRadius` | 12 | px | Collision circle radius |
| `maxDeltaTime` | 0.05 | s | Delta-time clamp (~20 fps minimum) |

---

## Movement Algorithms

### Gravity integration (per frame)

```js
// PhysicsSystem.update(dt)
this.vy += config.gravity * dt;
this.vy = Math.min(this.vy, config.terminalVelocity);  // clamp downward
this.y  += this.vy * dt;
```

### Jump impulse

```js
// PhysicsSystem.jump()
this.vy = -config.ascentVelocity;  // negative = upward
```

Momentum is preserved between frames — jump overwrites `vy` directly, no additive impulse.

### Pipe scrolling (per frame)

```js
// PipeManager.update(dt)
for (const pipe of this._active) {
  pipe.x -= this._speed * dt;
}
```

### Progressive speed ramp

```js
// PipeManager.getSpeed(score)
return config.initialSpeed + Math.floor(score / config.speedMilestone) * config.speedIncrement;
```

Applied immediately to all active pipes when score crosses a milestone.

### Sprite tilt (visual only, no physics effect)

```js
// Renderer — tilt Ghosty based on vertical velocity
const maxTilt = Math.PI / 9;   // 20°
const tilt = Math.max(-maxTilt, Math.min(maxTilt, this._vy / config.terminalVelocity * maxTilt));
ctx.translate(cx, cy);
ctx.rotate(tilt);
ctx.drawImage(sprite, -half, -half, size, size);
ctx.rotate(-tilt);
ctx.translate(-cx, -cy);
```

---

## Collision Detection

### Ghosty collision circle

```js
// CollisionSystem.getCircle(physicsY)
return {
  cx: config.ghostyX,
  cy: physicsY,
  r:  config.hitboxRadius,   // from game-config.json, not derived from sprite size
};
```

### Circle-vs-rect (pipe segments)

```js
// Reuse pre-allocated scratch — no new objects
function circleIntersectsRect(cx, cy, r, rx, ry, rw, rh) {
  const clampedX = Math.max(rx, Math.min(cx, rx + rw));
  const clampedY = Math.max(ry, Math.min(cy, ry + rh));
  const dx = cx - clampedX;
  const dy = cy - clampedY;
  return (dx * dx + dy * dy) < (r * r);  // avoid sqrt — compare squared distances
}
```

Test against both pipe rects per pair:

```js
// Top pipe rect
const topHit = circleIntersectsRect(cx, cy, r, pipe.x, 0, config.pipes.width, pipe.gapTop);
// Bottom pipe rect
const botHit = circleIntersectsRect(cx, cy, r, pipe.x, pipe.gapBottom, config.pipes.width, canvasH - pipe.gapBottom);
```

### Boundary detection

```js
const hitCeiling = (cy - r) <= 0;
const hitGround  = (cy + r) >= canvasH;
```

### Invincibility guard

```js
// CollisionSystem.test(physicsY, pipes, canvasH)
if (this._invincible) return false;
// ... run circle tests
```

Timer counts down from `config.invincibilitySecs` (2.0 s) at session start.

---

## Pipe Generation

### Gap positioning

```js
// Random gap center within safe vertical bounds
const minCenter = config.gapMargin + config.gapSize / 2;
const maxCenter = canvasH - config.gapMargin - config.gapSize / 2;
const center    = minCenter + Math.random() * (maxCenter - minCenter);
pipe.gapTop    = center - config.gapSize / 2;
pipe.gapBottom = center + config.gapSize / 2;
```

### Spawn trigger

New pipe spawned when the leading edge of the last active pipe crosses `canvasW - config.spacing`.

### Pool sizing

```js
const poolSize = Math.ceil(canvasW / config.spacing) + 2;
```

---

## Parallax Cloud Speeds

| Layer | Speed | Alpha range |
|-------|-------|-------------|
| Back | 30 px/s | 0.15–0.20 |
| Front | 60 px/s | 0.25–0.35 |

Cloud wrap: when `cloud.x + cloud.width < 0`, reposition to `canvasW + cloud.width`.
