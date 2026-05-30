import { useState } from "react";
import {
  useLeetCodeProblems,
  useEvaluateSolution,
  type LeetCodeProblem,
} from "../../lib/api";
import { useSession } from "../../store/session";

const ProblemCard = ({
  problem,
  onSelect,
  isActive,
}: {
  problem: LeetCodeProblem;
  onSelect: () => void;
  isActive: boolean;
}) => (
  <div
    onClick={onSelect}
    className={`p-5 rounded-xl border cursor-pointer transition-all duration-300 ${
      isActive
        ? "border-[#3ecf8e] bg-[#3ecf8e]/10 shadow-[0_0_15px_rgba(62,207,142,0.15)]"
        : "border-gray-700 bg-[#202020] hover:border-gray-500 hover:bg-[#2a2a2a]"
    }`}
  >
    <div className="flex justify-between items-start mb-4 gap-3">
      <h3 className="font-bold text-white leading-tight flex-1">
        {problem.title}
      </h3>
      <span
        className={`text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider whitespace-nowrap shrink-0 ${
          problem.difficulty === "Easy"
            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
            : problem.difficulty === "Medium"
              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
              : "bg-red-500/10 text-red-400 border border-red-500/20"
        }`}
      >
        {problem.difficulty}
      </span>
    </div>
    <div className="flex items-center gap-2 mb-3">
      <span className="inline-block bg-[#171717] border border-gray-700 text-gray-300 text-xs px-2.5 py-1 rounded-md">
        {problem.category}
      </span>
    </div>
    <p className="text-sm text-[#9a9a9a] line-clamp-2">
      <span className="text-[#3ecf8e] mr-1">💡</span> {problem.reason}
    </p>
  </div>
);

export function CodeChallengePage() {
  const { gaps, jobTitle } = useSession();

  const stack = "React, TypeScript";
  const seniority = jobTitle || "Pleno";
  const gapsString = gaps
    .map((g) => (typeof g === "string" ? g : g.skill))
    .join(", ");

  const { data: problems, isLoading: isLoadingProblems } = useLeetCodeProblems(
    stack,
    seniority,
    gapsString,
  );
  const {
    mutate: evaluateSolution,
    data: evaluation,
    isPending: isEvaluating,
  } = useEvaluateSolution();

  const [selectedProblem, setSelectedProblem] =
    useState<LeetCodeProblem | null>(null);
  const [solutionCode, setSolutionCode] = useState("");

  const handleEvaluate = () => {
    if (!selectedProblem || !solutionCode.trim()) return;

    evaluateSolution({
      slug: selectedProblem.slug,
      title: selectedProblem.title,
      description: selectedProblem.category,
      solution: solutionCode,
      language: "typescript",
    });
  };

  return (
    <div className="w-full max-w-7xl mx-auto h-full flex flex-col pb-6">
      <header className="mb-8 border-b border-gray-800 pb-6">
        <h1 className="text-3xl font-bold text-white">Laboratório de Código</h1>
        <p className="text-[#9a9a9a] mt-2">
          Resolva desafios focados nas tecnologias que você precisa aprimorar.
        </p>
      </header>

      <div className="flex flex-col md:flex-row gap-6 flex-1 min-h-[600px]">
        <aside className="w-full md:w-1/3 flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            Desafios Recomendados
          </h2>

          <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
            {isLoadingProblems ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3ecf8e]"></div>
                <p className="text-sm text-gray-500">Buscando desafios...</p>
              </div>
            ) : (
              problems?.map((prob) => (
                <ProblemCard
                  key={prob.slug}
                  problem={prob}
                  isActive={selectedProblem?.slug === prob.slug}
                  onSelect={() => {
                    setSelectedProblem(prob);
                    setSolutionCode("");
                  }}
                />
              ))
            )}

            {!isLoadingProblems && problems?.length === 0 && (
              <p className="text-gray-500 text-sm text-center py-6">
                Nenhum desafio encontrado para este perfil.
              </p>
            )}
          </div>
        </aside>

        {/* Painel Principal: Editor e Feedback */}
        <main className="w-full md:w-2/3 flex flex-col gap-6">
          {!selectedProblem ? (
            <div className="flex-1 flex flex-col items-center justify-center text-[#9a9a9a] bg-[#202020] rounded-2xl border border-gray-800 border-dashed p-8 text-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-12 h-12 mb-4 opacity-50"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5"
                />
              </svg>
              <p>Selecione um desafio na lista ao lado para começar a codar.</p>
            </div>
          ) : (
            <div className="flex flex-col h-full gap-6">
              {/* Área do Editor */}
              <div className="flex-1 bg-[#202020] border border-gray-800 rounded-2xl p-6 flex flex-col shadow-lg">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      {selectedProblem.title}
                    </h2>
                    <p className="text-sm text-[#9a9a9a] mt-1">
                      Escreva sua solução em TypeScript abaixo:
                    </p>
                  </div>
                  <button
                    onClick={handleEvaluate}
                    disabled={isEvaluating || !solutionCode.trim()}
                    className="bg-[#3ecf8e] hover:bg-[#36b37e] disabled:bg-gray-700 disabled:text-gray-500 text-black font-bold py-2.5 px-6 rounded-xl transition-colors shrink-0"
                  >
                    {isEvaluating ? "Avaliando código..." : "Submeter Solução"}
                  </button>
                </div>

                <textarea
                  value={solutionCode}
                  onChange={(e) => setSolutionCode(e.target.value)}
                  placeholder="// Exemplo:\nfunction solve() {\n  // Seu código aqui\n  return true;\n}"
                  className="flex-1 w-full bg-[#0d0d0d] text-[#3ecf8e] font-mono p-5 rounded-xl border border-gray-800 focus:outline-none focus:border-[#3ecf8e] focus:ring-1 focus:ring-[#3ecf8e] resize-none transition-colors"
                  spellCheck={false}
                />
              </div>

              {/* Área de Feedback */}
              {evaluation && (
                <div className="bg-[#202020] border border-gray-800 rounded-2xl p-6 shadow-lg animate-fade-in-up">
                  <div className="flex items-center justify-between mb-6 border-b border-gray-800 pb-4">
                    <h3 className="text-lg font-bold text-white">
                      Resultado da Avaliação
                    </h3>
                    <span
                      className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border ${
                        evaluation.correct
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : "bg-red-500/10 text-red-400 border-red-500/20"
                      }`}
                    >
                      {evaluation.correct ? "Aprovado ✓" : "Revisar ✕"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <div className="bg-[#171717] p-4 rounded-xl border border-gray-800">
                      <p className="text-xs text-[#9a9a9a] uppercase tracking-wider mb-1">
                        Complexidade de Tempo
                      </p>
                      <p className="font-mono text-[#3ecf8e] font-medium">
                        {evaluation.time_complexity}
                      </p>
                    </div>
                    <div className="bg-[#171717] p-4 rounded-xl border border-gray-800">
                      <p className="text-xs text-[#9a9a9a] uppercase tracking-wider mb-1">
                        Complexidade de Espaço
                      </p>
                      <p className="font-mono text-[#3ecf8e] font-medium">
                        {evaluation.space_complexity}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {evaluation.improvements.length > 0 && (
                      <div>
                        <h4 className="text-sm font-bold text-amber-400 mb-3 flex items-center gap-2">
                          <span>⚠</span> Pontos de Melhoria
                        </h4>
                        <ul className="list-disc pl-5 text-sm text-gray-300 space-y-2">
                          {evaluation.improvements.map((imp, idx) => (
                            <li key={idx}>{imp}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="bg-[#3ecf8e]/5 border border-[#3ecf8e]/20 p-4 rounded-xl">
                      <h4 className="text-sm font-bold text-[#3ecf8e] mb-2 flex items-center gap-2">
                        <span>💡</span> Dica de Otimização
                      </h4>
                      <p className="text-sm text-gray-300 leading-relaxed">
                        {evaluation.optimal_hint}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
