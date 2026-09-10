import {
  CopilotRuntime,
  OpenAIAdapter,
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";
import { NextRequest } from "next/server";
import OpenAI from "openai";

const remoteActionUrl =
  process.env.COPILOTKIT_REMOTE_ACTION_URL ?? "http://127.0.0.1:8000/copilotkit";

const runtime = new CopilotRuntime({
  remoteActions: [
    {
      url: remoteActionUrl,
    },
  ],
});

export const dynamic = "force-dynamic";

export const POST = async (req: NextRequest) => {
  const apiKey = process.env.AI_GATEWAY_API_KEY;

  if (!apiKey) {
    return Response.json(
      {
        error:
          "AI_GATEWAY_API_KEY is required to use the CopilotKit runtime endpoint.",
      },
      { status: 500 }
    );
  }

  const openai = new OpenAI({
    apiKey,
    baseURL: "https://ai-gateway.vercel.sh/v1",
  });

  const serviceAdapter = new OpenAIAdapter({
    openai,
    model: "openai/gpt-4o",
  });

  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter,
    endpoint: "/api/copilotkit",
  });

  return handleRequest(req);
};
