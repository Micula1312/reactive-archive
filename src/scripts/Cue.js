export default class Cue {
  constructor(data, index = 0) {
    if (!data?.type) throw new Error("Cue: type mancante.");

    Object.assign(this, data);
    this.index = index;
    this.id = data.id ?? `cue-${String(index + 1).padStart(2, "0")}`;
    this.title = data.title ?? this.id;
    this.type = data.type;
    this.duration = Number(data.duration ?? 0);
  }

  get isTimed() {
    return this.duration > 0;
  }

  toJSON() {
    return { ...this };
  }
}

export function normalizePerformance(performanceData) {
  return {
    ...performanceData,
    scenes: performanceData.scenes.map((scene, index) => new Cue(scene, index))
  };
}
