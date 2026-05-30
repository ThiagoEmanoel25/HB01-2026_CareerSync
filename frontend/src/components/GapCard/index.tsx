import { ArrowRight } from "lucide-react";

interface GapCardProps {
  skill: string;
  level: "critical" | "moderate";
  reason: string;
  onViewContext: (skill: string) => void;
}

export function GapCard({ skill, level, reason, onViewContext }: GapCardProps) {

  const badgeStyles =
    level === "critical"
      ? "bg-red-500/10 text-red-400 border-red-500/20"
      : "bg-amber-500/10 text-amber-400 border-amber-500/20";

  return (
    <div className="flex flex-col gap-3 p-5 bg-[#202020] border border-gray-700 rounded-xl shadow-lg hover:border-gray-500 transition-all duration-300">
      <div className="flex items-start justify-between gap-3">
        <span className="font-bold text-white text-lg leading-tight">{skill}</span>
        <span className={`text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-md border font-bold shrink-0 ${badgeStyles}`}>
          {level}
        </span>
      </div>
      
      <p className="text-sm text-gray-300 leading-relaxed flex-1">
        {reason}
      </p>
      
      <button
        onClick={() => onViewContext(skill)}
        className="self-start mt-2 text-sm font-bold text-[#3ecf8e] hover:text-[#36b37e] flex items-center gap-1.5 transition-colors group"
      >
        Ver contexto
        <ArrowRight
          size={16}
          strokeWidth={2.5}
          className="group-hover:translate-x-1 transition-transform duration-200"
        />
      </button>
    </div>
  );
}