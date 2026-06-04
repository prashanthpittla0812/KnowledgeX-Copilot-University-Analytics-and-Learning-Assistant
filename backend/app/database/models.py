from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database.db import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="student")
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    documents = relationship("Document", back_populates="user", cascade="all, delete-orphan")
    quizzes = relationship("Quiz", back_populates="user", cascade="all, delete-orphan")
    study_plans = relationship("StudyPlan", back_populates="user", cascade="all, delete-orphan")
    recommendations = relationship("Recommendation", back_populates="user", cascade="all, delete-orphan")


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    upload_date = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="documents")


class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    topic = Column(String(255), nullable=False)
    score = Column(Float, nullable=True)
    quiz_data = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="quizzes")


class StudyPlan(Base):
    __tablename__ = "study_plans"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    plan_content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="study_plans")


class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    recommendation_text = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="recommendations")


class TeacherQuiz(Base):
    __tablename__ = "teacher_quizzes"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    teacher_name = Column(String(255), nullable=False)
    topic_name = Column(String(255), nullable=False)
    question_type = Column(String(50), nullable=False)
    difficulty = Column(String(50), nullable=False)
    num_questions = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    questions = relationship("TeacherQuizQuestion", back_populates="quiz", cascade="all, delete-orphan")
    results = relationship("TeacherQuizResult", back_populates="quiz", cascade="all, delete-orphan")


class TeacherQuizQuestion(Base):
    __tablename__ = "teacher_quiz_questions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    quiz_id = Column(Integer, ForeignKey("teacher_quizzes.id", ondelete="CASCADE"), nullable=False)
    question = Column(Text, nullable=False)
    options = Column(Text, nullable=True)
    answer = Column(String(500), nullable=False)

    quiz = relationship("TeacherQuiz", back_populates="questions")


class TeacherQuizResult(Base):
    __tablename__ = "teacher_quiz_results"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    quiz_id = Column(Integer, ForeignKey("teacher_quizzes.id", ondelete="CASCADE"), nullable=False)
    student_name = Column(String(255), nullable=False)
    total_questions = Column(Integer, nullable=False)
    correct_answers = Column(Integer, nullable=False)
    wrong_answers = Column(Integer, nullable=False)
    score_percentage = Column(Float, nullable=False)
    submitted_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    quiz = relationship("TeacherQuiz", back_populates="results")
