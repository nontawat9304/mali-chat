import os
import requests
from dotenv import load_dotenv

load_dotenv()

key = os.getenv("OPENAI_API_KEY")
# Use the endpoint that we know "works" (returns 200 for GET models, even if POST chat errors)
# In step 2529, GET https://api.atlascloud.ai/v1/models returned 200 OK and found 119 models.
# Wait, verify_api used "https://api.atlascloud.ai/v1/models" and got 200.
# But verify_auth used "https://api.atlascloud.ai/api/v1/chat/completions" and got 500.

# Let's try listing from the /v1/models endpoint which we know is responsive.
url = "https://api.atlascloud.ai/v1/models"

headers = {
    "Authorization": f"Bearer {key}",
    "Content-Type": "application/json"
}

print(f"--- FETCHING MODELS ---")
print(f"URL: {url}")
try:
    resp = requests.get(url, headers=headers, timeout=10)
    print(f"Status: {resp.status_code}")
    if resp.status_code == 200:
        data = resp.json()
        models = data.get('data', [])
        print(f"Total Models Found: {len(models)}")
        print("First 20 Models:")
        for m in models[:20]:
            print(f" - {m['id']}")
            
        # Check specific ones
        target = "zai-org/glm-4.7"
        found = any(m['id'] == target for m in models)
        print(f"\nTarget '{target}' found? {'YES' if found else 'NO'}")
        
        target2 = "meta-llama/Meta-Llama-3-8B-Instruct"
        found2 = any(m['id'] == target2 for m in models)
        print(f"Target '{target2}' found? {'YES' if found2 else 'NO'}")

    else:
        print(f"Body: {resp.text}")
except Exception as e:
    print(f"Error: {e}")
