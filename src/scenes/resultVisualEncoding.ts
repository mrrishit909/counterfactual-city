// Maps a REAL analytical result (never a decorative/random value) to the city visualization's
// color/intensity encoding. A negative effect (outcome fell in the treated zone) reads as the
// dossier's accent red; a positive effect reads as the dossier's accent blue; magnitude maps to
// both saturation (via opacity in CityStage) and pulse intensity. Pure function, unit-testable
// without a DOM.
export interface ResultVisualEncoding {
  treatedColor: string;
  pulseIntensity: number; // 0..1, clamped
}

const RED = "#D65343";
const BLUE = "#4B84C5";

export function encodeResult(att: number, scale: number): ResultVisualEncoding {
  const magnitude = scale > 0 ? Math.abs(att) / scale : 0;
  return {
    treatedColor: att < 0 ? RED : BLUE,
    pulseIntensity: Math.min(1, magnitude),
  };
}
