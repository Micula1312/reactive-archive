precision highp float;

uniform sampler2D uTexture;

uniform float uTime;
uniform vec2 uResolution;

uniform float uAudio;
uniform float uBass;
uniform float uMid;
uniform float uHigh;
uniform float uReactivity;
uniform float uVisibility;

varying vec2 vUv;

float random(vec2 point) {
  return fract(
    sin(dot(point, vec2(12.9898, 78.233))) *
    43758.5453123
  );
}

void main() {
  vec2 uv = vUv;

  float reactiveAudio = uAudio * uReactivity;
  float reactiveBass = uBass * uReactivity;
  float reactiveMid = uMid * uReactivity;
  float reactiveHigh = uHigh * uReactivity;

  /*
   * Distorsione morbida:
   * il basso sposta orizzontalmente l'immagine,
   * i medi creano una piccola onda verticale.
   */
  float horizontalWave =
    sin((uv.y * 8.0) + (uTime * 1.4)) *
    reactiveBass *
    0.025;

  float verticalWave =
    sin((uv.x * 14.0) - (uTime * 1.8)) *
    reactiveMid *
    0.012;

  uv.x += horizontalWave;
  uv.y += verticalWave;

  /*
   * RGB split leggero controllato dalle frequenze alte.
   */
  float split = reactiveHigh * 0.012;

  float red = texture2D(
    uTexture,
    uv + vec2(split, 0.0)
  ).r;

  float green = texture2D(
    uTexture,
    uv
  ).g;

  float blue = texture2D(
    uTexture,
    uv - vec2(split, 0.0)
  ).b;

  vec3 color = vec3(red, green, blue);

  /*
   * Micro-variazione luminosa.
   */
  color *= 0.88 + (reactiveAudio * 0.45);

  /*
   * Grana minima, visibile soprattutto quando il segnale sale.
   */
  float noise =
    random(
      gl_FragCoord.xy +
      vec2(uTime * 23.0, uTime * 11.0)
    ) - 0.5;

  color += noise * reactiveHigh * 0.045;

  /*
   * SILENZIO → NERO
   *
   * uVisibility viene smussato in main.js:
   * 0.0 = nero completo
   * 1.0 = immagine completamente visibile
   */
  color = mix(
    vec3(0.0),
    color,
    uVisibility
  );

  gl_FragColor = vec4(color, 1.0);
}
