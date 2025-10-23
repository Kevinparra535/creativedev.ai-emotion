import { useEffect, useMemo } from 'react';

import { useUniverse } from '@/state/universe.store';
import { LayoutEngine } from '@/systems/LayoutEngine';

import GalaxyInstanced from './GalaxyInstanced';
import LinksInstanced from './LinksInstanced';
import HaloCloud from './HaloCloud';

export default function UniverseScene() {
  const { emotions, links, setPositions } = useUniverse();

  // Calcula posiciones
  const positions = useMemo(() => {
    const nodes = LayoutEngine.sphericalVA(emotions, 24);
    const map: Record<string, [number, number, number]> = {};
    nodes.forEach((n) => (map[n.id] = n.position));
    return map;
  }, [emotions]);

  useEffect(() => setPositions(positions), [positions, setPositions]);

  return (
    <>
      <HaloCloud />
      <LinksInstanced />
      <GalaxyInstanced />
    </>
  );
}
