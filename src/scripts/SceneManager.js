import TextScene from "./scenes/TextScene.js";
import HydraScene from "./scenes/HydraScene.js";

export default class SceneManager {
  constructor({ video, renderer, ui, performance }) {
    if (!(video instanceof HTMLVideoElement)) throw new Error("SceneManager: video non valido.");
    if (!performance?.scenes?.length) throw new Error("SceneManager: performance senza scene.");

    this.video = video;
    this.renderer = renderer;
    this.ui = ui;
    this.performance = performance;
    this.currentIndex = 0;
    this.started = false;
    this.currentController = null;
    this.sceneTimer = null;
    this.handleResize = () => this.currentController?.resize?.();
    window.addEventListener("resize", this.handleResize);
  }

  get scenes() { return this.performance.scenes; }
  get currentScene() { return this.scenes[this.currentIndex]; }
  setStarted(started) { this.started = Boolean(started); }

  clearSceneTimer() {
    if (this.sceneTimer) window.clearTimeout(this.sceneTimer);
    this.sceneTimer = null;
  }

  restoreVideoLayer() {
    this.video.style.visibility = "visible";
    if (this.renderer?.canvas?.style) this.renderer.canvas.style.visibility = "visible";
  }

  async exitCurrentScene() {
    this.clearSceneTimer();
    await this.currentController?.exit?.();
    this.currentController = null;
    document.querySelectorAll("[data-scene-layer]").forEach((element) => element.remove());
  }

  async enterVideoScene(scene) {
    this.restoreVideoLayer();
    this.video.pause();
    this.video.src = scene.src;
    this.video.loop = scene.loop ?? true;
    this.video.playbackRate = scene.playbackRate ?? 1;
    this.video.load();
    this.renderer.setReactivity(scene.reactivity ?? 1);
    this.renderer.setEffect(scene.filter ?? {});

    if (this.started) {
      try { await this.video.play(); }
      catch (error) { console.error("Impossibile riprodurre la scena video:", error); }
    }
  }

  createController(scene) {
    const context = { scene, video: this.video, renderer: this.renderer };
    if (scene.type === "text") return new TextScene(context);
    if (scene.type === "hydra") return new HydraScene(context);
    return null;
  }

  scheduleAutomaticNext(scene) {
    if (scene.advance === "manual" || this.performance.mode === "manual") return;
    const duration = Number(scene.duration ?? 0);
    if (!this.started || duration <= 0) return;
    this.sceneTimer = window.setTimeout(() => this.next().catch(console.error), duration);
  }

  announceScene(scene) {
    window.dispatchEvent(new CustomEvent("reactive-archive:scene-change", {
      detail: { scene, index: this.currentIndex, performance: this.performance }
    }));
  }

  async load(index) {
    const nextIndex = (index + this.scenes.length) % this.scenes.length;
    const scene = this.scenes[nextIndex];
    await this.exitCurrentScene();
    this.currentIndex = nextIndex;

    if (scene.type === "video") {
      await this.enterVideoScene(scene);
    } else {
      this.renderer.setEffect({});
      const controller = this.createController(scene);
      if (!controller) throw new Error(`Tipo scena non supportato: ${scene.type}`);
      this.currentController = controller;
      await controller.enter();
    }

    this.ui.setStatus(`${this.currentIndex + 1} / ${this.scenes.length} — ${scene.title}`);
    this.announceScene(scene);
    this.scheduleAutomaticNext(scene);
    return scene;
  }

  next() { return this.load(this.currentIndex + 1); }
  previous() { return this.load(this.currentIndex - 1); }
  select(index) {
    if (index < 0 || index >= this.scenes.length) return Promise.resolve(null);
    return this.load(index);
  }
  update(audioData) { this.currentController?.update?.(audioData); }
  restart() {
    if (this.currentController?.restart) return this.currentController.restart();
    this.video.currentTime = 0;
    if (this.started) return this.video.play().catch(console.error);
    return Promise.resolve();
  }
}
