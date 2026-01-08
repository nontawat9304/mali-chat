import requests
import urllib.parse

BASE_URL = "http://localhost:8001"

def test_endpoint(filename):
    safe_name = urllib.parse.quote(filename)
    url = f"{BASE_URL}/train/content_v2?filename={safe_name}"
        
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

print("--- TEST V2: traintest.txt ---")
test_endpoint("traintest.txt")

print("\n--- TEST V2: ประชุม.txt ---")
test_endpoint("ประชุม.txt")
