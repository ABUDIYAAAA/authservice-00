package auth

import "time"

type ErrorResponse struct {
	Error string `json:"error" example:"invalid credentials"`
}

type LoginRequest struct {
	Email     string  `json:"email" binding:"required,email" example:"admin@example.com"`
	Password  string  `json:"password" binding:"required,min=8" example:"StrongPassword123!"`
	OrgID     *string `json:"org_id,omitempty" example:"f47ac10b-58cc-4372-a567-0e02b2c3d479"`
	ServiceID *string `json:"service_id,omitempty" example:"f47ac10b-58cc-4372-a567-0e02b2c3d470"`
}

type RefreshRequest struct {
	RefreshToken string `json:"refresh_token" binding:"required"`
}

type LogoutRequest struct {
	ServiceID *string `json:"service_id,omitempty"`
}

type AuthUser struct {
	ID            string    `json:"id"`
	Email         string    `json:"email"`
	Name          string    `json:"name"`
	EmailVerified bool      `json:"email_verified"`
	LastLoginAt   time.Time `json:"last_login_at"`
}

type TokenResponse struct {
	TokenType    string    `json:"token_type" example:"Bearer"`
	AccessToken  string    `json:"access_token"`
	RefreshToken string    `json:"refresh_token"`
	ExpiresAt    time.Time `json:"expires_at"`
	User         AuthUser  `json:"user"`
}

type MeResponse struct {
	UserID    string  `json:"user_id"`
	Email     string  `json:"email"`
	Name      string  `json:"name"`
	SessionID string  `json:"session_id"`
	OrgID     *string `json:"org_id,omitempty"`
}
