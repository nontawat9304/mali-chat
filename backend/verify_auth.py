import os
import requests
from dotenv import load_dotenv

load_dotenv()

raw_key = os.getenv("OPENAI_API_KEY")
url = "https://api.atlascloud.ai/api/v1/chat/completions"
model = os.getenv("OPENAI_MODEL_NAME")

print(f"--- AUTH DEBUGGER ---")
print(f"URL: {url}")
print(f"Model: {model}")
print(f"Raw Key: {raw_key[:5]}...{raw_key[-4:]}")

data = {
    "model": model,
    "messages": [{"role": "user", "content": "Hi"}],
    "max_tokens": 5
}

# 1. Standard Bearer with raw key
headers1 = {"Authorization": f"Bearer {raw_key}"}
print(f"\n[Test 1] Header: 'Authorization: Bearer {raw_key[:5]}...'")
try:
    resp = requests.post(url, json=data, headers=headers1, timeout=5)
    print(f"Status: {resp.status_code}")
except Exception as e: print(e)

# 2. Bearer WITHOUT 'apikey-' prefix (if present)
if raw_key.startswith("apikey-"):
    stripped_key = raw_key.replace("apikey-", "")
    headers2 = {"Authorization": f"Bearer {stripped_key}"}
    print(f"\n[Test 2] Header: 'Authorization: Bearer {stripped_key[:5]}...' (Prefix Removed)")
    try:
        resp = requests.post(url, json=data, headers=headers2, timeout=5)
        print(f"Status: {resp.status_code}")
    except Exception as e: print(e)

# 3. No Bearer, just key
headers3 = {"Authorization": raw_key}
print(f"\n[Test 3] Header: 'Authorization: {raw_key[:5]}...' (No Bearer)")
try:
    resp = requests.post(url, json=data, headers=headers3, timeout=5)
    print(f"Status: {resp.status_code}")
except Exception as e: print(e)

# 4. X-API-KEY header
headers4 = {"x-api-key": raw_key}
print(f"\n[Test 4] Header: 'x-api-key: {raw_key[:5]}...'")
try:
    resp = requests.post(url, json=data, headers=headers4, timeout=5)
    print(f"Status: {resp.status_code}")
except Exception as e: print(e)
