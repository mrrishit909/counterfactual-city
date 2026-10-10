import type { PanelFixture } from "./types";

/** Loads the panel fixture relative to the page's own base path (matches CASCADIA's own fix for
 * base-path-unaware fetches: never a hardcoded absolute path). */
export async function loadPanel(): Promise<PanelFixture> {
  const res = await fetch(new URL("data/panel.json", `${location.origin}${import.meta.env.BASE_URL}`));
  if (!res.ok) {
    throw new Error(`failed to load panel fixture: ${res.status}`);
  }
  return (await res.json()) as PanelFixture;
}
