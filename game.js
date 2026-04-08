// game.js — entry point: loads config, wires all subsystems, owns the RAF loop

import StateMachine from './StateMachine.js';
import PhysicsSystem from './PhysicsSystem.js';
import PipeManager from './PipeManager.js';
import CloudManager from './CloudManager.js';
import ParticleSystem from './ParticleSystem.js';
import CollisionSystem from './CollisionSystem.js';
import ScoreManager from './ScoreManager.js';
import AudioManager from './AudioManager.js';
import Renderer, { ScorePop, ScreenShake, CollisionAnimation, AnimationState } from './Renderer.js';
import InputHandler from './InputHandler.js';

const DEFAULT_CONFIG = {
  canvas: { width: 480, height: 640 },
  physics: {
    gravity: 800,
    ascentVelocity: 300,
    terminalVelocity: 600,
    ghostyX: 120,
    ghostySize: 48,
    hitboxRadius: 12,
  },
  pipes: {
    width: 64,
    spacing: 350,
    gapSize: 140,
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
    sfxGain: 0.4,
    musicGain: 0.25,
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
    return { canvas: null, ctx: null };
  }

  canvas.width = config.canvas.width;
  canvas.height = config.canvas.height;

  return { canvas, ctx };
}

async function init() {
  const config = await loadConfig();
  const { canvas, ctx } = initCanvas(config);
  if (!ctx) return;

  // Subsystems
  const sm = new StateMachine();
  const physics = new PhysicsSystem(config.physics, config.canvas.height);
  const pipes = new PipeManager(config.pipes, config.canvas);
  const clouds = new CloudManager(config.clouds, config.canvas);
  const particles = new ParticleSystem(config.performance);
  const collision = new CollisionSystem(config);
  const score = new ScoreManager(config);
  const audio = new AudioManager(config);

  // Animation helpers
  const ANIM = { IDLE: [0, 1, 2], FLAP: [3, 4], DEATH: [5] };
  const anim = new AnimationState(ANIM.IDLE, 5);
  const scorePop = new ScorePop(config);
  const shake = new ScreenShake(config);
  const collisionAnim = new CollisionAnimation(config);

  // Renderer
  const renderer = new Renderer(ctx, config, {
    clouds, pipes, particles, physics, score,
    shake, scorePop, collisionAnim, anim,
  });

  // Start audio loading (non-blocking)
  audio.init();

  // Initial pipe spawn
  pipes.reset();

  function resetGame() {
    physics.reset();
    pipes.reset();
    particles.reset();
    score.reset();
    collision.reset();
    anim.set(ANIM.IDLE, 5);
    shake._t = 1;
    scorePop._t = 1;
    collisionAnim._t = 1;
  }

  // Input
  new InputHandler(sm, physics, audio, collision, anim, resetGame);

  let lastTime = 0;

  function loop(timestamp) {
    const dt = Math.min((timestamp - lastTime) / 1000, config.timing.maxDeltaTime);
    lastTime = timestamp;

    // Update per state
    const state = sm.state;

    if (state === 'PLAYING') {
      physics.update(dt);
      pipes.update(dt);
      clouds.update(dt);
      particles.update(dt);
      collision.update(dt);
      anim.update(dt);
      scorePop.update(dt);

      // Emit trail particle
      particles.emit(config.physics.ghostyX, physics.y);

      // Score check
      const scored = pipes.checkScoring(config.physics.ghostyX);
      if (scored > 0) {
        for (let i = 0; i < scored; i++) score.increment();
        audio.playScore();
        scorePop.trigger();
        pipes.setSpeed(pipes.getSpeed(score.score));
      }

      // Collision check
      if (collision.test(physics.y, pipes.pipes, config.canvas.height)) {
        sm.transition('COLLIDING');
        audio.stopMusic();
        audio.playGameOver();
        shake.trigger();
        collisionAnim.trigger();
        anim.set(ANIM.DEATH, 1);
        score.checkAndSave();
      }

    } else if (state === 'PAUSED') {
      // clouds.update(dt); // optional — keep frozen
    } else if (state === 'COLLIDING') {
      collisionAnim.update(dt);
      shake.update(dt);
      scorePop.update(dt);
      if (collisionAnim.done) {
        sm.transition('GAME_OVER');
      }
    } else if (state === 'START' || state === 'GAME_OVER') {
      clouds.update(dt);
    }

    renderer.draw(state);
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
}

init();
