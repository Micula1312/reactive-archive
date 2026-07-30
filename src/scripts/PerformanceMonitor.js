export default class PerformanceMonitor {
  constructor({
    performance,
    sceneManager,
    audioManager,
    onBlackout,
    onSoloMic,
    getSoloMic = () => false,
    getAudioFileSync = () => false
  }) {
    this.performance = performance;
    this.sceneManager = sceneManager;
    this.audioManager = audioManager;
    this.onBlackout = onBlackout;
    this.onSoloMic = onSoloMic;
    this.getSoloMic = getSoloMic;
    this.getAudioFileSync = getAudioFileSync;
    this.channel = new BroadcastChannel("reactive-archive-monitor");
    this.lastPublish = 0;
    this.audioMuted = false;

    this.channel.addEventListener("message", async (event) => {
      const message = event.data;
      if (!message) return;

      if (message.type === "request-state") {
        this.publish({ level: 0, bass: 0, mid: 0, high: 0 }, true);
        return;
      }

      if (message.type !== "regia-command") return;

      try {
        switch (message.command) {
          case "next":
          case "go":
            await this.goToScene(this.sceneManager.currentIndex + 1);
            break;
          case "previous":
            await this.goToScene(this.sceneManager.currentIndex - 1);
            break;
          case "select":
            await this.goToScene(Number(message.index));
            break;
          case "restart":
            if (this.hasTimeline()) {
              await this.goToScene(this.sceneManager.currentIndex, { force: true });
            } else {
              await this.sceneManager.restart();
            }
            break;
          case "pause":
            await this.togglePause(message.active);
            break;
          case "mute":
            this.audioMuted = typeof message.active === "boolean"
              ? message.active
              : !this.audioMuted;
            this.audioManager.setOutputMuted(this.audioMuted);
            break;
          case "solo-mic":
            await this.onSoloMic?.(Boolean(message.active));
            break;
          case "blackout":
            this.onBlackout?.(Boolean(message.active));
            break;
          case "set-parameter":
            this.sceneManager.setParameter(
              String(message.key),
              Number(message.value)
            );
            break;
          default:
            return;
        }

        this.publish({ level: 0, bass: 0, mid: 0, high: 0 }, true);
      } catch (error) {
        console.error("Comando regia fallito:", error);
      }
    });
  }

  hasTimeline() {
    return Boolean(this.performance.timeline?.useAsClock);
  }

  parseTimecode(value) {
    if (typeof value === "number") return value;
    const parts = String(value ?? "0").split(":").map(Number);
    if (parts.some((part) => !Number.isFinite(part))) return 0;
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return parts[0] || 0;
  }

  async goToScene(rawIndex, { force = false } = {}) {
    const scenes = this.performance.scenes;
    const index = (Number(rawIndex) + scenes.length) % scenes.length;

    if (this.hasTimeline()) {
      const start = this.parseTimecode(scenes[index]?.start);
      try {
        this.audioManager.cueAudio.currentTime = start;
      } catch (error) {
        console.warn("Impossibile spostare la timeline:", error);
      }

      if (this.sceneManager.started && this.audioManager.cueAudio.paused) {
        await this.audioManager.cueAudio.play().catch(() => {});
      }
    }

    if (force || index !== this.sceneManager.currentIndex) {
      await this.sceneManager.load(index);
    }
  }

  async togglePause(active) {
    const paused = await this.sceneManager.togglePause(active);

    if (this.hasTimeline()) {
      if (paused) {
        this.audioManager.cueAudio.pause();
      } else if (this.sceneManager.started) {
        await this.audioManager.cueAudio.play().catch(console.error);
      }
    }

    return paused;
  }

  publish(audioData, force = false) {
    const now = performance.now();
    if (!force && now - this.lastPublish < 100) return;

    this.lastPublish = now;
    const currentIndex = this.sceneManager.currentIndex;
    const scenes = this.performance.scenes;
    const currentScene = scenes[currentIndex];
    const nextScene = scenes[(currentIndex + 1) % scenes.length];

    this.channel.postMessage({
      type: "performance-state",
      timestamp: Date.now(),
      performance: {
        id: this.performance.id,
        title: this.performance.title,
        author: this.performance.author,
        scenes: scenes.map((scene, index) => ({
          index,
          id: scene.id,
          title: scene.title,
          type: scene.type,
          dramaturgicalType: scene.dramaturgicalType,
          function: scene.function,
          duration: scene.duration,
          start: scene.start,
          filter: scene.filter?.preset,
          hasAudio: Boolean(scene.audio)
        }))
      },
      started: this.sceneManager.started,
      audioMode: this.audioManager.sourceMode || "idle",
      audioMuted: this.audioMuted,
      soloMicEnabled: Boolean(this.getSoloMic()),
      audioFileSyncEnabled: Boolean(this.getAudioFileSync()),
      paused: this.sceneManager.isPaused,
      timelineTime: this.hasTimeline() ? this.audioManager.cueAudio.currentTime : null,
      scene: {
        index: currentIndex,
        total: scenes.length,
        id: currentScene?.id,
        title: currentScene?.title,
        type: currentScene?.type,
        start: currentScene?.start,
        filter: currentScene?.filter?.preset,
        controls: this.sceneManager.currentControls
      },
      nextScene: {
        index: (currentIndex + 1) % scenes.length,
        id: nextScene?.id,
        title: nextScene?.title,
        type: nextScene?.type,
        start: nextScene?.start
      },
      audio: {
        level: audioData.level ?? 0,
        bass: audioData.bass ?? 0,
        mid: audioData.mid ?? 0,
        high: audioData.high ?? 0
      }
    });
  }
}