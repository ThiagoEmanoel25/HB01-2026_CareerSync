interface RoadmapProgressBarProps {
  completedDays: number;
  totalDays: number;
}

export function RoadmapProgressBar({
  completedDays,
  totalDays,
}: RoadmapProgressBarProps) {
  const pct = totalDays === 0 ? 0 : Math.round((completedDays / totalDays) * 100);
  const isComplete = completedDays === totalDays && totalDays > 0;
  const hasProgress = completedDays > 0;

  const barColor = isComplete
    ? "bg-[#3ecf8e]"
    : hasProgress
    ? "bg-[#3ecf8e]/80"
    : "bg-gray-600";

  return (
    <div className="bg-[#202020] rounded-xl border border-gray-700 p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-gray-200">
          {completedDays} de {totalDays} dias completos
        </p>
        <span className="text-sm font-semibold text-[#3ecf8e]">{pct}%</span>
      </div>
      <div className="w-full h-2.5 bg-[#171717] rounded-full overflow-hidden">
        <div
          className={`h-full ${barColor} transition-all duration-300`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
