import data from "./performance.json";
import dialogues from "./dialogues.js";
import hydraModules from "./hydra/index.js";

export default {
  ...data,
  scenes: data.scenes.map((scene) => ({
    ...scene,
    text: scene.dialogue ? dialogues[scene.dialogue] : undefined,
    patch: scene.module ? hydraModules[scene.module] : undefined
  }))
};