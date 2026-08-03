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

export function intro({ level = 0, bass = 0, mid = 0, high = 0 } = {}) {
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

export function hypnosis({
  level = 0,
  bass = 0,
  mid = 0,
  high = 0
} = {}) {
  /*
   * HYPNOSIS — WHITE RECTANGLE MULTIPLICATION
   *
   * Un rettangolo bianco nasce al centro.
   * Il feedback lo duplica, lo comprime e lo distribuisce.
   * L'audio aumenta il numero delle copie e la densità dei pixel.
   */

  const pulse = () =>
    1 + Math.sin(time * (0.8 + mid * 4.0)) * (0.01 + bass * 0.06);

  const driftX = () =>
    Math.sin(time * (0.13 + mid * 0.35)) * (0.002 + high * 0.035);

  const driftY = () =>
    Math.cos(time * (0.11 + bass * 0.28)) * (0.002 + mid * 0.025);

  const columns = () =>
    2 + Math.floor(level * 8 + high * 18);

  const rows = () =>
    2 + Math.floor(level * 6 + mid * 14);

  const pixelX = () =>
    18 + Math.floor(level * 100 + high * 260);

  const pixelY = () =>
    12 + Math.floor(level * 80 + bass * 180);

  /*
   * Rettangolo generatore:
   * shape(4) crea la forma quadrangolare;
   * scale la trasforma in un rettangolo orizzontale.
   */
  const rectangle = shape(4, 0.18, 0.001)
    .scale(1, 1.8, 0.42)
    .rotate(Math.PI / 4)
    .color(1, 1, 1)
    .contrast(2.5);

  /*
   * Flash bianco:
   * compare con maggiore intensità sui transienti alti.
   */
  const flash = solid(1, 1, 1)
    .mult(
      osc(
        () => 2 + high * 12,
        () => 0.02 + high * 0.4,
        0
      )
      .thresh(() => 0.93 - high * 0.36)
    )
    .brightness(() => high * 1.8 + bass * 0.45);

  /*
   * Feedback:
   * ogni frame riutilizza quello precedente,
   * moltiplicando progressivamente il rettangolo.
   */
  src(o0)
    .scale(pulse)
    .scrollX(driftX)
    .scrollY(driftY)

    // Duplica l'immagine in griglia.
    .repeat(columns, rows)

    // Alterna e specchia le copie.
    .modulateRepeat(
      osc(
        () => 1 + mid * 5,
        () => 0.015 + level * 0.08,
        0
      ),
      () => 1 + high * 5,
      () => 1 + bass * 4,
      () => high * 0.08,
      () => mid * 0.06
    )

    // Riduce tutto progressivamente a blocchi digitali.
    .pixelate(pixelX, pixelY)

    // Inserisce continuamente il rettangolo originario.
    .add(
      rectangle
        .scale(() => 1 + bass * 0.22)
        .brightness(() => level * 0.25),
      () => 0.22 + level * 0.3
    )

    // Genera una seconda griglia più rapida e instabile.
    .add(
      rectangle
        .repeat(
          () => 3 + Math.floor(high * 24),
          () => 2 + Math.floor(mid * 18)
        )
        .scrollX(() => time * (0.005 + high * 0.06))
        .scrollY(() => -time * (0.003 + mid * 0.035))
        .pixelate(
          () => 12 + high * 160,
          () => 8 + bass * 120
        ),
      () => 0.05 + high * 0.28
    )

    // Flash audioreattivo.
    .add(
      flash,
      () => Math.max(0, high - 0.48) * 1.35
    )

    // Brevi inversioni luminose sui bassi.
    .diff(
      rectangle
        .scale(() => 0.6 + bass * 2.8)
        .repeat(
          () => 1 + Math.floor(bass * 12),
          () => 1 + Math.floor(bass * 9)
        ),
      () => Math.max(0, bass - 0.58) * 0.65
    )

    .contrast(() => 1.4 + level * 2.8 + high * 1.6)
    .saturate(0)
    .brightness(() => -0.08 + bass * 0.12)
    .out(o0);
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

export default { intro, genesis, resonance, hypnosis, crossing, farewell };