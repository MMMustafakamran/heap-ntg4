# HARNESS: not from the docs. Serves the "misc" group's Antigravity agents on :8158, one path per page.
# Only the subagents page needs an agent; webmcp and inspector use the quickstart BuiltInAgent runtime.
# Run: uv run uvicorn rn_misc_main:app --port 8158
from ag_ui_antigravity import create_antigravity_app

# HARNESS: the page's agent module is identical to the web harness's agents/subagents.py, reused.
from agents.subagents import subagents_agent

app = create_antigravity_app(subagents_agent(), path="/subagents")
