# Running Unit Tests

## Setup

1. Install pytest (if not already installed):
```bash
pip install pytest httpx
```

## Run All Tests
```bash
pytest
```

## Run Specific Test File
```bash
pytest tests/test_auth.py
pytest tests/test_utils.py
```

## Run Specific Test Class
```bash
pytest tests/test_auth.py::TestSignup
pytest tests/test_auth.py::TestLogin
```

## Run Specific Test
```bash
pytest tests/test_auth.py::TestSignup::test_signup_success
```

## Run with Coverage
```bash
pip install pytest-cov
pytest --cov=app tests/
```

## Run with Verbose Output
```bash
pytest -v
```

## Test Structure

- **test_auth.py**: Tests for authentication endpoints (signup, login, token refresh)
- **test_utils.py**: Tests for utility functions (password hashing, token generation)
- **conftest.py**: Shared fixtures and test setup

## Test Classes

### Authentication Tests
- `TestSignup`: User registration tests
- `TestLogin`: Login and credential validation tests
- `TestTokenRefresh`: JWT token refresh tests
- `TestProtectedRoutes`: Protected endpoint access tests

### Utility Tests
- `TestPasswordHashing`: Password hashing and verification tests
- `TestTokenGeneration`: JWT token creation and decoding tests
- `TestPasswordValidation`: Password strength validation tests

