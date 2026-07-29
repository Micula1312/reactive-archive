export default class AudioManager {
  constructor() {
    this.audioContext = null;
    this.analyser = null;
    this.stream = null;

    this.timeData = null;
    this.frequencyData = null;

    this.level = 0;
    this.bass = 0;
    this.mid = 0;
    this.high = 0;

    this.fakeMode = false;
    this.fakeStartTime = performance.now();
  }

  async start() {
    if (!navigator.mediaDevices?.getUserMedia) {
      this.enableFakeMode();
      return;
    }

    try {
      this.stream =
        await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false
        });

      this.audioContext = new AudioContext();

      await this.audioContext.resume();

      const source =
        this.audioContext.createMediaStreamSource(
          this.stream
        );

      this.analyser =
        this.audioContext.createAnalyser();

      this.analyser.fftSize = 1024;
      this.analyser.smoothingTimeConstant = 0.78;

      this.timeData = new Uint8Array(
        this.analyser.fftSize
      );

      this.frequencyData = new Uint8Array(
        this.analyser.frequencyBinCount
      );

      source.connect(this.analyser);

      this.fakeMode = false;
    } catch (error) {
      console.warn(
        "Microfono non disponibile. Attivo fake audio.",
        error
      );

      this.enableFakeMode();
    }
  }

  enableFakeMode() {
    this.fakeMode = true;
    this.fakeStartTime = performance.now();
  }

  disableFakeMode() {
    this.fakeMode = false;
  }

  update() {
    if (this.fakeMode) {
      return this.updateFakeAudio();
    }

    if (
      !this.analyser ||
      !this.timeData ||
      !this.frequencyData
    ) {
      return {
        level: 0,
        bass: 0,
        mid: 0,
        high: 0
      };
    }

    this.analyser.getByteTimeDomainData(
      this.timeData
    );

    this.analyser.getByteFrequencyData(
      this.frequencyData
    );

    let sum = 0;

    for (
      let i = 0;
      i < this.timeData.length;
      i += 1
    ) {
      const value =
        (this.timeData[i] - 128) / 128;

      sum += value * value;
    }

    const rms = Math.sqrt(
      sum / this.timeData.length
    );

    const rawLevel =
      Math.min(rms * 6, 1);

    this.level +=
      (rawLevel - this.level) * 0.15;

    const bassRaw =
      this.getFrequencyAverage(20, 250);

    const midRaw =
      this.getFrequencyAverage(250, 2500);

    const highRaw =
      this.getFrequencyAverage(2500, 10000);

    this.bass +=
      (bassRaw - this.bass) * 0.15;

    this.mid +=
      (midRaw - this.mid) * 0.12;

    this.high +=
      (highRaw - this.high) * 0.1;

    return {
      level: this.level,
      bass: this.bass,
      mid: this.mid,
      high: this.high
    };
  }

  updateFakeAudio() {
    const time =
      (performance.now() - this.fakeStartTime) /
      1000;

    const bassPulse =
      Math.pow(
        Math.max(
          0,
          Math.sin(time * 2.2)
        ),
        4
      );

    const midWave =
      Math.sin(time * 1.3) *
      0.5 +
      0.5;

    const highNoise =
      Math.random() *
      0.35;

    const slowBreath =
      Math.sin(time * 0.45) *
      0.5 +
      0.5;

    const targetBass =
      bassPulse * 0.8 +
      slowBreath * 0.15;

    const targetMid =
      midWave * 0.55 +
      bassPulse * 0.15;

    const targetHigh =
      highNoise +
      bassPulse * 0.2;

    const targetLevel =
      targetBass * 0.55 +
      targetMid * 0.3 +
      targetHigh * 0.15;

    this.bass +=
      (targetBass - this.bass) * 0.18;

    this.mid +=
      (targetMid - this.mid) * 0.12;

    this.high +=
      (targetHigh - this.high) * 0.22;

    this.level +=
      (targetLevel - this.level) * 0.14;

    return {
      level: Math.min(this.level, 1),
      bass: Math.min(this.bass, 1),
      mid: Math.min(this.mid, 1),
      high: Math.min(this.high, 1)
    };
  }

  getFrequencyAverage(
    minimumFrequency,
    maximumFrequency
  ) {
    if (
      !this.audioContext ||
      !this.analyser ||
      !this.frequencyData
    ) {
      return 0;
    }

    const nyquist =
      this.audioContext.sampleRate / 2;

    const minimumIndex =
      Math.max(
        0,
        Math.floor(
          minimumFrequency /
          nyquist *
          this.frequencyData.length
        )
      );

    const maximumIndex =
      Math.min(
        this.frequencyData.length - 1,
        Math.ceil(
          maximumFrequency /
          nyquist *
          this.frequencyData.length
        )
      );

    let sum = 0;
    let count = 0;

    for (
      let i = minimumIndex;
      i <= maximumIndex;
      i += 1
    ) {
      sum += this.frequencyData[i];
      count += 1;
    }

    if (count === 0) {
      return 0;
    }

    return Math.min(
      sum / count / 255 * 2,
      1
    );
  }
}