// One lazy context; every short voice disconnects as soon as it ends.
export class BrickAudio {
  constructor() { this.enabled = false; this.context = null; this.active = 0; }
  async toggle() {
    this.enabled = !this.enabled;
    if (this.enabled) await this.unlock();
    else if (this.context?.state === 'running') await this.context.suspend();
    return this.enabled;
  }
  async unlock() {
    try {
      const Context = window.AudioContext || window.webkitAudioContext;
      if (!Context) { this.enabled = false; return; }
      this.context ||= new Context();
      if (this.context.state === 'suspended') await this.context.resume();
    } catch { this.enabled = false; }
  }
  async click() {
    if (!this.enabled || this.active >= 4) return;
    await this.unlock();
    if (!this.enabled || this.context?.state !== 'running' || this.active >= 4) return;
    const ctx = this.context, now = ctx.currentTime;
    const oscillator = ctx.createOscillator(), gain = ctx.createGain();
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(950, now);
    oscillator.frequency.exponentialRampToValueAtTime(190, now + 0.045);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.055, now + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.065);
    oscillator.connect(gain); gain.connect(ctx.destination);
    this.active++;
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); this.active--; };
    oscillator.start(now); oscillator.stop(now + 0.07);
  }
  dispose() { this.enabled = false; this.context?.close().catch(() => {}); }
}
