package users

import (
	"time"

	"github.com/google/uuid"
)

type User struct {
	ID              uuid.UUID  `json:"id"`
	Email           string     `json:"email"`
	EmailVerified   bool       `json:"email_verified"`
	PasswordHash    *string    `json:"-"`
	PasswordEnabled bool       `json:"password_enabled"`
	Name            *string    `json:"name,omitempty"`
	AvatarURL       *string    `json:"avatar_url,omitempty"`
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`
	LastLoginAt     *time.Time `json:"last_login_at,omitempty"`
}

type CreateUserParams struct {
	Email           string
	PasswordHash    *string
	PasswordEnabled bool
	Name            *string
	AvatarURL       *string
	EmailVerified   bool
}
