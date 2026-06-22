import time
from functools import wraps

_CACHE = {}

def simple_cache(ttl_seconds: int = 60, key_prefix: str = "cache"):
    """
    A simple in-memory caching decorator for FastAPI endpoints.
    Uses key_prefix and current_user.id (if present in kwargs) for the cache key.
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            user_id = "global"
            if "current_user" in kwargs:
                user_id = str(kwargs["current_user"].id)
            
            key = f"{key_prefix}:{user_id}"
            
            # Additional generic kwargs handling for query params
            for k, v in kwargs.items():
                if k not in ["db", "current_user", "request"]:
                    key += f":{k}={v}"
            
            if key in _CACHE:
                cached_time, data = _CACHE[key]
                if time.time() - cached_time < ttl_seconds:
                    return data
                    
            data = await func(*args, **kwargs)
            _CACHE[key] = (time.time(), data)
            return data
        return wrapper
    return decorator
