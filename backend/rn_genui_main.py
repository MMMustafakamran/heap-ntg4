# HARNESS: React Native "genui" group backend on :8155 (uv run uvicorn rn_genui_main:app --port 8155).
# None of these pages shows a server; wired like the quickstart main.py, one path per page.
# frontend-tools and tool-based both show the same agent file (gen_ui_tool_based.py), so the
# existing verbatim copy in agents/gen_ui_tool_based.py is reused for both.
# generative-ui is an overview page with no code: no agent.
from ag_ui_antigravity import create_antigravity_app

from agents.gen_ui_tool_based import gen_ui_tool_based_agent
from agents.rn_tool_rendering import tool_rendering_agent

app = create_antigravity_app(
    {
        "/frontend-tools": gen_ui_tool_based_agent(),
        "/tool-based": gen_ui_tool_based_agent(),
        "/tool-rendering": tool_rendering_agent(),
    },
    path="/",
)
