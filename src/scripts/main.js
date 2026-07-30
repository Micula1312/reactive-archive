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

const timeline = performanceScore.timeline?.useAsClock
  ? performanceScore.timeline
  : null;

function parseTimecode(value) {
  if (typeof value === "number") return value;
  const parts = String(value ?? "0").split(":").map(Number);
  if (parts.some((part) => !Number.isFinite(part))) return 0;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] || 0;
}

const sceneStartTimes = performanceScore.scenes.map((scene) => parseTimecode(scene.start));

let blackoutActive = false;
let audioReactiveEnabled = true;
let started = false;
let microphonePreparationPromise = null;
let microphoneAvailable = false;
let soloMicEnabled = false;
let audioFileSyncEnabled = false;
let automaticFallbackActive = false;
let timelineSceneLoading = false;
let visualVisibility = performanceScore.minimumVisibility ?? 0.32;
let lastSoundTime = performance.now();

function setBlackout(active) {
  blackoutActive = Boolean(active);
  document.body.dataset.blackout = blackoutActive ? "true" : "false";
  canvas.style.visibility = blackoutActive ? "hidden" : "visible";
  video.style.visibility = blackoutActive ? "hidden" : "visible";
  subtitleManager.element.style.visibility = blackoutActive ? "hidden" : "visible";

  document.querySelectorAll("[data-scene-layer]").forEach((element) => {
    if (element instanceof HTMLElement) {
      element.style.visibility = blackoutActive ? "hidden" : "visible";
    }
  });

  ui.setStatus(blackoutActive ? "BLACKOUT" : `Scena ${sceneManager.currentIndex + 1}`);
}

function configurePlaybackMode() {
  if (timeline) {
    audioFileSyncEnabled = !soloMicEnabled;
    automaticFallbackActive = false;
    sceneManager.setAutomaticMode(false);
    return;
  }

  audioFileSyncEnabled = !soloMicEnabled && !microphoneAvailable;
  automaticFallbackActive =
    audioFileSyncEnabled && performanceScore.automaticFallback !== false;
  sceneManager.setAutomaticMode(automaticFallbackActive);
}

async function ensureTimelineAudio({ restart = false } = {}) {
  if (!timeline?.audio) return;

  const sameTrack = audioManager.cueTrack === timeline.audio;
  await audioManager.setCueTrack(timeline.audio, {
    play: started || timeline.autoplay !== false,
    audible: !audioManager.outputMuted && !soloMicEnabled,
    activate: !soloMicEnabled,
    forceActivate: !soloMicEnabled,
    restart: restart || !sameTrack
  });

  if (timeline.loop) audioManager.cueAudio.loop = true;
}

async function applyCurrentSceneAudio({ restart = true } = {}) {
  if (timeline) {
    await ensureTimelineAudio({ restart: false });
    return;
  }

  const scene = sceneManager.currentScene;

  if (soloMicEnabled) {
    audioManager.stopCue({ reset: true });
    return;
  }

  if (!scene || !Object.prototype.hasOwnProperty.call(scene, "audio")) {
    if (!microphoneAvailable) audioManager.enableFakeMode();
    return;
  }

  await audioManager.setCueTrack(scene.audio, {
    play: started && audioFileSyncEnabled,
    audible: scene.audioAudible ?? true,
    activate: true,
    forceActivate: !microphoneAvailable,
    restart
  });
}

async function setSoloMic(active) {
  soloMicEnabled = Boolean(active);

  if (soloMicEnabled) {
    if (timeline) {
      audioManager.disconnectCueOutput();
      audioManager.cueAudio.play().catch(() => {});
    } else {
      audioManager.stopCue({ reset: true });
    }

    microphonePreparationPromise = null;
    microphoneAvailable = await prepareMicrophone();
    audioFileSyncEnabled = false;
    automaticFallbackActive = false;
    sceneManager.setAutomaticMode(false);
    ui.setStatus(
      microphoneAvailable
        ? "SOLO MIC — timeline continua silenziosa"
        : "SOLO MIC — microfono non disponibile"
    );
  } else {
    configurePlaybackMode();
    if (timeline) {
      await ensureTimelineAudio({ restart: false });
    } else {
      await applyCurrentSceneAudio({ restart: false });
    }
    ui.setStatus(timeline ? "TRACK — timeline e audioreattività" : "Modalità automatica");
  }

  return soloMicEnabled;
}

const performanceMonitor = new PerformanceMonitor({
  performance: performanceScore,
  sceneManager,
  audioManager,
  onBlackout: setBlackout,
  onSoloMic: setSoloMic,
  getSoloMic: () => soloMicEnabled,
  getAudioFileSync: () => audioFileSyncEnabled
});

window.addEventListener("reactive-archive:scene-change", async (event) => {
  const scene = event.detail?.scene;
  subtitleManager.setScene(scene);
  visualVisibility = 1;
  lastSoundTime = performance.now();
  canvas.style.opacity = "1";
  visualRenderer.setVisibility(1);
  await applyCurrentSceneAudio({ restart: true });
  performanceMonitor.publish({ level: 0, bass: 0, mid: 0, high: 0 }, true);
});

function animate() {
  requestAnimationFrame(animate);
  visualRenderer.render();
  subtitleManager.update();
}
animate();

async function syncSceneToTimeline() {
  if (!timeline || timelineSceneLoading || audioManager.cueAudio.paused) return;

  const currentTime = audioManager.cueAudio.currentTime;
  let targetIndex = 0;

  for (let index = 0; index < sceneStartTimes.length; index += 1) {
    if (currentTime >= sceneStartTimes[index]) targetIndex = index;
    else break;
  }

  if (targetIndex === sceneManager.currentIndex) return;

  timelineSceneLoading = true;
  try {
    await sceneManager.load(targetIndex);
  } finally {
    timelineSceneLoading = false;
  }
}

function updateAudio() {
  requestAnimationFrame(updateAudio);
  if (!started) return;

  syncSceneToTimeline().catch(console.error);

  const audioData = audioManager.update();
  const scene = sceneManager.currentScene;
  const now = performance.now();
  if (!scene) return;

  const shouldReact = audioReactiveEnabled && (scene.audioReactive ?? true);
  const silenceThreshold = scene.silenceThreshold ?? 0.025;
  const silenceDelay = scene.silenceDelay ?? 350;
  const fadeInSpeed = scene.fadeInSpeed ?? 0.18;
  const fadeOutSpeed = scene.fadeOutSpeed ?? 0.045;
  const minimumVisibility = Math.max(
    0.05,
    Math.min(1, scene.minimumVisibility ?? performanceScore.minimumVisibility ?? 0.28)
  );

  let targetVisibility = 1;
  if (shouldReact && audioData.level <= silenceThreshold && now - lastSoundTime > silenceDelay) {
    targetVisibility = minimumVisibility;
  } else if (audioData.level > silenceThreshold) {
    lastSoundTime = now;
  }

  const speed = targetVisibility > visualVisibility ? fadeInSpeed : fadeOutSpeed;
  visualVisibility += (targetVisibility - visualVisibility) * speed;
  visualVisibility = Math.max(minimumVisibility, Math.min(1, visualVisibility));

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
    .then((available) => {
      microphoneAvailable = Boolean(available);
      ui.setStatus(
        microphoneAvailable
          ? "Microfono autorizzato"
          : "Microfono non disponibile — userò l’audio della scena"
      );
      return microphoneAvailable;
    })
    .catch((error) => {
      console.warn("Microfono non disponibile, continuo senza bloccare.", error);
      microphoneAvailable = false;
      audioManager.enableFakeMode();
      return false;
    });

  return microphonePreparationPromise;
}

async function startExperience() {
  if (started) return;

  ui.setStartButtonDisabled(true);
  ui.setStatus("Avvio della performance…");

  try {
    if (!timeline || timeline.reactiveSource !== "track") {
      microphoneAvailable = await prepareMicrophone();
    }

    if (audioManager.audioContext?.state === "suspended") {
      await audioManager.audioContext.resume();
    }

    configurePlaybackMode();
    started = true;
    sceneManager.setStarted(true);
    lastSoundTime = performance.now();

    if (timeline) {
      await ensureTimelineAudio({ restart: true });
    }

    await sceneManager.load(0);

    ui.setStatus(
      timeline
        ? "TIMELINE 15:00 — audioreattività dalla traccia"
        : microphoneAvailable
          ? "LIVE — audioreattività dal microfono"
          : "AUTO — traccia scena + audioreattività"
    );

    performanceMonitor.publish({ level: 0, bass: 0, mid: 0, high: 0 }, true);
    ui.hideStartScreen();
    document.documentElement.requestFullscreen().catch(() => {});
  } catch (error) {
    console.error(error);
    started = false;
    ui.setStatus(error instanceof Error ? error.message : "Errore durante l’avvio.");
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
  microphonePreparationPromise = null;
  microphoneAvailable = await prepareMicrophone();
  configurePlaybackMode();
  await applyCurrentSceneAudio({ restart: false });
  ui.setStatus(
    microphoneAvailable
      ? "Audioreattività dal microfono"
      : "Audioreattività dalla traccia"
  );
  performanceMonitor.publish({ level: 0, bass: 0, mid: 0, high: 0 }, true);
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
ui.setStatus(timeline ? "Premi AVVIA: test timeline da 15 minuti." : "Premi AVVIA.");
