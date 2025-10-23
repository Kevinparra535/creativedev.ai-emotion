import MainScreen from '@/ui/components/MainScreen';
import { GlobalStyles } from '@/ui/styles/base';
import R3FCanvas from './scene/r3f/R3FCanvas';

function App() {
  return (
    <>
      <GlobalStyles />
      <R3FCanvas />
      <MainScreen />
    </>
  );
}

export default App;
