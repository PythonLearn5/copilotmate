import {
  CopilotRuntime,
  BuiltInAgent,
  createCopilotHonoHandler,
} from "@copilotkit/runtime/v2";
import { HttpAgent } from "@ag-ui/client";
import { createGatewayProvider } from "@ai-sdk/gateway";
import { NextRequest } from "next/server";

const remoteActionUrl =
  process.env.COPILOTKIT_REMOTE_ACTION_URL ?? "http://127.0.0.1:8000/copilotkit";

const apiKey = process.env.AI_GATEWAY_API_KEY ?? "";

// Vercel AI Gateway provider for LLM calls
const gateway = createGatewayProvider({ apiKey });

// Register agents: "default" (built-in with LLM) + "studybuddy_agent" (remote Python agent)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const studybuddyAgent: any = new HttpAgent({
  agentId: "studybuddy_agent",
  url: remoteActionUrl,
});

const runtime = new CopilotRuntime({
  agents: {
    default: new BuiltInAgent({
      model: gateway("openai/gpt-4o"),
    }),
    studybuddy_agent: studybuddyAgent,
  },
});

// v2 single-route endpoint (Hono app)
const app = createCopilotHonoHandler({
  runtime,
  basePath: "/api/copilotkit",
  mode: "single-route",
});

export const dynamic = "force-dynamic";

const handleRequest = (req: NextRequest) => {
  if (!process.env.AI_GATEWAY_API_KEY) {
    return Response.json(
      {
        error:
          "AI_GATEWAY_API_KEY is required to use the CopilotKit runtime endpoint.",
      },
      { status: 500 }
    );
  }
  return app.fetch(req);
};

export const POST = handleRequest;
export const GET = handleRequest;
