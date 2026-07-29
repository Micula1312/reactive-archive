export function genesis({ level = 0, bass = 0 } = {}) {
  osc(2 + bass * 2, 0.015 + level * 0.04, 0)
    .thresh(0.82)
    .scale(() => 0.45 + Math.sin(time * 0.35) * 0.08)
    .color(1, 1, 1)
    .contrast(1.4)
    .out();
}

export function apparition({ level = 0, bass = 0, mid = 0 } = {}) {
  shape(2, 0.015 + bass * 0.025, 0.01)
    .add(shape(2, 0.008 + mid * 0.02, 0.02).rotate(() => time * 0.05), 0.75)
    .modulate(noise(1.2, 0.03 + level * 0.06), 0.08)
    .color(1, 0.05, 0.05)
    .blend(src(o0).scale(1.002), 0.08)
    .out();
}

export function resonance({ level = 0, bass = 0, mid = 0, high = 0 } = {}) {
  voronoi(3 + bass * 5, 0.08 + level * 0.15, 0.25)
    .kaleid(3 + Math.floor(mid * 4))
    .modulate(noise(2, 0.05 + high * 0.12), 0.18 + level * 0.28)
    .color(0.05, 0.35 + mid * 0.25, 0.65 + high * 0.3)
    .blend(src(o0).scale(1.003), 0.12)
    .out();
}

export function hypnosis({ level = 0, bass = 0, mid = 0, high = 0 } = {}) {
  src(o0)
    .scale(1.01 + bass * 0.025)
    .rotate(0.002 + mid * 0.018)
    .pixelate(18 + high * 90, 12 + level * 70)
    .modulate(noise(5 + high * 8, 0.25 + level * 0.6), 0.15 + bass * 0.45)
    .add(osc(14 + high * 30, 0.15 + level, 1.4).thresh(0.65), 0.18)
    .contrast(1.35 + level * 1.8)
    .out();
}

export function crossing({ level = 0, bass = 0, mid = 0 } = {}) {
  shape(60, 0.22 + bass * 0.08, 0.3)
    .scale(() => 0.85 + Math.sin(time * (0.12 + level * 0.15)) * 0.08)
    .modulate(noise(0.8, 0.025 + mid * 0.05), 0.05 + level * 0.12)
    .color(0.7, 0.8, 0.85)
    .blend(src(o0).scale(0.997), 0.06)
    .out();
}

export function farewell({ level = 0, bass = 0 } = {}) {
  shape(80, 0.18 + bass * 0.04, 0.45)
    .scale(() => 0.72 + Math.sin(time * 0.08) * 0.05)
    .color(0.45, 0.62, 0.72)
    .brightness(-0.15 + level * 0.08)
    .blend(solid(0, 0, 0), () => Math.min(0.88, time * 0.002))
    .out();
}

export default { genesis, apparition, resonance, hypnosis, crossing, farewell };