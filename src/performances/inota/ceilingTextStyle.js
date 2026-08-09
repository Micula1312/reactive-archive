const STYLE_ID = "inota-ceiling-text-style";

export default function installInotaCeilingTextStyle() {
  if (typeof document === "undefined" || document.getElementById(STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    body[data-performance="inota"] #performance-subtitles {
      top: 0 !important;
      left: 0 !important;
      width: 100vw !important;
      height: 50vh !important;
      max-width: none !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      box-sizing: border-box !important;
      padding: 4vh 4vw !important;
      color: var(--inota-ceiling-text, rgba(255, 255, 255, 0.98)) !important;
      font-size: clamp(24px, 1.95vw, 70px) !important;
      line-height: 1.12 !important;
      text-align: center !important;
    }

    body[data-performance="inota"] #performance-subtitles .subtitle-window {
      display: block !important;
      width: min(92%, 3250px) !important;
      max-width: none !important;
      padding: 0 !important;
      margin: 0 !important;
      background: transparent !important;
      box-shadow: none !important;
      border: 0 !important;
      text-align: center !important;
    }

    body[data-performance="inota"] #performance-subtitles .subtitle-speaker {
      display: none !important;
    }

    body[data-performance="inota"] #performance-subtitles .subtitle-text {
      display: block !important;
      white-space: pre-line !important;
      text-align: center !important;
      text-wrap: balance;
    }
  `;

  document.head.appendChild(style);
}
