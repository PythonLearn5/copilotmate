"use client"
import { useFrontendTool, useAgentContext } from "@copilotkit/react-core/v2";
import { z } from "zod";
import { createContext, useContext, useState, ReactNode } from "react";
import { defaultTasks } from "../default-tasks";
import { Task, TaskStatus, TaskPriority } from "../tasks.types";

let nextId = defaultTasks.length + 1;

type TasksContextType = {
  tasks: Task[];
  addTask: (title: string, priority?: TaskPriority) => void; // Add priority parameter
  setTaskStatus: (id: number, status: TaskStatus) => void;
  setTaskPriority: (id: number, priority: TaskPriority) => void; // New function for setting priority
  deleteTask: (id: number) => void;
};

const TasksContext = createContext<TasksContextType | undefined>(undefined);

export const TasksProvider = ({ children }: { children: ReactNode }) => {
  const [tasks, setTasks] = useState<Task[]>(defaultTasks);

  useAgentContext({
    description: "The state of the todo list",
    value: JSON.stringify(tasks),
  });

  useFrontendTool({
    name: "addTask",
    description: "Adds a task to the todo list",
    parameters: z.object({
      title: z.string().describe("The title of the task"),
      priority: z.enum(Object.values(TaskPriority) as [string, ...string[]]).describe("The priority of the task").optional(),
    }),
    handler: async ({ title, priority }) => {
      addTask(title, (priority as TaskPriority) || TaskPriority.medium);
      return "Task added successfully";
    },
    render: () => "Processing..."
  });

  useFrontendTool({
    name: "deleteTask",
    description: "Deletes a task from the todo list",
    parameters: z.object({
      id: z.number().describe("The id of the task to delete"),
    }),
    handler: async ({ id }) => {
      deleteTask(id);
      return "Task deleted successfully";
    },
    render: () => "Processing..."
  });

  useFrontendTool({
    name: "setTaskStatus",
    description: "Sets the status of a task",
    parameters: z.object({
      id: z.number().describe("The id of the task"),
      status: z.enum(Object.values(TaskStatus) as [string, ...string[]]).describe("The status of the task"),
    }),
    handler: async ({ id, status }) => {
      setTaskStatus(id, status as TaskStatus);
      return "Set status successful";
    },
    render: () => "Processing..."
  });

  // New Action to Update Task Priority
  useFrontendTool({
    name: "setTaskPriority",
    description: "Sets the priority of a task",
    parameters: z.object({
      id: z.number().describe("The id of the task"),
      priority: z.enum(Object.values(TaskPriority) as [string, ...string[]]).describe("The priority of the task"),
    }),
    handler: async ({ id, priority }) => {
      setTaskPriority(id, priority as TaskPriority);
      return "Task priority updated successfully";
    },
    render: () => "Processing..."
  });

  const addTask = (title: string, priority: TaskPriority = TaskPriority.medium) => {
    setTasks([...tasks, { id: nextId++, title, status: TaskStatus.todo, priority }]);
  };

  const setTaskStatus = (id: number, status: TaskStatus) => {
    setTasks(
      tasks.map((task) =>
        task.id === id ? { ...task, status } : task
      )
    );
  };

  const setTaskPriority = (id: number, priority: TaskPriority) => {
    setTasks(
      tasks.map((task) =>
        task.id === id ? { ...task, priority } : task
      )
    );
  };

  const deleteTask = (id: number) => {
    setTasks(tasks.filter((task) => task.id !== id));
  };

  return (
    <TasksContext.Provider value={{ tasks, addTask, setTaskStatus, setTaskPriority, deleteTask }}>
      {children}
    </TasksContext.Provider>
  );
};

export const useTasks = () => {
  const context = useContext(TasksContext);
  if (context === undefined) {
    throw new Error("useTasks must be used within a TasksProvider");
  }
  return context;
};
