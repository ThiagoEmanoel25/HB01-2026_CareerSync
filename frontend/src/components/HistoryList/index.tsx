import { MoreVertical } from "lucide-react";
import { NavLink } from "react-router-dom";

import { useAnalysisList } from "../../lib/api";
import { useSession } from "../../store/session";

interface HistoryListProps {
  onClose: () => void;
}

export function HistoryList({ onClose }: HistoryListProps) {
  const { data: analyses, isLoading } = useAnalysisList();
  const currentAnalysisId = useSession((s) => s.analysisId);

  if (isLoading) {
    return <p className="px-2 text-xs text-gray-600 italic">Carregando...</p>;
  }

  if (!analyses || analyses.length === 0) {
    return (
      <p className="px-2 text-xs text-gray-600 italic">
        Nenhuma análise recente
      </p>
    );
  }

  return (
    <>
      {analyses.map((a) => {
        const isActive = a.analysis_id === currentAnalysisId;
        return (
          <div
            key={a.analysis_id}
            className={`group flex items-center gap-1.5 rounded-lg pr-1 transition-colors ${
              isActive ? "bg-[#3ecf8e]/10" : "hover:bg-white/5"
            }`}
          >
            <button
              type="button"
              aria-label="Ações rápidas"
              className="shrink-0 flex items-center justify-center w-7 h-7 rounded-md text-[#3ecf8e]/70 hover:text-[#3ecf8e] hover:bg-[#3ecf8e]/10 transition-colors"
            >
              <MoreVertical size={16} strokeWidth={2.5} />
            </button>
            <NavLink
              to={`/analysis/${a.analysis_id}/summary`}
              onClick={onClose}
              className={`min-w-0 flex-1 truncate py-1.5 pr-1 text-sm select-none transition-colors ${
                isActive
                  ? "text-[#3ecf8e]"
                  : "text-gray-300 group-hover:text-[#3ecf8e]"
              }`}
            >
              {a.job_title}
            </NavLink>
          </div>
        );
      })}
    </>
  );
}
