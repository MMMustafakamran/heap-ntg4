# Doc: https://docs.copilotkit.ai/react-native/google-antigravity/human-in-the-loop
# "Name the tool in the agent's instructions" -> hitl.py, verbatim below.
# Note: imports agents._common.build, which the page never publishes (harness copy in agents/_common.py).
# Note: the prompt names `book_call`, but the page's frontend (src/MeetingApproval.tsx) registers
# `schedule_meeting`. Kept as published.
from agents._common import build

HITL_IN_CHAT_PROMPT = (
    "You help users book an onboarding call with the sales team. "
    "When they ask to book a call, call the frontend-provided "
    "`book_call` tool with a short topic and the user's name. "
    "Keep any chat reply to one short sentence."
)


def hitl_in_chat_agent():
    return build(system_instructions=HITL_IN_CHAT_PROMPT)
