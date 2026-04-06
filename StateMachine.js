// StateMachine — manages game phase transitions

const VALID_TRANSITIONS = {
  'START':     ['PLAYING'],
  'PLAYING':   ['PAUSED', 'COLLIDING'],
  'PAUSED':    ['PLAYING'],
  'COLLIDING': ['GAME_OVER'],
  'GAME_OVER': ['START'],
};

export default class StateMachine {
  constructor() {
    this.state = 'START';
  }

  transition(newState) {
    const valid = VALID_TRANSITIONS[this.state];
    if (!valid?.includes(newState)) return;
    this.state = newState;
  }

  update(dt) {
    // stub — will be filled in task 14.1
  }
}
