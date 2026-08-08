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

function resolveCueClips(scene, subtitleCues) {
  const raw = Array.isArray(scene.cueClips)
    ? scene.cueClips
    : scene.cueClip
      ? [scene.cueClip]
      : [];

  return raw
    .filter((item) => item?.src)
    .map((item) => {
      const needle = String(item.text ?? "").trim().toLowerCase();
      const matchingCue = subtitleCues.find((cue) =>
        String(cue?.text ?? "").toLowerCase().includes(needle)
      );

      return {
        ...item,
        src: resolvePublicAsset(item.src),
        time: Number(matchingCue?.time ?? item.time ?? 0)
      };
    });
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
  scenes: data.scenes.map((scene) => {
    const clips = Array.isArray(scene.clips)
      ? scene.clips.map(resolvePublicAsset)
      : [];
    const subtitleCues = dialogues[scene.dialogue ?? scene.id] ?? [];

    return {
      ...scene,
      output: data.output,
      src: clips[0] ?? resolvePublicAsset(scene.src),
      sequence: clips.slice(1),
      subtitleCues,
      subtitleLayout: "ceiling",
      subtitleTyping: scene.subtitleTyping ?? data.subtitleTyping ?? false,
      subtitleTypingSpeed: scene.subtitleTypingSpeed ?? data.subtitleTypingSpeed ?? 38,
      cueClips: resolveCueClips(scene, subtitleCues),
      patch: scene.module ? hydraModules[scene.module] : undefined
    };
  })
};
