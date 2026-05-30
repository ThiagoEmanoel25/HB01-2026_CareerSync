import { useState } from "react";

import type { RoadmapTask } from "../../store/session";
import { isDayComplete, makeTaskKey } from "../../lib/roadmap";
import { TaskItem } from "../TaskItem";

interface RoadmapDaysViewProps {
  tasksByDay: Map<number, RoadmapTask[]>;
  isDone: (taskKey: string) => boolean;
  onToggle: (taskKey: string) => void;
  onViewContext: (gapId: string) => void;
}

export function RoadmapDaysView({
  tasksByDay,
  isDone,
  onToggle,
  onViewContext,
}: RoadmapDaysViewProps) {
  const [openDays, setOpenDays] = useState<Set<number>>(() => new Set([1]));

  function toggleDay(day: number) {
    setOpenDays((prev) => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-2">
      {Array.from(tasksByDay.entries()).map(([day, dayTasks]) => {
        const isOpen = openDays.has(day);
        const completed = dayTasks.filter((task, idx) =>
          isDone(makeTaskKey(task, idx))
        ).length;
        const dayDone = isDayComplete(dayTasks, isDone);

        return (
          <div
            key={day}
            className={`rounded-xl border bg-[#202020] overflow-hidden ${
              dayDone ? "border-[#3ecf8e]/40" : "border-gray-700"
            }`}
          >
            <button
              type="button"
              onClick={() => toggleDay(day)}
              aria-expanded={isOpen}
              aria-controls={`day-${day}-content`}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`text-sm font-semibold ${
                    dayDone ? "text-[#3ecf8e]" : "text-gray-100"
                  }`}
                >
                  Dia {day}
                </span>
                {dayTasks.length > 0 && (
                  <span className="text-xs text-gray-400">
                    {completed}/{dayTasks.length} concluídas
                  </span>
                )}
                {dayDone && (
                  <span className="text-xs font-medium text-[#3ecf8e]">✓</span>
                )}
              </div>
              <span
                className={`text-gray-500 transition-transform ${
                  isOpen ? "rotate-180" : ""
                }`}
                aria-hidden
              >
                ▾
              </span>
            </button>
            {isOpen && (
              <div
                id={`day-${day}-content`}
                className="p-3 pt-0 flex flex-col gap-2"
              >
                {dayTasks.length === 0 ? (
                  <p className="text-sm text-gray-500 px-3 py-2">
                    Sem tarefas neste dia.
                  </p>
                ) : (
                  dayTasks.map((task, idx) => {
                    const key = makeTaskKey(task, idx);
                    return (
                      <TaskItem
                        key={key}
                        task={task}
                        done={isDone(key)}
                        onToggle={() => onToggle(key)}
                        onViewContext={onViewContext}
                      />
                    );
                  })
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
