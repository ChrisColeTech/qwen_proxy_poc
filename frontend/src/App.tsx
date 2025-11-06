import { useDarkMode } from '@/hooks/useDarkMode';
import { AppLayout } from '@/components/layout/AppLayout';
import { HomePage } from '@/pages/HomePage';

function App() {
  useDarkMode();

  return (
    <AppLayout>
      <HomePage />
    </AppLayout>
  );
}

export default App;
