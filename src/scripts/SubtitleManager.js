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
        top: clamp(24px, 4vh, 48px);
        left: clamp(20px, 3vw, 48px);
        z-index: 9998;
        width: min(38vw, 520px);
        pointer-events: none;
        opacity: 0;
        transition: opacity 280ms ease;
        color: rgba(255, 255, 255, 0.98);
        font-family: Helvetica, Arial, sans-serif;
        font-size: clamp(16px, 1.15vw, 22px);
        font-weight: 300;
        line-height: 1.28;
        letter-spacing: 0.01em;
        white-space: pre-line;
        text-align: left;
      }

      #performance-subtitles.is-visible {
        opacity: 1;
      }

      #performance-subtitles .subtitle-window {
        display: block;
        max-width: 100%;
        padding: 0;
        border: 0;
        background: transparent;
        box-shadow: none;
        text-align: left;
      }

      #performance-subtitles .subtitle-speaker {
        display: block;
        margin: 0 0 0.75em;
        padding: 0;
        border: 0;
        font-size: 0.55em;
        font-weight: 400;
        letter-spacing: 0.18em;
        line-height: 1;
        text-transform: uppercase;
        opacity: 0.72;
      }

      #performance-subtitles .subtitle-text {
        display: block;
      }

      @media (max-width: 900px) {
        #performance-subtitles {
          top: max(24px, env(safe-area-inset-top));
          left: max(20px, env(safe-area-inset-left));
          width: min(76vw, 440px);
          font-size: clamp(16px, 4.2vw, 18px);
        }
      }

      @media (prefers-reduced-motion: reduce) {
        #performance-subtitles {
          transition: none;
        }
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
    }, 180);
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
    if (speaker === "voice") return "VOICE";
    if (speaker === "aicha") return "AICHA";
    return speaker ? String(speaker).toUpperCase() : "";
  }
}
