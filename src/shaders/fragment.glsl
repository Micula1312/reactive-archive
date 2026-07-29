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

float random2d(vec2 point) {
  return fract(sin(dot(point, vec2(12.9898, 78.233))) * 43758.5453);
}

vec2 getTexelSize() {
  float safeWidth = max(uResolution.x, 1.0);
  float safeHeight = max(uResolution.y, 1.0);
  return vec2(1.0 / safeWidth, 1.0 / safeHeight);
}

vec3 blur9(vec2 uv, vec2 blurRadius) {
  vec3 result = texture2D(uTexture, uv).rgb * 0.20;
  result += texture2D(uTexture, uv + vec2(blurRadius.x, 0.0)).rgb * 0.12;
  result += texture2D(uTexture, uv - vec2(blurRadius.x, 0.0)).rgb * 0.12;
  result += texture2D(uTexture, uv + vec2(0.0, blurRadius.y)).rgb * 0.12;
  result += texture2D(uTexture, uv - vec2(0.0, blurRadius.y)).rgb * 0.12;
  result += texture2D(uTexture, uv + blurRadius).rgb * 0.08;
  result += texture2D(uTexture, uv - blurRadius).rgb * 0.08;
  result += texture2D(uTexture, uv + vec2(blurRadius.x, -blurRadius.y)).rgb * 0.08;
  result += texture2D(uTexture, uv + vec2(-blurRadius.x, blurRadius.y)).rgb * 0.08;
  return result;
}

void main() {
  vec2 uv = vUv;
  float audio = uAudio * uReactivity;
  float bass = uBass * uReactivity;
  float mid = uMid * uReactivity;
  float high = uHigh * uReactivity;
  float intensity = clamp(uEffectIntensity, 0.0, 1.0);
  vec3 color = texture2D(uTexture, uv).rgb;

  if (uEffectMode < 0.5) {
    color = texture2D(uTexture, uv).rgb;
  } else if (uEffectMode < 1.5) {
    float timeCell = floor(uTime * 0.45);
    float eventSeed = random2d(vec2(timeCell, 19.17));
    float eventGate = step(0.82, eventSeed);

    float columnCount = mix(5.0, 11.0, high * uHighDetail);
    float column = floor(uv.x * columnCount);
    float chosenColumn = floor(random2d(vec2(timeCell, 3.41)) * columnCount);
    float columnMask = 1.0 - step(0.5, abs(column - chosenColumn));

    float localX = fract(uv.x * columnCount);
    float innerMask = smoothstep(0.08, 0.22, localX) * (1.0 - smoothstep(0.72, 0.92, localX));
    float glitchMask = eventGate * columnMask * innerMask;

    float direction = random2d(vec2(timeCell, 7.73)) - 0.5;
    float pixelShift = (2.0 + 10.0 * intensity + bass * uBassImpact * 5.0) / max(uResolution.y, 1.0);
    vec2 shiftedUv = uv;
    shiftedUv.y = fract(shiftedUv.y + direction * pixelShift * glitchMask);

    float microLine = step(0.985, random2d(vec2(floor(uv.x * 180.0), timeCell))) * eventGate;
    shiftedUv.y = fract(shiftedUv.y + direction * pixelShift * 0.35 * microLine);

    color = texture2D(uTexture, shiftedUv).rgb;
    float seam = 1.0 - smoothstep(0.0, 0.018, min(localX, 1.0 - localX));
    color *= 1.0 - seam * glitchMask * 0.10;
  } else if (uEffectMode < 2.5) {
    float breath = sin(uTime * 0.22) * 0.5 + 0.5;
    vec3 baseColor = texture2D(uTexture, uv).rgb;
    vec2 softRadius = getTexelSize() * (1.2 + intensity * 2.6 + audio * 1.8);
    vec3 softColor = blur9(uv, softRadius);
    float verticalTone = smoothstep(0.05, 0.95, uv.y);
    float softBlend = (0.08 + verticalTone * 0.14 + breath * 0.05) * intensity;
    color = mix(baseColor, softColor, softBlend);
    color *= 0.94 + breath * 0.05 + audio * 0.16;
  } else {
    float focusWave = sin(uTime * (0.32 + mid * 0.8) + uv.y * 5.0) * 0.5 + 0.5;
    float radial = smoothstep(0.08, 0.72, distance(uv, vec2(0.5)));
    float focusLoss = (0.20 + audio * 0.55 + focusWave * 0.25 + radial * 0.30) * intensity;
    focusLoss = clamp(focusLoss, 0.0, 1.0);

    vec2 defocusRadius = getTexelSize();
    defocusRadius *= 1.0 + focusLoss * (8.0 + bass * uBassImpact * 10.0);

    vec3 sharpColor = texture2D(uTexture, uv).rgb;
    vec3 blurredColor = blur9(uv, defocusRadius);
    float ghostAmount = focusLoss * (0.015 + high * uHighDetail * 0.025);
    vec2 ghostOffset = vec2(ghostAmount, -ghostAmount * 0.35);
    vec3 ghostColor = texture2D(uTexture, uv + ghostOffset).rgb;

    color = mix(sharpColor, blurredColor, focusLoss);
    color = mix(color, ghostColor, focusLoss * 0.10);
  }

  color *= 0.94 + audio * 0.24;
  color = mix(vec3(0.0), color, uVisibility);
  gl_FragColor = vec4(color, 1.0);
}
