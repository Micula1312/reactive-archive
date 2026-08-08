export default class InotaCompositeScene {
  constructor({ scene, video, renderer }) {
    this.scene = scene;
    this.video = video;
    this.renderer = renderer;
    this.layer = null;
    this.frame = null;
    this.sequence = [];
    this.sequenceIndex = 0;
    this.sceneStartedAt = 0;
    this.cueClipTriggered = false;
    this.handleEnded = this.handleEnded.bind(this);
  }

  buildSequence() {
    const sequence = [];
    if (this.scene.src) sequence.push(this.scene.src);
    if (Array.isArray(this.scene.sequence)) {
      for (const src of this.scene.sequence) {
        if (src && !sequence.includes(src)) sequence.push(src);
      }
    }
    return sequence;
  }

  async playSource(src, { loop = false } = {}) {
    if (!src) return;

    this.video.pause();
    this.video.src = src;
    this.video.loop = loop;
    this.video.currentTime = 0;
    this.video.load();
    this.video.style.visibility = "hidden";
    await this.video.play().catch((error) => {
      console.warn("INOTA: impossibile avviare la clip video.", error);
    });
  }

  async playCurrent() {
    const src = this.sequence[this.sequenceIndex];
    if (!src) return;

    await this.playSource(src, {
      loop: this.sequence.length === 1 && (this.scene.loopSequence ?? true)
    });
  }

  async handleEnded() {
    if (this.cueClipTriggered) return;
    if (this.sequence.length <= 1) return;

    if (this.sequenceIndex < this.sequence.length - 1) {
      this.sequenceIndex += 1;
    } else if (this.scene.loopSequence ?? true) {
      this.sequenceIndex = 0;
    } else {
      return;
    }

    await this.playCurrent();
  }

  async enter() {
    const output = this.scene.output;
    if (!output?.ceiling || !output?.screen) {
      throw new Error("InotaCompositeScene: output INOTA mancante.");
    }

    this.renderer?.setSurfaceMode?.("screen");
    this.renderer?.setReactivity?.(this.scene.reactivity ?? 1);
    this.renderer?.setEffect?.(this.scene.filter ?? {});
    if (this.renderer?.canvas?.style) this.renderer.canvas.style.visibility = "visible";

    this.sequence = this.buildSequence();
    if (!this.sequence.length) {
      throw new Error(`InotaCompositeScene: clip mancante per ${this.scene.id}.`);
    }

    this.sequenceIndex = 0;
    this.sceneStartedAt = performance.now();
    this.cueClipTriggered = false;
    this.video.addEventListener("ended", this.handleEnded);
    await this.playCurrent();

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

    const ceiling = document.createElement("div");
    ceiling.dataset.inotaCeiling = "solid";
    Object.assign(ceiling.style, {
      position: "absolute",
      left: "0",
      top: "0",
      width: "100%",
      height: "50%",
      background: this.scene.ceilingColor ?? "#000000"
    });

    frame.append(ceiling);
    layer.append(frame);
    document.body.append(layer);

    this.layer = layer;
    this.frame = frame;

    document.body.style.setProperty(
      "--inota-ceiling-text",
      this.scene.ceilingTextColor ?? "#ffffff"
    );
  }

  setParameter() {}

  update() {
    const cueClip = this.scene.cueClip;
    if (!cueClip?.src || this.cueClipTriggered) return;

    const elapsed = (performance.now() - this.sceneStartedAt) / 1000;
    if (elapsed < Number(cueClip.time ?? 0)) return;

    this.cueClipTriggered = true;
    this.playSource(cueClip.src, { loop: cueClip.loop ?? true });
  }

  async exit() {
    this.video.pause();
    this.video.removeEventListener("ended", this.handleEnded);
    this.sequence = [];
    this.sequenceIndex = 0;
    this.cueClipTriggered = false;
    this.layer?.remove();
    this.layer = null;
    this.frame = null;
    document.body.style.removeProperty("--inota-ceiling-text");
  }

  restart() {
    this.sequenceIndex = 0;
    this.sceneStartedAt = performance.now();
    this.cueClipTriggered = false;
    return this.playCurrent();
  }
}
