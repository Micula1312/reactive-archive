const red = (mid = 0, high = 0) => [1.0, 0.01 + mid * 0.08, 0.015 + high * 0.04];
const white = (level = 0) => [0.72 + level * 0.28, 0.72 + level * 0.28, 0.72 + level * 0.28];

export function genesis({ level = 0, bass = 0, mid = 0, high = 0 } = {}) {
  const breathing = () => 0.82 + Math.sin(time * (0.16 + bass * 0.32)) * (0.06 + level * 0.12);
  const phase = () => (Math.sin(time * 0.035) + 1) * 0.5;

  osc(2.4 + bass * 8, 0.018 + high * 0.1, 0)
    .thresh(0.69 - level * 0.2)
    .pixelate(14 + high * 100, 10 + mid * 70)
    .scale(breathing)
    .modulate(noise(0.8 + high * 4.5, 0.025 + level * 0.16), 0.06 + bass * 0.3)
    .diff(
      shape(3 + Math.floor(mid * 6), 0.1 + bass * 0.1, 0.015)
        .rotate(() => time * (0.018 + high * 0.12))
        .repeat(2 + Math.floor(high * 5), 2 + Math.floor(mid * 4)),
      0.18 + level * 0.36
    )
    .add(
      voronoi(2 + mid * 5, 0.08 + level * 0.22, 0.12 + high * 0.3)
        .kaleid(3 + Math.floor(high * 5))
        .thresh(0.62 - bass * 0.18)
        .color(...white(level)),
      () => 0.05 + phase() * 0.16
    )
    .color(...red(mid, high))
    .contrast(1.6 + level * 1.8)
    .blend(src(o0).scale(1.004 + bass * 0.018).rotate(() => Math.sin(time * 0.05) * 0.004), 0.1 + level * 0.18)
    .out();
}

export function apparition({ level = 0, bass = 0, mid = 0, high = 0 } = {}) {
  const drift = () => Math.sin(time * 0.11) * (0.06 + mid * 0.12);
  const opening = () => 0.78 + Math.sin(time * (0.2 + bass * 0.42)) * (0.08 + level * 0.16);

  shape(2, 0.012 + bass * 0.05, 0.01)
    .scale(opening)
    .add(
      shape(2, 0.008 + mid * 0.03, 0.018)
        .rotate(() => time * (0.035 + high * 0.16))
        .scrollX(drift),
      0.75
    )
    .diff(
      osc(5 + high * 18, 0.035 + level * 0.3, 0.7)
        .rotate(() => -time * (0.02 + mid * 0.07))
        .thresh(0.55 - bass * 0.18),
      0.14 + high * 0.3
    )
    .modulate(noise(1.2 + high * 6, 0.035 + level * 0.24), 0.1 + level * 0.38)
    .add(
      voronoi(3 + bass * 6, 0.06 + high * 0.2, 0.18 + mid * 0.25)
        .kaleid(4 + Math.floor(mid * 5))
        .color(...red(mid, high)),
      0.08 + mid * 0.16
    )
    .color(...red(mid, high))
    .contrast(1.75 + level * 1.5)
    .blend(src(o0).scale(1.006 + bass * 0.016).rotate(() => Math.sin(time * 0.07) * 0.006), 0.14 + level * 0.18)
    .out();
}

export function resonance({ level = 0, bass = 0, mid = 0, high = 0 } = {}) {
  const sway = () => Math.sin(time * 0.08) * (0.08 + mid * 0.16);

  voronoi(2.4 + bass * 9, 0.1 + level * 0.34, 0.2 + mid * 0.4)
    .kaleid(3 + Math.floor(mid * 8))
    .rotate(sway)
    .modulate(noise(1.6 + high * 7, 0.06 + high * 0.28), 0.18 + level * 0.55)
    .diff(
      osc(6 + mid * 18, 0.06 + level * 0.3, 1.1)
        .rotate(() => time * (0.025 + high * 0.13))
        .thresh(0.48 - bass * 0.18),
      0.24 + high * 0.34
    )
    .add(
      shape(6 + Math.floor(high * 6), 0.14 + bass * 0.12, 0.025)
        .repeat(2 + Math.floor(mid * 5), 2 + Math.floor(high * 4))
        .rotate(() => -time * (0.018 + mid * 0.08))
        .color(...white(level)),
      0.06 + level * 0.18
    )
    .color(...red(mid, high))
    .saturate(1.55 + high * 0.6)
    .contrast(1.6 + level * 1.8)
    .blend(src(o0).scale(1.008 + bass * 0.02).rotate(() => Math.sin(time * 0.04) * 0.008), 0.16 + bass * 0.2)
    .out();
}

export function hypnosis({ level = 0, bass = 0, mid = 0, high = 0 } = {}) {
  const rupture = () => Math.sin(time * 0.17) * (0.01 + high * 0.05);

  src(o0)
    .scale(1.01 + bass * 0.07)
    .rotate(() => 0.002 + mid * 0.045 + rupture())
    .scrollX(() => Math.sin(time * 0.21) * high * 0.045)
    .pixelate(8 + high * 190, 7 + level * 150)
    .modulate(noise(4 + high * 18, 0.22 + level * 1.25), 0.18 + bass * 0.9)
    .add(
      osc(12 + high * 78, 0.12 + level * 1.8, 1.4)
        .rotate(() => time * (0.035 + mid * 0.2))
        .thresh(0.54 - bass * 0.25)
        .color(...red(mid, high)),
      0.16 + high * 0.4
    )
    .diff(
      shape(3 + Math.floor(mid * 9), 0.14 + bass * 0.22, 0.02)
        .repeat(3 + Math.floor(high * 9), 2 + Math.floor(high * 7))
        .rotate(() => time * 0.1),
      0.1 + level * 0.32
    )
    .add(
      voronoi(8 + high * 20, 0.2 + level * 0.7, 0.1 + mid * 0.5)
        .thresh(0.7 - bass * 0.25)
        .color(...white(level)),
      0.04 + high * 0.16
    )
    .contrast(1.85 + level * 3.2)
    .saturate(1.45 + high * 1.8)
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
  const closing = () => 0.74 + Math.sin(time * (0.06 + level * 0.12)) * (0.05 + bass * 0.05);
  const fadePulse = () => 0.04 + ((Math.sin(time * 0.05) + 1) * 0.5) * 0.1;

  shape(80, 0.12 + bass * 0.08, 0.3)
    .scale(closing)
    .modulate(noise(0.6 + high * 2.6, 0.02 + mid * 0.08), 0.045 + level * 0.18)
    .diff(
      osc(2.5 + mid * 9, 0.02 + high * 0.12, 0)
        .rotate(() => -time * 0.012)
        .thresh(0.72 - level * 0.2),
      0.1 + high * 0.2
    )
    .add(
      voronoi(1.8 + bass * 4, 0.04 + level * 0.16, 0.16 + mid * 0.22)
        .kaleid(5)
        .color(...white(level)),
      fadePulse
    )
    .color(...red(mid, high))
    .contrast(1.45 + level * 1.15)
    .blend(src(o0).scale(0.997 - bass * 0.004).rotate(-0.001), 0.05 + level * 0.08)
    .out();
}

export default { genesis, apparition, resonance, hypnosis, crossing, farewell };