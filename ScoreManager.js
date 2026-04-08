// ScoreManager — tracks score, persists high score to localStorage

export default class ScoreManager {
  constructor(config) {
    this._key = config.audio.lsKey;
    this.score = 0;
    this.highScore = 0;
    this.loadHighScore();
  }

  increment() {
    this.score++;
  }

  loadHighScore() {
    try {
      const raw = localStorage.getItem(this._key);
      const parsed = raw !== null ? parseInt(raw, 10) : 0;
      this.highScore = isNaN(parsed) ? 0 : parsed;
    } catch {
      this.highScore = 0;
    }
  }

  saveHighScore() {
    try {
      localStorage.setItem(this._key, String(this.highScore));
    } catch {
      // in-memory highScore still updated
    }
  }

  // Returns true if a new high score was set
  checkAndSave() {
    if (this.score > this.highScore) {
      this.highScore = this.score;
      this.saveHighScore();
      return true;
    }
    return false;
  }

  reset() {
    this.score = 0;
  }
}
