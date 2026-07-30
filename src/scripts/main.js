import Renderer from "./Renderer.js";
import AudioManager from "./AudioManager.js";
import { UIManager } from "./AppUi.js";
import SceneManager from "./SceneManager.js";
import PerformanceMonitor from "./PerformanceMonitor.js";
import SubtitleManager from "./SubtitleManager.js";

const performanceModules = import.meta.glob("../performances/*/index.js", { eager: true });
const performanceName =
  document.documentElement.dataset.performance ||
  document.body.dataset.performance ||
  "fmcp";
const performanceScore = performanceModules[`../performances/${performanceName}/index.js`]?.default;

if (!performanceScore) throw new Error(`Performance non trovata: ${performanceName}`);

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

const visualRenderer = new Renderer({ canvas, video });
const audioManager = new AudioManager();
const subtitleManager = new SubtitleManager();
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
let automaticFallbackActive = false;

let audioFileSyncEnabled =
  typeof performanceScore.audioFileSync === "boolean"
    ? performanceScore.audioFileSync
    : !["microphone-first", "microphone-or-auto"].includes(performanceScore.audioPolicy);

function setBlackout(active) {
  blackoutActive = active;
  document.body.dataset.blackout = active ? "true" : "false";
  canvas.style.visibility = active ? "hidden" : "visible";
  video.style.visibility = active ? "hidden" : "visible";
  subtitleManager.element.style.visibility = active ? "hidden" : "visible";

  document.querySelectorAll("[data-scene-layer]").forEach((element) => {
    if (element instanceof HTMLElement) {
      element.style.visibility = active ? "hidden" : "visible";
    }
  });

  ui.setStatus(active ? "BLACKOUT" : `Scena ${sceneManager.currentIndex + 1}`);
}

async function setAudioFileSync(active) {
  audioFileSyncEnabled = Boolean(active);

  if (!audioFileSyncEnabled) {
    audioManager.cueAudio.pause();
    audioManager.cueAudio.currentTime = 0;
    ui.setStatus("Sync audio file OFF — analisi microfono attiva");
    return audioFileSyncEnabled;
  }

  const scene = sceneManager.currentScene;
  if (started && scene?.audio) {
    await audioManager.setCueTrack(scene.audio, {
      play: true,
      audible: scene.audioAudible ?? true
    });
  }

  ui.setStatus("Sync audio file ON");
  return audioFileSyncEnabled;
}

const performanceMonitor = new PerformanceMonitor({
  performance: performanceScore,
  sceneManager,
  audioManager,
  onBlackout: setBlackout,
  onAudioFileSync: setAudioFileSync,
  audioFileSyncEnabled
});

window.addEventListener("reactive-archive:scene-change", async (event) => {
  const scene = event.detail?.scene;
  subtitleManager.setScene(scene);

  if (scene && Object.prototype.hasOwnProperty.call(scene, "audio")) {
    await audioManager.setCueTrack(scene.audio, {
      play: started && audioFileSyncEnabled,
      audible: scene.audioAudible ?? true
    });
  }

  performanceMonitor.publish({ level: 0, bass: 0, mid: 0, high: 0 }, true);
});

function animate() {
  requestAnimationFrame(animate);
  visualRenderer.render();
  subtitleManager.update();
}
animate();

function updateAudio() {
  requestAnimationFrame(updateAudio);
  if (!started) return;

  const audioData = audioManager.update();
  const scene = sceneManager.currentScene;
  const now = performance.now();
  if (!scene) return;

  const shouldReact = audioReactiveEnabled && (scene.audioReactive ?? true);
  const silenceThreshold = scene.silenceThreshold ?? 0.035;
  const silenceDelay = scene.silenceDelay ?? 350;
  const fadeInSpeed = scene.fadeInSpeed ?? 0.12;
  const fadeOutSpeed = scene.fadeOutSpeed ?? 0.025;

  if (!shouldReact) {
    visualVisibility += (1 - visualVisibility) * fadeInSpeed;
  } else if (audioData.level > silenceThreshold) {
    lastSoundTime = now;
    visualVisibility += (1 - visualVisibility) * fadeInSpeed;
  } else if (now - lastSoundTime > silenceDelay) {
    visualVisibility += (0 - visualVisibility) * fadeOutSpeed;
  }

  if (visualVisibility < 0.002) visualVisibility = 0;
  if (visualVisibility > 0.998) visualVisibility = 1;

  if (!blackoutActive) canvas.style.opacity = String(visualVisibility);
  visualRenderer.setVisibility(visualVisibility);

  const reactiveAudio = shouldReact
    ? audioData
    : { level: 0, bass: 0, mid: 0, high: 0 };

  visualRenderer.setAudioData(reactiveAudio);
  sceneManager.update(reactiveAudio);
  ui.updateAudioValues(audioData);
  performanceMonitor.publish(audioData);
}
updateAudio();

function prepareMicrophone() {
  if (microphonePreparationPromise) return microphonePreparationPromise;

  ui.setStatus("Richiesta autorizzazione microfono…");
  microphonePreparationPromise = audioManager
    .start({ fallbackPlay: false })
    .then(() => {
      ui.setStatus(
        audioManager.sourceMode === "microphone"
          ? "Microfono autorizzato"
          : "Microfono non disponibile — modalità automatica"
      );
    })
    .catch((error) => {
      console.warn("Microfono non disponibile, continuo senza bloccare.", error);
      microphonePreparationPromise = null;
      audioManager.enableFakeMode();
    });

  return microphonePreparationPromise;
}

function configurePlaybackMode() {
  const microphoneAvailable = audioManager.sourceMode === "microphone";
  const useAutomaticFallback =
    performanceScore.audioPolicy === "microphone-or-auto" &&
    performanceScore.automaticFallback !== false &&
    !microphoneAvailable;

  automaticFallbackActive = useAutomaticFallback;
  sceneManager.setAutomaticMode(useAutomaticFallback);

  if (performanceScore.audioPolicy === "microphone-or-auto") {
    audioFileSyncEnabled = !microphoneAvailable;
  }
}

async function startExperience() {
  if (started) return;

  ui.setStartButtonDisabled(true);
  ui.setStatus("Avvio della performance…");

  try {
    await prepareMicrophone();

    if (audioManager.audioContext?.state === "suspended") {
      await audioManager.audioContext.resume();
    }

    configurePlaybackMode();
    started = true;
    sceneManager.setStarted(true);
    lastSoundTime = performance.now();
    await sceneManager.load(sceneManager.currentIndex);

    ui.setStatus(
      automaticFallbackActive
        ? "AUTO — audio file + sequenza scene"
        : audioFileSyncEnabled
          ? `Audio: ${audioManager.sourceMode} + file sync`
          : `LIVE — audio dal ${audioManager.sourceMode}`
    );

    performanceMonitor.publish({ level: 0, bass: 0, mid: 0, high: 0 }, true);
    ui.hideStartScreen();
    document.documentElement.requestFullscreen().catch(() => {});
  } catch (error) {
    console.error(error);
    started = false;
    ui.setStatus(error instanceof Error ? error.message : "Errore durante l'avvio.");
    ui.setStartButtonDisabled(false);
  }
}

function toggleAudioReactive() {
  audioReactiveEnabled = !audioReactiveEnabled;
  ui.setAudioReactiveState(audioReactiveEnabled);
  ui.setStatus(
    audioReactiveEnabled
      ? "Audio reactivity attiva"
      : "Audio reactivity disattivata"
  );
}

async function toggleMicrophoneMode() {
  try {
    if (audioManager.sourceMode !== "microphone") {
      ui.setStatus("Attivazione del microfono…");
      microphonePreparationPromise = null;
      await prepareMicrophone();
    } else {
      await audioManager.activateCueOrFake({ play: audioFileSyncEnabled });
    }

    configurePlaybackMode();
    ui.setStatus(
      automaticFallbackActive
        ? "AUTO — audio file + sequenza scene"
        : `Audio: ${audioManager.sourceMode}`
    );
    performanceMonitor.publish({ level: 0, bass: 0, mid: 0, high: 0 }, true);
  } catch (error) {
    console.error(error);
    ui.setStatus(error instanceof Error ? error.message : "Errore audio.");
  }
}

window.addEventListener("keydown", (event) => {
  if (event.key.toLowerCase() !== "s") return;
  const enabled = subtitleManager.toggle();
  ui.setStatus(enabled ? "Sottotitoli attivi" : "Sottotitoli disattivati");
});

ui.onStart(startExperience);
ui.onNextVideo(() => sceneManager.next());
ui.onPreviousVideo(() => sceneManager.previous());
ui.onSelectVideo((index) => sceneManager.select(index));
ui.onToggleAudioReactive(toggleAudioReactive);
ui.onToggleMicrophoneMode(toggleMicrophoneMode);
ui.onRestartVideo(() => sceneManager.restart());
ui.setAudioReactiveState(audioReactiveEnabled);

performanceMonitor.publish({ level: 0, bass: 0, mid: 0, high: 0 }, true);
ui.setStatus("Premi AVVIA: microfono = LIVE, senza microfono = AUTO.");