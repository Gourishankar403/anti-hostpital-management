import requests

res = requests.post('http://127.0.0.1:8000/api/auth/login', data={'username': 'coo', 'password': 'coo123'})
print("Login status:", res.status_code)
if res.status_code == 200:
    print("Token:", res.json()['access_token'])
else:
    print("Response:", res.text)
