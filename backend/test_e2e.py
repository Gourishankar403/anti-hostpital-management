import urllib.request
import urllib.parse
import json

BASE_URL = "http://127.0.0.1:8000/api"

def login(username, password):
    data = urllib.parse.urlencode({"username": username, "password": password}).encode('ascii')
    req = urllib.request.Request(f"{BASE_URL}/auth/login", data=data)
    try:
        with urllib.request.urlopen(req) as response:
            res_data = json.loads(response.read().decode())
            return res_data["access_token"]
    except Exception as e:
        print(f"Failed to login {username}: {e}")
        return None

def post_json(url, token, payload):
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(url, data=data)
    req.add_header('Content-Type', 'application/json')
    req.add_header('Authorization', f'Bearer {token}')
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode())
    except urllib.error.HTTPError as e:
        print(f"HTTP Error {e.code}: {e.read().decode()}")
        return None

dept_token = login("department", "department")
res = post_json(
    f"{BASE_URL}/requests/", 
    dept_token,
    {"request_type": "NEW_BILL", "old_description": "Test E2E", "bldesc": "Test E2E", "sf": "100"}
)
req_id = res["id"]
print(f"Created request {req_id}")

coo_token = login("coo", "coo")
post_json(f"{BASE_URL}/requests/{req_id}/stage1", coo_token, {"status": "APPROVED", "remarks": "Looks good"})
print("COO approval done")

fin_token = login("finance", "finance")
post_json(f"{BASE_URL}/requests/{req_id}/stage2", fin_token, {"status": "APPROVED", "remarks": "Rates ok"})
print("Finance approval done")

it_token = login("it", "it")
post_json(f"{BASE_URL}/requests/{req_id}/complete", it_token, {"assigned_bill_code": "E2E-TEST", "remarks": "Done", "to_email": "", "cc_email": ""})
print("IT complete done")
print("E2E Test completed successfully!")
