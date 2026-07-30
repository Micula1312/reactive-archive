export const VIDEO_CONTROLS = {
  intensity: { label: "Intensity", min: 0, max: 1, step: 0.01 },
  bassImpact: { label: "Bass impact", min: 0, max: 1, step: 0.01 },
  midFlow: { label: "Mid flow", min: 0, max: 1, step: 0.01 },
  highDetail: { label: "High detail", min: 0, max: 1, step: 0.01 },
  reactivity: { label: "Reactivity", min: 0, max: 1, step: 0.01 }
};

export function getSceneControls(scene) {
  if (!scene) return [];

  if (Array.isArray(scene.controls) && scene.controls.length) {
    return scene.controls.map((control) => {
      const key = control.key;
      const target = control.target ?? `parameters.${key}`;
      return {
        key,
        target,
        label: control.label ?? key,
        min: Number(control.min ?? 0),
        max: Number(control.max ?? 1),
        step: Number(control.step ?? 0.01),
        value: readTarget(scene, target, control.default ?? 0)
      };
    });
  }

  if (scene.type !== "video") return [];

  return Object.keys(VIDEO_CONTROLS)
    .filter((key) => key === "reactivity" || key in (scene.filter ?? {}))
    .map((key) => ({
      key,
      target: key === "reactivity" ? "reactivity" : `filter.${key}`,
      ...VIDEO_CONTROLS[key],
      value: key === "reactivity"
        ? Number(scene.reactivity ?? 1)
        : Number(scene.filter?.[key] ?? 0)
    }));
}

export function readTarget(scene, target, fallback = 0) {
  let value = scene;
  for (const part of String(target).split(".")) value = value?.[part];
  const number = Number(value);
  return Number.isFinite(number) ? number : Number(fallback) || 0;
}

export function writeTarget(scene, target, value) {
  const parts = String(target).split(".");
  let object = scene;

  for (let index = 0; index < parts.length - 1; index += 1) {
    const part = parts[index];
    if (!object[part] || typeof object[part] !== "object") object[part] = {};
    object = object[part];
  }

  object[parts[parts.length - 1]] = value;
}
