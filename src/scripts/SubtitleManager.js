export default class SubtitleManager {
  constructor() {
    this.scene = null;
    this.cues = [];
    this.currentCueIndex = -1;
    this.enabled = true;
    this.sceneStartedAt = 0;
    this.pendingShowTimer = null;

    this.injectStyles();
    this.element = this.createLayer();
  }

  injectStyles() {
    if (document.querySelector("#performance-subtitle-styles")) return;

    const style = document.createElement("style");
    style.id = "performance-subtitle-styles";
    style.textContent = `
      #performance-subtitles {
        position: fixed;
        left: 50%;
        bottom: clamp(48px, 9vh, 120px);
        z-index: 9998;
        width: min(76vw, 1050px);
        transform: translateX(-50%);
        text-align: center;
        pointer-events: none;
        opacity: 0;
        transition: opacity 900ms ease;
        color: rgba(255, 255, 255, 0.96);
        font-family: Arial, Helvetica, sans-serif;
        font-size: clamp(22px, 2.1vw, 40px);
        font-weight: 400;
        line-height: 1.34;
        letter-spacing: 0.015em;
        white-space: pre-line;
        text-wrap: balance;
        text-shadow: 0 2px 22px rgba(0, 0, 0, 0.82);
      }

      #performance-subtitles.is-visible { opacity: 1; }

      #performance-subtitles .subtitle-speaker {
        display: block;
        margin-bottom: 0.7em;
        font-size: 0.34em;
        letter-spacing: 0.2em;
        text-transform: uppercase;
        opacity: 0.62;
      }

      #performance-subtitles .subtitle-text { display: block; }
    `;

    document.head.appendChild(style);
  }

  createLayer() {
    const layer = document.createElement("div");
    layer.id = "performance-subtitles";
    layer.setAttribute("aria-live", "polite");
    layer.setAttribute("aria-atomic", "true");
    layer.innerHTML = `
      <span class="subtitle-speaker"></span>
      <span class="subtitle-text"></span>
    `;
    document.body.appendChild(layer);
    return layer;
  }

  setScene(scene) {
    this.cancelPendingShow();
    this.scene = scene ?? null;
    this.cues = this.normalizeCues(scene);
    this.currentCueIndex = -1;
    this.sceneStartedAt = performance.now();
    this.clear();
  }

  normalizeCues(scene) {
    const source = scene?.subtitleCues ?? scene?.text ?? scene?.subtitles ?? [];
    if (!source) return [];

    if (typeof source === "string") {
      return source
        .split(/\n\s*\n/g)
        .map((text) => ({ text: text.trim(), speaker: "aicha" }))
        .filter((cue) => cue.text);
    }

    if (!Array.isArray(source)) return [];

    return source
      .map((cue) => typeof cue === "string"
        ? { text: cue.trim(), speaker: "aicha" }
        : { ...cue, text: String(cue?.text ?? "").trim() })
      .filter((cue) => cue.text);
  }

  setEnabled(enabled) {
    this.enabled = Boolean(enabled);
    if (!this.enabled) {
      this.cancelPendingShow();
      this.clear();
    }
  }

  toggle() {
    this.setEnabled(!this.enabled);
    if (this.enabled) this.currentCueIndex = -1;
    return this.enabled;
  }

  update() {
    if (!this.enabled || !this.scene || !this.cues.length) {
      this.clear();
      return;
    }

    const elapsedSeconds = (performance.now() - this.sceneStartedAt) / 1000;
    const cueIndex = this.getCueIndex(elapsedSeconds);

    if (cueIndex === this.currentCueIndex) return;

    this.currentCueIndex = cueIndex;
    this.cancelPendingShow();

    if (cueIndex < 0) {
      this.clear();
      return;
    }

    this.show(this.cues[cueIndex]);
  }

  getCueIndex(elapsedSeconds) {
    const hasTimings = this.cues.some((cue) => Number.isFinite(Number(cue.time)));

    if (hasTimings) {
      return this.cues.findIndex((cue, index) => {
        const start = Number(cue.time ?? 0);
        const nextStart = Number(this.cues[index + 1]?.time);
        const end = Number.isFinite(Number(cue.end))
          ? Number(cue.end)
          : Number.isFinite(nextStart)
            ? nextStart
            : Number.POSITIVE_INFINITY;

        return elapsedSeconds >= start && elapsedSeconds < end;
      });
    }

    const sceneDurationSeconds = Number(this.scene?.duration ?? 0) / 1000;
    const totalDuration = sceneDurationSeconds > 0
      ? sceneDurationSeconds
      : this.cues.length * 6.5;
    const cueDuration = Math.max(3.2, totalDuration / this.cues.length);

    return Math.min(
      this.cues.length - 1,
      Math.floor(elapsedSeconds / cueDuration)
    );
  }

  show(cue) {
    const speakerElement = this.element.querySelector(".subtitle-speaker");
    const textElement = this.element.querySelector(".subtitle-text");

    this.element.classList.remove("is-visible");

    this.pendingShowTimer = window.setTimeout(() => {
      this.pendingShowTimer = null;
      if (!this.enabled) return;
      speakerElement.textContent = cue.label ?? this.formatSpeaker(cue.speaker);
      textElement.textContent = cue.text ?? "";
      this.element.classList.add("is-visible");
    }, 360);
  }

  cancelPendingShow() {
    if (this.pendingShowTimer) {
      window.clearTimeout(this.pendingShowTimer);
      this.pendingShowTimer = null;
    }
  }

  clear() {
    this.element?.classList.remove("is-visible");
  }

  formatSpeaker(speaker) {
    if (speaker === "voice") return "VOCE";
    if (speaker === "aicha") return "AICHA";
    return speaker ? String(speaker).toUpperCase() : "";
  }
}