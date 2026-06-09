from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text, Enum
from sqlalchemy.orm import relationship

from app.database.db import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="student")
    status = Column(String(50), nullable=False, default="PENDING")
    approved_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    approved_at = Column(DateTime, nullable=True)
    rejected_at = Column(DateTime, nullable=True)
    department = Column(String(255), nullable=True)
    designation = Column(String(255), nullable=True)
    must_change_password = Column(Boolean, default=False, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    documents = relationship("Document", back_populates="user", cascade="all, delete-orphan")
    quizzes = relationship("Quiz", back_populates="user", cascade="all, delete-orphan")
    study_plans = relationship("StudyPlan", back_populates="user", cascade="all, delete-orphan")
    recommendations = relationship("Recommendation", back_populates="user", cascade="all, delete-orphan")
    faculty_documents = relationship("FacultyDocument", back_populates="teacher", cascade="all, delete-orphan")
    created_quizzes = relationship("TeacherQuiz", back_populates="teacher", foreign_keys="TeacherQuiz.teacher_id", cascade="all, delete-orphan")
    quiz_attempts = relationship("QuizAttempt", back_populates="student", cascade="all, delete-orphan")
    topic_performances = relationship("TopicPerformance", back_populates="student", cascade="all, delete-orphan")
    topic_summaries = relationship("StudentTopicSummary", back_populates="student", cascade="all, delete-orphan")
    
    # Self-referential relationship for approver
    approved_users = relationship("User", back_populates="approver", foreign_keys=[approved_by])
    approver = relationship("User", back_populates="approved_users", remote_side=[id], foreign_keys=[approved_by])


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


class FacultyDocument(Base):
    __tablename__ = "faculty_documents"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    teacher_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    topic = Column(String(255), nullable=False)
    chunks_count = Column(Integer, default=0)
    uploaded_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    teacher = relationship("User", back_populates="faculty_documents")


class TeacherQuiz(Base):
    __tablename__ = "teacher_quizzes"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    teacher_name = Column(String(255), nullable=False)
    teacher_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    document_id = Column(Integer, ForeignKey("faculty_documents.id", ondelete="SET NULL"), nullable=True)
    topic_name = Column(String(255), nullable=False)
    question_type = Column(String(50), nullable=False)
    difficulty = Column(String(50), nullable=False)
    num_questions = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    teacher = relationship("User", back_populates="created_quizzes", foreign_keys=[teacher_id])
    document = relationship("FacultyDocument")
    questions = relationship("TeacherQuizQuestion", back_populates="quiz", cascade="all, delete-orphan")
    results = relationship("TeacherQuizResult", back_populates="quiz", cascade="all, delete-orphan")
    attempts = relationship("QuizAttempt", back_populates="quiz", cascade="all, delete-orphan")
    learning_gap_reports = relationship("LearningGapReport", back_populates="quiz", cascade="all, delete-orphan")


class TeacherQuizQuestion(Base):
    __tablename__ = "teacher_quiz_questions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    quiz_id = Column(Integer, ForeignKey("teacher_quizzes.id", ondelete="CASCADE"), nullable=False)
    question_type = Column(String(50), nullable=True)
    question = Column(Text, nullable=False)
    options = Column(Text, nullable=True)
    answer = Column(String(500), nullable=False)
    topic = Column(String(255), nullable=True)
    subtopic = Column(String(255), nullable=True)
    bloom_level = Column(String(50), nullable=True)

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


class StudentQuiz(Base):
    __tablename__ = "student_quizzes"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    topic_name = Column(String(255), nullable=False)
    question_type = Column(String(50), nullable=False)
    difficulty = Column(String(50), nullable=False)
    num_questions = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    questions = relationship("StudentQuizQuestion", back_populates="quiz", cascade="all, delete-orphan")
    results = relationship("StudentQuizResult", back_populates="quiz", cascade="all, delete-orphan")


class StudentQuizQuestion(Base):
    __tablename__ = "student_quiz_questions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    quiz_id = Column(Integer, ForeignKey("student_quizzes.id", ondelete="CASCADE"), nullable=False)
    question_type = Column(String(50), nullable=False)
    question = Column(Text, nullable=False)
    options = Column(Text, nullable=True)
    answer = Column(String(500), nullable=False)

    quiz = relationship("StudentQuiz", back_populates="questions")


class StudentQuizResult(Base):
    __tablename__ = "student_quiz_results"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    quiz_id = Column(Integer, ForeignKey("student_quizzes.id", ondelete="CASCADE"), nullable=False)
    student_name = Column(String(255), nullable=False)
    total_questions = Column(Integer, nullable=False)
    correct_answers = Column(Integer, nullable=False)
    wrong_answers = Column(Integer, nullable=False)
    score_percentage = Column(Float, nullable=False)
    submitted_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    quiz = relationship("StudentQuiz", back_populates="results")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    action = Column(String(255), nullable=False)
    performed_by = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    target_user = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)

    performer = relationship("User", foreign_keys=[performed_by])
    target = relationship("User", foreign_keys=[target_user])


class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    quiz_id = Column(Integer, ForeignKey("teacher_quizzes.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    score = Column(Float, nullable=False)
    percentage = Column(Float, nullable=False)
    total_questions = Column(Integer, nullable=False)
    correct_answers = Column(Integer, nullable=False)
    wrong_answers = Column(Integer, nullable=False)
    submitted_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    quiz = relationship("TeacherQuiz", back_populates="attempts")
    student = relationship("User", back_populates="quiz_attempts")
    answers = relationship("StudentAnswer", back_populates="attempt", cascade="all, delete-orphan")
    topic_performances = relationship("TopicPerformance", back_populates="attempt", cascade="all, delete-orphan")


class StudentAnswer(Base):
    __tablename__ = "student_answers"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    attempt_id = Column(Integer, ForeignKey("quiz_attempts.id", ondelete="CASCADE"), nullable=False)
    question_id = Column(Integer, ForeignKey("teacher_quiz_questions.id", ondelete="CASCADE"), nullable=False)
    selected_answer = Column(String(500), nullable=False)
    is_correct = Column(Boolean, nullable=False)

    attempt = relationship("QuizAttempt", back_populates="answers")
    question = relationship("TeacherQuizQuestion")


class TopicPerformance(Base):
    __tablename__ = "topic_performances"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    attempt_id = Column(Integer, ForeignKey("quiz_attempts.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    topic = Column(String(255), nullable=False)
    subtopic = Column(String(255), nullable=True)
    correct = Column(Integer, default=0)
    total = Column(Integer, default=0)
    accuracy = Column(Float, default=0.0)

    attempt = relationship("QuizAttempt", back_populates="topic_performances")
    student = relationship("User", back_populates="topic_performances")


class StudentTopicSummary(Base):
    __tablename__ = "student_topic_summaries"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    topic = Column(String(255), nullable=False)
    subtopic = Column(String(255), nullable=True)
    total_attempts = Column(Integer, default=0)
    total_correct = Column(Integer, default=0)
    total_questions = Column(Integer, default=0)
    average_accuracy = Column(Float, default=0.0)
    last_updated = Column(DateTime, default=datetime.utcnow)

    student = relationship("User", back_populates="topic_summaries")


class LearningGapReport(Base):
    __tablename__ = "learning_gap_reports"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    teacher_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    quiz_id = Column(Integer, ForeignKey("teacher_quizzes.id", ondelete="CASCADE"), nullable=False)
    report_data = Column(Text, nullable=False)
    ai_recommendations = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    quiz = relationship("TeacherQuiz", back_populates="learning_gap_reports")


class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    date = Column(DateTime, default=datetime.utcnow, nullable=False)
    status = Column(String(50), nullable=False) # "present" or "absent"

    student = relationship("User")


class FacultyInsight(Base):
    __tablename__ = "faculty_insights"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    teacher_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    insight_text = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    teacher = relationship("User")

class LearningMaterial(Base):
    __tablename__ = "learning_materials"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    faculty_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    subject = Column(String(100), nullable=False)
    topic = Column(String(100), nullable=False)
    department = Column(String(100), nullable=True)
    semester = Column(Integer, nullable=True)
    material_type = Column(Enum("PDF", "PPT", "DOC", "NOTE", "ASSIGNMENT", "LINK", "VIDEO", name="material_type"), nullable=False)
    file_path = Column(String(500), nullable=True)
    file_url = Column(String(500), nullable=True)
    file_size_bytes = Column(Integer, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    faculty = relationship("User")
    activities = relationship("MaterialActivity", back_populates="material", cascade="all, delete-orphan")
    bookmarks = relationship("MaterialBookmark", back_populates="material", cascade="all, delete-orphan")

class MaterialActivity(Base):
    __tablename__ = "material_activities"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    material_id = Column(Integer, ForeignKey("learning_materials.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    action_type = Column(String(50), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)

    material = relationship("LearningMaterial", back_populates="activities")
    student = relationship("User")

class MaterialBookmark(Base):
    __tablename__ = "material_bookmarks"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    material_id = Column(Integer, ForeignKey("learning_materials.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    is_active = Column(Boolean, default=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)

    material = relationship("LearningMaterial", back_populates="bookmarks")
    user = relationship("User")

class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    link = Column(String(500), nullable=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User")

class ProcessedContent(Base):
    __tablename__ = "processed_content"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String(255), nullable=False)
    source_type = Column(String(50), nullable=False) # PDF, IMAGE, OCR, AUDIO, VIDEO
    transcript = Column(Text, nullable=True)
    ocr_text = Column(Text, nullable=True)
    summary = Column(Text, nullable=True)
    file_path = Column(String(500), nullable=False)
    uploaded_by = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User")
