import { Component, type ErrorInfo, type ReactNode } from 'react';

interface State {
  error: Error | null;
}

/** Fängt unerwartete Renderfehler ab und bietet einen Neustart an, statt eine leere Seite zu zeigen. */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('App error', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    const de = document.documentElement.lang !== 'en';
    return (
      <div className="grid min-h-dvh place-items-center bg-base p-6 text-center text-fg">
        <div className="glass max-w-md rounded-3xl p-8">
          <p className="font-display text-lg font-bold tracking-wider text-accent">ESCOOTER CUSTOMIZER PRO</p>
          <h1 className="mt-3 text-xl font-semibold">{de ? 'Etwas ist schiefgelaufen' : 'Something went wrong'}</h1>
          <p className="mt-2 text-sm text-muted">
            {de
              ? 'Deine gespeicherten Designs bleiben erhalten. Lade die App neu, um fortzufahren.'
              : 'Your saved designs are kept. Reload the app to continue.'}
          </p>
          <pre className="mt-4 max-h-32 overflow-auto rounded-xl bg-base-2 p-3 text-left text-[11px] text-subtle">{this.state.error.message}</pre>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-5 h-11 rounded-xl bg-accent px-6 text-sm font-semibold text-on-accent"
          >
            {de ? 'Neu laden' : 'Reload'}
          </button>
        </div>
      </div>
    );
  }
}
