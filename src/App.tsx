import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AppRoutes } from '@/routes';
import { useSocket } from '@/hooks/useSocket';

export default function App() {
  // Initialize Socket.IO connection when authenticated
  useSocket();

  return (
    <ErrorBoundary>
      <AppRoutes />
    </ErrorBoundary>
  );
}
