export default class TextScene {
  constructor({ scene, video, renderer }) {
    this.scene = scene;
    this.video = video;
    this.renderer = renderer;
    this.element = null;
    this.typingTimer = null;
    this.cursorTimer = null;
  }

  async enter() {
    this.video.pause();
    this.video.style.visibility = "hidden";
    this.renderer?.canvas?.style && (this.renderer.canvas.style.visibility = "hidden");

    const layer = document.createElement("section");
    layer.dataset.sceneLayer = "text";
    Object.assign(layer.style, {
      position: "fixed",
      inset: "0",
      zIndex: "20",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      boxSizing: "border-box",
      padding: "clamp(24px, 8vw, 140px)",
      overflow: "hidden",
      background: this.scene.background ?? "#000",
      color: this.scene.color ?? "#fff",
      fontFamily: this.scene.fontFamily ?? "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
    });

    const text = document.createElement("pre");
    Object.assign(text.style, {
      width: "min(1100px, 100%)",
      margin: "0",
      whiteSpace: "pre-wrap",
      overflowWrap: "anywhere",
      font: "inherit",
      fontSize: this.scene.fontSize ?? "clamp(18px, 2.4vw, 38px)",
      lineHeight: String(this.scene.lineHeight ?? 1.45),
      letterSpacing: this.scene.letterSpacing ?? "0.02em"
    });

    const content = document.createElement("span");
    const cursor = document.createElement("span");
    cursor.textContent = this.scene.cursor === false ? "" : "█";
    cursor.style.marginLeft = "0.12em";

    text.append(content, cursor);
    layer.append(text);
    document.body.append(layer);
    this.element = layer;

    const source = String(this.scene.text ?? "");
    const speed = Math.max(1, Number(this.scene.typingSpeed ?? 40));
    let index = 0;

    this.typingTimer = window.setInterval(() => {
      index += 1;
      content.textContent = source.slice(0, index);
      if (index >= source.length) {
        window.clearInterval(this.typingTimer);
        this.typingTimer = null;
      }
    }, speed);

    if (this.scene.cursor !== false) {
      this.cursorTimer = window.setInterval(() => {
        cursor.style.visibility = cursor.style.visibility === "hidden" ? "visible" : "hidden";
      }, 500);
    }
  }

  update() {}

  async exit() {
    if (this.typingTimer) window.clearInterval(this.typingTimer);
    if (this.cursorTimer) window.clearInterval(this.cursorTimer);
    this.typingTimer = null;
    this.cursorTimer = null;
    this.element?.remove();
    this.element = null;
  }

  restart() {
    return this.exit().then(() => this.enter());
  }
}