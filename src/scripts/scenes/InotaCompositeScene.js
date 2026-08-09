export default class InotaCompositeScene {
  constructor({ scene, video, renderer }) {
    this.scene = scene;
    this.video = video;
    this.renderer = renderer;
    this.videoHome = video.parentElement;
    this.layer = null;
    this.frame = null;
    this.flashLayer = null;
    this.whiteFlashLayer = null;
    this.ceilingReactiveLayer = null;
    this.screenReactiveLayer = null;
    this.flashLevel = 0;
    this.whiteFlashLevel = 0;
    this.previousHigh = 0;
    this.sequence = [];
    this.sequenceIndex = 0;
    this.sceneStartedAt = 0;
    this.triggeredCueClips = new Set();
    this.cueModeActive = false;
    this.activeTimelineClipIndex = -1;
    this.playRequestId = 0;
    this.handleEnded = this.handleEnded.bind(this);
  }

  hasNumber(value) {
    return value !== null && value !== undefined && value !== "" && Number.isFinite(Number(value));
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
      ? this.scene.clips.filter((clip) => clip?.src && this.hasNumber(clip.start))
      : [];
  }

  waitForMetadata(requestId) {
    if (this.video.readyState >= 1) return Promise.resolve();

    return new Promise((resolve) => {
      let finished = false;
      const done = () => {
        if (finished) return;
        finished = true;
        this.video.removeEventListener("loadedmetadata", done);
        this.video.removeEventListener("error", done);
        resolve();
      };

      this.video.addEventListener("loadedmetadata", done, { once: true });
      this.video.addEventListener("error", done, { once: true });

      window.setTimeout(() => {
        if (requestId !== this.playRequestId) done();
      }, 0);
    });
  }

  async playSource(src, { loop = false, inPoint = 0 } = {}) {
    if (!src) return;

    const requestId = ++this.playRequestId;

    this.video.pause();
    this.video.style.visibility = "hidden";
    this.video.src = src;
    this.video.loop = loop;
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
      if (requestId === this.playRequestId) this.video.style.visibility = "visible";
    } catch (error) {
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

  mountNativeVideo(frame) {
    frame.append(this.video);
    Object.assign(this.video.style, {
      display: "block",
      position: "absolute",
      left: "23.333333%",
      top: "50%",
      width: "53.333333%",
      height: "50%",
      objectFit: "cover",
      objectPosition: "center center",
      visibility: "hidden",
      opacity: "1",
      zIndex: "2",
      pointerEvents: "none",
      background: "#000",
      transform: "none"
    });
    this.video.muted = true;
    this.video.playsInline = true;
  }

  restoreNativeVideo() {
    this.video.pause();
    if (this.videoHome) this.videoHome.append(this.video);
    this.video.removeAttribute("style");
  }

  async enter() {
    const output = this.scene.output;
    if (!output?.ceiling || !output?.screen) {
      throw new Error("InotaCompositeScene: output INOTA mancante.");
    }

    this.renderer?.setSurfaceMode?.("screen");
    this.renderer?.setReactivity?.(0);
    this.renderer?.setEffect?.({});
    if (this.renderer?.canvas?.style) this.renderer.canvas.style.visibility = "hidden";

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
      background: "#000"
    });

    const ceiling = document.createElement("div");
    ceiling.dataset.inotaCeiling = "solid";
    Object.assign(ceiling.style, {
      position: "absolute",
      left: "0",
      top: "0",
      width: "100%",
      height: "50%",
      zIndex: "1",
      background: this.scene.ceilingColor ?? "#000000"
    });

    const ceilingReactiveLayer = document.createElement("div");
    Object.assign(ceilingReactiveLayer.style, {
      position: "absolute",
      left: "0",
      top: "0",
      width: "100%",
      height: "50%",
      zIndex: "3",
      background: "#ff0000",
      opacity: "0",
      pointerEvents: "none",
      willChange: "opacity"
    });

    const screenReactiveLayer = document.createElement("div");
    Object.assign(screenReactiveLayer.style, {
      position: "absolute",
      left: "23.333333%",
      top: "50%",
      width: "53.333333%",
      height: "50%",
      zIndex: "3",
      background: "#ff0000",
      opacity: "0",
      pointerEvents: "none",
      willChange: "opacity"
    });

    frame.append(ceiling);
    this.mountNativeVideo(frame);
    frame.append(ceilingReactiveLayer, screenReactiveLayer);
    layer.append(frame);
    document.body.append(layer);

    const flashLayer = document.createElement("div");
    flashLayer.dataset.sceneLayer = "inota-high-flash";
    Object.assign(flashLayer.style, {
      position: "fixed",
      left: "50%",
      top: "50%",
      transform: "translate(-50%, -50%)",
      width: "min(100vw, 150vh)",
      height: "min(100vh, 66.666667vw)",
      zIndex: "1000005",
      background: this.scene.highFlashColor ?? "#ff0000",
      opacity: "0",
      pointerEvents: "none",
      willChange: "opacity"
    });
    document.body.append(flashLayer);

    const whiteFlashLayer = document.createElement("div");
    whiteFlashLayer.dataset.sceneLayer = "inota-transient-white-flash";
    Object.assign(whiteFlashLayer.style, {
      position: "fixed",
      left: "50%",
      top: "50%",
      transform: "translate(-50%, -50%)",
      width: "min(100vw, 150vh)",
      height: "min(100vh, 66.666667vw)",
      zIndex: "1000006",
      background: "#ffffff",
      opacity: "0",
      pointerEvents: "none",
      willChange: "opacity"
    });
    document.body.append(whiteFlashLayer);

    this.layer = layer;
    this.frame = frame;
    this.flashLayer = flashLayer;
    this.whiteFlashLayer = whiteFlashLayer;
    this.ceilingReactiveLayer = ceilingReactiveLayer;
    this.screenReactiveLayer = screenReactiveLayer;

    this.sequence = this.buildSequence();
    const timelineClips = this.getTimelineClips();
    if (!this.sequence.length && !timelineClips.length) {
      throw new Error(`InotaCompositeScene: clip mancante per ${this.scene.id}.`);
    }

    this.sequenceIndex = 0;
    this.sceneStartedAt = performance.now();
    this.flashLevel = 0;
    this.whiteFlashLevel = 0;
    this.previousHigh = 0;
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

    document.body.style.setProperty(
      "--inota-ceiling-text",
      this.scene.ceilingTextColor ?? "#ffffff"
    );
  }

  setParameter() {}

  update(audioData = {}) {
    const elapsed = (performance.now() - this.sceneStartedAt) / 1000;

    const timelineClips = this.getTimelineClips();
    if (timelineClips.length && !this.cueModeActive) {
      let wantedIndex = -1;
      for (let i = 0; i < timelineClips.length; i += 1) {
        if (elapsed >= Number(timelineClips[i].start)) wantedIndex = i;
      }

      if (wantedIndex >= 0 && wantedIndex !== this.activeTimelineClipIndex) {
        this.playTimelineClip(timelineClips[wantedIndex], wantedIndex);
      }

      const active = timelineClips[this.activeTimelineClipIndex];
      if (active && this.hasNumber(active.out) && this.video.currentTime >= Number(active.out)) {
        this.video.pause();
        this.video.style.visibility = "hidden";
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
      this.hasNumber(activeCue.out) &&
      this.video.currentTime >= Number(activeCue.out)
    ) {
      this.video.pause();
      this.video.style.visibility = "hidden";
    }

    const level = Math.max(0, Math.min(1, Number(audioData.level) || 0));
    const high = Math.max(0, Math.min(1, Number(audioData.high) || 0));
    const highTransient = Math.max(0, high - this.previousHigh);
    this.previousHigh = high;

    this.video.style.transform = "none";

    if (this.ceilingReactiveLayer) {
      const ceilingThreshold = Number(this.scene.ceilingHighThreshold ?? 0.34);
      const ceilingOpacity = high > ceilingThreshold
        ? Math.min(0.96, ((high - ceilingThreshold) / Math.max(0.001, 1 - ceilingThreshold)) * 1.25)
        : Math.max(0, level - 0.5) * 0.45;
      this.ceilingReactiveLayer.style.opacity = String(ceilingOpacity);
    }

    if (this.screenReactiveLayer) {
      const screenThreshold = Number(this.scene.screenHighThreshold ?? 0.42);
      const screenOpacity = high > screenThreshold
        ? Math.min(0.72, ((high - screenThreshold) / Math.max(0.001, 1 - screenThreshold)) * 0.9)
        : 0;
      this.screenReactiveLayer.style.opacity = String(screenOpacity);
    }

    const threshold = Number(this.scene.highFlashThreshold ?? 0.46);
    const maxOpacity = Number(this.scene.highFlashMaxOpacity ?? 0.96);
    const decay = Number(this.scene.highFlashDecay ?? 0.68);

    if (high > threshold) {
      const normalized = Math.min(1, (high - threshold) / Math.max(0.001, 1 - threshold));
      this.flashLevel = Math.max(this.flashLevel, normalized * maxOpacity);
    } else {
      this.flashLevel *= decay;
      if (this.flashLevel < 0.006) this.flashLevel = 0;
    }

    if (this.flashLayer) {
      this.flashLayer.style.opacity = String(this.flashLevel);
    }

    const whiteTransientThreshold = Number(this.scene.whiteTransientThreshold ?? 0.055);
    const whiteHighFloor = Number(this.scene.whiteHighFloor ?? 0.42);
    const whiteMaxOpacity = Number(this.scene.whiteFlashMaxOpacity ?? 0.98);
    const whiteDecay = Number(this.scene.whiteFlashDecay ?? 0.52);

    if (high >= whiteHighFloor && highTransient > whiteTransientThreshold) {
      const transientStrength = Math.min(1, highTransient / 0.22);
      this.whiteFlashLevel = Math.max(this.whiteFlashLevel, transientStrength * whiteMaxOpacity);
    } else {
      this.whiteFlashLevel *= whiteDecay;
      if (this.whiteFlashLevel < 0.006) this.whiteFlashLevel = 0;
    }

    if (this.whiteFlashLayer) {
      this.whiteFlashLayer.style.opacity = String(this.whiteFlashLevel);
    }
  }

  async exit() {
    ++this.playRequestId;
    this.video.pause();
    this.video.removeEventListener("ended", this.handleEnded);
    this.sequence = [];
    this.sequenceIndex = 0;
    this.flashLevel = 0;
    this.whiteFlashLevel = 0;
    this.previousHigh = 0;
    this.triggeredCueClips.clear();
    this.cueModeActive = false;
    this.activeTimelineClipIndex = -1;
    this.restoreNativeVideo();
    this.layer?.remove();
    this.flashLayer?.remove();
    this.whiteFlashLayer?.remove();
    this.layer = null;
    this.frame = null;
    this.flashLayer = null;
    this.whiteFlashLayer = null;
    this.ceilingReactiveLayer = null;
    this.screenReactiveLayer = null;
    document.body.style.removeProperty("--inota-ceiling-text");
  }

  restart() {
    this.sequenceIndex = 0;
    this.sceneStartedAt = performance.now();
    this.flashLevel = 0;
    this.whiteFlashLevel = 0;
    this.previousHigh = 0;
    this.triggeredCueClips.clear();
    this.cueModeActive = false;
    this.activeTimelineClipIndex = -1;
    this.video.style.visibility = "hidden";

    const timelineClips = this.getTimelineClips();
    if (timelineClips.length) {
      const first = timelineClips.findIndex((clip) => Number(clip.start) <= 0);
      return first >= 0 ? this.playTimelineClip(timelineClips[first], first) : Promise.resolve();
    }

    return this.playCurrent();
  }
}
