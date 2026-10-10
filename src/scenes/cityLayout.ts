// Pure geometry: computes a deterministic grid layout for the 24 zones in the synthetic panel
// (analysis/data/synthetic_panel.py, N_ZONES = 24). Kept separate from rendering so the layout math
// is independently testable without a DOM.
export interface ZoneBlock {
  zone: number;
  x: number;
  y: number;
  width: number;
  height: number;
  cx: number;
  cy: number;
}

export const GRID_COLS = 6;
export const GRID_ROWS = 4;
export const BLOCK_SIZE = 64;
export const BLOCK_GAP = 36;
export const VIEWBOX_WIDTH = GRID_COLS * (BLOCK_SIZE + BLOCK_GAP) + BLOCK_GAP;
export const VIEWBOX_HEIGHT = GRID_ROWS * (BLOCK_SIZE + BLOCK_GAP) + BLOCK_GAP;

export function computeCityLayout(nZones: number): ZoneBlock[] {
  const blocks: ZoneBlock[] = [];
  for (let z = 0; z < nZones; z++) {
    const col = z % GRID_COLS;
    const row = Math.floor(z / GRID_COLS);
    const x = BLOCK_GAP + col * (BLOCK_SIZE + BLOCK_GAP);
    const y = BLOCK_GAP + row * (BLOCK_SIZE + BLOCK_GAP);
    blocks.push({
      zone: z,
      x,
      y,
      width: BLOCK_SIZE,
      height: BLOCK_SIZE,
      cx: x + BLOCK_SIZE / 2,
      cy: y + BLOCK_SIZE / 2,
    });
  }
  return blocks;
}

/** Road segments: a horizontal line through the center of each row, a vertical line through the
 * center of each column, the simple "street grid" the dossier's opening storyboard calls for
 * ("0-3 street plan unfolds"). */
export function computeRoadSegments(nZones: number): { x1: number; y1: number; x2: number; y2: number }[] {
  const rows = Math.ceil(nZones / GRID_COLS);
  const segments: { x1: number; y1: number; x2: number; y2: number }[] = [];
  for (let row = 0; row < rows; row++) {
    const y = BLOCK_GAP + row * (BLOCK_SIZE + BLOCK_GAP) + BLOCK_SIZE / 2;
    segments.push({ x1: 0, y1: y, x2: VIEWBOX_WIDTH, y2: y });
  }
  for (let col = 0; col < GRID_COLS; col++) {
    const x = BLOCK_GAP + col * (BLOCK_SIZE + BLOCK_GAP) + BLOCK_SIZE / 2;
    segments.push({ x1: x, y1: 0, x2: x, y2: VIEWBOX_HEIGHT });
  }
  return segments;
}
