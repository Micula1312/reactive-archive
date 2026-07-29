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

vec3 blur9(vec2 uv, vec2 radius) {
  vec3 color = texture2D(uTexture, uv).rgb * 0.20;
  color += texture2D(uTexture, uv + vec2(radius.x, 0.0)).rgb * 0.12;
  color += texture2D(uTexture, uv - vec2(radius.x, 0.0)).rgb * 0.12;
  color += texture2D(uTexture, uv + vec2(0.0, radius.y)).rgb * 0.12;
  color += texture2D(uTexture, uv - vec2(0.0, radius.y)).rgb * 0.12;
  color += texture2D(uTexture, uv + radius).rgb * 0.08;
  color += texture2D(uTexture, uv - radius).rgb * 0.08;
  color += texture2D(uTexture, uv + vec2(radius.x, -radius.y)).rgb * 0.08;
  color += texture2D(uTexture, uv + vec2(-radius.x, radius.y)).rgb * 0.08;
  return color;
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
    color = texture2D(uTexture, uv).rgb;
  } else if (uEffectMode < 1.5) {
    // Glitch verticale: colonne irregolari, eventi brevi e nessuna separazione RGB.
    float columnCount = mix(18.0, 70.0, high * uHighDetail);
    float column = floor(uv.x * columnCount);
    float timeCell = floor(uTime * (3.0 + high * 9.0));
    float seed = random(vec2(column * 1.73, timeCell));
    float rarity = mix(0.94, 0.72, intensity + high * 0.35);
    float active = step(rarity, seed);

    float widthNoise = random(vec2(column, 41.7));
    float localX = fract(uv.x * columnCount);
    float innerBand = smoothstep(0.02, 0.12, localX) * (1.0 - smoothstep(0.78 + widthNoise * 0.16, 0.98, localX));
    active *= innerBand;

    float direction = random(vec2(column, timeCell + 9.0)) - 0.5;
    float verticalShift = direction * active * intensity * (0.035 + mid * uMidFlow * 0.24 + bass * uBassImpact * 0.08);
    vec2 shiftedUv = vec2(uv.x, fract(uv.y + verticalShift));

    float freezeCell = floor((uv.y + verticalShift) * mix(22.0, 90.0, high));
    float freezeAmount = step(0.82, random(vec2(column + freezeCell, timeCell * 0.37))) * active;
    shiftedUv.y = mix(shiftedUv.y, floor(shiftedUv.y * 36.0) / 36.0, freezeAmount * 0.28);

    color = texture2D(uTexture, shiftedUv).rgb;

    float seam = 1.0 - smoothstep(0.0, 0.025 + high * 0.018, min(localX, 1.0 - localX));
    color *= 1.0 - seam * active * (0.10 + intensity * 0.28);
  } else if (uEffectMode < 2.5) {
    // Soft gradient neutro: modula luce e fuoco senza introdurre nuovi colori.
    float breath = sin(uTime * 0.28 + uv.y * 3.0) * 0.5 + 0.5;
    float flow = sin(uv.y * 4.5 + uTime * (0.18 + mid * 0.55)) * mid * uMidFlow * intensity * 0.022;
    float pulse = sin(length(uv - 0.5) * 10.0 - uTime * 0.55) * bass * uBassImpact * intensity * 0.012;
    uv.x += flow + pulse;
    uv.y += cos(uv.x * 3.8 - uTime * 0.22) * mid * intensity * 0.010;

    vec3 base = texture2D(uTexture, uv).rgb;
    vec2 radius = vec2(1.0) / max(uResolution, vec2(1.0));
    vec3 soft = blur9(uv, radius * (1.5 + intensity * 3.0));
    float gradient = smoothstep(0.05, 0.95, uv.y + sin(uTime * 0.14) * 0.12);
    float blend = (0.08 + gradient * 0.18 + breath * 0.08) * intensity;
    color = mix(base, soft, blend);
    color *= 0.92 + breath * 0.08 + audio * 0.20;
  } else {
    // Defocus: messa a fuoco instabile e morbida, guidata dall'audio.
    float focusWave = sin(uTime * (0.32 + mid * 0.8) + uv.y * 5.0) * 0.5 + 0.5;
    float radial = smoothstep(0.08, 0.72, distance(uv, vec2(0.5)));
    float focusLoss = clamp((0.20 + audio * 0.55 + focusWave * 0.25 + radial * 0.30) * intensity, 0.0, 1.0);

    vec2 texel = vec2(1.0) / max(uResolution, vec2(1.0));
    vec2 radius = texel * (1.0 + focusLoss * (8.0 + bass * uBassImpact * 10.0));
    vec3 sharp = texture2D(uTexture, uv).rgb;
    vec3 blurred = blur9(uv, radius);

    float ghostAmount = focusLoss * (0.015 + high * uHighDetail * 0.025);
    vec3 ghost = texture2D(uTexture, uv + vec2(ghostAmount, -ghostAmount * 0.35)).rgb;
    color = mix(sharp, blurred, focusLoss);
    color = mix(color, ghost, focusLoss * 0.10);
  }

  float grain = random(gl_FragCoord.xy + vec2(uTime * 13.0, uTime * 7.0)) - 0.5;
  color += grain * high * uHighDetail * intensity * 0.018;
  color *= 0.94 + audio * 0.24;
  color = mix(vec3(0.0), color, uVisibility);
  gl_FragColor = vec4(color, 1.0);
}
