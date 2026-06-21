import requests
import urllib.parse

BASE_URL = "http://localhost:8000"

def test_endpoint(filename, use_query=False):
    if use_query:
        # TEST NEW ENDPOINT
        safe_name = urllib.parse.quote(filename)
        url = f"{BASE_URL}/train/content?filename={safe_name}"
    else:
        # TEST OLD ENDPOINT
        safe_name = urllib.parse.quote(filename)
        url = f"{BASE_URL}/train/content/{safe_name}"
        
    print(f"Testing URL: {url}")
    try:
        resp = requests.get(url)
        print(f"Status: {resp.status_code}")
        if resp.status_code == 200:
            print("✅ Success! Content length:", len(resp.text))
            return True
        else:
            print("❌ Failed:", resp.text)
            return False
    except Exception as e:
        print(f"❌ Exception: {e}")
        return False

print("--- TEST 1: assss.txt (ASCII) - Path Param ---")
test_endpoint("assss.txt", use_query=False)

print("\n--- TEST 2: assss.txt (ASCII) - Query Param ---")
test_endpoint("assss.txt", use_query=True)

print("\n--- TEST 3: ประชุม.txt (Thai) - Query Param ---")
test_endpoint("ประชุม.txt", use_query=True)

print("\n--- TEST 4: ประชุม.txt (Thai) - Path Param ---")
test_endpoint("ประชุม.txt", use_query=False)
