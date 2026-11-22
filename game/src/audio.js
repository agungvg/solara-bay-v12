// Audio — synthesised WebAudio only, no files. Engine hum (sawtooth +
// lowpass tied to speed), two-tone KPD siren, ocean ambience (filtered
// noise swell), UI blips. Starts suspended; resume() on first gesture.
export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.engineOsc = null; this.engineGain = null; this.engineFilter = null;
    this.sirenOsc = null; this.sirenGain = null;
  }

  ensure() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    // Engine: sawtooth through a lowpass; pitch follows speed.
    this.engineOsc = this.ctx.createOscillator();
    this.engineOsc.type = 'sawtooth'; this.engineOsc.frequency.value = 55;
    this.engineFilter = this.ctx.createBiquadFilter();
    this.engineFilter.type = 'lowpass'; this.engineFilter.frequency.value = 320;
    this.engineGain = this.ctx.createGain(); this.engineGain.gain.value = 0.0;
    this.engineOsc.connect(this.engineFilter).connect(this.engineGain).connect(this.ctx.destination);
    this.engineOsc.start();
    // Siren: two alternating tones.
    this.sirenOsc = this.ctx.createOscillator();
    this.sirenOsc.type = 'triangle'; this.sirenOsc.frequency.value = 700;
    this.sirenGain = this.ctx.createGain(); this.sirenGain.gain.value = 0.0;
    this.sirenOsc.connect(this.sirenGain).connect(this.ctx.destination);
    this.sirenOsc.start();
    this.sirenTimer = 0;
  }

  resume() { this.ensure(); if (this.ctx?.state === 'suspended') this.ctx.resume(); }

  setDriving(speedKmh, on) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    this.engineGain.gain.setTargetAtTime(on ? 0.05 + speedKmh / 900 : 0.0, t, 0.1);
    this.engineOsc.frequency.setTargetAtTime(55 + speedKmh * 0.9, t, 0.1);
  }

  setSiren(on) {
    if (!this.ctx || this.muted) return;
    this.sirenGain.gain.setTargetAtTime(on ? 0.035 : 0.0, this.ctx.currentTime, 0.2);
  }

  tick(dt, wanted) {
    if (!this.ctx || !this.sirenOsc) return;
    this.sirenTimer += dt;
    if (wanted > 0 && !this.muted) {
      this.sirenOsc.frequency.value = Math.sin(this.sirenTimer * 4) > 0 ? 720 : 540;
    }
  }

  blip(freq = 880) {
    if (!this.ctx || this.muted) return;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = 'sine'; o.frequency.value = freq;
    g.gain.setValueAtTime(0.08, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);
    o.connect(g).connect(this.ctx.destination);
    o.start(); o.stop(this.ctx.currentTime + 0.16);
  }

  toggleMute() { this.muted = !this.muted; return this.muted; }
}
