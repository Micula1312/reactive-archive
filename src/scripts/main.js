import Renderer from "./Renderer.js";
import AudioManager from "./AudioManager.js";

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

if (!(canvas instanceof HTMLCanvasElement)) {
  throw new Error("Canvas #visual-canvas non trovato.");
}

if (!(video instanceof HTMLVideoElement)) {
  throw new Error("Video #source-video non trovato.");
}

if (!(startButton instanceof HTMLButtonElement)) {
  throw new Error("Pulsante #start-button non trovato.");
}

const renderer = new Renderer({
  canvas,
  video,
});

const audioManager = new AudioManager();

/*
 * REGOLAZIONE SILENZIO / FADE
 *
 * SILENCE_THRESHOLD:
 * sotto questo livello il segnale viene considerato silenzio.
 *
 * SILENCE_DELAY:
 * millisecondi di attesa prima di iniziare lo spegnimento.
 *
 * FADE_IN_SPEED:
 * velocità con cui l'immagine torna visibile.
 *
 * FADE_OUT_SPEED:
 * velocità con cui l'immagine sfuma al nero.
 */
const SILENCE_THRESHOLD = 0.035;
const SILENCE_DELAY = 350;
const FADE_IN_SPEED = 0.12;
const FADE_OUT_SPEED = 0.025;

let started = false;
let audioReactiveEnabled = true;
let blackoutEnabled = false;

let visualVisibility = 0;
let lastSoundTime = performance.now();

function clamp01(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return 0;
  }

  return Math.max(0, Math.min(1, number));
}

function normalizeAudioData(data) {
  if (!data || typeof data !== "object") {
    return {
      audio: 0,
      bass: 0,
      mid: 0,
      high: 0,
    };
  }

  return {
    audio: clamp01(
      data.audio ??
      data.level ??
      data.volume ??
      data.overall ??
      0
    ),

    bass: clamp01(
      data.bass ??
      data.low ??
      0
    ),

    mid: clamp01(
      data.mid ??
      data.middle ??
      0
    ),

    high: clamp01(
      data.high ??
      data.treble ??
      0
    ),
  };
}

/*
 * Compatibilità con differenti versioni di AudioManager.
 * Usa il primo metodo disponibile.
 */
function readAudioData() {
  let data = null;

  if (typeof audioManager.update === "function") {
    data = audioManager.update();
  }

  if (!data && typeof audioManager.getAudioData === "function") {
    data = audioManager.getAudioData();
  }

  if (!data && typeof audioManager.getLevels === "function") {
    data = audioManager.getLevels();
  }

  if (!data && audioManager.levels) {
    data = audioManager.levels;
  }

  return normalizeAudioData(data);
}

async function startAudio() {
  if (typeof audioManager.start === "function") {
    await audioManager.start();
    return;
  }

  if (typeof audioManager.init === "function") {
    await audioManager.init();
    return;
  }

  if (typeof audioManager.enableMicrophone === "function") {
    await audioManager.enableMicrophone();
  }
}

function updateVisibility(audio) {
  const now = performance.now();

  if (!audioReactiveEnabled) {
    visualVisibility +=
      (1 - visualVisibility) *
      FADE_IN_SPEED;

    return;
  }

  if (audio > SILENCE_THRESHOLD) {
    lastSoundTime = now;

    visualVisibility +=
      (1 - visualVisibility) *
      FADE_IN_SPEED;
  } else {
    const silenceDuration =
      now - lastSoundTime;

    if (silenceDuration > SILENCE_DELAY) {
      visualVisibility +=
        (0 - visualVisibility) *
        FADE_OUT_SPEED;
    }
  }

  if (visualVisibility < 0.002) {
    visualVisibility = 0;
  }

  if (visualVisibility > 0.998) {
    visualVisibility = 1;
  }
}

function updateDebug(data) {
  if (audioValue) {
    audioValue.textContent = data.audio.toFixed(3);
  }

  if (bassValue) {
    bassValue.textContent = data.bass.toFixed(3);
  }

  if (midValue) {
    midValue.textContent = data.mid.toFixed(3);
  }

  if (highValue) {
    highValue.textContent = data.high.toFixed(3);
  }
}

function animate() {
  window.requestAnimationFrame(animate);

  const audioData = started
    ? readAudioData()
    : {
        audio: 0,
        bass: 0,
        mid: 0,
        high: 0,
      };

  updateVisibility(audioData.audio);
  updateDebug(audioData);

  renderer.setAudioData(
    audioReactiveEnabled
      ? audioData
      : {
          audio: 0,
          bass: 0,
          mid: 0,
          high: 0,
        }
  );

  renderer.setReactivity(
    audioReactiveEnabled
      ? 1
      : 0
  );

  renderer.setVisibility(
    blackoutEnabled
      ? 0
      : visualVisibility
  );

  renderer.render();
}

async function startExperience() {
  if (started) {
    return;
  }

  startButton.disabled = true;

  if (status) {
    status.textContent =
      "Avvio del video e del segnale audio…";
  }

  try {
    video.muted = true;
    video.loop = true;

    await video.play();

    try {
      await startAudio();

      if (status) {
        status.textContent =
          "Microfono attivo.";
      }
    } catch (audioError) {
      console.warn(
        "Microfono non disponibile:",
        audioError
      );

      if (status) {
        status.textContent =
          "Video avviato. Microfono non disponibile: resta attiva l’eventuale modalità fake.";
      }
    }

    started = true;
    lastSoundTime = performance.now();

    if (startScreen) {
      startScreen.hidden = true;
    }
  } catch (error) {
    console.error(
      "Errore durante l’avvio:",
      error
    );

    startButton.disabled = false;

    if (status) {
      status.textContent =
        "Impossibile avviare il video. Controlla la console.";
    }
  }
}

startButton.addEventListener(
  "click",
  startExperience
);

window.addEventListener(
  "keydown",
  async (event) => {
    const key = event.key.toLowerCase();

    if (key === "h" && debugPanel) {
      debugPanel.hidden =
        !debugPanel.hidden;
    }

    if (key === "a") {
      audioReactiveEnabled =
        !audioReactiveEnabled;

      /*
       * Quando disattivi la reattività,
       * l'immagine torna dolcemente piena.
       */
      if (!audioReactiveEnabled) {
        lastSoundTime = performance.now();
      }

      console.log(
        `Audio reactive: ${
          audioReactiveEnabled
            ? "ON"
            : "OFF"
        }`
      );
    }

    if (key === "b") {
      blackoutEnabled =
        !blackoutEnabled;

      canvas.classList.toggle(
        "blackout",
        blackoutEnabled
      );
    }

    if (key === "m") {
      if (typeof audioManager.toggleMode === "function") {
        await audioManager.toggleMode();
      } else if (typeof audioManager.toggleFakeMode === "function") {
        audioManager.toggleFakeMode();
      } else {
        console.warn(
          "AudioManager non espone toggleMode() o toggleFakeMode()."
        );
      }
    }
  }
);

animate();
