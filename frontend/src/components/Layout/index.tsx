import {
  Code,
  Lightbulb,
  Map,
  Mic,
  SquarePen,
  MoreVertical,
} from "lucide-react";
import { useState } from "react";
import type { ReactNode } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useSession } from "../../store/session";

interface NavigationItem {
  label: string;
  to: string;
  icon: ReactNode;
}

const NAVIGATION_ICONS_SIZE = {
  size: 18,
  strokeWidth: 2,
};

const NAVIGATION_ITEMS: NavigationItem[] = [
  {
    label: "Nova análise",
    to: "/upload",
    icon: <SquarePen {...NAVIGATION_ICONS_SIZE} />,
  },
  {
    label: "Roadmap",
    to: "/roadmap",
    icon: <Map {...NAVIGATION_ICONS_SIZE} />,
  },
  {
    label: "LeetCode",
    to: "/leetcode",
    icon: <Code {...NAVIGATION_ICONS_SIZE} />,
  },
  {
    label: "Pitch",
    to: "/pitch",
    icon: <Lightbulb {...NAVIGATION_ICONS_SIZE} />,
  },
  {
    label: "Interview",
    to: "/interview",
    icon: <Mic {...NAVIGATION_ICONS_SIZE} />,
  },
];

export function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const resetSession = useSession((s) => s.reset);
  const history = useSession((s) => s.history) || [];
  const loadSession = useSession((s) => s.loadSession);

  const baseLinkStyle =
    "flex items-center text-sm font-medium transition-all duration-200 py-2.5 rounded-lg";
  const activeLinkStyle = "bg-[#3ecf8e]/10 text-[#3ecf8e]";
  const inactiveLinkStyle =
    "text-[#ffffff] hover:text-[#3ecf8e] hover:bg-white/5";

  return (
    <div className="min-h-screen flex bg-[#171717] text-[#ffffff] relative overflow-hidden">
      <button
        onClick={() => setIsSidebarOpen(true)}
        className="md:hidden fixed top-4 left-4 z-40 w-12 h-12 bg-[#202020] text-[#3ecf8e] rounded-full flex items-center justify-center shadow-lg border border-gray-700 hover:bg-gray-800 transition-colors"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="w-6 h-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>

      {isSidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 bg-[#171717]/70 border-r border-gray-700 flex flex-col gap-6 shrink-0 transition-all duration-300 ease-in-out
          md:fixed md:translate-x-0 
          ${isSidebarOpen ? "translate-x-0 shadow-2xl w-full" : "-translate-x-full w-64"}
          ${isDesktopCollapsed ? "md:w-20" : "md:w-64"}
        `}
      >
        <div
          className={`flex items-center h-16 px-5 ${isDesktopCollapsed ? "justify-center" : "justify-between"}`}
        >
          <div
            className={`flex items-center overflow-hidden transition-all duration-300 ${isDesktopCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"}`}
          >
            <h1 className="text-xl font-bold text-[#3ecf8e] whitespace-nowrap">
              Prep AI
            </h1>
          </div>

          <button
            onClick={() => setIsDesktopCollapsed(!isDesktopCollapsed)}
            className="hidden md:flex text-gray-400 hover:text-white transition-colors p-1.5 rounded-md hover:bg-white/10"
            title={isDesktopCollapsed ? "Expandir menu" : "Recolher menu"}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12"
              />
            </svg>
          </button>

          <button
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden text-gray-400 hover:text-white transition-colors p-1"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <nav className="flex flex-col gap-1 px-3">
          {NAVIGATION_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => {
                setIsSidebarOpen(false);
                if (item.to === "/upload") {
                  resetSession();
                }
              }}
              title={isDesktopCollapsed ? item.label : undefined}
              className={({ isActive }) =>
                `${baseLinkStyle} ${isActive ? activeLinkStyle : inactiveLinkStyle} ${isDesktopCollapsed ? "justify-center px-0" : "px-3"}`
              }
            >
              <span className="shrink-0">{item.icon}</span>
              <span
                className={`ml-3 whitespace-nowrap transition-all duration-300 overflow-hidden ${isDesktopCollapsed ? "w-0 ml-0 opacity-0" : "w-auto opacity-100"}`}
              >
                {item.label}
              </span>
            </NavLink>
          ))}
        </nav>

        <div
          className={`px-2 transition-opacity duration-300 ${isDesktopCollapsed ? "opacity-0 pointer-events-none hidden" : "opacity-100 block"}`}
        >
          <h2 className="text-xs px-2 font-semibold text-[#9a9a9a] uppercase tracking-wider">
            Histórico
          </h2>
          <div className="flex flex-col gap-2 mt-3 max-h-[250px] overflow-y-auto pr-1">
            {history.length > 0 ? (
              history.map((s) => (
                <div
                  key={s.sessionId}
                  className="flex items-center gap-1 w-full group relative rounded-lg hover:bg-white/5 transition-colors"
                >
                  <div className="relative z-10 pl-1 flex items-center justify-center">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setOpenMenuId(
                          openMenuId === s.sessionId ? null : s.sessionId,
                        );
                      }}
                      className="text-[#3ecf8e] hover:text-white rounded transition-colors"
                    >
                      <MoreVertical size={14} />
                    </button>

                    {openMenuId === s.sessionId && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setOpenMenuId(null)}
                        />

                        <div className="absolute left-5 bg-[#202020] border border-gray-600 rounded-lg shadow-2xl z-20 min-w-[75px] animate-in fade-in zoom-in-95 duration-150">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();

                              useSession.setState((state) => ({
                                history: state.history.filter(
                                  (item) => item.sessionId !== s.sessionId,
                                ),
                              }));

                              setOpenMenuId(null);
                            }}
                            className="w-full px-2 py-1 text-xs text-red-400 hover:bg-red-500/10 rounded transition-colors font-medium"
                          >
                            Excluir
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  <NavLink
                    to={`/analysis`}
                    onClick={() => {
                      setIsSidebarOpen(false);
                      loadSession(s.sessionId);
                    }}
                    className="text-gray-300 hover:text-[#3ecf8e] flex-1 truncate py-1 block text-sm select-none transition-colors"
                  >
                    {s.jobTitle}
                  </NavLink>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-600 italic">
                Nenhuma análise recente
              </p>
            )}
          </div>
        </div>

        <div
          className={`mt-auto text-xs text-[#9a9a9a] px-5 pb-6 transition-all duration-300 ${isDesktopCollapsed ? "text-center px-0" : ""}`}
        >
          {isDesktopCollapsed ? "©" : "© Prep AI"}
        </div>
      </aside>

      <main
        className={`flex-1 h-screen overflow-y-auto relative p-6 pt-24 md:p-10 md:pt-10 transition-all duration-300 ${
          isDesktopCollapsed ? "md:ml-20" : "md:ml-64"
        }`}
      >
        <Outlet />
      </main>
    </div>
  );
}
