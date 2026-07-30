export default class SubtitleManager {
  constructor() {
    this.scene = null;
    this.currentCueIndex = -1;
    this.enabled = true;

    this.injectStyles();
    this.element = this.createLayer();
  }

  injectStyles() {
    if (document.querySelector("#performance-subtitle-styles")) {
      return;
    }

    const style = document.createElement("style");
    style.id = "performance-subtitle-styles";
    style.textContent = `
      #performance-subtitles {
        position: fixed;
        left: 50%;
        bottom: clamp(42px, 8vh, 110px);
        z-index: 9998;
        width: min(72vw, 1100px);
        transform: translateX(-50%);
        text-align: center;
        pointer-events: none;
        opacity: 0;
        transition: opacity 400ms ease;
        color: rgba(255, 255, 255, 0.94);
        font-family: "IBM Plex Mono", "JetBrains Mono", monospace;
        font-size: clamp(22px, 2.2vw, 40px);
        font-weight: 400;
        line-height: 1.3;
        letter-spacing: 0.01em;
        white-space: pre-line;
        text-wrap: balance;
        text-shadow: 0 2px 18px rgba(0, 0, 0, 0.72);
      }

      #performance-subtitles.is-visible {
        opacity: 1;
      }

      #performance-subtitles[data-speaker="aisha"] {
        color: rgba(224, 211, 255, 0.96);
      }

      #performance-subtitles .subtitle-speaker {
        display: block;
        margin-bottom: 0.35em;
        font-size: 0.46em;
        letter-spacing: 0.16em;
        text-transform: uppercase;
        opacity: 0.72;
      }

      #performance-subtitles .subtitle-text {
        display: block;
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
      <span class="subtitle-speaker"></span>
      <span class="subtitle-text"></span>
    `;

    document.body.appendChild(layer);
    return layer;
  }

  setScene(scene) {
    this.scene = scene ?? null;
    this.currentCueIndex = -1;
    this.clear();
  }

  setEnabled(enabled) {
    this.enabled = Boolean(enabled);

    if (!this.enabled) {
      this.clear();
    }
  }

  toggle() {
    this.setEnabled(!this.enabled);
    return this.enabled;
  }

  update(timeInSeconds) {
    if (
      !this.enabled ||
      !this.scene?.subtitles ||
      !Array.isArray(this.scene.subtitleCues)
    ) {
      this.clear();
      return;
    }

    const cues = this.scene.subtitleCues;
    const cueIndex = cues.findIndex((cue, index) => {
      const nextCue = cues[index + 1];
      const start = Number(cue.time) || 0;
      const end = cue.end ?? nextCue?.time ?? Number.POSITIVE_INFINITY;

      return timeInSeconds >= start && timeInSeconds < end;
    });

    if (cueIndex === this.currentCueIndex) {
      return;
    }

    this.currentCueIndex = cueIndex;

    if (cueIndex < 0) {
      this.clear();
      return;
    }

    this.show(cues[cueIndex]);
  }

  show(cue) {
    const speaker = cue.speaker ?? "";
    const speakerElement = this.element.querySelector(".subtitle-speaker");
    const textElement = this.element.querySelector(".subtitle-text");

    this.element.dataset.speaker = speaker;
    speakerElement.textContent = cue.label ?? this.formatSpeaker(speaker);
    textElement.textContent = cue.text ?? "";
    this.element.classList.add("is-visible");
  }

  clear() {
    if (!this.element) {
      return;
    }

    this.element.classList.remove("is-visible");
  }

  formatSpeaker(speaker) {
    if (speaker === "voice") {
      return "VOCE";
    }

    if (speaker === "aisha") {
      return "AISHA";
    }

    return speaker ? speaker.toUpperCase() : "";
  }
}
