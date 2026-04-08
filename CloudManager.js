// CloudManager — parallax cloud layers with wrap-around scrolling

export class Cloud {
  constructor(x, y, width, height, alpha) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.alpha = alpha;
  }
}

export class CloudLayer {
  constructor(speed, count, canvasW, canvasH, alphaMin, alphaMax) {
    this.speed = speed;
    this._canvasW = canvasW;
    this.clouds = [];
    for (let i = 0; i < count; i++) {
      const w = 60 + Math.random() * 80;
      const h = 20 + Math.random() * 20;
      const x = Math.random() * canvasW;
      const y = 40 + Math.random() * (canvasH * 0.5);
      const alpha = alphaMin + Math.random() * (alphaMax - alphaMin);
      this.clouds.push(new Cloud(x, y, w, h, alpha));
    }
  }

  update(dt) {
    for (const cloud of this.clouds) {
      cloud.x -= this.speed * dt;
      // Wrap: when fully off left edge, reposition to right edge
      if (cloud.x + cloud.width < 0) {
        cloud.x = this._canvasW + cloud.width;
      }
    }
  }

  draw(ctx) {
    for (const cloud of this.clouds) {
      ctx.globalAlpha = cloud.alpha;
      ctx.fillStyle = '#e8e8f0';
      ctx.beginPath();
      ctx.ellipse(cloud.x, cloud.y, cloud.width / 2, cloud.height / 2, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;
  }
}

export default class CloudManager {
  constructor(cloudConfigs, canvas) {
    // cloudConfigs: array of { speed, count }
    const alphaRanges = [[0.15, 0.20], [0.25, 0.35]];
    this.layers = cloudConfigs.map((cfg, i) => {
      const [aMin, aMax] = alphaRanges[i] ?? [0.15, 0.35];
      return new CloudLayer(cfg.speed, cfg.count, canvas.width, canvas.height, aMin, aMax);
    });
  }

  update(dt) {
    for (const layer of this.layers) {
      layer.update(dt);
    }
  }

  draw(ctx) {
    for (const layer of this.layers) {
      layer.draw(ctx);
    }
  }
}
