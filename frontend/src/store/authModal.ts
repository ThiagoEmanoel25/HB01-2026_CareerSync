import { create } from "zustand";

export type AuthModalMode = "login" | "register";

interface AuthModalState {
  open: boolean;
  mode: AuthModalMode;
  /** Abre o modal. Default "register" — é o CTA principal da landing. */
  show: (mode?: AuthModalMode) => void;
  hide: () => void;
}

/**
 * Estado global do modal de autenticação. Pode ser acionado de qualquer
 * componente (botões da landing) ou de fora do React via
 * `useAuthModal.getState().show()` — ex: handler global de 401 e RequireAuth.
 */
export const useAuthModal = create<AuthModalState>((set) => ({
  open: false,
  mode: "register",
  show: (mode = "register") => set({ open: true, mode }),
  hide: () => set({ open: false }),
}));
