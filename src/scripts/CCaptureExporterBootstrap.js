import CCaptureExporter from "./CCaptureExporter.js";
import performanceScore from "../performances/elisa/index.js";

function mountCCaptureExporter() {
  const actions = document.querySelector(".start-actions");
  const startButton = document.querySelector("#start-button");
  const startScreen = document.querySelector("#start-screen");
  const status = document.querySelector("#status");

  if (
    !(actions instanceof HTMLElement) ||
    !(startButton instanceof HTMLButtonElement) ||
    !(startScreen instanceof HTMLElement)
  ) {
    return;
  }

  if (document.querySelector("#ccapture-export-button")) return;

  const button = document.createElement("button");
  button.id = "ccapture-export-button";
  button.type = "button";
  button.textContent = "EXPORT FRAMES 30 FPS";
  actions.append(button);

  const style = document.createElement("style");
  style.textContent = `
    #ccapture-export-button {
      border: 1px solid #fff;
      border-radius: 0;
      padding: 16px 22px;
      background: transparent;
      color: #fff;
      font: inherit;
      font-weight: 700;
      cursor: pointer;
    }

    #ccapture-export-button:hover {
      background: #fff;
      color: #000;
    }

    #ccapture-export-button:disabled {
      opacity: 0.5;
      cursor: wait;
    }

    body[data-offline-export="true"] #mobile-scene-controls,
    body[data-offline-export="true"] #debug-panel,
    body[data-offline-export="true"] #regia-timeline {
      display: none !important;
    }

    @media (max-width: 560px) {
      #ccapture-export-button {
        width: 100%;
      }
    }
  `;
  document.head.append(style);

  new CCaptureExporter({
    button,
    startButton,
    startScreen,
    status,
    duration: performanceScore.duration
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mountCCaptureExporter, { once: true });
} else {
  mountCCaptureExporter();
}
