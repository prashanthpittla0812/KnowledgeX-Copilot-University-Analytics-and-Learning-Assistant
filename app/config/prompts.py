def get_prompt(
        context,
        question_type,
        difficulty,
        num_questions
):

    if question_type.lower() == "mcq":

        return f"""
You are an academic quiz generator.

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

{context}
"""

    elif question_type.lower() == "fill_blanks":

        return f"""
Generate exactly {num_questions} Fill in the Blank questions.

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

{context}
"""

    elif question_type.lower() == "theory":

        return f"""
Generate exactly {num_questions} Theory questions.

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

{context}
"""

    else:

        return f"""
Generate exactly {num_questions} mixed questions.

Include:
- MCQ
- Fill Blank
- Theory

Return ONLY JSON.

Context:

{context}
"""