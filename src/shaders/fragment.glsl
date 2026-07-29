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
    float columnCount = mix(18.0, 70.0, clamp(high * uHighDetail, 0.0, 1.0));
    float column = floor(uv.x * columnCount);
    float timeCell = floor(uTime * (3.0 + high * 9.0));
    float seed = random2d(vec2(column * 1.73, timeCell));
    float rarityValue = clamp(intensity + high * 0.35, 0.0, 1.0);
    float rarity = mix(0.94, 0.72, rarityValue);
    float glitchMask = step(rarity, seed);

    float widthNoise = random2d(vec2(column, 41.7));
    float localX = fract(uv.x * columnCount);
    float bandStart = smoothstep(0.02, 0.12, localX);
    float bandEnd = 1.0 - smoothstep(0.78 + widthNoise * 0.16, 0.98, localX);
    glitchMask *= bandStart * bandEnd;

    float direction = random2d(vec2(column, timeCell + 9.0)) - 0.5;
    float verticalShift = direction * glitchMask * intensity;
    verticalShift *= 0.035 + mid * uMidFlow * 0.24 + bass * uBassImpact * 0.08;

    vec2 shiftedUv = vec2(uv.x, fract(uv.y + verticalShift));
    float freezeCell = floor((uv.y + verticalShift) * mix(22.0, 90.0, clamp(high, 0.0, 1.0)));
    float freezeSeed = random2d(vec2(column + freezeCell, timeCell * 0.37));
    float freezeAmount = step(0.82, freezeSeed) * glitchMask;
    float steppedY = floor(shiftedUv.y * 36.0) / 36.0;
    shiftedUv.y = mix(shiftedUv.y, steppedY, freezeAmount * 0.28);

    color = texture2D(uTexture, shiftedUv).rgb;

    float edgeDistance = min(localX, 1.0 - localX);
    float seam = 1.0 - smoothstep(0.0, 0.025 + high * 0.018, edgeDistance);
    color *= 1.0 - seam * glitchMask * (0.10 + intensity * 0.28);
  } else if (uEffectMode < 2.5) {
    float breath = sin(uTime * 0.28 + uv.y * 3.0) * 0.5 + 0.5;
    float flow = sin(uv.y * 4.5 + uTime * (0.18 + mid * 0.55));
    flow *= mid * uMidFlow * intensity * 0.022;
    float pulse = sin(length(uv - vec2(0.5)) * 10.0 - uTime * 0.55);
    pulse *= bass * uBassImpact * intensity * 0.012;

    vec2 softUv = uv;
    softUv.x += flow + pulse;
    softUv.y += cos(softUv.x * 3.8 - uTime * 0.22) * mid * intensity * 0.010;

    vec3 baseColor = texture2D(uTexture, softUv).rgb;
    vec2 softRadius = getTexelSize() * (1.5 + intensity * 3.0);
    vec3 softColor = blur9(softUv, softRadius);
    float gradient = smoothstep(0.05, 0.95, softUv.y + sin(uTime * 0.14) * 0.12);
    float softBlend = (0.08 + gradient * 0.18 + breath * 0.08) * intensity;
    color = mix(baseColor, softColor, softBlend);
    color *= 0.92 + breath * 0.08 + audio * 0.20;
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

  float grain = random2d(gl_FragCoord.xy + vec2(uTime * 13.0, uTime * 7.0)) - 0.5;
  color += grain * high * uHighDetail * intensity * 0.018;
  color *= 0.94 + audio * 0.24;
  color = mix(vec3(0.0), color, uVisibility);

  gl_FragColor = vec4(color, 1.0);
}
