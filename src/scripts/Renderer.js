import * as THREE from "three";

import vertexShader from "../shaders/vertex.glsl?raw";
import fragmentShader from "../shaders/fragment.glsl?raw";

export default class Renderer {
  constructor({ canvas, video }) {
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error("Renderer: canvas non valido.");
    }

    if (!(video instanceof HTMLVideoElement)) {
      throw new Error("Renderer: video non valido.");
    }

    this.canvas = canvas;
    this.video = video;

    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: false,
      alpha: false,
      powerPreference: "high-performance",
    });

    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setClearColor(0x000000, 1);

    this.videoTexture = new THREE.VideoTexture(this.video);
    this.videoTexture.minFilter = THREE.LinearFilter;
    this.videoTexture.magFilter = THREE.LinearFilter;
    this.videoTexture.generateMipmaps = false;
    this.videoTexture.colorSpace = THREE.SRGBColorSpace;

    this.uniforms = {
      uTexture: { value: this.videoTexture },
      uTime: { value: 0 },
      uResolution: {
        value: new THREE.Vector2(window.innerWidth, window.innerHeight),
      },
      uAudio: { value: 0 },
      uBass: { value: 0 },
      uMid: { value: 0 },
      uHigh: { value: 0 },
      uReactivity: { value: 1 },
      uVisibility: { value: 0 },
    };

    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: this.uniforms,
    });

    this.geometry = new THREE.PlaneGeometry(2, 2);

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.scene.add(this.mesh);

    this.clock = new THREE.Clock();

    this.resize = this.resize.bind(this);
    window.addEventListener("resize", this.resize);

    this.resize();
  }

setAudioData({
  level = 0,
  bass = 0,
  mid = 0,
  high = 0
} = {}) {
  this.uniforms.uAudio.value =
    this.clamp01(level);

  this.uniforms.uBass.value =
    this.clamp01(bass);

  this.uniforms.uMid.value =
    this.clamp01(mid);

  this.uniforms.uHigh.value =
    this.clamp01(high);
}
  setReactivity(value) {
    this.uniforms.uReactivity.value = this.clamp01(value);
  }

  setVisibility(value) {
    this.uniforms.uVisibility.value = this.clamp01(value);
  }

  resize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.renderer.setSize(width, height, false);
    this.uniforms.uResolution.value.set(width, height);
  }

  render() {
    this.uniforms.uTime.value = this.clock.getElapsedTime();
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

    if (!Number.isFinite(number)) {
      return 0;
    }

    return Math.max(0, Math.min(1, number));
  }
}
