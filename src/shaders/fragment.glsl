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
    float timeCell = floor(uTime * (0.8 + high * 5.0));
    float eventSeed = random2d(vec2(timeCell, 19.17));
    float eventGate = step(0.68 - audio * 0.22, eventSeed);

    float columnCount = mix(5.0, 18.0, high * uHighDetail);
    float column = floor(uv.x * columnCount);
    float chosenColumn = floor(random2d(vec2(timeCell, 3.41)) * columnCount);
    float columnMask = 1.0 - step(0.5, abs(column - chosenColumn));

    float localX = fract(uv.x * columnCount);
    float innerMask = smoothstep(0.04, 0.18, localX) * (1.0 - smoothstep(0.76, 0.96, localX));
    float glitchMask = eventGate * columnMask * innerMask;

    float direction = random2d(vec2(timeCell, 7.73)) - 0.5;
    float pixelShift = (4.0 + 24.0 * intensity + bass * uBassImpact * 18.0) / max(uResolution.y, 1.0);
    vec2 shiftedUv = uv;
    shiftedUv.y = fract(shiftedUv.y + direction * pixelShift * glitchMask);

    float microLine = step(0.965 - high * 0.02, random2d(vec2(floor(uv.x * 220.0), timeCell))) * eventGate;
    shiftedUv.y = fract(shiftedUv.y + direction * pixelShift * 0.55 * microLine);

    color = texture2D(uTexture, shiftedUv).rgb;
    float seam = 1.0 - smoothstep(0.0, 0.018, min(localX, 1.0 - localX));
    color *= 1.0 - seam * glitchMask * 0.18;
  } else if (uEffectMode < 2.5) {
    float breath = sin(uTime * (0.22 + bass * 0.8)) * 0.5 + 0.5;
    vec3 baseColor = texture2D(uTexture, uv).rgb;
    vec2 softRadius = getTexelSize() * (1.2 + intensity * 4.5 + audio * 5.0);
    vec3 softColor = blur9(uv, softRadius);
    float verticalTone = smoothstep(0.05, 0.95, uv.y);
    float softBlend = (0.1 + verticalTone * 0.18 + breath * 0.12 + mid * 0.2) * intensity;
    color = mix(baseColor, softColor, clamp(softBlend, 0.0, 0.9));
    color *= 0.88 + breath * 0.08 + audio * 0.38;
  } else if (uEffectMode < 3.5) {
    float focusWave = sin(uTime * (0.5 + mid * 2.0) + uv.y * 8.0) * 0.5 + 0.5;
    float radial = smoothstep(0.08, 0.72, distance(uv, vec2(0.5)));
    float focusLoss = (0.18 + audio * 0.72 + focusWave * 0.34 + radial * 0.30) * intensity;
    focusLoss = clamp(focusLoss, 0.0, 1.0);

    vec2 defocusRadius = getTexelSize();
    defocusRadius *= 1.0 + focusLoss * (12.0 + bass * uBassImpact * 22.0);

    vec3 sharpColor = texture2D(uTexture, uv).rgb;
    vec3 blurredColor = blur9(uv, defocusRadius);
    float ghostAmount = focusLoss * (0.02 + high * uHighDetail * 0.06);
    vec2 ghostOffset = vec2(ghostAmount, -ghostAmount * 0.35);
    vec3 ghostColor = texture2D(uTexture, uv + ghostOffset).rgb;

    color = mix(sharpColor, blurredColor, focusLoss);
    color = mix(color, ghostColor, focusLoss * 0.24);
  } else {
    vec2 centered = uv - 0.5;
    float beatCell = floor(uTime * (3.0 + high * 18.0));
    float slashCount = 7.0 + floor(high * 26.0 + intensity * 10.0);
    float diagonal = centered.x * 1.35 + centered.y + uTime * (0.35 + mid * 1.8);
    float band = fract(diagonal * slashCount + random2d(vec2(beatCell, 2.7)));
    float width = mix(0.025, 0.22, clamp(audio * 1.6 + bass * 0.65, 0.0, 1.0));
    float slash = 1.0 - smoothstep(width, width + 0.055, abs(band - 0.5));

    float burstSeed = random2d(vec2(beatCell, floor(uv.y * 12.0)));
    float burstGate = step(0.52 - audio * 0.34, burstSeed);
    float horizontalCut = step(0.9 - high * 0.2, random2d(vec2(floor(uv.y * 36.0), beatCell)));
    float mask = clamp(slash * burstGate + horizontalCut * high, 0.0, 1.0);

    float kickOffset = (bass * uBassImpact * 0.075 + audio * 0.035) * (random2d(vec2(beatCell, 8.1)) - 0.5);
    vec2 slashUv = uv;
    slashUv.x = fract(slashUv.x + kickOffset * mask);
    slashUv.y = fract(slashUv.y - kickOffset * 0.45 * mask);

    vec3 source = texture2D(uTexture, slashUv).rgb;
    vec3 inverted = vec3(1.0) - source;
    color = mix(source, inverted, mask * (0.72 + intensity * 0.28));

    float whiteFlash = step(0.82 - audio * 0.38, random2d(vec2(beatCell, 11.4))) * slash;
    color = mix(color, vec3(1.0), whiteFlash * (0.18 + high * 0.42));

    float redAttack = mask * clamp(bass * 1.4 + high * 0.5, 0.0, 1.0);
    color = mix(color, vec3(color.r + redAttack * 0.55, color.g * 0.18, color.b * 0.18), redAttack * 0.72);
    color *= 0.9 + audio * 0.55;
  }

  color *= 0.92 + audio * 0.34;
  color = mix(vec3(0.0), color, uVisibility);
  gl_FragColor = vec4(color, 1.0);
}