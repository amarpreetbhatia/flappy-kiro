// Tests for CollisionSystem — P8 property test + invincibility unit tests

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import CollisionSystem from '../CollisionSystem.js';

const CONFIG = {
  physics: { ghostyX: 120, hitboxRadius: 12 },
  pipes: { width: 64 },
  timing: { invincibilitySecs: 2.0 },
};
const CANVAS_H = 640;

function makeCollision() {
  return new CollisionSystem(CONFIG);
}

// Helper: build a minimal pipe-like object
function makePipe(x, gapTop, gapBottom) {
  return { x, gapTop, gapBottom, active: true };
}

// ─── Property Tests ───────────────────────────────────────────────────────────

// Feature: flappy-kiro, Property 8: Collision detection is correct for all surfaces
// Validates: Requirements 4.3, 4.4, 4.5
describe('CollisionSystem — P8: collision detection correctness', () => {
  it('detects ground collision when cy + r >= canvasH', () => {
    const col = makeCollision();
    // Place Ghosty so circle bottom touches ground
    const y = CANVAS_H - CONFIG.physics.hitboxRadius;
    expect(col.test(y, [], CANVAS_H)).toBe(true);
  });

  it('detects ceiling collision when cy - r <= 0', () => {
    const col = makeCollision();
    const y = CONFIG.physics.hitboxRadius;
    expect(col.test(y, [], CANVAS_H)).toBe(true);
  });

  it('detects pipe collision when circle overlaps top pipe rect', () => {
    const col = makeCollision();
    // Pipe at ghostyX - 10 so circle center is inside pipe x range
    const pipeX = CONFIG.physics.ghostyX - 10;
    const gapTop = 200; // top pipe goes from 0 to 200
    const pipe = makePipe(pipeX, gapTop, gapTop + 140);
    // Place Ghosty just inside the top pipe
    const y = gapTop - 5; // cy is 5px above gapTop, circle r=12 overlaps
    expect(col.test(y, [pipe], CANVAS_H)).toBe(true);
  });

  it('no collision when Ghosty is safely in the gap', () => {
    const col = makeCollision();
    const pipeX = CONFIG.physics.ghostyX - 10;
    const gapTop = 200;
    const gapBottom = 340;
    const pipe = makePipe(pipeX, gapTop, gapBottom);
    // Ghosty center in middle of gap, well away from edges
    const y = (gapTop + gapBottom) / 2;
    expect(col.test(y, [pipe], CANVAS_H)).toBe(false);
  });

  it('P8 property: circle-vs-rect math is consistent with manual calculation', () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(50), max: Math.fround(590), noNaN: true }), // physicsY
        fc.float({ min: Math.fround(0), max: Math.fround(300), noNaN: true }),  // gapTop
        (physicsY, gapTop) => {
          const col = makeCollision();
          const gapBottom = gapTop + 140;
          const pipeX = CONFIG.physics.ghostyX - 10; // pipe overlaps ghostyX
          const pipe = makePipe(pipeX, gapTop, gapBottom);

          const { cx, cy, r } = col.getCircle(physicsY);

          // Manual ceiling/ground
          const hitCeiling = cy - r <= 0;
          const hitGround = cy + r >= CANVAS_H;

          // Manual top pipe
          const clampX1 = Math.max(pipeX, Math.min(cx, pipeX + CONFIG.pipes.width));
          const clampY1 = Math.max(0, Math.min(cy, gapTop));
          const dx1 = cx - clampX1, dy1 = cy - clampY1;
          const hitTop = (dx1 * dx1 + dy1 * dy1) < (r * r);

          // Manual bottom pipe
          const clampX2 = Math.max(pipeX, Math.min(cx, pipeX + CONFIG.pipes.width));
          const clampY2 = Math.max(gapBottom, Math.min(cy, CANVAS_H));
          const dx2 = cx - clampX2, dy2 = cy - clampY2;
          const hitBot = (dx2 * dx2 + dy2 * dy2) < (r * r);

          const expected = hitCeiling || hitGround || hitTop || hitBot;
          expect(col.test(physicsY, [pipe], CANVAS_H)).toBe(expected);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: flappy-kiro, Property 9: Invincibility suppresses all collisions
// Validates: Requirements 4.6
describe('CollisionSystem — invincibility', () => {
  it('returns false when invincible, even at ground', () => {
    const col = makeCollision();
    col.startInvincibility();
    // Ground collision position
    const y = CANVAS_H - CONFIG.physics.hitboxRadius;
    expect(col.test(y, [], CANVAS_H)).toBe(false);
  });

  it('invincibility timer counts down and disables after expiry', () => {
    const col = makeCollision();
    col.startInvincibility();
    expect(col.invincible).toBe(true);

    // Advance past invincibility duration
    col.update(1.0);
    expect(col.invincible).toBe(true); // still active at 1s

    col.update(1.1); // total 2.1s > 2.0s
    expect(col.invincible).toBe(false);
  });

  it('reset() clears invincibility', () => {
    const col = makeCollision();
    col.startInvincibility();
    col.reset();
    expect(col.invincible).toBe(false);
    expect(col.invincibilityTimer).toBe(0);
  });
});
