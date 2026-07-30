import SubtitleManager from "./SubtitleManager.js";
import {
  getPerformanceScene,
  performanceRegia
} from "./PerformanceRegia.js";

const performance =
  document.body?.dataset.performance ||
  (window.location.pathname.endsWith("/elisa") ? "elisa" : "fmcp");

// FMCP — nuova partitura concordata con il musicista.
// Restano esclusi OMM e AS THE PIG.
const fmcpPlaylist = [
  {
    title: "AI — ALBERI",
    audio: "AI",
    visual: "ALBERI",
    src: "/reactive-archive/FMCP_visuals_ALBERI.mp4"
  },
  {
    title: "FORESTA — PALO LUCE / SEDIE",
    audio: "FORESTA",
    visual: "NO TITLE",
    src: "/reactive-archive/FMCP_visuals_NO TITLE.mp4"
  },
  {
    title: "BRUTALISMO — CIELO / NUVOLE",
    audio: "BRUTALISMO",
    visual: "FORESTA",
    src: "/reactive-archive/FMCP_visuals_FORESTA.mp4"
  },
  {
    title: "INDIA — DRIVING CAR B/W",
    audio: "INDIA",
    visual: "INDIA IS RIGHT",
    src: "/reactive-archive/FMCP_visuals_INDIA IS RIGHT.mp4"
  },
  {
    title: "DISTORTO — GENTE / CITTÀ B/W",
    audio: "DISTORTO",
    visual: "DISTORTO",
    src: "/reactive-archive/FMCP_visuals_DISTORTO.mp4"
  },
  {
    title: "MONTAGNA — MONTAGNA B/W",
    audio: "MONTAGNA",
    visual: "DARK",
    src: "/reactive-archive/FMCP_visuals_DARK.mp4"
  }
];

const elisaPlaylist = [
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

export const playlist =
  performance === "elisa"
    ? elisaPlaylist
    : fmcpPlaylist;

export { performanceRegia };

const subtitleManager =
  new SubtitleManager();

subtitleManager.setEnabled(
  performance === "elisa"
);

let currentScene = null;

function findSceneFromVideo(video) {
  if (performance !== "elisa") {
    return null;
  }

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
    performance,
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
