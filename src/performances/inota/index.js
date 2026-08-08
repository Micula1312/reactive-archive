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

function normalizeClips(scene) {
  if (!Array.isArray(scene.clips)) return [];

  return scene.clips
    .map((clip, index) => {
      if (typeof clip === "string") {
        return {
          src: resolvePublicAsset(clip),
          start: index === 0 ? 0 : null,
          in: 0,
          out: null
        };
      }

      if (!clip?.src) return null;

      return {
        ...clip,
        src: resolvePublicAsset(clip.src),
        start: Number.isFinite(Number(clip.start)) ? Number(clip.start) : null,
        in: Math.max(0, Number(clip.in ?? 0)),
        out: Number.isFinite(Number(clip.out)) ? Number(clip.out) : null,
        loop: Boolean(clip.loop ?? false)
      };
    })
    .filter(Boolean);
}

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
        time: Number(matchingCue?.time ?? item.time ?? 0),
        in: Math.max(0, Number(item.in ?? 0)),
        out: Number.isFinite(Number(item.out)) ? Number(item.out) : null
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
    const clips = normalizeClips(scene);
    const subtitleCues = dialogues[scene.dialogue ?? scene.id] ?? [];

    return {
      ...scene,
      output: data.output,
      clips,
      src: clips[0]?.src ?? resolvePublicAsset(scene.src),
      sequence: clips.slice(1).map((clip) => clip.src),
      subtitleCues,
      subtitleLayout: "ceiling",
      subtitleTyping: scene.subtitleTyping ?? data.subtitleTyping ?? false,
      subtitleTypingSpeed: scene.subtitleTypingSpeed ?? data.subtitleTypingSpeed ?? 38,
      cueClips: resolveCueClips(scene, subtitleCues),
      patch: scene.module ? hydraModules[scene.module] : undefined
    };
  })
};
