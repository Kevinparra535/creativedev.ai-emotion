import Canvas from '@/ui/components/Canvas';
import { GlobalStyles } from '@/ui/styles/base';
import R3FCanvas from './scene/r3f/R3FCanvas';

function App() {
  return (
    <>
      <GlobalStyles />
      <R3FCanvas />
      <Canvas />
    </>
  );
}

export default App;
