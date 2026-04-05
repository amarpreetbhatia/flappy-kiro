# Flappy Kiro Domain — Game State, Score Persistence, Difficulty Progression

Covers game state management patterns, localStorage score persistence, and difficulty progression logic. Complements `game-coding-standards.md`, `game-mechanics.md`, and `visual-design.md`.

---

## Game State Machine

### States

```js
const STATE = {
  START:     'START',
  PLAYING:   'PLAYING',
  PAUSED:    'PAUSED',
  COLLIDING: 'COLLIDING',
  GAME_OVER: 'GAME_OVER',
};
```

### Valid transitions

| From | To | Trigger |
|------|----|---------|
| `START` | `PLAYING` | Space / tap |
| `PLAYING` | `PAUSED` | Escape / P |
| `PLAYING` | `COLLIDING` | Collision detected |
| `PAUSED` | `PLAYING` | Escape / P |
| `COLLIDING` | `GAME_OVER` | Animation complete (600ms) |
| `GAME_OVER` | `START` | Space / tap |

No other transitions are valid. `StateMachine.transition()` must guard against invalid transitions:

```js
transition(next) {
  const valid = VALID_TRANSITIONS[this.state];
  if (!valid?.includes(next)) return;  // silently ignore invalid
  this.state = next;
}

const VALID_TRANSITIONS = {
  [STATE.START]:     [STATE.PLAYING],
  [STATE.PLAYING]:   [STATE.PAUSED, STATE.COLLIDING],
  [STATE.PAUSED]:    [STATE.PLAYING],
  [STATE.COLLIDING]: [STATE.GAME_OVER],
  [STATE.GAME_OVER]: [STATE.START],
};
```

### Per-state update routing

```js
// StateMachine.update(dt) — only active subsystems run each frame
update(dt) {
  switch (this.state) {
    case STATE.PLAYING:
      physics.update(dt);
      pipes.update(dt);
      clouds.update(dt);
      particles.update(dt);
      collision.update(dt);
      score.checkPipes(pipes, physics);
      break;
    case STATE.PAUSED:
      // clouds.update(dt);  // optional: keep clouds moving while paused
      break;
    case STATE.COLLIDING:
      collisionAnim.update(dt);
      shake.update(dt);
      if (collisionAnim.done) this.transition(STATE.GAME_OVER);
      break;
    case STATE.START:
    case STATE.GAME_OVER:
      break;
  }
}
```

### Input routing by state

```js
// InputHandler — Space/tap
onAction() {
  switch (state.state) {
    case STATE.START:
      state.transition(STATE.PLAYING);
      physics.jump();
      audio.playMusic();
      collision.startInvincibility();
      break;
    case STATE.PLAYING:
      physics.jump();
      audio.playJump();
      anim.set(ANIM.FLAP);
      break;
    case STATE.GAME_OVER:
      resetGame();
      state.transition(STATE.START);
      break;
    // PAUSED and COLLIDING: ignore Space/tap
  }
}

// InputHandler — Escape/P
onPause() {
  if (state.state === STATE.PLAYING) {
    state.transition(STATE.PAUSED);
    audio.pauseMusic();
  } else if (state.state === STATE.PAUSED) {
    state.transition(STATE.PLAYING);
    audio.resumeMusic();
  }
}
```

---

## Game Reset

Called on every transition to `START`. Must fully restore all subsystems:

```js
function resetGame() {
  physics.reset();       // y = canvasH/2, vy = 0
  pipes.reset();         // clear active pipes, reset speed to initialSpeed
  particles.reset();     // zero all particle life values
  score.reset();         // score = 0 (highScore preserved)
  collision.reset();     // invincible = false, timer = 0
  anim.set(ANIM.IDLE);
  shake._t = 1;          // clear any active shake
  scorePop._t = 1;       // clear any active pop
}
```

---

## Score Persistence

### localStorage schema

```
key:   "flappyKiro_highScore"
value: string representation of integer (e.g. "42")
```

### Read on startup

```js
// ScoreManager.loadHighScore()
try {
  const raw = localStorage.getItem(config.audio.lsKey);
  this.highScore = raw !== null ? parseInt(raw, 10) : 0;
  if (isNaN(this.highScore)) this.highScore = 0;
} catch {
  this.highScore = 0;  // private browsing or quota exceeded
}
```

### Write on game over

```js
// ScoreManager.checkAndSave()
if (this.score > this.highScore) {
  this.highScore = this.score;
  try {
    localStorage.setItem(config.audio.lsKey, String(this.highScore));
  } catch {
    // in-memory highScore still updated — just not persisted
  }
  return true;  // signals "new high score" for UI badge
}
return false;
```

### Score increment

```js
// ScoreManager.increment()
this.score++;
scorePop.trigger();
audio.playScore();
// Check speed ramp
const newSpeed = pipes.getSpeed(this.score);
pipes.setSpeed(newSpeed);
```

### Pipe pass detection

```js
// Called each PLAYING frame
checkPipes(pipes, physics) {
  for (const pipe of pipes.active) {
    if (!pipe.scored && pipe.x + config.pipes.width < config.ghostyX) {
      pipe.scored = true;
      this.increment();
    }
  }
}
```

---

## Difficulty Progression

### Speed ramp formula

```js
// PipeManager.getSpeed(score)
return config.pipes.initialSpeed
  + Math.floor(score / config.pipes.speedMilestone) * config.pipes.speedIncrement;
```

With `game-config.json` defaults:
| Score | Speed |
|-------|-------|
| 0–4 | 120 px/s |
| 5–9 | 130 px/s |
| 10–14 | 140 px/s |
| 20+ | 160 px/s |

### Speed application

Speed change applies immediately to all active pipes and all future spawns:

```js
setSpeed(newSpeed) {
  if (newSpeed === this._speed) return;
  this._speed = newSpeed;
  // active pipes already use this._speed in update() — no per-pipe speed needed
}
```

### Invincibility window

```js
// CollisionSystem
startInvincibility() {
  this._invincible = true;
  this._timer = config.timing.invincibilitySecs;  // 2.0 s
}

update(dt) {
  if (this._invincible) {
    this._timer -= dt;
    if (this._timer <= 0) this._invincible = false;
  }
}
```

---

## Collision Response Sequence

Exact sequence on collision trigger:

1. `state.transition(STATE.COLLIDING)`
2. `audio.stopMusic()`
3. `audio.playGameOver()`
4. `shake.trigger()`
5. `collisionAnim.trigger()` — starts 600ms flash
6. `anim.set(ANIM.DEATH)`
7. `score.checkAndSave()` — persist high score, return isNewBest
8. After 600ms: `state.transition(STATE.GAME_OVER)`

```js
// CollisionAnimation
class CollisionAnimation {
  constructor(config) { this._dur = config.timing.collisionAnimSecs; this._t = 1; }
  trigger() { this._t = 0; }
  update(dt) { this._t = Math.min(1, this._t + dt / this._dur); }
  get done() { return this._t >= 1; }
  // flash visibility used by Renderer (see visual-design.md)
}
```
