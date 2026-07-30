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
    // Per il test attuale la prima scena usa il file realmente presente
    // in public/elisa/videos/video-01.mp4.
    src: index === 0
      ? `${baseUrl}elisa/videos/video-01.mp4`
      : resolvePublicAsset(scene.src),
    text: scene.dialogue ? dialogues[scene.dialogue] : undefined,
    patch: scene.module ? hydraModules[scene.module] : undefined
  }))
};