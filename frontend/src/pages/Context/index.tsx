import { useParams, useNavigate } from 'react-router-dom';
import { useContext as useApiContext } from '../../lib/api';

export function ContextPage() {
  const { gapId } = useParams<{ gapId: string }>();
  const navigate = useNavigate();
  
  const { data: context, isLoading, isError } = useApiContext(gapId || '');

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3ecf8e]"></div>
        <p className="text-gray-400 text-sm animate-pulse">Buscando contexto detalhado para o gap...</p>
      </div>
    );
  }

  if (isError || !context) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 p-8 rounded-2xl text-center max-w-2xl mx-auto mt-10">
        <p className="text-red-400 mb-6 font-medium">Não foi possível carregar o contexto detalhado desta habilidade.</p>
        <button 
          onClick={() => navigate(-1)} 
          className="bg-[#202020] hover:bg-[#2a2a2a] border border-gray-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
        >
          &larr; Voltar
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto pb-12">
      <div className="bg-[#202020] border border-gray-800 shadow-2xl rounded-2xl overflow-hidden">
        
        <div className="bg-[#171717] border-b border-gray-800 px-8 py-6 relative">
          <button 
            onClick={() => navigate(-1)} 
            className="text-gray-500 hover:text-[#3ecf8e] text-sm mb-4 flex items-center transition-colors font-medium"
          >
            &larr; Voltar para a Análise
          </button>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <span className="text-[#3ecf8e]">Explorando:</span> {context.title}
          </h1>
        </div>

        <div className="p-8 space-y-8">
          
          <section>
            <h2 className="flex items-center text-lg font-bold text-white mb-4">
              <span className="w-8 h-8 rounded bg-blue-500/20 border border-blue-500/30 text-blue-400 flex items-center justify-center mr-3">📚</span>
              O que é?
            </h2>
            <p className="text-gray-300 leading-relaxed bg-[#1a1a1a] p-5 rounded-xl border border-gray-800">
              {context.definition}
            </p>
          </section>

          <section>
            <h2 className="flex items-center text-lg font-bold text-white mb-4">
              <span className="w-8 h-8 rounded bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center mr-3">🎯</span>
              Por que é Relevante?
            </h2>
            <p className="text-gray-300 leading-relaxed bg-[#1a1a1a] p-5 rounded-xl border border-gray-800">
              {context.relevance}
            </p>
          </section>

          <section>
            <h2 className="flex items-center text-lg font-bold text-white mb-4">
              <span className="w-8 h-8 rounded bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mr-3">💼</span>
              Como Demonstrar em Entrevistas?
            </h2>
            <div className="text-gray-300 leading-relaxed bg-[#1a1a1a] p-5 rounded-xl border border-gray-800">
              {context.how_to_show}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}