import { Menu } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../../store/auth";
import { useAuthModal } from "../../store/authModal";

export default function LandingHeader() {
  const [open, setOpen] = useState(false);
  const token = useAuth((s) => s.token);
  const logout = useAuth((s) => s.logout);
  const show = useAuthModal((s) => s.show);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#171717] backdrop-blur-md border-b border-gray-700">
      <div className="max-w-6xl mx-auto flex items-center justify-between h-16 px-4">
        <div className="flex items-center gap-3">
          <span className="font-bold text-primary-500">CareerSync</span>
        </div>

        <nav className="hidden md:flex gap-6 text-white">
          <a href="#features" className="hover:text-primary-500">
            Funcionalidades
          </a>
          <a href="#how-it-works" className="hover:text-primary-500">
            Como funciona
          </a>
          <a href="#faq" className="hover:text-primary-500">
            FAQ
          </a>
        </nav>

        <div className="hidden md:flex items-center gap-3">
          {token ? (
            <>
              <Link
                to="/new"
                className="bg-primary-500 text-black font-semibold hover:bg-primary-600 px-4 py-2 rounded-md transition-colors"
              >
                Ir para plataforma
              </Link>
              <button
                type="button"
                onClick={logout}
                className="text-white hover:text-primary-500 px-3 py-2 transition-colors"
              >
                Sair
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => show("register")}
              className="bg-primary-500 text-black font-semibold hover:bg-primary-600 px-4 py-2 rounded-md transition-colors"
            >
              Começar agora
            </button>
          )}
        </div>

        <button
          className="md:hidden p-2"
          aria-label="Abrir menu"
          onClick={() => setOpen((v) => !v)}
        >
          <Menu />
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-[#171717] border-t border-neutral-700">
          <div className="flex flex-col p-4 gap-3 text-white">
            <a href="#features" onClick={() => setOpen(false)}>
              Funcionalidades
            </a>
            <a href="#how-it-works" onClick={() => setOpen(false)}>
              Como funciona
            </a>
            <a href="#faq" onClick={() => setOpen(false)}>
              FAQ
            </a>
            {token ? (
              <>
                <Link
                  to="/new"
                  onClick={() => setOpen(false)}
                  className="mt-2 bg-primary-500 text-black font-bold hover:bg-primary-600 px-3 py-2 rounded-md transition-colors text-center"
                >
                  Ir para plataforma
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setOpen(false);
                  }}
                  className="text-left text-white hover:text-primary-500"
                >
                  Sair
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  show("register");
                  setOpen(false);
                }}
                className="mt-2 bg-primary-500 text-black font-bold hover:bg-primary-600 px-3 py-2 rounded-md transition-colors"
              >
                Começar agora
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
