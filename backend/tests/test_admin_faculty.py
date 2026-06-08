import requests
res = requests.post('http://localhost:8000/api/v1/auth/login', data={'username': 'shivateja', 'password': 'password123'})
token = res.json().get('access_token')
r = requests.get('http://localhost:8000/api/v1/admin/faculty', headers={'Authorization': f'Bearer {token}'})
print(r.status_code)
print(r.text)
