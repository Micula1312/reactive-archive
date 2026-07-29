export default function drift({ level = 0, bass = 0, mid = 0, high = 0 } = {}) {
  const speed = 0.08 + level * 0.35;
  const scale = 5 + bass * 7;
  const rotation = 0.02 + mid * 0.12;

  osc(scale, speed, 0.8 + high * 1.5)
    .rotate(() => time * rotation)
    .modulate(noise(2.5, 0.12), 0.18 + level * 0.3)
    .color(0.2, 0.8, 1)
    .contrast(1.15 + bass * 0.8)
    .out();
}
