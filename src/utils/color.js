const FORMATS = ['HEX', 'RGB', 'HSL'];

function parseHex(hex) {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return { r, g, b };
}

function toHsl({ r, g, b }) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l: Math.round(l * 100) };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

export function formatColor(hex, format) {
  // Only convert the first 6 hex digits (ignore alpha for RGB/HSL display)
  const baseHex = hex.length > 7 ? hex.slice(0, 7) : hex;
  if (format === 'RGB') {
    const { r, g, b } = parseHex(baseHex);
    return `rgb(${r}, ${g}, ${b})`;
  }
  if (format === 'HSL') {
    const { h, s, l } = toHsl(parseHex(baseHex));
    return `hsl(${h}, ${s}%, ${l}%)`;
  }
  return hex.toUpperCase();
}

export function nextFormat(current) {
  const i = FORMATS.indexOf(current);
  return FORMATS[(i + 1) % FORMATS.length];
}
