const red = (mid = 0, high = 0) => [1.0, 0.01 + mid * 0.08, 0.015 + high * 0.04];

export function genesis({ level = 0, bass = 0, mid = 0, high = 0 } = {}) {
  const pulse = () => 0.78 + Math.sin(time * (0.24 + bass * 0.55)) * (0.08 + level * 0.12);

  osc(3 + bass * 7, 0.025 + high * 0.12, 0)
    .thresh(0.7 - level * 0.22)
    .pixelate(18 + high * 90, 12 + mid * 55)
    .scale(pulse)
    .modulate(noise(1.1 + high * 4.5, 0.04 + level * 0.22), 0.08 + bass * 0.28)
    .diff(
      shape(3 + Math.floor(mid * 5), 0.12 + bass * 0.08, 0.018)
        .rotate(() => time * (0.035 + high * 0.16))
        .repeat(2 + Math.floor(high * 4), 2 + Math.floor(mid * 3)),
      0.22 + level * 0.34
    )
    .color(...red(mid, high))
    .contrast(1.7 + level * 1.5)
    .blend(src(o0).scale(1.006 + bass * 0.015).rotate(0.002), 0.13 + level * 0.14)
    .out();
}

export function apparition({ level = 0, bass = 0, mid = 0, high = 0 } = {}) {
  shape(2, 0.015 + bass * 0.055, 0.012)
    .scale(() => 0.88 + Math.sin(time * (0.35 + bass * 0.7)) * (0.08 + level * 0.14))
    .add(
      shape(2, 0.008 + mid * 0.028, 0.018)
        .rotate(() => time * (0.06 + high * 0.18))
        .scrollX(() => Math.sin(time * 0.33) * (0.08 + mid * 0.09)),
      0.82
    )
    .modulate(noise(1.6 + high * 5, 0.05 + level * 0.2), 0.12 + level * 0.32)
    .color(...red(mid, high))
    .thresh(0.18 + high * 0.08)
    .contrast(1.8 + level * 1.3)
    .blend(src(o0).scale(1.009 + bass * 0.012).rotate(0.003), 0.16 + level * 0.14)
    .out();
}

export function resonance({ level = 0, bass = 0, mid = 0, high = 0 } = {}) {
  voronoi(3 + bass * 8, 0.12 + level * 0.3, 0.22 + mid * 0.35)
    .kaleid(3 + Math.floor(mid * 7))
    .modulate(noise(2 + high * 6, 0.08 + high * 0.22), 0.2 + level * 0.48)
    .diff(
      osc(7 + mid * 15, 0.08 + level * 0.24, 1.2)
        .rotate(() => time * (0.04 + high * 0.12))
        .thresh(0.5 - bass * 0.16),
      0.28 + high * 0.3
    )
    .color(...red(mid, high))
    .saturate(1.7)
    .contrast(1.65 + level * 1.5)
    .blend(src(o0).scale(1.01 + bass * 0.015).rotate(0.003), 0.18 + bass * 0.18)
    .out();
}

export function hypnosis({ level = 0, bass = 0, mid = 0, high = 0 } = {}) {
  src(o0)
    .scale(1.015 + bass * 0.06)
    .rotate(0.002 + mid * 0.04)
    .scrollX(() => (Math.random() - 0.5) * high * 0.06)
    .pixelate(10 + high * 180, 8 + level * 140)
    .modulate(noise(5 + high * 15, 0.28 + level * 1.2), 0.2 + bass * 0.8)
    .add(
      osc(14 + high * 70, 0.16 + level * 1.6, 1.4)
        .rotate(() => time * (0.04 + mid * 0.16))
        .thresh(0.55 - bass * 0.24)
        .color(...red(mid, high)),
      0.18 + high * 0.36
    )
    .diff(
      shape(3 + Math.floor(mid * 8), 0.16 + bass * 0.2, 0.025)
        .repeat(3 + Math.floor(high * 8), 2 + Math.floor(high * 6))
        .rotate(() => time * 0.12),
      0.12 + level * 0.28
    )
    .contrast(1.8 + level * 3)
    .saturate(1.4 + high * 1.6)
    .out();
}

export function crossing({ level = 0, bass = 0, mid = 0, high = 0 } = {}) {
  shape(50, 0.18 + bass * 0.12, 0.18)
    .scale(() => 0.8 + Math.sin(time * (0.16 + level * 0.32)) * (0.1 + bass * 0.1))
    .rotate(() => Math.sin(time * 0.12) * (0.12 + mid * 0.22))
    .modulate(noise(1 + high * 3.2, 0.04 + mid * 0.12), 0.08 + level * 0.3)
    .add(
      shape(4 + Math.floor(high * 5), 0.08 + mid * 0.06, 0.04)
        .repeat(2 + Math.floor(bass * 4), 2 + Math.floor(mid * 4))
        .rotate(() => -time * (0.03 + high * 0.12)),
      0.34
    )
    .color(...red(mid, high))
    .contrast(1.7 + level * 1.4)
    .blend(src(o0).scale(0.995 - bass * 0.01).rotate(-0.002), 0.11 + bass * 0.1)
    .out();
}

export function farewell({ level = 0, bass = 0, mid = 0, high = 0 } = {}) {
  shape(80, 0.14 + bass * 0.07, 0.28)
    .scale(() => 0.72 + Math.sin(time * (0.08 + level * 0.13)) * (0.06 + bass * 0.05))
    .modulate(noise(0.7 + high * 2.2, 0.025 + mid * 0.07), 0.05 + level * 0.14)
    .diff(
      osc(3 + mid * 8, 0.025 + high * 0.1, 0)
        .thresh(0.72 - level * 0.18),
      0.12 + high * 0.18
    )
    .color(...red(mid, high))
    .contrast(1.5 + level)
    .blend(src(o0).scale(0.998).rotate(-0.001), 0.06 + level * 0.05)
    .out();
}

export default { genesis, apparition, resonance, hypnosis, crossing, farewell };