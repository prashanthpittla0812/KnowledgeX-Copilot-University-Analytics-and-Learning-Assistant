from app.utils.domain import is_trusted_domain

def test_is_trusted_domain():
    assert is_trusted_domain("user@ifheindia.org") == True
    assert is_trusted_domain("admin@motivitylabs.com") == True
    assert is_trusted_domain("student@IFHEINDIA.ORG") == True
    assert is_trusted_domain("student@MOTIVITYLABS.COM") == True
    assert is_trusted_domain("someone@gmail.com") == False
    assert is_trusted_domain("user@yahoo.com") == False
    assert is_trusted_domain("invalid-email") == False
