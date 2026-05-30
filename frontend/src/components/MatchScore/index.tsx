interface MatchScoreProps {
  score: number;
  summary: string;
}

export function MatchScore({ score, summary }: MatchScoreProps) {
  const color =
    score >= 70 ? "text-[#3ecf8e]" : score >= 40 ? "text-amber-400" : "text-red-400";

  return (
    <div className="flex flex-col items-center gap-4 p-8 bg-[#202020] border border-gray-700 rounded-2xl shadow-lg">
      <span className={`text-7xl font-bold tracking-tighter ${color}`}>
        {score}%
      </span>
      <p className="text-gray-300 text-center max-w-lg leading-relaxed">
        {summary}
      </p>
    </div>
  );
}