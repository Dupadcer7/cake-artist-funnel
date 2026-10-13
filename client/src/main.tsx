import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Component, StrictMode, type ErrorInfo, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./theme.css";

const rootEl = document.querySelector<HTMLElement>("[data-generated-space-root]");
if (!rootEl) {
  throw new Error("missing generated space root element");
}

type AppErrorBoundaryProps = { children: ReactNode };
type AppErrorBoundaryState = { failed: boolean };

class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  override state: AppErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { failed: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("No se pudo mostrar la conversación", error, info.componentStack);
  }

  override render() {
    if (this.state.failed) {
      return <main className="loading-screen" role="alert">
        <div className="loading-mark" aria-hidden="true">V</div>
        <p>No pudimos mostrar la conversación.</p>
        <button type="button" onClick={() => window.location.reload()}>Volver a intentar</button>
      </main>;
    }
    return this.props.children;
  }
}

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1 } } });

createRoot(rootEl).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <div className="hatch-space-root" data-hatch-space-root>
        <AppErrorBoundary>
          <App />
        </AppErrorBoundary>
      </div>
    </QueryClientProvider>
  </StrictMode>,
);
