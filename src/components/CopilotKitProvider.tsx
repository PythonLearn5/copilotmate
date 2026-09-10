"use client";

import { CopilotKit } from "@copilotkit/react-core/v2";
import { ReactNode } from "react";

export function CopilotKitProvider({
  children,
  runtimeUrl,
  agent,
}: {
  children: ReactNode;
  runtimeUrl: string;
  agent?: string;
}) {
  // v2 uses new URL(runtimeUrl) which requires an absolute URL
  const absoluteUrl =
    typeof window !== "undefined" && !runtimeUrl.startsWith("http")
      ? `${window.location.origin}${runtimeUrl.startsWith("/") ? "" : "/"}${runtimeUrl}`
      : runtimeUrl;

  return (
    <CopilotKit runtimeUrl={absoluteUrl} agentId={agent}>
      {children}
    </CopilotKit>
  );
}
