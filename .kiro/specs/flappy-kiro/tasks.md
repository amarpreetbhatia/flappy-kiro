# Implementation Plan: Flappy Kiro

## Overview

Implement Flappy Kiro as a single `index.html` + `game.js` + `config.json` static web app using vanilla JavaScript and HTML5 Canvas. Each task builds incrementally toward a fully wired, playable game. Tests use Vitest + fast-check.

## Tasks

- [x] 1. Project scaffold and config loader
  - Create `index.html` with a `<canvas id="gameCanvas">` element, a `<script src="game.js" type="module">` tag, and a canvas-not-supported fallback `<p>` message
  - Create `config.json` with all tunable constants matching the design schema (canvas, physics, pipes, timing, clouds, audio, performance)
  - In `game.js`, implement `DEFAULT_CONFIG` (same shape as `config.json`) and `loadConfig()` — try `fetch('config.json')`, fall back to `DEFAULT_CONFIG` with a `console.warn` on any error
  - Detect `canvas.getContext('2d')` returning `null` and replace the canvas with the fallback message
  - _Requirements: 8.1, 8.3, 8.5_

- [x] 2. StateMachine and game loop skeleton
  - [x] 2.1 Implement `StateMachine` class with states `START | PLAYING | PAUSED | COLLIDING | GAME_OVER`, a `transition(newState)` method, and a stub `update(dt)` method
  - [x] 2.2 Wire the `requestAnimationFrame` game loop in `game.js`: compute `deltaTime`, clamp to `maxDeltaTime`, call `stateMachine.update(dt)` then `renderer.draw(state)` each frame
  - [x] 2.3 Write unit tests for all state machine transitions (START→PLAYING, PLAYING→PAUSED, PAUSED→PLAYING, PLAYING→COLLIDING, COLLIDING→GAME_OVER, GAME_OVER→START)
  - _Requirements: 1.6, 4.5 (Req 4.5 pause), 6.4_

- [x] 3. PhysicsSystem
  - [x] 3.1 Implement `PhysicsSystem` with `y`, `vy`, `update(dt)` (gravity + terminal velocity clamp + position integration), `jump()` (set `vy = -ASCENT_VELOCITY`), and `reset()`
  - [x] 3.2 Write property test for Property 1: gravity integration with terminal velocity clamp
    - **Property 1: Gravity integration with terminal velocity clamp**
    - **Validates: Requirements 2.1, 2.3**
  - [x] 3.3 Write property test for Property 2: jump always sets velocity to ascent value
    - **Property 2: Jump always sets velocity to ascent value**
    - **Validates: Requirements 2.2**
  - [x] 3.4 Write property test for Property 3: position integration is velocity × delta-time
    - **Property 3: Position integration is velocity × delta-time**
    - **Validates: Requirements 2.5**
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 4. PipeManager
  - [x] 4.1 Implement `Pipe` data class and `PipeManager` with `pipes[]`, `speed`, `update(dt)` (scroll + recycle off-screen pipes), `reset()`, and `checkScoring(ghostyX)`
  - [x] 4.2 Implement pipe spawning: randomize gap center within `GAP_MARGIN` bounds, enforce `GAP_SIZE`, maintain `PIPE_SPACING` leading-edge distance; use a fixed-size object pool (`ceil(CANVAS_WIDTH / PIPE_SPACING) + 2` slots)
  - [x] 4.3 Implement speed ramp: `getSpeed(score)` returns `INITIAL_PIPE_SPEED + floor(score / SPEED_MILESTONE) * SPEED_INCREMENT`; apply immediately to all active pipes
  - [x] 4.4 Write property test for Property 4: pipe scrolling is speed × delta-time
    - **Property 4: Pipe scrolling is speed × delta-time**
    - **Validates: Requirements 3.1**
  - [x] 4.5 Write property test for Property 5: spawned pipes have correct gap invariants
    - **Property 5: Spawned pipes have correct gap invariants**
    - **Validates: Requirements 3.3, 3.4**
  - [x] 4.6 Write property test for Property 6: pipe speed matches score-based formula
    - **Property 6: Pipe speed matches score-based formula**
    - **Validates: Requirements 3.7, 3.8**
  - [x] 4.7 Write unit tests for pipe removal (x + PIPE_WIDTH < 0) and pipe spacing
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

- [x] 5. CollisionSystem
  - [x] 5.1 Implement `CollisionSystem` with `invincible`, `invincibilityTimer`, `update(dt)`, `getCircle(physicsY)` (derives `cx`, `cy`, `r` from config), and `test(physicsY, pipes, canvasH)` using circle-vs-rect clamp algorithm plus ceiling/ground checks; return `false` when `invincible == true`
  - [x] 5.2 Write property test for Property 7: collision circle radius derivation
    - **Property 7: Ghosty collision circle radius is correctly derived from sprite size and inset**
    - **Validates: Requirements 4.1**
  - [x] 5.3 Write property test for Property 8: collision detection correctness for all surfaces
    - **Property 8: Collision detection is correct for all surfaces**
    - **Validates: Requirements 4.3, 4.4, 4.5**
  - [x] 5.4 Write property test for Property 9: invincibility suppresses all collisions
    - **Property 9: Invincibility suppresses all collisions**
    - **Validates: Requirements 4.6**
  - [x] 5.5 Write unit tests for invincibility timer (starts at 2.0 s, counts down, disables after expiry)
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

- [x] 6. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. ScoreManager
  - [x] 7.1 Implement `ScoreManager` with `score`, `highScore`, `increment()`, `loadHighScore()`, `saveHighScore()`, and `reset()`; wrap all `localStorage` calls in try/catch; use key `"flappyKiro_highScore"`
  - [x] 7.2 Write property test for Property 10: score increments by exactly one per pipe passed
    - **Property 10: Score increments by exactly one per pipe passed**
    - **Validates: Requirements 5.1**
  - [x] 7.3 Write property test for Property 11: high score persistence is correct for any score pair
    - **Property 11: High score persistence is correct for any score pair**
    - **Validates: Requirements 5.3, 5.4, 5.5**
  - [x] 7.4 Write property test for Property 12: high score display matches stored value
    - **Property 12: High score display matches stored value**
    - **Validates: Requirements 1.4, 5.6**
  - [x] 7.5 Write unit tests for localStorage unavailability (no throw) and in-memory fallback
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [x] 8. CloudManager
  - [x] 8.1 Implement `Cloud`, `CloudLayer`, and `CloudManager`; initialize two layers from config with speeds `[40, 80]` px/s; distribute clouds at varied vertical positions; `update(dt)` scrolls each layer and wraps clouds that scroll fully off-screen left back to the right edge
  - [x] 8.2 Write property test for Property 13: foreground cloud layer scrolls faster than background layer
    - **Property 13: Foreground cloud layer scrolls faster than background layer**
    - **Validates: Requirements 9.2**
  - [x] 8.3 Write property test for Property 14: clouds wrap around continuously
    - **Property 14: Clouds wrap around continuously**
    - **Validates: Requirements 9.4**
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

- [x] 9. ParticleSystem
  - [x] 9.1 Implement `Particle` and `ParticleSystem` with a fixed-size circular buffer (`particlePoolSize` slots); `emit(x, y)` writes to the next slot with random spread, ghost-like color, and `maxLife <= 0.5 s`; `update(dt)` ages particles and marks expired ones inactive (`life = 0`); `draw(ctx)` skips inactive particles
  - [x] 9.2 Write property test for Property 15: particles are removed after their lifetime elapses
    - **Property 15: Particles are removed after their lifetime elapses**
    - **Validates: Requirements 11.6**
  - _Requirements: 11.4, 11.5, 11.6, 11.7_

- [x] 10. AudioManager
  - [x] 10.1 Implement `AudioManager`: load `jump.wav` and `game_over.wav` via `fetch` + `decodeAudioData` into `AudioBufferSourceNode` clones for `playJump()` and `playGameOver()`; generate a short synthesized blip via Web Audio API oscillator for `playScore()`; use an HTML `<audio>` element for background music (`playMusic`, `pauseMusic`, `resumeMusic`, `stopMusic`); call `audioContext.resume()` on first user interaction; wrap all audio calls in try/catch
  - [x] 10.2 Source or generate a looping retro/chiptune background music asset and save it as `assets/music.ogg` (or `.mp3`); source or generate a score sound effect and save it as `assets/score.wav` (or synthesize it inline via Web Audio API oscillator as described in 10.1)
  - [x] 10.3 Write unit tests for `playMusic`/`pauseMusic`/`resumeMusic`/`stopMusic` called at correct state transitions (AudioManager mocked)
  - [x] 10.4 Write unit tests for `playJump`, `playGameOver`, `playScore` called at correct game events
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8, 10.9, 10.10_

- [x] 11. Renderer
  - [x] 11.1 Implement `Renderer.draw(state)` with the full draw order: (1) clear, (2) background fill, (3) back-layer clouds, (4) front-layer clouds, (5) pipes, (6) particles, (7) Ghosty sprite (with flash alpha during COLLIDING), (8) score display with Score_Pop scale transform, wrapped in `ctx.save/translate/restore` for screen shake, then (9) scanline overlay via pre-rendered offscreen canvas `drawImage`, then (10) state overlays (START / PAUSE / GAME_OVER panels)
  - [x] 11.2 Pre-render the scanline overlay onto an offscreen canvas at startup (one horizontal line per 2px, semi-transparent); composite with a single `drawImage` each frame
  - [x] 11.3 Implement Score_Pop animation state (`active`, `elapsed`, `scale = 1 + sin(π * elapsed / SCORE_POP_SECS) * 0.5`); restart on re-increment within 300 ms
  - [x] 11.4 Implement Screen_Shake state (`active`, `elapsed`, `offsetX/Y` re-randomized each frame); apply for 400 ms then clear
  - [x] 11.5 Render Ghosty using `assets/ghosty.png`; fall back to a filled rectangle if the image fails to load
  - [x] 11.6 Render all UI text (title, score, high score, prompts) using a pixel-style font; use a limited retro color palette for background, pipes, and UI elements
  - [x] 11.7 Write unit tests for Score_Pop (starts on increment, restarts on re-increment within 300 ms) and Screen_Shake (offset applied for 400 ms then cleared)
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 11.1, 11.2, 11.3, 11.8, 11.9, 11.10_

- [x] 12. InputHandler
  - [x] 12.1 Implement `InputHandler`: register `keydown` (Space, Escape, P) and `touchstart` listeners once at startup; route each event to the correct action based on `StateMachine.state` — Space/tap on START → transition to PLAYING + `physics.jump()` + `audio.playMusic()`; Space/tap on PLAYING → `physics.jump()` + `audio.playJump()`; Escape/P on PLAYING → transition to PAUSED + `audio.pauseMusic()`; Escape/P on PAUSED → transition to PLAYING + `audio.resumeMusic()`; Space/tap on GAME_OVER → reset all state + transition to START; ignore Space/tap while PAUSED or COLLIDING
  - [x] 12.2 Write unit tests for input routing: each key/tap in each state triggers the correct action or is ignored
  - _Requirements: 1.3, 1.6, 2.2, 2.7, 4.5 (Req 4.5 pause), 6.3, 6.4_

- [x] 13. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 14. Wire everything together in game.js
  - [x] 14.1 In `game.js`, after `await loadConfig()`, instantiate all subsystems with constructor-injected config slices; start the RAF loop; call `stateMachine.update(dt)` routing to the correct subsystems per state (PLAYING: PhysicsSystem, PipeManager, CloudManager, ParticleSystem, CollisionSystem, ScoreManager; PAUSED: nothing or CloudManager only; COLLIDING: collision animation timer + screen shake; START/GAME_OVER: idle)
  - [x] 14.2 Implement game reset: on transition to START, call `physics.reset()`, `pipes.reset()`, `score.reset()`, clear particles, restore Ghosty to initial position, remove all active pipes
  - [x] 14.3 Implement collision response: on `CollisionSystem.test()` returning `true`, transition to COLLIDING, call `audio.playGameOver()`, start collision animation (flash Ghosty opacity at fixed interval for 600 ms), start screen shake (400 ms), then transition to GAME_OVER; check and persist high score
  - [x] 14.4 Implement score increment wiring: when `PipeManager.checkScoring(ghostyX)` returns > 0, call `scoreManager.increment()`, `audio.playScore()`, trigger Score_Pop
  - [x] 14.5 Implement pause wiring: on PAUSED state entry stop music; on PAUSED state exit resume music; ignore Space/tap while PAUSED
  - [x] 14.6 Write unit tests for game reset (Ghosty position, velocity, pipes array, score all restored to initial values)
  - _Requirements: 1.6, 2.7, 3.1–3.8, 4.7–4.11, 5.1–5.6, 6.4, 6.5, 10.5–10.8_

- [x] 15. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Property tests use Vitest + fast-check with `{ numRuns: 100 }` minimum; tag each test with `// Feature: flappy-kiro, Property N: <text>`
- Run tests with `npx vitest --run`
- Serve the game with `npx serve .` to enable `config.json` fetch; opening `index.html` directly falls back to `DEFAULT_CONFIG`
