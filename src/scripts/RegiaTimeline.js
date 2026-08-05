function parseTimecode(value) {
  if (typeof value === "number") return value;
  const parts = String(value ?? "0").split(":").map(Number);
  if (parts.some((part) => !Number.isFinite(part))) return 0;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] || 0;
}

function formatTime(value) {
  const seconds = Math.max(0, Math.floor(Number(value) || 0));
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

export default class RegiaTimeline {
  constructor({ audio, performance, sceneManager, onSeek }) {
    this.audio = audio;
    this.performance = performance;
    this.sceneManager = sceneManager;
    this.onSeek = onSeek;
    this.duration = parseTimecode(performance.duration);
    this.visible = true;
    this.dragging = false;

    this.injectStyles();
    this.element = this.createElement();
    this.progress = this.element.querySelector(".regia-timeline__progress");
    this.playhead = this.element.querySelector(".regia-timeline__playhead");
    this.currentTimeLabel = this.element.querySelector(".regia-timeline__current");
    this.durationLabel = this.element.querySelector(".regia-timeline__duration");
    this.sceneLabel = this.element.querySelector(".regia-timeline__scene");
    this.track = this.element.querySelector(".regia-timeline__track");

    this.durationLabel.textContent = formatTime(this.duration);
    this.renderMarkers();
    this.bindEvents();
  }

  injectStyles() {
    if (document.querySelector("#regia-timeline-styles")) return;

    const style = document.createElement("style");
    style.id = "regia-timeline-styles";
    style.textContent = `
      #regia-timeline {
        position: fixed;
        left: 20px;
        right: 20px;
        bottom: 18px;
        z-index: 1000003;
        display: grid;
        grid-template-columns: auto minmax(0, 1fr) auto;
        align-items: center;
        gap: 12px;
        padding: 10px 12px;
        background: rgba(0, 0, 0, 0.86);
        color: #fff;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        font-size: 11px;
        line-height: 1;
        letter-spacing: 0.02em;
        user-select: none;
        -webkit-user-select: none;
      }

      #regia-timeline[hidden] { display: none; }

      .regia-timeline__meta {
        display: grid;
        gap: 5px;
        min-width: 150px;
      }

      .regia-timeline__scene {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        opacity: 0.72;
      }

      .regia-timeline__time {
        font-variant-numeric: tabular-nums;
        white-space: nowrap;
      }

      .regia-timeline__track {
        position: relative;
        height: 26px;
        cursor: ew-resize;
        touch-action: none;
      }

      .regia-timeline__rail {
        position: absolute;
        left: 0;
        right: 0;
        top: 50%;
        height: 2px;
        transform: translateY(-50%);
        background: rgba(255, 255, 255, 0.28);
      }

      .regia-timeline__progress {
        position: absolute;
        left: 0;
        top: 50%;
        width: 0;
        height: 2px;
        transform: translateY(-50%);
        background: #fff;
      }

      .regia-timeline__playhead {
        position: absolute;
        top: 3px;
        bottom: 3px;
        left: 0;
        width: 1px;
        background: #fff;
        transform: translateX(-0.5px);
      }

      .regia-timeline__marker {
        position: absolute;
        top: 7px;
        width: 1px;
        height: 12px;
        padding: 0;
        border: 0;
        background: rgba(255, 255, 255, 0.5);
        cursor: pointer;
      }

      .regia-timeline__marker:hover,
      .regia-timeline__marker:focus-visible {
        height: 18px;
        top: 4px;
        background: #fff;
        outline: none;
      }

      body[data-recording="true"] #regia-timeline {
        display: none !important;
      }

      @media (max-width: 700px) {
        #regia-timeline {
          left: 10px;
          right: 10px;
          bottom: max(10px, env(safe-area-inset-bottom));
          grid-template-columns: 1fr auto;
          gap: 8px;
        }

        .regia-timeline__meta {
          grid-column: 1 / -1;
          min-width: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }

  createElement() {
    const element = document.createElement("section");
    element.id = "regia-timeline";
    element.setAttribute("aria-label", "Timeline di regia");
    element.innerHTML = `
      <div class="regia-timeline__meta">
        <span class="regia-timeline__scene">SCENE —</span>
        <span class="regia-timeline__time">
          <span class="regia-timeline__current">00:00</span>
          / <span class="regia-timeline__duration">00:00</span>
        </span>
      </div>
      <div class="regia-timeline__track" role="slider" aria-label="Posizione audio" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
        <div class="regia-timeline__rail"></div>
        <div class="regia-timeline__progress"></div>
        <div class="regia-timeline__playhead"></div>
      </div>
      <span class="regia-timeline__hint">T hide · click to seek</span>
    `;
    document.body.appendChild(element);
    return element;
  }

  renderMarkers() {
    for (const [index, scene] of this.performance.scenes.entries()) {
      const seconds = parseTimecode(scene.start);
      const ratio = this.duration > 0 ? seconds / this.duration : 0;
      const marker = document.createElement("button");
      marker.type = "button";
      marker.className = "regia-timeline__marker";
      marker.style.left = `${Math.max(0, Math.min(1, ratio)) * 100}%`;
      marker.title = `${scene.start} — ${scene.title}`;
      marker.setAttribute("aria-label", marker.title);
      marker.addEventListener("click", (event) => {
        event.stopPropagation();
        this.seek(seconds, index);
      });
      this.track.appendChild(marker);
    }
  }

  bindEvents() {
    const seekFromPointer = (event) => {
      const rect = this.track.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
      this.seek(ratio * this.duration);
    };

    this.track.addEventListener("pointerdown", (event) => {
      this.dragging = true;
      this.track.setPointerCapture?.(event.pointerId);
      seekFromPointer(event);
    });

    this.track.addEventListener("pointermove", (event) => {
      if (!this.dragging) return;
      seekFromPointer(event);
    });

    const stopDragging = () => { this.dragging = false; };
    this.track.addEventListener("pointerup", stopDragging);
    this.track.addEventListener("pointercancel", stopDragging);

    window.addEventListener("keydown", (event) => {
      if (event.key.toLowerCase() !== "t") return;
      this.visible = !this.visible;
      this.element.hidden = !this.visible;
    });
  }

  seek(seconds, sceneIndex) {
    const target = Math.max(0, Math.min(this.duration, Number(seconds) || 0));
    if (typeof this.onSeek === "function") this.onSeek(target, sceneIndex);
  }

  update() {
    const currentTime = Math.max(0, Number(this.audio?.currentTime) || 0);
    const ratio = this.duration > 0 ? Math.max(0, Math.min(1, currentTime / this.duration)) : 0;
    const percentage = `${ratio * 100}%`;

    this.progress.style.width = percentage;
    this.playhead.style.left = percentage;
    this.currentTimeLabel.textContent = formatTime(currentTime);
    this.sceneLabel.textContent = `SCENE ${this.sceneManager.currentIndex + 1} — ${this.sceneManager.currentScene?.title ?? "—"}`;
    this.track.setAttribute("aria-valuenow", String(Math.round(ratio * 100)));
  }
}
