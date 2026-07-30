import data from "./performance.json";
import dialogues from "./dialogues.js";
import hydraModules from "./hydra/index.js";

const baseUrl = import.meta.env.BASE_URL;

function resolvePublicAsset(src) {
  if (!src || /^(https?:|data:|blob:)/.test(src)) {
    return src;
  }

  return `${baseUrl}${src.replace(/^\//, "")}`;
}

export default {
  ...data,
  // Con microfono: performance live, tutta la reattività arriva dal mic.
  // Senza microfono: il motore abilita i file audio e avanza le scene in automatico.
  audioPolicy: "microphone-or-auto",
  mode: "manual",
  automaticFallback: true,
  scenes: data.scenes.map((scene, index) => ({
    ...scene,
    src: resolvePublicAsset(scene.src),
    ...(index === 0
      ? {
          audio: `${baseUrl}elisa/audio/prima_parte.mp3`,
          audioAudible: true
        }
      : {}),
    text: scene.dialogue ? dialogues[scene.dialogue] : undefined,
    patch: scene.module ? hydraModules[scene.module] : undefined
  }))
};