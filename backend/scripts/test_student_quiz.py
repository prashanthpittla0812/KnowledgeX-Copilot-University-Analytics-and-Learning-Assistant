import requests

# Login as student
res = requests.post("http://127.0.0.1:8000/api/v1/auth/login", data={"username": "student@knowledgex.com", "password": "password"})
token = res.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

# Get assigned quizzes
res = requests.get("http://127.0.0.1:8000/api/v1/student/assigned-quizzes", headers=headers)
print("Assigned Quizzes Status:", res.status_code)
quizzes = res.json().get("quizzes", [])
if not quizzes:
    print("No assigned quizzes found!")
else:
    quiz_id = quizzes[0]["id"]
    print(f"Fetching quiz {quiz_id}...")
    
    # Get quiz details
    res = requests.get(f"http://127.0.0.1:8000/api/v1/student/quiz/{quiz_id}", headers=headers)
    print("Quiz Status:", res.status_code)
    if res.status_code != 200:
        print("Error:", res.text)
    else:
        quiz = res.json()
        print("Questions:", len(quiz.get("questions", [])))
        print(quiz)
