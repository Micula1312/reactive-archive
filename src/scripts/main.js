import Renderer from "./Renderer.js";
import AudioManager from "./AudioManager.js";
import { UIManager } from "./AppUi.js";
import { playlist } from "./Playlist.js";

/* =========================================================
   ELEMENTI HTML
   ========================================================= */

const canvas =
  document.querySelector("#visual-canvas");

const video =
  document.querySelector("#source-video");

const startScreen =
  document.querySelector("#start-screen");

const startButton =
  document.querySelector("#start-button");

const status =
  document.querySelector("#status");

const debugPanel =
  document.querySelector("#debug-panel");

const audioValue =
  document.querySelector("#audio-value");

const bassValue =
  document.querySelector("#bass-value");

const midValue =
  document.querySelector("#mid-value");

const highValue =
  document.querySelector("#high-value");

/* =========================================================
   VALIDAZIONE HTML
   ========================================================= */

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
  throw new Error(
    "Mancano alcuni elementi necessari nella pagina."
  );
}

/* =========================================================
   MODULI
   ========================================================= */

const visualRenderer =
  new Renderer({
    canvas,
    video
  });

const audioManager =
  new AudioManager();

const ui =
  new UIManager({
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

/* =========================================================
   STATO
   ========================================================= */

let currentVideoIndex = 0;
let audioReactiveEnabled = true;
let started = false;
let microphonePreparationPromise = null;

const SILENCE_THRESHOLD = 0.035;
const SILENCE_DELAY = 350;

const FADE_IN_SPEED = 0.12;
const FADE_OUT_SPEED = 0.025;

let visualVisibility = 0;
let lastSoundTime = performance.now();

/* =========================================================
   LOOP GRAFICO
   ========================================================= */

function animate() {
  requestAnimationFrame(animate);

  visualRenderer.render();
}

animate();

/* =========================================================
   AUDIO E VISIBILITÀ
   ========================================================= */

function updateAudio() {
  requestAnimationFrame(updateAudio);

  if (!started) {
    return;
  }

  const audioData =
    audioManager.update();

  const now =
    performance.now();

  if (!audioReactiveEnabled) {
    visualVisibility +=
      (1 - visualVisibility) *
      FADE_IN_SPEED;
  } else if (
    audioData.level >
    SILENCE_THRESHOLD
  ) {
    lastSoundTime = now;

    visualVisibility +=
      (1 - visualVisibility) *
      FADE_IN_SPEED;
  } else if (
    now - lastSoundTime >
    SILENCE_DELAY
  ) {
    visualVisibility +=
      (0 - visualVisibility) *
      FADE_OUT_SPEED;
  }

  if (visualVisibility < 0.002) {
    visualVisibility = 0;
  }

  if (visualVisibility > 0.998) {
    visualVisibility = 1;
  }

  canvas.style.opacity =
    String(visualVisibility);

  visualRenderer.setVisibility(
    visualVisibility
  );

  if (audioReactiveEnabled) {
    visualRenderer.setAudioData(
      audioData
    );
  } else {
    visualRenderer.setAudioData({
      level: 0,
      bass: 0,
      mid: 0,
      high: 0
    });
  }

  ui.updateAudioValues(
    audioData
  );
}

updateAudio();

/* =========================================================
   PREPARAZIONE MICROFONO IMMEDIATA
   ========================================================= */

function prepareMicrophone() {
  if (microphonePreparationPromise) {
    return microphonePreparationPromise;
  }

  ui.setStatus(
    "Autorizza il microfono per continuare…"
  );

  microphonePreparationPromise =
    audioManager.start()
      .then(() => {
        ui.setStatus(
          audioManager.fakeMode
            ? "Microfono non disponibile — modalità fake pronta"
            : "Microfono autorizzato — premi START"
        );
      })
      .catch((error) => {
        console.error(error);

        ui.setStatus(
          error instanceof Error
            ? error.message
            : "Errore durante l’attivazione del microfono."
        );
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
      audioManager.audioContext.state === "suspended"
    ) {
      await audioManager.audioContext.resume();
    }

    ui.setStatus(
      "Avvio del video…"
    );

    started = true;
    lastSoundTime = performance.now();

    await loadVideo(
      currentVideoIndex
    );

    ui.hideStartScreen();

    document.documentElement
      .requestFullscreen()
      .catch(() => {});
  } catch (error) {
    console.error(error);

    ui.setStatus(
      error instanceof Error
        ? error.message
        : "Errore durante l'avvio."
    );

    ui.setStartButtonDisabled(false);
  }
}

/* =========================================================
   PLAYLIST
   ========================================================= */

async function loadVideo(index) {
  if (playlist.length === 0) {
    ui.setStatus(
      "La playlist è vuota."
    );

    return;
  }

  currentVideoIndex =
    (index + playlist.length) %
    playlist.length;

  const selectedVideo =
    playlist[currentVideoIndex];

  video.pause();

  video.src =
    selectedVideo.src;

  video.load();

  ui.setStatus(
    `${currentVideoIndex + 1} / ${playlist.length} — ${selectedVideo.title}`
  );

  if (!started) {
    return;
  }

  try {
    await video.play();
  } catch (error) {
    console.error(
      "Impossibile riprodurre il video:",
      error
    );
  }
}

function loadNextVideo() {
  loadVideo(
    currentVideoIndex + 1
  );
}

function loadPreviousVideo() {
  loadVideo(
    currentVideoIndex - 1
  );
}

function selectVideo(index) {
  if (
    index < 0 ||
    index >= playlist.length
  ) {
    return;
  }

  loadVideo(index);
}

function restartVideo() {
  video.currentTime = 0;

  if (started) {
    video
      .play()
      .catch(console.error);
  }
}

/* =========================================================
   AUDIO REACTIVE
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
   MICROFONO / FAKE MODE
   ========================================================= */

async function toggleMicrophoneMode() {
  try {
    if (audioManager.fakeMode) {
      ui.setStatus(
        "Attivazione del microfono…"
      );

      microphonePreparationPromise = null;
      await prepareMicrophone();

      ui.setStatus(
        audioManager.fakeMode
          ? "Microfono non disponibile"
          : "Microfono attivo"
      );
    } else {
      audioManager.enableFakeMode();

      ui.setStatus(
        "Fake audio mode attivo"
      );
    }
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
  loadNextVideo
);

ui.onPreviousVideo(
  loadPreviousVideo
);

ui.onSelectVideo(
  selectVideo
);

ui.onToggleAudioReactive(
  toggleAudioReactive
);

ui.onToggleMicrophoneMode(
  toggleMicrophoneMode
);

ui.onRestartVideo(
  restartVideo
);

ui.setAudioReactiveState(
  audioReactiveEnabled
);

prepareMicrophone();
