import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

export type PlanetTextureSet = {
  map?: THREE.Texture;
  normalMap?: THREE.Texture;
  roughnessMap?: THREE.Texture;
  aoMap?: THREE.Texture;
  displacementMap?: THREE.Texture;
  metalnessMap?: THREE.Texture;
};

export function usePlanetTexturePack(pack: string): PlanetTextureSet {
  const base = `/textures/planets/${pack}`;
  const paths = {
    map: `${base}/ravine-rock1_albedo.png`,
    normalMap: `${base}/ravine-rock1_normal-ogl.png`,
    roughnessMap: `${base}/ravine-rock1_roughness.png`,
    aoMap: `${base}/ravine-rock1_ao.png`,
    displacementMap: `${base}/ravine-rock1_height.png`,
    metalnessMap: `${base}/ravine-rock1_metallic.png`
  } as const;

  const tex = useTexture(paths) as PlanetTextureSet;

  // color space and sampling
  if (tex.map) tex.map.colorSpace = THREE.SRGBColorSpace;
  const all = [tex.map, tex.normalMap, tex.roughnessMap, tex.aoMap, tex.displacementMap, tex.metalnessMap];
  for (const t of all) {
    if (!t) continue;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.minFilter = THREE.LinearMipmapLinearFilter;
    t.generateMipmaps = true;
  }

  return tex;
}
