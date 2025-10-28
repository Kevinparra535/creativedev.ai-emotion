import { useEffect,useRef } from 'react';
import { CameraControls } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

import { useUIStore } from '@/stores/uiStore';

const CameraRig = () => {
  const controlsRef = useRef<any>(null);
  const focus = useUIStore((s) => s.cameraFocus);
  const clear = useUIStore((s) => s.clearFocus);

  // Render controls
  // Note: we render CameraControls and react to store to drive setLookAt
  useFrame(() => {
    // noop, ensure hook keeps running
  });

  // Respond to focus requests
  useEffect(() => {
    if (!focus || !controlsRef.current) return;
    const ctrls = controlsRef.current as import('@react-three/drei').CameraControls;
    const [tx, ty, tz] = focus.target;
    const dist = typeof focus.distance === 'number' ? Math.max(2, focus.distance) : 12;
    // Position the camera on the +Z axis looking at target
    const px = tx;
    const py = ty;
    const pz = tz + dist;
    // Smooth move
    ctrls.setLookAt(px, py, pz, tx, ty, tz, true);
    // optional: damp more strongly
    // ctrls.smoothTime = 0.8;
    clear();
  }, [focus, clear]);

  return <CameraControls ref={controlsRef as any} maxDistance={100} />;
};

export default CameraRig;
