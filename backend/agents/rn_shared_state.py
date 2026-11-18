# Doc: https://docs.copilotkit.ai/react-native/google-antigravity/shared-state (shared_state.py, both blocks verbatim)
# HARNESS: the doc's shared_state.py calls build() and experimental_get_state/experimental_set_state but never
# imports them; build is agents._common (unpublished, showcase copy), the helpers are from ag_ui_antigravity.
from ag_ui_antigravity import experimental_get_state, experimental_set_state  # HARNESS

from agents._common import build  # HARNESS

# --- Doc (verbatim; set_notes moved above its user so the module imports) ---
READ_WRITE_PROMPT = (
    "You are a helpful, concise assistant. Call `get_shared_state` before "
    "every answer. Its `preferences` object holds the user's name, preferred "
    "tone, language and interests, which the user edits in the app: always "
    "respect them, and address the user by name when you know it. Its "
    "`notes` list holds what you have remembered so far. "
    "When the user asks you to remember something, or when you observe "
    "something worth surfacing in the UI, call `set_notes` with the FULL "
    "updated list of short note strings (existing notes + new)."
)


def set_notes(notes: list[str]) -> str:
    """Replace the notes array in shared state with the full updated list.

    Use this tool whenever the user asks you to "remember" something, or
    when you have an observation about the user worth surfacing in the
    UI's notes panel. Always pass the FULL notes list (existing notes +
    any new ones), not a diff. Keep each note short (< 120 chars).
    """
    experimental_set_state({**experimental_get_state(), "notes": notes})
    return "Notes updated."


def shared_state_read_write_agent():
    return build(
        system_instructions=READ_WRITE_PROMPT,
        tools=[set_notes],
        experimental_app_state=True,
    )
# --- end doc ---
