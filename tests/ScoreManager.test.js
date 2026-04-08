// Tests for ScoreManager — score increment, high score persistence, localStorage safety

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';
import ScoreManager from '../ScoreManager.js';

const CONFIG = { audio: { lsKey: 'flappyKiro_highScore' } };

// Mock localStorage for tests
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (k) => store[k] ?? null,
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
    clear: () => { store = {}; },
  };
})();

beforeEach(() => {
  vi.stubGlobal('localStorage', localStorageMock);
  localStorageMock.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// Feature: flappy-kiro, Property 10: Score increments by exactly one per pipe passed
// Validates: Requirements 5.1
describe('ScoreManager — P10: score increment', () => {
  it('increment() increases score by exactly 1', () => {
    fc.assert(
      fc.property(
        fc.nat({ max: 1000 }),
        (initialScore) => {
          const sm = new ScoreManager(CONFIG);
          sm.score = initialScore;
          sm.increment();
          expect(sm.score).toBe(initialScore + 1);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: flappy-kiro, Property 11: High score persistence
// Validates: Requirements 5.3, 5.4, 5.5
describe('ScoreManager — high score persistence', () => {
  it('checkAndSave() updates highScore and localStorage when score > highScore', () => {
    const sm = new ScoreManager(CONFIG);
    sm.score = 10;
    sm.highScore = 5;
    const isNew = sm.checkAndSave();
    expect(isNew).toBe(true);
    expect(sm.highScore).toBe(10);
    expect(localStorageMock.getItem('flappyKiro_highScore')).toBe('10');
  });

  it('checkAndSave() does not update when score <= highScore', () => {
    const sm = new ScoreManager(CONFIG);
    sm.score = 3;
    sm.highScore = 10;
    const isNew = sm.checkAndSave();
    expect(isNew).toBe(false);
    expect(sm.highScore).toBe(10);
  });

  it('loadHighScore() reads from localStorage', () => {
    localStorageMock.setItem('flappyKiro_highScore', '42');
    const sm = new ScoreManager(CONFIG);
    expect(sm.highScore).toBe(42);
  });

  it('localStorage errors do not throw', () => {
    const brokenStorage = {
      getItem: () => { throw new Error('no storage'); },
      setItem: () => { throw new Error('no storage'); },
    };
    vi.stubGlobal('localStorage', brokenStorage);
    expect(() => {
      const sm = new ScoreManager(CONFIG);
      sm.score = 5;
      sm.checkAndSave();
    }).not.toThrow();
  });

  it('reset() zeroes score but preserves highScore', () => {
    const sm = new ScoreManager(CONFIG);
    sm.score = 7;
    sm.highScore = 15;
    sm.reset();
    expect(sm.score).toBe(0);
    expect(sm.highScore).toBe(15);
  });
});
