# HARNESS: not from the docs. React Native HITL group (hitl, use-interrupt, hitl-headless,
# governed-actions): one process on :8157, one path per page, wired like r5_main.py.
# Start: uv run --no-sync uvicorn rn_hitl_main:app --port 8157
from ag_ui_antigravity import create_antigravity_app

from agents.rn_governed_actions import governed_actions_agent
from agents.rn_hitl import hitl_in_chat_agent
from agents.rn_hitl_headless import hitl_headless_agent
from agents.rn_use_interrupt import use_interrupt_agent

app = create_antigravity_app(
    {
        "/hitl": hitl_in_chat_agent(),
        "/use-interrupt": use_interrupt_agent(),
        "/hitl-headless": hitl_headless_agent(),
        "/governed-actions": governed_actions_agent(),
    },
    path="/",
)
