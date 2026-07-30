import TextScene from "./scenes/TextScene.js";
import HydraScene from "./scenes/HydraScene.js";
import { getSceneControls, writeTarget } from "./LiveControls.js";

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
    this.paused = false;
    this.videoSequence = [];
    this.videoSequenceIndex = 0;
    this.handleResize = () => this.currentController?.resize?.();
    this.handleVideoEnded = () => this.advanceVideoSequence().catch(console.error);
    window.addEventListener("resize", this.handleResize);
    this.video.addEventListener("ended", this.handleVideoEnded);
  }

  get scenes() { return this.performance.scenes; }
  get currentScene() { return this.scenes[this.currentIndex]; }
  get currentControls() { return getSceneControls(this.currentScene); }
  get isPaused() { return this.paused; }
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
    this.videoSequence = [];
    this.videoSequenceIndex = 0;
    this.paused = false;
    document.querySelectorAll("[data-scene-layer]").forEach((element) => element.remove());
  }

  getSecondClipUrl(src) {
    if (!src || /-2(?=\.[^.?#]+(?:[?#].*)?$)/i.test(src)) return null;
    return src.replace(/(\.[^.?#]+)([?#].*)?$/, "-2$1$2");
  }

  async assetExists(src) {
    if (!src) return false;
    try {
      const response = await fetch(src, { method: "HEAD", cache: "no-store" });
      return response.ok;
    } catch {
      return false;
    }
  }

  async buildVideoSequence(scene) {
    const sequence = [scene.src];
    const secondClip = scene.sequence?.[1] ?? scene.part2 ?? this.getSecondClipUrl(scene.src);

    if (secondClip && await this.assetExists(secondClip)) {
      sequence.push(secondClip);
    }

    return sequence;
  }

  async playVideoSource(src, { loop = false } = {}) {
    this.video.pause();
    this.video.src = src;
    this.video.loop = loop;
    this.video.currentTime = 0;
    this.video.load();

    if (this.started && !this.paused) {
      try { await this.video.play(); }
      catch (error) { console.error("Impossibile riprodurre la scena video:", error); }
    }
  }

  async advanceVideoSequence() {
    if (this.currentScene?.type !== "video") return;
    if (this.videoSequenceIndex >= this.videoSequence.length - 1) return;

    this.videoSequenceIndex += 1;
    await this.playVideoSource(this.videoSequence[this.videoSequenceIndex], { loop: false });
  }

  async enterVideoScene(scene) {
    this.restoreVideoLayer();
    this.paused = false;
    this.video.playbackRate = scene.playbackRate ?? 1;
    this.renderer.setReactivity(scene.reactivity ?? 1);
    this.renderer.setEffect(scene.filter ?? {});

    this.videoSequence = await this.buildVideoSequence(scene);
    this.videoSequenceIndex = 0;
    const hasSequence = this.videoSequence.length > 1;

    await this.playVideoSource(this.videoSequence[0], {
      loop: hasSequence ? false : (scene.loop ?? true)
    });
  }

  createController(scene) {
    const context = { scene, video: this.video, renderer: this.renderer };
    if (scene.type === "text") return new TextScene(context);
    if (scene.type === "hydra") return new HydraScene(context);
    return null;
  }

  setParameter(key, rawValue) {
    const scene = this.currentScene;
    const control = this.currentControls.find((item) => item.key === key);
    if (!scene || !control) return false;

    const numericValue = Number(rawValue);
    if (!Number.isFinite(numericValue)) return false;
    const value = Math.max(control.min, Math.min(control.max, numericValue));

    writeTarget(scene, control.target, value);

    if (scene.type === "video") {
      this.renderer.setEffect(scene.filter ?? {});
      this.renderer.setReactivity(scene.reactivity ?? 1);
    }

    this.currentController?.setParameter?.(key, value, control);
    return true;
  }

  async togglePause(force) {
    const nextPaused = typeof force === "boolean" ? force : !this.paused;
    this.paused = nextPaused;

    if (this.currentScene?.type === "video") {
      if (nextPaused) {
        this.video.pause();
      } else if (this.started) {
        await this.video.play().catch(console.error);
      }
    }

    return this.paused;
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
    this.videoSequenceIndex = 0;
    const src = this.videoSequence[0] ?? this.currentScene?.src;
    return this.playVideoSource(src, {
      loop: this.videoSequence.length > 1 ? false : (this.currentScene?.loop ?? true)
    });
  }
}