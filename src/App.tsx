import { Leva } from 'leva';

import R3FCanvas from './scene/r3f/R3FCanvas';
import MainScreen from '@/ui/components/MainScreen';
import { GlobalStyles } from '@/ui/styles/base';

function App() {
  return (
    <>
      <GlobalStyles />
      <R3FCanvas />
      <MainScreen />
      <Leva collapsed titleBar={{ title: 'Controls' }} />
    </>
  );
}

export default App;
