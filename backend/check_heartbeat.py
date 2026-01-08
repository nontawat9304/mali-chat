import requests
import os
import time

URL = "http://localhost:8001/"
LOG_FILE = r"c:\Project\AInote\backend\startup.log"

print("--- DIAGNOSTIC: SERVER HEARTBEAT ---")

# 1. Check Log File
if os.path.exists(LOG_FILE):
    print("✅ startup.log FOUND")
    with open(LOG_FILE, "r") as f:
        print(f"   Content: {f.read().strip()}")
else:
    print("❌ startup.log NOT FOUND (Server did not run main block?)")

# 2. Check HTTP Reachability
try:
    print(f"Pinging {URL}...")
    resp = requests.get(URL, timeout=5)
    print(f"Status: {resp.status_code}")
    print(f"Body: {resp.text}")
except Exception as e:
    print(f"❌ HTTP Request Failed: {e}")
