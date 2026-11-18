# HARNESS: the Headless Interrupts page shows no agent. This is the quickstart agent
# (backend/main.py, verbatim settings); the page relies on the frontend tool definition alone.
import os

from ag_ui_antigravity import AntigravityAgent


def hitl_headless_agent():
    return AntigravityAgent(
        model="gemini-2.5-flash",
        api_key=os.environ["GEMINI_API_KEY"],
        system_instructions="You are a helpful assistant embedded in a CopilotKit app.",
        workspaces=["/srv/agents/w1"],
    )
