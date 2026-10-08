/**
 * Procedural Web Audio API sound generator for subtle executive office atmosphere.
 * No external audio files needed; 100% browser-native and lightweight.
 */
class OfficeAudioController {
  private ctx: AudioContext | null = null;
  private noiseNode: AudioNode | null = null;
  private isPlaying = false;

  public start() {
    if (this.isPlaying) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      // Create gentle brown/pink noise for soft architectural air circulation / HVAC hum
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = output[i];
        output[i] *= 0.15; // Keep very soft
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      // Low pass filter at 220Hz for deep gentle room tone
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 240;

      const gain = this.ctx.createGain();
      gain.gain.value = 0.04; // Very quiet background

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      whiteNoise.start();
      this.noiseNode = whiteNoise;
      this.isPlaying = true;
    } catch {
      // Audio autoplay policy fallback
    }
  }

  public stop() {
    if (!this.isPlaying) return;
    try {
      if (this.ctx) {
        this.ctx.close();
        this.ctx = null;
      }
      this.isPlaying = false;
    } catch {
      // Ignore
    }
  }
}

export const officeAudio = new OfficeAudioController();
