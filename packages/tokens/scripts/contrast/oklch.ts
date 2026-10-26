export type Oklch = { l: number; c: number; h: number };
export type Rgb = { r: number; g: number; b: number };

const OKLCH_PATTERN = /^oklch\(\s*(\S+)\s+(\S+)\s+(\S+)\s*\)$/;

function parseNumber(raw: string, source: string): number {
  const value = Number(raw);
  if (raw === "" || Number.isNaN(value)) {
    throw new Error(
      `Unsupported OKLCH component "${raw}" in "${source}" (plain numbers only)`,
    );
  }
  return value;
}

/** Parses `oklch(L C H)` with plain numbers. Alpha, percentages and units are rejected. */
export function parseOklch(source: string): Oklch {
  const match = OKLCH_PATTERN.exec(source.trim());
  if (match === null)
    throw new Error(`Not an oklch() color without alpha: "${source}"`);
  const [, l, c, h] = match;
  return {
    l: parseNumber(l ?? "", source),
    c: parseNumber(c ?? "", source),
    h: parseNumber(h ?? "", source),
  };
}

/** OKLCH to linear-light sRGB, unclamped (a channel outside 0..1 means out of gamut). */
export function oklchToLinearSrgb({ l, c, h }: Oklch): Rgb {
  const hue = (h * Math.PI) / 180;
  const a = c * Math.cos(hue);
  const b = c * Math.sin(hue);

  const lCubed = (l + 0.3963377773761749 * a + 0.2158037573099136 * b) ** 3;
  const mCubed = (l - 0.1055613458156586 * a - 0.0638541728258133 * b) ** 3;
  const sCubed = (l - 0.0894841775298119 * a - 1.2914855480194092 * b) ** 3;

  return {
    r: 4.0767416621 * lCubed - 3.3077115913 * mCubed + 0.2309699292 * sCubed,
    g: -1.2684380046 * lCubed + 2.6097574011 * mCubed - 0.3413193965 * sCubed,
    b: -0.0041960863 * lCubed - 0.7034186147 * mCubed + 1.707614701 * sCubed,
  };
}

/** Tolerance for floating point error in the matrices; real gamut excursions are far larger. */
const GAMUT_EPSILON = 1e-4;

export function isInSrgbGamut(linear: Rgb): boolean {
  return [linear.r, linear.g, linear.b].every(
    (channel) => channel >= -GAMUT_EPSILON && channel <= 1 + GAMUT_EPSILON,
  );
}

function encode(linear: number): number {
  const clamped = Math.min(1, Math.max(0, linear));
  const encoded =
    clamped <= 0.0031308
      ? 12.92 * clamped
      : 1.055 * clamped ** (1 / 2.4) - 0.055;
  return Math.round(encoded * 255);
}

/** The 8-bit sRGB color a browser paints for this value (clipped to the gamut). */
export function linearSrgbToRgb8(linear: Rgb): Rgb {
  return { r: encode(linear.r), g: encode(linear.g), b: encode(linear.b) };
}
