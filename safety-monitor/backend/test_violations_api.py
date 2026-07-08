"""Test violations API endpoint"""
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
    
    # Test violations list
    violations_url = "http://localhost:8000/api/violations"
    headers = {"Authorization": f"Bearer {token}"}
    
    print("Fetching violations...")
    violations_response = requests.get(violations_url, headers=headers, params={"page": 1, "limit": 10})
    print(f"Violations status: {violations_response.status_code}")
    
    if violations_response.status_code == 200:
        data = violations_response.json()
        print(f"\nTotal violations: {data.get('total', 0)}")
        print(f"Page: {data.get('page', 0)}")
        print(f"Limit: {data.get('limit', 0)}")
        print(f"\nFirst 10 violations:")
        
        for v in data.get('violations', [])[:10]:
            fine_amt = v.get('fine_amount', 0)
            fine_status = "PAID" if v.get('fine_is_paid') else ("PENDING" if v.get('fine_id') else "NO FINE")
            print(f"\n  ID: {v.get('id')}")
            print(f"  Worker: {v.get('worker_name')} ({v.get('worker_employee_id')})")
            print(f"  Type: {v.get('violation_type')}")
            print(f"  Status: {v.get('status')}")
            print(f"  Fine: Rs.{fine_amt} [{fine_status}]")
    else:
        print(f"Error: {violations_response.text}")
else:
    print(f"Login failed: {login_response.text}")
