import { describe, it, expect, beforeEach } from 'vitest';
import StateMachine from '../StateMachine.js';

describe('StateMachine', () => {
  let sm;

  beforeEach(() => {
    sm = new StateMachine();
  });

  // 1. Initial state
  it('initial state is START', () => {
    expect(sm.state).toBe('START');
  });

  // Valid transitions
  it('START → PLAYING is valid', () => {
    sm.transition('PLAYING');
    expect(sm.state).toBe('PLAYING');
  });

  it('PLAYING → PAUSED is valid', () => {
    sm.transition('PLAYING');
    sm.transition('PAUSED');
    expect(sm.state).toBe('PAUSED');
  });

  it('PAUSED → PLAYING is valid', () => {
    sm.transition('PLAYING');
    sm.transition('PAUSED');
    sm.transition('PLAYING');
    expect(sm.state).toBe('PLAYING');
  });

  it('PLAYING → COLLIDING is valid', () => {
    sm.transition('PLAYING');
    sm.transition('COLLIDING');
    expect(sm.state).toBe('COLLIDING');
  });

  it('COLLIDING → GAME_OVER is valid', () => {
    sm.transition('PLAYING');
    sm.transition('COLLIDING');
    sm.transition('GAME_OVER');
    expect(sm.state).toBe('GAME_OVER');
  });

  it('GAME_OVER → START is valid', () => {
    sm.transition('PLAYING');
    sm.transition('COLLIDING');
    sm.transition('GAME_OVER');
    sm.transition('START');
    expect(sm.state).toBe('START');
  });

  // Invalid transitions — silently ignored
  it('invalid transition START → PAUSED is ignored', () => {
    sm.transition('PAUSED');
    expect(sm.state).toBe('START');
  });

  it('invalid transition PLAYING → GAME_OVER is ignored', () => {
    sm.transition('PLAYING');
    sm.transition('GAME_OVER');
    expect(sm.state).toBe('PLAYING');
  });

  it('invalid transition GAME_OVER → PLAYING is ignored', () => {
    sm.transition('PLAYING');
    sm.transition('COLLIDING');
    sm.transition('GAME_OVER');
    sm.transition('PLAYING');
    expect(sm.state).toBe('GAME_OVER');
  });
});
