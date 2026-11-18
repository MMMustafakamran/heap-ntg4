# HARNESS: React Native "state" group (Shared State, Render agent state in your app, Agent Read-Only
# Context). None of the pages shows a server that mounts its agent; wired like main.py / r5_main.py,
# one process on :8156, one path per page. agents/_common.py (build) is unpublished (showcase copy).
# Start: uv run uvicorn rn_state_main:app --port 8156
from ag_ui_antigravity import create_antigravity_app

from agents.app_context import app_context_agent  # same agent as the web page (verbatim doc copy)
from agents.rn_shared_state import shared_state_read_write_agent
from agents.rn_shared_state_rendering import task_board_agent

app = create_antigravity_app(
    {
        "/shared-state": shared_state_read_write_agent(),
        "/shared-state-rendering": task_board_agent(),
        "/agent-readonly": app_context_agent(),
    },
    path="/",
)
