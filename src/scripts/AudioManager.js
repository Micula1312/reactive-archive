export default class AudioManager {
  constructor() {
    this.audioContext = null;
    this.analyser = null;
    this.stream = null;
    this.sourceNode = null;
    this.cueAudio = new Audio();
    this.cueAudio.preload = "auto";
    this.cueAudio.crossOrigin = "anonymous";
    this.cueSource = null;
    this.cueOutputConnected = false;
    this.cueTrack = null;
    this.mode = "idle";
    this.fakeMode = false;
    this.timeData = null;
    this.frequencyData = null;
    this.level = 0;
    this.bass = 0;
    this.mid = 0;
    this.high = 0;
    this.fakeStartTime = performance.now();
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
  }

  connectSource(source, { audible = false } = {}) {
    try {
      this.sourceNode?.disconnect();
    } catch {}

    this.sourceNode = source;
    source.connect(this.analyser);

    if (audible) {
      source.connect(this.audioContext.destination);
    }
  }

  ensureCueOutput() {
    if (!this.cueSource || !this.audioContext || this.cueOutputConnected) {
      return;
    }

    this.cueSource.connect(this.audioContext.destination);
    this.cueOutputConnected = true;
  }

  disconnectCueOutput() {
    if (!this.cueSource || !this.cueOutputConnected) {
      return;
    }

    try {
      this.cueSource.disconnect(this.audioContext.destination);
    } catch {}

    this.cueOutputConnected = false;
  }

  async start({ fallbackPlay = false } = {}) {
    await this.ensureContext();

    if (!navigator.mediaDevices?.getUserMedia) {
      return this.activateCueOrFake({ play: fallbackPlay });
    }

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false
      });

      this.connectSource(
        this.audioContext.createMediaStreamSource(this.stream),
        { audible: false }
      );

      this.mode = "microphone";
      this.fakeMode = false;
    } catch (error) {
      console.warn(
        "Microfono non disponibile. La performance userà la traccia audio della scena.",
        error
      );

      await this.activateCueOrFake({ play: fallbackPlay });
    }
  }

  async setCueTrack(
    src,
    {
      play = true,
      audible = true,
      activate = true,
      forceActivate = false
    } = {}
  ) {
    this.cueTrack = src || null;
    this.cueAudio.pause();
    this.cueAudio.currentTime = 0;

    if (!src) {
      if (this.mode === "cue") this.enableFakeMode();
      return;
    }

    this.cueAudio.src = src;
    this.cueAudio.muted = !audible;
    this.cueAudio.volume = 1;
    this.cueAudio.load();

    await this.ensureContext();

    if (!this.cueSource) {
      this.cueSource = this.audioContext.createMediaElementSource(this.cueAudio);
    }

    const keepMicrophone = this.mode === "microphone" && !forceActivate;

    if (keepMicrophone) {
      // Il microfono continua ad alimentare l'analyser, mentre la traccia
      // della scena viene comunque inviata alle casse.
      if (audible) {
        this.ensureCueOutput();
      } else {
        this.disconnectCueOutput();
      }

      if (play) {
        try {
          await this.cueAudio.play();
        } catch (error) {
          console.warn("Traccia cue non riproducibile:", error);
        }
      }

      return;
    }

    if (activate) {
      this.disconnectCueOutput();
      this.connectSource(this.cueSource, { audible });
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

  async activateCueOrFake({ play = true } = {}) {
    if (this.cueTrack) {
      await this.setCueTrack(this.cueTrack, {
        play,
        audible: true,
        activate: true,
        forceActivate: true
      });
      return;
    }

    this.enableFakeMode();
  }

  enableFakeMode() {
    this.mode = "fake";
    this.fakeMode = true;
    this.fakeStartTime = performance.now();
    this.cueAudio.pause();
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

    const rawLevel = Math.min(
      Math.sqrt(sum / this.timeData.length) * 6,
      1
    );

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
    const targetLevel =
      targetBass * 0.55 + targetMid * 0.3 + targetHigh * 0.15;

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
    if (!this.audioContext || !this.analyser || !this.frequencyData) {
      return 0;
    }

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