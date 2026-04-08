// PipeManager — owns pipe spawning, scrolling, recycling, and speed ramp

export class Pipe {
  constructor() {
    this.x = 0;
    this.gapTop = 0;
    this.gapBottom = 0;
    this.scored = false;
    this.active = false;
  }

  reset(x, gapTop, gapBottom) {
    this.x = x;
    this.gapTop = gapTop;
    this.gapBottom = gapBottom;
    this.scored = false;
    this.active = true;
  }
}

export default class PipeManager {
  constructor(config, canvas) {
    this._config = config;
    this._canvasW = canvas.width;
    this._canvasH = canvas.height;

    const poolSize = Math.ceil(canvas.width / config.spacing) + 2;
    this._pool = Array.from({ length: poolSize }, () => new Pipe());
    this._active = [];
    this._speed = config.initialSpeed;
  }

  // Public read-only view of active pipes
  get pipes() {
    return this._active;
  }

  get speed() {
    return this._speed;
  }

  update(dt) {
    // Scroll all active pipes
    for (const pipe of this._active) {
      pipe.x -= this._speed * dt;
    }

    // Recycle pipes that have scrolled fully off-screen left
    for (let i = this._active.length - 1; i >= 0; i--) {
      if (this._active[i].x + this._config.width < 0) {
        this._active[i].active = false;
        this._active.splice(i, 1);
      }
    }

    // Spawn new pipe if needed
    this._maybeSpawn();
  }

  reset() {
    for (const pipe of this._pool) {
      pipe.active = false;
    }
    this._active.length = 0;
    this._speed = this._config.initialSpeed;
    // Spawn initial pipe off the right edge
    this._spawnPipe(this._canvasW + this._config.width);
  }

  checkScoring(ghostyX) {
    let count = 0;
    for (const pipe of this._active) {
      if (!pipe.scored && pipe.x + this._config.width < ghostyX) {
        pipe.scored = true;
        count++;
      }
    }
    return count;
  }

  // Returns speed for a given score (used externally for speed ramp)
  getSpeed(score) {
    return this._config.initialSpeed
      + Math.floor(score / this._config.speedMilestone) * this._config.speedIncrement;
  }

  setSpeed(newSpeed) {
    this._speed = newSpeed;
  }

  _maybeSpawn() {
    if (this._active.length === 0) {
      this._spawnPipe(this._canvasW + this._config.width);
      return;
    }
    const last = this._active[this._active.length - 1];
    if (last.x <= this._canvasW - this._config.spacing) {
      this._spawnPipe(last.x + this._config.spacing);
    }
  }

  _spawnPipe(x) {
    const pipe = this._acquire();
    if (!pipe) return;

    const { gapSize, gapMargin } = this._config;
    const minCenter = gapMargin + gapSize / 2;
    const maxCenter = this._canvasH - gapMargin - gapSize / 2;
    const center = minCenter + Math.random() * (maxCenter - minCenter);

    pipe.reset(x, center - gapSize / 2, center + gapSize / 2);
    this._active.push(pipe);
  }

  _acquire() {
    return this._pool.find(p => !p.active) ?? null;
  }
}
