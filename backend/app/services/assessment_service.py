import json

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.models import (
    QuizAttempt,
    StudentAnswer,
    StudentTopicSummary,
    TeacherQuiz,
    TeacherQuizQuestion,
    TopicPerformance,
)
from app.utils.logger import get_logger

logger = get_logger()


class AssessmentService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def submit_attempt(
        self,
        quiz_id: int,
        student_id: int,
        answers: list[dict],
    ) -> dict:
        result = await self.db.execute(
            select(TeacherQuiz).where(TeacherQuiz.id == quiz_id)
        )
        quiz = result.scalar_one_or_none()
        if not quiz:
            raise ValueError("Quiz not found")

        questions_result = await self.db.execute(
            select(TeacherQuizQuestion).where(TeacherQuizQuestion.quiz_id == quiz_id)
        )
        questions = questions_result.scalars().all()
        question_map = {q.id: q for q in questions}

        correct = 0
        wrong = 0
        topic_tracker: dict[str, dict] = {}

        answer_records = []
        for item in answers:
            q = question_map.get(item["question_id"])
            if not q:
                continue

            is_correct = (
                item["selected_answer"].strip().upper()
                == q.answer.strip().upper()
            )
            if is_correct:
                correct += 1
            else:
                wrong += 1

            answer_records.append({
                "question_id": q.id,
                "selected_answer": item["selected_answer"],
                "is_correct": is_correct,
            })

            topic_name = q.topic or quiz.topic_name
            subtopic = q.subtopic
            key = f"{topic_name}|{subtopic or ''}"
            if key not in topic_tracker:
                topic_tracker[key] = {
                    "topic": topic_name,
                    "subtopic": subtopic,
                    "correct": 0,
                    "total": 0,
                }
            topic_tracker[key]["total"] += 1
            if is_correct:
                topic_tracker[key]["correct"] += 1

        total = len(answers)
        percentage = (correct / total * 100) if total > 0 else 0

        from datetime import datetime
        attempt_res = await self.db.execute(
            select(QuizAttempt).where(
                QuizAttempt.quiz_id == quiz_id,
                QuizAttempt.student_id == student_id
            ).order_by(QuizAttempt.id.desc())
        )
        attempt = attempt_res.scalars().first()

        if attempt and attempt.status in ["IN_PROGRESS", "AUTO_SUBMITTED"]:
            attempt.score = correct
            attempt.percentage = percentage
            attempt.total_questions = total
            attempt.correct_answers = correct
            attempt.wrong_answers = wrong
            attempt.status = "COMPLETED" if attempt.status != "AUTO_SUBMITTED" else "AUTO_SUBMITTED"
            if not attempt.submitted_at:
                attempt.submitted_at = datetime.utcnow()
        else:
            attempt = QuizAttempt(
                quiz_id=quiz_id,
                student_id=student_id,
                score=correct,
                percentage=percentage,
                total_questions=total,
                correct_answers=correct,
                wrong_answers=wrong,
                attempt_type="practice",
                status="COMPLETED",
                submitted_at=datetime.utcnow()
            )
            self.db.add(attempt)
        await self.db.flush()
        await self.db.refresh(attempt)

        for ans in answer_records:
            self.db.add(StudentAnswer(
                attempt_id=attempt.id,
                question_id=ans["question_id"],
                selected_answer=ans["selected_answer"],
                is_correct=ans["is_correct"],
            ))

        topic_performances = []
        for key, data in topic_tracker.items():
            acc = (data["correct"] / data["total"] * 100) if data["total"] > 0 else 0
            tp = TopicPerformance(
                attempt_id=attempt.id,
                student_id=student_id,
                topic=data["topic"],
                subtopic=data["subtopic"],
                correct=data["correct"],
                total=data["total"],
                accuracy=round(acc, 2),
            )
            self.db.add(tp)
            topic_performances.append({
                "topic": data["topic"],
                "subtopic": data["subtopic"],
                "correct": data["correct"],
                "total": data["total"],
                "accuracy": round(acc, 2),
            })
            await self._update_topic_summary(student_id, data["topic"], data["subtopic"], data["correct"], data["total"])

        await self.db.flush()

        return {
            "attempt_id": attempt.id,
            "quiz_id": quiz_id,
            "score": correct,
            "percentage": round(percentage, 2),
            "total_questions": total,
            "correct_answers": correct,
            "wrong_answers": wrong,
            "topic_performances": topic_performances,
            "submitted_at": attempt.submitted_at,
        }

    async def _update_topic_summary(self, student_id: int, topic: str, subtopic: str | None, correct: int, total: int):
        result = await self.db.execute(
            select(StudentTopicSummary).where(
                StudentTopicSummary.student_id == student_id,
                StudentTopicSummary.topic == topic,
            )
        )
        summary = result.scalar_one_or_none()
        if summary:
            summary.total_attempts += 1
            summary.total_correct += correct
            summary.total_questions += total
            summary.average_accuracy = round(
                (summary.total_correct / summary.total_questions * 100)
                if summary.total_questions > 0 else 0, 2
            )
            summary.last_updated = __import__("datetime").datetime.utcnow()
        else:
            acc = (correct / total * 100) if total > 0 else 0
            self.db.add(StudentTopicSummary(
                student_id=student_id,
                topic=topic,
                subtopic=subtopic,
                total_attempts=1,
                total_correct=correct,
                total_questions=total,
                average_accuracy=round(acc, 2),
            ))

    async def get_student_results(self, student_id: int) -> dict:
        result = await self.db.execute(
            select(QuizAttempt)
            .where(QuizAttempt.student_id == student_id)
            .order_by(QuizAttempt.submitted_at.desc())
        )
        attempts = result.scalars().all()

        results = []
        for a in attempts:
            quiz = await self.db.get(TeacherQuiz, a.quiz_id)
            results.append({
                "quiz_id": a.quiz_id,
                "topic": quiz.topic_name if quiz else "Unknown",
                "difficulty": quiz.difficulty if quiz else "Unknown",
                "score": a.score,
                "percentage": a.percentage,
                "total_questions": a.total_questions,
                "correct_answers": a.correct_answers,
                "wrong_answers": a.wrong_answers,
                "submitted_at": a.submitted_at,
            })

        topic_result = await self.db.execute(
            select(StudentTopicSummary).where(
                StudentTopicSummary.student_id == student_id
            )
        )
        summaries = topic_result.scalars().all()
        topic_scores = [
            {
                "topic": s.topic,
                "subtopic": s.subtopic,
                "correct": s.total_correct,
                "total": s.total_questions,
                "accuracy": s.average_accuracy,
            }
            for s in summaries
        ]

        return {"results": results, "topic_summaries": topic_scores}

    async def get_student_recommendations(self, student_id: int) -> dict:
        result = await self.db.execute(
            select(StudentTopicSummary).where(
                StudentTopicSummary.student_id == student_id
            )
        )
        summaries = result.scalars().all()

        weak = []
        strong = []
        for s in summaries:
            item = {"topic": s.topic, "accuracy": s.average_accuracy, "total_questions": s.total_questions}
            if s.average_accuracy < 60:
                weak.append(item)
            else:
                strong.append(item)

        weak.sort(key=lambda x: x["accuracy"])
        strong.sort(key=lambda x: x["accuracy"], reverse=True)

        revision_topics = [w["topic"] for w in weak]
        recommended_quizzes = [f"Practice quiz on {t}" for t in revision_topics]

        return {
            "weak_topics": weak,
            "strong_topics": strong,
            "recommended_revision_topics": revision_topics,
            "recommended_quizzes": recommended_quizzes,
        }
