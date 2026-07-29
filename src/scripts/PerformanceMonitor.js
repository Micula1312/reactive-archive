export default class PerformanceMonitor {
  constructor({ performance, sceneManager, audioManager }) {
    this.performance = performance;
    this.sceneManager = sceneManager;
    this.audioManager = audioManager;
    this.channel = new BroadcastChannel("reactive-archive-monitor");
    this.lastPublish = 0;

    this.channel.addEventListener("message", (event) => {
      if (event.data?.type === "request-state") {
        this.publish({ level: 0, bass: 0, mid: 0, high: 0 }, true);
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
        author: this.performance.author
      },
      started: this.sceneManager.started,
      audioMode: this.audioManager.fakeMode ? "fake" : "microphone",
      scene: {
        index: currentIndex,
        total: scenes.length,
        id: currentScene?.id,
        title: currentScene?.title,
        type: currentScene?.type
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
