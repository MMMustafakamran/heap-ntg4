# HARNESS (React Native "chat" group): Prebuilt Components, Markdown, Headless UI and Multimodal
# Attachments show no agent at all. Each path serves the quickstart agent (main.py), one instance
# per page, in one process on :8154. Start: uv run uvicorn rn_chat_main:app --port 8154
import os

from ag_ui_antigravity import AntigravityAgent, create_antigravity_app


def quickstart_agent() -> AntigravityAgent:
    # HARNESS: copied from main.py (the web quickstart agent).
    return AntigravityAgent(
        model="gemini-2.5-flash",
        api_key=os.environ["GEMINI_API_KEY"],
        system_instructions="You are a helpful assistant embedded in a CopilotKit app.",
        workspaces=["/srv/agents/w1"],
    )


app = create_antigravity_app(
    {
        "/prebuilt-components": quickstart_agent(),
        "/markdown": quickstart_agent(),
        "/headless-ui": quickstart_agent(),
        "/multimodal-attachments": quickstart_agent(),
    },
    path="/",
)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
