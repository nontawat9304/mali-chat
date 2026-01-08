import os
import requests
from dotenv import load_dotenv

load_dotenv()

key = os.getenv("OPENAI_API_KEY")
model = os.getenv("OPENAI_MODEL_NAME")
# Force the correct URL we found verify_auth.py validation
url = "https://api.atlascloud.ai/api/v1/chat/completions"

headers = {
    "Authorization": f"Bearer {key}",
    "Content-Type": "application/json"
}

print(f"--- MINIMAL PAYLOAD TEST ---")
print(f"URL: {url}")
print(f"Model: {model}")

# Payload 1: Absolute Minimum
data1 = {
    "model": model,
    "messages": [{"role": "user", "content": "Hi"}],
    # No max_tokens, temperature, etc.
}

print("\n[Test 1] Minimal Payload")
try:
    resp = requests.post(url, json=data1, headers=headers, timeout=10)
    print(f"Status: {resp.status_code}")
    print(f"Response: {resp.text[:200]}")
except Exception as e: print(e)

# Payload 2: With Stream=False (Explicit)
data2 = {
    "model": model,
    "messages": [{"role": "user", "content": "Hi"}],
    "stream": False
}
print("\n[Test 2] With Stream=False")
try:
    resp = requests.post(url, json=data2, headers=headers, timeout=10)
    print(f"Status: {resp.status_code}")
    print(f"Response: {resp.text[:200]}")
except Exception as e: print(e)

# Payload 3: Standard Params (simulating openai lib defaults roughly)
data3 = {
    "model": model,
    "messages": [{"role": "user", "content": "Hi"}],
    "temperature": 0.7,
    "max_tokens": 100
}
print("\n[Test 3] With Temp & MaxTokens")
try:
    resp = requests.post(url, json=data3, headers=headers, timeout=10)
    print(f"Status: {resp.status_code}")
    print(f"Response: {resp.text[:200]}")
except Exception as e: print(e)
