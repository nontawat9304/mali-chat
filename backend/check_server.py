import requests
try:
    resp = requests.get('http://localhost:8000/persona', timeout=2)
    print(resp.status_code)
except Exception as e:
    print("Down")
