import urllib.request
import json

url = "http://localhost:8000/forget"
data = json.dumps({"filename": "force_rebuild_dummy"}).encode("utf-8")
req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
try:
    with urllib.request.urlopen(req) as f:
        print(f"Response: {f.read().decode('utf-8')}")
    print("Rebuild triggered successfully.")
except Exception as e:
    print(f"Failed to trigger rebuild: {e}")
