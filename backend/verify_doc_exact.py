import os
import requests
from dotenv import load_dotenv

load_dotenv()

# User's Doc URL: https://api.atlascloud.ai/v1/chat/completions
# (Previously I encountered 500 here, but let's blindly trust the doc now)
url = "https://api.atlascloud.ai/v1/chat/completions"

# Key from .env (which includes apikey- prefix confirmed)
api_key = os.getenv("OPENAI_API_KEY")

headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {api_key}"
}

# Use the exact model from the doc first, then the user's target
models_to_test = [
    "deepseek-ai/DeepSeek-V3-0324", # The one I saw in the list
    "zai-org/glm-4.7",              # The user's target
    "google/gemini-3-flash-preview-developer" # The one in the doc (might not be available to user)
]

print(f"--- DOC VERIFICATION ---")
print(f"URL: {url}")
print(f"Key: {api_key[:10]}...")

for model in models_to_test:
    data = {
        "model": model,
        "messages": [
            {
                "role": "user",
                "content": "what is difference between http and https"
            }
        ],
        "max_tokens": 100, # Keeping it small for test
        "temperature": 1,
        "repetition_penalty": 1.1,
        "stream": False # Try False first to read response easily
    }
    
    print(f"\n[Testing Model: {model}]")
    try:
        response = requests.post(url, headers=headers, json=data, timeout=20)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            print("✅ SUCCESS!")
            print(response.json())
            break
        else:
            print(f"❌ FAILED. Response: {response.text[:200]}")
    except Exception as e:
        print(f"Error: {e}")
