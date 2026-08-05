export default class TextScene {
  constructor({ scene, video, renderer }) {
    this.scene = scene;
    this.video = video;
    this.renderer = renderer;
    this.element = null;
    this.titleTimer = 0;
    this.countdownTimer = 0;
    this.sceneStartedAt = 0;
  }

  formatCountdown(seconds) {
    const safeSeconds = Math.max(0, Math.ceil(seconds));
    const minutes = Math.floor(safeSeconds / 60);
    const remainder = safeSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
  }

  async enter() {
    this.video.pause();
    this.video.style.visibility = "hidden";
    if (this.renderer?.canvas?.style) {
      this.renderer.canvas.style.visibility = "hidden";
    }

    const layer = document.createElement("section");
    layer.dataset.sceneLayer = "text";
    Object.assign(layer.style, {
      position: "fixed",
      inset: "0",
      zIndex: "20",
      display: "grid",
      placeItems: "center",
      boxSizing: "border-box",
      padding: "clamp(24px, 8vw, 140px)",
      overflow: "hidden",
      background: this.scene.background ?? "#000",
      color: this.scene.color ?? "#fff",
      fontFamily: this.scene.fontFamily ?? "Helvetica, Arial, sans-serif",
      textAlign: "center"
    });

    const titleGroup = document.createElement("div");
    Object.assign(titleGroup.style, {
      position: "absolute",
      inset: "0",
      display: "grid",
      placeContent: "center",
      gap: "clamp(10px, 1.4vw, 18px)",
      justifyItems: "center",
      opacity: "0",
      transform: "translateY(8px)",
      transition: "opacity 700ms ease, transform 700ms ease"
    });

    const heading = document.createElement("h1");
    heading.textContent = this.scene.heading ?? this.scene.title ?? "";
    Object.assign(heading.style, {
      margin: "0",
      fontSize: this.scene.headingSize ?? "clamp(44px, 8vw, 112px)",
      fontWeight: "400",
      lineHeight: "0.95",
      letterSpacing: "-0.035em"
    });

    const subtitle = document.createElement("p");
    subtitle.textContent = this.scene.subtitle ?? "";
    Object.assign(subtitle.style, {
      margin: "0",
      fontSize: this.scene.subtitleSize ?? "clamp(14px, 1.35vw, 22px)",
      fontWeight: "300",
      lineHeight: "1.3",
      letterSpacing: "0.02em"
    });

    const countdown = document.createElement("time");
    const countdownSeconds = Math.max(0, Number(this.scene.countdownSeconds ?? 0));
    Object.assign(countdown.style, {
      position: "absolute",
      left: "50%",
      top: "50%",
      transform: "translate(-50%, -50%)",
      margin: "0",
      opacity: "0",
      color: this.scene.color ?? "#fff",
      fontFamily: this.scene.countdownFontFamily ?? "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
      fontSize: this.scene.countdownSize ?? "clamp(34px, 6vw, 86px)",
      fontWeight: "300",
      lineHeight: "1",
      letterSpacing: "0.08em",
      fontVariantNumeric: "tabular-nums",
      transition: "opacity 600ms ease"
    });
    countdown.textContent = this.formatCountdown(countdownSeconds);

    titleGroup.append(heading);
    if (subtitle.textContent) titleGroup.append(subtitle);
    layer.append(titleGroup, countdown);
    document.body.append(layer);
    this.element = layer;
    this.sceneStartedAt = performance.now();

    requestAnimationFrame(() => {
      titleGroup.style.opacity = "1";
      titleGroup.style.transform = "translateY(0)";
    });

    const titleDuration = Math.max(0, Number(this.scene.titleDuration ?? 5));
    this.titleTimer = window.setTimeout(() => {
      titleGroup.style.opacity = "0";
      titleGroup.style.transform = "translateY(-8px)";

      window.setTimeout(() => {
        if (!this.element) return;
        titleGroup.style.display = "none";
        if (countdownSeconds > 0) countdown.style.opacity = "1";
      }, 700);
    }, titleDuration * 1000);

    if (countdownSeconds > 0) {
      const updateCountdown = () => {
        const elapsed = (performance.now() - this.sceneStartedAt) / 1000;
        countdown.textContent = this.formatCountdown(countdownSeconds - elapsed);
      };

      updateCountdown();
      this.countdownTimer = window.setInterval(updateCountdown, 100);
    }
  }

  update() {}

  async exit() {
    window.clearTimeout(this.titleTimer);
    window.clearInterval(this.countdownTimer);
    this.titleTimer = 0;
    this.countdownTimer = 0;
    this.element?.remove();
    this.element = null;
  }

  restart() {
    return this.exit().then(() => this.enter());
  }
}
