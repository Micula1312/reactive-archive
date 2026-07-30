export function genesis({ level = 0, bass = 0, mid = 0, high = 0 } = {}) {
  const breath = () => 0.82 + Math.sin(time * (0.16 + level * 0.18)) * 0.12;

  osc(2.2 + bass * 2.8, 0.012 + level * 0.035, 0)
    .thresh(0.78 - mid * 0.12)
    .scale(breath)
    .modulate(noise(0.8 + high * 2.0, 0.015 + level * 0.04), 0.035 + bass * 0.08)
    .add(
      shape(90, 0.08 + bass * 0.035, 0.28)
        .scale(() => 0.65 + Math.sin(time * 0.11) * 0.08),
      0.34
    )
    .color(0.96, 0.98, 1.0)
    .contrast(1.35 + level * 0.6)
    .blend(src(o0).scale(1.0015), 0.06 + high * 0.05)
    .out();
}

export function apparition({ level = 0, bass = 0, mid = 0, high = 0 } = {}) {
  const pulse = () => 0.9 + Math.sin(time * (0.22 + bass * 0.22)) * 0.1;

  shape(2, 0.012 + bass * 0.03, 0.018)
    .scale(pulse)
    .add(
      shape(2, 0.007 + mid * 0.018, 0.025)
        .rotate(() => time * (0.025 + high * 0.05))
        .scrollX(() => Math.sin(time * 0.17) * 0.08),
      0.72
    )
    .modulate(
      noise(1.1 + high * 2.5, 0.025 + level * 0.07)
        .scale(1.2)
        .rotate(() => time * 0.02),
      0.07 + level * 0.16
    )
    .color(1.0, 0.025 + mid * 0.08, 0.035)
    .luma(0.12)
    .blend(src(o0).scale(1.003).rotate(0.001), 0.1 + level * 0.08)
    .out();
}

export function resonance({ level = 0, bass = 0, mid = 0, high = 0 } = {}) {
  voronoi(2.4 + bass * 5.5, 0.06 + level * 0.16, 0.18 + mid * 0.2)
    .kaleid(3 + Math.floor(mid * 5))
    .modulate(
      noise(1.6 + high * 3.2, 0.035 + high * 0.12)
        .scrollY(() => Math.sin(time * 0.1) * 0.08),
      0.14 + level * 0.34
    )
    .diff(
      osc(5 + mid * 8, 0.02 + level * 0.08, 1.2)
        .rotate(() => time * 0.018)
        .thresh(0.58),
      0.18 + high * 0.16
    )
    .color(0.02, 0.28 + mid * 0.34, 0.62 + high * 0.36)
    .saturate(1.15 + level * 0.8)
    .blend(src(o0).scale(1.004).rotate(0.0015), 0.14 + bass * 0.1)
    .out();
}

export function hypnosis({ level = 0, bass = 0, mid = 0, high = 0 } = {}) {
  src(o0)
    .scale(1.008 + bass * 0.035)
    .rotate(0.001 + mid * 0.024)
    .scrollX(() => (Math.random() - 0.5) * high * 0.025)
    .pixelate(14 + high * 120, 10 + level * 92)
    .modulate(
      noise(4 + high * 10, 0.18 + level * 0.82)
        .rotate(() => time * 0.05),
      0.12 + bass * 0.55
    )
    .add(
      osc(12 + high * 42, 0.1 + level * 1.15, 1.4)
        .rotate(() => time * (0.02 + mid * 0.08))
        .thresh(0.6 - bass * 0.18),
      0.12 + high * 0.22
    )
    .diff(
      shape(4 + Math.floor(mid * 5), 0.18 + bass * 0.14, 0.04)
        .repeat(2 + Math.floor(high * 5), 2 + Math.floor(high * 3))
        .rotate(() => time * 0.07),
      0.08 + level * 0.18
    )
    .contrast(1.3 + level * 2.2)
    .saturate(0.3 + high * 1.8)
    .out();
}

export function crossing({ level = 0, bass = 0, mid = 0, high = 0 } = {}) {
  shape(70, 0.2 + bass * 0.09, 0.32)
    .scale(() => 0.82 + Math.sin(time * (0.1 + level * 0.18)) * 0.1)
    .rotate(() => Math.sin(time * 0.07) * 0.12)
    .modulate(
      noise(0.7 + high * 1.6, 0.018 + mid * 0.055)
        .scale(1.4),
      0.045 + level * 0.16
    )
    .add(
      shape(120, 0.08 + mid * 0.04, 0.5)
        .scale(() => 1.15 + Math.sin(time * 0.09) * 0.06),
      0.22
    )
    .color(0.62 + high * 0.12, 0.76 + mid * 0.12, 0.86)
    .blend(src(o0).scale(0.997).rotate(-0.001), 0.075 + bass * 0.05)
    .out();
}

export function farewell({ level = 0, bass = 0, mid = 0, high = 0 } = {}) {
  shape(100, 0.16 + bass * 0.045, 0.48)
    .scale(() => 0.7 + Math.sin(time * (0.055 + level * 0.06)) * 0.055)
    .modulate(noise(0.45 + high, 0.012 + mid * 0.025), 0.025 + level * 0.06)
    .color(0.38, 0.56 + mid * 0.08, 0.7 + high * 0.08)
    .brightness(-0.18 + level * 0.1)
    .blend(src(o0).scale(0.999), 0.035)
    .blend(solid(0, 0, 0), () => Math.min(0.93, time * 0.0014))
    .out();
}

export default { genesis, apparition, resonance, hypnosis, crossing, farewell };