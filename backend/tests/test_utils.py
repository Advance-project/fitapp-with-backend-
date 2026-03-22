"""
Unit tests for utility functions like password hashing and token generation.
"""
import pytest
from app.auth_utils import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_refresh_token,
    decode_access_token,
)


class TestPasswordHashing:
    """Tests for password hashing and verification."""
    
    def test_hash_password_creates_hash(self):
        """Test that hash_password creates a valid hash."""
        password = "MySecurePassword123!"
        hashed = hash_password(password)
        assert hashed != password
        assert len(hashed) > 20

    def test_verify_password_success(self):
        """Test verify_password returns True for correct password."""
        password = "MySecurePassword123!"
        hashed = hash_password(password)
        assert verify_password(password, hashed) is True

    def test_verify_password_failure(self):
        """Test verify_password returns False for incorrect password."""
        password = "MySecurePassword123!"
        wrong_password = "WrongPassword123!"
        hashed = hash_password(password)
        assert verify_password(wrong_password, hashed) is False

    def test_different_passwords_different_hashes(self):
        """Test that different passwords produce different hashes."""
        password1 = "Password123!"
        password2 = "Password456!"
        hash1 = hash_password(password1)
        hash2 = hash_password(password2)
        assert hash1 != hash2

    def test_salt_randomness(self):
        """Test that same password creates different hashes (due to salt)."""
        password = "SamePassword123!"
        hash1 = hash_password(password)
        hash2 = hash_password(password)
        # With salt, hashes should be different even for same password
        assert hash1 != hash2
        # But both should verify
        assert verify_password(password, hash1) is True
        assert verify_password(password, hash2) is True


class TestTokenGeneration:
    """Tests for JWT token creation and decoding."""
    
    def test_create_access_token(self):
        """Test access token creation."""
        user_data = {"user_id": "test_user_123"}
        token = create_access_token(user_data)
        assert token is not None
        assert isinstance(token, str)
        assert token.count('.') == 2  # JWT has 3 parts

    def test_create_refresh_token(self):
        """Test refresh token creation."""
        user_data = {"user_id": "test_user_123"}
        token = create_refresh_token(user_data)
        assert token is not None
        assert isinstance(token, str)
        assert token.count('.') == 2  # JWT has 3 parts

    def test_decode_refresh_token_success(self):
        """Test successful refresh token decoding."""
        user_data = {"user_id": "test_user_123"}
        token = create_refresh_token(user_data)
        decoded = decode_refresh_token(token)
        assert decoded is not None
        assert decoded["user_id"] == "test_user_123"
        assert decoded["type"] == "refresh"

    def test_decode_access_token_success(self):
        """Test successful access token decoding."""
        user_data = {"user_id": "test_user_123"}
        token = create_access_token(user_data)
        decoded = decode_access_token(token)
        assert decoded is not None
        assert decoded["user_id"] == "test_user_123"
        assert decoded["type"] == "access"

    def test_decode_invalid_token(self):
        """Test decoding invalid token returns None."""
        result = decode_refresh_token("invalid.token.here")
        assert result is None

    def test_decode_wrong_token_type(self):
        """Test decoding token with wrong type returns None."""
        user_data = {"user_id": "test_user_123"}
        # Create an access token
        token = create_access_token(user_data)
        # Try to decode as refresh token
        result = decode_refresh_token(token)
        assert result is None

    def test_token_expiration_field(self):
        """Test that tokens contain expiration."""
        user_data = {"user_id": "test_user_123"}
        token = create_access_token(user_data)
        decoded = decode_access_token(token)
        assert "exp" in decoded
        assert decoded["exp"] > 0

    def test_token_type_field(self):
        """Test that tokens contain correct type."""
        user_data = {"user_id": "test_user_123"}
        
        access_token = create_access_token(user_data)
        access_decoded = decode_access_token(access_token)
        assert access_decoded["type"] == "access"
        
        refresh_token = create_refresh_token(user_data)
        refresh_decoded = decode_refresh_token(refresh_token)
        assert refresh_decoded["type"] == "refresh"
