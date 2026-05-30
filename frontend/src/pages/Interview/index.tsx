import { useState, useRef, useEffect } from 'react';
import { useSession } from '../../store/session';
import {
  useAnalysisInterviewQuestions,
  useEvaluateInterviewAnswer,
  type InterviewEvaluateResponse,
} from '../../lib/api';
import { RecruiterQuestions } from '../../components/RecruiterQuestions';

const MOCK_QUESTIONS = [
  "Conte-me sobre um momento em que você teve que lidar com um prazo muito apertado e como você gerenciou a situação.",
  "Descreva uma situação onde você discordou de um colega sobre uma decisão técnica. Como vocês resolveram isso?",
  "Fale sobre um projeto complexo em que você trabalhou. Qual foi o seu papel e o maior desafio que você superou?"
];

export function InterviewPage() {
  const jobTitle = useSession((s) => s.jobTitle);
  const analysisId = useSession((s) => s.analysisId);
  const gaps = useSession((s) => s.gaps);
  const gapSkills = gaps.map((g) => g.skill);

  const { data: questionsData } = useAnalysisInterviewQuestions(analysisId);
  const { mutate: evaluateAnswer } = useEvaluateInterviewAnswer(analysisId);

  const [isStarted, setIsStarted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const questions =
    questionsData?.questions && questionsData.questions.length > 0
      ? questionsData.questions
      : MOCK_QUESTIONS;
  const question = questions[currentQuestionIndex % questions.length];
  const [evaluation, setEvaluation] = useState<InterviewEvaluateResponse | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'pt-BR';

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error("Erro no reconhecimento de voz:", event.error);
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert("Seu navegador não suporta reconhecimento de voz nativo. Use Chrome ou Edge.");
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
      setIsEvaluating(true);
      handleEvaluate();
    } else {
      setTranscript('');
      setEvaluation(null);
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  const handleEvaluate = () => {
    evaluateAnswer(
      { question, transcript, gaps: gapSkills },
      {
        onSuccess: (res) => {
          setEvaluation(res);
          setIsEvaluating(false);
        },
        onError: () => {
          setIsEvaluating(false);
        },
      }
    );
  };

  const handleNextQuestion = () => {
    setEvaluation(null);
    setTranscript('');
    setCurrentQuestionIndex((prev) => (prev + 1) % questions.length);
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col min-h-[80vh]">
      
      <header className="mb-8 border-b border-gray-800 pb-6 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Simulador de Entrevista</h1>
          <p className="text-[#9a9a9a] mt-2">Vaga alvo: <span className="text-[#3ecf8e] font-semibold">{jobTitle || 'Tecnologia'}</span></p>
        </div>
        
        {!isStarted ? (
          <button 
            onClick={() => setIsStarted(true)}
            className="bg-[#3ecf8e] hover:bg-[#36b37e] text-black px-6 py-2.5 rounded-xl font-bold transition-colors shrink-0"
          >
            Iniciar Sessão
          </button>
        ) : (
          <div className="flex items-center gap-3 bg-[#202020] px-4 py-2 rounded-lg border border-gray-800">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3ecf8e] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#3ecf8e]"></span>
            </span>
            <span className="text-gray-300 text-sm font-medium">Gravador Ativo</span>
          </div>
        )}
      </header>

      {isStarted ? (
        <main className="flex-1 flex flex-col items-center p-4">
          
          <div className="text-center mb-12 max-w-3xl">
            <div className="w-24 h-24 bg-[#202020] border-2 border-[#3ecf8e]/30 rounded-full mx-auto flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(62,207,142,0.15)] transition-all">
              <span className={`text-4xl transition-transform ${isRecording ? 'animate-pulse scale-110' : ''}`}>🤖</span>
            </div>
            <h2 className="text-xl md:text-2xl font-medium text-white leading-relaxed">
              "{question}"
            </h2>
          </div>

          {!evaluation && (
            <div className="w-full flex flex-col items-center mb-10">
              <button 
                onClick={toggleRecording}
                disabled={isEvaluating}
                className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl transition-all duration-300 ${
                  isRecording 
                    ? 'bg-red-500/20 text-red-500 border-2 border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.4)] scale-110' 
                    : isEvaluating
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                    : 'bg-[#202020] hover:bg-[#2a2a2a] text-[#3ecf8e] border border-gray-700'
                }`}
              >
                {isEvaluating ? (
                   <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-500"></div>
                ) : (
                  "🎤"
                )}
              </button>
              
              <p className="mt-5 text-gray-400 text-sm font-medium">
                {isRecording 
                  ? 'Ouvindo... Clique novamente para finalizar' 
                  : isEvaluating
                  ? 'Analisando sua resposta...'
                  : 'Clique no microfone para responder'}
              </p>
            </div>
          )}

          {transcript && !evaluation && (
            <div className="w-full max-w-3xl bg-[#171717] rounded-xl p-6 border border-gray-800 mb-8">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-3 font-bold">Sua Resposta em Tempo Real:</p>
              <p className="text-gray-300 text-lg leading-relaxed">{transcript}</p>
            </div>
          )}

          {evaluation && (
            <div className="w-full max-w-3xl bg-[#202020] rounded-2xl p-6 md:p-8 border border-gray-700 shadow-xl animate-fade-in-up">
              
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-gray-800 pb-6">
                <div>
                  <h3 className="text-xl font-bold text-white">Avaliação da IA</h3>
                  <p className="text-sm text-gray-400 mt-1">Análise da sua última resposta</p>
                </div>
                <div className="bg-[#3ecf8e]/10 text-[#3ecf8e] border border-[#3ecf8e]/20 px-5 py-2 rounded-xl font-bold text-lg">
                  Nota: {evaluation.score_1_5} / 5
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="bg-[#171717] p-5 rounded-xl border border-gray-800">
                  <h4 className="text-emerald-400 font-bold mb-4 flex items-center gap-2">
                    <span className="bg-emerald-500/20 p-1 rounded">👍</span> Pontos Fortes
                  </h4>
                  <ul className="list-disc pl-4 text-sm text-gray-300 space-y-2">
                    {evaluation.strengths.map((str, i) => <li key={i}>{str}</li>)}
                  </ul>
                </div>
                
                <div className="bg-[#171717] p-5 rounded-xl border border-gray-800">
                  <h4 className="text-amber-400 font-bold mb-4 flex items-center gap-2">
                    <span className="bg-amber-500/20 p-1 rounded">🎯</span> A Melhorar
                  </h4>
                  <ul className="list-disc pl-4 text-sm text-gray-300 space-y-2">
                    {evaluation.improvements.map((imp, i) => <li key={i}>{imp}</li>)}
                  </ul>
                </div>
              </div>

              <div className="bg-blue-500/5 border border-blue-500/20 p-5 rounded-xl mb-8">
                <p className="text-sm text-gray-300 leading-relaxed">
                  <strong className="text-blue-400 block mb-1">Dica Estratégica:</strong> 
                  {evaluation.tip}
                </p>
              </div>

              <div className="flex justify-center">
                <button 
                  onClick={handleNextQuestion}
                  className="bg-[#171717] hover:bg-[#2a2a2a] border border-gray-700 text-white px-6 py-3 rounded-xl font-medium transition-colors flex items-center gap-2"
                >
                  Próxima Pergunta <span>→</span>
                </button>
              </div>
            </div>
          )}

        </main>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="bg-[#202020] border border-gray-800 border-dashed rounded-2xl p-10 text-center max-w-xl">
             <div className="text-4xl mb-4">🎙️</div>
            <h3 className="text-white font-bold text-lg mb-2">Simulador de Áudio Nativo</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              O PrepOS usará o microfone do seu navegador para transcrever sua fala em tempo real (Speech-to-Text). Clique em "Iniciar Sessão" no topo para permitir o acesso.
            </p>
          </div>
        </div>
      )}

      {analysisId && <RecruiterQuestions analysisId={analysisId} />}
    </div>
  );
}