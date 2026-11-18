# HARNESS: the useInterrupt page's backend section says "Not available for Google Antigravity yet"
# and shows no agent. This agent is the harness fill-in: the quickstart AntigravityAgent with
# instructions to call the app's `schedule_meeting` frontend tool (what the page's prose asks for).
import os

from ag_ui_antigravity import AntigravityAgent


def use_interrupt_agent():
    return AntigravityAgent(
        model="gemini-2.5-flash",
        api_key=os.environ["GEMINI_API_KEY"],
        # HARNESS: instructions written by the tester (page gives none).
        system_instructions=(
            "You are a scheduling assistant. Whenever the user asks to book a call "
            "or schedule a meeting, call the frontend-provided `schedule_meeting` tool "
            "with a short `topic`. After it returns, confirm the chosen time or that "
            "the user cancelled, in one short sentence."
        ),
        workspaces=["/srv/agents/w1"],
    )
