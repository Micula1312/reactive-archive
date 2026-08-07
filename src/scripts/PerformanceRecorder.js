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
      if (condition()) return resolve(condition());
      if (performance.now() - startedAt > timeout) {
        reject(new Error("Timeout durante la preparazione della registrazione."));
        return;
      }
      requestAnimationFrame(check);
    }

    check();
  });
}

function isVisible(element) {
  if (!(element instanceof HTMLElement)) return false;
  const style = getComputedStyle(element);
  return style.display !== "none" && style.visibility !== "hidden" && Number(style.opacity || 1) > 0;
}

function drawCover(context, source, width, height) {
  const sourceWidth = source.width || source.videoWidth || width;
  const sourceHeight = source.height || source.videoHeight || height;
  if (!sourceWidth || !sourceHeight) return;

  const sourceRatio = sourceWidth / sourceHeight;
  const targetRatio = width / height;
  let sx = 0;
  let sy = 0;
  let sw = sourceWidth;
  let sh = sourceHeight;

  if (sourceRatio > targetRatio) {
    sw = sourceHeight * targetRatio;
    sx = (sourceWidth - sw) / 2;
  } else if (sourceRatio < targetRatio) {
    sh = sourceWidth / targetRatio;
    sy = (sourceHeight - sh) / 2;
  }

  context.drawImage(source, sx, sy, sw, sh, 0, 0, width, height);
}

function drawDomText(context, element, { background = false } = {}) {
  if (!(element instanceof HTMLElement) || !isVisible(element)) return;

  const style = getComputedStyle(element);
  const rect = element.getBoundingClientRect();
  const scaleX = OUTPUT_WIDTH / Math.max(window.innerWidth, 1);
  const scaleY = OUTPUT_HEIGHT / Math.max(window.innerHeight, 1);
  const x = rect.left * scaleX;
  const y = rect.top * scaleY;
  const width = rect.width * scaleX;
  const height = rect.height * scaleY;

  const fontSize = Math.max(10, parseFloat(style.fontSize || "16") * scaleY);
  const lineHeightRaw = parseFloat(style.lineHeight);
  const lineHeight = Number.isFinite(lineHeightRaw) ? lineHeightRaw * scaleY : fontSize * 1.35;
  const text = String(element.innerText || element.textContent || "").trim();
  if (!text) return;

  const lines = text.split("\n");
  context.save();
  context.globalAlpha = Number(style.opacity || 1);

  if (background) {
    context.fillStyle = "#000";
    context.fillRect(x, y, Math.max(width, 2), Math.max(height, 2));
  }

  context.fillStyle = style.color || "#fff";
  context.font = `${style.fontWeight || 400} ${fontSize}px ${style.fontFamily || "Arial"}`;
  context.textBaseline = "top";
  context.textAlign = style.textAlign === "center" ? "center" : "left";

  const tx = context.textAlign === "center" ? x + width / 2 : x;
  lines.forEach((line, index) => {
    context.fillText(line, tx, y + index * lineHeight);
  });

  context.restore();
}

function drawTextScene(context) {
  const layer = document.querySelector('[data-scene-layer="text"]');
  if (!(layer instanceof HTMLElement) || !isVisible(layer)) return false;

  context.fillStyle = getComputedStyle(layer).backgroundColor || "#000";
  context.fillRect(0, 0, OUTPUT_WIDTH, OUTPUT_HEIGHT);

  layer.querySelectorAll("h1, p, time").forEach((element) => {
    if (element instanceof HTMLElement) drawDomText(context, element);
  });

  return true;
}

function drawSubtitles(context) {
  const layer = document.querySelector("#performance-subtitles");
  if (!(layer instanceof HTMLElement) || !layer.classList.contains("is-visible") || !isVisible(layer)) return;

  const windowElement = layer.querySelector(".subtitle-window");
  const speaker = layer.querySelector(".subtitle-speaker");
  const text = layer.querySelector(".subtitle-text");

  if (windowElement instanceof HTMLElement && isVisible(windowElement)) {
    const rect = windowElement.getBoundingClientRect();
    const scaleX = OUTPUT_WIDTH / Math.max(window.innerWidth, 1);
    const scaleY = OUTPUT_HEIGHT / Math.max(window.innerHeight, 1);
    context.fillStyle = "#000";
    context.fillRect(
      rect.left * scaleX,
      rect.top * scaleY,
      rect.width * scaleX,
      rect.height * scaleY
    );
  }

  if (speaker instanceof HTMLElement) drawDomText(context, speaker);
  if (text instanceof HTMLElement) drawDomText(context, text);
}

export default class PerformanceRecorder {
  constructor({ button, startButton, startScreen, status, duration = "32:27" }) {
    this.button = button;
    this.startButton = startButton;
    this.startScreen = startScreen;
    this.status = status;
    this.durationSeconds = Math.max(parseTimecode(duration), ELISA_DURATION_SECONDS);

    this.masterCanvas = document.createElement("canvas");
    this.masterCanvas.width = OUTPUT_WIDTH;
    this.masterCanvas.height = OUTPUT_HEIGHT;
    this.context = this.masterCanvas.getContext("2d", {
      alpha: false,
      desynchronized: true
    });

    this.outputStream = null;
    this.mediaRecorder = null;
    this.animationFrame = 0;
    this.stopTimer = 0;
    this.segmentTimer = 0;
    this.chunks = [];
    this.format = null;
    this.recording = false;
    this.rendering = false;
    this.segmentIndex = 1;
    this.finishingAll = false;
    this.lastFrameTime = 0;

    this.start = this.start.bind(this);
    this.stop = this.stop.bind(this);
    this.handleKeydown = this.handleKeydown.bind(this);
    this.draw = this.draw.bind(this);

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

  async getEngine() {
    if (window.__reactiveArchiveEngine) return window.__reactiveArchiveEngine;

    return waitFor(() => window.__reactiveArchiveEngine ?? null, 10000);
  }

  getVisualCanvas() {
    const hydraCanvas = document.querySelector('canvas[data-scene-layer="hydra"]');
    if (hydraCanvas instanceof HTMLCanvasElement && isVisible(hydraCanvas)) return hydraCanvas;

    const visualCanvas = document.querySelector("#visual-canvas");
    if (visualCanvas instanceof HTMLCanvasElement && isVisible(visualCanvas)) return visualCanvas;

    return null;
  }

  createOutputStream(audioStream) {
    if (!this.masterCanvas.captureStream) {
      throw new Error("Questo browser non supporta canvas.captureStream().");
    }

    const stream = this.masterCanvas.captureStream(OUTPUT_FPS);
    audioStream?.getAudioTracks?.().forEach((track) => stream.addTrack(track));
    this.outputStream = stream;
    return stream;
  }

  draw(timestamp = 0) {
    if (!this.rendering || !this.context) return;

    const frameInterval = 1000 / OUTPUT_FPS;
    if (timestamp - this.lastFrameTime >= frameInterval) {
      this.lastFrameTime = timestamp;
      const context = this.context;

      context.fillStyle = "#000";
      context.fillRect(0, 0, OUTPUT_WIDTH, OUTPUT_HEIGHT);

      const textSceneDrawn = drawTextScene(context);
      if (!textSceneDrawn) {
        const visualCanvas = this.getVisualCanvas();
        if (visualCanvas) drawCover(context, visualCanvas, OUTPUT_WIDTH, OUTPUT_HEIGHT);
      }

      drawSubtitles(context);
    }

    this.animationFrame = requestAnimationFrame(this.draw);
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
    this.setStatus(`REC DIRECT 25 FPS — segmento ${this.segmentIndex}`);

    window.clearTimeout(this.segmentTimer);
    this.segmentTimer = window.setTimeout(() => {
      if (this.recording && this.mediaRecorder?.state === "recording") {
        this.mediaRecorder.stop();
      }
    }, SEGMENT_SECONDS * 1000);
  }

  async start() {
    if (this.recording || !this.context) return;

    this.button.disabled = true;
    this.setStatus("Preparazione recorder diretto 1920×1080…");

    try {
      const engine = await this.getEngine();

      if (this.startScreen instanceof HTMLElement && !this.startScreen.hidden) {
        this.startButton?.click();
        await waitFor(() => this.startScreen.hidden === true);
      } else {
        window.dispatchEvent(new CustomEvent("reactive-archive:manual-scene-navigation", {
          detail: { index: 0, start: "00:00" }
        }));
      }

      await waitFor(() => engine.audioManager?.getRecordingStream?.() ?? null, 10000);
      const audioStream = engine.audioManager.getRecordingStream();

      this.format = selectRecorderFormat();
      this.segmentIndex = 1;
      this.finishingAll = false;
      this.recording = true;
      this.rendering = true;
      this.lastFrameTime = 0;
      document.body.dataset.recording = "true";

      this.createOutputStream(audioStream);
      this.draw();
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
      this.setStatus("Registrazione diretta completata: segmenti salvati.");
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
    link.download = `elisa-direct-1920x1080-25fps-part-${part}.${extension}`;
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

    this.outputStream?.getVideoTracks().forEach((track) => track.stop());

    this.outputStream = null;
    this.mediaRecorder = null;
    this.animationFrame = 0;
    this.stopTimer = 0;
    this.segmentTimer = 0;
    this.chunks = [];
    this.recording = false;
    this.finishingAll = false;
    this.lastFrameTime = 0;
    document.body.dataset.recording = "false";
  }
}
