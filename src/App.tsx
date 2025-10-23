import Canvas from '@/ui/components/Canvas';
import { GlobalStyles } from '@/ui/styles/base';
import UniverseCanvas from '@/ui/canvas/UniverseCanvas';

function App() {
  return (
    <>
      <GlobalStyles />
  <UniverseCanvas />
      <Canvas />
    </>
  );
}

export default App;
