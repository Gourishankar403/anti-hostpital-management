import requests

# Login
res = requests.post('http://127.0.0.1:8000/api/auth/login', data={'username':'coo', 'password':'password123'})
token = res.json().get('access_token')

# Approve
headers = {'Authorization': f'Bearer {token}'}
payload = {
    "status": "APPROVED",
    "remarks": "test",
    "to_email": "test@test.com",
    "cc_email": "test2@test.com"
}
res2 = requests.post('http://127.0.0.1:8000/api/requests/43/stage1', json=payload, headers=headers)
print("STATUS CODE:", res2.status_code)
print("RESPONSE:", res2.text)
