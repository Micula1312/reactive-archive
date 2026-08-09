export default function installInotaPrerollTitle() {
  if (typeof document === "undefined") return;

  const decorate = (marker) => {
    if (!(marker instanceof HTMLElement) || marker.dataset.inotaTitleReady === "true") return;
    marker.dataset.inotaTitleReady = "true";
    marker.style.background = "#000000";
    marker.style.display = "grid";
    marker.style.placeItems = "center";

    const text = document.createElement("div");
    const subtitleSample = document.querySelector("#performance-subtitles .subtitle-text");
    const computed = subtitleSample instanceof HTMLElement
      ? window.getComputedStyle(subtitleSample)
      : window.getComputedStyle(document.body);

    Object.assign(text.style, {
      width: "92%",
      maxWidth: "3250px",
      textAlign: "center",
      color: "#ffffff",
      fontFamily: computed.fontFamily,
      fontWeight: computed.fontWeight,
      lineHeight: "1.08",
      letterSpacing: computed.letterSpacing,
      pointerEvents: "none"
    });

    const title = document.createElement("div");
    title.textContent = "ELISA";
    Object.assign(title.style, {
      fontSize: "clamp(34px, 3vw, 108px)",
      marginBottom: "0.22em"
    });

    const subtitle = document.createElement("div");
    subtitle.textContent = "an oversharing story";
    Object.assign(subtitle.style, {
      fontSize: "clamp(22px, 1.55vw, 56px)",
      fontWeight: "400"
    });

    text.append(title, subtitle);
    marker.append(text);
  };

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (!(node instanceof HTMLElement)) continue;
        if (node.matches?.("[data-inota-sync-marker='true']")) decorate(node);
        node.querySelectorAll?.("[data-inota-sync-marker='true']").forEach(decorate);
      }
    }
  });

  observer.observe(document.documentElement, { childList: true, subtree: true });
}
