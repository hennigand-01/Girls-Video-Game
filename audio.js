// Retro & Cute Web Audio Synthesizer
// Completely self-contained: no external audio files required!

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.soundEnabled = true;
    this.musicEnabled = true;
    this.musicTimer = null;
    this.musicStep = 0;
    this.bgAudio = null; // Custom user soundtrack
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Play a synthesized tone with frequency curve and envelope
  playTone(freqStart, freqEnd, duration, type = 'sine', volume = 0.2, detune = 0) {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.detune.setValueAtTime(detune, t);
    osc.frequency.setValueAtTime(freqStart, t);
    if (freqEnd !== freqStart) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 20), t + duration);
    }

    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + duration);
  }

  // Player Jump: cheerful upward boing
  playJump() {
    this.playTone(220, 580, 0.18, 'triangle', 0.25);
  }

  // Super Spring Jump: sparkly double boing
  playSuperJump() {
    this.playTone(300, 800, 0.25, 'triangle', 0.3);
    setTimeout(() => {
      this.playTone(600, 1200, 0.2, 'sine', 0.2);
    }, 60);
  }

  // Jumped Over Barrel: happy chime chord!
  playJumpOverBarrel() {
    this.playTone(523.25, 523.25, 0.12, 'triangle', 0.2); // C5
    setTimeout(() => this.playTone(659.25, 659.25, 0.12, 'triangle', 0.2), 60); // E5
    setTimeout(() => this.playTone(783.99, 783.99, 0.2, 'sine', 0.25), 120); // G5
  }

  // Barrel Bounce: soft wooden thump with anti-spam limiter
  playBarrelBounce() {
    const now = Date.now();
    if (this._lastBarrelBounce && now - this._lastBarrelBounce < 180) return;
    this._lastBarrelBounce = now;
    this.playTone(130, 42, 0.08, 'sine', 0.10);
  }

  // Ladder Climb Step
  playLadderStep() {
    this.playTone(380, 440, 0.05, 'triangle', 0.08);
  }

  // Gem / Star Pickup: sparkling bell chime
  playGem() {
    const notes = [659.25, 783.99, 987.77, 1318.51];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, freq * 1.02, 0.15, 'sine', 0.2);
      }, idx * 45);
    });
  }

  // Power-up Picked Up: fanfare sparkle
  playPowerup() {
    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, freq * 1.1, 0.2, 'triangle', 0.25);
      }, idx * 70);
    });
  }

  // Bubble Shield Pop (turned barrel into bubble)
  playBubblePop() {
    this.playTone(700, 1100, 0.08, 'sine', 0.25);
    setTimeout(() => {
      this.playTone(1200, 1600, 0.1, 'sine', 0.2);
    }, 40);
  }

  // Hilarious Cartoon Toot Sound when Daddy jumps over barrels
  playToot() {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Modulator for the rapid flutter toot buzz
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();

    lfo.frequency.setValueAtTime(45, t);
    lfoGain.gain.setValueAtTime(38, t);
    lfo.connect(osc.frequency);

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(135, t);
    osc.frequency.exponentialRampToValueAtTime(55, t + 0.35);

    gain.gain.setValueAtTime(0.38, t);
    gain.gain.linearRampToValueAtTime(0.35, t + 0.22);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    lfo.start(t);
    osc.start(t);
    lfo.stop(t + 0.35);
    osc.stop(t + 0.35);
  }

  // Hammer Smash Barrel: satisfying punchy crunch and chime
  playHammerSmash() {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx) return;

    // Low wooden impact thump
    this.playTone(220, 35, 0.2, 'triangle', 0.45);
    // Crunchy impact snap
    setTimeout(() => {
      this.playTone(480, 75, 0.14, 'sawtooth', 0.35);
    }, 25);
    // Rewarding sparkle ding
    setTimeout(() => {
      this.playTone(880, 1174, 0.18, 'sine', 0.28);
    }, 75);
  }

  // Hurt / Hit: mild gentle slip, not scary for kids
  playHurt() {
    this.playTone(320, 110, 0.28, 'sawtooth', 0.18);
  }

  // Level Win / Celebration Fanfare
  playWin() {
    const melody = [
      { f: 523.25, d: 0.15 },
      { f: 659.25, d: 0.15 },
      { f: 783.99, d: 0.15 },
      { f: 1046.5, d: 0.35 },
      { f: 880.0, d: 0.15 },
      { f: 1046.5, d: 0.5 }
    ];
    let time = 0;
    melody.forEach(note => {
      setTimeout(() => {
        this.playTone(note.f, note.f, note.d, 'triangle', 0.3);
      }, time);
      time += note.d * 1000 + 40;
    });
  }

  // Acoustic Harp Pluck: Warm, bell-like, resonant wooden soundboard decay
  playHarpPluck(freq, duration, volume = 0.055) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    // Fundamental acoustic string tone (pure warm sine)
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);

    // Warm wooden octave body overtone
    const oscBody = this.ctx.createOscillator();
    oscBody.type = 'triangle';
    oscBody.frequency.setValueAtTime(freq * 2, t);

    // Dynamic low-pass acoustic resonance filter
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(Math.min(freq * 3.8, 4800), t);
    filter.frequency.exponentialRampToValueAtTime(Math.min(freq * 1.4, 1800), t + duration * 0.4);
    filter.Q.setValueAtTime(2.2, t);

    // Acoustic pluck gain envelope: instant finger release, sweet warm ring, exponential decay
    const gain = this.ctx.createGain();
    const gainBody = this.ctx.createGain();

    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(volume, t + 0.008); // Sharp finger pluck attack
    gain.gain.exponentialRampToValueAtTime(volume * 0.35, t + 0.3); // Initial string bloom
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration); // Long lingering acoustic decay

    gainBody.gain.setValueAtTime(0.0001, t);
    gainBody.gain.linearRampToValueAtTime(volume * 0.3, t + 0.006);
    gainBody.gain.exponentialRampToValueAtTime(0.0001, t + duration * 0.4);

    osc.connect(gain);
    oscBody.connect(gainBody);
    gain.connect(filter);
    gainBody.connect(filter);
    filter.connect(this.ctx.destination);

    osc.start(t);
    oscBody.start(t);
    osc.stop(t + duration);
    oscBody.stop(t + duration);
  }

  // Wooden Forest Flute: Breathy, gentle, floating pastoral melody voice
  playWoodenFlute(freq, duration, volume = 0.04) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);

    // Gentle natural breath vibrato (5 Hz, starts slightly delayed like a real flutist)
    const vibrato = this.ctx.createOscillator();
    const vibGain = this.ctx.createGain();
    vibrato.frequency.setValueAtTime(4.8, t);
    vibGain.gain.setValueAtTime(0.0001, t);
    vibGain.gain.linearRampToValueAtTime(1.8, t + 0.4); // Delayed expressive vibrato
    vibrato.connect(vibGain);
    vibGain.connect(osc.frequency);

    // Soft breath attack & lyrical fade
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(volume, t + 0.16); // Gentle breath swell
    gain.gain.setValueAtTime(volume * 0.9, t + duration * 0.7);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    vibrato.start(t);
    osc.start(t);
    vibrato.stop(t + duration);
    osc.stop(t + duration);
  }

  // Background Music: Celtic Forest Harp & Wooden Flute (Unravel / Scandinavian Pastoral style)
  // Truly relaxing, organic, and peaceful for both kids and parents!
  // Background Music: Dan's Original Composition (GOOD1)
  // Supports resuming playback seamlessly between levels!
  startMusic(options = {}) {
    const resume = options.resume !== undefined ? options.resume : true;
    if (!this.musicEnabled) return;

    // 1. Play Dan's custom track 'GOOD1' (loaded from assets/good1.wav)
    if (typeof Audio !== 'undefined') {
      try {
        if (!this.bgAudio) {
          this.bgAudio = new Audio('assets/good1.wav');
          this.bgAudio.loop = true;
          this.bgAudio.volume = 0.45; // pleasant background volume
        }

        if (!resume) {
          this.bgAudio.currentTime = 0;
        }

        if (this.bgAudio.paused) {
          const playPromise = this.bgAudio.play();
          if (playPromise !== undefined) {
            playPromise.catch(err => {
              console.log('Audio autoplay prevented or waiting for user interaction:', err);
            });
          }
        }
        return;
      } catch (e) {
        console.warn('Could not load custom audio file, falling back to synth:', e);
      }
    }

    // 2. Synthesizer fallback if audio file cannot play in environment
    if (!resume) {
      this.musicStep = 0;
    }
    if (this.musicTimer) return;

    this.init();
    if (!this.ctx) return;
    const bpm = 64;
    const beatSec = 60 / bpm;
    const stepMs = (beatSec / 2) * 1000;
    const harpChords = [
      [146.83, 220.00, 293.66, 369.99, 440.00],
      [123.47, 185.00, 246.94, 293.66, 369.99],
      [98.00, 146.83, 196.00, 246.94, 293.66],
      [110.00, 164.81, 220.00, 293.66, 329.63]
    ];
    this.musicTimer = setInterval(() => {
      if (!this.musicEnabled) return;
      const chord = harpChords[Math.floor(this.musicStep / 8) % harpChords.length];
      const freq = chord[[0, 1, 2, 3, 4, 3, 2, 1][this.musicStep % 8]];
      if (freq) this.playHarpPluck(freq, beatSec * 2.8, 0.035);
      this.musicStep++;
    }, stepMs);
  }

  // Pause music without losing playback position (used between levels)
  pauseMusic() {
    if (this.bgAudio) {
      try {
        this.bgAudio.pause();
      } catch (e) {}
    }
    if (this.musicTimer) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }

  // Full stop music and rewind to beginning (used on game over or explicit reset)
  stopMusic() {
    if (this.bgAudio) {
      try {
        this.bgAudio.pause();
        this.bgAudio.currentTime = 0;
      } catch (e) {}
    }
    if (this.musicTimer) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
    this.musicStep = 0;
  }

  toggleSound() {
    this.soundEnabled = !this.soundEnabled;
    return this.soundEnabled;
  }

  toggleMusic() {
    this.musicEnabled = !this.musicEnabled;
    if (this.musicEnabled) {
      this.startMusic();
    } else {
      this.stopMusic();
    }
    return this.musicEnabled;
  }
}

window.soundEngine = new SoundEngine();
