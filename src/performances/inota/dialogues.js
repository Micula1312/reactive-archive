import elisaDialogues from "../elisa/dialogues.js";

// Re-time the original ELISA Hydra texts to the six INOTA scenes.
// Text is unchanged; only cue timing is compressed to fit the 8-minute score.
function fit(cues = [], durationSeconds = 60, padding = 4) {
  if (!cues.length) return [];
  const sourceEnd = Math.max(...cues.map((cue) => Number(cue.end ?? cue.time ?? 0)), 1);
  const usable = Math.max(1, durationSeconds - padding * 2);
  const scale = usable / sourceEnd;

  return cues.map((cue) => ({
    ...cue,
    speaker: "",
    label: "",
    time: padding + Number(cue.time ?? 0) * scale,
    end: padding + Number(cue.end ?? cue.time ?? 0) * scale
  }));
}

export default {
  threshold: fit(elisaDialogues.intro, 70, 5),
  body: fit(elisaDialogues.genesis, 70, 4),
  spill: fit(elisaDialogues.hypnosis, 75, 4),
  rupture: fit(elisaDialogues.resonance, 85, 4),
  expansion: fit(elisaDialogues.crossing, 95, 4),
  afterimage: fit(elisaDialogues.farewell, 85, 4)
};
