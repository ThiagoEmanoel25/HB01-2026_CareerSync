import { Fragment } from "react";
import { useNavigate } from "react-router-dom";

import { EmptyState } from "../../components/EmptyState";
import { CodeChallengeSkeleton } from "../../components/Skeletons";
import { useAnalysisCodeChallenges, type LeetCodeProblem } from "../../lib/api";
import { useSession } from "../../store/session";

const difficultyClass = (difficulty: "Easy" | "Medium" | "Hard") =>
  difficulty === "Easy"
    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
    : difficulty === "Medium"
      ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
      : "bg-red-500/10 text-red-400 border border-red-500/20";

function ProblemLink({ problem }: { problem: LeetCodeProblem }) {
  return (
    <a
      href={problem.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block h-full p-5 rounded-xl border border-gray-700 bg-[#202020] hover:border-[#3ecf8e] hover:bg-[#2a2a2a] transition-all duration-300 group"
    >
      <div className="flex justify-between items-start mb-3 gap-3">
        <h3 className="font-bold text-white leading-tight flex-1 group-hover:text-[#3ecf8e] transition-colors">
          {problem.title}
        </h3>
        <span
          className={`text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider whitespace-nowrap shrink-0 ${difficultyClass(
            problem.difficulty,
          )}`}
        >
          {problem.difficulty}
        </span>
      </div>
      <div className="flex items-center gap-2 mb-3">
        <span className="inline-block bg-[#171717] border border-gray-700 text-gray-300 text-xs px-2.5 py-1 rounded-md">
          {problem.category}
        </span>
        <span className="text-xs text-gray-500 group-hover:text-[#3ecf8e] transition-colors">
          Abrir no LeetCode ↗
        </span>
      </div>
      {problem.description && (
        <p className="text-sm text-[#9a9a9a] line-clamp-2">
          {problem.description}
        </p>
      )}
    </a>
  );
}

function ReasonCell({ problem }: { problem: LeetCodeProblem }) {
  return (
    <div className="h-full p-5 rounded-xl border border-gray-800 bg-[#171717]">
      <h4 className="text-xs font-bold text-[#3ecf8e] uppercase tracking-wider mb-2">
        Por que esse problema?
      </h4>
      <p className="text-sm text-gray-300 leading-relaxed">{problem.reason}</p>
    </div>
  );
}

export function CodeChallengePage() {
  const navigate = useNavigate();
  const analysisId = useSession((s) => s.analysisId);
  const {
    data: problems,
    isLoading,
    error,
    refetch,
  } = useAnalysisCodeChallenges(analysisId);

  return (
    <div className="w-full max-w-5xl mx-auto pb-12">
      <header className="mb-8 border-b border-gray-800 pb-6">
        <h1 className="text-3xl font-bold text-white">Desafios de Código</h1>
        <p className="text-[#9a9a9a] mt-2">
          Problemas reais do LeetCode escolhidos para os seus gaps, com a
          explicação da IA de por que cada um foi recomendado.
        </p>
      </header>

      {isLoading ? (
        <CodeChallengeSkeleton />
      ) : error instanceof Error ? (
        <EmptyState
          title="Não foi possível carregar os desafios"
          description={error.message}
          ctaLabel="Tentar novamente"
          onCta={() => refetch()}
        />
      ) : !problems || problems.length === 0 ? (
        <EmptyState
          title="Nenhuma recomendação disponível"
          description="Ainda não há desafios recomendados para os seus gaps. Refaça a análise para gerá-los."
          ctaLabel="Voltar para análise"
          onCta={() => navigate(`/analysis/${analysisId}/summary`)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
          <div className="hidden md:block text-xs font-semibold text-gray-500 uppercase tracking-wider pb-1">
            Problema
          </div>
          <div className="hidden md:block text-xs font-semibold text-gray-500 uppercase tracking-wider pb-1">
            Explicação
          </div>
          {problems.map((problem) => (
            <Fragment key={problem.slug}>
              <ProblemLink problem={problem} />
              <ReasonCell problem={problem} />
            </Fragment>
          ))}
        </div>
      )}
    </div>
  );
}
