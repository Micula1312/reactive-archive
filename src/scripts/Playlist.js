import SubtitleManager from "./SubtitleManager.js";
import {
  getPerformanceScene,
  performanceRegia
} from "./PerformanceRegia.js";

const performance =
  document.body?.dataset.performance ||
  (window.location.pathname.endsWith("/elisa") ? "elisa" : "fmcp");

// FMCP — partitura definitiva concordata con il musicista.
const fmcpPlaylist = [
  {
    title: "AI — AI",
    audio: "AI",
    visual: "AI",
    src: "/reactive-archive/Fmcp_Visuals_Ai.mp4"
  },
  {
    title: "AS THE PIG — NO TITLE",
    audio: "AS THE PIG",
    visual: "NO TITLE",
    src: "/reactive-archive/FMCP_visuals_NO_TITLE.mp4"
  },
  {
    title: "FORESTA — NO TITLE 2",
    audio: "FORESTA",
    visual: "NO TITLE 2",
    src: "/reactive-archive/Fmcp_Visuals_No_Title_2.mp4"
  },
  {
    title: "BRUTALISMO — FORESTA",
    audio: "BRUTALISMO",
    visual: "FORESTA",
    src: "/reactive-archive/Fmcp_Visuals_Foresta.mp4"
  },
  {
    title: "INDIA — INDIA IS RIGHT",
    audio: "INDIA",
    visual: "INDIA IS RIGHT",
    src: "/reactive-archive/Fmcp_Visuals_India_Is_Right.mp4"
  },
  {
    title: "DISTORTO — DISTORTO",
    audio: "DISTORTO",
    visual: "DISTORTO",
    src: "/reactive-archive/Fmcp_Visuals_Distorto.mp4"
  },
  {
    title: "MONTAGNA — DK",
    audio: "MONTAGNA",
    visual: "DK",
    src: "/reactive-archive/Fmcp_Visuals_DK.mp4"
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
