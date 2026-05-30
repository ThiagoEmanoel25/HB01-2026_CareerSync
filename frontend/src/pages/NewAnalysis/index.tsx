import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FlaskConical } from "lucide-react";
import { useCreateAnalysis } from "../../lib/api";
import { useSession, type Gap } from "../../store/session";

// Dados fake para navegar pelas rotas protegidas sem subir um currículo real.
const MOCK_GAPS: Gap[] = [
  {
    id: "gap-system-design",
    skill: "System Design",
    level: "critical",
    reason:
      "A vaga exige desenho de sistemas distribuídos, mas o currículo não evidencia essa experiência.",
  },
  {
    id: "gap-docker-k8s",
    skill: "Docker & Kubernetes",
    level: "critical",
    reason:
      "Orquestração de containers é requisito; falta menção a deploy em produção.",
  },
  {
    id: "gap-testes",
    skill: "Testes Automatizados",
    level: "moderate",
    reason:
      "Cobertura de testes é valorizada; a experiência aparenta se limitar a testes manuais.",
  },
];

export function NewAnalysisPage() {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [jobText, setJobText] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [fileName, setFileName] = useState("");

  const resetSession = useSession((s) => s.reset);
  const matchScore = useSession((s) => s.matchScore);
  const saveFullSession = useSession((s) => s.saveFullSession);

  const { mutate: analyze, isPending, error } = useCreateAnalysis();

  // Popula o store com uma análise fake e libera as rotas protegidas.
  // Obs.: o analysisId não existe no banco, então as telas que buscam dados
  // por id cairão em seus estados de fallback/erro — a de Entrevista usa as
  // perguntas mock automaticamente.
  function handleSimulate() {
    resetSession();
    saveFullSession({
      analysisId: "dev-mock-analysis",
      score: 72,
      gaps: MOCK_GAPS,
      summary:
        "Análise simulada (modo dev). Perfil sólido em desenvolvimento, com lacunas em arquitetura e infraestrutura para o nível alvo.",
      jobTitle: jobTitle || "Software Engineer L4",
      jobDescription: jobText || "Vaga simulada para navegação local.",
      fileName: fileName || "curriculo-demo.pdf",
    });
    navigate("/summary", { state: { fromUpload: true } });
  }

  function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();

    if (matchScore !== null) {
      resetSession();
    }

    const file = fileRef.current?.files?.[0];
    if (!file || !jobText.trim()) return;

    const form = new FormData();
    form.append("resume", file);
    form.append("job_title", jobTitle || "Vaga não especificada");
    form.append("job_description", jobText);

    analyze(form, {
      onSuccess: (res) => {
        saveFullSession({
          analysisId: res.analysisId,
          score: res.match_score,
          gaps: res.gaps,
          summary: res.summary,
          jobTitle: jobTitle || "Vaga não especificada",
          jobDescription: jobText,
          fileName: fileName,
        });

        navigate("/summary", { state: { fromUpload: true } });
      },
    });
  }

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col items-center">
      <div className="w-full">
        <h1 className="text-2xl text-white mb-2 font-semibold">Nova análise</h1>
        <p className="text-gray-400 mb-8">
          Envie seu currículo e a descrição da vaga para descobrir seu match e
          começar a se preparar.
        </p>

        <div className="mb-8 bg-[#202020] border border-dashed border-amber-500/30 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <span className="bg-amber-500/10 text-amber-400 p-2 rounded-lg shrink-0">
              <FlaskConical size={18} />
            </span>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-amber-400 mb-1">
                Modo desenvolvimento
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                As rotas <span className="text-gray-300">Resumo</span>,{" "}
                <span className="text-gray-300">Roadmap</span>,{" "}
                <span className="text-gray-300">Pitch</span>,{" "}
                <span className="text-gray-300">Code Challenge</span> e{" "}
                <span className="text-gray-300">Entrevista</span> exigem uma
                análise ativa — sem ela, você é redirecionado para esta página.
                Para navegar sem subir um currículo, simule uma análise com
                dados fake.
              </p>
              <button
                type="button"
                onClick={handleSimulate}
                className="mt-4 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-sm font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Simular análise (dev)
              </button>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Currículo (PDF)
            </label>
            <div
              className="bg-[#202020] border-2 border-dashed border-gray-600 rounded-xl p-8 text-center cursor-pointer hover:border-[#3ecf8e] transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              {fileName ? (
                <p className="text-[#3ecf8e] font-medium">{fileName}</p>
              ) : (
                <p className="text-gray-400">Clique para selecionar um PDF</p>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Cargo alvo
            </label>
            <input
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="Ex: Software Engineer L4"
              className="w-full bg-[#202020] border border-gray-700 text-gray-50 rounded-lg px-4 py-3 focus:outline-none focus:border-[#3ecf8e] focus:ring-1 focus:ring-[#3ecf8e] transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Descrição da vaga
            </label>
            <textarea
              value={jobText}
              onChange={(e) => setJobText(e.target.value)}
              rows={8}
              placeholder="Cole aqui o texto completo da descrição da vaga..."
              className="w-full bg-[#202020] border border-gray-700 text-gray-50 rounded-lg px-4 py-3 resize-none focus:outline-none focus:border-[#3ecf8e] focus:ring-1 focus:ring-[#3ecf8e] transition-all"
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm bg-red-500/10 p-3 rounded-lg border border-red-500/20">
              {(error as Error).message}
            </p>
          )}

          <button
            type="submit"
            disabled={isPending || !fileName || !jobText.trim()}
            className="bg-[#3ecf8e] text-black font-bold py-3 mt-2 rounded-xl hover:bg-[#36b37e] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isPending ? "Analisando perfil..." : "Analisar Match"}
          </button>
        </form>
      </div>
    </div>
  );
}
