import urllib.request
import json

try:
    url = "http://localhost:8000/uploads/materials/f6fd89c6-1df6-4fa1-a7a2-e9ca6ff80860.pdf"
    response = urllib.request.urlopen(url)
    print("Status:", response.status)
    print("Content-Type:", response.getheader('Content-Type'))
    content = response.read(100)
    print("Content preview:", content)
except Exception as e:
    print(e)
