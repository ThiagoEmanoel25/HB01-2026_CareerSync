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
          <NavLink
            key={a.analysis_id}
            to={`/analysis/${a.analysis_id}/summary`}
            onClick={onClose}
            className={`flex-1 truncate py-1 px-2 block text-sm select-none rounded-lg transition-colors ${
              isActive
                ? "bg-[#3ecf8e]/10 text-[#3ecf8e]"
                : "text-gray-300 hover:text-[#3ecf8e] hover:bg-white/5"
            }`}
          >
            {a.job_title}
          </NavLink>
        );
      })}
    </>
  );
}
