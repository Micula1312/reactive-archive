export default function finale({ level = 0, bass = 0, mid = 0, high = 0 } = {}) {
  const pulse = 0.5 + bass * 2.5;

  shape(4, 0.25 + level * 0.12, 0.015)
    .repeat(3, 3)
    .rotate(() => time * (0.04 + high * 0.08))
    .modulateRotate(osc(7, 0.05, 1.2), 0.15 + mid * 0.5)
    .scale(() => 1 + Math.sin(time * pulse) * 0.08)
    .color(0.6 + high * 0.4, 0.15, 1)
    .add(src(o0).scale(1.01), 0.82)
    .out(o0);
}
