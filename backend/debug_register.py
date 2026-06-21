import requests
import json
import traceback

url = "http://localhost:8000/auth/register"
payload = {
    "email": "test@example.com",
    "password": "password123",
    "nickname": "TestUser"
}
headers = {
    "Content-Type": "application/json"
}

try:
    print(f"Sending POST to {url}...")
    response = requests.post(url, json=payload, headers=headers)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print("Request failed!")
    traceback.print_exc()
