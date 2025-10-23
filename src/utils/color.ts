export function hexToHsl(hex: string): { h: number; s: number; l: number } | null {
  const parsed = hex.replace('#', '');
  const bigint = Number.parseInt(
    parsed.length === 3 ? parsed.split('').map((c) => c + c).join('') : parsed,
    16
  );
  if (Number.isNaN(bigint)) return null;
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  const r1 = r / 255;
  const g1 = g / 255;
  const b1 = b / 255;
  const max = Math.max(r1, g1, b1);
  const min = Math.min(r1, g1, b1);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r1:
        h = (g1 - b1) / d + (g1 < b1 ? 6 : 1);
        break;
      case g1:
        h = (b1 - r1) / d + 3;
        break;
      case b1:
        h = (r1 - g1) / d + 5;
        break;
    }
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}
