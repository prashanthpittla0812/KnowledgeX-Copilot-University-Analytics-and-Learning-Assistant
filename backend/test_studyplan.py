import requests
import json

def test_generate():
    email = "test_student_studyplan@gmail.com"
    password = "Password@123"
    
    # Try logging in
    login_url = "http://localhost:8000/api/v1/auth/login"
    login_payload = {
        "email": email,
        "password": password
    }
    
    print(f"Attempting to login as {email}...")
    try:
        r = requests.post(login_url, json=login_payload)
        if r.status_code == 200:
            login_data = r.json()
            token = login_data.get("access_token")
            print("Login successful! Token acquired.")
        else:
            # Try registering
            print("Login failed, attempting to register new user...")
            register_url = "http://localhost:8000/api/v1/auth/register"
            register_payload = {
                "name": "Test Student",
                "email": email,
                "password": password,
                "role": "student"
            }
            r = requests.post(register_url, json=register_payload)
            r.raise_for_status()
            register_data = r.json()
            token = register_data.get("access_token")
            print("Registration successful! Token acquired.")
            
        if not token:
            print("Failed to get token.")
            return
            
    except Exception as e:
        print("Auth failed:", e)
        return
        
    # 2. Generate Study Plan
    generate_url = "http://localhost:8000/api/v1/studyplan/generate"
    headers = {
        "Authorization": f"Bearer {token}"
    }
    generate_payload = {
        "subjects": ["DBMS", "Operating Systems", "Computer Networks"],
        "exam_date": "2026-07-01",
        "daily_hours": 3,
        "syllabus": "Relational Model, Normalization, Process Scheduling, Routing Algorithms"
    }
    
    print("\nAttempting to generate study plan...")
    try:
        r = requests.post(generate_url, json=generate_payload, headers=headers)
        print("Response status code:", r.status_code)
        if r.status_code != 200:
            print("Error response text:", r.text)
            return
        
        response_data = r.json()
        print("\nSuccessfully generated study plan response:")
        print(json.dumps(response_data, indent=2))
    except Exception as e:
        print("Generation request failed:", e)

if __name__ == "__main__":
    test_generate()
