import { Lightbulb } from 'lucide-react';
import { useAnalysisPitch, type PitchCard } from '../../lib/api';
import { useSession } from '../../store/session';

const StarCard = ({ pitch }: { pitch: PitchCard }) => (
  <div className="bg-[#202020] rounded-2xl shadow-lg border border-gray-700 overflow-hidden hover:border-gray-500 hover:shadow-2xl transition-all duration-300 flex flex-col h-full">
    
    <div className="bg-[#171717] border-b border-gray-800 p-6">
      <h3 className="text-xl font-bold text-white leading-tight">{pitch.project}</h3>
      <p className="text-[#3ecf8e] text-sm mt-2 font-medium">{pitch.relevance}</p>
    </div>
    
    <div className="p-6 space-y-5 flex-1">
      <div>
        <h4 className="flex items-center text-sm font-bold text-blue-400 uppercase tracking-wider mb-2">
          <span className="bg-blue-500/20 border border-blue-500/30 w-7 h-7 rounded flex items-center justify-center mr-3">S</span>
          Situação
        </h4>
        <p className="text-gray-300 text-sm bg-[#1a1a1a] p-4 rounded-xl border border-gray-800 leading-relaxed">
          {pitch.situation}
        </p>
      </div>
      
      <div>
        <h4 className="flex items-center text-sm font-bold text-amber-400 uppercase tracking-wider mb-2">
          <span className="bg-amber-500/20 border border-amber-500/30 w-7 h-7 rounded flex items-center justify-center mr-3">T</span>
          Tarefa
        </h4>
        <p className="text-gray-300 text-sm bg-[#1a1a1a] p-4 rounded-xl border border-gray-800 leading-relaxed">
          {pitch.task}
        </p>
      </div>
      
      <div>
        <h4 className="flex items-center text-sm font-bold text-emerald-400 uppercase tracking-wider mb-2">
          <span className="bg-emerald-500/20 border border-emerald-500/30 w-7 h-7 rounded flex items-center justify-center mr-3">A</span>
          Ação
        </h4>
        <p className="text-gray-300 text-sm bg-[#1a1a1a] p-4 rounded-xl border border-gray-800 leading-relaxed">
          {pitch.action}
        </p>
      </div>
      
      <div>
        <h4 className="flex items-center text-sm font-bold text-purple-400 uppercase tracking-wider mb-2">
          <span className="bg-purple-500/20 border border-purple-500/30 w-7 h-7 rounded flex items-center justify-center mr-3">R</span>
          Resultado
        </h4>
        <p className="text-white font-medium text-sm bg-purple-500/10 p-4 rounded-xl border border-purple-500/20 shadow-inner leading-relaxed">
          {pitch.result}
        </p>
      </div>
    </div>

    <div className="bg-[#171717] p-6 border-t border-gray-800 mt-auto">
      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Conexão Estratégica</h4>
      <div className="flex gap-3">
        <Lightbulb size={18} className="text-[#3ecf8e] shrink-0 mt-0.5" />
        <p className="text-gray-300 text-sm italic leading-relaxed">
          "{pitch.vaga_connection}"
        </p>
      </div>
    </div>
  </div>
);

export function PitchPage() {
  const jobTitle = useSession((s) => s.jobTitle);
  const analysisId = useSession((s) => s.analysisId);
  const { data: pitches, isLoading: isPending, isError } =
    useAnalysisPitch(analysisId);

  return (
    <div className="w-full max-w-7xl mx-auto pb-12">
      <header className="mb-12 border-b border-gray-800 pb-6">
        <h1 className="text-3xl font-bold text-white">Cartões de Pitch (STAR)</h1>
        <p className="text-[#9a9a9a] mt-2 max-w-3xl">
          Revise suas experiências passadas estruturadas no método comportamental, perfeitamente alinhadas com o que os recrutadores buscam para a vaga de <span className="text-[#3ecf8e] font-semibold">{jobTitle || 'Tecnologia'}</span>.
        </p>
      </header>

      {isPending && (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3ecf8e]"></div>
          <p className="text-gray-400 text-sm animate-pulse">Lapidando suas narrativas com Inteligência Artificial...</p>
        </div>
      )}

      {isError && (
        <div className="bg-red-500/10 border border-red-500/20 p-8 rounded-2xl text-center max-w-2xl mx-auto shadow-lg flex flex-col items-center">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 text-red-500 mb-4 opacity-80">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-xl font-bold text-red-400 mb-2">Serviço Indisponível (404)</h2>
          <p className="text-gray-300 text-sm leading-relaxed mb-6">
            O nosso backend ainda não implementou a rota para a geração dos Pitches STAR. Quando a API estiver pronta, as narrativas aparecerão aqui.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-[#202020] hover:bg-[#2a2a2a] border border-gray-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      )}

      {pitches && (
        <div className="grid gap-8 md:grid-cols-2 items-stretch">
          {pitches.map((pitch, idx) => (
            <StarCard key={idx} pitch={pitch} />
          ))}
          {pitches.length === 0 && (
            <div className="col-span-full bg-[#202020] border border-gray-800 border-dashed rounded-2xl p-12 text-center">
              <p className="text-gray-400">Nenhuma experiência pôde ser mapeada para o seu currículo.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}