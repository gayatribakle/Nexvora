import requests

# Test image access
url = "http://localhost:8000/uploads/evidence/no_hardhat_20260614_102712_416950.jpg"
r = requests.get(url)

print(f"Status Code: {r.status_code}")
print(f"Content-Type: {r.headers.get('content-type')}")
print(f"Size: {len(r.content)} bytes")

if r.status_code == 200:
    print("\n✅ Image is accessible!")
else:
    print(f"\n❌ Image not accessible. Status: {r.status_code}")
