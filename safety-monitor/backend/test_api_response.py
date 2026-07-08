import requests
import json

# Test the violations API
url = "http://localhost:8000/api/violations?page=1&limit=5"

# Login first to get token
login_url = "http://localhost:8000/api/auth/login"
login_data = {
    "username": "admin",
    "password": "admin123"
}

login_response = requests.post(login_url, json=login_data)
token = login_response.json()["access_token"]

# Get violations with auth
headers = {"Authorization": f"Bearer {token}"}
response = requests.get(url, headers=headers)

print(f"Status Code: {response.status_code}")
print(f"\nResponse JSON (first 2 violations):")

data = response.json()
print(f"Total violations: {data.get('total')}")
print(f"\nSample violations:")

for v in data.get('violations', [])[:2]:
    print(f"\n  ID: {v['id']}")
    print(f"  Type: {v['violation_type']}")
    print(f"  Worker: {v['worker_name']}")
    print(f"  evidence_path: {v.get('evidence_path')}")
    print(f"  screenshot_path: {v.get('screenshot_path')}")
