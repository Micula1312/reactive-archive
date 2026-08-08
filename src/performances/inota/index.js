import data from "./performance.json";
import hydraModules from "./hydra/index.js";

const baseUrl = import.meta.env.BASE_URL;

function resolvePublicAsset(src) {
  if (!src || /^(https?:|data:|blob:)/.test(src)) return src;
  return `${baseUrl}${src.replace(/^\//, "")}`;
}

export default {
  ...data,
  audioPolicy: "timeline-track",
  mode: "timeline",
  automaticFallback: false,
  timeline: {
    ...data.timeline,
    audio: resolvePublicAsset(data.timeline.audio)
  },
  scenes: data.scenes.map((scene) => ({
    ...scene,
    output: data.output,
    patch: scene.module ? hydraModules[scene.module] : undefined
  }))
};
