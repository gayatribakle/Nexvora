"""Test workers API endpoint"""
import requests
import json

# First login
login_url = "http://localhost:8000/api/auth/login"
login_data = {"username": "admin", "password": "admin123"}

print("Logging in...")
login_response = requests.post(login_url, json=login_data)
print(f"Login status: {login_response.status_code}")

if login_response.status_code == 200:
    token = login_response.json()["access_token"]
    print(f"Token: {token[:50]}...\n")
    
    # Test workers list
    workers_url = "http://localhost:8000/api/workers"
    headers = {"Authorization": f"Bearer {token}"}
    
    print("Fetching workers...")
    workers_response = requests.get(workers_url, headers=headers, params={"page": 1, "limit": 20})
    print(f"Workers status: {workers_response.status_code}")
    
    if workers_response.status_code == 200:
        data = workers_response.json()
        print(f"\nTotal workers: {data.get('total', 0)}")
        print(f"Page: {data.get('page', 0)}")
        print(f"Limit: {data.get('limit', 0)}")
        print(f"\nFirst 3 workers:")
        
        for worker in data.get('workers', [])[:3]:
            print(f"\n  - {worker.get('full_name', 'Unknown')}")
            print(f"    Employee ID: {worker.get('employee_id', 'N/A')}")
            print(f"    Department: {worker.get('department', 'N/A')}")
            print(f"    Safety Score: {worker.get('safety_score', 'N/A')}")
            print(f"    Total Violations: {worker.get('total_violations', 0)}")
            print(f"    Total Fines: {worker.get('total_fines', 0)}")
            print(f"    Total Fine Amount: Rs.{worker.get('total_fine_amount', 0)}")
    else:
        print(f"Error: {workers_response.text}")
else:
    print(f"Login failed: {login_response.text}")
