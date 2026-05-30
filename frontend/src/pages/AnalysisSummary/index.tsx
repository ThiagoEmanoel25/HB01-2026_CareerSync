import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Map, Code, Lightbulb, Mic } from "lucide-react";
import { GapCard } from "../../components/GapCard";
import { MatchScore } from "../../components/MatchScore";
import { useSession } from "../../store/session";

const TypingIndicator = () => (
  <div className="bg-[#202020] border border-gray-700 p-4 rounded-2xl rounded-tl-none self-start mb-6 flex items-center justify-center w-16 shadow-sm">
    <div className="flex gap-1.5">
      <div
        className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
        style={{ animationDelay: "0ms" }}
      ></div>
      <div
        className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
        style={{ animationDelay: "150ms" }}
      ></div>
      <div
        className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
        style={{ animationDelay: "300ms" }}
      ></div>
    </div>
  </div>
);

const AiBubble = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={`bg-[#202020] border border-gray-700 p-5 rounded-2xl rounded-tl-none self-start w-[90%] md:w-[85%] mb-6 shadow-sm transform transition-all duration-500 ease-out ${className}`}
  >
    {children}
  </div>
);

export function AnalysisSummaryPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const matchScore = useSession((s) => s.matchScore);
  const summary = useSession((s) => s.summary);
  const gaps = useSession((s) => s.gaps);
  const jobTitle = useSession((s) => s.jobTitle);
  const jobDescription = useSession((s) => s.jobDescription);
  const fileName = useSession((s) => s.fileName);
  const isNewAnalysis = location.state?.fromUpload;
  const [expanded, setExpanded] = useState(false);
  const [chatStep, setChatStep] = useState(isNewAnalysis ? 0 : 10);

  useEffect(() => {
    if (matchScore === null || !isNewAnalysis) return;

    const timers = [
      setTimeout(() => setChatStep(1), 800),
      setTimeout(() => setChatStep(2), 2000),
      setTimeout(() => setChatStep(3), 3500),
      setTimeout(() => setChatStep(4), 5000),
      setTimeout(() => setChatStep(5), 7000),
      setTimeout(() => setChatStep(6), 8500),
      setTimeout(() => setChatStep(7), 10500),
      setTimeout(() => setChatStep(8), 12000),
      setTimeout(() => setChatStep(9), 13500),
      setTimeout(() => setChatStep(10), 15000),
    ];

    return () => timers.forEach(clearTimeout);
  }, [matchScore, isNewAnalysis]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatStep, expanded]);

  if (matchScore === null) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <p className="text-gray-400">
          Nenhuma análise encontrada. Volte e envie seu currículo.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col pb-12 px-2 md:px-0">
      <header className="mb-8 border-b border-gray-800 pb-6 text-center">
        <h1 className="text-2xl text-white font-semibold">Análise de Perfil</h1>
        <p className="text-gray-400 mt-1 text-sm">
          CareerSync - Sincronizando você e sua vaga!
        </p>
      </header>

      <div className="flex flex-col w-full">
        <div className="bg-[#3ecf8e]/10 border border-[#3ecf8e]/20 p-5 rounded-2xl rounded-tr-none self-end w-[90%] md:w-[75%] mb-6 shadow-sm">
          <p className="text-gray-200 mb-3 text-sm md:text-base leading-relaxed">
            Esse é o <span className="font-bold text-white">meu currículo</span>
            :{" "}
            {fileName ? (
              <span className="text-[#3ecf8e] font-medium">{fileName}</span>
            ) : (
              <span className="text-gray-500 italic">
                (nenhum ficheiro enviado)
              </span>
            )}
          </p>
          <p className="text-gray-200 mb-3 text-sm md:text-base leading-relaxed">
            Quero me candidatar para a vaga de:{" "}
            <span className="font-bold text-[#3ecf8e]">
              {jobTitle || "Não especificada"}
            </span>
          </p>
          <div className="text-gray-200 text-sm md:text-base leading-relaxed bg-[#1a1a1a]/50 p-4 rounded-xl border border-[#3ecf8e]/10 mt-4">
            <span className="text-gray-400 block mb-2 text-xs uppercase tracking-wider font-bold">
              Descrição fornecida:
            </span>
            {!expanded ? (
              <>
                {jobDescription && jobDescription.length > 150
                  ? `${jobDescription.slice(0, 150)}...`
                  : jobDescription}
                {jobDescription && jobDescription.length > 150 && (
                  <button
                    onClick={() => setExpanded(true)}
                    className="ml-2 text-[#3ecf8e] font-medium hover:underline"
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
                  className="ml-2 text-[#3ecf8e] font-medium hover:underline block mt-2"
                >
                  mostrar menos
                </button>
              </>
            )}
          </div>
        </div>

        {chatStep === 1 && <TypingIndicator />}

        {chatStep >= 2 && isNewAnalysis && (
          <AiBubble>
            <p className="text-gray-300 leading-relaxed text-sm md:text-base">
              Vaga interessante... e o seu currículo é mais interessante ainda!
              🧐
            </p>
          </AiBubble>
        )}

        {chatStep === 3 && <TypingIndicator />}

        {chatStep >= 4 && isNewAnalysis && (
          <AiBubble>
            <p className="text-gray-300 leading-relaxed text-sm md:text-base">
              Deixa-me olhar com cuidado para começarmos a nossa preparação da
              melhor forma possível... 🚀
            </p>
          </AiBubble>
        )}

        {chatStep === 5 && <TypingIndicator />}

        {chatStep >= 6 && (
          <AiBubble>
            <p className="text-gray-300 leading-relaxed text-sm md:text-base mb-6">
              Aqui está o resultado da nossa análise inicial! Esta pontuação indica
              o quão aderente o seu perfil está em relação às exigências da
              vaga:
            </p>
            <MatchScore score={matchScore} summary={summary} />
          </AiBubble>
        )}

        {chatStep === 7 && <TypingIndicator />}

        {chatStep >= 8 && (
          <AiBubble>
            <p className="text-gray-300 leading-relaxed text-sm md:text-base mb-6">
              Para alcançarmos os 100% (ou chegarmos muito perto disso na
              entrevista), notei alguns pontos de atenção no seu currículo.
              Estas são as{" "}
              <span className="text-amber-400 font-bold">
                principais falhas de conhecimento
              </span>{" "}
              que precisamos de trabalhar:
            </p>
            <div className="grid gap-4 md:grid-cols-2">
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
          </AiBubble>
        )}

        {chatStep === 9 && <TypingIndicator />}

        {chatStep >= 10 && (
          <AiBubble className="border-[#3ecf8e]/30 shadow-[0_0_15px_rgba(62,207,142,0.05)]">
            <p className="text-gray-200 font-medium leading-relaxed text-sm md:text-base mb-6">
              Agora é contigo! Vamos resolver estes débitos técnicos? Preparei
              ferramentas específicas para cada etapa do seu estudo. Escolha por
              onde quer começar:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => navigate("/roadmap")}
                className="flex items-center gap-3 p-4 bg-[#171717] border border-gray-700 hover:border-[#3ecf8e] rounded-xl transition-all group"
              >
                <div className="bg-[#3ecf8e]/10 p-2 rounded-lg text-[#3ecf8e] group-hover:scale-110 transition-transform">
                  <Map size={20} />
                </div>
                <div className="text-left flex-1">
                  <span className="block text-white font-semibold text-sm">
                    Plano de Estudos
                  </span>
                  <span className="block text-gray-500 text-xs mt-0.5">
                    Roteiro prático de 7 dias
                  </span>
                </div>
              </button>

              <button
                onClick={() => navigate("/code-challenge")}
                className="flex items-center gap-3 p-4 bg-[#171717] border border-gray-700 hover:border-[#3ecf8e] rounded-xl transition-all group"
              >
                <div className="bg-[#3ecf8e]/10 p-2 rounded-lg text-[#3ecf8e] group-hover:scale-110 transition-transform">
                  <Code size={20} />
                </div>
                <div className="text-left flex-1">
                  <span className="block text-white font-semibold text-sm">
                    Desafios Técnicos
                  </span>
                  <span className="block text-gray-500 text-xs mt-0.5">
                    Problemas focados em suas falhas
                  </span>
                </div>
              </button>

              <button
                onClick={() => navigate("/pitch")}
                className="flex items-center gap-3 p-4 bg-[#171717] border border-gray-700 hover:border-[#3ecf8e] rounded-xl transition-all group"
              >
                <div className="bg-[#3ecf8e]/10 p-2 rounded-lg text-[#3ecf8e] group-hover:scale-110 transition-transform">
                  <Lightbulb size={20} />
                </div>
                <div className="text-left flex-1">
                  <span className="block text-white font-semibold text-sm">
                    Melhorar Pitch
                  </span>
                  <span className="block text-gray-500 text-xs mt-0.5">
                    Aprenda a se vender melhor
                  </span>
                </div>
              </button>

              <button
                onClick={() => navigate("/interview")}
                className="flex items-center gap-3 p-4 bg-[#171717] border border-gray-700 hover:border-[#3ecf8e] rounded-xl transition-all group"
              >
                <div className="bg-[#3ecf8e]/10 p-2 rounded-lg text-[#3ecf8e] group-hover:scale-110 transition-transform">
                  <Mic size={20} />
                </div>
                <div className="text-left flex-1">
                  <span className="block text-white font-semibold text-sm">
                    Simular Entrevista
                  </span>
                  <span className="block text-gray-500 text-xs mt-0.5">
                    Pratique com IA por voz
                  </span>
                </div>
              </button>
            </div>
          </AiBubble>
        )}

        <div ref={messagesEndRef} className="h-4" />
      </div>
    </div>
  );
}
