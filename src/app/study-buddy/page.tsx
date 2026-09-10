"use client";

import { ResearchWrapper } from "@/components/StudyBuddy/ResearchWrapper";
import { ResearchProvider } from "@/lib/research-provider";
import { CopilotKit } from "@copilotkit/react-core/v2";

export default function Home() {
  const runtimeUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/copilotkit`
      : "/api/copilotkit";

  return (
    <CopilotKit runtimeUrl={runtimeUrl} agentId="studybuddy_agent">
      <main className="flex flex-col items-center justify-between">
        <ResearchProvider>
          <ResearchWrapper />
        </ResearchProvider>
      </main>
    </CopilotKit>
  );
}
