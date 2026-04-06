// PhysicsSystem — owns Ghosty's vertical position and velocity

export default class PhysicsSystem {
  constructor(config, canvasHeight) {
    this._config = config;
    this._canvasHeight = canvasHeight;
    this._initialY = canvasHeight / 2;

    this.y = this._initialY;
    this.vy = 0;
  }

  update(dt) {
    this.vy += this._config.gravity * dt;
    this.vy = Math.min(this.vy, this._config.terminalVelocity);
    this.y += this.vy * dt;
  }

  jump() {
    this.vy = -this._config.ascentVelocity;
  }

  reset() {
    this.y = this._initialY;
    this.vy = 0;
  }
}
