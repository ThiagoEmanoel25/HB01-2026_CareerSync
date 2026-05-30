import { Users, Code, Target, Lightbulb } from "lucide-react";
import type { ReactNode } from "react";

import { useStrategicQuestions, type StrategicQuestion } from "../../lib/api";
import { useSession } from "../../store/session";

const TYPE_META: Record<
  StrategicQuestion["type"],
  { label: string; icon: ReactNode; accent: string }
> = {
  cultura: {
    label: "Cultura",
    icon: <Users size={18} strokeWidth={2} />,
    accent: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  },
  tecnico: {
    label: "Técnico",
    icon: <Code size={18} strokeWidth={2} />,
    accent: "text-blue-400 bg-blue-500/10 border-blue-500/30",
  },
  desafios: {
    label: "Desafios",
    icon: <Target size={18} strokeWidth={2} />,
    accent: "text-amber-400 bg-amber-500/10 border-amber-500/30",
  },
};

const QuestionCard = ({ item }: { item: StrategicQuestion }) => {
  const meta = TYPE_META[item.type];

  return (
    <div className="bg-[#202020] rounded-2xl shadow-lg border border-gray-700 overflow-hidden hover:border-gray-500 hover:shadow-2xl transition-all duration-300 flex flex-col h-full">
      <div className="p-6 flex flex-col gap-4 flex-1">
        <span
          className={`inline-flex items-center gap-2 self-start text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg border ${meta.accent}`}
        >
          {meta.icon}
          {meta.label}
        </span>

        <h3 className="text-lg font-semibold text-white leading-relaxed">
          “{item.question}”
        </h3>
      </div>

      <div className="bg-[#171717] p-6 border-t border-gray-800 mt-auto">
        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
          Por que é estratégica
        </h4>
        <div className="flex gap-3">
          <span className="text-[#3ecf8e] shrink-0">
            <Lightbulb size={18} strokeWidth={2} />
          </span>
          <p className="text-gray-300 text-sm italic leading-relaxed">
            {item.why_strategic}
          </p>
        </div>
      </div>
    </div>
  );
};

export function StrategicQuestionsPage() {
  const jobTitle = useSession((s) => s.jobTitle);
  const companyName = useSession((s) => s.companyName);
  const analysisId = useSession((s) => s.analysisId);

  const {
    data: questions,
    isLoading: isPending,
    isError,
  } = useStrategicQuestions(analysisId);

  return (
    <div className="w-full max-w-7xl mx-auto pb-12">
      <header className="mb-12 border-b border-gray-800 pb-6">
        <h1 className="text-3xl font-bold text-white">
          Perguntas para a Empresa
        </h1>
        <p className="text-[#9a9a9a] mt-2 max-w-3xl">
          Perguntas estratégicas para você fazer ao entrevistador da{" "}
          <span className="text-[#3ecf8e] font-semibold">
            {companyName || "empresa"}
          </span>
          {jobTitle ? (
            <>
              {" "}
              na vaga de{" "}
              <span className="text-[#3ecf8e] font-semibold">{jobTitle}</span>
            </>
          ) : null}
          , demonstrando que você pesquisou a fundo.
        </p>
      </header>

      {isPending && (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3ecf8e]"></div>
          <p className="text-gray-400 text-sm animate-pulse">
            Formulando perguntas estratégicas com Inteligência Artificial...
          </p>
        </div>
      )}

      {isError && (
        <div className="bg-red-500/10 border border-red-500/20 p-8 rounded-2xl text-center max-w-2xl mx-auto shadow-lg flex flex-col items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-16 h-16 text-red-500 mb-4 opacity-80"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h2 className="text-xl font-bold text-red-400 mb-2">
            Não foi possível gerar as perguntas
          </h2>
          <p className="text-gray-300 text-sm leading-relaxed mb-6">
            Ocorreu um erro ao gerar as perguntas estratégicas. Tente novamente
            em instantes.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-[#202020] hover:bg-[#2a2a2a] border border-gray-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      )}

      {questions && (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 items-stretch">
          {questions.map((item, idx) => (
            <QuestionCard key={idx} item={item} />
          ))}
          {questions.length === 0 && (
            <div className="col-span-full bg-[#202020] border border-gray-800 border-dashed rounded-2xl p-12 text-center">
              <p className="text-gray-400">
                Nenhuma pergunta pôde ser gerada para esta vaga.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
