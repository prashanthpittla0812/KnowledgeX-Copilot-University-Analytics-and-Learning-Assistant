import requests
res = requests.post('http://localhost:8000/api/v1/auth/login', data={'username': 'akshaya', 'password': 'password123'})
token = res.json().get('access_token')
print("At risk:", requests.get('http://localhost:8000/api/v1/attendance/at-risk', headers={'Authorization': f'Bearer {token}'}).json())
print("Class trends:", requests.get('http://localhost:8000/api/v1/attendance/class', headers={'Authorization': f'Bearer {token}'}).json())
