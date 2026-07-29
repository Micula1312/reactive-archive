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
uniform float uEffectMode;
uniform float uEffectIntensity;
uniform float uBassImpact;
uniform float uMidFlow;
uniform float uHighDetail;

varying vec2 vUv;

float random(vec2 point) {
  return fract(sin(dot(point, vec2(12.9898, 78.233))) * 43758.5453123);
}

vec3 sampleRgbSplit(vec2 uv, float amount) {
  float red = texture2D(uTexture, uv + vec2(amount, 0.0)).r;
  float green = texture2D(uTexture, uv).g;
  float blue = texture2D(uTexture, uv - vec2(amount, 0.0)).b;
  return vec3(red, green, blue);
}

void main() {
  vec2 uv = vUv;
  float audio = uAudio * uReactivity;
  float bass = uBass * uReactivity;
  float mid = uMid * uReactivity;
  float high = uHigh * uReactivity;
  float intensity = uEffectIntensity;

  vec3 color;

  if (uEffectMode < 0.5) {
    uv.x += sin(uv.y * 8.0 + uTime * 1.4) * bass * 0.025;
    uv.y += sin(uv.x * 14.0 - uTime * 1.8) * mid * 0.012;
    color = sampleRgbSplit(uv, high * 0.012);
  } else if (uEffectMode < 1.5) {
    float blockSize = mix(90.0, 18.0, intensity);
    float row = floor(uv.y * blockSize);
    float burst = step(0.72 - high * 0.35, random(vec2(row, floor(uTime * (8.0 + bass * 22.0)))));
    float shift = (random(vec2(row, floor(uTime * 12.0))) - 0.5) * burst * bass * uBassImpact * intensity * 0.22;
    uv.x = fract(uv.x + shift);

    float pixelAmount = mix(900.0, 70.0, high * uHighDetail * intensity);
    vec2 pixelUv = floor(uv * pixelAmount) / pixelAmount;
    float split = (0.004 + high * 0.035) * intensity;
    color = sampleRgbSplit(pixelUv, split);

    float scan = step(0.88, sin((uv.y + uTime * 0.35) * 620.0) * 0.5 + 0.5);
    color += scan * high * intensity * 0.13;
  } else {
    float breath = sin(uTime * 0.34 + uv.y * 3.2) * 0.5 + 0.5;
    float flow = sin(uv.y * 5.0 + uTime * (0.22 + mid * 0.8)) * mid * uMidFlow * intensity * 0.035;
    float pulse = sin(length(uv - 0.5) * 12.0 - uTime * 0.7) * bass * uBassImpact * intensity * 0.018;
    uv.x += flow + pulse;
    uv.y += cos(uv.x * 4.0 - uTime * 0.28) * mid * intensity * 0.016;

    vec3 base = texture2D(uTexture, uv).rgb;
    vec3 warm = vec3(base.r * 1.08, base.g * 0.96, base.b * 1.04);
    vec3 cool = vec3(base.r * 0.9, base.g * 1.02, base.b * 1.12);
    float gradient = smoothstep(0.0, 1.0, uv.y + sin(uTime * 0.16) * 0.18);
    color = mix(cool, warm, gradient);
    color *= 0.88 + breath * 0.12 + audio * 0.42;
  }

  float noise = random(gl_FragCoord.xy + vec2(uTime * 23.0, uTime * 11.0)) - 0.5;
  color += noise * high * (0.02 + uHighDetail * intensity * 0.055);
  color *= 0.88 + audio * 0.45;
  color = mix(vec3(0.0), color, uVisibility);
  gl_FragColor = vec4(color, 1.0);
}
