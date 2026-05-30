import { useState } from "react";
import {
  Users,
  Code,
  Target,
  Copy,
  Check,
  RefreshCw,
  ChevronDown,
} from "lucide-react";
import type { ReactNode } from "react";

import {
  useStrategicQuestions,
  useRegenerateStrategicQuestions,
  type StrategicQuestion,
} from "../../lib/api";

const TYPE_META: Record<
  StrategicQuestion["type"],
  { label: string; icon: ReactNode; accent: string }
> = {
  cultura: {
    label: "Cultura",
    icon: <Users size={16} strokeWidth={2} />,
    accent: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  },
  tecnico: {
    label: "Roadmap técnico",
    icon: <Code size={16} strokeWidth={2} />,
    accent: "text-blue-400 bg-blue-500/10 border-blue-500/30",
  },
  desafios: {
    label: "Desafios",
    icon: <Target size={16} strokeWidth={2} />,
    accent: "text-amber-400 bg-amber-500/10 border-amber-500/30",
  },
};

const QuestionItem = ({ item }: { item: StrategicQuestion }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const meta = TYPE_META[item.type];

  return (
    <div className="bg-[#171717] rounded-xl border border-gray-800 p-5">
      <span
        className={`inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg border ${meta.accent}`}
      >
        {meta.icon}
        {meta.label}
      </span>

      <p className="text-white text-base leading-relaxed mt-3">
        “{item.question}”
      </p>

      <button
        onClick={() => setIsExpanded((prev) => !prev)}
        className="mt-4 flex items-center gap-1.5 text-sm text-[#3ecf8e] hover:text-[#36b37e] font-medium transition-colors"
      >
        <ChevronDown
          size={16}
          strokeWidth={2}
          className={`transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
        />
        Por que fazer esta pergunta?
      </button>

      {isExpanded && (
        <p className="mt-3 text-sm text-gray-400 italic leading-relaxed border-l-2 border-gray-700 pl-4">
          {item.why_strategic}
        </p>
      )}
    </div>
  );
};

export function RecruiterQuestions({ analysisId }: { analysisId: string }) {
  const {
    data: questions,
    isLoading,
    isError,
  } = useStrategicQuestions(analysisId);
  const { mutate: regenerate, isPending: isRegenerating } =
    useRegenerateStrategicQuestions(analysisId);
  const [copied, setCopied] = useState(false);

  const handleCopyAll = async () => {
    if (!questions || questions.length === 0) return;
    const text = questions
      .map((q, i) => `${i + 1}. [${TYPE_META[q.type].label}] ${q.question}`)
      .join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard pode falhar sem HTTPS/permissão — silenciamos e mantemos a UI.
    }
  };

  return (
    <section className="w-full max-w-3xl mx-auto mt-16 border-t border-gray-800 pt-10">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">
            Perguntas ao Recrutador
          </h2>
          <p className="text-[#9a9a9a] text-sm mt-1">
            Faça estas perguntas no fim da entrevista para demonstrar que
            pesquisou a empresa.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleCopyAll}
            disabled={!questions || questions.length === 0}
            className="flex items-center gap-2 bg-[#202020] hover:bg-[#2a2a2a] border border-gray-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {copied ? (
              <>
                <Check size={16} strokeWidth={2} className="text-[#3ecf8e]" />
                Copiado!
              </>
            ) : (
              <>
                <Copy size={16} strokeWidth={2} />
                Copiar todas
              </>
            )}
          </button>

          <button
            onClick={() => regenerate()}
            disabled={isRegenerating}
            className="flex items-center gap-2 bg-[#202020] hover:bg-[#2a2a2a] border border-gray-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw
              size={16}
              strokeWidth={2}
              className={isRegenerating ? "animate-spin" : ""}
            />
            Regenerar
          </button>
        </div>
      </div>

      {(isLoading || isRegenerating) && (
        <div className="flex flex-col items-center justify-center py-12 space-y-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#3ecf8e]"></div>
          <p className="text-gray-400 text-sm animate-pulse">
            Formulando perguntas estratégicas...
          </p>
        </div>
      )}

      {isError && !isRegenerating && (
        <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-xl text-center">
          <p className="text-gray-300 text-sm leading-relaxed mb-4">
            Não foi possível gerar as perguntas estratégicas agora.
          </p>
          <button
            onClick={() => regenerate()}
            className="bg-[#202020] hover:bg-[#2a2a2a] border border-gray-700 text-white font-medium py-2 px-6 rounded-lg transition-colors text-sm"
          >
            Tentar Novamente
          </button>
        </div>
      )}

      {questions && !isLoading && !isRegenerating && (
        <div className="flex flex-col gap-4">
          {questions.map((item, idx) => (
            <QuestionItem key={idx} item={item} />
          ))}
          {questions.length === 0 && (
            <div className="bg-[#202020] border border-gray-800 border-dashed rounded-xl p-8 text-center">
              <p className="text-gray-400 text-sm">
                Nenhuma pergunta pôde ser gerada para esta vaga.
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
