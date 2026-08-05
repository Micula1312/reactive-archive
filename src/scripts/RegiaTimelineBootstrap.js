import RegiaTimeline from "./RegiaTimeline.js";

const performanceModules = import.meta.glob("../performances/*/index.js", { eager: true });
const performanceName =
  document.documentElement.dataset.performance ||
  document.body.dataset.performance ||
  "fmcp";
const performanceScore = performanceModules[`../performances/${performanceName}/index.js`]?.default;

if (performanceScore?.timeline?.useAsClock) {
  const sceneState = {
    currentIndex: 0,
    currentScene: performanceScore.scenes[0] ?? null
  };

  let timeline = null;
  let frame = 0;

  const nativePlay = HTMLMediaElement.prototype.play;

  function startTimeline(audio) {
    if (timeline || !(audio instanceof HTMLAudioElement)) return;

    timeline = new RegiaTimeline({
      audio,
      performance: performanceScore,
      sceneManager: sceneState,
      onSeek: (seconds) => {
        try {
          audio.currentTime = seconds;
          if (audio.paused) audio.play().catch(() => {});
        } catch (error) {
          console.warn("Timeline regia: seek non disponibile.", error);
        }
      }
    });

    const update = () => {
      timeline?.update();
      frame = requestAnimationFrame(update);
    };
    update();
  }

  HTMLMediaElement.prototype.play = function patchedPlay(...args) {
    if (this instanceof HTMLAudioElement) startTimeline(this);
    return nativePlay.apply(this, args);
  };

  window.addEventListener("reactive-archive:scene-change", (event) => {
    const scene = event.detail?.scene ?? null;
    sceneState.currentScene = scene;
    const index = performanceScore.scenes.findIndex((candidate) => candidate.id === scene?.id);
    if (index >= 0) sceneState.currentIndex = index;
  });

  window.addEventListener("beforeunload", () => cancelAnimationFrame(frame));
}

// L'export frame-by-frame è sperimentale e non deve mai impedire
// l'inizializzazione del recorder realtime o della performance.
import("./CCaptureExporterBootstrap.js").catch((error) => {
  console.warn("Export frame-by-frame non disponibile; REC realtime resta attivo.", error);
});
