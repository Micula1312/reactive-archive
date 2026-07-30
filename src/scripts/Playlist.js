import SubtitleManager from "./SubtitleManager.js";
import {
  getPerformanceScene,
  performanceRegia
} from "./PerformanceRegia.js";

export const playlist = [
  {
    title: "HYDRA I — Apparizione",
    src: "/reactive-archive/video-01.mp4",
    regiaOrder: 5
  },
  {
    title: "HYDRA II — Risonanza",
    src: "/reactive-archive/video-02.mp4",
    regiaOrder: 9
  }
];

export { performanceRegia };

const subtitleManager =
  new SubtitleManager();

let currentScene = null;

function findSceneFromVideo(video) {
  const currentPath =
    new URL(video.currentSrc || video.src, window.location.href).pathname;

  const playlistItem = playlist.find((item) => {
    const itemPath =
      new URL(item.src, window.location.href).pathname;

    return itemPath === currentPath;
  });

  if (!playlistItem?.regiaOrder) {
    return null;
  }

  return getPerformanceScene(
    playlistItem.regiaOrder
  );
}

function syncSubtitleScene(video) {
  const scene = findSceneFromVideo(video);

  if (scene === currentScene) {
    return;
  }

  currentScene = scene;
  subtitleManager.setScene(scene);
}

function connectSubtitleLayer() {
  const video =
    document.querySelector("#source-video");

  if (!(video instanceof HTMLVideoElement)) {
    return;
  }

  const update = () => {
    syncSubtitleScene(video);
    subtitleManager.update(video.currentTime);
  };

  video.addEventListener("loadedmetadata", update);
  video.addEventListener("timeupdate", update);
  video.addEventListener("seeked", update);
  video.addEventListener("play", update);
  video.addEventListener("emptied", () => {
    currentScene = null;
    subtitleManager.setScene(null);
  });

  document.addEventListener("keydown", (event) => {
    if (
      event.key.toLowerCase() !== "s" ||
      event.repeat
    ) {
      return;
    }

    const enabled =
      subtitleManager.toggle();

    console.info(
      `Sottotitoli ${enabled ? "attivi" : "disattivati"}`
    );
  });

  window.performanceSubtitles = {
    manager: subtitleManager,
    regia: performanceRegia,
    setScene(order) {
      const scene = getPerformanceScene(order);
      currentScene = scene;
      subtitleManager.setScene(scene);
      return scene;
    },
    setEnabled(enabled) {
      subtitleManager.setEnabled(enabled);
    }
  };

  update();
}

if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    connectSubtitleLayer,
    { once: true }
  );
} else {
  connectSubtitleLayer();
}
