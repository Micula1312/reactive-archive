export default class TextScene {
  constructor({ scene, video, renderer }) {
    this.scene = scene;
    this.video = video;
    this.renderer = renderer;
    this.element = null;
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
      display: "grid",
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

    titleGroup.append(heading);
    if (subtitle.textContent) titleGroup.append(subtitle);
    layer.append(titleGroup);
    document.body.append(layer);
    this.element = layer;

    requestAnimationFrame(() => {
      titleGroup.style.opacity = "1";
      titleGroup.style.transform = "translateY(0)";
    });
  }

  update() {}

  async exit() {
    this.element?.remove();
    this.element = null;
  }

  restart() {
    return this.exit().then(() => this.enter());
  }
}
