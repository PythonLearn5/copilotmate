"""Demo"""

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
import uvicorn
from copilotkit.integrations.fastapi import add_fastapi_endpoint

try:
    from copilotkit import CopilotKitRemoteEndpoint, LangGraphAGUIAgent
except ImportError:
    raise ImportError(
        "\n*** CopilotKit 0.1.96+ is required for AG-UI protocol support. ***\n"
        "Please upgrade:\n"
        "  pip install copilotkit>=0.1.96\n"
        "  # or with poetry:\n"
        "  poetry add copilotkit>=0.1.96\n"
    )

from ai_researcher.agent import graph

app = FastAPI()
sdk = CopilotKitRemoteEndpoint(
    agents=[
        LangGraphAGUIAgent(
            name="studybuddy_agent",
            description="Study Search agent.",
            graph=graph,
        )
    ],
)

add_fastapi_endpoint(app, sdk, "/copilotkit")

def main():
    """Run the uvicorn server."""
    uvicorn.run("ai_researcher.demo:app", host="127.0.0.1", port=8000, reload=True)
