import { Component, type ReactNode, type ErrorInfo } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info);
  }

  reset = () => this.setState({ hasError: false, error: null });

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="flex flex-col items-center gap-4 text-center max-w-sm">
            <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center">
              <AlertTriangle className="h-8 w-8 text-rose-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#1A1A1A] mb-1">
                Something went wrong
              </h2>
              <p className="text-sm text-[#888]">
                {this.state.error?.message ?? 'An unexpected error occurred.'}
              </p>
            </div>
            <Button onClick={this.reset} variant="outline">
              Try Again
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
