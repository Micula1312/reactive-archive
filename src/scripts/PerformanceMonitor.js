export default class PerformanceMonitor {
  constructor({ performance, sceneManager, audioManager, onBlackout }) {
    this.performance = performance;
    this.sceneManager = sceneManager;
    this.audioManager = audioManager;
    this.onBlackout = onBlackout;
    this.channel = new BroadcastChannel("reactive-archive-monitor");
    this.lastPublish = 0;

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
          case "go": await this.sceneManager.next(); break;
          case "previous": await this.sceneManager.previous(); break;
          case "select": await this.sceneManager.select(Number(message.index)); break;
          case "restart": await this.sceneManager.restart(); break;
          case "blackout": this.onBlackout?.(Boolean(message.active)); break;
          default: return;
        }
        this.publish({ level: 0, bass: 0, mid: 0, high: 0 }, true);
      } catch (error) {
        console.error("Comando regia fallito:", error);
      }
    });
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
          filter: scene.filter?.preset,
          hasAudio: Boolean(scene.audio)
        }))
      },
      started: this.sceneManager.started,
      audioMode: this.audioManager.sourceMode || "idle",
      scene: {
        index: currentIndex,
        total: scenes.length,
        id: currentScene?.id,
        title: currentScene?.title,
        type: currentScene?.type,
        filter: currentScene?.filter?.preset
      },
      nextScene: {
        index: (currentIndex + 1) % scenes.length,
        id: nextScene?.id,
        title: nextScene?.title,
        type: nextScene?.type
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
