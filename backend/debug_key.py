import os
from dotenv import load_dotenv

load_dotenv()

key = os.getenv("OPENAI_API_KEY")
url = os.getenv("OPENAI_BASE_URL")
model = os.getenv("OPENAI_MODEL_NAME")

print("--- DEBUG VARIABLE LOADING ---")
if key:
    print(f"Key Found: Yes")
    print(f"Key Length: {len(key)}")
    print(f"Key Start: '{key[:6]}...'")
    print(f"Key End:   '...{key[-4:]}'")
    if key.startswith("apikey-"):
        print("Prefix 'apikey-' detected: YES")
    else:
        print("Prefix 'apikey-' detected: NO")
    
    if "9187e3" in key:
        print("⚠️ WARNING: Key matches the known Google Gemini Key signature.")
else:
    print("Key Found: NO")

print(f"URL: '{url}'")
print(f"Model: '{model}'")
print("------------------------------")
