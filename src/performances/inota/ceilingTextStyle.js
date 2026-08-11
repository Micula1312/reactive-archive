const STYLE_ID = "inota-ceiling-text-style";

export default function installInotaCeilingTextStyle() {
  if (typeof document === "undefined" || document.getElementById(STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    /* Shared INOTA subtitle styling only. Positioning is split by data-position. */
    body[data-performance="inota"] #performance-subtitles {
      max-width: none !important;
      box-sizing: border-box !important;
      color: var(--inota-ceiling-text, rgba(255, 255, 255, 0.98)) !important;
      line-height: 1.12 !important;
      text-align: center !important;
    }

    /* CEILING = full 3600x1200 upper projection. */
    body[data-performance="inota"] #performance-subtitles[data-position="ceiling"] {
      position: absolute !important;
      top: 0 !important;
      left: 0 !important;
      width: 100% !important;
      height: 50% !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      padding: 4% !important;
      font-size: clamp(24px, 1.95vw, 70px) !important;
    }

    /* SCREEN = exact 1920x1200 lower projection, x=840..2760, y=1200..2400.
       The text sits near the TOP CENTRE of this rectangle. */
    body[data-performance="inota"] #performance-subtitles[data-position="screen"] {
      position: absolute !important;
      top: 50% !important;
      left: 23.333333% !important;
      width: 53.333333% !important;
      height: 50% !important;
      display: flex !important;
      align-items: flex-start !important;
      justify-content: center !important;
      padding: 3.2% 2% 0 !important;
      font-size: clamp(16px, 1.05vw, 34px) !important;
    }

    body[data-performance="inota"] #performance-subtitles .subtitle-window {
      display: block !important;
      padding: 0 !important;
      margin: 0 !important;
      background: transparent !important;
      box-shadow: none !important;
      border: 0 !important;
      text-align: center !important;
    }

    body[data-performance="inota"] #performance-subtitles[data-position="ceiling"] .subtitle-window {
      width: min(92%, 3250px) !important;
      max-width: none !important;
    }

    body[data-performance="inota"] #performance-subtitles[data-position="screen"] .subtitle-window {
      width: 86% !important;
      max-width: 86% !important;
      background: rgb(0 0 0 / 58%) !important;
      padding: 8px 14px 10px !important;
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

    body[data-performance="inota"] [data-scene-layer="inota-composite"] > div > div:nth-of-type(2) {
      background: #ff0000 !important;
    }
  `;

  document.head.appendChild(style);
}
