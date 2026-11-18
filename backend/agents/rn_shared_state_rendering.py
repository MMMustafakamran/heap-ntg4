# HARNESS (whole file): the "Render agent state in your app" page shows no agent at all. It says
# "If the backend owns the initial state, define it in the shared-state setup for your framework" and
# its Try it step asks the agent to add a task, but neither page gives an Antigravity agent that can
# write `items`. Written here following the Shared State page's pattern (experimental_app_state +
# a server tool using experimental_get_state/experimental_set_state). Guesswork = finding.
from ag_ui_antigravity import experimental_get_state, experimental_set_state

from agents._common import build

BOARD_PROMPT = (
    "You are a helpful, concise assistant for a task board. Call `get_shared_state` before every "
    "answer. Its `title` is the board name and its `items` list holds tasks as "
    "{id, label, done}. To add, remove or change tasks, call `set_items` with the FULL updated list."
)


def set_items(items: list[dict]) -> str:
    """Replace the board's items with the full updated list of {id, label, done} objects."""
    experimental_set_state({**experimental_get_state(), "items": items})
    return "Board updated."


def task_board_agent():
    return build(system_instructions=BOARD_PROMPT, tools=[set_items], experimental_app_state=True)
