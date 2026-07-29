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
    float coarseColumns = mix(7.0, 18.0, high);
    float fineColumns = mix(24.0, 92.0, high * uHighDetail);
    float coarseColumn = floor(uv.x * coarseColumns);
    float fineColumn = floor(uv.x * fineColumns);
    float rowCount = mix(8.0, 34.0, mid);
    float row = floor(uv.y * rowCount);
    float timeCell = floor(uTime * (3.0 + high * 11.0));

    float coarseSeed = random2d(vec2(coarseColumn * 2.17, timeCell));
    float fineSeed = random2d(vec2(fineColumn + 17.0, timeCell * 1.31));
    float rowSeed = random2d(vec2(row * 3.71, timeCell + fineColumn));

    float coarseMask = step(mix(0.94, 0.68, intensity + bass * 0.25), coarseSeed);
    float fineMask = step(mix(0.97, 0.76, intensity + high * 0.3), fineSeed);
    float blockMask = step(mix(0.95, 0.72, intensity + mid * 0.25), rowSeed);

    float localFineX = fract(uv.x * fineColumns);
    float localRowY = fract(uv.y * rowCount);
    float stripMask = smoothstep(0.03, 0.16, localFineX) * (1.0 - smoothstep(0.72, 0.98, localFineX));
    float rowMask = smoothstep(0.02, 0.12, localRowY) * (1.0 - smoothstep(0.70, 0.98, localRowY));

    float glitchMask = clamp(coarseMask * 0.8 + fineMask * stripMask + blockMask * rowMask, 0.0, 1.0);

    float verticalDirection = random2d(vec2(fineColumn, timeCell + 9.0)) - 0.5;
    float horizontalDirection = random2d(vec2(row + 5.0, timeCell * 0.73)) - 0.5;
    float verticalShift = verticalDirection * glitchMask * intensity * (0.05 + mid * uMidFlow * 0.30 + bass * uBassImpact * 0.10);
    float horizontalShift = horizontalDirection * blockMask * intensity * (0.015 + bass * uBassImpact * 0.08);

    vec2 shiftedUv = uv + vec2(horizontalShift, verticalShift);
    shiftedUv = fract(shiftedUv);

    float freezeSeed = random2d(vec2(fineColumn + row, timeCell * 0.41));
    float freezeMask = step(0.79, freezeSeed) * glitchMask;
    float steppedY = floor(shiftedUv.y * mix(18.0, 64.0, high)) / mix(18.0, 64.0, high);
    float steppedX = floor(shiftedUv.x * mix(24.0, 110.0, high)) / mix(24.0, 110.0, high);
    shiftedUv = mix(shiftedUv, vec2(steppedX, steppedY), freezeMask * 0.42);

    color = texture2D(uTexture, shiftedUv).rgb;

    float tear = step(0.86, random2d(vec2(row, timeCell * 1.91))) * blockMask;
    color *= 1.0 - tear * (0.15 + intensity * 0.35);

    float seamX = 1.0 - smoothstep(0.0, 0.018 + high * 0.012, min(localFineX, 1.0 - localFineX));
    float seamY = 1.0 - smoothstep(0.0, 0.025, min(localRowY, 1.0 - localRowY));
    color *= 1.0 - (seamX * fineMask + seamY * blockMask) * (0.06 + intensity * 0.22);
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

  float grain = random2d(gl_FragCoord.xy + vec2(uTime * 13.0, uTime * 7.0)) - 0.5;
  color += grain * high * uHighDetail * intensity * 0.018;
  color *= 0.94 + audio * 0.24;
  color = mix(vec3(0.0), color, uVisibility);

  gl_FragColor = vec4(color, 1.0);
}
