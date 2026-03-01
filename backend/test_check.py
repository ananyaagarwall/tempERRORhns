#!/usr/bin/env python3
"""
run_all_tests.py

A self‑contained script that performs all of the quick‑test API calls you listed
in PowerShell, but using Python + the `requests` library.

The script follows the same order:
1.  Create a new session
2.  First query (show all 3 BHK properties in Ghansoli)
3.  Follow‑up query (deduplication test)
4.  Context‑retention query
5.  Check session state
6.  Retrieve learned preferences
7.  Track a property view interaction
8.  Get session history
9.  Get user‑level analytics
10. Compare two properties
11. Budget‑filter query
12. Health‑check endpoint
13. Sync the vector database
14. List all sessions for the user
15. Reset session tracking
(Deletion is left commented out – uncomment if you really want to delete.)

Author:  ChatGPT (Compound Mini)
"""

import json
import sys
from pathlib import Path

import requests

# ----------------------------------------------------------------------
# Configuration ---------------------------------------------------------
# ----------------------------------------------------------------------
BASE_URL = "http://127.0.0.1:5000"
USER_ID = 1

# Helper for pretty‑printing JSON responses
def pp(data):
    print(json.dumps(data, indent=2, ensure_ascii=False))


# ----------------------------------------------------------------------
# 1️⃣  Create a new session
# ----------------------------------------------------------------------
print("\n=== 1️⃣  Creating a new session ===")
resp = requests.post(
    f"{BASE_URL}/api/chatbot/session/new",
    json={"user_id": USER_ID},
    headers={"Content-Type": "application/json"},
)
resp.raise_for_status()
session_info = resp.json()
session_id = session_info["session_id"]
print(f"Session ID: {session_id}\n")


# ----------------------------------------------------------------------
# 2️⃣  First query – Show all 3 BHK properties in Ghansoli
# ----------------------------------------------------------------------
print("\n=== 2️⃣  First query – Show all 3 BHK properties in Ghansoli ===")
payload = {
    "message": "Show me ALL 3 BHK properties in Ghansoli",
    "user_id": USER_ID,
    "session_id": session_id,
}
resp = requests.post(
    f"{BASE_URL}/api/chatbot/ask",
    json=payload,
    headers={"Content-Type": "application/json"},
)
resp.raise_for_status()
result = resp.json()
print("\nResponse:")
print(result["response"])
print("\nStats:")
print(f"Properties shown: {result.get('stats', {}).get('properties_shown')}")


# ----------------------------------------------------------------------
# 3️⃣  Follow‑up query – Test deduplication
# ----------------------------------------------------------------------
print("\n=== 3️⃣  Follow‑up query – Test deduplication ===")
payload2 = {
    "message": "Show me other 3BHK properties in Ghansoli",
    "user_id": USER_ID,
    "session_id": session_id,
}
resp = requests.post(
    f"{BASE_URL}/api/chatbot/ask",
    json=payload2,
    headers={"Content-Type": "application/json"},
)
resp.raise_for_status()
result2 = resp.json()
print("\nResponse:")
print(result2["response"])
print("\nStats:")
print(f"Total properties shown: {result2.get('stats', {}).get('properties_shown')}")


# ----------------------------------------------------------------------
# 4️⃣  Context retention – ask about the first property
# ----------------------------------------------------------------------
print("\n=== 4️⃣  Context retention – ask about the first property ===")
payload3 = {
    "message": "Tell me more about the first property",
    "user_id": USER_ID,
    "session_id": session_id,
}
resp = requests.post(
    f"{BASE_URL}/api/chatbot/ask",
    json=payload3,
    headers={"Content-Type": "application/json"},
)
resp.raise_for_status()
result3 = resp.json()
print("\nResponse:")
print(result3["response"])


# ----------------------------------------------------------------------
# 5️⃣  Check session state
# ----------------------------------------------------------------------
print("\n=== 5️⃣  Check session state ===")
resp = requests.get(f"{BASE_URL}/api/chatbot/session/{session_id}/state")
resp.raise_for_status()
state = resp.json()
print("\nState:")
print(f"State          : {state.get('state')}")
print(f"Lead Quality   : {state.get('lead_quality')}")
print(f"Properties Shown: {state.get('properties_shown')}")


# ----------------------------------------------------------------------
# 6️⃣  Retrieve learned preferences for the user
# ----------------------------------------------------------------------
print("\n=== 6️⃣  Retrieve learned preferences ===")
resp = requests.get(f"{BASE_URL}/api/chatbot/preferences/{USER_ID}")
resp.raise_for_status()
prefs = resp.json()
print("\nPreferences:")
pp(prefs.get("preferences", {}))


# ----------------------------------------------------------------------
# 7️⃣  Track a property view interaction
# ----------------------------------------------------------------------
print("\n=== 7️⃣  Track a property view interaction ===")
track_body = {
    "user_id": USER_ID,
    "property_id": 1,
    "action": "viewed",
    "duration": 45,
    "session_id": session_id,
}
resp = requests.post(
    f"{BASE_URL}/api/chatbot/track",
    json=track_body,
    headers={"Content-Type": "application/json"},
)
resp.raise_for_status()
print("Interaction tracked! (status code:", resp.status_code, ")")


# ----------------------------------------------------------------------
# 8️⃣  Get session history
# ----------------------------------------------------------------------
print("\n=== 8️⃣  Get session history ===")
resp = requests.get(f"{BASE_URL}/api/chatbot/session/{session_id}/history")
resp.raise_for_status()
history = resp.json()
messages = history.get("messages", [])
print(f"Messages in session: {len(messages)}")
for i, msg in enumerate(messages, 1):
    content_preview = msg["content"][:50] + ("…" if len(msg["content"]) > 50 else "")
    print(f"{i:02d}. {msg['role']}: {content_preview}")


# ----------------------------------------------------------------------
# 9️⃣  Get user analytics
# ----------------------------------------------------------------------
print("\n=== 9️⃣  Get user analytics ===")
resp = requests.get(f"{BASE_URL}/api/chatbot/analytics/user/{USER_ID}")
resp.raise_for_status()
analytics = resp.json()
print("\nAnalytics:")
pp(analytics)


# ----------------------------------------------------------------------
# 🔟  Compare first and second properties
# ----------------------------------------------------------------------
print("\n=== 🔟  Compare first and second properties ===")
compare_body = {
    "message": "Compare the first and second properties",
    "user_id": USER_ID,
    "session_id": session_id,
}
resp = requests.post(
    f"{BASE_URL}/api/chatbot/ask",
    json=compare_body,
    headers={"Content-Type": "application/json"},
)
resp.raise_for_status()
compare_result = resp.json()
print("\nResponse:")
print(compare_result["response"])


# ----------------------------------------------------------------------
# 1️⃣1️⃣  Budget filter – properties under 1 Crore
# ----------------------------------------------------------------------
print("\n=== 1️⃣1️⃣  Budget filter – properties under 1 Crore ===")
budget_body = {
    "message": "Show me properties under 1 Crore",
    "user_id": USER_ID,
    "session_id": session_id,
}
resp = requests.post(
    f"{BASE_URL}/api/chatbot/ask",
    json=budget_body,
    headers={"Content-Type": "application/json"},
)
resp.raise_for_status()
budget_result = resp.json()
print("\nResponse:")
print(budget_result["response"])


# ----------------------------------------------------------------------
# 1️⃣2️⃣  Health check
# ----------------------------------------------------------------------
print("\n=== 1️⃣2️⃣  Health check ===")
resp = requests.get(f"{BASE_URL}/api/chatbot/health")
resp.raise_for_status()
health = resp.json()
print("\nHealth status:")
print(f"Status          : {health.get('status')}")
print(f"Database        : {health.get('database')}")
print(f"Active sessions : {health.get('active_sessions')}")


# ----------------------------------------------------------------------
# 1️⃣3️⃣  Sync vector database
# ----------------------------------------------------------------------
print("\n=== 1️⃣3️⃣  Sync vector database ===")
resp = requests.post(f"{BASE_URL}/api/chatbot/sync")
resp.raise_for_status()
print("Vector database synced! (status code:", resp.status_code, ")")


# ----------------------------------------------------------------------
# 1️⃣4️⃣  List all sessions for the user
# ----------------------------------------------------------------------
print("\n=== 1️⃣4️⃣  List all sessions for the user ===")
resp = requests.get(f"{BASE_URL}/api/chatbot/sessions/list", params={"user_id": USER_ID})
resp.raise_for_status()
sessions = resp.json()
session_list = sessions.get("sessions", [])
print(f"Total sessions: {len(session_list)}")
for s in session_list:
    print(
        f"Session {s.get('id')}: State={s.get('state')}, Quality={s.get('lead_quality')}"
    )


# ----------------------------------------------------------------------
# 1️⃣5️⃣  Reset session tracking
# ----------------------------------------------------------------------
print("\n=== 1️⃣5️⃣  Reset session tracking ===")
resp = requests.post(f"{BASE_URL}/api/chatbot/session/{session_id}/reset")
resp.raise_for_status()
print("Session tracking reset! (status code:", resp.status_code, ")")


# ----------------------------------------------------------------------
# (Optional) 1️⃣6️⃣  Delete the session – uncomment if you really want it
# ----------------------------------------------------------------------
# print("\n=== 1️⃣6️⃣  Delete the session (optional) ===")
# resp = requests.delete(f"{BASE_URL}/api/chatbot/session/{session_id}")
# resp.raise_for_status()
# print("Session deleted! (status code:", resp.status_code, ")")


print("\n✅ All tests completed.\n")