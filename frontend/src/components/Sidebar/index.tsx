import {
  X,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { HistoryList } from "../HistoryList";
import { NavigationMenu } from "../NavigationMenu";

interface SidebarProps {
  isOpen: boolean;
  isCollapsed: boolean;
  onClose: () => void;
  onToggleCollapse: () => void;
}

export function Sidebar({ isOpen, isCollapsed, onClose, onToggleCollapse }: SidebarProps) {
  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 bg-[#171717]/70 border-r border-gray-700 flex flex-col gap-6 shrink-0 transition-all duration-300 ease-in-out
        md:fixed md:translate-x-0 
        ${isOpen ? "translate-x-0 shadow-2xl w-full" : "-translate-x-full w-64"}
        ${isCollapsed ? "md:w-20" : "md:w-72"}
      `}
    >
      <div
        className={`flex items-start pt-4 h-16 px-5 shrink-0 ${isCollapsed ? "justify-center" : "justify-between"}`}
      >
        <div
          className={`transition-all duration-300 ${isCollapsed ? "hidden" : "w-auto opacity-100"}`}
        >
          <h1 className="text-xl font-bold text-[#3ecf8e] whitespace-nowrap">
            CareerSync
          </h1>
          <span className="text-sm text-gray-400 whitespace-nowrap">
            Sincronizando você e sua vaga!
          </span>
        </div>

        <button
          onClick={onToggleCollapse}
          className="hidden md:flex text-gray-400 hover:text-white transition-colors p-1.5 rounded-md hover:bg-white/10 shrink-0"
          title={isCollapsed ? "Expandir menu" : "Recolher menu"}
        >
          {isCollapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
        </button>

        <button
          onClick={onClose}
          className="md:hidden text-gray-400 hover:text-white transition-colors p-1 shrink-0"
        >
          <X />
        </button>
      </div>

      <div className="shrink-0">
        <NavigationMenu isCollapsed={isCollapsed} onClose={onClose} />
      </div>

      <div
        className={`px-2 transition-opacity duration-300 flex-1 flex flex-col min-h-0 ${
          isCollapsed
            ? "opacity-0 pointer-events-none hidden"
            : "opacity-100 flex"
        }`}
      >
        <h2 className="text-xs px-2 font-semibold text-[#9a9a9a] uppercase tracking-wider shrink-0">
          Histórico
        </h2>
        <div className="flex flex-col gap-2 mt-3 overflow-y-auto pr-1 flex-1 pb-4 custom-scrollbar">
          <HistoryList onClose={onClose} />
        </div>
      </div>

      <div
        className={`shrink-0 mt-auto text-xs text-[#9a9a9a] px-5 pb-6 transition-all duration-300 ${isCollapsed ? "text-center px-0" : ""}`}
      >
        {isCollapsed ? "©" : "© CareerSync"}
      </div>
    </aside>
  );
}