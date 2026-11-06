import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[220px] p-6 flex flex-col items-center justify-center text-center bg-white rounded-2xl border border-rose-200 shadow-sm max-w-lg mx-auto my-6">
          <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 mb-3">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">
            {this.props.fallbackTitle || 'Unable to render this section'}
          </h3>
          <p className="text-xs text-slate-600 max-w-sm mb-4">
            {this.state.error?.message || 'An unexpected rendering error occurred. You can retry or refresh the application.'}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={this.handleReset}
              className="px-3.5 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              Dismiss
            </button>
            <button
              type="button"
              onClick={this.handleReload}
              className="px-4 py-2 text-xs font-bold bg-teal-700 hover:bg-teal-800 text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh App</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
