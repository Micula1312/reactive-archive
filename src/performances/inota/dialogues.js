import elisaDialogues from "../elisa/dialogues.js";

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

function mergeGroups(groups = [], durationSeconds = 60, padding = 4) {
  const source = groups.flat().map((cue) => ({ ...cue }));
  if (!source.length) return [];

  const normalized = [];
  let cursor = 0;
  for (const group of groups) {
    const groupEnd = Math.max(...group.map((cue) => Number(cue.end ?? cue.time ?? 0)), 1);
    for (const cue of group) {
      normalized.push({
        ...cue,
        time: cursor + Number(cue.time ?? 0),
        end: cursor + Number(cue.end ?? cue.time ?? 0)
      });
    }
    cursor += groupEnd + 2;
  }

  return fit(normalized, durationSeconds, padding);
}

// Five-scene INOTA adaptation. Original ELISA text is preserved; only timing is compressed.
export default {
  scene01: mergeGroups([elisaDialogues.intro, elisaDialogues.genesis], 85, 5),
  scene02: fit(elisaDialogues.hypnosis, 90, 5),
  scene03: fit(elisaDialogues.resonance, 85, 5),
  scene04: fit(elisaDialogues.crossing, 105, 5),
  scene05: fit(elisaDialogues.farewell, 115, 5)
};
