import { useEffect } from "react";
import { Outlet, useNavigate, useParams } from "react-router-dom";

import { EmptyState } from "../EmptyState";
import { useAnalysis, useAnalysisSummary } from "../../lib/api";
import { useSession } from "../../store/session";

/**
 * Porteiro das rotas `/analysis/:analysisId/*`. O id vem da URL (e não mais do
 * Zustand), então abrir uma análise antiga pelo histórico funciona: buscamos
 * detalhe + summary no servidor e hidratamos o `useSession` que as páginas
 * internas consomem. Quando a análise já está carregada no store (logo após
 * criar, ou a simulação dev), renderiza direto sem refazer fetch.
 */
export function AnalysisGate() {
  const { analysisId = "" } = useParams<{ analysisId: string }>();
  const navigate = useNavigate();

  const sessionAnalysisId = useSession((s) => s.analysisId);
  const matchScore = useSession((s) => s.matchScore);
  const setAnalysisId = useSession((s) => s.setAnalysisId);
  const setAnalysis = useSession((s) => s.setAnalysis);
  const setJobTitle = useSession((s) => s.setJobTitle);
  const setJobDescription = useSession((s) => s.setJobDescription);

  const alreadyLoaded = sessionAnalysisId === analysisId && matchScore !== null;
  const fetchId = alreadyLoaded ? "" : analysisId;

  const detail = useAnalysis(fetchId);
  const summary = useAnalysisSummary(fetchId);

  useEffect(() => {
    if (alreadyLoaded) return;
    if (!detail.data || !summary.data) return;
    setAnalysisId(analysisId);
    setAnalysis(summary.data.match_score, summary.data.gaps, summary.data.summary);
    setJobTitle(detail.data.job_title);
    setJobDescription(detail.data.job_description);
  }, [
    alreadyLoaded,
    analysisId,
    detail.data,
    summary.data,
    setAnalysisId,
    setAnalysis,
    setJobTitle,
    setJobDescription,
  ]);

  if (alreadyLoaded) return <Outlet />;

  if (detail.isError || summary.isError) {
    return (
      <EmptyState
        title="Análise não encontrada"
        description="Esta análise não existe ou não pertence à sua conta."
        ctaLabel="Nova análise"
        onCta={() => navigate("/new")}
      />
    );
  }

  if (detail.data && summary.data) return <Outlet />;

  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3ecf8e]" />
      <p className="text-gray-400 text-sm animate-pulse">Carregando análise...</p>
    </div>
  );
}
