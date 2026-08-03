export default class AudioManager {
  constructor() {
    this.audioContext = null;
    this.analyser = null;
    this.outputGain = null;
    this.stream = null;
    this.microphoneSource = null;
    this.sourceNode = null;

    this.cueAudio = new Audio();
    this.cueAudio.preload = "auto";
    this.cueAudio.crossOrigin = "anonymous";
    this.cueSource = null;
    this.cueTrack = null;

    this.mode = "idle";
    this.fakeMode = false;
    this.outputMuted = false;
    this.timeData = null;
    this.frequencyData = null;
    this.level = 0;
    this.bass = 0;
    this.mid = 0;
    this.high = 0;
    this.fakeStartTime = performance.now();

    this.handleManualSceneNavigation = (event) => {
      const seconds = this.parseTimecode(event.detail?.start);
      if (!this.cueTrack || !Number.isFinite(seconds)) return;

      try {
        this.cueAudio.currentTime = Math.max(0, seconds + 0.01);
      } catch (error) {
        console.warn("Impossibile sincronizzare la timeline con la scena.", error);
      }
    };

    window.addEventListener(
      "reactive-archive:manual-scene-navigation",
      this.handleManualSceneNavigation
    );
  }

  parseTimecode(value) {
    if (typeof value === "number") return value;

    const parts = String(value ?? "0")
      .split(":")
      .map(Number);

    if (parts.some((part) => !Number.isFinite(part))) return NaN;
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return parts[0] || 0;
  }

  async ensureContext() {
    if (!this.audioContext) this.audioContext = new AudioContext();
    await this.audioContext.resume();

    if (!this.analyser) {
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 1024;
      this.analyser.smoothingTimeConstant = 0.78;
      this.timeData = new Uint8Array(this.analyser.fftSize);
      this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
    }

    if (!this.outputGain) {
      this.outputGain = this.audioContext.createGain();
      this.outputGain.gain.value = this.outputMuted ? 0 : 1;
      this.outputGain.connect(this.audioContext.destination);
    }
  }

  disconnectAnalyserSource() {
    try {
      this.sourceNode?.disconnect(this.analyser);
    } catch {}
    this.sourceNode = null;
  }

  connectAnalyserSource(source) {
    this.disconnectAnalyserSource();
    this.sourceNode = source;
    source.connect(this.analyser);
  }

  ensureCueGraph() {
    if (!this.cueSource) {
      this.cueSource = this.audioContext.createMediaElementSource(this.cueAudio);
      this.cueSource.connect(this.outputGain);
    }
  }

  setOutputMuted(muted) {
    this.outputMuted = Boolean(muted);
    if (this.outputGain && this.audioContext) {
      this.outputGain.gain.setTargetAtTime(
        this.outputMuted ? 0 : 1,
        this.audioContext.currentTime,
        0.015
      );
    }
    return this.outputMuted;
  }

  disconnectCueOutput() {
    this.cueAudio.volume = 0;
  }

  async start({ fallbackPlay = false } = {}) {
    await this.ensureContext();

    if (!navigator.mediaDevices?.getUserMedia) {
      await this.activateCueOrFake({ play: fallbackPlay });
      return false;
    }

    try {
      if (!this.stream) {
        this.stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false
        });
      }

      if (!this.microphoneSource) {
        this.microphoneSource = this.audioContext.createMediaStreamSource(this.stream);
      }

      this.connectAnalyserSource(this.microphoneSource);
      this.mode = "microphone";
      this.fakeMode = false;
      return true;
    } catch (error) {
      console.warn(
        "Microfono non disponibile. Uso la traccia audio della scena quando presente.",
        error
      );
      await this.activateCueOrFake({ play: fallbackPlay });
      return false;
    }
  }

  async setCueTrack(
    src,
    {
      play = true,
      audible = true,
      activate = true,
      forceActivate = false,
      restart = true
    } = {}
  ) {
    const nextTrack = src || null;
    const trackChanged = nextTrack !== this.cueTrack;
    this.cueTrack = nextTrack;

    if (!nextTrack) {
      this.stopCue({ reset: true });
      if (this.mode === "cue") this.enableFakeMode();
      return;
    }

    await this.ensureContext();
    this.ensureCueGraph();

    if (trackChanged) {
      this.cueAudio.pause();
      this.cueAudio.src = nextTrack;
      this.cueAudio.load();
    }

    if (restart && (trackChanged || this.cueAudio.ended)) {
      try { this.cueAudio.currentTime = 0; } catch {}
    }

    this.cueAudio.volume = audible ? 1 : 0;

    const keepMicrophone = this.mode === "microphone" && !forceActivate;
    if (activate && !keepMicrophone) {
      this.connectAnalyserSource(this.cueSource);
      this.mode = "cue";
      this.fakeMode = false;
    }

    if (play) {
      try {
        await this.cueAudio.play();
      } catch (error) {
        console.warn("Traccia cue non riproducibile:", error);
      }
    }
  }

  stopCue({ reset = false } = {}) {
    this.cueAudio.pause();
    if (reset) {
      try { this.cueAudio.currentTime = 0; } catch {}
    }
  }

  async activateCueOrFake({ play = true } = {}) {
    if (this.cueTrack) {
      await this.setCueTrack(this.cueTrack, {
        play,
        audible: true,
        activate: true,
        forceActivate: true,
        restart: false
      });
      return;
    }

    this.enableFakeMode();
  }

  enableFakeMode() {
    this.disconnectAnalyserSource();
    this.mode = "fake";
    this.fakeMode = true;
    this.fakeStartTime = performance.now();
  }

  disableFakeMode() {
    this.fakeMode = false;
  }

  get sourceMode() {
    return this.mode;
  }

  update() {
    if (this.fakeMode) return this.updateFakeAudio();

    if (!this.analyser || !this.timeData || !this.frequencyData) {
      return { level: 0, bass: 0, mid: 0, high: 0 };
    }

    this.analyser.getByteTimeDomainData(this.timeData);
    this.analyser.getByteFrequencyData(this.frequencyData);

    let sum = 0;
    for (let i = 0; i < this.timeData.length; i += 1) {
      const value = (this.timeData[i] - 128) / 128;
      sum += value * value;
    }

    const rawLevel = Math.min(Math.sqrt(sum / this.timeData.length) * 6, 1);
    this.level += (rawLevel - this.level) * 0.15;
    this.bass += (this.getFrequencyAverage(20, 250) - this.bass) * 0.15;
    this.mid += (this.getFrequencyAverage(250, 2500) - this.mid) * 0.12;
    this.high += (this.getFrequencyAverage(2500, 10000) - this.high) * 0.1;

    return {
      level: this.level,
      bass: this.bass,
      mid: this.mid,
      high: this.high
    };
  }

  updateFakeAudio() {
    const time = (performance.now() - this.fakeStartTime) / 1000;
    const bassPulse = Math.pow(Math.max(0, Math.sin(time * 2.2)), 4);
    const midWave = Math.sin(time * 1.3) * 0.5 + 0.5;
    const highNoise = Math.random() * 0.35;
    const slowBreath = Math.sin(time * 0.45) * 0.5 + 0.5;
    const targetBass = bassPulse * 0.8 + slowBreath * 0.15;
    const targetMid = midWave * 0.55 + bassPulse * 0.15;
    const targetHigh = highNoise + bassPulse * 0.2;
    const targetLevel = targetBass * 0.55 + targetMid * 0.3 + targetHigh * 0.15;

    this.bass += (targetBass - this.bass) * 0.18;
    this.mid += (targetMid - this.mid) * 0.12;
    this.high += (targetHigh - this.high) * 0.22;
    this.level += (targetLevel - this.level) * 0.14;

    return {
      level: Math.min(this.level, 1),
      bass: Math.min(this.bass, 1),
      mid: Math.min(this.mid, 1),
      high: Math.min(this.high, 1)
    };
  }

  getFrequencyAverage(minimumFrequency, maximumFrequency) {
    if (!this.audioContext || !this.analyser || !this.frequencyData) return 0;

    const nyquist = this.audioContext.sampleRate / 2;
    const minimumIndex = Math.max(
      0,
      Math.floor(minimumFrequency / nyquist * this.frequencyData.length)
    );
    const maximumIndex = Math.min(
      this.frequencyData.length - 1,
      Math.ceil(maximumFrequency / nyquist * this.frequencyData.length)
    );

    let sum = 0;
    let count = 0;
    for (let i = minimumIndex; i <= maximumIndex; i += 1) {
      sum += this.frequencyData[i];
      count += 1;
    }

    return count ? Math.min(sum / count / 255 * 2, 1) : 0;
  }
}
