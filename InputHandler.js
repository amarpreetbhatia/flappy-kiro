// InputHandler — keyboard and touch input, routed by game state

export default class InputHandler {
  constructor(stateMachine, physics, audio, collision, anim, resetGame) {
    this._sm = stateMachine;
    this._physics = physics;
    this._audio = audio;
    this._collision = collision;
    this._anim = anim;
    this._resetGame = resetGame;

    this._onKeyDown = this._onKeyDown.bind(this);
    this._onTouch = this._onTouch.bind(this);

    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('touchstart', this._onTouch, { passive: true });
  }

  _onAction() {
    const state = this._sm.state;
    this._audio.resumeContext();

    if (state === 'START') {
      this._sm.transition('PLAYING');
      this._physics.jump();
      this._audio.playMusic();
      this._collision.startInvincibility();
      if (this._anim) this._anim.set([3, 4], 16);
    } else if (state === 'PLAYING') {
      this._physics.jump();
      this._audio.playJump();
      if (this._anim) this._anim.set([3, 4], 16);
    } else if (state === 'GAME_OVER') {
      this._resetGame();
      this._sm.transition('START');
    }
    // PAUSED and COLLIDING: ignore
  }

  _onPause() {
    const state = this._sm.state;
    if (state === 'PLAYING') {
      this._sm.transition('PAUSED');
      this._audio.pauseMusic();
    } else if (state === 'PAUSED') {
      this._sm.transition('PLAYING');
      this._audio.resumeMusic();
    }
  }

  _onKeyDown(e) {
    if (e.code === 'Space') {
      e.preventDefault();
      this._onAction();
    } else if (e.code === 'Escape' || e.code === 'KeyP') {
      this._onPause();
    }
  }

  _onTouch(e) {
    e.preventDefault && e.preventDefault();
    this._onAction();
  }
}
