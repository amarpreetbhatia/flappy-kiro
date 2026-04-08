// CollisionSystem — circle-vs-rect collision detection with invincibility window

export default class CollisionSystem {
  constructor(config) {
    this._config = config;
    this._invincible = false;
    this._timer = 0;
  }

  get invincible() { return this._invincible; }
  get invincibilityTimer() { return this._timer; }

  update(dt) {
    if (this._invincible) {
      this._timer -= dt;
      if (this._timer <= 0) {
        this._timer = 0;
        this._invincible = false;
      }
    }
  }

  startInvincibility() {
    this._invincible = true;
    this._timer = this._config.timing.invincibilitySecs;
  }

  reset() {
    this._invincible = false;
    this._timer = 0;
  }

  getCircle(physicsY) {
    return {
      cx: this._config.physics.ghostyX,
      cy: physicsY,
      r:  this._config.physics.hitboxRadius,
    };
  }

  test(physicsY, pipes, canvasH) {
    if (this._invincible) return false;

    const { cx, cy, r } = this.getCircle(physicsY);

    // Ceiling and ground
    if (cy - r <= 0) return true;
    if (cy + r >= canvasH) return true;

    // Circle-vs-rect for each pipe pair
    const pw = this._config.pipes.width;
    for (const pipe of pipes) {
      if (!pipe.active) continue;
      // Top pipe rect: x, 0, pw, gapTop
      if (_circleHitsRect(cx, cy, r, pipe.x, 0, pw, pipe.gapTop)) return true;
      // Bottom pipe rect: x, gapBottom, pw, canvasH - gapBottom
      if (_circleHitsRect(cx, cy, r, pipe.x, pipe.gapBottom, pw, canvasH - pipe.gapBottom)) return true;
    }

    return false;
  }
}

function _circleHitsRect(cx, cy, r, rx, ry, rw, rh) {
  const clampedX = Math.max(rx, Math.min(cx, rx + rw));
  const clampedY = Math.max(ry, Math.min(cy, ry + rh));
  const dx = cx - clampedX;
  const dy = cy - clampedY;
  return (dx * dx + dy * dy) < (r * r);
}
