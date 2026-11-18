# HARNESS: the Governed Actions page's only agent code is a LangGraph agent.py
# (langchain_core / langgraph.types.interrupt), not Google Antigravity code. It is kept below
# as a comment for reference (wrong framework, can't run on the Antigravity adapter).
# The page's tool-call pattern (useHumanInTheLoop "approve_governed_action") needs only an agent
# that knows to call the tool; that prompt is written by the tester.
#
# --- Doc agent.py (LangGraph, verbatim, NOT used) ---
# import hashlib
# import json
#
# from langchain_core.tools import tool
# from langgraph.types import interrupt
#
#
# @tool
# def send_email(to: str, subject: str, body: str) -> str:
#     """Send an email. The user must approve it first."""
#     arguments = {"to": to, "subject": subject, "body": body}
#     action = {
#         # Derive the id from the arguments: LangGraph runs the tool again on resume.
#         "id": hashlib.sha256(json.dumps(arguments, sort_keys=True).encode()).hexdigest()[:16],
#         "summary": f"Send an email to {to}",
#         "tool": "send_email",
#         "reference": "policy:outbound-email",
#         "verdict": "require_approval",
#         "arguments": arguments,
#     }
#
#     response = interrupt({"action": action})
#
#     if (
#         isinstance(response, dict)
#         and response.get("approved")
#         and response.get("actionId") == action["id"]
#         and response.get("reference") == action["reference"]
#     ):
#         deliver_email(to, subject, body)  # your own email client
#         return f"Email sent to {to}."
#
#     return "The user did not approve this action. The email was not sent."
# --- end doc ---
import os

from ag_ui_antigravity import AntigravityAgent


def governed_actions_agent():
    return AntigravityAgent(
        model="gemini-2.5-flash",
        api_key=os.environ["GEMINI_API_KEY"],
        # HARNESS: tester-written instructions (page gives no Antigravity agent).
        system_instructions=(
            "You help users send emails. Before sending any email you MUST call the "
            "frontend-provided `approve_governed_action` tool with id (a short unique "
            "string), summary, tool='send_email', reference='policy:outbound-email', "
            "verdict='require_approval' and arguments {to, subject, body}. If the result "
            "has approved=true, say the email was sent; otherwise say it was not sent."
        ),
        workspaces=["/srv/agents/w1"],
    )
