# Game Coding Standards — Flappy Kiro

Applies to all JavaScript files in this project. These standards are enforced during implementation and code review.

---

## 1. Class Naming Conventions

| Pattern | Convention | Example |
|---------|-----------|---------|
| Game subsystems | PascalCase, noun | `PhysicsSystem`, `PipeManager`, `AudioManager` |
| Data classes | PascalCase, noun | `Pipe`, `Cloud`, `Particle` |
| State values | SCREAMING_SNAKE_CASE string literals | `'PLAYING'`, `'GAME_OVER'` |
| Config keys | camelCase | `ascentVelocity`, `gapSize` |
| Private fields | `_` prefix | `_pool`, `_head`, `_ctx` |
| Constants (module-level) | SCREAMING_SNAKE_CASE | `DEFAULT_CONFIG`, `MAX_PARTICLES` |

```js
// Good
class PipeManager { ... }
class Pipe { x; gapTop; gapBottom; scored; }
const STATE = { PLAYING: 'PLAYING', PAUSED: 'PAUSED' };

// Bad
class pipemanager { ... }
class PipeData { ... }   // "Data" suffix is noise
```

---

## 2. Subsystem Structure

Every subsystem follows the same interface contract:

```js
class ExampleSystem {
  constructor(config) { /* store config slice, pre-allocate pools */ }
  update(dt) { /* advance state by delta-time seconds */ }
  reset() { /* restore to initial state for game restart */ }
  // draw(ctx) — only on systems that render
}
```

- `update(dt)` receives delta-time in **seconds** (not milliseconds)
- `reset()` must fully restore the system to its post-construction state
- Systems never call each other directly — communication goes through `game.js`

---

## 3. JavaScript Patterns

### Module structure
- One class per file when using ES modules; `game.js` is the single entry point
- If delivering as a single file, define all classes before the entry point `init()` call
- No global variables except the single `game` instance wired in `game.js`

### Delta-time physics
```js
// Always scale by dt — never use raw pixel offsets per frame
this.vy += config.gravity * dt;
this.vy = Math.min(this.vy, config.terminalVelocity);
this.y  += this.vy * dt;
```

### Avoid allocations in the game loop
```js
// Bad — allocates a new object every frame
function getHitbox() { return { x: ..., y: ..., w: ..., h: ... }; }

// Good — reuse a pre-allocated scratch object
const _scratchRect = { x: 0, y: 0, w: 0, h: 0 };
function getHitbox(out) { out.x = ...; out.y = ...; return out; }
```

### Object pools
```js
// Pipe pool pattern
class PipeManager {
  constructor(config, canvas) {
    const poolSize = Math.ceil(canvas.width / config.spacing) + 2;
    this._pool = Array.from({ length: poolSize }, () => new Pipe());
    this._active = [];
  }
  _acquire() { return this._pool.find(p => !p.active) ?? this._pool[0]; }
  _release(pipe) { pipe.active = false; }
}
```

### Circular buffer for particles
```js
class ParticleSystem {
  constructor(config) {
    this._buf = Array.from({ length: config.particlePoolSize }, () => new Particle());
    this._head = 0;
  }
  emit(x, y) {
    const p = this._buf[this._head % this._buf.length];
    p.reset(x, y);
    this._head++;
  }
}
```

---

## 4. Performance Optimization Guidelines

### Frame budget
- Target: 60 FPS → 16.6 ms per frame
- All per-frame work (update + draw) must complete within this budget
- Profile with browser DevTools if frame time exceeds 10 ms

### No allocations in the hot path
- No `new`, no array spread/concat, no object literals inside `update()` or `draw()`
- Pre-allocate all pools, scratch objects, and typed arrays at construction time

### Canvas state changes
- Batch draw calls by type to minimize `fillStyle`, `globalAlpha`, `font` changes
- Set canvas state once before a batch, not once per element:
```js
// Good
ctx.fillStyle = PIPE_COLOR;
for (const pipe of activePipes) { drawPipe(ctx, pipe); }

// Bad
for (const pipe of activePipes) { ctx.fillStyle = PIPE_COLOR; drawPipe(ctx, pipe); }
```

### ctx.save / ctx.restore
- Use only when necessary (screen shake translation, score pop scale)
- Never nest saves more than one level deep
- Always pair every `save()` with a `restore()`

### Offscreen canvas
- Pre-render static or rarely-changing visuals (scanline overlay) to an offscreen canvas at startup
- Composite with a single `drawImage` call each frame

### Delta-time clamping
```js
// Always clamp to prevent spiral-of-death on slow frames
const dt = Math.min((now - this._lastTime) / 1000, config.maxDeltaTime);
```

### Event listeners
- Register `keydown`, `touchstart`, `touchend` once at startup — never inside the game loop
- Remove listeners only on explicit teardown, not between game sessions

---

## 5. Error Handling Patterns

```js
// localStorage — always wrap
try {
  localStorage.setItem(key, value);
} catch {
  // silently ignore — in-memory fallback is already set
}

// Audio — always wrap
try {
  const source = ctx.createBufferSource();
  source.buffer = this._buffer;
  source.connect(ctx.destination);
  source.start();
} catch {
  // missing audio never crashes the game
}

// Asset loading — provide fallback rendering
this._sprite = new Image();
this._sprite.onerror = () => { this._spriteFailed = true; };
this._sprite.src = 'assets/ghosty.png';

// In draw():
if (this._spriteFailed) {
  ctx.fillStyle = '#e8e8f0';
  ctx.fillRect(x, y, size, size);
} else {
  ctx.drawImage(this._sprite, x, y, size, size);
}
```

---

## 6. Code Style

- 2-space indentation
- Single quotes for strings
- Semicolons required
- `const` by default; `let` only when reassignment is needed; never `var`
- Arrow functions for callbacks; named functions for methods
- Comments on non-obvious logic only — self-documenting names are preferred
- Each subsystem file starts with a one-line comment stating its responsibility:
  ```js
  // PhysicsSystem — owns Ghosty's vertical position and velocity
  ```
