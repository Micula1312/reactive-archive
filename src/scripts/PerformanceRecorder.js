import "./RegiaTimelineBootstrap.js";

const OUTPUT_WIDTH = 1920;
const OUTPUT_HEIGHT = 1080;
const OUTPUT_FPS = 25;
const VIDEO_BITRATE = 7_000_000;
const AUDIO_BITRATE = 192_000;
const SEGMENT_SECONDS = 8 * 60;
const ELISA_DURATION_SECONDS = 32 * 60 + 27;

function parseTimecode(value) {
  const parts = String(value ?? "0").split(":").map(Number);
  if (parts.some((part) => !Number.isFinite(part))) return 0;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] || 0;
}

function selectRecorderFormat() {
  const candidates = [
    { mimeType: "video/mp4;codecs=avc1.42E01E,mp4a.40.2", extension: "mp4" },
    { mimeType: "video/mp4;codecs=h264,aac", extension: "mp4" },
    { mimeType: "video/mp4", extension: "mp4" },
    { mimeType: "video/webm;codecs=vp9,opus", extension: "webm" },
    { mimeType: "video/webm;codecs=vp8,opus", extension: "webm" },
    { mimeType: "video/webm", extension: "webm" }
  ];

  return candidates.find(({ mimeType }) => MediaRecorder.isTypeSupported(mimeType)) ?? {
    mimeType: "",
    extension: "webm"
  };
}

function waitFor(condition, timeout = 15000) {
  return new Promise((resolve, reject) => {
    const startedAt = performance.now();

    function check() {
      if (condition()) return resolve();
      if (performance.now() - startedAt > timeout) {
        reject(new Error("Timeout durante la preparazione della registrazione."));
        return;
      }
      requestAnimationFrame(check);
    }

    check();
  });
}

export default class PerformanceRecorder {
  constructor({ button, startButton, startScreen, status, duration = "32:27" }) {
    this.button = button;
    this.startButton = startButton;
    this.startScreen = startScreen;
    this.status = status;
    this.durationSeconds = Math.max(parseTimecode(duration), ELISA_DURATION_SECONDS);

    this.displayStream = null;
    this.outputStream = null;
    this.mediaRecorder = null;
    this.captureVideo = null;
    this.animationFrame = 0;
    this.stopTimer = 0;
    this.segmentTimer = 0;
    this.chunks = [];
    this.format = null;
    this.recording = false;
    this.rendering = false;
    this.segmentIndex = 1;
    this.finishingAll = false;

    this.start = this.start.bind(this);
    this.stop = this.stop.bind(this);
    this.handleKeydown = this.handleKeydown.bind(this);

    this.button?.addEventListener("click", this.start);
    window.addEventListener("keydown", this.handleKeydown);
  }

  setStatus(message) {
    if (this.status instanceof HTMLElement) this.status.textContent = message;
  }

  handleKeydown(event) {
    if (event.key.toLowerCase() !== "r" || !this.recording) return;
    event.preventDefault();
    this.stop();
  }

  async requestDisplayStream() {
    if (!navigator.mediaDevices?.getDisplayMedia) {
      throw new Error("Questo browser non supporta la registrazione della scheda.");
    }

    return navigator.mediaDevices.getDisplayMedia({
      video: {
        displaySurface: "browser",
        width: { ideal: OUTPUT_WIDTH },
        height: { ideal: OUTPUT_HEIGHT },
        frameRate: { ideal: OUTPUT_FPS, max: OUTPUT_FPS }
      },
      audio: true,
      preferCurrentTab: true,
      selfBrowserSurface: "include",
      surfaceSwitching: "exclude",
      systemAudio: "include"
    });
  }

  async create1080pStream(displayStream) {
    const video = document.createElement("video");
    video.srcObject = displayStream;
    video.muted = true;
    video.playsInline = true;

    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT_WIDTH;
    canvas.height = OUTPUT_HEIGHT;

    const context = canvas.getContext("2d", { alpha: false, desynchronized: true });
    if (!context) throw new Error("Impossibile creare il canvas di registrazione.");

    const outputStream = canvas.captureStream(OUTPUT_FPS);
    displayStream.getAudioTracks().forEach((track) => outputStream.addTrack(track));

    this.captureVideo = video;
    this.outputStream = outputStream;
    this.rendering = true;

    const frameInterval = 1000 / OUTPUT_FPS;
    let lastFrameTime = 0;

    const draw = (timestamp = 0) => {
      if (!this.rendering) return;

      if (timestamp - lastFrameTime >= frameInterval) {
        lastFrameTime = timestamp;

        const sourceWidth = video.videoWidth || OUTPUT_WIDTH;
        const sourceHeight = video.videoHeight || OUTPUT_HEIGHT;
        const sourceRatio = sourceWidth / sourceHeight;
        const outputRatio = OUTPUT_WIDTH / OUTPUT_HEIGHT;

        let sx = 0;
        let sy = 0;
        let sw = sourceWidth;
        let sh = sourceHeight;

        if (sourceRatio > outputRatio) {
          sw = sourceHeight * outputRatio;
          sx = (sourceWidth - sw) / 2;
        } else if (sourceRatio < outputRatio) {
          sh = sourceWidth / outputRatio;
          sy = (sourceHeight - sh) / 2;
        }

        context.fillStyle = "#000";
        context.fillRect(0, 0, OUTPUT_WIDTH, OUTPUT_HEIGHT);
        context.drawImage(video, sx, sy, sw, sh, 0, 0, OUTPUT_WIDTH, OUTPUT_HEIGHT);
      }

      this.animationFrame = requestAnimationFrame(draw);
    };

    await video.play();
    draw();
    return outputStream;
  }

  createRecorder() {
    const options = {
      videoBitsPerSecond: VIDEO_BITRATE,
      audioBitsPerSecond: AUDIO_BITRATE
    };
    if (this.format?.mimeType) options.mimeType = this.format.mimeType;

    const recorder = new MediaRecorder(this.outputStream, options);
    recorder.addEventListener("dataavailable", (event) => {
      if (event.data?.size) this.chunks.push(event.data);
    });
    recorder.addEventListener("stop", () => this.handleSegmentStopped());
    return recorder;
  }

  startSegment() {
    if (!this.recording || !this.outputStream) return;

    this.chunks = [];
    this.mediaRecorder = this.createRecorder();
    this.mediaRecorder.start(1000);
    this.setStatus(`REC 25 FPS — segmento ${this.segmentIndex}`);

    window.clearTimeout(this.segmentTimer);
    this.segmentTimer = window.setTimeout(() => {
      if (this.recording && this.mediaRecorder?.state === "recording") {
        this.mediaRecorder.stop();
      }
    }, SEGMENT_SECONDS * 1000);
  }

  async start() {
    if (this.recording) return;

    this.button.disabled = true;
    this.setStatus("Seleziona QUESTA SCHEDA e attiva Condividi audio della scheda.");

    try {
      this.displayStream = await this.requestDisplayStream();
      this.displayStream.getVideoTracks()[0]?.addEventListener("ended", this.stop);

      await this.create1080pStream(this.displayStream);
      this.format = selectRecorderFormat();
      this.segmentIndex = 1;
      this.finishingAll = false;

      if (this.startScreen instanceof HTMLElement && !this.startScreen.hidden) {
        this.startButton?.click();
        await waitFor(() => this.startScreen.hidden === true);
      } else {
        window.dispatchEvent(new CustomEvent("reactive-archive:manual-scene-navigation", {
          detail: { index: 0, start: "00:00" }
        }));
      }

      await new Promise((resolve) => setTimeout(resolve, 250));

      this.recording = true;
      document.body.dataset.recording = "true";
      this.startSegment();

      this.stopTimer = window.setTimeout(
        this.stop,
        Math.ceil((this.durationSeconds + 1) * 1000)
      );
    } catch (error) {
      console.error(error);
      this.cleanup();
      this.button.disabled = false;
      this.setStatus(error instanceof Error ? error.message : "Registrazione non avviata.");
    }
  }

  stop() {
    if (!this.recording && !this.mediaRecorder) {
      this.cleanup();
      return;
    }

    this.recording = false;
    this.finishingAll = true;
    document.body.dataset.recording = "false";
    window.clearTimeout(this.stopTimer);
    window.clearTimeout(this.segmentTimer);

    if (this.mediaRecorder?.state === "recording") {
      this.mediaRecorder.stop();
    } else {
      this.cleanup();
    }
  }

  handleSegmentStopped() {
    this.saveSegment();

    if (this.finishingAll || !this.recording) {
      this.cleanup();
      this.button.disabled = false;
      this.setStatus("Registrazione completata: segmenti 25 FPS salvati.");
      return;
    }

    this.segmentIndex += 1;
    this.startSegment();
  }

  saveSegment() {
    if (!this.chunks.length) return;

    const mimeType = this.mediaRecorder?.mimeType || this.format?.mimeType || "video/webm";
    const extension = mimeType.includes("mp4") ? "mp4" : "webm";
    const blob = new Blob(this.chunks, { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const part = String(this.segmentIndex).padStart(2, "0");

    link.href = url;
    link.download = `elisa-performance-1920x1080-25fps-part-${part}.${extension}`;
    document.body.append(link);
    link.click();
    link.remove();

    this.chunks = [];
    window.setTimeout(() => URL.revokeObjectURL(url), 30000);
  }

  cleanup() {
    this.rendering = false;
    cancelAnimationFrame(this.animationFrame);
    window.clearTimeout(this.stopTimer);
    window.clearTimeout(this.segmentTimer);

    this.displayStream?.getTracks().forEach((track) => track.stop());
    this.outputStream?.getTracks().forEach((track) => track.stop());
    if (this.captureVideo) this.captureVideo.srcObject = null;

    this.displayStream = null;
    this.outputStream = null;
    this.mediaRecorder = null;
    this.captureVideo = null;
    this.animationFrame = 0;
    this.stopTimer = 0;
    this.segmentTimer = 0;
    this.chunks = [];
    this.recording = false;
    this.rendering = false;
    this.finishingAll = false;
    document.body.dataset.recording = "false";
  }
}
