import Hydra from "hydra-synth";

export default class HydraScene {
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
    this.lastPatchUpdate = 0;
    this.handleCanvasPointerDown = this.handleCanvasPointerDown.bind(this);
  }

  handleCanvasPointerDown() {
    const app = document.querySelector("#app");
    if (!(app instanceof HTMLElement)) return;

    app.dispatchEvent(
      new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
        view: window
      })
    );
  }

  createMask(frame, output, surfaceMode) {
    const mask = document.createElement("div");
    mask.dataset.sceneLayerMask = "inota";
    Object.assign(mask.style, {
      position: "absolute",
      inset: "0",
      pointerEvents: "none",
      zIndex: "2"
    });

    const addBlock = ({ x, y, width, height }, color = "#000") => {
      if (width <= 0 || height <= 0) return;
      const block = document.createElement("div");
      Object.assign(block.style, {
        position: "absolute",
        left: `${(x / output.width) * 100}%`,
        top: `${(y / output.height) * 100}%`,
        width: `${(width / output.width) * 100}%`,
        height: `${(height / output.height) * 100}%`,
        background: color
      });
      mask.append(block);
    };

    const ceiling = output.ceiling;
    const screen = output.screen;
    const screenFrame = output.screenFrame ?? screen;

    // The festival mask allocates a 1920x1200 lower frame, while the actual
    // authored front-screen content is 1920x1080. Keep that 16:9 area centred.
    addBlock({
      x: 0,
      y: screenFrame.y,
      width: screenFrame.x,
      height: screenFrame.height
    });
    addBlock({
      x: screenFrame.x + screenFrame.width,
      y: screenFrame.y,
      width: output.width - (screenFrame.x + screenFrame.width),
      height: screenFrame.height
    });

    // 60 px black above + below the 1920x1080 content inside the 1920x1200 frame.
    addBlock({
      x: screenFrame.x,
      y: screenFrame.y,
      width: screenFrame.width,
      height: screen.y - screenFrame.y
    });
    addBlock({
      x: screenFrame.x,
      y: screen.y + screen.height,
      width: screenFrame.width,
      height: (screenFrame.y + screenFrame.height) - (screen.y + screen.height)
    });

    // Independent ceiling layer. For the current test every scene keeps
    // Hydra on the 16:9 front screen and assigns a flat colour to the ceiling.
    if (surfaceMode === "screen") {
      addBlock(ceiling, this.scene.ceilingColor ?? "#000");
    } else if (surfaceMode === "ceiling") {
      addBlock(screen);
    } else if (this.scene.ceilingColor) {
      addBlock(ceiling, this.scene.ceilingColor);
    }

    frame.append(mask);
  }

  async enter() {
    this.video.pause();
    this.video.style.visibility = "hidden";
    this.renderer?.canvas?.style && (this.renderer.canvas.style.visibility = "hidden");

    const output = this.scene.output;
    const fixedOutput = output?.width && output?.height;

    const layer = document.createElement("div");
    layer.dataset.sceneLayer = "hydra";
    Object.assign(layer.style, {
      position: "fixed",
      inset: "0",
      zIndex: "5",
      display: "grid",
      placeItems: "center",
      background: "#000",
      overflow: "hidden",
      touchAction: "manipulation"
    });

    const frame = document.createElement("div");
    Object.assign(frame.style, fixedOutput
      ? {
          position: "relative",
          width: "min(100vw, 150vh)",
          height: "min(100vh, 66.666667vw)",
          background: "#000",
          overflow: "hidden"
        }
      : {
          position: "absolute",
          inset: "0",
          background: "#000"
        });

    const canvas = document.createElement("canvas");
    Object.assign(canvas.style, {
      position: "absolute",
      inset: "0",
      zIndex: "1",
      width: "100%",
      height: "100%",
      display: "block",
      background: "#000"
    });

    canvas.addEventListener("pointerdown", this.handleCanvasPointerDown, { passive: true });
    canvas.addEventListener("touchstart", this.handleCanvasPointerDown, { passive: true });

    frame.append(canvas);
    layer.append(frame);
    document.body.append(layer);

    this.layer = layer;
    this.frame = frame;
    this.canvas = canvas;

    const width = fixedOutput ? output.width : window.innerWidth;
    const height = fixedOutput ? output.height : window.innerHeight;

    this.hydra = new Hydra({
      canvas,
      width,
      height,
      detectAudio: false,
      makeGlobal: true
    });

    if (fixedOutput) {
      this.createMask(frame, output, this.scene.surfaceMode ?? "both");
    }

    if (typeof this.scene.patch !== "function") {
      throw new Error(`HydraScene: patch mancante per ${this.scene.id ?? this.scene.title}.`);
    }

    this.applyPatch();
  }

  applyPatch() {
    this.scene.patch(this.audioData, this.parameters);
    this.lastPatchUpdate = performance.now();
  }

  setParameter(key, value) {
    this.parameters[key] = value;
  }

  update(audioData = {}) {
    Object.assign(this.audioData, audioData);
  }

  resize() {
    if (!this.canvas || this.scene.output) return;
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

    this.canvas?.removeEventListener("pointerdown", this.handleCanvasPointerDown);
    this.canvas?.removeEventListener("touchstart", this.handleCanvasPointerDown);
    this.hydra = null;
    this.layer?.remove();
    this.layer = null;
    this.frame = null;
    this.canvas = null;
  }

  restart() {
    this.applyPatch();
    return Promise.resolve();
  }
}
