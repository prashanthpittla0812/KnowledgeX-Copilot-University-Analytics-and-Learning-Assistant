TRUSTED_DOMAINS = [
    "ifheindia.org",
    "motivitylabs.com"
]

def is_trusted_domain(email: str) -> bool:
    try:
        domain = email.split("@")[1].lower()
        return domain in TRUSTED_DOMAINS
    except IndexError:
        return False
