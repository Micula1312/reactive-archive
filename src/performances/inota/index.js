import data from "./performance.json";
import dialogues from "./dialogues.js";
import hydraModules from "./hydra/index.js";
import installInotaCeilingTextStyle from "./ceilingTextStyle.js";

const baseUrl = import.meta.env.BASE_URL;

function resolvePublicAsset(src) {
  if (!src || /^(https?:|data:|blob:)/.test(src)) return src;
  return `${baseUrl}${src.replace(/^\//, "")}`;
}

installInotaCeilingTextStyle();

export default {
  ...data,
  audioPolicy: "timeline-track",
  mode: "timeline",
  automaticFallback: false,
  timeline: {
    ...data.timeline,
    audio: resolvePublicAsset(data.timeline.audio)
  },
  scenes: data.scenes.map((scene) => {
    const clips = Array.isArray(scene.clips)
      ? scene.clips.map(resolvePublicAsset)
      : [];

    return {
      ...scene,
      output: data.output,
      src: clips[0] ?? resolvePublicAsset(scene.src),
      sequence: clips.slice(1),
      subtitleCues: dialogues[scene.dialogue ?? scene.id],
      subtitleLayout: "ceiling",
      patch: scene.module ? hydraModules[scene.module] : undefined
    };
  })
};
