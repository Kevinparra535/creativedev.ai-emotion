export type LayoutMode = "force3d" | "radial" | "sphericalVA" | "grid";

export interface LayoutConfig {
  mode: LayoutMode;
  clusterStrength?: number;
  linkDistance?: number;
  linkStrength?: number;
  gravity?: number;
}
