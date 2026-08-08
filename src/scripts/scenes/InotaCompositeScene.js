import Hydra from "hydra-synth";

export default class InotaCompositeScene {
  constructor({ scene, video, renderer }) {
    this.scene = scene;
    this.video = video;
    this.renderer = renderer;
    this.layer = null;
    this.frame = null;
    this.canvas = null;
    this.hydra = null;
    this.audioData = { level: 0, bass: 0, mid: 0, high: 0 };
    this.parameters = this.scene.parameters ?? {};
    this.scene.parameters = this.parameters;
  }

  async enter() {
    const output = this.scene.output;
    if (!output?.ceiling || !output?.screen) {
      throw new Error("InotaCompositeScene: output INOTA mancante.");
    }

    // SCREEN: reuse the existing Three.js video renderer, restricted to the 1920x1200 screen.
    this.renderer?.setSurfaceMode?.("screen");
    this.renderer?.setReactivity?.(this.scene.reactivity ?? 1);
    this.renderer?.setEffect?.(this.scene.filter ?? {});
    if (this.renderer?.canvas?.style) this.renderer.canvas.style.visibility = "visible";

    if (!this.scene.src) throw new Error(`InotaCompositeScene: clip mancante per ${this.scene.id}.`);

    this.video.pause();
    this.video.src = this.scene.src;
    this.video.loop = this.scene.loop ?? true;
    this.video.currentTime = Math.max(0, Number(this.scene.videoIn ?? 0));
    this.video.load();
    this.video.style.visibility = "hidden";
    await this.video.play().catch((error) => {
      console.warn("INOTA: impossibile avviare la clip video.", error);
    });

    // CEILING: independent Hydra canvas, exactly 3600x1200 inside the 3600x2400 master preview.
    const layer = document.createElement("div");
    layer.dataset.sceneLayer = "inota-composite";
    Object.assign(layer.style, {
      position: "fixed",
      inset: "0",
      zIndex: "5",
      display: "grid",
      placeItems: "center",
      pointerEvents: "none",
      overflow: "hidden"
    });

    const frame = document.createElement("div");
    Object.assign(frame.style, {
      position: "relative",
      width: "min(100vw, 150vh)",
      height: "min(100vh, 66.666667vw)",
      overflow: "hidden",
      background: "transparent"
    });

    const canvas = document.createElement("canvas");
    Object.assign(canvas.style, {
      position: "absolute",
      left: "0",
      top: "0",
      width: "100%",
      height: "50%",
      display: "block",
      background: "transparent"
    });

    frame.append(canvas);
    layer.append(frame);
    document.body.append(layer);

    this.layer = layer;
    this.frame = frame;
    this.canvas = canvas;

    this.hydra = new Hydra({
      canvas,
      width: output.ceiling.width,
      height: output.ceiling.height,
      detectAudio: false,
      makeGlobal: true
    });

    if (typeof this.scene.patch !== "function") {
      throw new Error(`InotaCompositeScene: patch Hydra mancante per ${this.scene.id}.`);
    }

    this.applyPatch();
  }

  applyPatch() {
    this.scene.patch(this.audioData, this.parameters);
  }

  setParameter(key, value) {
    this.parameters[key] = value;
  }

  update(audioData = {}) {
    Object.assign(this.audioData, audioData);
  }

  async exit() {
    this.video.pause();

    try {
      if (typeof window.hush === "function") window.hush();
    } catch (error) {
      console.warn("INOTA: impossibile arrestare Hydra.", error);
    }

    this.hydra = null;
    this.layer?.remove();
    this.layer = null;
    this.frame = null;
    this.canvas = null;
  }

  restart() {
    this.video.currentTime = Math.max(0, Number(this.scene.videoIn ?? 0));
    this.video.play().catch(() => {});
    this.applyPatch();
    return Promise.resolve();
  }
}
