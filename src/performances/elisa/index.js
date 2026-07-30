import data from "./performance.json";
import dialogues from "./dialogues.js";
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
  timeline: data.timeline
    ? {
        ...data.timeline,
        audio: resolvePublicAsset(data.timeline.audio)
      }
    : undefined,
  scenes: data.scenes.map((scene) => {
    const clips = Array.isArray(scene.clips)
      ? scene.clips.map(resolvePublicAsset)
      : [];

    return {
      ...scene,
      src: clips[0] ?? resolvePublicAsset(scene.src),
      sequence: clips.slice(1),
      text: scene.dialogue ? dialogues[scene.dialogue] : undefined,
      patch: scene.module ? hydraModules[scene.module] : undefined
    };
  })
};
