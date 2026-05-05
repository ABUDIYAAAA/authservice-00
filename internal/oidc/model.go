package oidc

import (
	"time"

	"github.com/google/uuid"
)

type AuthorizationCode struct {
	ID                  uuid.UUID
	CodeHash            string
	ClientPK            uuid.UUID
	UserID              uuid.UUID
	SessionID           uuid.UUID
	RedirectURI         string
	Scope               string
	State               *string
	Nonce               *string
	CodeChallenge       *string
	CodeChallengeMethod *string
	ExpiresAt           time.Time
	ConsumedAt          *time.Time
	CreatedAt           time.Time
}

type OIDCToken struct {
	ID               uuid.UUID
	ClientPK         uuid.UUID
	UserID           uuid.UUID
	SessionID        uuid.UUID
	AccessTokenHash  string
	RefreshTokenHash *string
	Scope            string
	AccessExpiresAt  time.Time
	RefreshExpiresAt *time.Time
	RevokedAt        *time.Time
	CreatedAt        time.Time
}
