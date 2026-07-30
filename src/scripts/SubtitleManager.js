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
        bottom: clamp(34px, 7vh, 88px);
        z-index: 9998;
        width: min(82vw, 980px);
        transform: translateX(-50%);
        pointer-events: none;
        opacity: 0;
        transition: opacity 420ms steps(4, end), transform 420ms ease;
        color: rgba(235, 255, 245, 0.98);
        font-family: "Lucida Console", "IBM Plex Mono", "Courier New", monospace;
        font-size: clamp(18px, 1.65vw, 30px);
        font-weight: 400;
        line-height: 1.45;
        letter-spacing: 0.035em;
        white-space: pre-line;
        text-shadow: 0 0 14px rgba(80, 255, 180, 0.26), 0 2px 16px rgba(0, 0, 0, 0.9);
      }

      #performance-subtitles.is-visible { opacity: 1; }

      #performance-subtitles .subtitle-window {
        position: relative;
        display: inline-block;
        max-width: min(72vw, 860px);
        padding: 18px 22px 20px;
        border: 1px solid rgba(190, 255, 225, 0.72);
        background: rgba(2, 8, 7, 0.78);
        box-shadow: 8px 8px 0 rgba(0, 0, 0, 0.52), inset 0 0 24px rgba(80, 255, 180, 0.035);
        backdrop-filter: blur(5px);
        text-align: left;
      }

      #performance-subtitles[data-speaker="voice"] { text-align: left; }
      #performance-subtitles[data-speaker="aicha"] { text-align: right; }

      #performance-subtitles[data-speaker="aicha"] .subtitle-window {
        border-color: rgba(255, 115, 125, 0.78);
        color: rgba(255, 235, 238, 0.98);
        text-shadow: 0 0 14px rgba(255, 60, 90, 0.24), 0 2px 16px rgba(0, 0, 0, 0.9);
      }

      #performance-subtitles .subtitle-speaker {
        display: block;
        margin-bottom: 0.85em;
        padding-bottom: 0.55em;
        border-bottom: 1px dashed currentColor;
        font-size: 0.48em;
        letter-spacing: 0.22em;
        text-transform: uppercase;
        opacity: 0.72;
      }

      #performance-subtitles .subtitle-speaker::before { content: "> "; }
      #performance-subtitles .subtitle-text { display: block; }
      #performance-subtitles .subtitle-text::after {
        content: "_";
        margin-left: 0.12em;
        animation: subtitle-cursor 1s steps(1, end) infinite;
      }

      @keyframes subtitle-cursor {
        0%, 48% { opacity: 1; }
        49%, 100% { opacity: 0; }
      }
    `;

    document.head.appendChild(style);
  }

  createLayer() {
    const layer = document.createElement("div");
    layer.id = "performance-subtitles";
    layer.setAttribute("aria-live", "polite");
    layer.setAttribute("aria-atomic", "true");
    layer.innerHTML = `
      <span class="subtitle-window">
        <span class="subtitle-speaker"></span>
        <span class="subtitle-text"></span>
      </span>
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
      this.element.dataset.speaker = cue.speaker ?? "aicha";
      speakerElement.textContent = cue.label ?? this.formatSpeaker(cue.speaker);
      textElement.textContent = cue.text ?? "";
      this.element.classList.add("is-visible");
    }, 220);
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