import data from "./performance.json";
import intro from "./texts/intro.js";
import outro from "./texts/outro.js";
import drift from "./hydra/drift.js";
import finale from "./hydra/finale.js";

const texts = {
  intro,
  outro
};

const hydraModules = {
  drift,
  finale
};

export default {
  ...data,
  scenes: data.scenes.map((scene) => ({
    ...scene,
    text: scene.content ? texts[scene.content] : undefined,
    patch: scene.module ? hydraModules[scene.module] : undefined
  }))
};
