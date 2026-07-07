import { Task, TaskPriority, TaskStatus } from "./tasks.types";

export const defaultTasks: Task[] = [
  {
    id: 1,
    title: "Vote this project on Quira.",
    status: TaskStatus.todo,
    priority: TaskPriority.medium,
  },
  {
    id: 2,
    title: "Solve 3 DSA questions",
    status: TaskStatus.completed,
    priority: TaskPriority.high,
  },
  {
    id: 3,
    title: "Study for upcoming test.",
    status: TaskStatus.todo,
    priority: TaskPriority.high,
  },
  {
    id: 4,
    title: "Prepare youtube video for quira submission.",
    status: TaskStatus.todo,
    priority: TaskPriority.medium,
  },
  {
    id: 5,
    title: "Give a star on this repo.",
    status: TaskStatus.todo,
    priority: TaskPriority.low,
  },
];
