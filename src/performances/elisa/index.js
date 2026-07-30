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
  scenes: data.scenes.map((scene, index) => ({
    ...scene,
    // Tutti i video Elisa vivono in public/elisa/videos.
    // Il path dichiarato nella partitura viene risolto rispetto a BASE_URL,
    // senza override speciali sulla prima scena.
    src: resolvePublicAsset(scene.src),
    // Il sottofondo parte con la prima scena e resta attivo
    // finché una scena successiva non dichiara esplicitamente audio: null.
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