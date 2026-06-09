import re
from typing import Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.models import SecurityLog

class SecurityService:
    # Basic list of profanity and abusive words (expandable)
    PROFANITY_WORDS = {
        "fuck", "shit", "bitch", "asshole", "cunt", "slut", "whore", 
        "nigger", "faggot", "retard", "dick", "pussy", "cock", "bastard", "bullshit"
    }

    # Common prompt injection heuristics
    INJECTION_PATTERNS = [
        r"ignore previous instructions",
        r"forget previous instructions",
        r"disregard previous instructions",
        r"system prompt",
        r"you are now",
        r"act as a",
        r"bypass rules",
        r"jailbreak",
        r"what are your instructions",
        r"tell me your rules"
    ]

    # PII Regex Patterns
    PII_PATTERNS = {
        "EMAIL": r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+",
        "PHONE": r"\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}",
        "SSN": r"\d{3}-\d{2}-\d{4}"
    }

    @classmethod
    def detect_profanity(cls, text: str) -> bool:
        text_lower = text.lower()
        # Simple word matching (can be improved with word boundaries)
        for word in cls.PROFANITY_WORDS:
            if re.search(r'\b' + re.escape(word) + r'\b', text_lower):
                return True
        return False

    @classmethod
    def detect_prompt_injection(cls, text: str) -> bool:
        text_lower = text.lower()
        for pattern in cls.INJECTION_PATTERNS:
            if re.search(pattern, text_lower):
                return True
        return False

    @classmethod
    def detect_pii(cls, text: str) -> bool:
        for name, pattern in cls.PII_PATTERNS.items():
            if re.search(pattern, text):
                return True
        return False

    @classmethod
    def evaluate_prompt(cls, text: str) -> Tuple[bool, Optional[str]]:
        """
        Evaluate the prompt for violations.
        Returns (is_violation: bool, violation_reason: str)
        """
        if not text:
            return False, None

        if cls.detect_profanity(text):
            return True, "PROFANITY_DETECTED"
        
        if cls.detect_prompt_injection(text):
            return True, "PROMPT_INJECTION_ATTEMPT"
            
        if cls.detect_pii(text):
            return True, "PII_DETECTED"
            
        return False, None

    @staticmethod
    async def log_security_event(
        db: AsyncSession,
        user_id: Optional[int],
        event_type: str,
        violation_reason: str,
        prompt_snippet: str
    ):
        """Log the security event to the database"""
        # Truncate prompt to 500 chars to save space
        snippet = prompt_snippet[:500] if prompt_snippet else None
        log_entry = SecurityLog(
            user_id=user_id,
            event_type=event_type,
            violation_reason=violation_reason,
            prompt_snippet=snippet
        )
        db.add(log_entry)
        await db.commit()

