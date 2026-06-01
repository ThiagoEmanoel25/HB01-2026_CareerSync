import { HelmetProvider } from "react-helmet-async";
import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import toast, { Toaster } from "react-hot-toast";
import "react-loading-skeleton/dist/skeleton.css";

import "./index.css";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { AppRouter } from "./router";

/** Extrai a mensagem do servidor quando houver, com fallback genérico. */
function toErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return "Algo deu errado. Tente novamente em instantes.";
}

// Notificação global de erros de API. O retry (1x) vive no apiRequest (lib/api.ts),
// então aqui mantemos retry: false para não duplicar tentativas.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
  queryCache: new QueryCache({
    onError: (error) => toast.error(toErrorMessage(error)),
  }),
  mutationCache: new MutationCache({
    onError: (error) => toast.error(toErrorMessage(error)),
  }),
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <HelmetProvider>
          <AppRouter />
        </HelmetProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#202020",
              color: "#fff",
              border: "1px solid #374151",
            },
            error: { iconTheme: { primary: "#ef4444", secondary: "#202020" } },
          }}
        />
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>
);
