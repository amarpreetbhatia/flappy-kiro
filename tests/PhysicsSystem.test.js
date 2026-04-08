import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import PhysicsSystem from '../PhysicsSystem.js';

const CONFIG = {
  gravity: 800,
  ascentVelocity: 300,
  terminalVelocity: 600,
};
const CANVAS_HEIGHT = 640;

describe('PhysicsSystem', () => {
  // Feature: flappy-kiro, Property 1: Gravity integration with terminal velocity clamp
  it('P1: after update(dt), vy = min(vy + gravity * dt, terminalVelocity)', () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(-1000), max: Math.fround(1000), noNaN: true }),  // initial vy
        fc.float({ min: Math.fround(0.001), max: Math.fround(0.05), noNaN: true }), // dt
        (initialVy, dt) => {
          const physics = new PhysicsSystem(CONFIG, CANVAS_HEIGHT);
          physics.vy = initialVy;

          physics.update(dt);

          const expected = Math.min(initialVy + CONFIG.gravity * dt, CONFIG.terminalVelocity);
          expect(physics.vy).toBeCloseTo(expected, 5);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: flappy-kiro, Property 2: Jump always sets velocity to ascent value
  // Validates: Requirements 2.2
  it('P2: jump() sets vy to -ascentVelocity regardless of prior velocity', () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(-1000), max: Math.fround(1000), noNaN: true }),
        (initialVy) => {
          const physics = new PhysicsSystem(CONFIG, CANVAS_HEIGHT);
          physics.vy = initialVy;
          physics.jump();
          expect(physics.vy).toBe(-CONFIG.ascentVelocity);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: flappy-kiro, Property 3: Position integration is velocity × delta-time
  // Validates: Requirements 2.5
  it('P3: after update(dt), y increases by vy_after_gravity_clamp * dt', () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(0), max: Math.fround(640), noNaN: true }),    // initial y
        fc.float({ min: Math.fround(-600), max: Math.fround(600), noNaN: true }), // initial vy
        fc.float({ min: Math.fround(0.001), max: Math.fround(0.05), noNaN: true }), // dt
        (initialY, initialVy, dt) => {
          const physics = new PhysicsSystem(CONFIG, CANVAS_HEIGHT);
          physics.y = initialY;
          physics.vy = initialVy;

          // Compute expected: gravity clamp first, then integrate
          const vyAfter = Math.min(initialVy + CONFIG.gravity * dt, CONFIG.terminalVelocity);
          const expectedY = initialY + vyAfter * dt;

          physics.update(dt);

          expect(physics.y).toBeCloseTo(expectedY, 4);
        }
      ),
      { numRuns: 100 }
    );
  });
});
