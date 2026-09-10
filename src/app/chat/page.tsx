"use client";
import {
  CopilotChat,
  useConfigureSuggestions,
} from "@copilotkit/react-core/v2";
import type { CSSProperties } from "react";

const Page = () => {
  useConfigureSuggestions({
    instructions: `Suggest questions what can you do?`,
  });

  return (
    <>
      <div className="px-10">
        <h1 className="text-center text-4xl font-extrabold">
          <span className="purple-pink-gradient py-4">Chatbox</span>
        </h1>
        <div
          className="w-full px-20 h-auto my-10"
          style={
            {
              "--copilot-kit-primary-color": "#222222",
              "--copilot-kit-background-color": "rgba(34, 34, 34, 0.5)",
              "--copilot-kit-response-button-background-color":
                "rgba(68, 68, 68, 0.7)",
              "--copilot-kit-response-button-color": "#fff",
              "--copilot-kit-separator-color": "rgba(102, 102, 102, 0.8)",
              "--copilot-kit-muted-color": "#fff",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              borderRadius: "10px",
            } as CSSProperties
          }
        >
          <CopilotChat
            labels={{
              welcomeMessageText:
                "Hello! 👋 I'm your CopilotMate AI Assistant, here to help you stay organized and on track. You can create spreadsheets, track expense, and manage your to-do list with ease. Let's get started! What would you like to accomplish today?",
            }}
          />
        </div>
      </div>
    </>
  );
};

export default Page;
