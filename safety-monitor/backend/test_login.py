"""Test login endpoint"""
import requests
import json

url = "http://localhost:8000/api/auth/login"
data = {
    "username": "admin",
    "password": "admin123"
}

print(f"Testing login to: {url}")
print(f"Payload: {json.dumps(data, indent=2)}\n")

try:
    response = requests.post(url, json=data)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
except Exception as e:
    print(f"Error: {e}")
