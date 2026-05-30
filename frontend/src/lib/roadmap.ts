import type { RoadmapTask } from "../store/session";

export const TOTAL_DAYS = 7;

export function groupByDay(tasks: RoadmapTask[]): Map<number, RoadmapTask[]> {
  const map = new Map<number, RoadmapTask[]>();
  for (let day = 1; day <= TOTAL_DAYS; day++) {
    map.set(day, []);
  }
  for (const task of tasks) {
    if (task.day >= 1 && task.day <= TOTAL_DAYS) {
      map.get(task.day)!.push(task);
    }
  }
  return map;
}

export function makeTaskKey(task: RoadmapTask, indexInDay: number): string {
  return `${task.day}-${task.gap_id}-${indexInDay}`;
}

export function isDayComplete(
  dayTasks: RoadmapTask[],
  isDoneFn: (key: string) => boolean
): boolean {
  if (dayTasks.length === 0) return false;
  return dayTasks.every((task, idx) => isDoneFn(makeTaskKey(task, idx)));
}

export function countCompletedDays(
  tasksByDay: Map<number, RoadmapTask[]>,
  isDoneFn: (key: string) => boolean
): number {
  let count = 0;
  for (const [, dayTasks] of tasksByDay) {
    if (isDayComplete(dayTasks, isDoneFn)) count++;
  }
  return count;
}

export const CATEGORY_LABELS: Record<RoadmapTask["category"], string> = {
  conceito: "Conceito",
  pratica: "Prática",
  revisao: "Revisão",
};

export const CATEGORY_STYLES: Record<RoadmapTask["category"], string> = {
  conceito: "bg-blue-500/10 text-blue-400",
  pratica: "bg-[#3ecf8e]/10 text-[#3ecf8e]",
  revisao: "bg-amber-500/10 text-amber-400",
};
