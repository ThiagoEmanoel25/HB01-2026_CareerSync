import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import toast from "react-hot-toast";

import { useLogin, useRegister } from "../../lib/api";
import { useAuthModal, type AuthModalMode } from "../../store/authModal";

const inputClass =
  "w-full bg-[#202020] border border-gray-700 text-gray-50 rounded-lg px-4 py-3 focus:outline-none focus:border-[#3ecf8e] focus:ring-1 focus:ring-[#3ecf8e] transition-all";

export function AuthModal() {
  const open = useAuthModal((s) => s.open);
  const mode = useAuthModal((s) => s.mode);
  const show = useAuthModal((s) => s.show);
  const hide = useAuthModal((s) => s.hide);

  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const emailRef = useRef<HTMLInputElement>(null);

  const { mutate: login, isPending: loggingIn } = useLogin();
  const { mutate: register, isPending: registering } = useRegister();
  const isPending = loggingIn || registering;

  // Abertura via query param (`/?auth=login|register`) — usado no redirect "hard"
  // do handler global de 401, onde o store em memória se perde no reload.
  useEffect(() => {
    const auth = searchParams.get("auth");
    if (auth === "login" || auth === "register") {
      show(auth);
      searchParams.delete("auth");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams, show]);

  // Fecha o modal e limpa o formulário (não vaza credenciais entre sessões).
  const close = useCallback(() => {
    setEmail("");
    setPassword("");
    hide();
  }, [hide]);

  // Fechar com Esc, travar scroll do body e focar o email ao abrir.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    emailRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, close]);

  function switchMode(next: AuthModalMode) {
    show(next);
  }

  function handleSuccess() {
    close();
    navigate("/new");
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const payload = { email: email.trim(), password };
    if (mode === "register") {
      if (password.length < 8) {
        toast.error("A senha deve ter ao menos 8 caracteres.");
        return;
      }
      register(payload, { onSuccess: handleSuccess });
    } else {
      login(payload, { onSuccess: handleSuccess });
    }
  }

  const isRegister = mode === "register";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={close}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={isRegister ? "Criar conta" : "Entrar"}
            className="w-full max-w-sm rounded-2xl border border-gray-700 bg-[#171717] p-6 text-white shadow-2xl"
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.18 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-[#3ecf8e]">CareerSync</h1>
                <p className="mt-1 text-sm text-gray-400">
                  {isRegister
                    ? "Crie sua conta para começar."
                    : "Entre para acessar suas análises."}
                </p>
              </div>
              <button
                type="button"
                aria-label="Fechar"
                onClick={close}
                className="rounded-md p-1 text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            {/* Abas Entrar / Criar conta */}
            <div className="mt-5 grid grid-cols-2 gap-1 rounded-lg bg-[#202020] p-1">
              <button
                type="button"
                onClick={() => switchMode("login")}
                className={`rounded-md py-2 text-sm font-medium transition-colors ${
                  !isRegister
                    ? "bg-[#3ecf8e] text-black"
                    : "text-gray-300 hover:text-white"
                }`}
              >
                Entrar
              </button>
              <button
                type="button"
                onClick={() => switchMode("register")}
                className={`rounded-md py-2 text-sm font-medium transition-colors ${
                  isRegister
                    ? "bg-[#3ecf8e] text-black"
                    : "text-gray-300 hover:text-white"
                }`}
              >
                Criar conta
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-white">
                  Email
                </label>
                <input
                  ref={emailRef}
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="voce@exemplo.com"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-white">
                  Senha
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isRegister ? "Mínimo 8 caracteres" : "••••••••"}
                  className={inputClass}
                />
              </div>

              <button
                type="submit"
                disabled={isPending || !email.trim() || !password}
                className="mt-2 rounded-xl bg-[#3ecf8e] py-3 font-bold text-black transition-all hover:bg-[#36b37e] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isRegister
                  ? registering
                    ? "Criando..."
                    : "Criar conta"
                  : loggingIn
                    ? "Entrando..."
                    : "Entrar"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-400">
              {isRegister ? (
                <>
                  Já tem conta?{" "}
                  <button
                    type="button"
                    onClick={() => switchMode("login")}
                    className="font-medium text-[#3ecf8e] hover:underline"
                  >
                    Entrar
                  </button>
                </>
              ) : (
                <>
                  Não tem conta?{" "}
                  <button
                    type="button"
                    onClick={() => switchMode("register")}
                    className="font-medium text-[#3ecf8e] hover:underline"
                  >
                    Criar conta
                  </button>
                </>
              )}
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
