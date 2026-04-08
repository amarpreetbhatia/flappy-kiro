// ParticleSystem — fixed-size circular buffer of trail particles

export class Particle {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.life = 0;      // 0 = inactive
    this.maxLife = 0.4;
  }
}

export default class ParticleSystem {
  constructor(config) {
    this._buf = Array.from({ length: config.performance.particlePoolSize }, () => new Particle());
    this._head = 0;
  }

  emit(x, y) {
    const p = this._buf[this._head % this._buf.length];
    p.x = x + (Math.random() - 0.5) * 8;
    p.y = y + (Math.random() - 0.5) * 8;
    p.vx = (Math.random() - 0.5) * 20;
    p.vy = (Math.random() - 0.5) * 20;
    p.life = 1.0;
    p.maxLife = 0.3 + Math.random() * 0.2; // 0.3–0.5 s
    this._head++;
  }

  update(dt) {
    for (let i = 0; i < this._buf.length; i++) {
      const p = this._buf[i];
      if (p.life <= 0) continue;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt / p.maxLife;
      if (p.life < 0) p.life = 0;
    }
  }

  draw(ctx) {
    ctx.fillStyle = '#c8c8e0';
    for (let i = 0; i < this._buf.length; i++) {
      const p = this._buf[i];
      if (p.life <= 0) continue;
      ctx.globalAlpha = p.life * 0.6;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;
  }

  reset() {
    for (const p of this._buf) {
      p.life = 0;
    }
    this._head = 0;
  }
}
