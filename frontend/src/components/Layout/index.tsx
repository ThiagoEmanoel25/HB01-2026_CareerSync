import { useState } from "react";
import type { ReactNode } from "react";
import { NavLink, Outlet } from "react-router-dom";

interface NavigationItem {
  label: string;
  to: string;
  icon: ReactNode;
}

const NAVIGATION_ITEMS: NavigationItem[] = [
  { 
    label: "Upload", 
    to: "/upload",
    icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
  },
  { 
    label: "Roadmap", 
    to: "/roadmap",
    icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" /></svg>
  },
  { 
    label: "LeetCode", 
    to: "/leetcode",
    icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" /></svg>
  },
  { 
    label: "Pitch", 
    to: "/pitch",
    icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.82 1.508-2.316a7.5 7.5 0 10-7.516 0c.85.496 1.508 1.333 1.508 2.316V18" /></svg>
  },
  { 
    label: "Interview", 
    to: "/interview",
    icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" /></svg>
  },
];

export function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);

  const baseLinkStyle = "flex items-center text-sm font-medium transition-all duration-200 py-2.5 rounded-lg";
  const activeLinkStyle = "bg-[#3ecf8e]/10 text-[#3ecf8e]";
  const inactiveLinkStyle = "text-[#ffffff] hover:text-[#3ecf8e] hover:bg-white/5";

  const sessions = [
    { id: "s1", description: "Desenvolvedor Frontend - React/TypeScript (vaga remota)" },
    { id: "s2", description: "Engenheiro de Dados - Python, ETL e Big Data (Tempo integral)" },
  ];

  return (
    <div className="min-h-screen flex bg-[#171717] text-[#ffffff] relative overflow-hidden">
      
      <button
        onClick={() => setIsSidebarOpen(true)}
        className="md:hidden fixed top-4 left-4 z-40 w-12 h-12 bg-[#202020] text-[#3ecf8e] rounded-full flex items-center justify-center shadow-lg border border-gray-700 hover:bg-gray-800 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
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
          md:relative md:translate-x-0 
          ${isSidebarOpen ? "translate-x-0 shadow-2xl w-full" : "-translate-x-full w-64"}
          ${isDesktopCollapsed ? "md:w-20" : "md:w-64"}
        `}
      >
        <div className={`flex items-center h-16 px-5 ${isDesktopCollapsed ? "justify-center" : "justify-between"}`}>
          <div className={`flex items-center overflow-hidden transition-all duration-300 ${isDesktopCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"}`}>
            <div>
              <h1 className="text-xl font-bold text-[#3ecf8e] whitespace-nowrap">Prep AI</h1>
            </div>
          </div>
          
          <button
            onClick={() => setIsDesktopCollapsed(!isDesktopCollapsed)}
            className="hidden md:flex text-gray-400 hover:text-white transition-colors p-1.5 rounded-md hover:bg-white/10"
            title={isDesktopCollapsed ? "Expandir menu" : "Recolher menu"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
            </svg>
          </button>

          <button
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden text-gray-400 hover:text-white transition-colors p-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Menu de Navegação */}
        <nav className="flex flex-col gap-1 px-3">
          {NAVIGATION_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setIsSidebarOpen(false)}
              title={isDesktopCollapsed ? item.label : undefined}
              className={({ isActive }) =>
                `${baseLinkStyle} ${isActive ? activeLinkStyle : inactiveLinkStyle} ${isDesktopCollapsed ? "justify-center px-0" : "px-3"}`
              }
            >
              <span className="shrink-0">{item.icon}</span>
              <span className={`ml-3 whitespace-nowrap transition-all duration-300 overflow-hidden ${isDesktopCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"}`}>
                {item.label}
              </span>
            </NavLink>
          ))}
        </nav>

        <div className={`px-5 transition-opacity duration-300 ${isDesktopCollapsed ? "opacity-0 pointer-events-none hidden" : "opacity-100 block"}`}>
          <h2 className="text-xs font-semibold text-[#9a9a9a] uppercase tracking-wider">Histórico</h2>
          <div className="flex flex-col gap-2 mt-3">
            {sessions.map((s) => (
              <NavLink
                key={s.id}
                to={`/upload?session_id=${s.id}`}
                onClick={() => setIsSidebarOpen(false)}
                className="text-gray-400 hover:text-[#3ecf8e] flex items-center gap-2 group"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 shrink-0 group-hover:text-[#3ecf8e] transition-colors">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" />
                </svg>
                <span className="truncate block text-sm">{s.description}</span>
              </NavLink>
            ))}
          </div>
        </div>

        <div className={`mt-auto text-xs text-[#9a9a9a] px-5 pb-6 transition-all duration-300 ${isDesktopCollapsed ? "text-center px-0" : ""}`}>
          {isDesktopCollapsed ? "©" : "© Prep AI"}
        </div>
      </aside>

      {/* Janela de renderização Principal */}
      <main className="flex-1 overflow-y-auto relative p-6 pt-24 md:p-10 md:pt-10 transition-all duration-300">
        <Outlet />
      </main>
    </div>
  );
}