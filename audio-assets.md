# Audio Asset Specifications

## Overview

All sounds target a retro/chiptune aesthetic. SFX are short and punchy; background music loops seamlessly. Assets are loaded via Web Audio API (`fetch` + `decodeAudioData`) except background music which uses an HTML `<audio>` element.

---

## Sound Effects

### Flap Sound (`assets/jump.wav`)
- Duration: 0.1 s
- Character: short whoosh — a quick upward sweep of white noise with a soft attack and fast decay
- Synthesis (Web Audio API):
  - Noise burst filtered through a bandpass filter sweeping from 800 Hz → 2400 Hz over 0.1 s
  - Envelope: attack 0.005 s, decay 0.095 s, sustain 0, release 0
  - Gain: 0.4
- Existing asset: `assets/jump.wav` — use as-is if it matches the above character; otherwise replace

### Score Sound (`assets/score.wav`)
- Duration: 0.2 s
- Character: pleasant chime — a clean, bright tone with a short tail, reminiscent of a coin collect
- Synthesis (Web Audio API oscillator — no file asset needed):
  - Oscillator type: `sine`
  - Frequency: 880 Hz for 0.1 s, then jump to 1320 Hz for 0.1 s (two-note ascending chime)
  - Envelope: attack 0.005 s, decay 0.15 s, sustain 0.1, release 0.05 s
  - Gain: 0.35
- Note: synthesized inline in `AudioManager.playScore()` — no external file required

### Collision Sound (`assets/game_over.wav`)
- Duration: 0.3 s
- Character: soft thud — a low-frequency impact with a short rumble, not harsh or jarring
- Synthesis (Web Audio API):
  - Low-frequency sine burst: 80 Hz, gain envelope attack 0.01 s, decay 0.29 s
  - Layered with a short noise burst (10 ms) at gain 0.2 for impact texture
  - Overall gain: 0.5
- Existing asset: `assets/game_over.wav` — use as-is if it matches the above character; otherwise replace

---

## Background Music (`assets/music.ogg`)

- Duration: 8–12 s loop (seamless)
- Character: upbeat chiptune — 4/4 time, ~140 BPM, major key, retro square/pulse wave melody over a simple bass line and kick pattern
- Format: `.ogg` primary, `.mp3` fallback
- Loop point: end of file loops back to start with no gap (use `<audio loop>`)
- Playback: starts on first player input (autoplay policy), pauses on PAUSED state, stops on START/GAME_OVER screens
- Gain: 0.25 (quieter than SFX to avoid masking gameplay feedback)
- Sourcing options (in order of preference):
  1. Generate using a chiptune tool (e.g. BeepBox, FamiTracker, PICO-8 music editor)
  2. Use a royalty-free chiptune from OpenGameArt.org (CC0 license)
  3. Synthesize procedurally via Web Audio API `OscillatorNode` sequence (fallback if no file available)

---

## Implementation Notes

- All SFX use `AudioBufferSourceNode` clones so rapid re-triggering (e.g. fast flapping) never cuts off a previous instance
- `AudioContext` is created once at startup; `resume()` is called on first user interaction to satisfy browser autoplay policy
- All audio calls are wrapped in try/catch — a missing or failed asset silently skips that sound without crashing
- Volume levels are tunable via `config.json` (add `"audio": { "sfxGain": 0.4, "musicGain": 0.25 }` if per-channel control is needed)
