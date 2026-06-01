import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCreateAnalysis } from "../../lib/api";
import { useSession } from "../../store/session";

export function NewAnalysisPage() {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [jobText, setJobText] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [fileName, setFileName] = useState("");

  const resetSession = useSession((s) => s.reset);
  const matchScore = useSession((s) => s.matchScore);
  const saveFullSession = useSession((s) => s.saveFullSession);

  const { mutate: analyze, isPending, error } = useCreateAnalysis();

  function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();

    if (matchScore !== null) {
      resetSession();
    }

    const file = fileRef.current?.files?.[0];
    if (!file || !jobText.trim() || !companyName.trim()) return;

    const normalizedJobTitle = jobTitle.trim() || "Vaga não especificada";
    const normalizedCompanyName = companyName.trim();
    const form = new FormData();
    form.append("resume", file);
    form.append("job_title", normalizedJobTitle);
    form.append("job_description", jobText);
    form.append("company_name", normalizedCompanyName);

    analyze(form, {
      onSuccess: (res) => {
        saveFullSession({
          analysisId: res.analysisId,
          score: res.match_score,
          gaps: res.gaps,
          summary: res.summary,
          jobTitle: normalizedJobTitle,
          jobDescription: jobText,
          companyName: normalizedCompanyName,
          fileName,
        });

        navigate(`/analysis/${res.analysisId}/summary`, {
          state: { fromUpload: true },
        });
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
              Nome da empresa
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Ex: Supabase"
              className="w-full bg-[#202020] border border-gray-700 text-gray-50 rounded-lg px-4 py-3 focus:outline-none focus:border-[#3ecf8e] focus:ring-1 focus:ring-[#3ecf8e] transition-all"
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
            disabled={isPending || !fileName || !jobText.trim() || !companyName.trim()}
            className="bg-[#3ecf8e] text-black font-bold py-3 mt-2 rounded-xl hover:bg-[#36b37e] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isPending ? "Analisando..." : "Analisar Compatibilidade"}
          </button>
        </form>
      </div>
    </div>
  );
}
