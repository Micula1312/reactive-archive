export function threshold({ level = 0, bass = 0, mid = 0, high = 0 } = {}) {
  osc(4 + bass * 8, 0.02 + mid * 0.08, 0.8)
    .modulate(noise(1.8 + high * 4, 0.04 + level * 0.12), 0.06 + level * 0.24)
    .contrast(1.2 + bass * 0.6)
    .blend(src(o0).scale(1.002 + bass * 0.01), 0.08 + level * 0.12)
    .out();
}

export function body({ level = 0, bass = 0, mid = 0, high = 0 } = {}) {
  shape(2, 0.11 + bass * 0.14, 0.02)
    .scale(() => 0.72 + Math.sin(time * (0.15 + bass * 0.3)) * (0.06 + level * 0.12), 0.32 + mid * 0.18, 1)
    .modulate(noise(2.6 + high * 3.5, 0.05 + high * 0.12), 0.06 + level * 0.16)
    .add(osc(8 + high * 24, 0.03 + level * 0.16, 1.2).thresh(0.62), 0.08 + mid * 0.12)
    .out();
}

export function spill({ level = 0, bass = 0, mid = 0, high = 0 } = {}) {
  noise(1.6 + mid * 5, 0.04 + high * 0.16)
    .pixelate(18 + bass * 70, 9 + level * 48)
    .scrollX(() => Math.sin(time * 0.11) * (0.02 + high * 0.05))
    .modulate(osc(3 + high * 7, 0.02, 0.6), 0.08 + level * 0.18)
    .out();
}

export function rupture({ level = 0, bass = 0, mid = 0, high = 0 } = {}) {
  src(o0)
    .scale(1.002 + bass * 0.035)
    .rotate(() => Math.sin(time * 0.2) * (0.002 + mid * 0.025))
    .modulate(noise(6 + high * 10, 0.14 + level * 0.08), 0.05 + level * 0.32)
    .add(osc(18 + high * 50, 0.08 + mid * 0.08, 1.2), 0.08 + bass * 0.18)
    .out();
}

export function expansion({ level = 0, bass = 0, mid = 0, high = 0 } = {}) {
  osc(3 + bass * 8, 0.01 + mid * 0.05, 1.5)
    .kaleid(3 + Math.floor(high * 5))
    .modulate(noise(2 + high * 3, 0.04 + level * 0.08), 0.1 + level * 0.25)
    .scale(() => 0.92 + Math.sin(time * 0.09) * (0.04 + bass * 0.08))
    .out();
}

export function afterimage({ level = 0, bass = 0, mid = 0, high = 0 } = {}) {
  src(o0)
    .scale(1.001 + bass * 0.008)
    .brightness(-0.004 - level * 0.018)
    .add(shape(99, 0.08 + mid * 0.06, 0.08), 0.02 + high * 0.04)
    .out();
}

export default { threshold, body, spill, rupture, expansion, afterimage };
