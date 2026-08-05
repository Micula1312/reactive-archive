import "ccapture.js/build/CCapture.all.min.js";

const OUTPUT_WIDTH = 1920;
const OUTPUT_HEIGHT = 1080;
const OUTPUT_FPS = 30;
const AUTO_SAVE_SECONDS = 300;

function parseTimecode(value) {
  const parts = String(value ?? "0").split(":").map(Number);
  if (parts.some((part) => !Number.isFinite(part))) return 0;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] || 0;
}

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function drawCover(context, source, width, height) {
  const sourceWidth = source.videoWidth || source.width || width;
  const sourceHeight = source.videoHeight || source.height || height;
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

function getVisibleVisualLayer() {
  const hydraCanvas = document.querySelector('canvas[data-scene-layer="hydra"]');
  if (hydraCanvas instanceof HTMLCanvasElement) return hydraCanvas;

  const visualCanvas = document.querySelector("#visual-canvas");
  if (visualCanvas instanceof HTMLCanvasElement) return visualCanvas;

  return null;
}

function drawTextLayer(context, selector, width, height) {
  const element = document.querySelector(selector);
  if (!(element instanceof HTMLElement)) return;

  const style = getComputedStyle(element);
  if (style.visibility === "hidden" || style.display === "none" || Number(style.opacity) <= 0) return;

  const rect = element.getBoundingClientRect();
  const scaleX = width / window.innerWidth;
  const scaleY = height / window.innerHeight;
  const lines = String(element.innerText || element.textContent || "")
    .split("\n")
    .map((line) => line.trimEnd());

  if (!lines.some(Boolean)) return;

  const fontSize = Math.max(12, parseFloat(style.fontSize) * scaleY);
  const lineHeight = Number.parseFloat(style.lineHeight) || fontSize * 1.35;
  const x = rect.left * scaleX;
  const y = rect.top * scaleY;
  const padding = 14 * scaleX;

  context.save();
  context.globalAlpha = Number(style.opacity) || 1;
  context.font = `${style.fontWeight} ${fontSize}px ${style.fontFamily}`;
  context.textBaseline = "top";
  context.fillStyle = "#000";

  const measuredWidth = Math.max(
    1,
    ...lines.map((line) => context.measureText(line || " ").width)
  );
  context.fillRect(
    x - padding,
    y - padding,
    measuredWidth + padding * 2,
    lines.length * lineHeight * scaleY + padding * 2
  );

  context.fillStyle = style.color || "#fff";
  lines.forEach((line, index) => {
    context.fillText(line, x, y + index * lineHeight * scaleY);
  });
  context.restore();
}

export default class CCaptureExporter {
  constructor({ button, startButton, startScreen, status, duration = "25:00" }) {
    this.button = button;
    this.startButton = startButton;
    this.startScreen = startScreen;
    this.status = status;
    this.durationSeconds = parseTimecode(duration);
    this.running = false;
    this.frame = 0;
    this.animationFrame = 0;
    this.canvas = document.createElement("canvas");
    this.canvas.width = OUTPUT_WIDTH;
    this.canvas.height = OUTPUT_HEIGHT;
    this.context = this.canvas.getContext("2d", { alpha: false });
    this.capture = null;

    this.start = this.start.bind(this);
    this.stop = this.stop.bind(this);
    this.renderFrame = this.renderFrame.bind(this);

    this.button?.addEventListener("click", this.start);
  }

  setStatus(message) {
    if (this.status instanceof HTMLElement) this.status.textContent = message;
  }

  async start() {
    if (this.running || !this.context) return;

    const Capture = window.CCapture;
    if (typeof Capture !== "function") {
      this.setStatus("CCapture non disponibile. Esegui npm install e riavvia Astro.");
      return;
    }

    this.button.disabled = true;
    this.running = true;
    this.frame = 0;
    document.body.dataset.offlineExport = "true";

    if (this.startScreen instanceof HTMLElement && !this.startScreen.hidden) {
      this.startButton?.click();
      await wait(500);
    } else {
      window.dispatchEvent(new CustomEvent("reactive-archive:manual-scene-navigation", {
        detail: { index: 0, start: "00:00" }
      }));
      await wait(250);
    }

    this.capture = new Capture({
      format: "webm",
      framerate: OUTPUT_FPS,
      quality: 90,
      name: "elisa-ccapture-1920x1080-30fps",
      verbose: false,
      display: true,
      autoSaveTime: AUTO_SAVE_SECONDS
    });

    this.capture.start();
    this.setStatus("CCapture 1920×1080 a 30 fps in corso — salvataggio ogni 5 minuti…");
    this.renderFrame();
  }

  renderFrame() {
    if (!this.running || !this.capture || !this.context) return;

    const totalFrames = Math.ceil(this.durationSeconds * OUTPUT_FPS);
    if (this.frame >= totalFrames) {
      this.stop();
      return;
    }

    this.context.fillStyle = "#000";
    this.context.fillRect(0, 0, OUTPUT_WIDTH, OUTPUT_HEIGHT);

    const visualLayer = getVisibleVisualLayer();
    if (visualLayer) drawCover(this.context, visualLayer, OUTPUT_WIDTH, OUTPUT_HEIGHT);

    drawTextLayer(this.context, '[data-scene-layer="text"]', OUTPUT_WIDTH, OUTPUT_HEIGHT);
    drawTextLayer(this.context, "#performance-subtitles", OUTPUT_WIDTH, OUTPUT_HEIGHT);

    this.capture.capture(this.canvas);
    this.frame += 1;

    if (this.frame % OUTPUT_FPS === 0) {
      const seconds = this.frame / OUTPUT_FPS;
      this.setStatus(`CCapture: ${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")} / 25:00`);
    }

    this.animationFrame = requestAnimationFrame(this.renderFrame);
  }

  stop() {
    if (!this.running) return;

    this.running = false;
    cancelAnimationFrame(this.animationFrame);
    this.capture?.stop();
    this.capture?.save();
    this.capture = null;
    document.body.dataset.offlineExport = "false";
    this.button.disabled = false;
    this.setStatus(
      "Blocchi WebM CCapture salvati senza audio. Uniscili e aggiungi prima_parte.mp3 con FFmpeg."
    );
  }
}
