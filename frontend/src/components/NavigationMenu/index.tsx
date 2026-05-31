import {
  Code,
  Lightbulb,
  Map,
  Mic,
  SquarePen,
  ScrollText,
} from "lucide-react";
import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
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
    label: "Resumo da análise",
    to: "/summary",
    icon: <ScrollText {...NAVIGATION_ICONS_SIZE} />,
  },
  {
    label: "Plano de Estudos",
    to: "/roadmap",
    icon: <Map {...NAVIGATION_ICONS_SIZE} />,
  },
  {
    label: "Desafios Técnicos",
    to: "/code-challenge",
    icon: <Code {...NAVIGATION_ICONS_SIZE} />,
  },
  {
    label: "Melhor Pitch",
    to: "/pitch",
    icon: <Lightbulb {...NAVIGATION_ICONS_SIZE} />,
  },
  {
    label: "Simular Entrevista",
    to: "/interview",
    icon: <Mic {...NAVIGATION_ICONS_SIZE} />,
  },
];

interface NavigationMenuProps {
  isCollapsed: boolean;
  onClose: () => void;
}

export function NavigationMenu({ isCollapsed, onClose }: NavigationMenuProps) {
  const resetSession = useSession((s) => s.reset);
  const matchScore = useSession((s) => s.matchScore);
  const hasAnalysis = matchScore !== null;

  const baseLinkStyle =
    "flex items-center text-sm font-medium transition-all duration-200 py-2.5 rounded-lg";
  const activeLinkStyle = "bg-[#3ecf8e]/10 text-[#3ecf8e]";
  const inactiveLinkStyle =
    "text-[#ffffff] hover:text-[#3ecf8e] hover:bg-white/5";

  return (
    <nav className="flex flex-col gap-1 px-3">
      <NavLink
        key={"/new"}
        to={"/new"}
        onClick={() => {
          onClose();
          resetSession();
        }}
        title={isCollapsed ? "Nova análise" : undefined}
        className={({ isActive }) =>
          `${baseLinkStyle} ${isActive ? activeLinkStyle : inactiveLinkStyle} ${isCollapsed ? "justify-center px-0" : "px-3"}`
        }
      >
        <span className="shrink-0">
          <SquarePen {...NAVIGATION_ICONS_SIZE} />
        </span>
        <span
          className={`whitespace-nowrap transition-all duration-300 overflow-hidden ${isCollapsed ? "w-0 opacity-0" : "ml-3 w-auto opacity-100"}`}
        >
          Nova análise
        </span>
      </NavLink>

      <div
        className={`px-2 transition-opacity duration-300 ${
          isCollapsed
            ? "opacity-0 pointer-events-none hidden"
            : "opacity-100 block"
        }`}
      >
        <h2 className="mt-2 mb-1 text-xs font-semibold text-[#9a9a9a] uppercase tracking-wider">
          Sua preparação
        </h2>
      </div>

      {NAVIGATION_ITEMS.map((item) => {
        const isDisabled = !hasAnalysis;

        return (
          <NavLink
            key={item.to}
            to={isDisabled ? "#" : item.to}
            onClick={(e) => {
              if (isDisabled) {
                e.preventDefault();
                return;
              }
              onClose();
            }}
            title={isCollapsed ? item.label : undefined}
            className={({ isActive }) =>
              `${baseLinkStyle} ${
                isDisabled
                  ? "opacity-35 cursor-not-allowed text-gray-500 pointer-events-none select-none"
                  : isActive
                    ? activeLinkStyle
                    : inactiveLinkStyle
              } ${isCollapsed ? "justify-center px-0" : "px-3"}`
            }
          >
            <span className="shrink-0">{item.icon}</span>
            <span
              className={`whitespace-nowrap transition-all duration-300 overflow-hidden ${isCollapsed ? "w-0 opacity-0" : "ml-3 w-auto opacity-100"}`}
            >
              {item.label}
            </span>
          </NavLink>
        );
      })}
    </nav>
  );
}