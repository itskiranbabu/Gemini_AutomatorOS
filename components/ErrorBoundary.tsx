import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleHome = () => {
      window.location.href = '/';
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-dark-950 flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-slate-900/50 border border-red-900/50 rounded-2xl p-8 max-w-lg w-full shadow-2xl backdrop-blur-xl">
            <div className="w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="text-red-500" size={32} />
            </div>
            
            <h1 className="text-2xl font-bold text-white mb-2">Something went wrong</h1>
            <p className="text-slate-400 mb-6">
              The application encountered an unexpected error. Our team has been notified.
            </p>

            {this.state.error && (
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 mb-6 text-left overflow-auto max-h-40 custom-scrollbar">
                <code className="text-xs font-mono text-red-300 block mb-2">
                  {this.state.error.toString()}
                </code>
                {this.state.errorInfo && (
                    <pre className="text-[10px] font-mono text-slate-500 whitespace-pre-wrap">
                        {this.state.errorInfo.componentStack}
                    </pre>
                )}
              </div>
            )}

            <div className="flex gap-4 justify-center">
              <button 
                onClick={this.handleReload}
                className="flex items-center space-x-2 bg-brand-600 hover:bg-brand-500 text-white px-5 py-2.5 rounded-lg font-medium transition-colors"
              >
                <RefreshCcw size={16} />
                <span>Reload Application</span>
              </button>
               <button 
                onClick={this.handleHome}
                className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-5 py-2.5 rounded-lg font-medium transition-colors border border-slate-700"
              >
                <Home size={16} />
                <span>Go Home</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}