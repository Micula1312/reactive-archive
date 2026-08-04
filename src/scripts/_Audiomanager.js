export class AudioManager {
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
  }

  async start() {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error(
        "Il browser non supporta l'accesso al microfono."
      );
    }

    this.stream =
      await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        },
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
  }

  update() {
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

    const rawLevel = Math.min(rms * 6, 1);

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

    const minimumIndex = Math.max(
      0,
      Math.floor(
        minimumFrequency /
        nyquist *
        this.frequencyData.length
      )
    );

    const maximumIndex = Math.min(
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