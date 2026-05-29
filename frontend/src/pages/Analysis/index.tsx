import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GapCard } from "../../components/GapCard";
import { MatchScore } from "../../components/MatchScore";
import { useSession } from "../../store/session";

export function AnalysisPage() {
  const navigate = useNavigate();
  const matchScore = useSession((s) => s.matchScore);
  const summary = useSession((s) => s.summary);
  const gaps = useSession((s) => s.gaps);
  const jobTitle = useSession((s) => s.jobTitle);
  const jobDescription = useSession((s) => s.jobDescription);
  const resumeUrl = useSession((s) => s.resumeUrl);

  const [expanded, setExpanded] = useState(false);

  if (matchScore === null) return null;

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col items-center">
      <div className="w-full">
        <div className="bg-[#202020] p-4 rounded-2xl self-start w-[80%] max-w-full ml-[20%] mb-6 text-left">
          <p className="text-gray-300 mb-2">
            Este é o meu currículo:{" "}
            {resumeUrl ? (
              <a href={resumeUrl} download className="text-[#3ecf8e] underline">
                Baixar currículo
              </a>
            ) : (
              <span className="text-gray-500">(nenhum currículo)</span>
            )}
          </p>

          <p className="text-gray-300 mb-2">
            {jobTitle ? (
              <>
                Quero me candidatar para a vaga:{" "}
                <span className="font-bold">{jobTitle}</span>
              </>
            ) : (
              <>Quero me candidatar para uma vaga.</>
            )}
          </p>

          <div className="text-gray-300">
            <div className="mb-1">Esta é a descrição da vaga:</div>
            <div>
              {!expanded ? (
                <>
                  {jobDescription && jobDescription.length > 120
                    ? `${jobDescription.slice(0, 120)}...`
                    : jobDescription}
                  {jobDescription && jobDescription.length > 120 && (
                    <button
                      onClick={() => setExpanded(true)}
                      className="ml-2 text-sm text-[#3ecf8e] underline"
                    >
                      mostrar mais
                    </button>
                  )}
                </>
              ) : (
                <>
                  {jobDescription}
                  <button
                    onClick={() => setExpanded(false)}
                    className="ml-2 text-sm text-[#3ecf8e] underline"
                  >
                    mostrar menos
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
        <h1 className="text-2xl text-white mb-2 font-semibold">
          Análise de Aderência
        </h1>
        {jobTitle && (
          <p className="text-gray-400 mb-4">Resultados para: {jobTitle}</p>
        )}

        <div className="mt-8 flex flex-col gap-8 pb-10">
          <div className="pt-8 border-t border-gray-800">
            <MatchScore score={matchScore} summary={summary} />
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-4">
              Gaps identificados
            </h2>
            <div className="flex flex-col gap-4">
              {gaps.map((gap) => (
                <GapCard
                  key={gap.skill}
                  skill={gap.skill}
                  level={gap.level}
                  reason={gap.reason}
                  onViewContext={(skill) =>
                    navigate(`/context/${encodeURIComponent(skill)}`)
                  }
                />
              ))}
            </div>
          </div>

          <button
            onClick={() => navigate("/roadmap")}
            className="bg-[#3ecf8e]/20 text-[#3ecf8e] border border-[#3ecf8e]/50 font-bold py-3 rounded-xl hover:bg-[#3ecf8e]/30 transition-all mt-4"
          >
            Ver Roadmap de Estudo
          </button>
        </div>
      </div>
    </div>
  );
}
