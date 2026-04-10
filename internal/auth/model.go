package auth

import (
	"database/sql"
	"time"
)

type UserRecord struct {
	ID            string
	Email         string
	Name          string
	PasswordHash  string
	EmailVerified bool
	LastLoginAt   sql.NullTime
}

type RefreshTokenRecord struct {
	ID        string
	SessionID string
	JTI       string
	UserID    string
	OrgID     *string
	IsRevoked bool
	ExpiresAt time.Time
}
