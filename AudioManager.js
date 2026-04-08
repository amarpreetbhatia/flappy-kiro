// AudioManager — Web Audio API for SFX, HTML audio for background music

export default class AudioManager {
  constructor(config) {
    this._sfxGain = config.audio.sfxGain ?? 0.4;
    this._musicGain = config.audio.musicGain ?? 0.25;
    this._ctx = null;
    this._jumpBuf = null;
    this._gameOverBuf = null;
    this._music = null;
    this._ready = false;
  }

  async init() {
    try {
      this._ctx = new (window.AudioContext || window.webkitAudioContext)();
      this._gainNode = this._ctx.createGain();
      this._gainNode.gain.value = this._sfxGain;
      this._gainNode.connect(this._ctx.destination);

      const [jumpBuf, gameOverBuf] = await Promise.all([
        this._loadBuffer('assets/jump.wav'),
        this._loadBuffer('assets/game_over.wav'),
      ]);
      this._jumpBuf = jumpBuf;
      this._gameOverBuf = gameOverBuf;
    } catch {
      // audio unavailable — game continues silently
    }

    // HTML audio for background music
    try {
      this._music = new Audio('assets/music.ogg');
      this._music.loop = true;
      this._music.volume = this._musicGain;
    } catch {
      this._music = null;
    }

    this._ready = true;
  }

  async _loadBuffer(url) {
    const res = await fetch(url);
    const arrayBuf = await res.arrayBuffer();
    return await this._ctx.decodeAudioData(arrayBuf);
  }

  _playBuffer(buf) {
    if (!this._ctx || !buf) return;
    try {
      if (this._ctx.state === 'suspended') this._ctx.resume();
      const src = this._ctx.createBufferSource();
      src.buffer = buf;
      src.connect(this._gainNode);
      src.start();
    } catch {
      // silently skip
    }
  }

  resumeContext() {
    try {
      if (this._ctx && this._ctx.state === 'suspended') {
        this._ctx.resume();
      }
    } catch {
      // ignore
    }
  }

  playJump() { this._playBuffer(this._jumpBuf); }
  playGameOver() { this._playBuffer(this._gameOverBuf); }

  playScore() {
    if (!this._ctx) return;
    try {
      if (this._ctx.state === 'suspended') this._ctx.resume();
      const osc = this._ctx.createOscillator();
      const gain = this._ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(880, this._ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1320, this._ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(this._sfxGain * 0.5, this._ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this._ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(this._ctx.destination);
      osc.start();
      osc.stop(this._ctx.currentTime + 0.12);
    } catch {
      // silently skip
    }
  }

  playMusic() {
    if (!this._music) return;
    try { this._music.currentTime = 0; this._music.play(); } catch { /* ignore */ }
  }

  pauseMusic() {
    if (!this._music) return;
    try { this._music.pause(); } catch { /* ignore */ }
  }

  resumeMusic() {
    if (!this._music) return;
    try { this._music.play(); } catch { /* ignore */ }
  }

  stopMusic() {
    if (!this._music) return;
    try { this._music.pause(); this._music.currentTime = 0; } catch { /* ignore */ }
  }
}
