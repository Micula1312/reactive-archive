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
    this.triggeredCueClips = new Set();
    this.cueModeActive = false;
    this.activeTimelineClipIndex = -1;
    this.playRequestId = 0;
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

  getTimelineClips() {
    return Array.isArray(this.scene.clips)
      ? this.scene.clips.filter((clip) => clip?.src && Number.isFinite(Number(clip.start)))
      : [];
  }

  waitForMetadata(requestId) {
    if (this.video.readyState >= 1) return Promise.resolve();

    return new Promise((resolve) => {
      const done = () => {
        this.video.removeEventListener("loadedmetadata", done);
        this.video.removeEventListener("error", done);
        resolve();
      };

      this.video.addEventListener("loadedmetadata", done, { once: true });
      this.video.addEventListener("error", done, { once: true });

      // If another source replaces this request, do not leave a hanging promise.
      window.setTimeout(() => {
        if (requestId !== this.playRequestId) done();
      }, 0);
    });
  }

  async playSource(src, { loop = false, inPoint = 0 } = {}) {
    if (!src) return;

    const requestId = ++this.playRequestId;

    // A source change intentionally interrupts any previous play() promise.
    this.video.pause();
    this.video.src = src;
    this.video.loop = loop;
    this.video.style.visibility = "hidden";
    this.video.load();

    await this.waitForMetadata(requestId);
    if (requestId !== this.playRequestId) return;

    const target = Math.max(0, Number(inPoint ?? 0));
    try {
      const duration = Number(this.video.duration);
      this.video.currentTime = Number.isFinite(duration)
        ? Math.min(target, Math.max(0, duration - 0.001))
        : target;
    } catch {}

    if (requestId !== this.playRequestId) return;

    try {
      await this.video.play();
    } catch (error) {
      // AbortError is expected when a timeline/cue switches source while play() is pending.
      if (error?.name !== "AbortError") {
        console.warn("INOTA: impossibile avviare la clip video.", error);
      }
    }
  }

  async playTimelineClip(clip, index) {
    this.activeTimelineClipIndex = index;
    this.cueModeActive = false;
    await this.playSource(clip.src, {
      loop: clip.loop ?? false,
      inPoint: clip.in ?? 0
    });
  }

  async playCurrent() {
    const src = this.sequence[this.sequenceIndex];
    if (!src) return;

    await this.playSource(src, {
      loop: this.sequence.length === 1 && (this.scene.loopSequence ?? true),
      inPoint: 0
    });
  }

  async handleEnded() {
    if (this.cueModeActive) return;
    if (this.getTimelineClips().length) return;
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
    const timelineClips = this.getTimelineClips();
    if (!this.sequence.length && !timelineClips.length) {
      throw new Error(`InotaCompositeScene: clip mancante per ${this.scene.id}.`);
    }

    this.sequenceIndex = 0;
    this.sceneStartedAt = performance.now();
    this.triggeredCueClips.clear();
    this.cueModeActive = false;
    this.activeTimelineClipIndex = -1;
    this.video.addEventListener("ended", this.handleEnded);

    if (timelineClips.length) {
      const first = timelineClips.findIndex((clip) => Number(clip.start) <= 0);
      if (first >= 0) await this.playTimelineClip(timelineClips[first], first);
    } else {
      await this.playCurrent();
    }

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
    const elapsed = (performance.now() - this.sceneStartedAt) / 1000;

    const timelineClips = this.getTimelineClips();
    if (timelineClips.length && !this.cueModeActive) {
      let wantedIndex = -1;
      for (let i = 0; i < timelineClips.length; i += 1) {
        if (elapsed >= Number(timelineClips[i].start ?? 0)) wantedIndex = i;
      }

      if (wantedIndex >= 0 && wantedIndex !== this.activeTimelineClipIndex) {
        this.playTimelineClip(timelineClips[wantedIndex], wantedIndex);
      }

      const active = timelineClips[this.activeTimelineClipIndex];
      if (active && Number.isFinite(Number(active.out)) && this.video.currentTime >= Number(active.out)) {
        this.video.pause();
      }
    }

    const cueClips = Array.isArray(this.scene.cueClips) ? this.scene.cueClips : [];
    cueClips.forEach((cueClip, index) => {
      if (!cueClip?.src || this.triggeredCueClips.has(index)) return;
      if (elapsed < Number(cueClip.time ?? 0)) return;

      this.triggeredCueClips.add(index);
      this.cueModeActive = true;
      this.playSource(cueClip.src, {
        loop: cueClip.loop ?? true,
        inPoint: cueClip.in ?? 0
      });
    });

    const activeCueIndex = Math.max(...Array.from(this.triggeredCueClips), -1);
    const activeCue = activeCueIndex >= 0 ? cueClips[activeCueIndex] : null;
    if (
      activeCue &&
      Number.isFinite(Number(activeCue.out)) &&
      this.video.currentTime >= Number(activeCue.out)
    ) {
      this.video.pause();
    }
  }

  async exit() {
    ++this.playRequestId;
    this.video.pause();
    this.video.removeEventListener("ended", this.handleEnded);
    this.sequence = [];
    this.sequenceIndex = 0;
    this.triggeredCueClips.clear();
    this.cueModeActive = false;
    this.activeTimelineClipIndex = -1;
    this.layer?.remove();
    this.layer = null;
    this.frame = null;
    document.body.style.removeProperty("--inota-ceiling-text");
  }

  restart() {
    this.sequenceIndex = 0;
    this.sceneStartedAt = performance.now();
    this.triggeredCueClips.clear();
    this.cueModeActive = false;
    this.activeTimelineClipIndex = -1;

    const timelineClips = this.getTimelineClips();
    if (timelineClips.length) {
      const first = timelineClips.findIndex((clip) => Number(clip.start) <= 0);
      return first >= 0 ? this.playTimelineClip(timelineClips[first], first) : Promise.resolve();
    }

    return this.playCurrent();
  }
}
