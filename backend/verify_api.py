import os
import requests
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("OPENAI_API_KEY")
# Try to get the "root" domain from the base_url to build variations
base_env = os.getenv("OPENAI_BASE_URL", "https://api.atlascloud.ai/v1")
if "/chat" in base_env:
    base_env = base_env.split("/chat")[0]
if "/v1" in base_env:
    root_url = base_env.split("/v1")[0].rstrip("/")
elif "/api" in base_env:
    root_url = base_env.split("/api")[0].rstrip("/")
else:
    root_url = "https://api.atlascloud.ai"

model_name = os.getenv("OPENAI_MODEL_NAME", "deepseek-ai/DeepSeek-V3-0324")

print(f"--- API SCANNER ---")
print(f"Root: {root_url}")
print(f"Model: {model_name}")

candidates = [
    f"{root_url}/v1/chat/completions",
    f"{root_url}/api/v1/chat/completions",
    f"{root_url}/chat/completions",
]

headers = {
    "Authorization": f"Bearer {api_key}",
    "Content-Type": "application/json"
}

data = {
    "model": model_name,
    "messages": [{"role": "user", "content": "Hi"}],
    "max_tokens": 5
}

for url in candidates:
    print(f"\n👉 Testing: {url}")
    try:
        resp = requests.post(url, json=data, headers=headers, timeout=10)
        print(f"Status: {resp.status_code}")
        print(f"Headers: {resp.headers}")
        try:
            print(f"Body: {resp.text[:200]}")
        except:
            print("Body: (Binary or Error)")
            
        if resp.status_code == 200:
            print("✅ SUCCESS! This is the correct URL.")
            break
    except Exception as e:
        print(f"Connection Error: {e}")
