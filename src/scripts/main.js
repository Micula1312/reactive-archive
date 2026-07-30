import Renderer from "./Renderer.js";
import AudioManager from "./AudioManager.js";
import { UIManager } from "./AppUi.js";
import SceneManager from "./SceneManager.js";
import PerformanceMonitor from "./PerformanceMonitor.js";

const performanceModules = import.meta.glob(
  "../performances/*/index.js",
  { eager: true }
);

const performanceName =
  document.documentElement.dataset.performance ||
  document.body.dataset.performance ||
  "fmcp";

const performanceModulePath =
  `../performances/${performanceName}/index.js`;

const performanceScore =
  performanceModules[performanceModulePath]?.default;

if (!performanceScore) {
  throw new Error(
    `Performance non trovata: ${performanceName}`
  );
}

const canvas = document.querySelector("#visual-canvas");
const video = document.querySelector("#source-video");
const startScreen = document.querySelector("#start-screen");
const startButton = document.querySelector("#start-button");
const status = document.querySelector("#status");
const debugPanel = document.querySelector("#debug-panel");
const audioValue = document.querySelector("#audio-value");
const bassValue = document.querySelector("#bass-value");
const midValue = document.querySelector("#mid-value");
const highValue = document.querySelector("#high-value");

if (
  !(canvas instanceof HTMLCanvasElement) ||
  !(video instanceof HTMLVideoElement) ||
  !(startScreen instanceof HTMLElement) ||
  !(startButton instanceof HTMLButtonElement) ||
  !(status instanceof HTMLElement) ||
  !(debugPanel instanceof HTMLElement) ||
  !(audioValue instanceof HTMLElement) ||
  !(bassValue instanceof HTMLElement) ||
  !(midValue instanceof HTMLElement) ||
  !(highValue instanceof HTMLElement)
) {
  throw new Error("Mancano alcuni elementi necessari nella pagina.");
}

const visualRenderer = new Renderer({
  canvas,
  video
});

const audioManager = new AudioManager();

const ui = new UIManager({
  canvas,
  video,
  startScreen,
  startButton,
  status,
  debugPanel,
  audioValue,
  bassValue,
  midValue,
  highValue
});

const sceneManager = new SceneManager({
  video,
  renderer: visualRenderer,
  ui,
  performance: performanceScore
});

let blackoutActive = false;
let audioReactiveEnabled = true;
let started = false;
let microphonePreparationPromise = null;
let visualVisibility = 0;
let lastSoundTime = performance.now();

/* =========================================================
   BLACKOUT
   ========================================================= */

function setBlackout(active) {
  blackoutActive = active;

  document.body.dataset.blackout = active
    ? "true"
    : "false";

  canvas.style.visibility = active
    ? "hidden"
    : "visible";

  video.style.visibility = active
    ? "hidden"
    : "visible";

  document
    .querySelectorAll("[data-scene-layer]")
    .forEach((element) => {
      if (element instanceof HTMLElement) {
        element.style.visibility = active
          ? "hidden"
          : "visible";
      }
    });

  ui.setStatus(
    active
      ? "BLACKOUT"
      : `Scena ${sceneManager.currentIndex + 1}`
  );
}

/* =========================================================
   PERFORMANCE MONITOR
   ========================================================= */

const performanceMonitor = new PerformanceMonitor({
  performance: performanceScore,
  sceneManager,
  audioManager,
  onBlackout: setBlackout
});

/* =========================================================
   CAMBIO SCENA
   ========================================================= */

window.addEventListener(
  "reactive-archive:scene-change",
  async (event) => {
    const scene = event.detail?.scene;

    await audioManager.setCueTrack(
      scene?.audio ?? null,
      {
        play: started,
        audible: scene?.audioAudible ?? true
      }
    );

    performanceMonitor.publish(
      {
        level: 0,
        bass: 0,
        mid: 0,
        high: 0
      },
      true
    );
  }
);

/* =========================================================
   RENDER LOOP
   ========================================================= */

function animate() {
  requestAnimationFrame(animate);
  visualRenderer.render();
}

animate();

/* =========================================================
   AUDIO REACTIVE LOOP
   ========================================================= */

function updateAudio() {
  requestAnimationFrame(updateAudio);

  if (!started) {
    return;
  }

  const audioData = audioManager.update();
  const scene = sceneManager.currentScene;
  const now = performance.now();

  if (!scene) {
    return;
  }

  const shouldReact =
    audioReactiveEnabled &&
    (scene.audioReactive ?? true);

  const silenceThreshold =
    scene.silenceThreshold ?? 0.035;

  const silenceDelay =
    scene.silenceDelay ?? 350;

  const fadeInSpeed =
    scene.fadeInSpeed ?? 0.12;

  const fadeOutSpeed =
    scene.fadeOutSpeed ?? 0.025;

  if (!shouldReact) {
    visualVisibility +=
      (1 - visualVisibility) *
      fadeInSpeed;
  } else if (
    audioData.level >
    silenceThreshold
  ) {
    lastSoundTime = now;

    visualVisibility +=
      (1 - visualVisibility) *
      fadeInSpeed;
  } else if (
    now - lastSoundTime >
    silenceDelay
  ) {
    visualVisibility +=
      (0 - visualVisibility) *
      fadeOutSpeed;
  }

  if (visualVisibility < 0.002) {
    visualVisibility = 0;
  }

  if (visualVisibility > 0.998) {
    visualVisibility = 1;
  }

  if (!blackoutActive) {
    canvas.style.opacity =
      String(visualVisibility);
  }

  visualRenderer.setVisibility(
    visualVisibility
  );

  const reactiveAudio = shouldReact
    ? audioData
    : {
        level: 0,
        bass: 0,
        mid: 0,
        high: 0
      };

  visualRenderer.setAudioData(
    reactiveAudio
  );

  sceneManager.update(
    reactiveAudio
  );

  ui.updateAudioValues(
    audioData
  );

  performanceMonitor.publish(
    audioData
  );
}

updateAudio();

/* =========================================================
   PREPARAZIONE MICROFONO
   ========================================================= */

function prepareMicrophone() {
  if (microphonePreparationPromise) {
    return microphonePreparationPromise;
  }

  ui.setStatus(
    "Autorizza il microfono per continuare…"
  );

  microphonePreparationPromise =
    audioManager
      .start()
      .then(() => {
        ui.setStatus(
          audioManager.fakeMode
            ? "Microfono non disponibile — modalità fake pronta"
            : "Microfono autorizzato — premi START"
        );
      })
      .catch((error) => {
        console.error(error);

        microphonePreparationPromise = null;

        ui.setStatus(
          error instanceof Error
            ? error.message
            : "Errore durante l’attivazione del microfono."
        );

        throw error;
      });

  return microphonePreparationPromise;
}

/* =========================================================
   AVVIO ESPERIENZA
   ========================================================= */

async function startExperience() {
  if (started) {
    return;
  }

  ui.setStartButtonDisabled(true);
  ui.setStatus(
    "Attivazione del microfono…"
  );

  try {
    await prepareMicrophone();

    if (
      audioManager.audioContext &&
      audioManager.audioContext.state ===
        "suspended"
    ) {
      await audioManager.audioContext.resume();
    }

    ui.setStatus(
      "Avvio della performance…"
    );

    started = true;

    sceneManager.setStarted(true);

    lastSoundTime =
      performance.now();

    await sceneManager.load(
      sceneManager.currentIndex
    );

    ui.setStatus(
      `Audio: ${audioManager.sourceMode}`
    );

    performanceMonitor.publish(
      {
        level: 0,
        bass: 0,
        mid: 0,
        high: 0
      },
      true
    );

    ui.hideStartScreen();

    document.documentElement
      .requestFullscreen()
      .catch(() => {});
  } catch (error) {
    console.error(error);

    started = false;

    ui.setStatus(
      error instanceof Error
        ? error.message
        : "Errore durante l'avvio."
    );

    ui.setStartButtonDisabled(false);
  }
}

/* =========================================================
   AUDIO REACTIVITY
   ========================================================= */

function toggleAudioReactive() {
  audioReactiveEnabled =
    !audioReactiveEnabled;

  ui.setAudioReactiveState(
    audioReactiveEnabled
  );

  ui.setStatus(
    audioReactiveEnabled
      ? "Audio reactivity attiva"
      : "Audio reactivity disattivata"
  );
}

/* =========================================================
   MICROFONO / CUE / FAKE
   ========================================================= */

async function toggleMicrophoneMode() {
  try {
    if (
      audioManager.sourceMode !==
      "microphone"
    ) {
      ui.setStatus(
        "Attivazione del microfono…"
      );

      microphonePreparationPromise = null;

      await prepareMicrophone();
    } else {
      await audioManager.activateCueOrFake();
    }

    ui.setStatus(
      `Audio: ${audioManager.sourceMode}`
    );

    performanceMonitor.publish(
      {
        level: 0,
        bass: 0,
        mid: 0,
        high: 0
      },
      true
    );
  } catch (error) {
    console.error(error);

    ui.setStatus(
      error instanceof Error
        ? error.message
        : "Errore audio."
    );
  }
}

/* =========================================================
   COLLEGAMENTO UI
   ========================================================= */

ui.onStart(
  startExperience
);

ui.onNextVideo(
  () => sceneManager.next()
);

ui.onPreviousVideo(
  () => sceneManager.previous()
);

ui.onSelectVideo(
  (index) => sceneManager.select(index)
);

ui.onToggleAudioReactive(
  toggleAudioReactive
);

ui.onToggleMicrophoneMode(
  toggleMicrophoneMode
);

ui.onRestartVideo(
  () => sceneManager.restart()
);

ui.setAudioReactiveState(
  audioReactiveEnabled
);

performanceMonitor.publish(
  {
    level: 0,
    bass: 0,
    mid: 0,
    high: 0
  },
  true
);

prepareMicrophone();