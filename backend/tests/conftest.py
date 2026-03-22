"""
Pytest configuration and shared fixtures for testing.
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app


@pytest.fixture
def client():
    """Create a test client for the FastAPI app."""
    return TestClient(app)


@pytest.fixture
def sample_user():
    """Sample user data for testing."""
    return {
        "email": "testuser@example.com",
        "username": "testuser",
        "password": "TestPassword123!"
    }


@pytest.fixture
def sample_admin():
    """Sample admin data for testing."""
    return {
        "email": "admin@example.com",
        "username": "admin",
        "password": "AdminPassword123!"
    }
