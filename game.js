// game.js — entry point: loads config, detects canvas support, wires subsystems

import StateMachine from './StateMachine.js';

const DEFAULT_CONFIG = {
  canvas: {
    width: 480,
    height: 640,
  },
  physics: {
    gravity: 800,
    ascentVelocity: 300,
    terminalVelocity: 600,
    ghostyX: 120,
    ghostySize: 48,
    hitboxRadius: 12,
    maxDeltaTime: 0.05,
  },
  pipes: {
    width: 64,
    spacing: 280,
    gapSize: 160,
    gapMargin: 60,
    initialSpeed: 120,
    speedIncrement: 10,
    speedMilestone: 5,
  },
  timing: {
    invincibilitySecs: 2.0,
    collisionAnimSecs: 0.6,
    screenShakeSecs: 0.4,
    screenShakeMag: 8,
    particleLifetime: 0.4,
    scorePopSecs: 0.3,
    maxDeltaTime: 0.05,
  },
  clouds: [
    { speed: 30, count: 4 },
    { speed: 60, count: 3 },
  ],
  audio: {
    lsKey: 'flappyKiro_highScore',
  },
  performance: {
    particlePoolSize: 128,
    targetFps: 60,
  },
};

async function loadConfig() {
  try {
    const res = await fetch('config.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[FlappyKiro] Could not load config.json, using defaults.', err);
    return DEFAULT_CONFIG;
  }
}

function initCanvas(config) {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  if (ctx === null) {
    const fallback = document.getElementById('canvas-fallback');
    canvas.style.display = 'none';
    fallback.style.display = 'block';
    return null;
  }

  canvas.width = config.canvas.width;
  canvas.height = config.canvas.height;

  return ctx;
}

async function init() {
  const config = await loadConfig();
  const ctx = initCanvas(config);

  if (ctx === null) {
    return;
  }

  const stateMachine = new StateMachine();
  const renderer = { draw(state) {} };

  let lastTime = 0;

  function loop(timestamp) {
    const dt = Math.min((timestamp - lastTime) / 1000, config.timing.maxDeltaTime);
    lastTime = timestamp;
    stateMachine.update(dt);
    renderer.draw(stateMachine.state);
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
}

init();
