import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { RoadmapDaysView } from "../../components/RoadmapDaysView";
import { RoadmapProgressBar } from "../../components/RoadmapProgressBar";
import { useAnalysisRoadmap } from "../../lib/api";
import {
  countCompletedDays,
  groupByDay,
  TOTAL_DAYS,
} from "../../lib/roadmap";
import { useProgress } from "../../store/progress";
import { useSession } from "../../store/session";

const CHALLENGE_CTA_THRESHOLD = 5;

export function RoadmapPage() {
  const navigate = useNavigate();
  const sessionId = useSession((s) => s.sessionId);
  const analysisId = useSession((s) => s.analysisId);
  const roadmap = useSession((s) => s.roadmap);
  const setRoadmap = useSession((s) => s.setRoadmap);

  const bySession = useProgress((s) => s.bySession);
  const toggleTask = useProgress((s) => s.toggleTask);

  const isDone = useMemo(() => {
    const sessionMap = bySession[sessionId] ?? {};
    return (taskKey: string) => !!sessionMap[taskKey];
  }, [bySession, sessionId]);

  const {
    data: fetchedRoadmap,
    isLoading: isFetching,
    error: fetchError,
    refetch,
  } = useAnalysisRoadmap(analysisId);

  useEffect(() => {
    if (fetchedRoadmap && fetchedRoadmap.length > 0) {
      setRoadmap(fetchedRoadmap);
    }
  }, [fetchedRoadmap, setRoadmap]);

  const tasksByDay = useMemo(() => groupByDay(roadmap), [roadmap]);
  const completedDays = useMemo(
    () => countCompletedDays(tasksByDay, isDone),
    [tasksByDay, isDone],
  );

  function handleToggle(taskKey: string) {
    toggleTask(sessionId, taskKey);
  }

  function handleViewContext(gapId: string) {
    navigate(`/context/${encodeURIComponent(gapId)}`);
  }

  const isLoading = isFetching && roadmap.length === 0;
  const showError = !isLoading && roadmap.length === 0 && !!fetchError && !!analysisId;
  const showEmpty = !analysisId;

  const showChallengeCta = completedDays >= CHALLENGE_CTA_THRESHOLD;
  const isFullyComplete = completedDays === TOTAL_DAYS;

  return (
    <div className="w-full max-w-3xl mx-auto pb-12">
      <header className="mb-8 border-b border-gray-800 pb-6">
        <h1 className="text-3xl font-bold text-white">
          Seu Roadmap de Estudo
        </h1>
        <p className="text-[#9a9a9a] mt-2 text-sm md:text-base">
          Um plano de 7 dias para fechar seus gaps até a entrevista.
        </p>
      </header>

      {isLoading && (
        <div className="bg-[#202020] rounded-xl border border-gray-700 p-8 text-center">
          <p className="text-gray-400">Gerando seu roadmap...</p>
        </div>
      )}

      {showError && (
        <div className="bg-red-500/10 rounded-xl border border-red-500/20 p-6 flex flex-col gap-3">
          <p className="text-red-400 text-sm">
            {(fetchError as Error).message}
          </p>
          <button
            onClick={() => refetch()}
            className="self-start bg-[#3ecf8e] text-[#171717] text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#3ecf8e]/90 transition"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {showEmpty && (
        <div className="bg-[#202020] rounded-xl border border-gray-700 p-6 flex flex-col gap-3">
          <p className="text-gray-300 text-sm">
            Você ainda não tem uma análise. Faça uma nova análise primeiro.
          </p>
          <button
            onClick={() => navigate("/new")}
            className="self-start bg-[#3ecf8e] text-[#171717] text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#3ecf8e]/90 transition"
          >
            Nova análise
          </button>
        </div>
      )}

      {!isLoading && roadmap.length > 0 && (
        <div className="flex flex-col gap-4">
          <RoadmapProgressBar
            completedDays={completedDays}
            totalDays={TOTAL_DAYS}
          />

          <RoadmapDaysView
            tasksByDay={tasksByDay}
            isDone={isDone}
            onToggle={handleToggle}
            onViewContext={handleViewContext}
          />

          {showChallengeCta && (
            <button
              onClick={() => navigate("/code-challenge")}
              className="bg-[#3ecf8e] text-[#171717] font-semibold py-3 rounded-xl hover:bg-[#3ecf8e]/90 transition mt-2"
            >
              {isFullyComplete
                ? "Você concluiu! Próximo: Desafios Técnicos →"
                : "Pronto para os Desafios Técnicos? →"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
