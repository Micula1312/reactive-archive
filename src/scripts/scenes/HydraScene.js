import Hydra from "hydra-synth";

export default class HydraScene {
  constructor({ scene, video, renderer }) {
    this.scene = scene;
    this.video = video;
    this.renderer = renderer;
    this.canvas = null;
    this.hydra = null;
    this.audioData = { level: 0, bass: 0, mid: 0, high: 0 };
    this.lastPatchUpdate = 0;
  }

  async enter() {
    this.video.pause();
    this.video.style.visibility = "hidden";
    this.renderer?.canvas?.style && (this.renderer.canvas.style.visibility = "hidden");

    const canvas = document.createElement("canvas");
    canvas.dataset.sceneLayer = "hydra";
    Object.assign(canvas.style, {
      position: "fixed",
      inset: "0",
      zIndex: "15",
      width: "100vw",
      height: "100vh",
      display: "block",
      background: "#000"
    });
    document.body.append(canvas);
    this.canvas = canvas;

    this.hydra = new Hydra({
      canvas,
      width: window.innerWidth,
      height: window.innerHeight,
      detectAudio: false,
      makeGlobal: true
    });

    if (typeof this.scene.patch !== "function") {
      throw new Error(`HydraScene: patch mancante per ${this.scene.id ?? this.scene.title}.`);
    }

    this.applyPatch();
  }

  applyPatch() {
    this.scene.patch(this.audioData);
    this.lastPatchUpdate = performance.now();
  }

  update(audioData = {}) {
    this.audioData = { ...this.audioData, ...audioData };

    // Le patch attuali ricevono valori audio al momento dell'esecuzione.
    // Un aggiornamento controllato evita di ricostruire la pipeline ogni frame.
    if (performance.now() - this.lastPatchUpdate > 250) {
      this.applyPatch();
    }
  }

  resize() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.hydra?.setResolution?.(window.innerWidth, window.innerHeight);
  }

  async exit() {
    try {
      if (typeof window.hush === "function") window.hush();
    } catch (error) {
      console.warn("HydraScene: impossibile arrestare gli output.", error);
    }

    this.hydra = null;
    this.canvas?.remove();
    this.canvas = null;
  }

  restart() {
    this.applyPatch();
    return Promise.resolve();
  }
}