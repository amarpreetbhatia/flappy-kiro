// Renderer — ordered draw calls each frame: bg, clouds, pipes, particles, Ghosty, UI, overlays

const COLOR = {
  BG:        '#1a1a2e',
  TEXT:      '#e8e8f0',
  ACCENT:    '#f5c542',
  DIM:       '#7a7a9a',
  PANEL:     '#16213e',
  PIPE:      '#2ecc71',
  PIPE_EDGE: '#27ae60',
  PARTICLE:  '#c8c8e0',
};

export class ScorePop {
  constructor(config) {
    this._dur = config.timing.scorePopSecs;
    this._t = 1;
  }
  trigger() { this._t = 0; }
  update(dt) { this._t = Math.min(1, this._t + dt / this._dur); }
  get scale() { return 1 + Math.sin(Math.PI * this._t) * 0.5; }
  get active() { return this._t < 1; }
}

export class ScreenShake {
  constructor(config) {
    this._dur = config.timing.screenShakeSecs;
    this._mag = config.timing.screenShakeMag;
    this._t = 1;
  }
  trigger() { this._t = 0; }
  update(dt) { this._t = Math.min(1, this._t + dt / this._dur); }
  get active() { return this._t < 1; }
  get offsetX() { return this.active ? (Math.random() * 2 - 1) * this._mag * (1 - this._t) : 0; }
  get offsetY() { return this.active ? (Math.random() * 2 - 1) * this._mag * (1 - this._t) : 0; }
}

export class CollisionAnimation {
  constructor(config) {
    this._dur = config.timing.collisionAnimSecs;
    this._t = 1;
  }
  trigger() { this._t = 0; }
  update(dt) { this._t = Math.min(1, this._t + dt / this._dur); }
  get done() { return this._t >= 1; }
  get elapsed() { return this._t * this._dur; }
}

export class AnimationState {
  constructor(frames, fps) {
    this._frames = frames;
    this._fps = fps;
    this._elapsed = 0;
    this.frame = frames[0];
  }
  update(dt) {
    this._elapsed += dt;
    const idx = Math.floor(this._elapsed * this._fps) % this._frames.length;
    this.frame = this._frames[idx];
  }
  set(frames, fps) {
    if (this._frames === frames) return;
    this._frames = frames;
    this._fps = fps;
    this._elapsed = 0;
    this.frame = frames[0];
  }
}

function buildScanlineOverlay(width, height) {
  try {
    const oc = new OffscreenCanvas(width, height);
    const octx = oc.getContext('2d');
    octx.fillStyle = 'rgba(0,0,0,0.12)';
    for (let y = 0; y < height; y += 2) {
      octx.fillRect(0, y, width, 1);
    }
    return oc;
  } catch {
    return null;
  }
}

export default class Renderer {
  constructor(ctx, config, subsystems) {
    this._ctx = ctx;
    this._config = config;
    this._w = config.canvas.width;
    this._h = config.canvas.height;

    // Subsystems
    this._clouds = subsystems.clouds;
    this._pipes = subsystems.pipes;
    this._particles = subsystems.particles;
    this._physics = subsystems.physics;
    this._score = subsystems.score;
    this.shake = subsystems.shake;
    this.scorePop = subsystems.scorePop;
    this.collisionAnim = subsystems.collisionAnim;
    this.anim = subsystems.anim;

    // Pre-render scanline overlay
    this._scanlines = buildScanlineOverlay(this._w, this._h);

    // Load Ghosty sprite
    this._sprite = new Image();
    this._spriteFailed = false;
    this._sprite.onerror = () => { this._spriteFailed = true; };
    this._sprite.src = 'assets/ghosty.png';

    // Pixel font
    this._font = '24px monospace';
    this._titleFont = '36px monospace';
  }

  draw(state) {
    const ctx = this._ctx;
    const w = this._w;
    const h = this._h;

    // Screen shake translation wraps steps 1–8
    ctx.save();
    ctx.translate(this.shake.offsetX, this.shake.offsetY);

    // 1. Clear
    ctx.clearRect(0, 0, w, h);

    // 2. Background fill
    ctx.fillStyle = COLOR.BG;
    ctx.fillRect(0, 0, w, h);

    // 3 & 4. Clouds (back then front)
    this._clouds.draw(ctx);

    // 5. Pipes
    this._drawPipes(ctx);

    // 6. Particles
    this._particles.draw(ctx);

    // 7. Ghosty
    this._drawGhosty(ctx, state);

    // 8. Score
    this._drawScore(ctx);

    ctx.restore();

    // 9. Scanline overlay (unaffected by shake)
    if (this._scanlines) {
      ctx.drawImage(this._scanlines, 0, 0);
    }

    // 10. State overlays
    this._drawOverlay(ctx, state, w, h);
  }

  _drawPipes(ctx) {
    const pw = this._config.pipes.width;
    ctx.fillStyle = COLOR.PIPE;
    ctx.strokeStyle = COLOR.PIPE_EDGE;
    ctx.lineWidth = 2;
    for (const pipe of this._pipes.pipes) {
      if (!pipe.active) continue;
      ctx.fillRect(pipe.x, 0, pw, pipe.gapTop);
      ctx.strokeRect(pipe.x, 0, pw, pipe.gapTop);
      ctx.fillRect(pipe.x, pipe.gapBottom, pw, this._h - pipe.gapBottom);
      ctx.strokeRect(pipe.x, pipe.gapBottom, pw, this._h - pipe.gapBottom);
    }
  }

  _drawGhosty(ctx, state) {
    const cfg = this._config.physics;
    const cx = cfg.ghostyX;
    const cy = this._physics.y;
    const size = cfg.ghostySize;
    const half = size / 2;

    // Flash during COLLIDING
    if (state === 'COLLIDING') {
      const FLASH_INTERVAL = 0.08;
      const visible = Math.floor(this.collisionAnim.elapsed / FLASH_INTERVAL) % 2 === 0;
      ctx.globalAlpha = visible ? 1.0 : 0.0;
    }

    // Tilt based on velocity
    const maxTilt = Math.PI / 9;
    const tilt = Math.max(-maxTilt, Math.min(maxTilt,
      (this._physics.vy / cfg.terminalVelocity) * maxTilt
    ));

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(tilt);
    ctx.imageSmoothingEnabled = false;

    if (!this._spriteFailed && this._sprite.complete && this._sprite.naturalWidth > 0) {
      // Sprite sheet: 6 frames × 32px
      const FRAME_W = 32;
      const FRAME_H = 32;
      const frameIndex = this.anim ? this.anim.frame : 0;
      ctx.drawImage(this._sprite, frameIndex * FRAME_W, 0, FRAME_W, FRAME_H, -half, -half, size, size);
    } else {
      ctx.fillStyle = COLOR.TEXT;
      ctx.fillRect(-half, -half, size, size);
    }

    ctx.restore();
    ctx.globalAlpha = 1.0;
  }

  _drawScore(ctx) {
    const score = this._score.score;
    const scoreX = this._w / 2;
    const scoreY = 60;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (this.scorePop.active) {
      const s = this.scorePop.scale;
      ctx.save();
      ctx.translate(scoreX, scoreY);
      ctx.scale(s, s);
      ctx.font = this._font;
      ctx.fillStyle = COLOR.ACCENT;
      ctx.fillText(String(score), 0, 0);
      ctx.restore();
    } else {
      ctx.font = this._font;
      ctx.fillStyle = COLOR.ACCENT;
      ctx.fillText(String(score), scoreX, scoreY);
    }
  }

  _drawOverlay(ctx, state, w, h) {
    if (state === 'START') {
      this._drawPanel(ctx, w, h);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = this._titleFont;
      ctx.fillStyle = COLOR.ACCENT;
      ctx.fillText('FLAPPY KIRO', w / 2, h / 2 - 60);
      ctx.font = this._font;
      ctx.fillStyle = COLOR.TEXT;
      ctx.fillText('Press SPACE or Tap to Start', w / 2, h / 2 + 10);
      ctx.fillStyle = COLOR.DIM;
      ctx.font = '16px monospace';
      ctx.fillText(`Best: ${this._score.highScore}`, w / 2, h / 2 + 50);
    } else if (state === 'PAUSED') {
      this._drawPanel(ctx, w, h);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = this._titleFont;
      ctx.fillStyle = COLOR.ACCENT;
      ctx.fillText('PAUSED', w / 2, h / 2 - 30);
      ctx.font = this._font;
      ctx.fillStyle = COLOR.DIM;
      ctx.fillText('Press P or ESC to Resume', w / 2, h / 2 + 20);
    } else if (state === 'GAME_OVER') {
      this._drawPanel(ctx, w, h);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = this._titleFont;
      ctx.fillStyle = COLOR.ACCENT;
      ctx.fillText('GAME OVER', w / 2, h / 2 - 60);
      ctx.font = this._font;
      ctx.fillStyle = COLOR.TEXT;
      ctx.fillText(`Score: ${this._score.score}`, w / 2, h / 2 - 10);
      ctx.fillStyle = COLOR.DIM;
      ctx.fillText(`Best: ${this._score.highScore}`, w / 2, h / 2 + 30);
      ctx.fillStyle = COLOR.TEXT;
      ctx.font = '18px monospace';
      ctx.fillText('Press SPACE or Tap to Restart', w / 2, h / 2 + 70);
    }
  }

  _drawPanel(ctx, w, h) {
    ctx.fillStyle = 'rgba(22,33,62,0.82)';
    ctx.fillRect(w / 2 - 180, h / 2 - 100, 360, 200);
  }
}
