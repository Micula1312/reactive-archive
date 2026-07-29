export default class SceneManager {
  constructor({ video, renderer, ui, performance }) {
    if (!(video instanceof HTMLVideoElement)) {
      throw new Error("SceneManager: video non valido.");
    }

    if (!performance?.scenes?.length) {
      throw new Error("SceneManager: performance senza scene.");
    }

    this.video = video;
    this.renderer = renderer;
    this.ui = ui;
    this.performance = performance;
    this.currentIndex = 0;
    this.started = false;
  }

  get scenes() {
    return this.performance.scenes;
  }

  get currentScene() {
    return this.scenes[this.currentIndex];
  }

  setStarted(started) {
    this.started = Boolean(started);
  }

  async load(index) {
    const nextIndex = (index + this.scenes.length) % this.scenes.length;
    const scene = this.scenes[nextIndex];

    if (scene.type !== "video") {
      throw new Error(`Tipo scena non ancora supportato: ${scene.type}`);
    }

    this.currentIndex = nextIndex;

    this.video.pause();
    this.video.src = scene.src;
    this.video.loop = scene.loop ?? true;
    this.video.playbackRate = scene.playbackRate ?? 1;
    this.video.load();

    this.renderer.setReactivity(scene.reactivity ?? 1);

    this.ui.setStatus(
      `${this.currentIndex + 1} / ${this.scenes.length} — ${scene.title}`
    );

    if (!this.started) {
      return scene;
    }

    try {
      await this.video.play();
    } catch (error) {
      console.error("Impossibile riprodurre la scena video:", error);
    }

    return scene;
  }

  next() {
    return this.load(this.currentIndex + 1);
  }

  previous() {
    return this.load(this.currentIndex - 1);
  }

  select(index) {
    if (index < 0 || index >= this.scenes.length) {
      return Promise.resolve(null);
    }

    return this.load(index);
  }

  restart() {
    this.video.currentTime = 0;

    if (this.started) {
      return this.video.play().catch(console.error);
    }

    return Promise.resolve();
  }
}
