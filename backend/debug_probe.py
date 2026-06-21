import requests

BASE_URL = "http://localhost:8000"

print("--- DEBUG: LIST FILES ENDPOINT ---")
url = f"{BASE_URL}/train/debug/list"
try:
    resp = requests.get(url)
    print(f"Status: {resp.status_code}")
    if resp.status_code == 200:
        data = resp.json()
        print("CWD:", data.get("cwd"))
        print("Store:", data.get("data_store"))
        print("\nFiles Found:")
        for f in data.get("files", []):
            # Print only relevant parts to avoid spam
            if "assss" in f or "ประชุม" in f:
                print(f" - {f}")
    else:
        print("❌ Failed:", resp.text)
except Exception as e:
    print(f"❌ Exception: {e}")
