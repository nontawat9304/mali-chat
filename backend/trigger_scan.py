import requests
import os
import time

URL = "http://localhost:8001/train/content_v2?filename=FORCE_DEBUG_LOG_CREATION.txt"
LOG_FILE = r"c:\Project\AInote\backend\scan_debug.log"

print(f"Triggering 404 on: {URL}")

try:
    resp = requests.get(URL)
    print(f"Status: {resp.status_code}")
    print(f"Response: {resp.text}")
except Exception as e:
    print(f"❌ Connection Failed: {e}")
    exit()

print(f"\nChecking for {LOG_FILE}...")
if os.path.exists(LOG_FILE):
    print("✅ LOG FILE CREATED!")
    with open(LOG_FILE, "r", encoding="utf-8") as f:
        print(f"CONTENT:\n{f.read()}")
else:
    print("❌ LOG FILE STILL NOT FOUND. Server is NOT running the new code.")
