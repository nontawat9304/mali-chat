import requests
import urllib.parse

filename = "ประชุม.txt"
encoded_filename = urllib.parse.quote(filename)
url = f"http://localhost:8000/train/content/{encoded_filename}"

print(f"Testing URL: {url}")

try:
    response = requests.get(url)
    print(f"Status Code: {response.status_code}")
    print(f"Response Body: {response.text}")
except Exception as e:
    print(f"Request Error: {e}")
