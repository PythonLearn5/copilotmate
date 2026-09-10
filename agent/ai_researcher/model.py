"""Model configuration for the LangGraph research agent.

Uses Vercel AI Gateway with OpenAI-compatible API calls.
Models are selected per scenario to balance quality and cost.
"""

import os
from langchain_openai import ChatOpenAI

VERCEL_AI_GATEWAY_BASE_URL = "https://ai-gateway.vercel.sh/v1"

# Default model if no override is set in the environment
DEFAULT_MODEL = "openai/gpt-4o-mini"

# Model selection by scenario
MODEL_BY_SCENARIO = {
    "planning": "openai/gpt-4o-mini",   # Breaking queries into steps — fast, good at structured output
    "search": "openai/gpt-4o-mini",      # Generating search queries — fast, simple task
    "extract": "openai/gpt-4o",          # Extracting info from search results — needs strong comprehension
    "summarize": "openai/gpt-4o",        # Producing the final summary — needs high-quality writing
}


def get_model(scenario: str = "planning"):
    """Build a chat model via Vercel AI Gateway (OpenAI-compatible).

    Args:
        scenario: One of "planning", "search", "extract", "summarize".
                  Determines which model is used.
    """

    api_key = os.environ.get("AI_GATEWAY_API_KEY")
    if not api_key:
        raise RuntimeError("AI_GATEWAY_API_KEY is required to run the StudyBuddy agent.")

    # Allow a single env override (AI_GATEWAY_MODEL) that applies to all scenarios,
    # otherwise pick the model appropriate for the scenario.
    model_name = os.environ.get("AI_GATEWAY_MODEL") or MODEL_BY_SCENARIO.get(scenario, DEFAULT_MODEL)

    return ChatOpenAI(
        model=model_name,
        temperature=0,
        api_key=api_key,
        base_url=VERCEL_AI_GATEWAY_BASE_URL,
    )
