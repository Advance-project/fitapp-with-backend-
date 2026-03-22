"""
Unit tests for authentication endpoints.
Tests signup, login, token refresh, and user operations.
Uses mocking for database-dependent tests.
"""
import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from fastapi import status


class TestSignup:
    """Tests for user signup functionality."""
    
    @patch('app.database.get_user_by_email')
    @patch('app.database.create_user')
    def test_signup_success(self, mock_create_user, mock_get_user, client, sample_user):
        """Test successful user registration."""
        mock_get_user.return_value = None  # Email doesn't exist
        mock_create_user.return_value = {
            "id": "user123",
            "email": sample_user["email"],
            "username": sample_user["username"],
            "role": "user"
        }
        
        response = client.post(
            "/auth/signup",
            json={
                "email": sample_user["email"],
                "username": sample_user["username"],
                "password": sample_user["password"]
            }
        )
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"

    @patch('app.database.get_user_by_email')
    def test_signup_duplicate_email(self, mock_get_user, client, sample_user):
        """Test signup fails with duplicate email."""
        mock_get_user.return_value = {
            "id": "user123",
            "email": sample_user["email"],
            "username": "existinguser",
            "role": "user"
        }
        
        response = client.post(
            "/auth/signup",
            json={
                "email": sample_user["email"],
                "username": "differentuser",
                "password": sample_user["password"]
            }
        )
        assert response.status_code == status.HTTP_409_CONFLICT

    def test_signup_invalid_email(self, client):
        """Test signup fails with invalid email format."""
        response = client.post(
            "/auth/signup",
            json={
                "email": "notanemail",
                "username": "testuser",
                "password": "TestPassword123!"
            }
        )
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_signup_weak_password(self, client):
        """Test signup fails with weak password."""
        response = client.post(
            "/auth/signup",
            json={
                "email": "test@example.com",
                "username": "testuser",
                "password": "123"  # Too short/weak
            }
        )
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


class TestLogin:
    """Tests for user login functionality."""
    
    @patch('app.database.get_user_by_email')
    def test_login_success(self, mock_get_user, client, sample_user):
        """Test successful login."""
        from app.auth_utils import hash_password
        
        mock_get_user.return_value = {
            "id": "user123",
            "email": sample_user["email"],
            "username": sample_user["username"],
            "password_hash": hash_password(sample_user["password"]),
            "role": "user"
        }
        
        response = client.post(
            "/auth/login",
            json={
                "email": sample_user["email"],
                "password": sample_user["password"]
            }
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    @patch('app.database.get_user_by_email')
    def test_login_wrong_password(self, mock_get_user, client, sample_user):
        """Test login fails with wrong password."""
        from app.auth_utils import hash_password
        
        mock_get_user.return_value = {
            "id": "user123",
            "email": sample_user["email"],
            "username": sample_user["username"],
            "password_hash": hash_password(sample_user["password"]),
            "role": "user"
        }
        
        response = client.post(
            "/auth/login",
            json={
                "email": sample_user["email"],
                "password": "WrongPassword123!"
            }
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    @patch('app.database.get_user_by_email')
    def test_login_nonexistent_user(self, mock_get_user, client):
        """Test login fails for non-existent user."""
        mock_get_user.return_value = None
        
        response = client.post(
            "/auth/login",
            json={
                "email": "nonexistent@example.com",
                "password": "AnyPassword123!"
            }
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestTokenRefresh:
    """Tests for token refresh functionality."""
    
    @patch('app.database.get_user_by_id')
    @patch('app.database.get_user_by_email')
    @patch('app.database.create_user')
    def test_refresh_token_success(self, mock_create_user, mock_get_user, mock_get_user_by_id, client, sample_user):
        """Test successful token refresh."""
        mock_get_user.return_value = None
        mock_create_user.return_value = {
            "id": "user123",
            "email": sample_user["email"],
            "username": sample_user["username"],
            "role": "user"
        }
        mock_get_user_by_id.return_value = mock_create_user.return_value
        
        # Signup to get token
        signup_response = client.post(
            "/auth/signup",
            json={
                "email": sample_user["email"],
                "username": sample_user["username"],
                "password": sample_user["password"]
            }
        )
        refresh_token = signup_response.json()["refresh_token"]
        
        # Refresh
        response = client.post(
            "/auth/refresh",
            json={"refresh_token": refresh_token}
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "access_token" in data

    def test_refresh_invalid_token(self, client):
        """Test refresh fails with invalid token."""
        response = client.post(
            "/auth/refresh",
            json={"refresh_token": "invalid.token.here"}
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestProtectedRoutes:
    """Tests for protected endpoints requiring authentication."""
    
    @patch('app.database.get_user_by_id')
    @patch('app.database.get_user_by_email')
    @patch('app.database.create_user')
    def test_get_current_user_success(self, mock_create_user, mock_get_user, mock_get_user_by_id, client, sample_user):
        """Test getting current user info with valid token."""
        user_data = {
            "id": "user123",
            "email": sample_user["email"],
            "username": sample_user["username"],
            "role": "user"
        }
        mock_get_user.return_value = None
        mock_create_user.return_value = user_data
        mock_get_user_by_id.return_value = user_data
        
        # Signup
        signup_response = client.post(
            "/auth/signup",
            json={
                "email": sample_user["email"],
                "username": sample_user["username"],
                "password": sample_user["password"]
            }
        )
        access_token = signup_response.json()["access_token"]
        
        # Get current user
        response = client.get(
            "/auth/me",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["email"] == sample_user["email"]

    def test_protected_route_no_token(self, client):
        """Test protected route fails without token."""
        response = client.get("/auth/me")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_protected_route_invalid_token(self, client):
        """Test protected route fails with invalid token."""
        response = client.get(
            "/auth/me",
            headers={"Authorization": "Bearer invalid.token.here"}
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
