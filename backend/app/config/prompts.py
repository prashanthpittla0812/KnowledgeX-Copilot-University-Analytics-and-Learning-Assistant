RAG_QA_PROMPT_TEMPLATE = """You are KnowledgeX Copilot, an AI academic assistant.
You have access to a repository of reference documents. Use the following snippets to help answer the question if they are relevant. If they are not relevant or do not contain the answer, ignore them and answer the question directly using your own extensive general knowledge.

Reference snippets (may or may not be relevant):
{context}

Question: {question}

Instructions:
- Answer the question directly, creatively, and educationally.
- DO NOT say things like "Based on the provided context", "The context does not contain", "Unfortunately, the PDF doesn't mention", or make any reference to the existence of a "context" or "PDF".
- Seamlessly combine information from the reference snippets (if helpful) and your own general knowledge.
- If the reference snippets do not contain the answer, answer the question completely on your own without apologizing or mentioning that the reference snippets are missing the information.
- Use clear formatting, bullet points, and examples where appropriate to explain concepts.

Answer:"""


QUIZ_GENERATION_PROMPT_TEMPLATE = """You are an expert university professor creating a quiz.
Generate {number_of_questions} multiple-choice questions on the topic "{topic}" at "{difficulty}" difficulty.

Return ONLY valid JSON in this exact format:
{{
  "quiz": [
    {{
      "question": "What is...?",
      "options": ["A", "B", "C", "D"],
      "correct_answer": "A",
      "explanation": "Brief explanation of why A is correct."
    }}
  ]
}}

Requirements:
- Exactly {number_of_questions} questions.
- 4 options per question.
- One clearly correct answer.
- Educational explanations.
- Difficulty: {difficulty}.

CRITICAL INSTRUCTION: Output ONLY raw JSON. Do NOT wrap the JSON in markdown blocks (e.g., ```json or ```). Do not include any conversational text before or after the JSON."""

STUDYPLAN_GENERATION_PROMPT_TEMPLATE = """You are an expert academic advisor creating a personalized study plan.

Subjects: {subjects}
Exam Date: {exam_date}
Daily Study Hours: {daily_hours}

Create a day-by-day study schedule covering all subjects before the exam date.

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

Ensure the plan is realistic, covers all subjects, and includes breaks.

CRITICAL INSTRUCTION: Output ONLY raw JSON. Do NOT wrap the JSON in markdown blocks (e.g., ```json or ```). Do not include any conversational text before or after the JSON."""

RECOMMENDATION_PROMPT_TEMPLATE = """Based on the following student data, generate personalized academic recommendations.

Student Performance Data:
{performance_data}

Weak Areas: {weak_areas}
Previous Quizzes: {quiz_history}

Return ONLY valid JSON in this exact format:
{{
  "weak_topics": ["Topic 1", "Topic 2"],
  "recommended_materials": [
    {{
      "topic": "Topic",
      "resource": "Recommended resource",
      "reason": "Why this is recommended"
    }}
  ],
  "suggested_quizzes": [
    {{
      "topic": "Topic to quiz on",
      "difficulty": "easy/medium/hard",
      "reason": "Why this quiz is suggested"
    }}
  ],
  "overall_advice": "General advice for the student"
}}

CRITICAL INSTRUCTION: Output ONLY raw JSON. Do NOT wrap the JSON in markdown blocks (e.g., ```json or ```). Do not include any conversational text before or after the JSON."""

TEACHER_MCQ_PROMPT_TEMPLATE = """You are an academic quiz generator.

Generate exactly {num_questions} Multiple Choice Questions.

Difficulty: {difficulty}

Use ONLY the provided context.

Return ONLY valid JSON.

Do NOT:
- Add explanations
- Add markdown
- Add ```json
- Add text before JSON
- Add text after JSON

Format:
[
  {{
    "question": "",
    "options": [
      "",
      "",
      "",
      ""
    ],
    "answer": ""
  }}
]

Context:
{context}"""

TEACHER_FILL_BLANKS_PROMPT_TEMPLATE = """Generate exactly {num_questions} Fill in the Blank questions.

Difficulty: {difficulty}

Use ONLY the provided context.

Return ONLY valid JSON.

Format:
[
  {{
    "question": "",
    "answer": ""
  }}
]

Context:
{context}"""

TEACHER_THEORY_PROMPT_TEMPLATE = """Generate exactly {num_questions} Theory questions.

Difficulty: {difficulty}

Use ONLY the provided context.

Return ONLY valid JSON.

Format:
[
  {{
    "question": ""
  }}
]

Context:
{context}"""

TEACHER_MIXED_PROMPT_TEMPLATE = """Generate exactly {num_questions} mixed questions.

Include:
- MCQ
- Fill Blank
- Theory

Return ONLY JSON.

Context:
{context}"""

LEARNING_GAPS_PROMPT_TEMPLATE = """Analyze the following class performance data and identify learning gaps.

Class Performance Data:
{class_performance_data}

Identify:
1. Topics where most students scored poorly.
2. Students who need extra attention.
3. Recommended interventions.

Return ONLY valid JSON in this exact format:
{{
  "learning_gaps": [
    {{
      "topic": "Topic name",
      "average_score": 65.0,
      "students_at_risk": ["student1", "student2"],
      "recommended_action": "Action to address this gap"
    }}
  ],
  "overall_class_health": "Poor / Average / Good / Excellent",
  "faculty_recommendations": ["Recommendation 1", "Recommendation 2"]
}}"""
