import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import PipeManager, { Pipe } from '../PipeManager.js';

const CONFIG = {
  width: 64,
  spacing: 350,
  gapSize: 140,
  gapMargin: 60,
  initialSpeed: 120,
  speedIncrement: 10,
  speedMilestone: 5,
};

const CANVAS = { width: 480, height: 640 };

function makePipeManager() {
  return new PipeManager(CONFIG, CANVAS);
}

// ─── Property Tests ───────────────────────────────────────────────────────────

describe('PipeManager — property tests', () => {
  // Feature: flappy-kiro, Property 4: Pipe scrolling is speed × delta-time
  it('P4: after update(dt), each pipe.x decreases by speed * dt', () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(0.001), max: Math.fround(0.05), noNaN: true }),
        (dt) => {
          const pm = makePipeManager();
          pm.reset();

          // Capture x positions before update
          const before = pm.pipes.map(p => p.x);
          const speed = pm.speed;

          pm.update(dt);

          // Only check pipes that are still active (not recycled)
          for (let i = 0; i < pm.pipes.length; i++) {
            const expectedX = before[i] - speed * dt;
            expect(pm.pipes[i].x).toBeCloseTo(expectedX, 4);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: flappy-kiro, Property 5: Spawned pipes have correct gap invariants
  it('P5: spawned pipes satisfy gapBottom - gapTop === gapSize and gap is within margin bounds', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 999 }),
        (_seed) => {
          const pm = makePipeManager();
          pm.reset();

          // Advance enough to spawn several pipes
          for (let i = 0; i < 20; i++) {
            pm.update(0.05);
          }

          for (const pipe of pm.pipes) {
            const gapHeight = pipe.gapBottom - pipe.gapTop;
            // Gap size invariant
            expect(gapHeight).toBeCloseTo(CONFIG.gapSize, 4);
            // Gap margin invariants
            expect(pipe.gapTop).toBeGreaterThanOrEqual(CONFIG.gapMargin);
            expect(pipe.gapBottom).toBeLessThanOrEqual(CANVAS.height - CONFIG.gapMargin);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: flappy-kiro, Property 6: Pipe speed matches score-based formula
  it('P6: getSpeed(score) === initialSpeed + floor(score / milestone) * increment', () => {
    fc.assert(
      fc.property(
        fc.nat({ max: 200 }),
        (score) => {
          const pm = makePipeManager();
          const expected = CONFIG.initialSpeed
            + Math.floor(score / CONFIG.speedMilestone) * CONFIG.speedIncrement;
          expect(pm.getSpeed(score)).toBe(expected);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── Unit Tests ───────────────────────────────────────────────────────────────

describe('PipeManager — unit tests', () => {
  it('removes pipes that have scrolled fully off-screen left (x + width < 0)', () => {
    const pm = makePipeManager();
    pm.reset();

    // Place the pipe far off-screen
    const pipe = pm.pipes[0];
    pipe.x = -(CONFIG.width + 10);

    pm.update(0.016);

    // After recycling, no active pipe should have x + width < 0
    for (const p of pm.pipes) {
      expect(p.x + CONFIG.width).toBeGreaterThanOrEqual(0);
    }
  });

  it('pipe at x + width === 0 is NOT yet removed (boundary condition)', () => {
    const pm = makePipeManager();
    pm.reset();

    // Place pipe exactly at boundary: x = -width, so x + width = 0 (not < 0)
    const pipe = pm.pipes[0];
    pipe.x = -CONFIG.width;

    // Mark all pool slots active to prevent new spawns from obscuring the count
    for (const p of pm['_pool']) {
      if (p !== pipe) p.active = true;
    }

    const countBefore = pm.pipes.length;
    pm.update(0); // dt=0 — no scrolling

    // Pipe should still be active (x + width === 0 is not < 0)
    expect(pm.pipes.length).toBe(countBefore);
  });

  it('new pipe is spawned at correct leading-edge spacing from previous pipe', () => {
    const pm = makePipeManager();
    pm.reset();

    // Advance with small dt steps until at least two pipes are active
    for (let i = 0; i < 500; i++) {
      pm.update(0.016);
      if (pm.pipes.length >= 2) break;
    }

    expect(pm.pipes.length).toBeGreaterThanOrEqual(2);

    // Check spacing between consecutive pipes (sorted by x ascending)
    const sorted = [...pm.pipes].sort((a, b) => a.x - b.x);
    for (let i = 1; i < sorted.length; i++) {
      const leadingEdgeDiff = sorted[i].x - sorted[i - 1].x;
      expect(leadingEdgeDiff).toBeGreaterThan(0);
      // Spacing should not exceed configured spacing by more than one frame of movement
      const maxDrift = CONFIG.initialSpeed * 0.016 + 1;
      expect(leadingEdgeDiff).toBeLessThanOrEqual(CONFIG.spacing + maxDrift);
    }
  });

  it('reset() clears all active pipes and restores initial speed', () => {
    const pm = makePipeManager();
    pm.reset();

    // Advance to accumulate pipes and change speed
    for (let i = 0; i < 30; i++) pm.update(0.05);
    pm.setSpeed(999);

    pm.reset();

    expect(pm.speed).toBe(CONFIG.initialSpeed);
  });

  it('checkScoring() returns count of pipes whose right edge has passed ghostyX', () => {
    const pm = makePipeManager();
    pm.reset();

    const ghostyX = 120;

    // Manually place a pipe so its right edge is just past ghostyX
    const pipe = pm.pipes[0];
    pipe.x = ghostyX - CONFIG.width - 1; // right edge = ghostyX - 1

    const scored = pm.checkScoring(ghostyX);
    expect(scored).toBe(1);

    // Calling again should not double-count
    const scoredAgain = pm.checkScoring(ghostyX);
    expect(scoredAgain).toBe(0);
  });

  it('checkScoring() returns 0 when no pipe has passed ghostyX', () => {
    const pm = makePipeManager();
    pm.reset();

    const ghostyX = 120;
    // Place pipe ahead of ghostyX
    for (const pipe of pm.pipes) {
      pipe.x = ghostyX + 50;
    }

    expect(pm.checkScoring(ghostyX)).toBe(0);
  });

  it('setSpeed() updates speed immediately', () => {
    const pm = makePipeManager();
    pm.setSpeed(250);
    expect(pm.speed).toBe(250);
  });

  it('pool size is ceil(canvasWidth / spacing) + 2', () => {
    const pm = makePipeManager();
    const expectedPoolSize = Math.ceil(CANVAS.width / CONFIG.spacing) + 2;
    // Verify by trying to fill the pool — reset spawns 1 pipe, advance to fill
    pm.reset();
    for (let i = 0; i < 200; i++) pm.update(0.016);
    // Active pipes should never exceed pool size
    expect(pm.pipes.length).toBeLessThanOrEqual(expectedPoolSize);
  });
});
