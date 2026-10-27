// 100% Procedural Web Audio API Sound Effects & 1999 Nostalgia Background Music

class SoundEffectsManager {
  private ctx: AudioContext | null = null;
  public muted: boolean = false;
  public musicEnabled: boolean = true;
  private musicTimer: number | null = null;
  private musicStep: number = 0;

  private getContext(): AudioContext | null {
    if (this.muted || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  /**
   * Starts a warm 1999 Nostalgia synth-lounge / electric-piano background music loop.
   */
  public startNostalgiaMusic() {
    if (typeof window === 'undefined') return;
    if (this.musicTimer !== null) return;

    // 1999 Nostalgic progression: Fmaj7 -> Em7 -> Dm7 -> Cmaj7 (warm Rhodes + bell arpeggio)
    const chords = [
      [174.61, 220.0, 261.63, 329.63], // Fmaj7
      [164.81, 196.0, 246.94, 293.66], // Em7
      [146.83, 174.61, 220.0, 261.63], // Dm7
      [130.81, 164.81, 196.0, 246.94], // Cmaj7
    ];
    const melodyNotes = [
      523.25, 659.25, 587.33, 523.25, 493.88, 392.0, 440.0, 523.25,
      440.0, 523.25, 659.25, 587.33, 523.25, 392.0, 329.63, 392.0,
    ];

    const tickMusic = () => {
      if (this.muted || !this.musicEnabled) return;
      const ctx = this.getContext();
      if (!ctx || ctx.state !== 'running') return;

      const now = ctx.currentTime;
      const step = this.musicStep % 16;
      const chordIdx = Math.floor(step / 4) % chords.length;

      // Play warm electric piano chord on beat 0 of each 4-step bar
      if (step % 4 === 0) {
        const chord = chords[chordIdx];
        chord.forEach((freq) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now);

          gain.gain.setValueAtTime(0.001, now);
          gain.gain.linearRampToValueAtTime(0.022, now + 0.08);
          gain.gain.exponentialRampToValueAtTime(0.0008, now + 1.45);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 1.5);
        });
      }

      // Play gentle 90s bell/chime arpeggio note
      const melFreq = melodyNotes[step];
      if (melFreq && step % 2 === 0) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(melFreq, now);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.018, now + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.55);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.6);
      }

      this.musicStep++;
    };

    this.musicTimer = window.setInterval(tickMusic, 420);
  }

  public stopNostalgiaMusic() {
    if (this.musicTimer !== null) {
      window.clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }

  public playStandFlipClack(delaySec: number = 0) {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime + delaySec;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    const jitter = 0.92 + Math.random() * 0.16;
    osc.frequency.setValueAtTime(680 * jitter, now);
    osc.frequency.exponentialRampToValueAtTime(190 * jitter, now + 0.045);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.055);
  }

  public playFootstep() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const pitchVar = 0.92 + Math.random() * 0.16;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(85 * pitchVar, now);
    osc.frequency.exponentialRampToValueAtTime(32 * pitchVar, now + 0.08);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.095);
  }

  public playBoxUnfold() {
    const ctx = this.getContext();
    if (!ctx) return;
    this.startNostalgiaMusic();
    const now = ctx.currentTime;

    // Warm resonant chord + cardboard whoosh
    const freqs = [196, 246.94, 293.66, 392];
    freqs.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      const t = now + idx * 0.11;
      osc.frequency.setValueAtTime(f * 0.8, t);
      osc.frequency.exponentialRampToValueAtTime(f, t + 0.35);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.11, t + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.58);
    });
  }

  public playCardFlip() {
    const ctx = this.getContext();
    if (!ctx) return;
    this.startNostalgiaMusic();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.065);

    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.075);
  }

  public playPawnHop(stepIndex: number = 0) {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const baseFreq = 240 + Math.min(stepIndex, 12) * 24;
    const jitter = 0.96 + Math.random() * 0.08;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq * jitter, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.55, now + 0.075);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.085);
  }

  public playSlideWhoosh() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.28);

    gain.gain.setValueAtTime(0.11, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.32);
  }

  public playSorryBump() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(42, now + 0.26);

    gain.gain.setValueAtTime(0.24, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.3);
  }

  public playHomeChime() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      const t = now + idx * 0.07;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.14, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.32);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.35);
    });
  }

  public playVictoryFanfare() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = [261.63, 329.63, 392.0, 523.25, 659.25, 783.99];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      const t = now + idx * 0.09;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.16, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.52);
    });
  }

  public playMouseSqueak() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1180, now);
    osc.frequency.exponentialRampToValueAtTime(1680, now + 0.05);
    osc.frequency.exponentialRampToValueAtTime(980, now + 0.11);

    gain.gain.setValueAtTime(0.11, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.13);
  }

  public playCheeseCollect() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const freqs = [587.33, 783.99, 1046.5];
    freqs.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      const t = now + idx * 0.05;
      osc.frequency.setValueAtTime(f, t);
      gain.gain.setValueAtTime(0.14, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.24);
    });
  }

  public playTrapPopUp() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(640, now + 0.18);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.24);
  }

  public playContraptionChainReaction() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // 1. Crank ratchet clicks (0.0s .. 0.6s)
    for (let i = 0; i < 6; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      const t = now + i * 0.09;
      osc.frequency.setValueAtTime(320 + i * 35, t);
      gain.gain.setValueAtTime(0.09, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.06);
    }

    // 2. Boot kick + Steel marble rolling down stairs (0.7s .. 1.9s)
    for (let s = 0; s < 8; s++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      const t = now + 0.72 + s * 0.13;
      osc.frequency.setValueAtTime(720 - s * 45, t);
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.09);
    }

    // 3. Red Cage rattling down pole & CLANG at 2.3s!
    const clang = ctx.createOscillator();
    const clangGain = ctx.createGain();
    clang.type = 'sawtooth';
    const ct = now + 2.25;
    clang.frequency.setValueAtTime(220, ct);
    clang.frequency.exponentialRampToValueAtTime(58, ct + 0.42);
    clangGain.gain.setValueAtTime(0.26, ct);
    clangGain.gain.exponentialRampToValueAtTime(0.001, ct + 0.45);
    clang.connect(clangGain);
    clangGain.connect(ctx.destination);
    clang.start(ct);
    clang.stop(ct + 0.48);
  }

  /**
   * Iconic old-school View-Master mechanical lever ratchet sound:
   * Down-stroke metallic spring "CHUNK" followed by up-stroke reel-advance "CLACK!"
   */
  public playViewMasterLeverClick() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // 1. Downward spring lever press ("KA-CHUNK")
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'square';
    osc1.frequency.setValueAtTime(420, now);
    osc1.frequency.exponentialRampToValueAtTime(115, now + 0.048);
    gain1.gain.setValueAtTime(0.2, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.055);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.06);

    // Metallic ratchet tooth click mid-stroke
    const oscMid = ctx.createOscillator();
    const gainMid = ctx.createGain();
    oscMid.type = 'triangle';
    oscMid.frequency.setValueAtTime(1240, now + 0.055);
    oscMid.frequency.exponentialRampToValueAtTime(380, now + 0.09);
    gainMid.gain.setValueAtTime(0.14, now + 0.055);
    gainMid.gain.exponentialRampToValueAtTime(0.001, now + 0.095);
    oscMid.connect(gainMid);
    gainMid.connect(ctx.destination);
    oscMid.start(now + 0.055);
    oscMid.stop(now + 0.1);

    // 2. Return spring release snap ("CLACK!")
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(860, now + 0.13);
    osc2.frequency.exponentialRampToValueAtTime(240, now + 0.185);
    gain2.gain.setValueAtTime(0.18, now + 0.13);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.19);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.13);
    osc2.stop(now + 0.2);
  }

  /**
   * Crisp cardboard reel sliding into the top View-Master slot ("SHHK-SNICK").
   */
  public playViewMasterReelInsert() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.linearRampToValueAtTime(590, now + 0.14);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.17);

    // Final detent lock click
    this.playStandFlipClack(0.16);
  }

  /**
   * Hollow roto-molded plastic sliding sound for the Step2 Lift & Hide Toy Chest door.
   */
  public playToyChestSlide(opening: boolean = true) {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    const startFreq = opening ? 110 : 210;
    const endFreq = opening ? 220 : 95;
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.28);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.32);
  }

  /**
   * Subtle plastic/metal clack triggered by Cannon.js physical body collisions.
   */
  public playPhysicsCollisionClack(impactStrength: number = 0.5) {
    const ctx = this.getContext();
    if (!ctx) return;
    const clamped = Math.min(1, Math.max(0.08, impactStrength));
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(540 + Math.random() * 220, now);
    osc.frequency.exponentialRampToValueAtTime(160, now + 0.035);
    gain.gain.setValueAtTime(0.08 * clamped, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.045);
  }
}

export const soundFX = new SoundEffectsManager();


