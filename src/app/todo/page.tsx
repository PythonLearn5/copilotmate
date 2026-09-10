"use client";
import { TasksList } from "@/components/Todo/TasksList";
import { TasksProvider } from "@/lib/hooks/use-tasks";
import { CopilotPopup } from "@copilotkit/react-core/v2";
import { Suspense } from "react";
import type { CSSProperties } from "react";

const Todo = () => {
  return (
    <>
      <Suspense>
        <TasksProvider>
          <TasksList />
        </TasksProvider>
        <div
          style={
            {
              "--copilot-kit-primary-color": "#222222",
              "--copilot-kit-background-color": "#555555",
              "--copilot-kit-response-button-background-color": "#444444",
              "--copilot-kit-response-button-color": "#fff",
              "--copilot-kit-separator-color": "#666666",
              "--copilot-kit-muted-color": "#fff",
            } as CSSProperties
          }
        >
          <CopilotPopup
            labels={{
              welcomeMessageText: "How can I help you with your to-do list?",
            }}
          />
        </div>
      </Suspense>
    </>
  );
};

export default Todo;
