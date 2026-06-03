import json
import re

from langchain_ollama import OllamaLLM

from app.config.prompts import get_prompt
from app.services.rag_service import retrieve_context


class QuizService:

    def __init__(self):

        self.llm = OllamaLLM(
            model="llama3"
        )

    def generate_quiz(
            self,
            topic_name,
            question_type,
            difficulty,
            num_questions
    ):

        try:

            print("\n===================================")
            print("STEP 1 : RETRIEVING CONTEXT")
            print("===================================")

            context = retrieve_context(
                topic_name,
                topic_name
            )

            print("\n========== CONTEXT ==========")

            if context:
                print(context[:1000])
            else:
                print("No context found")

            prompt = get_prompt(
                context=context,
                question_type=question_type,
                difficulty=difficulty,
                num_questions=num_questions
            )

            print("\n========== PROMPT ==========")
            print(prompt[:1000])

            response = self.llm.invoke(prompt)

            print("\n========== RAW RESPONSE ==========")
            print(response)

            # Extract JSON from model response
            json_match = re.search(
                r"\[.*\]",
                response,
                re.DOTALL
            )

            if json_match:

                json_text = json_match.group(0)

                questions = json.loads(json_text)

                return {
                    "status": "success",
                    "topic_name": topic_name,
                    "question_type": question_type,
                    "difficulty": difficulty,
                    "questions": questions
                }

            return {
                "status": "error",
                "message": "No JSON found in response",
                "raw_response": response
            }

        except Exception as e:

            return {
                "status": "error",
                "message": str(e)
            }


quiz_service = QuizService()