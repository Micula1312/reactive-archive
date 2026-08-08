import * as THREE from "three";

import vertexShader from "../shaders/vertex.glsl?raw";
import fragmentShader from "../shaders/fragment.glsl?raw";

const INOTA_OUTPUT = {
  width: 3600,
  height: 2400,
  ceiling: { x: 0, y: 0, width: 3600, height: 1200 },
  screen: { x: 840, y: 1200, width: 1920, height: 1200 }
};

export default class Renderer {
  constructor({ canvas, video }) {
    if (!(canvas instanceof HTMLCanvasElement)) throw new Error("Renderer: canvas non valido.");
    if (!(video instanceof HTMLVideoElement)) throw new Error("Renderer: video non valido.");

    this.canvas = canvas;
    this.video = video;
    this.output = document.body?.dataset.performance === "inota" ? INOTA_OUTPUT : null;
    this.surfaceMode = "both";
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      alpha: false,
      powerPreference: "high-performance",
      preserveDrawingBuffer: Boolean(this.output)
    });
    this.renderer.setPixelRatio(this.output ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setClearColor(0x000000, 1);
    this.renderer.autoClear = false;

    this.videoTexture = new THREE.VideoTexture(video);
    this.videoTexture.minFilter = THREE.LinearFilter;
    this.videoTexture.magFilter = THREE.LinearFilter;
    this.videoTexture.generateMipmaps = false;
    this.videoTexture.colorSpace = THREE.SRGBColorSpace;

    const initialWidth = this.output?.width ?? window.innerWidth;
    const initialHeight = this.output?.height ?? window.innerHeight;

    this.uniforms = {
      uTexture: { value: this.videoTexture },
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(initialWidth, initialHeight) },
      uAudio: { value: 0 },
      uBass: { value: 0 },
      uMid: { value: 0 },
      uHigh: { value: 0 },
      uReactivity: { value: 1 },
      uVisibility: { value: 0 },
      uEffectMode: { value: 0 },
      uEffectIntensity: { value: 0.5 },
      uBassImpact: { value: 0.5 },
      uMidFlow: { value: 0.5 },
      uHighDetail: { value: 0.5 }
    };

    this.material = new THREE.ShaderMaterial({ vertexShader, fragmentShader, uniforms: this.uniforms });
    this.geometry = new THREE.PlaneGeometry(2, 2);
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.scene.add(this.mesh);

    this.startTime = performance.now();
    this.resize = this.resize.bind(this);
    window.addEventListener("resize", this.resize);
    this.resize();
  }

  setSurfaceMode(mode = "both") {
    this.surfaceMode = ["screen", "ceiling", "both"].includes(mode) ? mode : "both";
  }

  setAudioData({ level = 0, bass = 0, mid = 0, high = 0 } = {}) {
    this.uniforms.uAudio.value = this.clamp01(level);
    this.uniforms.uBass.value = this.clamp01(bass);
    this.uniforms.uMid.value = this.clamp01(mid);
    this.uniforms.uHigh.value = this.clamp01(high);
  }

  setEffect(filter = {}) {
    const preset = typeof filter === "string" ? filter : filter.preset;
    const effectModes = {
      none: 0,
      glitch: 1,
      "glitch-vertical": 1,
      "soft-gradient": 2,
      defocus: 3,
      invert: 4,
      "invert-slash": 4
    };

    this.uniforms.uEffectMode.value = effectModes[preset] ?? 0;
    this.uniforms.uEffectIntensity.value = this.clamp01(filter.intensity ?? 0.5);
    this.uniforms.uBassImpact.value = this.clamp01(filter.bassImpact ?? 0.5);
    this.uniforms.uMidFlow.value = this.clamp01(filter.midFlow ?? 0.5);
    this.uniforms.uHighDetail.value = this.clamp01(filter.highDetail ?? 0.5);
  }

  setReactivity(value) { this.uniforms.uReactivity.value = this.clamp01(value); }
  setVisibility(value) { this.uniforms.uVisibility.value = this.clamp01(value); }

  resize() {
    if (this.output) {
      const { width, height } = this.output;
      this.renderer.setSize(width, height, false);
      this.uniforms.uResolution.value.set(width, height);
      this.canvas.style.width = "min(100vw, 150vh)";
      this.canvas.style.height = "min(100vh, 66.666667vw)";
      this.canvas.style.position = "fixed";
      this.canvas.style.left = "50%";
      this.canvas.style.top = "50%";
      this.canvas.style.transform = "translate(-50%, -50%)";
      return;
    }

    const width = window.innerWidth;
    const height = window.innerHeight;
    this.renderer.setSize(width, height, false);
    this.uniforms.uResolution.value.set(width, height);
  }

  renderRegion(region) {
    const y = this.output.height - (region.y + region.height);
    this.renderer.setViewport(region.x, y, region.width, region.height);
    this.renderer.setScissor(region.x, y, region.width, region.height);
    this.uniforms.uResolution.value.set(region.width, region.height);
    this.renderer.render(this.scene, this.camera);
  }

  renderInota() {
    const { width, height, ceiling, screen } = this.output;
    this.renderer.setScissorTest(false);
    this.renderer.setViewport(0, 0, width, height);
    this.renderer.clear(true, true, true);
    this.renderer.setScissorTest(true);

    if (this.surfaceMode === "both" || this.surfaceMode === "ceiling") this.renderRegion(ceiling);
    if (this.surfaceMode === "both" || this.surfaceMode === "screen") this.renderRegion(screen);

    this.renderer.setScissorTest(false);
    this.uniforms.uResolution.value.set(width, height);
  }

  render() {
    this.uniforms.uTime.value = (performance.now() - this.startTime) / 1000;

    if (this.output) {
      this.renderInota();
      return;
    }

    this.renderer.setScissorTest(false);
    this.renderer.clear(true, true, true);
    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    window.removeEventListener("resize", this.resize);
    this.geometry.dispose();
    this.material.dispose();
    this.videoTexture.dispose();
    this.renderer.dispose();
  }

  clamp01(value) {
    const number = Number(value);
    return Number.isFinite(number) ? Math.max(0, Math.min(1, number)) : 0;
  }
}
