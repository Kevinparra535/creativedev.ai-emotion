import { useThree } from '@react-three/fiber';
import { button, useControls } from 'leva';

function dataURLToBlob(dataURL: string): Blob {
  const parts = dataURL.split(',');
  const mime = parts[0].match(/:(.*?);/)?.[1] ?? 'image/png';
  const bstr = atob(parts[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) u8arr[n] = bstr.charCodeAt(n);
  return new Blob([u8arr], { type: mime });
}

export function useCaptureLeva() {
  const { gl, scene, camera } = useThree();

  const capture = (mode: 'download' | 'tab' | 'clipboard' = 'download') => {
    // Ensure one fresh render before capture
    gl.render(scene, camera);
    const dataURL = gl.domElement.toDataURL('image/png');

    if (mode === 'download') {
      const a = document.createElement('a');
      a.href = dataURL;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      a.download = `emotion-${timestamp}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } else if (mode === 'tab') {
      const w = window.open();
      if (w) {
        // Use an <img> to display; avoids about:blank data URL security issues on some browsers
        w.document.write(`<style>body{margin:0;background:#000;display:grid;place-items:center}</style>`);
        w.document.write(`<img src="${dataURL}" style="max-width:100vw;max-height:100vh;"/>`);
      }
    } else if (mode === 'clipboard') {
      // Clipboard API requires secure context (https)
      const blob = dataURLToBlob(dataURL);
      if ((navigator as any).clipboard?.write) {
        const item = new (window as any).ClipboardItem({ 'image/png': blob });
        (navigator as any).clipboard.write([item]).catch(() => {
          // fallback: open new tab
          const w = window.open(dataURL, '_blank');
          w?.focus();
        });
      } else {
        const w = window.open(dataURL, '_blank');
        w?.focus();
      }
    }
  };

  useControls('Visuals / Capture', {
    'Save PNG': button(() => capture('download')),
    'Open in Tab': button(() => capture('tab')),
    'Copy to Clipboard': button(() => capture('clipboard'))
  });
}

export default useCaptureLeva;
