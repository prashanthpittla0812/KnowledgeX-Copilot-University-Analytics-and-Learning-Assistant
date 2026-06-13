import time
from langchain.chat_models import init_chat_model

STUDYPLAN_GENERATION_PROMPT_TEMPLATE = """You are an expert academic advisor creating a personalized study plan.

Current Date: {current_date}
Subjects: {subjects}
Syllabus / Topics to cover: {syllabus}
Exam Date: {exam_date}
Daily Study Hours: {daily_hours}

Create a day-by-day study schedule covering the specified subjects and syllabus topics before the exam date.

Return ONLY valid JSON in this exact format:
{{
  "plan": {{
    "overview": "Brief overview of the study plan.",
    "daily_schedule": [
      {{
        "day": 1,
        "date": "YYYY-MM-DD",
        "subject": "Subject Name",
        "topics": ["Topic 1", "Topic 2"],
        "duration_hours": 2.0,
        "activities": ["Read chapter", "Practice problems"],
        "resources": ["Textbook chapter X", "Online resource Y"]
      }}
    ],
    "tips": ["Tip 1", "Tip 2"],
    "milestones": ["Milestone 1", "Milestone 2"]
  }}
}}

Ensure the plan is realistic, covers all specified subjects and syllabus topics systematically, and includes breaks.

CRITICAL INSTRUCTION: Output ONLY raw JSON. Do NOT wrap the JSON in markdown blocks (e.g., ```json or ```). Do not include any conversational text before or after the JSON."""

def test():
    api_key = "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"
    llm = init_chat_model(
        "llama-3.1-8b-instant",
        model_provider="groq",
        api_key=api_key,
        temperature=0.3,
        max_tokens=4096,
    )
    
    prompt = STUDYPLAN_GENERATION_PROMPT_TEMPLATE.format(
        current_date="2026-06-12",
        subjects=["operating system"],
        syllabus="deadlock , threads, multithreading",
        exam_date="2026-06-15",
        daily_hours=2,
    )
    
    print("Sending study plan prompt to Groq...")
    start = time.time()
    try:
        response = llm.invoke(prompt)
        print(f"Response received in {time.time() - start:.2f} seconds.")
        print("\n--- CONTENT ---")
        print(response.content)
        print("----------------")
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    test()
