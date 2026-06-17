import urllib.request, json
try:
    req = urllib.request.Request('http://127.0.0.1:8000/api/auth/login', data=b'username=Jack&password=password123')
    with urllib.request.urlopen(req) as response:
        token = json.loads(response.read())['access_token']
        print('Token:', token)
        
    data = json.dumps({"status": "APPROVED", "remarks": "test", "to_email": "test@test.com", "cc_email": ""}).encode('utf-8')
    req2 = urllib.request.Request('http://127.0.0.1:8000/api/requests/43/stage1', data=data, headers={'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json'})
    with urllib.request.urlopen(req2) as response2:
        print('Response:', response2.read())
except Exception as e:
    print(e)
    if hasattr(e, 'read'):
        print(e.read())
